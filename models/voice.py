# voice.py
import pyaudio
import numpy as np
import requests
import json
import base64
import pygame
import tempfile
import time
import threading
import os
import torch
import soundfile as sf
from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor
from kokoro import KPipeline
from flask import Flask, Response, stream_with_context


WAIT_URL = "http://localhost:7777/wait"
app = Flask(__name__)


@app.route('/wait', methods=['GET'])
def wait_for_ready():
    def generate():
        yield "data: ok\n\n"  # SSE format: "data: <message>\n\n"
    return Response(stream_with_context(generate()), content_type='text/event-stream')

class VoiceClient:
    MODEL_ID = "openai/whisper-large-v3-turbo"  # Use a class constant for model id

    def __init__(self, server_url="http://localhost:8088/chat"):
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
        self.is_playing = False
        self.is_thinking = False
        self.running = True
        
        # --- Model Loading ---
        self.stt_model, self.stt_processor = self._load_stt_model()
        self.tts_pipeline, self.voice_tensor = self._load_tts_model()

        requests.post(WAIT_URL, json={"status": "OK"})

        # --- Audio System Initialization ---
        self.p = pyaudio.PyAudio()
        pygame.mixer.init(frequency=24000, size=-16, channels=1, buffer=512)
        
        self.stream = self.p.open(
            format=self.FORMAT, channels=self.CHANNELS, rate=self.RATE,
            input=True, frames_per_buffer=self.CHUNK, stream_callback=self.audio_callback
        )
        self.stream.start_stream()

    def _load_stt_model(self):
        """Loads the Whisper STT model and processor without forcing redownload."""
        print("Loading STT model (Whisper)...")
        try:
            device = "cuda:0" if torch.cuda.is_available() else "cpu"
            torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32
            # Only download if not present, otherwise load from cache
            model = AutoModelForSpeechSeq2Seq.from_pretrained(
                self.MODEL_ID, torch_dtype=torch_dtype
            ).to(device)
            processor = AutoProcessor.from_pretrained(self.MODEL_ID)
            print("✅ STT model loaded successfully.")
            return model, processor
        except Exception as e:
            print(f"❌ Failed to load STT model: {e}")
            return None, None

    def _load_tts_model(self):
        """Loads the Kokoro TTS model and voice."""
        print("Loading TTS model (Kokoro)...")
        try:
            # Suppress repo_id warning by explicitly passing it
            pipeline = KPipeline(lang_code='a', repo_id='hexgrad/Kokoro-82M')
            
            # Adjust dropout configuration to avoid warning
            voice_tensor = torch.load("voices/af_nicole.pt", weights_only=True, map_location=torch.device('cuda'))
            
            # Update weight_norm usage to recommended method
            torch.nn.utils.parametrizations.weight_norm.apply(voice_tensor, name='weight', dim=0)
            
            print("✅ TTS model loaded successfully.")
            return pipeline, voice_tensor
        except Exception as e:
            print(f"❌ Failed to load TTS model: {e}")
            return None, None
            
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
            
            # The warning you saw is common. It's safe to ignore if transcription works.
            transcription = self.stt_processor.batch_decode(predicted_ids, skip_special_tokens=True)[0].strip()
            print(f"🗣️ You: {transcription}")
            return transcription
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

    def audio_callback(self, in_data, frame_count, time_info, status):
        """Audio input callback."""
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
                    threading.Thread(target=self.process_interaction, args=(audio_data,)).start()
                else:
                    print("⚠️ Recording too short, skipped. Listening...")
                self.recording_buffer = []

        return (None, pyaudio.paContinue)

    def process_interaction(self, source_data, is_text=False):
        """Handles the full interaction: STT -> LLM -> TTS."""
        self.is_thinking = True
        
        if is_text:
            user_message = source_data
            print(f"🗣️ You: {user_message}")
        else:
            user_message = self.transcribe_audio(source_data)
        
        if not user_message:
            print("🎤 Listening...")
            self.is_thinking = False
            return
            
        self.history.append({"role": "user", "content": user_message})

        try:
            print("🤖 Assistant: ", end="", flush=True)
            llm_response_full = ""
            
            payload = {"message": user_message, "history": self.history[:-1]} # Send history *before* this turn
            response = requests.post(self.server_url, json=payload, stream=True)
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
                
                # Keep history manageable
                if len(self.history) > 10:
                    self.history = self.history[-10:]

                audio_file_path = self.synthesize_speech(llm_response_full)
                if audio_file_path:
                    self.play_audio_response(audio_file_path)
            
        except requests.exceptions.ConnectionError:
             print("\n❌ CONNECTION ERROR: Could not connect to the LLM server. Is system.py running?")
        except Exception as e:
            print(f"\n❌ An error occurred during interaction: {e}")
        finally:
            self.is_thinking = False
            print("🎤 Listening...")
            
    def play_audio_response(self, file_path):
        """Plays audio from a file path and cleans up."""
        try:
            self.is_playing = True
            pygame.mixer.music.load(file_path)
            pygame.mixer.music.play()
            while pygame.mixer.music.get_busy() and self.running:
                time.sleep(0.1)
        except Exception as e:
            print(f"Audio playback error: {e}")
        finally:
            self.is_playing = False
            try:
                os.unlink(file_path)
            except Exception as e:
                print(f"Could not delete temp file {file_path}: {e}")

    def cleanup(self):
        print("🛑 Shutting down...")
        self.running = False
        if self.stream.is_active():
            self.stream.stop_stream()
        self.stream.close()
        self.p.terminate()
        pygame.mixer.quit()
        print("✅ Cleanup complete")

    def run(self):
        print("\n🎤 Voice Client Ready!")
        print("   - Speak and pause for 2 seconds to send a message.")
        print("   - Type a message and press Enter to send it as text.")
        print("   - Type 'quit' to exit.\n")
        print("🎤 Listening...")
        
        try:
            while self.running:
                user_input = input()
                if user_input.lower() == 'quit':
                    break
                if user_input:
                    # Don't process if another interaction is already happening
                    if not self.is_thinking:
                        threading.Thread(target=self.process_interaction, args=(user_input, True)).start()
                    else:
                        print("⚠️ Please wait for the current response to finish.")
        except KeyboardInterrupt:
            pass
        finally:
            self.cleanup()

if __name__ == "__main__":
    client = VoiceClient()
    client.run()