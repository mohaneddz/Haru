#TTS WORKER
import logging
import asyncio

import httpx 
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from utils.tts_utils import TTS

# ======================================================================================
# --- CONFIGURATION (via Environment Variables with Defaults) ---
# ======================================================================================

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

@asynccontextmanager
async def lifespan(app: FastAPI):
    global http_client, tts
    logging.info("Starting app components...")
    http_client = httpx.AsyncClient(timeout=120.0)
    tts = TTS()

    yield  # App runs here :D
    await http_client.aclose()
    tts.cleanup()  
    if http_client:
        await http_client.aclose()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logging middleware
@app.middleware("http")
async def log_request(request: Request, call_next):
    logging.info(f"Received {request.method} request at {request.url.path}")
    response = await call_next(request)
    return response

# ======================================================================================
# --- FASTAPI ENDPOINTS ---
# ======================================================================================

@app.get("/response")
async def stream_response():
    async def event_stream():
        last_text = ""
        while True:
            # Assuming tts.response is thread-safe or GIL-protected
            if tts.response != last_text:
                last_text = tts.response
                yield f"data: {last_text}\n\n"
            await asyncio.sleep(0.1)
    return StreamingResponse(event_stream(), media_type="text/event-stream")

@app.post("/tts-server")
async def start_voice_server_endpoint(payload: dict):
    action = payload.get("action", "").lower()

    if action == "on":
        if tts.is_running and tts.stt_model and tts.tts_pipeline:
            return JSONResponse({"message": "Voice server is already running."})
        tts.run()
        return JSONResponse({"message": "Voice server started successfully."})

    elif action == "off":
        if not tts.stt_model or not tts.tts_pipeline:
            return JSONResponse({"message": "Voice server is not running."})
        tts.cleanup()
        return JSONResponse({"message": "Voice server stopped successfully."})

# ======================================================================================
# --- ENTRY POINT ---
# ======================================================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5003, log_level="info")