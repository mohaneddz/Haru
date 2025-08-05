# voice_ws.py
import pyaudio
import numpy as np
import requests
import json
import time
import threading
import base64
import os
import torch
import soundfile as sf
import tempfile
from pathlib import Path
import asyncio
import websockets
import sys
import logging # <-- ADDED FOR BETTER LOGGING

from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor
from kokoro import KPipeline

# --- BETTER LOGGING CONFIGURATION ---
# This will show download progress from the 'huggingface_hub' library
logging.basicConfig(level=logging.INFO)
logging.getLogger('huggingface_hub').setLevel(logging.INFO)


# --- CONSTANTS and PATHS ---
base_dir = Path(__file__).resolve().parent
voice_path = base_dir / "voices" / "af_heart.pt"
LLM_SERVER_URL = "http://localhost:5000/voice"

# ==============================================================================
# === CRITICAL CHANGE: Use a much smaller model for development and testing ===
# ==============================================================================
# whisper-large-v3 is ~3.1GB and very slow to load.
# whisper-base is ~142MB and loads very quickly.
# Use 'base' to get your app working, then you can switch back to 'large-v3'
# for production when you need high accuracy.
MODEL_ID = "openai/whisper-large-v3-turbo"
# MODEL_ID = "openai/whisper-large-v3" # <-- Switch back to this later if needed


# --- Global variables to hold the loaded models ---
STT_MODEL = None
STT_PROCESSOR = None
TTS_PIPELINE = None
TTS_VOICE_TENSOR = None

class VoiceManager:
    # This class is correct and does not need changes.
    # It correctly accepts the pre-loaded models.
    def __init__(self, websocket, stt_model, stt_processor, tts_pipeline, voice_tensor):
        self.websocket = websocket
        self.history = []
        self.RATE = 16000
        self.CHUNK = int(self.RATE * 0.1)
        self.FORMAT = pyaudio.paInt16
        self.CHANNELS = 1
        self.SILENCE_THRESHOLD = 0.003
        self.SILENCE_DURATION = 1.0
        self.MIN_RECORDING_LENGTH = 0.5
        self.recording_buffer = []
        self.last_voice_time = time.time()
        self.is_recording = False
        self.is_thinking = False
        self.running = True
        self.stt_model = stt_model
        self.stt_processor = stt_processor
        self.tts_pipeline = tts_pipeline
        self.voice_tensor = voice_tensor
        self.p = pyaudio.PyAudio()
        self.stream = self.p.open(
            format=self.FORMAT, channels=self.CHANNELS, rate=self.RATE,
            input=True, frames_per_buffer=self.CHUNK, stream_callback=self.audio_callback
        )
        self.stream.start_stream()

    def transcribe_audio(self, audio_data):
        # ... (no changes needed in this function)
        if not self.stt_model: return ""
        try:
            print("🎤 Transcribing...")
            audio_array = np.frombuffer(audio_data, dtype=np.int16).astype(np.float32) / 32768.0
            inputs = self.stt_processor(audio_array, sampling_rate=self.RATE, return_tensors="pt")
            inputs = inputs.to(self.stt_model.device, dtype=torch.float16 if torch.cuda.is_available() else torch.float32)
            with torch.no_grad():
                predicted_ids = self.stt_model.generate(inputs.input_features, max_new_tokens=128)
            transcription = self.stt_processor.batch_decode(predicted_ids, skip_special_tokens=True)[0].strip()
            return transcription
        except Exception as e:
            print(f"❌ Transcription error: {e}")
            return ""

    def synthesize_speech_and_get_b64(self, text):
        # ... (no changes needed in this function)
        if not self.tts_pipeline: return None
        try:
            print("🔊 Synthesizing audio...")
            generator = self.tts_pipeline(text, voice=self.voice_tensor, speed=1.0)
            audio_segments = [audio for _, _, audio in generator]
            if not audio_segments: return None
            full_audio = np.concatenate(audio_segments)
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=True) as tmpfile:
                sf.write(tmpfile.name, full_audio, 24000)
                tmpfile.seek(0)
                audio_bytes = tmpfile.read()
                return base64.b64encode(audio_bytes).decode('utf-8')
        except Exception as e:
            print(f"❌ TTS error: {e}")
            return None

    async def send_json(self, data):
        # ... (no changes needed in this function)
        try:
            if self.websocket.open:
                await self.websocket.send(json.dumps(data))
        except websockets.exceptions.ConnectionClosed:
            print("Client connection closed, could not send message.")

    def audio_callback(self, in_data, frame_count, time_info, status):
        # ... (no changes needed in this function)
        if self.is_thinking:
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
            if current_time - self.last_voice_time >= self.SILENCE_DURATION:
                self.is_recording = False
                audio_data = b''.join(self.recording_buffer)
                self.recording_buffer = []
                total_duration = len(audio_data) / (self.RATE * self.CHANNELS * 2)
                if total_duration >= self.MIN_RECORDING_LENGTH:
                    loop = asyncio.get_running_loop()
                    asyncio.run_coroutine_threadsafe(self.process_interaction(audio_data), loop)
                else:
                    print(f"⚠️ Recording too short ({total_duration:.2f}s), skipped.")
        return (None, pyaudio.paContinue)

    async def process_interaction(self, source_data, is_text=False):
        # ... (no changes needed in this function)
        if self.is_thinking: return
        self.is_thinking = True
        await self.send_json({"state": "answering"})
        user_message = ""
        if is_text:
            user_message = source_data
            print(f"🗣️ You (text): {user_message}")
        else:
            user_message = await asyncio.to_thread(self.transcribe_audio, source_data)
            print(f"🗣️ You (voice): {user_message}")
        if not user_message:
            self.is_thinking = False
            await self.send_json({"state": "listening"})
            return
        await self.send_json({"transcribe": user_message})
        self.history.append({"role": "user", "content": user_message})
        try:
            llm_response_full = ""
            payload = {"message": user_message, "history": self.history[-10:]}
            response = requests.post(LLM_SERVER_URL, json=payload, stream=True, timeout=90)
            response.raise_for_status()
            for line in response.iter_lines():
                if line.startswith(b'data:'):
                    data_str = line.decode('utf-8')[5:].strip()
                    if data_str:
                        chunk = json.loads(data_str)
                        if 'response' in chunk:
                            token = chunk['response']
                            llm_response_full += token
                            await self.send_json({"response": token})
                        if chunk.get('state') == 'end_of_stream':
                            break
            if llm_response_full:
                self.history.append({"role": "assistant", "content": llm_response_full})
                audio_b64 = await asyncio.to_thread(self.synthesize_speech_and_get_b64, llm_response_full)
                if audio_b64:
                    await self.send_json({"tts": "on", "audio_data": audio_b64})
        except requests.exceptions.RequestException as e:
             print(f"\n❌ CONNECTION ERROR to LLM server: {e}")
             await self.send_json({"error": "Could not connect to the LLM server."})
        except Exception as e:
            print(f"\n❌ An error occurred during interaction: {e}", file=sys.stderr)
            await self.send_json({"error": str(e)})
        finally:
            self.is_thinking = False
            await self.send_json({"state": "listening"})
            print("🎤 Listening...")

    def cleanup(self):
        # ... (no changes needed in this function)
        print("🛑 Shutting down audio stream for a client...")
        self.running = False
        if self.stream and self.stream.is_active():
            self.stream.stop_stream()
            self.stream.close()
        print("✅ Client cleanup complete")


async def handler(websocket, path):
    # ... (no changes needed in this function)
    print(f"🔗 Frontend connected from {websocket.remote_address}")
    voice_manager = VoiceManager(websocket, STT_MODEL, STT_PROCESSOR, TTS_PIPELINE, TTS_VOICE_TENSOR)
    await voice_manager.send_json({"state": "listening"})
    try:
        async for message in websocket:
            data = json.loads(message)
            if 'text_input' in data:
                await voice_manager.process_interaction(data['text_input'], is_text=True)
    except websockets.exceptions.ConnectionClosed:
        print(f"Connection with {websocket.remote_address} closed.")
    finally:
        voice_manager.cleanup()


def load_models():
    # ... (no changes needed in this function)
    global STT_MODEL, STT_PROCESSOR, TTS_PIPELINE, TTS_VOICE_TENSOR
    print("-----------------------------------------")
    print("  HARU Voice Server - Pre-loading Models ")
    print("-----------------------------------------")
    try:
        print(f"\n[1/2] Loading STT model ({MODEL_ID})...", flush=True)
        device = "cuda:0" if torch.cuda.is_available() else "cpu"
        print(f"      Using device: {device}", flush=True)
        torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32
        STT_MODEL = AutoModelForSpeechSeq2Seq.from_pretrained(
            MODEL_ID, torch_dtype=torch_dtype, low_cpu_mem_usage=True, use_safetensors=True
        ).to(device)
        STT_PROCESSOR = AutoProcessor.from_pretrained(MODEL_ID)
        print("✅ STT model loaded successfully.", flush=True)
        print("\n[2/2] Loading TTS model (Kokoro)...", flush=True)
        TTS_PIPELINE = KPipeline(lang_code='a')
        TTS_VOICE_TENSOR = torch.load(voice_path, map_location=device)
        print("✅ TTS model loaded successfully.", flush=True)
        return True
    except Exception as e:
        print(f"❌ FATAL: Failed to load models: {e}", file=sys.stderr)
        return False


async def start_server():
    # ... (no changes needed in this function)
    host = "localhost"
    port = 8765
    print("\n-----------------------------------------")
    print("     ✅ All models loaded.              ")
    print("-----------------------------------------")
    async with websockets.serve(handler, host, port, max_size=None, ping_interval=20, ping_timeout=20):
        print(f"\n🚀 WebSocket server is now running and listening on ws://{host}:{port}")
        await asyncio.Future()


if __name__ == "__main__":
    if load_models():
        try:
            asyncio.run(start_server())
        except KeyboardInterrupt:
            print("\n🛑 Server shut down by user.")
        except Exception as e:
            print(f"\n❌ An unexpected error occurred in the server: {e}", file=sys.stderr)