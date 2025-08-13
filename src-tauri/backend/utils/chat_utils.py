import json
import orjson
import httpx
import logging
import time
import base64
import mimetypes
import os
from fastapi.responses import StreamingResponse

logger = logging.getLogger(__name__)

async def create_llm_payload(messages: list, stream: bool, llm_config: dict = None) -> dict:
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

async def create_llm_payload_with_images(messages: list, image_paths: list, stream: bool, llm_config: dict = None) -> dict:
    if llm_config is None:
        llm_config = {}

    image_parts = []
    for image_path in image_paths:
        mime_type, _ = mimetypes.guess_type(image_path)
        if mime_type is None:
            mime_type = "image/jpeg"

        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image not found: {image_path}")

        with open(image_path, "rb") as f:
            image_b64 = base64.b64encode(f.read()).decode("utf-8")

        data_url = f"data:{mime_type};base64,{image_b64}"
        image_parts.append({
            "type": "image_url",
            "image_url": {"url": data_url}
        })

    # Find last user message index
    last_user_idx = None
    for i in range(len(messages) - 1, -1, -1):
        if messages[i].get("role") == "user":
            last_user_idx = i
            break

    if last_user_idx is None:
        # No user message found — add one with all images
        messages.append({"role": "user", "content": [{"type": "text", "text": ""}] + image_parts})
    else:
        last = messages[last_user_idx]
        content = last.get("content", "")
        if isinstance(content, str):
            last["content"] = [{"type": "text", "text": content}] + image_parts
        elif isinstance(content, list):
            last["content"].extend(image_parts)
        else:
            last["content"] = [{"type": "text", "text": ""}] + image_parts

    payload = {
        "model": llm_config.get("model", "your-model-name"),
        "messages": messages,
        "temperature": llm_config.get("temperature", 0.7),
        "max_tokens": llm_config.get("max_tokens", 512),
        "stream": stream
    }
    return payload

async def voice_create_llm_payload(
    messages: list,
    audio_paths: list = None,
    stream: bool = False,
    llm_config: dict = None
) -> dict:
    """
    Create LLM payload for voice-based input (STT text + optional audio attachments).
    messages: list of dicts: {"role": "user"/"assistant"/"system", "content": <string or content-list>}
    audio_paths: list of local audio file paths to attach
    """
    if llm_config is None:
        llm_config = {}
    if audio_paths is None:
        audio_paths = []

    audio_parts = []
    for audio_path in audio_paths:
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        mime_type, _ = mimetypes.guess_type(audio_path)
        if mime_type is None:
            mime_type = "audio/wav"  # default

        with open(audio_path, "rb") as f:
            audio_b64 = base64.b64encode(f.read()).decode("utf-8")

        data_url = f"data:{mime_type};base64,{audio_b64}"
        audio_parts.append({
            "type": "input_audio",
            "audio_url": {"url": data_url}
        })

    # Find last user message index to attach audio
    last_user_idx = None
    for i in range(len(messages) - 1, -1, -1):
        if messages[i].get("role") == "user":
            last_user_idx = i
            break

    if last_user_idx is None:
        # No user message found — add one with all audio
        messages.append({"role": "user", "content": [{"type": "text", "text": ""}] + audio_parts})
    else:
        last = messages[last_user_idx]
        content = last.get("content", "")
        if isinstance(content, str):
            last["content"] = [{"type": "text", "text": content}] + audio_parts
        elif isinstance(content, list):
            last["content"].extend(audio_parts)
        else:
            last["content"] = [{"type": "text", "text": ""}] + audio_parts

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
            local_client = None
            _client = client
            if _client is None:
                local_client = httpx.AsyncClient(timeout=60.0)
                _client = local_client
            try:
                async with _client.stream("POST", url, json=payload, timeout=60.0) as response:
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
                                parts = []
                                for c in choices:
                                    delta = c.get("delta", {})
                                    if isinstance(delta, dict) and delta.get("content"):
                                        parts.append(delta.get("content"))
                                    else:
                                        msg = c.get("message", {})
                                        if isinstance(msg, dict) and msg.get("content"):
                                            parts.append(msg.get("content"))
                                        elif c.get("text"):
                                            parts.append(c.get("text"))
                                token_piece = "".join([p for p in parts if p])
                            else:
                                if isinstance(obj.get("content"), str):
                                    token_piece = obj.get("content")
                                elif obj.get("text"):
                                    token_piece = obj.get("text")

                            if token_piece:
                                yield f"event: token\ndata: {orjson.dumps(token_piece).decode('utf-8')}\n\n"
                # finished streaming
                yield "event: end\ndata: {}\n\n"
            finally:
                if local_client is not None:
                    await local_client.aclose()
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

async def build_llm_payload(search_context: str, query: str, original_payload: dict, supporting_sources: list) -> dict:
    user_prompt_parts = []
    system_prompt = "You are a helpful assistant that provides accurate and concise answers based on the provided context."

    # Add the primary source (highest-ranked search result)
    primary_source = supporting_sources[0] if supporting_sources else {"url": "N/A"}
    user_prompt_parts.append(
        f"**[1] Primary Source:** (URL: {primary_source.get('url')})\n"
        f"```\n{search_context}\n```"
    )

    # Add the supporting evidence
    if len(supporting_sources) > 1:
        user_prompt_parts.append("\n**Supporting Evidence:**")
        for i, source in enumerate(supporting_sources[1:], start=2):
            user_prompt_parts.append(
                f"\n**[{i}] Source:** (URL: {source.get('url')})\n"
                f"```\n{source.get('content', 'Snippet not available.')}\n```"
            )
    
    # Add the user's final query
    user_prompt_parts.append(
        "\n---"
        "\n**User Query:**"
        f"\nBased on the context provided above, please answer the following question: {query}"
    )
    
    user_prompt = "\n".join(user_prompt_parts)

    # 3. Assemble the final messages list
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]

    # 4. Construct the final payload, respecting parameters from the original request
    # This allows users to specify things like temperature, max_tokens, or a specific model.
    llm_payload = {
        "model": original_payload.get("model", "mistral-large-latest"), # Fallback to a default
        "messages": messages,
        "temperature": original_payload.get("temperature", 0.2), # Lower temp for more factual answers
        "max_tokens": original_payload.get("max_tokens", 1500), # Allow for longer, detailed answers
        "stream": original_payload.get("stream", False)
    }

    return llm_payload

async def voice_stream_unified_response(
    stt,
    tts,
    llm_client,
    audio_source,  # mic stream or audio file path
    user_id=None
):
    """
    Streams an LLM response from audio input to both text and TTS audio chunks over SSE.
    """

    async def event_generator():
        try:
            # 1️⃣ Start listening (STT)
            await stt.start_listen(audio_source)
            async for stt_chunk in stt.listen_stream():
                yield f"data: {json.dumps({'event': 'stt_chunk', 'text': stt_chunk})}\n\n"

            # Stop listening once STT done
            await stt.stop_listen()

            # 2️⃣ Get full transcription
            user_text = await stt.get_full_transcription()
            yield f"data: {json.dumps({'event': 'transcription', 'text': user_text})}\n\n"

            # 3️⃣ Send to LLM
            llm_payload = voice_create_llm_payload(user_text, user_id=user_id)
            async for llm_chunk in llm_client.stream(llm_payload):
                if "token" in llm_chunk:
                    yield f"data: {json.dumps({'event': 'token', 'text': llm_chunk['token']})}\n\n"

                    # 4️⃣ Stream TTS for each token
                    async for audio_chunk in tts.stream(llm_chunk['token']):
                        audio_b64 = base64.b64encode(audio_chunk).decode("utf-8")
                        yield f"data: {json.dumps({'event': 'audio_chunk', 'audio': audio_b64})}\n\n"

            # 5️⃣ End of stream
            yield "data: {\"event\": \"end\"}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'event': 'error', 'error': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")