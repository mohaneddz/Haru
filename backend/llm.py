import json
import logging
import requests
import time
import re
import emoji
from flask import  Response, stream_with_context

http_session = requests.Session()

def create_llm_payload(prompt: str, stream: bool, llm_config: dict = None) -> dict:
    """Creates the payload dictionary for the LLM API request."""
    if llm_config is None:
        llm_config = {}
    return {
        "prompt": prompt,
        "n_predict": llm_config.get("n_predict", 512),
        "temperature": llm_config.get("temperature", 0.7),
        "stop": llm_config.get("stop", ["\nUser:", "User:", "<end_of_turn>", "<|eot_id|>", "\n###", "\nHuman:", "Human:"]),
        "stream": stream
    }

def strip_markdown_and_emojis(text: str) -> str:
    """
    Removes Markdown formatting and emojis from the given text.
    """
    # Remove Markdown (basic patterns for bold, italic, links, etc.)
    text = re.sub(r'\*\*.*?\*\*', '', text)  # Remove bold (**text**)
    text = re.sub(r'\*.*?\*', '', text)      # Remove italic (*text*)
    text = re.sub(r'`.*?`', '', text)       # Remove inline code (`text`)
    text = re.sub(r'\[.*?\]\(.*?\)', '', text)  # Remove links ([text](url))
    text = re.sub(r'#+\s.*', '', text)      # Remove headers (# Header)

    # Remove emojis using the emoji library
    text = emoji.replace_emoji(text, replace='')

    return text

def stream_unified_response(payload: dict, url: str, sources: list, stripped: bool = False) -> Response:
    """
    Handles streaming a unified response format (sources, then tokens) via SSE.
    """
    def generate_sse():
        # 1. Send the sources event first
        sources_json = json.dumps(sources)
        yield f"event: sources\ndata: {sources_json}\n\n"
        
        # 2. Stream the LLM tokens
        try:
            with http_session.post(url, json=payload, stream=True, timeout=90) as response:
                response.raise_for_status()
                for line_bytes in response.iter_lines():
                    if line_bytes and line_bytes.startswith(b"data:"):
                        # Extract the JSON part of the SSE message
                        data_str = line_bytes.decode('utf-8').split("data: ", 1)[1]
                        try:
                            # Extract the 'content' token from the LLM's JSON response
                            content_token = json.loads(data_str).get("content", "")
                            if stripped:
                                content_token = strip_markdown_and_emojis(content_token)
                            # Yield our custom 'token' event
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
        
        # 3. Signal the end of the stream
        yield "event: end\ndata: {}\n\n"

    return Response(stream_with_context(generate_sse()), mimetype='text/event-stream')

def handle_non_streaming_llm_response(payload: dict, url: str) -> dict:
    """Handles a standard, non-streaming request to the LLM."""
    start_time = time.monotonic()
    response = http_session.post(url, json=payload, timeout=120)
    logging.info(f"LLM API call took {time.monotonic() - start_time:.4f} seconds.")
    response.raise_for_status()
    return response.json()

def stream_llm_raw_sse(payload: dict, url: str) -> Response:
    """
    Acts as a direct proxy for the LLM's Server-Sent Events (SSE) stream.
    """
    def generate_raw_sse():
        try:
            with http_session.post(url, json=payload, stream=True, timeout=90) as response:
                response.raise_for_status()
                # Forward each line from the LLM server directly to the client
                for line_bytes in response.iter_lines():
                    if line_bytes:
                        yield line_bytes + b'\n' # iter_lines strips newlines, so we add it back

        except requests.exceptions.RequestException as e:
            logging.error(f"Raw SSE stream connection to LLM failed: {e}")
            # Send a final error message in the format the client might expect
            error_content = json.dumps({"content": f" Error: Could not connect to LLM. {e}"})
            yield f"data: {error_content}\n\n".encode('utf-8')
            yield f"event: end\ndata: {{}}\n\n".encode('utf-8') # Signal end
        except Exception as e:
            logging.error(f"Raw SSE streaming proxy error: {e}")
            error_content = json.dumps({"content": f" Error: Internal stream error. {e}"})
            yield f"data: {error_content}\n\n".encode('utf-8')
            yield f"event: end\ndata: {{}}\n\n".encode('utf-8') # Signal end

    return Response(stream_with_context(generate_raw_sse()), mimetype='text/event-stream')

def voice_create_llm_payload(prompt: str, stream: bool, llm_config: dict = None) -> dict:
    """Creates the JSON payload for the Llama.cpp server."""
    if llm_config is None:
        llm_config = {}
    return {
        "prompt": prompt,
        "n_predict": llm_config.get("n_predict", 512),
        "temperature": llm_config.get("temperature", 0.7),
        "stop": ["\nHuman:", "<|eot_id|>"],
        "stream": stream
    }

def voice_stream_unified_response(payload: dict, url: str, sources: list) -> Response:
    """Streams the LLM response back to the client using Server-Sent Events (SSE)."""
    def generate_sse():
        try:
            # POST request to the Llama.cpp server with streaming enabled
            with http_session.post(url, json=payload, stream=True, timeout=120) as response:
                response.raise_for_status()
                logging.info("Successfully connected to Llama.cpp stream.")
                
                for line_bytes in response.iter_lines():
                    if line_bytes and line_bytes.startswith(b"data:"):
                        # Extract the JSON data part of the SSE message
                        data_str = line_bytes.decode('utf-8').split("data: ", 1)[1]
                        try:
                            # Send the raw data chunk back to our client
                            yield f"data: {data_str}\n\n"
                        except json.JSONDecodeError:
                            logging.warning(f"Could not decode JSON from LLM stream: {data_str}")
        except requests.exceptions.RequestException as e:
            logging.error(f"Stream connection to LLM failed: {e}")
            error_payload = json.dumps({"error": "LLM connection failed."})
            yield f"event: error\ndata: {error_payload}\n\n"
        
        # Signal the end of the stream to the client
        yield "event: end\ndata: {}\n\n"
        logging.info("LLM stream finished.")

    return Response(stream_with_context(generate_sse()), mimetype='text/event-stream')
