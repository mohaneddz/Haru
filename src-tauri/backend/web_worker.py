from pathlib import Path
import logging
import re
import asyncio

import httpx 
from contextlib import asynccontextmanager
import traceback

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

from constants import LLAMA_SERVER_URL
from utils.chat_utils import handle_non_streaming_llm_response,stream_unified_response,build_llm_payload
from utils.web_utils import get_web_urls, crawl_webpages_hybrid, ContentExtractor, process_crawled_results, build_search_context

# ======================================================================================
# --- CONFIGURATION (via Environment Variables with Defaults) ---
# ======================================================================================

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

http_client = None
content_extractor = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global http_client, content_extractor
    logging.info("Starting up and creating a persistent httpx client...")
    http_client = httpx.AsyncClient(timeout=120.0)
    content_extractor = ContentExtractor()
    yield
    logging.info("Shutting down and closing the httpx client...")
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

@app.post("/ask_search")
async def ask_with_search(payload: dict):
    if not payload or "prompt" not in payload:
        raise HTTPException(status_code=400, detail="Missing 'prompt'")

    query = payload["prompt"]
    stream = payload.get("stream", False)

    try:
        urls = await asyncio.to_thread(get_web_urls, query) 
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
        llm_payload = await build_llm_payload(search_context, query, payload, supporting_sources)
        llm_payload["stream"] = stream

        if stream:
            return await stream_unified_response(http_client, llm_payload, LLAMA_SERVER_URL, sources=final_sources)
        else:
            llm_response = await handle_non_streaming_llm_response(http_client, llm_payload, LLAMA_SERVER_URL)
            return JSONResponse({"content": llm_response.get("content", "").strip(), "sources": final_sources})

    except Exception as e:
        logging.error(f"Error during ask_search: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")


@app.get("/status")
async def get_status():
    return JSONResponse({"message": "Server is running."})

# ======================================================================================
# --- ENTRY POINT ---
# ======================================================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5002, log_level="info")