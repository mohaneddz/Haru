#STT WORKER
import logging
import asyncio

import httpx 
from contextlib import asynccontextmanager
import traceback 

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

from constants import LLAMA_SERVER_URL
from utils.llm_utils import voice_create_llm_payload,voice_stream_unified_response
from utils.stt_utils import STT

# ======================================================================================
# --- CONFIGURATION (via Environment Variables with Defaults) ---
# ======================================================================================

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

@asynccontextmanager
async def lifespan(app: FastAPI):
    global http_client, stt
    logging.info("Starting app components...")
    http_client = httpx.AsyncClient(timeout=120.0)
    stt = STT()

    yield  # App runs here :D
    await http_client.aclose()
    stt.cleanup()  
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

@app.post("/voice")
async def voice_endpoint(payload: dict):
    try:
        user_message = payload.get("message")
        if not user_message:
            raise HTTPException(status_code=400, detail="No message provided")

        chat_history = payload.get("history", [])
        prompt = "You are a helpful AI assistant. Respond naturally and conversationally.\n\n"
        for turn in chat_history[-10:]:
            prompt += f"{'Human' if turn.get('role', 'user') == 'user' else 'Assistant'}: {turn.get('content', '')}\n"
        prompt += f"Human: {user_message}\nAssistant:"

        llama_payload = await voice_create_llm_payload(prompt, True)
        
        # Use the async version of the voice streaming function
        return await voice_stream_unified_response(http_client, llama_payload, LLAMA_SERVER_URL, sources=[])

    except Exception as e:
        logging.error(f"Voice endpoint error: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="An internal server error occurred")

# SSE endpoints remain async, they are well-suited for this pattern
@app.get("/transcribe")
async def stream_transcription():
    async def event_stream():
        last_text = ""
        while True:
            if stt.transcription != last_text:
                last_text = stt.transcription
                yield f"data: {last_text}\n\n"
            await asyncio.sleep(0.1)
    return StreamingResponse(event_stream(), media_type="text/event-stream")

@app.post("/stt-server")
async def start_voice_server_endpoint(payload: dict):
    global main_process
    action = payload.get("action", "").lower()

    # get if it's an action: on or off
    if action == "on":
        if stt.is_running and stt.stt_model and stt.tts_pipeline:
            return JSONResponse({"message": "Voice server is already running."})
        # Run in a thread to avoid blocking the API
        stt.run()
        return JSONResponse({"message": "Voice server started successfully."})

    elif action == "off":
        if not stt.stt_model or not stt.tts_pipeline:
            return JSONResponse({"message": "Voice server is not running."})
        # Run in a thread to avoid blocking the API
        stt.cleanup()
        return JSONResponse({"message": "Voice server stopped successfully."})

# ======================================================================================
# --- ENTRY POINT ---
# ======================================================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5003, log_level="info")