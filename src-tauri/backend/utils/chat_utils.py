# utils/chat_utils.py
import orjson
import httpx
import logging
import time
import base64
import mimetypes
import os
from fastapi.responses import StreamingResponse

logger = logging.getLogger(__name__)

def create_llm_payload(messages: list, stream: bool, llm_config: dict = None) -> dict:
    """
    Create OpenAI-compatible payload for text-only or already-constructed messages.
    messages: list of dicts: {"role": "user"/"assistant"/"system", "content": <string or content-list>}
    """
    if llm_config is None:
        llm_config = {}

    payload = {
        "model": llm_config.get("model", "your-model-name"),
        "messages": messages,
        "temperature": llm_config.get("temperature", 0.7),
        "max_tokens": llm_config.get("max_tokens", 512),
        "stream": stream
    }
    return payload

def create_llm_payload_with_image(messages: list, image_path: str, stream: bool, llm_config: dict = None) -> dict:
    """
    Insert image into the last user message in `messages` (openai-chat style).
    - If last user message content is a string, it will be converted into:
        [{"type":"text","text": "<original string>"}, {"type":"image_url", "image_url": {"url": "data:...;base64,..."}}]
    - If last user content is already a list, the image part will be appended.
    """
    if llm_config is None:
        llm_config = {}

    mime_type, _ = mimetypes.guess_type(image_path)
    if mime_type is None:
        mime_type = "image/jpeg"

    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found: {image_path}")

    with open(image_path, "rb") as f:
        image_b64 = base64.b64encode(f.read()).decode("utf-8")

    data_url = f"data:{mime_type};base64,{image_b64}"
    image_part = {
        "type": "image_url",
        "image_url": {"url": data_url}
    }

    # Modify last user message (prefer last occurrence of a user role)
    last_user_idx = None
    for i in range(len(messages) - 1, -1, -1):
        if messages[i].get("role") == "user":
            last_user_idx = i
            break

    if last_user_idx is None:
        # No user message found — add one
        messages.append({"role": "user", "content": [{"type": "text", "text": ""}, image_part]})
    else:
        last = messages[last_user_idx]
        content = last.get("content", "")
        if isinstance(content, str):
            # convert to content array
            last["content"] = [{"type": "text", "text": content}, image_part]
        elif isinstance(content, list):
            # append image object
            last["content"].append(image_part)
        else:
            # fallback: replace with array
            last["content"] = [{"type": "text", "text": ""}, image_part]

    payload = {
        "model": llm_config.get("model", "your-model-name"),
        "messages": messages,
        "temperature": llm_config.get("temperature", 0.7),
        "max_tokens": llm_config.get("max_tokens", 512),
        "stream": stream
    }
    return payload

async def handle_non_streaming_llm_response(client: httpx.AsyncClient, payload: dict, url: str) -> dict:
    """
    Send non-streaming request to llama server and normalize response to {'content': str, ...}
    """
    start_time = time.monotonic()
    resp = await client.post(url, json=payload, timeout=120)
    resp.raise_for_status()
    obj = orjson.loads(resp.content)

    # Normalize content extraction for OpenAI-compatible responses
    content = ""
    # Try several known shapes
    if isinstance(obj, dict):
        # first: choices -> message -> content
        choices = obj.get("choices")
        if choices and isinstance(choices, list):
            parts = []
            for c in choices:
                # prefer message.content
                msg = c.get("message", {})
                if isinstance(msg, dict) and msg.get("content"):
                    parts.append(msg.get("content"))
                elif c.get("text"):
                    parts.append(c.get("text"))
                # legacy: delta or content root
                elif c.get("delta") and isinstance(c.get("delta"), dict):
                    parts.append(c["delta"].get("content", ""))
            content = "".join(parts).strip()
        # fallback: content field at top-level
        elif obj.get("content"):
            content = obj.get("content", "")
        # another fallback: text
        elif obj.get("text"):
            content = obj.get("text", "")
    else:
        content = str(obj)

    total_time = time.monotonic() - start_time
    logger.info(f"Non-stream request completed in {total_time:.3f}s")
    return {"content": content, "raw": obj}

async def stream_unified_response(client: httpx.AsyncClient, payload: dict, url: str, sources: list) -> StreamingResponse:
    """
    Stream SSE events to the client. Expects OpenAI-compatible server SSE like:
    data: { ... } lines and final data: [DONE]
    Emits SSE events:
    - event: sources -> the sources list
    - event: token   -> token piece (string)
    - event: end
    - event: error
    """
    async def generate_sse():
        # send sources first
        try:
            yield f"event: sources\ndata: {orjson.dumps(sources).decode('utf-8')}\n\n"
            async with client.stream("POST", url, json=payload, timeout=10) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if not line:
                        continue
                    # OpenAI-style stream: lines like "data: {json}" or "data: [DONE]"
                    if line.startswith("data: "):
                        data_str = line[len("data: "):].strip()
                        if data_str == "[DONE]":
                            break
                        try:
                            obj = orjson.loads(data_str)
                        except Exception:
                            logger.warning("Could not parse stream JSON chunk.")
                            continue

                        # Extract token(s) robustly
                        token_piece = ""
                        choices = obj.get("choices", [])
                        if choices and isinstance(choices, list):
                            # concatenate all choice delta/message parts
                            parts = []
                            for c in choices:
                                delta = c.get("delta", {})
                                if isinstance(delta, dict) and delta.get("content"):
                                    parts.append(delta.get("content"))
                                else:
                                    # try choice.message.content (non-stream chunks)
                                    msg = c.get("message", {})
                                    if isinstance(msg, dict) and msg.get("content"):
                                        parts.append(msg.get("content"))
                                    elif c.get("text"):
                                        parts.append(c.get("text"))
                            token_piece = "".join([p for p in parts if p])
                        else:
                            # fallback shapes
                            if isinstance(obj.get("content"), str):
                                token_piece = obj.get("content")
                            elif obj.get("text"):
                                token_piece = obj.get("text")

                        if token_piece:
                            # send token event
                            yield f"event: token\ndata: {orjson.dumps(token_piece).decode('utf-8')}\n\n"

                # finished streaming
                yield "event: end\ndata: {}\n\n"

        except httpx.RequestError as e:
            logger.error(f"Stream connection failed: {e}")
            err = {"error": "LLM connection failed."}
            yield f"event: error\ndata: {orjson.dumps(err).decode('utf-8')}\n\n"
        except Exception as e:
            logger.error(f"Streaming error: {e}")
            err = {"error": "Internal stream error."}
            yield f"event: error\ndata: {orjson.dumps(err).decode('utf-8')}\n\n"
            yield "event: end\ndata: {}\n\n"

    return StreamingResponse(generate_sse(), media_type='text/event-stream')
