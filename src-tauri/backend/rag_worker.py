from pathlib import Path
import logging
import re
import asyncio

import httpx 
from contextlib import asynccontextmanager
import traceback
from constants import LLAMA_SERVER_URL, LLM_PROMPT_TEMPLATE_BASIC, LLM_PROMPT_TEMPLATE_ADVANCED

from fastapi import FastAPI, Request, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse, ORJSONResponse
from fastapi.middleware.cors import CORSMiddleware

from utils.llm_utils import create_llm_payload,handle_non_streaming_llm_response,stream_unified_response
from utils.rag_utils import RAGSystem

# ======================================================================================
# --- CONFIGURATION (via Environment Variables with Defaults) ---
# ======================================================================================


logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

http_client = None
main_process = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global rag_system, http_client

    logging.info("Starting app components...")
    rag_system = RAGSystem()
    http_client = httpx.AsyncClient(timeout=30.0)
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

# Request logging middleware
@app.middleware("http")
async def log_request(request: Request, call_next):
    logging.info(f"Received {request.method} request at {request.url.path}")
    response = await call_next(request)
    return response

# ======================================================================================
# --- FASTAPI ENDPOINTS ---
# ======================================================================================

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
        
        template = LLM_PROMPT_TEMPLATE_ADVANCED if payload.get("use_advanced_prompt", True) else LLM_PROMPT_TEMPLATE_BASIC
        full_prompt = template.format(context=context_string, query=query)
        messages = [{"role": "user", "content": full_prompt}]
        payload_llm = await create_llm_payload(messages, stream=stream, llm_config=payload.get("llm_config", {}))

        if stream:
            return await stream_unified_response(http_client, payload_llm, LLAMA_SERVER_URL, final_sources, isLocal=True)
        else:
            llm_data = await handle_non_streaming_llm_response(http_client, payload_llm, LLAMA_SERVER_URL)
            final_answer = re.sub(r'(\[Source \d+\])\1+', r"\1", llm_data.get("content", "").strip())
            return JSONResponse({"content": final_answer, "sources": final_sources})

    except httpx.RequestError as e:
        logging.error(f"RAG request to LLM server failed: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=502, detail=f"Failed to connect to the LLM at {LLAMA_SERVER_URL}")
    except Exception as e:
        logging.error(f"RAG endpoint error: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="An internal RAG error occurred")

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

@app.post("/rebuild-index", status_code=202)
def rebuild_index_endpoint(background_tasks: BackgroundTasks):
    background_tasks.add_task(rag_system.build_index_from_directory, force_rebuild=True)
    return JSONResponse(content={"message": "Index rebuild process started in the background."})

@app.post("/persist-index", status_code=200)
def persist_index_endpoint():
    rag_system.persist_index()
    return JSONResponse(content={"message": "Index has been persisted to disk."})

# ======================================================================================
# --- ENTRY POINT ---
# ======================================================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001, log_level="info")