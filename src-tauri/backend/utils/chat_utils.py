# utils/chat_utils.py
import orjson  # Import orjson
import httpx
import logging
import time
from fastapi.responses import StreamingResponse

def create_llm_payload(prompt: str, stream: bool, llm_config: dict = None) -> dict:
    """This function remains unchanged."""
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

async def handle_non_streaming_llm_response(client: httpx.AsyncClient, payload: dict, url: str) -> dict:
    """Handles a non-streaming request using the async httpx client."""
    start_time = time.monotonic()
    response = await client.post(url, json=payload, timeout=120)
    response.raise_for_status()
    # Use orjson to load the response, which will be faster
    return orjson.loads(response.content)

async def stream_unified_response(client: httpx.AsyncClient, payload: dict, url: str, sources: list) -> StreamingResponse:
    """Handles streaming using httpx and orjson for max performance."""
    async def generate_sse():
        start_time = time.monotonic()
        first_token_time = None
        
        # Use orjson.dumps which is faster than json.dumps. It returns bytes.
        sources_json_bytes = orjson.dumps(sources)
        yield f"event: sources\ndata: {sources_json_bytes.decode('utf-8')}\n\n"

        try:
            async with client.stream("POST", url, json=payload, timeout=90) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line and line.startswith("data:"):
                        if first_token_time is None:
                            first_token_time = time.monotonic()
                            logging.info(f"Time to first token: {first_token_time - start_time:.4f} seconds.")
                        
                        data_str = line.split("data: ", 1)[1]
                        try:
                            # OPTIMIZATION: use orjson for both loading and dumping
                            content_token = orjson.loads(data_str).get("content", "")
                            token_json_bytes = orjson.dumps(content_token)
                            yield f"event: token\ndata: {token_json_bytes.decode('utf-8')}\n\n"
                        except orjson.JSONDecodeError:
                            logging.warning(f"Could not decode JSON from LLM stream: {data_str}")

        except httpx.RequestError as e:
            error_json_bytes = orjson.dumps({'error': 'LLM connection failed.'})
            logging.error(f"Stream connection failed: {e}")
            yield f"event: error\ndata: {error_json_bytes.decode('utf-8')}\n\n"

        except Exception as e:
            error_json_bytes = orjson.dumps({'error': 'Internal stream error.'})
            logging.error(f"Streaming error: {e}")
            yield f"event: error\ndata: {error_json_bytes.decode('utf-8')}\n\n"

        # The end event has no complex data, standard json is fine or just hardcode
        yield "event: end\ndata: {}\n\n"

    return StreamingResponse(generate_sse(), media_type='text/event-stream')