# main.py
import logging
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import ORJSONResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import httpx
from constants import LLAMA_SERVER_URL, DEFAULT_MODEL
from utils.chat_utils import create_llm_payload, create_llm_payload_with_image, handle_non_streaming_llm_response, stream_unified_response 

# ======================================================================================
# --- CONFIGURATION (via Environment Variables with Defaults) ---
# ======================================================================================

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

http_client = None
main_process = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global http_client
    logging.info("Starting up and creating a persistent httpx client...")
    http_client = httpx.AsyncClient(timeout=120.0)
    yield
    logging.info("Shutting down and closing the httpx client...")
    if http_client:
        await http_client.aclose()

app = FastAPI(lifespan=lifespan, default_response_class=ORJSONResponse)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.middleware("http")
async def log_request(request: Request, call_next):
    logging.info(f"Received {request.method} request at {request.url.path}")
    response = await call_next(request)
    return response

@app.post("/chat")
async def chat_endpoint(request: Request):
    try:
        data = await request.json()
        user_message = data.get('message')
        chat_history = data.get('history', [])
        stream = bool(data.get("stream", False))
        image_path = data.get("img")
        model = data.get("model", DEFAULT_MODEL)
        llm_config = {
            "model": model,
            "temperature": data.get("temperature", 0.7),
            "max_tokens": data.get("max_tokens", 512)
        }

        if not user_message and not image_path:
            raise HTTPException(status_code=400, detail="No message or image provided")

        # Build messages in OpenAI chat format
        messages = [{"role": turn.get('role', 'user'), "content": turn.get('content', '')} for turn in chat_history]
        messages.append({"role": "user", "content": user_message or ""})

        # Create the appropriate payload based on the presence of an image
        if image_path:
            if not os.path.exists(image_path):
                raise HTTPException(status_code=400, detail=f"Image not found: {image_path}")
            llama_payload = await create_llm_payload_with_image(messages, image_path, stream, llm_config=llm_config)
        else:
            llama_payload = await create_llm_payload(messages, stream, llm_config=llm_config)

        logging.info("Final payload prepared for LLM server.")

        if stream:
            return await stream_unified_response(http_client, llama_payload, LLAMA_SERVER_URL, sources=[])
        else:
            response_data = await handle_non_streaming_llm_response(http_client, llama_payload, LLAMA_SERVER_URL)
            content = response_data.get("content", "").strip()
            return {"content": content, "sources": []}

    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"General chat endpoint error: {e}")
        return ORJSONResponse({"error": f"An internal error occurred: {str(e)}"}, status_code=500)

@app.post("/llama-server")
async def start_llama_server_endpoint(payload: dict):
    # unchanged helper-style endpoint — assumes utils.llm_utils.run_llama_server exists if you use it
    from utils.llm_utils import run_llama_server, kill_llama_server  # optional in your project
    global main_process
    action = payload.get("action", "").lower()

    if action == "on":
        if main_process and main_process.poll() is None:
            return JSONResponse({"message": "Llama server is already running."})
        await asyncio.to_thread(run_llama_server)
        return JSONResponse({"message": "Llama server started successfully."})

    elif action == "off":
        if not main_process or main_process.poll() is not None:
            return JSONResponse({"message": "Llama server is not running."})
        await asyncio.to_thread(kill_llama_server)
        main_process = None
        return JSONResponse({"message": "Llama server stopped successfully."})

    return JSONResponse({"message": "Unknown action"}, status_code=400)

@app.get("/status")
async def get_status():
    return JSONResponse({"message": "Server is running."})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5000, log_level="info", reload=True)
