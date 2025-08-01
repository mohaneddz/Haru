import requests
from flask import Flask, request, jsonify, Response, stream_with_context
import asyncio
import logging
from urllib.parse import urlparse
import json # Import json for parsing
from constants import *
from classes import *
from web import *
from utils import (
    process_crawled_results,
    build_search_context,
    build_llm_payload,
    handle_llm_response
)
from flask_cors import CORS

content_extractor = None

app = Flask(__name__)
CORS(app, origins="*", supports_credentials=True,
      allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
      expose_headers=["Content-Type"])
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# ==============================================================================
# FLASK ENDPOINTS
# ==============================================================================

@app.route("/ask_search", methods=["POST"])
def ask_with_search():
    data = request.get_json()
    if not data or "prompt" not in data:
        return jsonify({"error": "Missing 'prompt'"}), 400

    query = data["prompt"]
    stream = data.get("stream", False)

    try:
        # Restore original crawling logic
        urls = get_web_urls(query)
        if not urls:
            return jsonify({"error": "Web search returned no results."}), 500

        crawled_data = asyncio.run(crawl_webpages_hybrid(urls))
        if not crawled_data:
            return jsonify({"error": "Crawling failed to retrieve any content."}), 500

        if not content_extractor or not content_extractor.model:
            return jsonify({"error": "Could not load the semantic search model."}), 500

        processed_results = process_crawled_results(crawled_data, query, content_extractor)
        if not processed_results:
            return jsonify({"content": "I found some web pages, but none contained specific information relevant to your question."}), 200

        search_context, golden_source_info, context_len, final_tokens, supporting_sources = build_search_context(processed_results, query, content_extractor)
        payload = build_llm_payload(search_context, query, data, supporting_sources)
        return handle_llm_response(payload, stream, processed_results, golden_source_info, context_len, final_tokens)

    except Exception as e:
        logging.error(f"Error during ask_search: {e}", exc_info=True)
        return jsonify({"error": f"An error occurred: {e}"}), 500
    
@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        stream = data.get("stream", False)
        user_message = data.get('message')
        chat_history = data.get('history', [])

        if not user_message:
            return jsonify({"error": "No message provided"}), 400

        logging.info(f"Processing message: '{user_message[:50]}...' (history: {len(chat_history)} messages)")

        # Compose prompt for LLM
        prompt = ""
        for turn in chat_history:
            role = turn.get("role", "user")
            content = turn.get("content", "")
            prompt += f"{role.capitalize()}: {content}\n"
        prompt += f"User: {user_message}\nAssistant:"

        token_count = content_extractor.count_tokens(prompt) if content_extractor else len(prompt.split())

        llama_payload = {
            "prompt": prompt,
            "n_predict": 512,
            "temperature": 0.7,
            "stop": ["\nUser:", "User:", "<end_of_turn>", "<|eot_id|>"],  # <-- Add these stop sequences
            "stream": stream
        }

        LLAMA_URL = LLAMA_SERVER_URL if LLAMA_SERVER_URL.startswith("http") else "http://localhost:8080/completion"

        if stream:
            # This nested function will be our clean, reliable stream proxy.
            # We pass the payload and URL as arguments to avoid any scope issues.
            def generate_sse_proxy(payload_to_send, url_to_use):
                """
                Acts as a simple, robust proxy for the SSE stream from the LLM server.
                It forwards valid data lines directly to the client without parsing them.
                """
                try:
                    # Open a streaming connection to the LLM server
                    with requests.post(url_to_use, json=payload_to_send, stream=True, timeout=90) as response:
                        # Immediately check for HTTP errors (e.g., 404, 500, 502)
                        response.raise_for_status()

                        # Use `iter_lines` to process the stream line by line.
                        # This automatically handles buffering and is much safer than iter_content.
                        for line_bytes in response.iter_lines():
                            if line_bytes:
                                line_str = line_bytes.decode('utf-8')
                                
                                # The Llama.cpp server sends lines like "data: {...}".
                                # We only need to forward these valid data lines.
                                if line_str.startswith("data:"):
                                    # Yield the original line plus the required SSE terminator.
                                    # This forwards the JSON object perfectly.
                                    yield f"{line_str}\n\n"

                except requests.exceptions.RequestException as e:
                    logging.error(f"Failed to connect to LLM server during stream: {e}")
                    # Create and send a properly formatted SSE error message
                    error_payload = json.dumps({"error": "The connection to the language model failed."})
                    yield f"data: {error_payload}\n\n"
                except Exception as e:
                    logging.error(f"An unexpected error occurred in the streaming proxy: {e}")
                    error_payload = json.dumps({"error": "An internal server error occurred during the stream."})
                    yield f"data: {error_payload}\n\n"

            # Call the proxy function and return its response
            return Response(stream_with_context(generate_sse_proxy(llama_payload, LLAMA_SERVER_URL)), mimetype='text/event-stream')

        else:
            try:
                response = requests.post(LLAMA_URL, json=llama_payload, timeout=90)
                response.raise_for_status()
                content = response.json().get("content", "")
                return jsonify({
                    "content": content.strip(),
                    "tokens": token_count
                })
            except requests.exceptions.RequestException as e:
                logging.error(f"Chat backend error: {str(e)}", exc_info=True)
                return jsonify({"error": "Backend connection failed"}), 502

    except Exception as e:
        logging.error(f"Chat endpoint error: {str(e)}", exc_info=True)
        return jsonify({"error": "Internal server error"}), 500


if __name__ == "__main__":
    print("Pre-loading semantic search model for the application...")
    content_extractor = ContentExtractor() 
    app.run(port=5000, debug=False)