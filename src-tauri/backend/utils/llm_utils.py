import json
import logging
import re
import subprocess
import sys
import time
import emoji
from web import detect_dynamic_stop_tokens
from constants import LLAMA_SERVER_URL
import requests
from fastapi.responses import StreamingResponse
from fastapi.responses import JSONResponse

# ------------------------------
# Process management    
# ------------------------------

def run_llama_server():
    global main_process
    try:
        main_process = subprocess.Popen([
            "../lib/llama-server.exe",
            "-m", "../weights/gemma-3-4b-it-q4_0.gguf",
            "-ngl", "99",
            "-c", "8192",
            "-t", "6"
        ])
    except Exception as e:
        print(f"Error running llama-server: {e}", file=sys.stderr)
        sys.exit(1)

async def kill_llama_server():
    global main_process
    if main_process:
        main_process.terminate()
        main_process = None

async def restart_llama_server():
    kill_llama_server()
    run_llama_server()

# ------------------------------
# Payload creation
# ------------------------------

def create_llm_payload(prompt: str, stream: bool, llm_config: dict = None) -> dict:
    if llm_config is None:
        llm_config = {}
    return {
        "prompt": prompt,
        "n_predict": llm_config.get("n_predict", 512),
        "temperature": llm_config.get("temperature", 0.7),
        "stop": llm_config.get("stop", [
            "\nUser:", "User:", "<end_of_turn>",
            "<|eot_id|>", "\n###", "\nHuman:", "Human:"
        ]),
        "stream": stream
    }

def voice_create_llm_payload(prompt: str, stream: bool, llm_config: dict = None) -> dict:
    if llm_config is None:
        llm_config = {}
    return {
        "prompt": prompt,
        "n_predict": llm_config.get("n_predict", 512),
        "temperature": llm_config.get("temperature", 0.7),
        "stop": ["\nHuman:", "<|eot_id|>"],
        "stream": stream
    }

# ------------------------------
# Helpers
# ------------------------------

def strip_markdown_and_emojis(text: str) -> str:
    text = re.sub(r'\*\*.*?\*\*', '', text)
    text = re.sub(r'\*.*?\*', '', text)
    text = re.sub(r'`.*?`', '', text)
    text = re.sub(r'\[.*?\]\(.*?\)', '', text)
    text = re.sub(r'#+\s.*', '', text)
    return emoji.replace_emoji(text, replace='')

# ------------------------------
# Streaming Responses
# ------------------------------

async def build_llm_payload(search_context, query, data):
    combined_prompt = (
        "You are a helpful research assistant. Answer the user's question based *only* on the information provided in the context below. "
        "Synthesize the information from the Primary Source and Supporting Evidence into a single, coherent answer. Be concise.\n\n"
        "--- START OF CONTEXT ---\n"
        f"{search_context}"
        "--- END OF CONTEXT ---\n\n"
        f"Question: {query}\n\n"
        "Answer:"
    )
    dynamic_stops = detect_dynamic_stop_tokens(query)
    payload = {
        "prompt": combined_prompt,
        "n_predict": data.get("n_predict", 512),
        "temperature": 0.1,
        "stop": dynamic_stops,
        "stream": data.get("stream", False)
    }
    return payload

async def handle_llm_response(payload, stream, final_results, golden_source_info, context_len, final_tokens):
    try:
        response = requests.post(LLAMA_SERVER_URL, json=payload, timeout=90, stream=stream)
        response.raise_for_status()

        if stream:
            def generate_sse_proxy(resp):
                for line_bytes in resp.iter_lines():
                    if line_bytes:
                        line_str = line_bytes.decode('utf-8')
                        if line_str.startswith("data:"):
                            yield f"{line_str}\n\n"

            return StreamingResponse(
                generate_sse_proxy(response),
                media_type='text/event-stream',
                headers={
                    "X-Sources-Used": str(len(final_results)),
                    "X-Golden-Source": json.dumps(golden_source_info),
                    "X-Context-Length": str(context_len),
                    "X-Context-Tokens": str(final_tokens),
                    "X-Detailed-Sources": json.dumps([
                        {"url": s["url"], "title": s["title"], "combined_score": s.get("combined_score", 0)}
                        for s in final_results
                    ])
                }
            )
        else:
            content = response.json().get("content", "")
            return JSONResponse(content={
                "content": content.strip(),
                "golden_source": golden_source_info,
                "sources_used": len(final_results),
                "context_length": context_len,
                "context_tokens": final_tokens,
                "structured_fields": {s["url"]: s.get("structured_fields", {}) for s in final_results if s.get("structured_fields")},
                "detailed_sources": [
                    {"url": s["url"], "title": s["title"], "combined_score": s.get("combined_score", 0)}
                    for s in final_results
                ]
            })

    except Exception as e:
        logging.error(f"LLM request failed: {e}", exc_info=True)
        return JSONResponse(content={"error": "Web search successful, but LLM request failed"}, status_code=500)

async def stream_unified_response(http_session, payload: dict, url: str, sources: list, stripped: bool = False) -> StreamingResponse:
    def generate_sse():
        sources_json = json.dumps(sources)
        yield f"event: sources\ndata: {sources_json}\n\n"
        
        try:
            with http_session.post(url, json=payload, stream=True, timeout=90) as response:
                response.raise_for_status()
                for line_bytes in response.iter_lines():
                    if line_bytes and line_bytes.startswith(b"data:"):
                        data_str = line_bytes.decode('utf-8').split("data: ", 1)[1]
                        try:
                            content_token = json.loads(data_str).get("content", "")
                            if stripped:
                                content_token = strip_markdown_and_emojis(content_token)
                            yield f"event: token\ndata: {json.dumps(content_token)}\n\n"
                        except json.JSONDecodeError:
                            logging.warning(f"Could not decode JSON from LLM stream: {data_str}")
        except requests.exceptions.RequestException as e:
            logging.error(f"Stream connection to LLM failed: {e}")
            error_payload = json.dumps({"error": "LLM connection failed."})
            yield f"event: error\ndata: {error_payload}\n\n"
        except Exception as e:
            logging.error(f"Streaming proxy error: {e}")
            error_payload = json.dumps({"error": "Internal stream error."})
            yield f"event: error\ndata: {error_payload}\n\n"
        
        yield "event: end\ndata: {}\n\n"

    return StreamingResponse(generate_sse(), media_type='text/event-stream')

async def handle_non_streaming_llm_response(http_session, payload: dict, url: str) -> dict:
    start_time = time.monotonic()
    response = http_session.post(url, json=payload, timeout=120)
    logging.info(f"LLM API call took {time.monotonic() - start_time:.4f} seconds.")
    response.raise_for_status()
    return response.json()

async def voice_create_llm_payload(prompt: str, stream: bool, llm_config: dict = None) -> dict:
    if llm_config is None:
        print("No LLM config provided, using defaults.")
        llm_config = {}
    return {
        "prompt": prompt,
        "n_predict": llm_config.get("n_predict", 512),
        "temperature": llm_config.get("temperature", 0.7),
        "stop": ["\nHuman:", "<|eot_id|>"],
        "stream": stream
    }

async def voice_stream_unified_response(client, payload: dict, url: str, sources: list):
    async def generate_sse():
        try:
            async with client.stream("POST", url, json=payload) as response:
                response.raise_for_status()
                async for line_bytes in response.aiter_lines():
                    if line_bytes.startswith("data:"):
                        data_str = line_bytes.split("data: ", 1)[1]
                        yield f"data: {data_str}\n\n"
        except Exception as e:
            error_payload = json.dumps({"error": "LLM connection failed."})
            yield f"event: error\ndata: {error_payload}\n\n"

        yield "event: end\ndata: {}\n\n"

    return StreamingResponse(generate_sse(), media_type="text/event-stream")