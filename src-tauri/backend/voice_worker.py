# main.py

import asyncio
import logging
import json
import re
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

# Local utils and config
from utils.stt_utils import STT
from utils.tts_utils import TTS
from utils.chat_utils import voice_create_llm_payload, stream_unified_response
from constants import LLAMA_SERVER_URL

# --- Logging Configuration ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Voice Service Manager ---
class VoiceServiceManager:
    """A singleton manager for STT and TTS services."""
    def __init__(self):
        self.stt = STT()
        self.tts = TTS()
        self.is_tts_playing = False
        self.lock = asyncio.Lock()

    def is_ready(self):
        return self.stt.is_ready() and self.tts.is_ready()

manager = VoiceServiceManager()

# --- FastAPI Lifespan Management ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handles startup and shutdown of services."""
    logging.info("Server starting up...")
    # Models are loaded synchronously on init, which is fine for startup.
    if not manager.is_ready():
        logging.error("Voice services failed to initialize. Check model paths and dependencies.")
        # In a production scenario, you might want to exit or prevent the server from starting.
    yield
    logging.info("Server shutting down...")
    if manager.stt.listening:
        manager.stt.stop_listen()

# --- FastAPI App Initialization ---
app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Text Sanitization Utils ---
def _sanitize_for_tts(text: str) -> str:
    """Cleans text for better TTS output by removing markdown, URLs, and emojis."""
    if not isinstance(text, str) or not text:
        return ""
    text = re.sub(r"```[\s\S]*?```|`[^`]*`", " ", text)
    text = re.sub(r"!\[([^\]]*)\]\([^)]+\)|\[([^\]]+)\]\([^)]+\)", r"\1", text)
    text = re.sub(r"(\*\*|__|\*|_|#|>\s*|^\s*[-*+]\s*|\d+\.\s+)", "", text, flags=re.MULTILINE)
    text = re.sub(r"<[^>]+>", " ", text)
    # Emoji removal pattern
    emoji_pattern = re.compile(
        "["
        "\U0001F600-\U0001F64F"  # emoticons
        "\U0001F300-\U0001F5FF"  # symbols & pictographs
        "\U0001F680-\U0001F6FF"  # transport & map
        "\U0001F1E0-\U0001F1FF"  # flags (iOS)
        "\U00002700-\U000027BF"
        "\U0001f900-\U0001f9ff"
        "\U00002600-\U000026FF"
        "\u200d"
        "\u2640-\u2642"
        "]+",
        flags=re.UNICODE,
    )
    text = emoji_pattern.sub("", text)
    return re.sub(r"\s+", " ", text).strip()

# --- API Endpoints ---
@app.post("/start_listen")
async def start_listen():
    async with manager.lock:
        if manager.is_tts_playing:
            return JSONResponse({"status": "error", "message": "Cannot listen while TTS is playing."}, status_code=409)
        if manager.stt.listening:
            return JSONResponse({"status": "warning", "message": "Already listening."})
        manager.stt.start_listen()
        return JSONResponse({"status": "started"})

@app.post("/stop_listen")
async def stop_listen():
    manager.stt.stop_listen()
    if manager.is_tts_playing:
        manager.tts.stop_audio()
        async with manager.lock:
            manager.is_tts_playing = False
    return JSONResponse({"status": "stopped"})

@app.get("/transcribe")
async def transcribe():
    """Streams transcription updates via Server-Sent Events (SSE)."""
    async def sse_generator():
        last_sent = ""
        try:
            while manager.stt.listening:
                current_transcript = manager.stt.get_full_transcript()
                if current_transcript != last_sent:
                    yield f"data: {json.dumps({'type': 'partial', 'text': current_transcript})}\n\n"
                    last_sent = current_transcript
                await asyncio.sleep(0.1)
            
            # Send the final transcript once listening stops
            final_transcript = manager.stt.get_full_transcript()
            yield f"data: {json.dumps({'type': 'final', 'text': final_transcript})}\n\n"
        except asyncio.CancelledError:
            logging.info("Transcription stream cancelled by client.")
    
    if not manager.stt.listening:
        return JSONResponse({"status": "error", "message": "Not currently listening."}, status_code=404)
    
    return StreamingResponse(sse_generator(), media_type="text/event-stream")

@app.post("/speak")
async def speak(request: Request):
    """Synthesizes text to speech. This is a blocking endpoint."""
    body = await request.json()
    text = body.get("text", "")
    
    if not text:
        raise HTTPException(status_code=400, detail="No text provided.")

    async with manager.lock:
        if manager.stt.listening:
            return JSONResponse({"status": "error", "message": "Cannot play TTS while listening."}, status_code=409)
        manager.is_tts_playing = True
    
    try:
        safe_text = _sanitize_for_tts(text)
        # Run the blocking TTS function in a separate thread
        await asyncio.to_thread(manager.tts.synthesize_stream, safe_text)
        return JSONResponse({"status": "finished"})
    finally:
        async with manager.lock:
            manager.is_tts_playing = False

# Placeholder for your existing /voice endpoint logic
@app.post("/voice")
async def voice_endpoint(request: Request):
    body = await request.json()
    prompt = body.get("prompt", "")
    chat_history = body.get("chat_history", [])

    # Build messages array: reuse chat_history from frontend and append the current user turn
    messages = []
    for msg in chat_history:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        messages.append({"role": role, "content": content})
    if prompt:
        messages.append({"role": "user", "content": prompt})

    # Build payload (sync/async safe)
    payload = (
        await voice_create_llm_payload(messages, [], True)
        if asyncio.iscoroutinefunction(voice_create_llm_payload)
        else await voice_create_llm_payload(messages, [], True)
    )

    # Stream the LLM + (optionally) TTS response passthrough
    return await stream_unified_response(
        None,  # create a client internally
        payload,
        LLAMA_SERVER_URL,
        sources=[]
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5005)