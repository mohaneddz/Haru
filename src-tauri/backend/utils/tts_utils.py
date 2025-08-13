# utils/tts_utils.py

import torch
import numpy as np
import sounddevice as sd
from kokoro import KPipeline
import logging
from constants import TTS_VOICE_PATH, TTS_SAMPLE_RATE

class TTS:
    def __init__(self):
        self.pipeline = None
        self.voice_tensor = None
        self.load_model()
        self._stop_flag = False
        self._audio_stream = None

    def load_model(self):
        """Loads the TTS model and voice data from paths specified in config."""
        if self.pipeline is not None:
            return
        logging.info("Loading TTS model (Kokoro)...")
        try:
            # Ensure the voice path is correct and accessible.
            self.pipeline = KPipeline(lang_code='a', repo_id='hexgrad/Kokoro-82M')
            self.voice_tensor = torch.load(TTS_VOICE_PATH, map_location='cpu')
            logging.info("✅ TTS model loaded successfully.")
        except FileNotFoundError:
            logging.error(f"❌ TTS voice file not found at: {TTS_VOICE_PATH}")
            self.pipeline = None
        except Exception as e:
            logging.error(f"❌ Failed to load TTS model: {e}")
            self.pipeline = None

    def is_ready(self) -> bool:
        """Check if the TTS model is loaded and ready for synthesis."""
        return self.pipeline is not None and self.voice_tensor is not None

    def stop_speaking(self):
        """Sets a flag to stop the TTS synthesis."""
        self._stop_flag = True

    def stop_audio(self):
        """Stops the audio playback immediately."""
        self._stop_flag = True
        if self._audio_stream and self._audio_stream.active:
            self._audio_stream.abort()
            logging.info("Audio playback stopped.")

    def synthesize_stream(self, text: str):
        """
        Synthesizes audio from text and streams it to the default output device.
        This is a blocking operation and should be run in a separate thread.
        """
        if not self.is_ready():
            logging.warning("TTS not ready, skipping synthesis.")
            return
        if not text:
            logging.warning("No text provided for TTS synthesis.")
            return
            
        logging.info(f"Synthesizing audio for: '{text[:50]}...'")
        try:
            with sd.OutputStream(
                samplerate=TTS_SAMPLE_RATE, 
                channels=1, 
                dtype='float32'
            ) as stream:
                self._audio_stream = stream
                # The KPipeline returns a generator that we iterate through.
                for _, _, audio_chunk in self.pipeline(text, voice=self.voice_tensor, speed=1.0):
                    if self._stop_flag:
                        logging.info("TTS synthesis stopped.")
                        self._stop_flag = False
                        break
                    # Ensure the chunk is a NumPy array for sounddevice.
                    if isinstance(audio_chunk, torch.Tensor):
                        chunk = audio_chunk.detach().cpu().numpy()
                    else:
                        chunk = np.asarray(audio_chunk, dtype=np.float32)
                    
                    stream.write(chunk)
            self._audio_stream = None
            logging.info("TTS synthesis finished.")
        except Exception as e:
            logging.error(f"❌ TTS streaming error: {e}")
            self._audio_stream = None