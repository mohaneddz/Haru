import logging
import asyncio

import httpx 
from contextlib import asynccontextmanager
import traceback
from datetime import datetime

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from config.constants import LLAMA_SERVER_URL
from utils.chat_utils import handle_non_streaming_llm_response, stream_unified_response, build_llm_payload, create_llm_payload
from utils.search_utils import full_search_pipeline, build_search_context
from utils.web_utils import ContentExtractor

# ======================================================================================
# --- CONFIGURATION (via Environment Variables with Defaults) ---
# ======================================================================================

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

http_client = None
content_extractor = None

async def _rephrase_query_with_history(query: str, messages: list, llm_config: dict) -> str:
    """
    Rewrite the query into a concise, standalone retrieval query using recent chat history.
    Returns a single-line query with no explanations.
    """
    try:
        history = messages or []
        recent = history[-8:]

        def clip(text: str, max_len=500):
            return (text or "")[:max_len]

        history_lines = []
        for m in reversed(recent):  # most recent first
            role = m.get("role", "user")
            content = m.get("content", "")
            if isinstance(content, list):
                parts = [p.get("text", "") for p in content if isinstance(p, dict) and p.get("type") in ("text", "input_text")]
                content = " ".join(parts)
            history_lines.append(f"- {role}: {clip(str(content))}")

        today_date = datetime.now().strftime("%Y-%m-%d")
        system_time = datetime.now().strftime("%H:%M:%S")

        system_prompt = (
            "You are a query rewriter for a retrieval/search system.\n"
            "Your ONLY task is to transform user queries into precise, self-contained, single-line search queries.\n"
            "Rules:\n"
            "- Always resolve references using the conversation history.\n"
            "- Always enrich queries with missing context (time, date, location, entities, domain, etc.).\n"
            "- Be concise, precise, and specific.\n"
            "- DO NOT explain, justify, or add filler text.\n"
            "- Output ONLY the rewritten standalone query.\n\n"
            f"Current Date: {today_date}\n"
            f"Current System Time: {system_time}\n"
        )
        user_prompt = (
            "Conversation (most recent first):\n"
            + "\n".join(history_lines)
            + "\n\nOriginal query:\n"
            + clip(query)
            + "\n\nRewrite into a single, fully self-contained, context-rich query.\n"
            "Output ONLY the rewritten query, nothing else."
        )

        messages_payload = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]
        payload = await create_llm_payload(messages_payload, stream=False, llm_config=llm_config or {})
        resp = await handle_non_streaming_llm_response(http_client, payload, LLAMA_SERVER_URL)
        text = (resp.get("content") or "").strip()
        first_line = next((ln for ln in text.splitlines() if ln.strip()), "")
        cleaned = first_line.strip().strip('`"“”‘’')
        logging.info(f"Rephrased query: {cleaned}")
        return cleaned or query
    except Exception as e:
        logging.error(f"Web rephrasing failed, using original query. Error: {e}")
        return query

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
    if not payload or "query" not in payload:
        raise HTTPException(status_code=400, detail="Missing 'query'")

    query = payload["query"]
    stream = payload.get("stream", False)
    print("Received query:", query)

    try:
        # Rephrase using prior conversation if provided
        history_messages = payload.get("messages") or payload.get("history") or []
        rephrased_query = await _rephrase_query_with_history(query, history_messages, payload.get("llm_config", {}))

        # Use rephrased query for retrieval
        processed_results = await full_search_pipeline(rephrased_query, content_extractor)
        if not processed_results:
            return JSONResponse({"content": "No relevant results found.", "sources": []})

        final_sources = [
            {
                "title": s.get("title", "No Title"),
                "url": s.get("url"),
                "score": round(s.get("score", 0.0), 4),
                "path": "",
                "section": ""
            }
            for s in processed_results
        ]

        # Build context using search results and the original user query
        search_context, _, _, _, supporting_sources = await asyncio.to_thread(
            build_search_context, processed_results, query, content_extractor
        )
        history_messages.append({"role": "user", "content": search_context})
        llm_payload = await build_llm_payload(history_messages, query, payload, supporting_sources)
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