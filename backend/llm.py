import json
import logging
import requests
import time
from flask import  Response, stream_with_context

http_session = requests.Session()


def create_llm_payload(prompt: str, stream: bool, llm_config: dict = None) -> dict:
    """Creates the payload dictionary for the LLM API request."""
    if llm_config is None:
        llm_config = {}
    if not isinstance(llm_config, dict):
        logging.warning(f"llm_config was not a dict, but {type(llm_config)}. Using defaults.")
        llm_config = {}
        
    return {
        "prompt": prompt,
        "n_predict": llm_config.get("n_predict", 512),
        "temperature": llm_config.get("temperature", 0.7),
        "stop": llm_config.get("stop", ["\nUser:", "User:", "<end_of_turn>", "<|eot_id|>", "\n###", "\nHuman:", "Human:"]),
        "stream": stream
    }

def stream_unified_response(payload: dict, url: str, sources: list) -> Response:
    """
    Handles streaming a unified response format via SSE, designed to be consumed by our voice websocket backend.
    """
    def generate_sse():
        # This function is now simplified. The websocket server will manage state.
        # This stream will just send response tokens and signal the end.
        try:
            with http_session.post(url, json=payload, stream=True, timeout=90) as response:
                response.raise_for_status()
                for line_bytes in response.iter_lines():
                    if line_bytes and line_bytes.startswith(b"data:"):
                        data_str = line_bytes.decode('utf-8').split("data: ", 1)[1]
                        try:
                            # Extract the 'content' token from the LLM's JSON response
                            content_token = json.loads(data_str).get("content", "")
                            
                            # Send a JSON object with a 'response' key.
                            response_payload = json.dumps({"response": content_token})
                            yield f"data: {response_payload}\n\n"
                        except json.JSONDecodeError:
                            logging.warning(f"Could not decode JSON from LLM stream: {data_str}")

        except requests.exceptions.RequestException as e:
            logging.error(f"Stream connection to LLM failed: {e}")
            error_payload = json.dumps({"error": "LLM connection failed."})
            yield f"data: {error_payload}\n\n"
        
        # Signal the end of the stream with a specific JSON structure.
        yield f"data: {json.dumps({'state': 'end_of_stream'})}\n\n"

    return Response(stream_with_context(generate_sse()), mimetype='text/event-stream')


def handle_non_streaming_llm_response(payload: dict, url: str) -> dict:
    """Handles a standard, non-streaming request to the LLM."""
    start_time = time.monotonic()
    response = http_session.post(url, json=payload, timeout=120)
    logging.info(f"LLM API call took {time.monotonic() - start_time:.4f} seconds.")
    response.raise_for_status()
    return response.json()
