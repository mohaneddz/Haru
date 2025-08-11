import torch
from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor
from kokoro import KPipeline
from llm_utils import strip_markdown_and_emojis 
import base64
import pyaudio
import soundfile as sf
import tempfile
import time
import numpy as np
import requests
import json
import threading
import os
import wave

class VoiceAssistant:
    def __init__(self,
                 server_url="http://localhost:5000/voice",
                 model_id="openai/whisper-large-v3-turbo",
                 voice_path="D:/Programming/Projects/Tauri/haru/src-tauri/voices/af_alloy.pt"):

        self.server_url = server_url
        self.history = []

        # Audio I/O Configuration
        self.RATE = 16000
        self.CHUNK = int(self.RATE * 0.1)  # 100ms
        self.FORMAT = pyaudio.paInt16
        self.CHANNELS = 1
        
        # VAD Configuration
        self.SILENCE_THRESHOLD = 0.003
        self.SILENCE_DURATION = 1
        self.MIN_RECORDING_LENGTH = 0.5
        
        # State
        self.recording_buffer = []
        self.last_voice_time = time.time()
        self.is_recording = False
        self.is_playing = False # Indicates if audio output is currently active
        self.is_thinking = False # Indicates if STT/LLM/TTS processing is active
        self.is_running = False  # Main loop control
        self.transcription = ""
        self.response = ""

        # Models and processor
        self.model_id = model_id
        self.voice_path = voice_path
        self.device = "cuda:0" if torch.cuda.is_available() else "cpu"
        self.torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32
        self.stt_model = None
        self.stt_processor = None
        self.tts_pipeline = None
        self.voice_tensor = None

        # self.load_models() 

        # Audio I/O
        self.p = None
        self.stream = None

    # --- Model loading ---
    def load_stt_model(self):
        if self.stt_model is None or self.stt_processor is None:
            print("Loading STT model (Whisper)...")
            try:
                self.stt_model = AutoModelForSpeechSeq2Seq.from_pretrained(
                    self.model_id, torch_dtype=self.torch_dtype
                ).to(self.device)
                self.stt_processor = AutoProcessor.from_pretrained(self.model_id)
                print("✅ STT model loaded.")
            except Exception as e:
                print(f"❌ Failed to load STT model: {e}")
                self.stt_model = None
                self.stt_processor = None

    def load_tts_model(self):
        if self.tts_pipeline is None or self.voice_tensor is None:
            print("Loading TTS model (Kokoro)...")
            try:
                self.tts_pipeline = KPipeline(lang_code='a')
                self.voice_tensor = torch.load(self.voice_path, weights_only=True)
                print("✅ TTS model loaded.")
            except Exception as e:
                print(f"❌ Failed to load TTS model: {e}")
                self.tts_pipeline = None
                self.voice_tensor = None

    def load_models(self):
        if self.stt_model is None:
            self.load_stt_model()
        if self.tts_pipeline is None:
            self.load_tts_model()

    # --- Audio processing ---
    def transcribe_audio(self, audio_data):
        """Transcribes raw audio bytes using the local Whisper model."""
        if not self.stt_model:
            print("❌ STT model not available.")
            return ""
        try:
            print("🎤 Transcribing...")
            audio_array = np.frombuffer(audio_data, dtype=np.int16).astype(np.float32) / 32768.0
            
            inputs = self.stt_processor(
                audio_array, sampling_rate=self.RATE, return_tensors="pt"
            )
            inputs = inputs.to(self.stt_model.device, dtype=torch.float16 if torch.cuda.is_available() else torch.float32)

            with torch.no_grad():
                predicted_ids = self.stt_model.generate(inputs.input_features, max_new_tokens=128)

            self.transcription = self.stt_processor.batch_decode(predicted_ids, skip_special_tokens=True)[0].strip()
            print(f"🗣️ You: {self.transcription}")
            return self.transcription
        except Exception as e:
            print(f"❌ Transcription error: {e}")
            return ""

    def synthesize_speech(self, text):
        """Synthesizes speech from text using the local Kokoro model."""
        if not self.tts_pipeline:
            print("❌ TTS model not available.")
            return None
        try:
            print("🔊 Synthesizing audio...")
            generator = self.tts_pipeline(text, voice=self.voice_tensor, speed=1.0)
            
            audio_segments = [audio for _, _, audio in generator]
            if not audio_segments:
                return None
                
            full_audio = np.concatenate(audio_segments)
            
            buffer = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
            sf.write(buffer.name, full_audio, 24000)
            buffer.close()
            return buffer.name
        except Exception as e:
            print(f"❌ TTS error: {e}")
            return None

    # --- Audio playback in a separate thread ---
    def play_audio_response(self, wav_path):
        try:
            self.is_playing = True
            with wave.open(wav_path, 'rb') as wf:
                # Reinitialize PyAudio for each playback if it's terminated by previous playback
                # Or make self.p persistent and manage stream open/close
                p_local = pyaudio.PyAudio() # Use a local PyAudio instance for this thread
                stream = p_local.open(format=p_local.get_format_from_width(wf.getsampwidth()),
                                     channels=wf.getnchannels(),
                                     rate=wf.getframerate(),
                                     output=True)
                data = wf.readframes(self.CHUNK)
                while data and self.is_running: # Continue playing as long as app is running
                    stream.write(data)
                    data = wf.readframes(self.CHUNK)
                stream.stop_stream()
                stream.close()
                p_local.terminate() # Terminate local PyAudio instance
            os.unlink(wav_path) # Clean up temporary file
        except Exception as e:
            print(f"Audio playback error: {e}")
        finally:
            self.is_playing = False # Reset playing flag when done or error

    # --- VAD and audio callback ---
    def audio_callback(self, in_data, frame_count, time_info, status):
        # Prevent recording if playing audio or processing an interaction
        if self.is_playing or self.is_thinking:
            return (None, pyaudio.paContinue)

        audio_array = np.frombuffer(in_data, dtype=np.int16).astype(np.float32) / 32768.0
        rms = np.sqrt(np.mean(audio_array**2))
        current_time = time.time()

        if rms > self.SILENCE_THRESHOLD:
            if not self.is_recording:
                print("🔴 Recording started...")
                self.is_recording = True
                self.recording_buffer = []
            self.last_voice_time = current_time
            self.recording_buffer.append(in_data)
        elif self.is_recording:
            self.recording_buffer.append(in_data)
            if current_time - self.last_voice_time >= self.SILENCE_DURATION:
                self.is_recording = False
                total_duration = len(self.recording_buffer) * self.CHUNK / self.RATE
                if total_duration >= self.MIN_RECORDING_LENGTH:
                    audio_data = b''.join(self.recording_buffer)
                    # Process interaction in a new thread
                    threading.Thread(target=self.process_interaction, args=(audio_data,)).start()
                else:
                    print("⚠️ Recording too short, skipped. Listening...")
                self.recording_buffer = []

        return (None, pyaudio.paContinue)

    def process_interaction(self, source_data, is_text=False):
        """
        Handles the full interaction: STT -> LLM -> TTS.
        Runs in its own thread to avoid blocking the audio callback.
        """
        self.is_thinking = True # Set to true as soon as processing starts
        
        user_message = ""
        if is_text:
            user_message = source_data
            print(f"🗣️ You: {user_message}")
        else:
            user_message = self.transcribe_audio(source_data) # This can be CPU/GPU heavy
        
        if not user_message:
            print("🎤 Listening...")
            self.is_thinking = False # Reset if no message to process (e.g., failed transcription)
            return
            
        self.history.append({"role": "user", "content": user_message})

        llm_response_full = ""
        audio_file_path = None 

        try:
            print("🤖 Assistant: ", end="", flush=True)
            print('sending payload')
            payload = {"message": user_message, "history": self.history[:-1]} # Send history *before* this turn
            
            # Network request (blocking, but within this dedicated thread)
            response = requests.post(self.server_url, json=payload, stream=True, timeout=60) # Added timeout
            
            print('response received', response)
            response.raise_for_status()

            for line in response.iter_lines():
                if line.startswith(b'data:'):
                    data_str = line.decode('utf-8')[5:]
                    if data_str:
                        chunk = json.loads(data_str)
                        token = chunk.get("content", "")
                        print(token, end="", flush=True)
                        llm_response_full += token
                elif line.startswith(b'event: end'):
                    break
            
            print() # Newline after the full response
            
            if llm_response_full:
                self.history.append({"role": "assistant", "content": llm_response_full})
                self.response = strip_markdown_and_emojis(llm_response_full)
                
                # Keep history manageable
                if len(self.history) > 10:
                    self.history = self.history[-10:]

                # Synthesize speech (blocking, but within this dedicated thread)
                audio_file_path = self.synthesize_speech(llm_response_full)
            
        except requests.exceptions.ConnectionError:
             print("\n❌ CONNECTION ERROR: Could not connect to the LLM server. Is system.py running?")
        except requests.exceptions.Timeout:
             print("\n❌ REQUEST TIMEOUT: The LLM server did not respond in time.")
        except Exception as e:
            print(f"\n❌ An error occurred during LLM interaction or synthesis: {e}")
        finally:
            # Reset is_thinking immediately after LLM interaction and synthesis
            # to allow immediate listening for new input.
            self.is_thinking = False
            print("🎤 Listening...")

        # If audio was synthesized, play it in a *separate* thread.
        # This ensures the `process_interaction` thread finishes quickly.
        if audio_file_path:
            threading.Thread(target=self.play_audio_response, args=(audio_file_path,)).start()
            
    # --- Cleanup ---
    def cleanup(self):
        print("🛑 Shutting down...")
        self.is_running = False # Signal threads to stop
        # Wait briefly for playing audio to finish if possible, but don't block indefinitely
        # time.sleep(0.5) 
        if self.stream and self.stream.is_active():
            self.stream.stop_stream()
        if self.stream:
            self.stream.close()
        # self.p is now local to play_audio_response, but if it was persistent:
        # if self.p:
        #     self.p.terminate()
        print("✅ Cleanup complete")

    # --- Run loop ---
    def run(self):
        print("\n🎤 Voice Assistant Ready!")
        print("   - Speak and pause to send a message.")
        print("   - Type a message and press Enter to send text.")
        print("   - Type 'quit' to exit.\n")
        print("🎤 Listening...")

        # Ensure models are loaded before starting audio stream
        # This might still block the initial call to run(), but it's a one-time setup.
        if not self.stt_model or not self.tts_pipeline:
            print("🔄 Loading models...")
            self.load_models() 

        # PyAudio setup
        self.p = pyaudio.PyAudio() # Main PyAudio instance for input stream
        self.stream = self.p.open(
            format=self.FORMAT,
            channels=self.CHANNELS,
            rate=self.RATE,
            input=True,
            frames_per_buffer=self.CHUNK,
            stream_callback=self.audio_callback
        )
        self.stream.start_stream()

        self.is_running = True
        try:
            while self.is_running:
                user_input = input() # This is a blocking call for text input
                if user_input.lower() == 'quit':
                    break
                if user_input:
                    if not self.is_thinking: # Only process text input if not already thinking
                        threading.Thread(target=self.process_interaction, args=(user_input, True)).start()
                    else:
                        print("⚠️ Please wait for the current response to finish processing.")
        except KeyboardInterrupt:
            pass # Allow graceful exit on Ctrl+C
        finally:
            self.cleanup()