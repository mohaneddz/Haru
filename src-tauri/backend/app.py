from pathlib import Path
import logging
import re
import asyncio

import requests
import httpx  # Replaced 'requests' with the async-capable 'httpx'
from contextlib import asynccontextmanager
import traceback # For more detailed logging

from fastapi import FastAPI, Request, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

from constants import LLAMA_SERVER_URL
from inits import (
    init_config_threaded,
    init_http_session_threaded,
    init_rag_system_threaded,
    init_client_threaded,
)
from rag import *
from llm import (
    create_llm_payload,
    # Assuming these functions will be adapted to be async and use httpx
    handle_non_streaming_llm_response,
    stream_unified_response,
    voice_create_llm_payload,
    voice_stream_unified_response,
    run_llama_server,
    kill_llama_server,
    build_llm_payload,
)
from web import get_web_urls, crawl_webpages_hybrid, ContentExtractor, process_crawled_results, build_search_context

# ======================================================================================
# --- CONFIGURATION (via Environment Variables with Defaults) ---
# ======================================================================================

content_extractor = None
http_client: httpx.AsyncClient = None
http_session = None
main_process = None
voice_client_task = None
config = None
rag_system = None
client = None

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# ======================================================================================
# --- APPLICATION LIFESPAN HANDLER ---
# ======================================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    global content_extractor, http_client, main_process, voice_client_task, http_session
    global config, rag_system, client

    logging.info("Starting app components...")

    # Init config (threaded) =================================

    config_thread = init_config_threaded()
    config_thread.join()
    config = config_thread.result

    http_client = httpx.AsyncClient(timeout=30.0)

    # Initialize requests.Session in a background thread and retrieve the result
    http_session_thread = init_http_session_threaded()
    http_session_thread.join()
    http_session = http_session_thread.result

    content_extractor = ContentExtractor()

    Path(config.DOCUMENTS_DIR).mkdir(exist_ok=True)

    # try:
    #     main_process = await asyncio.to_thread(run_llama_server)
    # except Exception as e:
    #     logging.error(f"Failed to start llama-server: {e}")

    # Init rag system & client concurrently
    rag_thread = init_rag_system_threaded(config)
    client_thread = init_client_threaded()
    rag_thread.join()
    client_thread.join()
    rag_system = rag_thread.result
    client = client_thread.result

    yield  # App runs here :D

    # Shutdown =============================

    logging.info("Cleaning up app components...")

    if voice_client_task and not voice_client_task.done():
        voice_client_task.cancel()
        try:
            await voice_client_task
        except asyncio.CancelledError:
            pass

    await http_client.aclose()

    if http_session:
        await asyncio.to_thread(http_session.close)

    try:
        if main_process:
            await asyncio.to_thread(kill_llama_server)
    except Exception as e:
        logging.error(f"Failed to stop llama-server: {e}")


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

@app.post("/chat")
async def chat_endpoint(request: Request):
    try:
        data = await request.json()
        user_message = data.get('message')
        chat_history = data.get('history', [])
        stream = data.get("stream", False)

        if not user_message:
            raise HTTPException(status_code=400, detail="No message provided")

        prompt = ""
        for turn in chat_history:
            prompt += f"{turn.get('role', 'user').capitalize()}: {turn.get('content', '')}\n"
        prompt += f"User: {user_message}\nAssistant:"

        llama_payload = create_llm_payload(prompt, stream)

        if stream:
            # Use the async version of the streaming function
            return await stream_unified_response(http_session, llama_payload, config.LLAMA_SERVER_URL, sources=[])
        else:
            # Use the async version of the non-streaming function
            response_data = await handle_non_streaming_llm_response(http_session, llama_payload, config.LLAMA_SERVER_URL)
            content = response_data.get("content", "").strip()
            return JSONResponse({"content": content, "sources": []})

    except httpx.RequestError as e:
        logging.error(f"Chat backend connection error: {e}\n{traceback.format_exc()}")
        return JSONResponse({"error": "Backend connection failed"}, status_code=502)
    except Exception as e:
        logging.error(f"General chat endpoint error: {e}\n{traceback.format_exc()}")
        return JSONResponse({"error": "An internal server error occurred"}, status_code=500)


@app.post("/ask_search")
async def ask_with_search(payload: dict):
    if not payload or "prompt" not in payload:
        raise HTTPException(status_code=400, detail="Missing 'prompt'")

    query = payload["prompt"]
    stream = payload.get("stream", False)

    try:
        urls = await asyncio.to_thread(get_web_urls, query) # Assuming get_web_urls is synchronous
        if not urls:
            return JSONResponse({"content": "Web search returned no results.", "sources": []})

        crawled_data = await crawl_webpages_hybrid(urls, http_client)
        if not crawled_data:
            return JSONResponse({"content": "Crawling failed to retrieve any content.", "sources": []})

        # Run CPU-bound processing in a thread pool to avoid blocking the event loop
        processed_results = await asyncio.to_thread(process_crawled_results, crawled_data, query, content_extractor)
        if not processed_results:
            return JSONResponse({
                "content": "I found web pages, but they didn't contain relevant information.",
                "sources": []
            })

        final_sources = [{"title": s.get("title", "No Title"), "url": s.get("url"), "score": round(s.get("score", 0.0), 4), "path": "", "section": ""} for s in processed_results]

        search_context, _, _, _, supporting_sources = await asyncio.to_thread(build_search_context, processed_results, query, content_extractor)
        llm_payload = build_llm_payload(search_context, query, payload, supporting_sources)
        llm_payload["stream"] = stream

        if stream:
            generator = await stream_unified_response(http_session, llm_payload, LLAMA_SERVER_URL, final_sources)
            return StreamingResponse(generator, media_type="text/event-stream")
        else:
            llm_response = await handle_non_streaming_llm_response(http_session, llm_payload, LLAMA_SERVER_URL)
            return JSONResponse({"content": llm_response.get("content", "").strip(), "sources": final_sources})

    except Exception as e:
        logging.error(f"Error during ask_search: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")


@app.post("/rag")
async def rag_query_endpoint(payload: dict):
    query = payload.get("query")
    stream = payload.get("stream", False)

    if not query:
        raise HTTPException(status_code=400, detail="Query is missing")

    try:
        # Run the potentially blocking RAG retrieval in a separate thread
        retrieved_chunks = await asyncio.to_thread(rag_system.retrieve_context, query)
        
        unique_contents = set()
        deduplicated_chunks = [c for c in retrieved_chunks if c["content"] not in unique_contents and not unique_contents.add(c["content"])]

        if not deduplicated_chunks:
            return JSONResponse({"content": "No relevant documents found.", "sources": []})

        final_sources = [{"title": "", "url": "", "path": c["source"], "section": c.get("id", f"chunk_{i}"), "score": round(c.get("score", 0.0), 4)} for i, c in enumerate(deduplicated_chunks)]
        
        context_parts = [f"[Source {i+1}: {Path(c['source']).name}]\n{c['content']}" for i, c in enumerate(deduplicated_chunks)]
        context_string = "\n---\n".join(context_parts)
        
        template = config.LLM_PROMPT_TEMPLATE_ADVANCED if payload.get("use_advanced_prompt", True) else config.LLM_PROMPT_TEMPLATE_BASIC
        full_prompt = template.format(context=context_string, query=query)
        payload_llm = create_llm_payload(full_prompt, stream=stream, llm_config=payload.get("llm_config", {}))

        if stream:
            generator = await stream_unified_response(http_session, payload_llm, LLAMA_SERVER_URL, final_sources)
            return StreamingResponse(generator, media_type="text/event-stream")
        else:
            llm_data = await handle_non_streaming_llm_response(http_session, payload_llm, LLAMA_SERVER_URL)
            final_answer = re.sub(r'(\[Source \d+\])\1+', r"\1", llm_data.get("content", "").strip())
            return JSONResponse({"content": final_answer, "sources": final_sources})

    except httpx.RequestError as e:
        logging.error(f"RAG request to LLM server failed: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=502, detail=f"Failed to connect to the LLM at {LLAMA_SERVER_URL}")
    except Exception as e:
        logging.error(f"RAG endpoint error: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="An internal RAG error occurred")

async def run_voice_client_background():
    """Wrapper to run the blocking client code in a way that asyncio can manage."""
    try:
        # Use to_thread to run the blocking 'run' method without halting the event loop
        await asyncio.to_thread(client.run)
    except asyncio.CancelledError:
        logging.info("Voice client task was cancelled.")
    except Exception as e:
        logging.error(f"Voice client background task failed: {e}\n{traceback.format_exc()}")
    finally:
        # Ensure cleanup happens even if the task fails
        await asyncio.to_thread(client.cleanup)
        logging.info("Voice client background task finished and cleaned up.")


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
            # Assuming client.transcription is thread-safe or GIL-protected
            if client.transcription != last_text:
                last_text = client.transcription
                yield f"data: {last_text}\n\n"
            await asyncio.sleep(0.1) # Shorter sleep for better responsiveness
    return StreamingResponse(event_stream(), media_type="text/event-stream")

@app.get("/response")
async def stream_response():
    async def event_stream():
        last_text = ""
        while True:
            # Assuming client.response is thread-safe or GIL-protected
            if client.response != last_text:
                last_text = client.response
                yield f"data: {last_text}\n\n"
            await asyncio.sleep(0.1)
    return StreamingResponse(event_stream(), media_type="text/event-stream")


# --- Management & Status Endpoints ---
@app.post("/llama-server")
async def start_llama_server_endpoint(payload: dict):
    global main_process
    action = payload.get("action", "").lower()

    # get if it's an action: on or off
    if action == "on":
        if main_process and main_process.poll() is None:
            return JSONResponse({"message": "Llama server is already running."})
        # Run in a thread to avoid blocking the API
        await asyncio.to_thread(run_llama_server)
        return JSONResponse({"message": "Llama server started successfully."})

    elif action == "off":
        if not main_process or main_process.poll() is not None:
            return JSONResponse({"message": "Llama server is not running."})
        # Run in a thread to avoid blocking the API
        await asyncio.to_thread(kill_llama_server)
        main_process = None
        return JSONResponse({"message": "Llama server stopped successfully."})

# --- Management & Status Endpoints ---
@app.post("/voice-server")
async def start_voice_server_endpoint(payload: dict):
    global main_process
    action = payload.get("action", "").lower()

    # get if it's an action: on or off
    if action == "on":
        if client.is_running and client.stt_model and client.tts_pipeline:
            return JSONResponse({"message": "Voice server is already running."})
        # Run in a thread to avoid blocking the API
        client.run()
        return JSONResponse({"message": "Voice server started successfully."})

    elif action == "off":
        if not client.stt_model or not client.tts_pipeline:
            return JSONResponse({"message": "Voice server is not running."})
        # Run in a thread to avoid blocking the API
        client.cleanup()
        return JSONResponse({"message": "Voice server stopped successfully."})

@app.post("/rag-server")
async def start_rag_server_endpoint(payload: dict):
    global rag_system
    action = payload.get("action", "").lower()

    if action == "on":
        if rag_system.is_running:
            return JSONResponse({"message": "RAG system is already running."})
        # Initialize RAG system in a thread
        rag_system.run()
        return JSONResponse({"message": "RAG system started successfully."})

    elif action == "off":
        if not rag_system.is_running:
            return JSONResponse({"message": "RAG system is not running."})
        # Cleanup RAG system
        await asyncio.to_thread(rag_system.cleanup)
        rag_system.cleanup()
        return JSONResponse({"message": "RAG system stopped successfully."})


@app.get("/status")
async def get_status():
    return JSONResponse({"message": "Server is running."})

# ======================================================================================
# --- ENTRY POINT ---
# ======================================================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000, log_level="info")