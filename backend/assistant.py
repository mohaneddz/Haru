import pyaudio
import numpy as np
import requests
import json
import base64
import pygame
import tempfile
import time
import threading
from io import BytesIO

class VoiceClient:
    def __init__(self, server_url="http://localhost:8088"):
        self.server_url = server_url
        self.session_id = f"voice_session_{int(time.time())}"
        
        # Audio configuration
        self.RATE = 16000
        self.CHUNK = int(self.RATE * 0.1)  # 100ms chunks
        self.FORMAT = pyaudio.paInt16
        self.CHANNELS = 1
        
        # Voice Activity Detection
        self.SILENCE_THRESHOLD = 0.003
        self.SILENCE_DURATION = 2.0
        self.MIN_RECORDING_LENGTH = 0.5
        
        # State
        self.recording_buffer = []
        self.last_voice_time = time.time()
        self.is_recording = False
        self.is_playing = False
        self.running = True
        
        # Initialize audio
        self.p = pyaudio.PyAudio()
        pygame.mixer.init(frequency=22050, size=-16, channels=1, buffer=512)
        
        # Start audio stream
        self.stream = self.p.open(
            format=self.FORMAT,
            channels=self.CHANNELS,
            rate=self.RATE,
            input=True,
            frames_per_buffer=self.CHUNK,
            stream_callback=self.audio_callback
        )
        self.stream.start_stream()
    
    def audio_callback(self, in_data, frame_count, time_info, status):
        """Audio input callback - only record when not playing"""
        if not self.is_playing:
            # Convert to numpy array for processing
            audio_array = np.frombuffer(in_data, dtype=np.int16).astype(np.float32) / 32768.0
            rms = np.sqrt(np.mean(audio_array**2))
            current_time = time.time()
            
            # Voice activity detection
            if rms > self.SILENCE_THRESHOLD:
                if not self.is_recording:
                    print("🔴 Recording started...")
                    self.is_recording = True
                    self.recording_buffer = []
                
                self.last_voice_time = current_time
                self.recording_buffer.append(in_data)
                
            elif self.is_recording:
                self.recording_buffer.append(in_data)
                
                # Check silence duration
                silence_duration = current_time - self.last_voice_time
                if silence_duration >= self.SILENCE_DURATION:
                    if len(self.recording_buffer) > 0:
                        total_duration = len(self.recording_buffer) * self.CHUNK / self.RATE
                        if total_duration >= self.MIN_RECORDING_LENGTH:
                            # Process in separate thread
                            audio_data = b''.join(self.recording_buffer)
                            threading.Thread(
                                target=self.process_voice_input,
                                args=(audio_data,),
                                daemon=True
                            ).start()
                        else:
                            print("⚠️  Recording too short, skipped.")
                    
                    # Reset
                    self.is_recording = False
                    self.recording_buffer = []
                    print("🎤 Listening...")
        
        return (None, pyaudio.paContinue)
    
    def process_voice_input(self, audio_data):
        """Process complete voice input through the voice endpoint"""
        try:
            print("⏹️  Recording stopped. Processing...")
            
            # Encode audio as base64
            audio_b64 = base64.b64encode(audio_data).decode('utf-8')
            
            # Prepare request
            payload = {
                "audio_data": audio_b64,
                "session_id": self.session_id,
                "sample_rate": self.RATE,
                "include_audio": True,
                "llm_config": {
                    "temperature": 0.7,
                    "n_predict": 512
                }
            }
            
            # Send to voice endpoint
            start_time = time.time()
            response = requests.post(
                f"{self.server_url}/voice",
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                
                # Display results
                transcription = result.get("transcription", "")
                llm_response = result.get("llm_response", "")
                audio_data = result.get("audio_data")
                processing_time = result.get("processing_time", {})
                
                print(f"🗣️  You: {transcription}")
                print(f"🤖 Assistant: {llm_response}")
                
                # Show timing info
                total_time = processing_time.get("total", time.time() - start_time)
                print(f"⏱️  Processing time: {total_time:.2f}s")
                
                # Play audio response if available
                if audio_data:
                    self.play_audio_response(audio_data)
                else:
                    print("🔇 No audio response generated")
                
            else:
                print(f"❌ Error: {response.status_code} - {response.text}")
                
        except Exception as e:
            print(f"❌ Processing error: {e}")
    
    def play_audio_response(self, audio_b64):
        """Play base64 encoded audio response"""
        try:
            self.is_playing = True
            print("🔊 Playing response...")
            
            # Decode base64 audio
            audio_bytes = base64.b64decode(audio_b64)
            
            # Create temporary file and play
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
                temp_file.write(audio_bytes)
                temp_file.flush()
                
                # Play with pygame
                pygame.mixer.music.load(temp_file.name)
                pygame.mixer.music.play()
                
                # Wait for playback to finish
                while pygame.mixer.music.get_busy() and self.running:
                    time.sleep(0.1)
            
            # Clean up
            import os
            try:
                os.unlink(temp_file.name)
            except:
                pass
            
            self.is_playing = False
            print("🎤 Ready for next input...")
            
        except Exception as e:
            print(f"Audio playback error: {e}")
            self.is_playing = False
    
    def send_text_message(self, text):
        """Send a text message directly (for testing)"""
        try:
            payload = {
                "text": text,
                "session_id": self.session_id,
                "include_audio": True
            }
            
            response = requests.post(
                f"{self.server_url}/voice",
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                llm_response = result.get("llm_response", "")
                audio_data = result.get("audio_data")
                
                print(f"📝 You: {text}")
                print(f"🤖 Assistant: {llm_response}")
                
                if audio_data:
                    self.play_audio_response(audio_data)
            else:
                print(f"❌ Error: {response.status_code} - {response.text}")
                
        except Exception as e:
            print(f"❌ Text message error: {e}")
    
    def get_session_history(self):
        """Get conversation history"""
        try:
            response = requests.get(f"{self.server_url}/voice/sessions/{self.session_id}")
            if response.status_code == 200:
                return response.json()
            else:
                print(f"❌ Error getting history: {response.status_code}")
                return None
        except Exception as e:
            print(f"❌ History error: {e}")
            return None
    
    def cleanup(self):
        """Clean up resources"""
        print("🛑 Shutting down...")
        self.running = False
        
        if hasattr(self, 'stream'):
            self.stream.stop_stream()
            self.stream.close()
        
        if hasattr(self, 'p'):
            self.p.terminate()
        
        pygame.mixer.quit()
        print("✅ Cleanup complete")
    
    def run(self):
        """Main run loop"""
        print("🎤 Voice Client Ready!")
        print("   - Speak and pause for 2 seconds to send voice messages")
        print("   - Type 'quit' to exit")
        print("   - Type 'history' to see conversation history")
        print("   - Type anything else to send as text message")
        print()
        
        try:
            while self.running:
                user_input = input().strip()
                
                if user_input.lower() == 'quit':
                    break
                elif user_input.lower() == 'history':
                    history = self.get_session_history()
                    if history:
                        print("\n📜 Conversation History:")
                        for i, turn in enumerate(history.get('history', [])):
                            role = turn.get('role', 'unknown')
                            content = turn.get('content', '')
                            print(f"  {i+1}. {role.title()}: {content}")
                        print()
                elif user_input:
                    # Send as text message
                    self.send_text_message(user_input)
                
                time.sleep(0.1)
                
        except KeyboardInterrupt:
            pass
        finally:
            self.cleanup()

if __name__ == "__main__":
    # Example usage
    client = VoiceClient("http://localhost:8088")
    client.run()