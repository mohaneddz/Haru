import logging
import re
import asyncio

import httpx 
import traceback

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse, ORJSONResponse
from fastapi.middleware.cors import CORSMiddleware

from config.constants import LLAMA_SERVER_URL
from config.prompts import LLM_PROMPT_TEMPLATE_BASIC, LLM_PROMPT_TEMPLATE_ADVANCED

from utils.llm_utils import create_llm_payload,handle_non_streaming_llm_response,stream_unified_response
from utils.rag_utils import RAGSystem

# ======================================================================================
# --- CONFIGURATION (via Environment Variables with Defaults) ---
# ======================================================================================


logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

http_client = None
main_process = None

async def _rephrase_query_with_history(query: str, messages: list, llm_config: dict) -> str:
    """
    Use LLM to rewrite the query into a concise, standalone retrieval query using recent chat history.
    Limits history to the last 10 messages. Returns a single-line query with no explanations.
    """
    try:
        history = messages or []
        # take only the last 10 messages
        recent = history[-10:]

        # Ensure contents are plain strings and roles are normalized
        def normalize_msg(msg: dict) -> dict:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if isinstance(content, list):
                parts = [p.get("text", "") for p in content if isinstance(p, dict) and p.get("type") in ("text", "input_text")]
                content = " ".join(parts)
            return {"role": role if role in ("user", "assistant", "system") else "user", "content": str(content)[:1000]}

        convo_msgs = [normalize_msg(m) for m in recent if m and m.get("content")]

        system_prompt = (
            "You rewrite user queries for a Retrieval-Augmented Generation (RAG) system.\n"
            "Use the conversation to resolve references (this/that/he/she/it/etc.).\n"
            "Output ONLY the rewritten standalone search query on one line. No quotes, no code fences, no explanations."
        )

        # Build messages payload: system -> recent convo -> final instruction
        messages_payload = [{"role": "system", "content": system_prompt}]
        messages_payload.extend(convo_msgs)
        messages_payload.append({
            "role": "user",
            "content": (
                f"Original query: {query}\n"
                "Rewrite this into a self-contained, specific query optimized for semantic retrieval.\n"
                "Return only the rewritten query."
            )
        })

        payload = await create_llm_payload(messages_payload, stream=False, llm_config=llm_config or {})
        resp = await handle_non_streaming_llm_response(http_client, payload, LLAMA_SERVER_URL)
        text = (resp.get("content") or "").strip()
        # Sanitize to a single concise line without quotes/fences/explanations
        first_line = next((ln for ln in text.splitlines() if ln.strip()), "")
        cleaned = first_line.strip().strip('`"“”‘’')
        return cleaned or query
    except Exception as e:
        logging.error(f"Rephrasing failed, using original query. Error: {e}")
        return query

@asynccontextmanager
async def lifespan(app: FastAPI):
    global rag_system, http_client
    logging.info("Starting app components...")

    # Create shared HTTP client immediately
    http_client = httpx.AsyncClient(timeout=120.0)

    # Initialize RAG system off the event loop to speed startup
    rag_system = await asyncio.to_thread(RAGSystem)

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
        # Build a rephrased retrieval query using prior conversation (if provided)
        history_messages = payload.get("messages") or payload.get("history") or []
        rephrased_query = await _rephrase_query_with_history(query, history_messages, payload.get("llm_config", {}))

        # Retrieve using the rephrased query
        retrieved_chunks = await rag_system.retrieve_context(rephrased_query)
        
        unique_contents = set()
        deduplicated_chunks = [c for c in retrieved_chunks if c["content"] not in unique_contents and not unique_contents.add(c["content"])]

        if not deduplicated_chunks:
            return JSONResponse({"content": "No relevant documents found.", "sources": []})

        final_sources = [
            {
                "title": "",
                "url": "",
                "path": c["source"],
                "section": c.get("id", f"chunk_{i}"),
                "score": round(c.get("rerank_score", 0.0), 4)
            }
            for i, c in enumerate(deduplicated_chunks)
        ]
        
        context_parts = [f"[Source {i+1}: {Path(c['source']).name}]\n{c['content']}" for i, c in enumerate(deduplicated_chunks)]
        context_string = "\n---\n".join(context_parts)
        
        template = LLM_PROMPT_TEMPLATE_ADVANCED if payload.get("use_advanced_prompt", True) else LLM_PROMPT_TEMPLATE_BASIC
        full_prompt = template.format(context=context_string, query=query)  # answer the original user query
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
        # Cleanup RAG system once
        await asyncio.to_thread(rag_system.cleanup)
        return JSONResponse({"message": "RAG system stopped successfully."})

@app.post("/rebuild-index", status_code=202)
def rebuild_index_endpoint(background_tasks: BackgroundTasks):
    background_tasks.add_task(rag_system.build_index_from_directory, force_rebuild=True)
    # Return plain dict to honor decorator status code 202
    return {"message": "Index rebuild process started in the background."}

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