import time
import logging
import asyncio
import httpx
import traceback
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse, ORJSONResponse
from fastapi.middleware.cors import CORSMiddleware

from utils.chat_utils import create_llm_payload, handle_non_streaming_llm_response, stream_unified_response

LLAMA_SERVER_URL = "http://localhost:8080/completion"
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

http_client: httpx.AsyncClient = None
main_process = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global http_client
    logging.info("Starting up and creating a persistent httpx client...")
    http_client = httpx.AsyncClient(timeout=30.0)
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
        stream = data.get("stream", True)

        if not user_message:
            raise HTTPException(status_code=400, detail="No message provided")

        prompt_parts = [f"{turn.get('role', 'user').capitalize()}: {turn.get('content', '')}" for turn in chat_history]
        prompt_parts.append(f"User: {user_message}\nAssistant:")
        prompt = "\n".join(prompt_parts)

        llama_payload = create_llm_payload(prompt, stream)

        if stream:
            return await stream_unified_response(http_client, llama_payload, LLAMA_SERVER_URL, sources=[])
        else:
            response_data = await handle_non_streaming_llm_response(http_client, llama_payload, LLAMA_SERVER_URL)
            content = response_data.get("content", "").strip()
            return {"content": content, "sources": []}

    except httpx.RequestError as e:
        logging.error(f"Chat backend connection error: {e}\n{traceback.format_exc()}")
        return ORJSONResponse({"error": "Backend connection failed"}, status_code=502)
    except Exception as e:
        logging.error(f"General chat endpoint error: {e}\n{traceback.format_exc()}")

@app.post("/llama-server")
async def start_llama_server_endpoint(payload: dict):
    # It's better to manage the server process outside the web server's scope,
    # but for this example, we keep the logic. `llm_utils` needs to be async-compatible.
    from utils.llm_utils import run_llama_server, kill_llama_server
    global main_process
    action = payload.get("action", "").lower()

    if action == "on":
        if main_process and main_process.poll() is None:
            return JSONResponse({"message": "Llama server is already running."})
        # Running a blocking process should be done carefully
        await asyncio.to_thread(run_llama_server)
        return JSONResponse({"message": "Llama server started successfully."})

    elif action == "off":
        if not main_process or main_process.poll() is not None:
            return JSONResponse({"message": "Llama server is not running."})
        await asyncio.to_thread(kill_llama_server)
        main_process = None
        return JSONResponse({"message": "Llama server stopped successfully."})

@app.get("/status")
async def get_status():
    return JSONResponse({"message": "Server is running."})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000, log_level="info")