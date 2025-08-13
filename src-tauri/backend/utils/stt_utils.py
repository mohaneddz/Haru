import torch
import numpy as np
import webrtcvad
import sounddevice as sd
import threading
import queue
import logging
from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor
from constants import STT_MODEL_ID, VAD_AGGRESSIVENESS, STT_SAMPLE_RATE, END_OF_SPEECH_SILENCE_MS
import warnings

warnings.filterwarnings("ignore", message="dropout option adds dropout after all but last recurrent layer")
warnings.filterwarnings("ignore", message="torch.nn.utils.weight_norm")

class STT:
    def __init__(self):
        self.device = "cuda:0" if torch.cuda.is_available() else "cpu"
        self.torch_dtype = torch.float16 if self.device == "cuda:0" else torch.float32
        
        self.model = None
        self.processor = None
        self.vad = webrtcvad.Vad(VAD_AGGRESSIVENESS)
        
        self.listening = False
        self.stream_thread = None
        self._lock = threading.Lock()
        
        # State for transcription and synchronization
        self.transcription = ""
        self.transcription_ready = threading.Event()
        
        self.load_model()

    def load_model(self):
        """Loads the STT model from Hugging Face."""
        if self.model is not None:
            return
        logging.info(f"Loading STT model '{STT_MODEL_ID}'...")
        try:
            self.model = AutoModelForSpeechSeq2Seq.from_pretrained(
                STT_MODEL_ID,
                torch_dtype=self.torch_dtype,
                low_cpu_mem_usage=True,
                use_safetensors=True
            ).to(self.device)
            self.processor = AutoProcessor.from_pretrained(STT_MODEL_ID)

            # ✅ No forced_decoder_ids, set in config instead
            self.model.generation_config.language = "en"
            self.model.generation_config.task = "transcribe"

            logging.info("✅ STT model loaded successfully.")
        except Exception as e:
            logging.error(f"❌ Failed to load STT model: {e}")
            self.model = None

    def is_ready(self) -> bool:
        """Check if the STT model is loaded and ready."""
        return self.model is not None and self.processor is not None

    def _is_speech(self, pcm_chunk: bytes) -> bool:
        """Checks if a 30ms PCM chunk contains speech."""
        if len(pcm_chunk) != 960:
            return False
        try:
            return self.vad.is_speech(pcm_chunk, STT_SAMPLE_RATE)
        except Exception as e:
            logging.error(f"VAD error: {e}")
            return False

    def _stream_generator(self):
        """A generator that yields audio chunks from the microphone."""
        q: queue.Queue[bytes] = queue.Queue(maxsize=20)
        block_duration_ms = 30
        block_size = int(STT_SAMPLE_RATE * (block_duration_ms / 1000.0))

        def callback(indata, frames, time, status):
            if status:
                logging.warning(f"🎙️ InputStream status: {status}")
            try:
                q.put_nowait(bytes(indata))
            except queue.Full:
                pass

        stream = sd.InputStream(
            samplerate=STT_SAMPLE_RATE,
            channels=1,
            dtype="int16",
            callback=callback,
            blocksize=block_size,
        )
        with stream:
            while self.listening:
                try:
                    yield q.get(timeout=0.1)
                except queue.Empty:
                    continue

    def _processing_loop(self):
        """The main loop that processes audio, detects speech, and transcribes."""
        if not self.is_ready():
            logging.error("STT model not ready. Aborting listening.")
            return

        utterance_buffer = bytearray()
        pre_buffer_duration_ms = 510
        pre_buffer_max_size = int(STT_SAMPLE_RATE * 2 * (pre_buffer_duration_ms / 1000))
        pre_buffer = bytearray()
        speech_started = False
        silent_for_ms = 0
        min_utterance_duration_ms = 400
        min_utterance_size = int(STT_SAMPLE_RATE * 2 * (min_utterance_duration_ms / 1000))
        
        for pcm_bytes in self._stream_generator():
            if not self.listening:
                break
            
            is_speech = self._is_speech(pcm_bytes)

            if is_speech and not speech_started:
                logging.info("Speech detected, capturing...")
                speech_started = True
                utterance_buffer.extend(pre_buffer)
                utterance_buffer.extend(pcm_bytes)
                silent_for_ms = 0
            elif is_speech and speech_started:
                utterance_buffer.extend(pcm_bytes)
                silent_for_ms = 0
            elif not is_speech and speech_started:
                silent_for_ms += len(pcm_bytes) * 1000 / (STT_SAMPLE_RATE * 2)
                if silent_for_ms > END_OF_SPEECH_SILENCE_MS:
                    logging.info(f"Detected end of speech after {silent_for_ms:.0f}ms of silence.")
                    break
            elif not is_speech and not speech_started:
                pre_buffer.extend(pcm_bytes)
                if len(pre_buffer) > pre_buffer_max_size:
                    pre_buffer = pre_buffer[-pre_buffer_max_size:]

        if len(utterance_buffer) > min_utterance_size:
            logging.info(f"Transcribing utterance of {len(utterance_buffer) / (STT_SAMPLE_RATE * 2):.2f}s.")
            self._transcribe_buffer(bytes(utterance_buffer))
        else:
            logging.info("No speech detected or utterance too short.")

        # --- CRITICAL CHANGE ---
        # Signal that transcription is complete (or that we're done trying).
        self.transcription_ready.set()
        
        with self._lock:
            self.listening = False
        logging.info("Audio processing loop finished.")

    def _transcribe_buffer(self, buffer: bytes):
        """Runs inference and updates the transcription."""
        try:
            audio_float32 = np.frombuffer(buffer, dtype=np.int16).astype(np.float32) / 32768.0
            inputs = self.processor(
            audio_float32,
            sampling_rate=STT_SAMPLE_RATE,
            return_tensors="pt",
            return_attention_mask=True  # ✅ Fix attention mask warning
            )
            inputs = inputs.to(self.device, dtype=self.torch_dtype)

            with torch.no_grad():
                predicted_ids = self.model.generate(
                    input_features=inputs.input_features,
                    attention_mask=inputs.attention_mask,  # ✅ Pass mask
                    max_new_tokens=128,
                    generation_config=self.model.generation_config
                )
            
            new_text = self.processor.batch_decode(predicted_ids, skip_special_tokens=True)[0].strip()

            if new_text:
                logging.info(f"Transcription: '{new_text}'")
                with self._lock:
                    self.transcription = new_text
        except Exception as e:
            logging.error(f"❌ Error during transcription: {e}")

    def start_listen(self):
        """Starts the listening thread."""
        if self.listening:
            logging.warning("⚠️ Already listening.")
            return

        with self._lock:
            self.transcription = ""
            self.listening = True
        
        # --- CRITICAL CHANGE ---
        # Clear the event flag for this new listening session.
        self.transcription_ready.clear()
        
        self.stream_thread = threading.Thread(target=self._processing_loop, daemon=True)
        self.stream_thread.start()
        logging.info("🎤 Listening started...")

    def stop_listen(self):
        """Stops the listening thread forcefully."""
        if not self.listening:
            return
            
        logging.info("🛑 Force stopping listener...")
        with self._lock:
            self.listening = False
            
        if self.stream_thread and self.stream_thread.is_alive():
            # Wait for the thread to finish, which it will do quickly
            # now that self.listening is False.
            self.stream_thread.join(timeout=1.0) 
        logging.info("Listener stopped.")

    # --- NEW METHOD ---
    def wait_for_transcript(self, timeout: float = 10.0) -> bool:
        """
        Waits for the transcription to be ready.
        Returns True if the transcript is ready, False if it times out.
        """
        logging.info("Waiting for transcript...")
        return self.transcription_ready.wait(timeout)

    def get_full_transcript(self) -> str:
        """Safely gets the current full transcription text."""
        with self._lock:
            return self.transcription