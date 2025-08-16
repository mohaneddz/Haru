# backend/utils/stt_utils.py
import torch
import numpy as np
import webrtcvad
import sounddevice as sd
import threading
import queue
import logging
from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor
import soundfile as sf

import warnings
warnings.filterwarnings("ignore", message="dropout option adds dropout after all but last recurrent layer")
warnings.filterwarnings("ignore", message="torch.nn.utils.weight_norm")

from config.constants import STT_SAMPLE_RATE, VAD_AGGRESSIVENESS, STT_MODEL_ID, END_OF_SPEECH_SILENCE_MS

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
                return_attention_mask=True
            )
            inputs = inputs.to(self.device, dtype=self.torch_dtype)

            # --- FIX: Explicitly generate and pass decoder_input_ids ---
            # This ensures the model is always prompted for English transcription.
            decoder_input_ids = torch.tensor([[1, 1]]) * self.model.config.decoder_start_token_id
            decoder_input_ids = decoder_input_ids.to(self.device)
            
            with torch.no_grad():
                predicted_ids = self.model.generate(
                    input_features=inputs.input_features,
                    attention_mask=inputs.attention_mask,
                    decoder_input_ids=decoder_input_ids,
                    max_new_tokens=128
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
            self.stream_thread.join(timeout=1.0)
        logging.info("Listener stopped.")

    def wait_for_transcript(self, timeout: float = 10.0) -> bool:
        """Waits for the transcription to be ready."""
        logging.info("Waiting for transcript...")
        return self.transcription_ready.wait(timeout)

    def get_full_transcript(self) -> str:
        """Safely gets the current full transcription text."""
        with self._lock:
            return self.transcription

    def process_long_audio(self, buffer: bytes, chunk_seconds: int = 30) -> str:
        """
        Processes long audio in chunks, transcribes each, and returns combined transcript.
        Each chunk result is on a new line. Sample rate defaults to Windows 44.1 kHz.
        """
        audio_float32 = np.frombuffer(buffer, dtype=np.int16).astype(np.float32) / 32768.0
        samples_per_chunk = STT_SAMPLE_RATE * chunk_seconds
        total_samples = len(audio_float32)

        full_transcript = []

        # --- Prepare processor for English transcription ---
        # Using task="transcribe" and language="en" instead of forced_decoder_ids
        processor_args = {"language": "en", "task": "transcribe"}

        for i in range(0, total_samples, samples_per_chunk):
            chunk = audio_float32[i:i+samples_per_chunk]
            if len(chunk) == 0:
                continue

            inputs = self.processor(
                chunk,
                sampling_rate=STT_SAMPLE_RATE,
                return_tensors="pt",
                return_attention_mask=True
            ).to(self.device, dtype=self.torch_dtype)

            with torch.no_grad():
                # FIX: Reduced max_new_tokens to be within the model's 448 token limit
                predicted_ids = self.model.generate(
                    input_features=inputs.input_features,
                    attention_mask=inputs.attention_mask,
                    task="transcribe",
                    language="en",
                    max_new_tokens=440 # Reduced from 512 to prevent exceeding max length
                )

            text = self.processor.batch_decode(predicted_ids, skip_special_tokens=True)[0].strip()
            if text:
                full_transcript.append(text)

        return "\n".join(full_transcript)
    
    def transcribe_from_file(self, file_path: str) -> str:
        """
        Transcribes a single, correctly formatted (16kHz, mono) WAV file.
        This method assumes the file is short enough to be processed in one go.
        """
        if not self.is_ready():
            logging.error("STT model not ready for transcription.")
            return ""

        try:
            # Read the audio file into a float32 numpy array, as expected by the model
            audio_data, sampling_rate = sf.read(file_path, dtype="float32")

            if sampling_rate != STT_SAMPLE_RATE:
                logging.warning(f"File {file_path} has sample rate {sampling_rate}, expected {STT_SAMPLE_RATE}. Mismatches can affect quality.")

            # Process the audio file
            inputs = self.processor(
                audio_data,
                sampling_rate=STT_SAMPLE_RATE,
                return_tensors="pt"
            ).to(self.device, dtype=self.torch_dtype)

            # Generate the token IDs
            with torch.no_grad():
                # Set max_new_tokens to a safe value below the model's 448 limit
                predicted_ids = self.model.generate(
                    inputs["input_features"],
                    task="transcribe",
                    language="en",
                    max_new_tokens=440
                )

            # Decode the token IDs to text
            transcript = self.processor.batch_decode(predicted_ids, skip_special_tokens=True)[0].strip()
            return transcript

        except Exception as e:
            logging.error(f"❌ Error during file transcription for {file_path}: {e}")
            return ""
