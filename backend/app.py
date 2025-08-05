import os
import logging
import re
import threading
from pathlib import Path
import time
import asyncio
from constants import LLAMA_SERVER_URL
from classes import client
from llm import create_llm_payload, stream_unified_response, handle_non_streaming_llm_response, voice_create_llm_payload, voice_stream_unified_response
import sys

# --- New Imports for Voice Functionality ---

import subprocess
import requests
from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
from web import *
from utils import (
    process_crawled_results,
    build_search_context,
    build_llm_payload,
)

content_extractor = None
main_process = None

# ======================================================================================
# --- CONFIGURATION (via Environment Variables with Defaults) ---
# ======================================================================================

def get_env(variable_name, default_value):
    """Gets an environment variable or returns a default."""
    return os.environ.get(variable_name, default_value)

# --- Llama Server Management ---
def run_llama_server():
    """Starts the llama-server.exe as a background process."""
    global main_process
    try:
        logging.info("Starting llama-server...")
        main_process = subprocess.Popen([
            "lib/llama-server.exe",
            "-m", "models/gemma-3-4b-it-q4_0.gguf",
            "-ngl", "99",
            "-c", "8192",
            "-t", "6",
            "--port", "8080"
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL)
        
        time.sleep(5) # Give it time to initialize
        logging.info("✅ Llama server appears to be running.")
    except Exception as e:
        logging.error(f"❌ Error running llama-server: {e}", file=sys.stderr)
        sys.exit(1)

def kill_llama_server():
    """Terminates the llama-server.exe process."""
    global main_process
    if main_process:
        logging.info("Terminating llama-server...")
        main_process.terminate()
        try:
            main_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            main_process.kill()
        main_process = None
        logging.info("✅ Llama server terminated.")


# --- Logging Configuration ---
app = Flask(__name__)
CORS(app, origins="*", supports_credentials=True,
      allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
      expose_headers=["Content-Type"])
logging.basicConfig(level=logging.ERROR, format='%(asctime)s - %(levelname)s - %(message)s')

# Log received requests explicitly
@app.before_request
def log_request():
    logging.info(f"Received {request.method} request at {request.path}")

# ======================================================================================
# --- FLASK APPLICATION & ENDPOINTS ---
# ======================================================================================

# --- Chat Endpoint ---
@app.route('/chat', methods=['POST'])
def chat_endpoint():
    """Main endpoint for direct chat functionality."""
    try:
        data = request.get_json()
        user_message = data.get('message')
        chat_history = data.get('history', [])
        stream = data.get("stream", False)

        if not user_message:
            return jsonify({"error": "No message provided"}), 400
        
        prompt = ""
        for turn in chat_history:
            prompt += f"{turn.get('role', 'user').capitalize()}: {turn.get('content', '')}\n"
        prompt += f"User: {user_message}\nAssistant:"

        llama_payload = create_llm_payload(prompt, stream)
        
        if stream:
            # For chat, the sources list is always empty.
            return stream_unified_response(llama_payload, config.LLAMA_SERVER_URL, sources=[])
        else:
            response_data = handle_non_streaming_llm_response(llama_payload, config.LLAMA_SERVER_URL)
            content = response_data.get("content", "").strip()
            return jsonify({
                "content": content,
                "sources": []
            })

    except requests.exceptions.RequestException as e:
        logging.error(f"Chat backend connection error: {e}", exc_info=True)
        return jsonify({"error": "Backend connection failed"}), 502
    except Exception as e:
        logging.error(f"General chat endpoint error: {e}", exc_info=True)
        return jsonify({"error": "An internal server error occurred"}), 500

# --- Web Search Endpoint ---
@app.route("/ask_search", methods=["POST"])
def ask_with_search():
    data = request.get_json()
    if not data or "prompt" not in data:
        return jsonify({"error": "Missing 'prompt'"}), 400

    query = data["prompt"]
    stream = data.get("stream", False)

    try:
        urls = get_web_urls(query)
        if not urls:
            return jsonify({"content": "Web search returned no results.", "sources": []}), 500

        crawled_data = asyncio.run(crawl_webpages_hybrid(urls))
        if not crawled_data:
            return jsonify({"content": "Crawling failed to retrieve any content.", "sources": []}), 500

        if not content_extractor or not content_extractor.model:
            return jsonify({"error": "Could not load the semantic search model."}), 500

        processed_results = process_crawled_results(crawled_data, query, content_extractor)
        if not processed_results:
             return jsonify({
                "content": "I found some web pages, but none contained specific information relevant to your question.",
                "sources": []
             }), 200

        final_sources = [{
            "title": source.get("title", "No Title Available"),
            "url": source.get("url"),
            "score": round(source.get("score", 0.0), 4),
            "path": "",
            "section": ""
        } for source in processed_results]

        search_context, _, _, _, supporting_sources = build_search_context(processed_results, query, content_extractor)
        payload = build_llm_payload(search_context, query, data, supporting_sources)
        payload['stream'] = stream

        if stream:
            return stream_unified_response(payload, config.LLAMA_SERVER_URL, final_sources)
        else:
            llm_response = handle_non_streaming_llm_response(payload, config.LLAMA_SERVER_URL)
            final_answer = llm_response.get("content", "").strip()

            return jsonify({
                "content": final_answer,
                "sources": final_sources
            })

    except Exception as e:
        logging.error(f"Error during ask_search: {e}", exc_info=True)
        return jsonify({"error": f"An error occurred: {e}"}), 500

# --- RAG Endpoint ---
@app.route("/rag", methods=["POST"])
def rag_query_endpoint():
    """Handles a RAG query, retrieves context, and generates a response."""
    try:
        query_data = request.get_json()
        query = query_data.get("query")
        stream = query_data.get("stream", False)
        use_advanced_prompt = query_data.get("use_advanced_prompt", True)
        llm_config = query_data.get("llm_config", {})

        if not query:
            return jsonify({"error": "Query is missing"}), 400

        retrieved_chunks = rag_system.retrieve_context(query)
        unique_contents = set()
        deduplicated_chunks = [
            chunk for chunk in retrieved_chunks
            if chunk['content'] not in unique_contents and not unique_contents.add(chunk['content'])
        ]

        if not deduplicated_chunks:
            return jsonify({
                "content": "I could not find any relevant documents to answer your question.",
                "sources": []
            })

        final_sources = [{
            "title": "", "url": "", "path": chunk['source'],
            "section": chunk.get('id', f"chunk_{i}"), "score": round(chunk['score'], 4)
        } for i, chunk in enumerate(deduplicated_chunks)]

        context_parts = [f"[Source {i+1}: {Path(c['source']).name}]\n{c['content']}" for i, c in enumerate(deduplicated_chunks)]
        context_string = "\n---\n".join(context_parts)
        template = config.LLM_PROMPT_TEMPLATE_ADVANCED if use_advanced_prompt else config.LLM_PROMPT_TEMPLATE_BASIC
        full_prompt = template.format(context=context_string, query=query)

        payload = create_llm_payload(full_prompt, stream=stream, llm_config=llm_config)

        if stream:
            return stream_unified_response(payload, config.LLAMA_SERVER_URL, final_sources)
        else:
            llm_data = handle_non_streaming_llm_response(payload, config.LLAMA_SERVER_URL)
            final_answer = llm_data.get("content", "").strip()
            final_answer = re.sub(r'(\[Source \d+\])\1+', r'\1', final_answer)
            return jsonify({"content": final_answer, "sources": final_sources})

    except requests.exceptions.RequestException as e:
        logging.error(f"RAG request to LLM server failed: {e}", exc_info=True)
        return jsonify({"error": f"Failed to connect to the LLM at {config.LLAMA_SERVER_URL}"}), 502
    except Exception as e:
        logging.error(f"RAG endpoint error: {e}", exc_info=True)
        return jsonify({"error": "An internal RAG error occurred"}), 500

# --- Voice Chat Endpoints ---

@app.route('/voicechat', methods=['POST'])
def voice_chat_endpoint():
    """Endpoint to start the voice client and handle voice chat."""
    # if body says on, start, else close 
    data = request.get_json()
    if not data or 'action' not in data:
        return jsonify({"error": "Missing 'action' parameter"}), 400
    action = data['action'].lower()
    if action == "on":
        client.run()
    elif action == "off":
        client.stop()
    else:
        return jsonify({"error": "Invalid 'action' parameter"}), 400

@app.route('/voice', methods=['POST'])
def voice_endpoint():
    """The one and only endpoint. Handles chat requests and streams responses."""
    try:
        data = request.get_json()
        user_message = data.get('message')
        chat_history = data.get('history', [])
        stream = data.get("stream", False) # We'll set this to True from the client
        
        if not user_message:
            return jsonify({"error": "No message provided"}), 400
        
        prompt = "You are a helpful AI assistant. Respond naturally and conversationally.\n\n"
        for turn in chat_history[-10:]:
            role = turn.get('role', 'user')
            content = turn.get('content', '')
            prompt += f"{'Human' if role == 'user' else 'Assistant'}: {content}\n"
        prompt += f"Human: {user_message}\nAssistant:"
        
        # We will always use the streaming capability of this server
        llama_payload = voice_create_llm_payload(prompt, True)
        return voice_stream_unified_response(llama_payload, LLAMA_SERVER_URL, sources=[])
            
    except Exception as e:
        logging.error(f"General chat endpoint error: {e}", exc_info=True)
        return jsonify({"error": "An internal server error occurred"}), 500

@app.route('/transcribe', methods=['GET'])
def stream_transcription():
    def event_stream():
        last_text = ""
        while True:
            current = client.transcription
            if current != last_text:
                yield f"data: {current}\n\n"
                last_text = current
            time.sleep(0.5)  # minimal overhead
    return Response(event_stream(), mimetype='text/event-stream')

@app.route('/response', methods=['GET'])
def stream_response():
    def event_stream():
        last_text = ""
        while True:
            current = client.response
            if current != last_text:
                yield f"data: {current}\n\n"
                last_text = current
            time.sleep(0.5)  # minimal overhead
    return Response(event_stream(), mimetype='text/event-stream')

# --- Management & Status Endpoints ---

@app.route("/start-llama-server", methods=["POST"])
def start_llama_server_endpoint():
    """Starts the llama-server if it's not already running."""
    if main_process and main_process.poll() is None:
        return jsonify({"message": "Llama server is already running."}), 200
    
    run_llama_server()
    return jsonify({"message": "Llama server started successfully."}), 200

@app.route("/stop-llama-server", methods=["POST"])
def stop_llama_server_endpoint():
    """Stops the llama-server if it's running."""
    if not main_process or main_process.poll() is not None:
        return jsonify({"message": "Llama server is not running."}), 200
    
    kill_llama_server()
    return jsonify({"message": "Llama server stopped successfully."}), 200

@app.route("/health", methods=["GET"])
def health_check_endpoint():
    """Performs a health check on the service and its dependencies."""
    try:
        # Check LLM Server
        llm_status = "ok" if http_session.get(config.LLAMA_SERVER_URL, timeout=5).ok else "unavailable"
    except requests.exceptions.RequestException:
        llm_status = "unavailable"
    
    try: # Check Vector DB
        rag_system.collection.count()
        db_status = "ok"
    except Exception:
        db_status = "error"
        
    is_healthy = llm_status == "ok" and db_status == "ok"
    status_code = 200 if is_healthy else 503
    
    return jsonify({
        "status": "ok" if is_healthy else "error",
        "dependencies": {"llm_server": llm_status, "vector_database": db_status}
    }), status_code

@app.route("/status", methods=["GET"])
def get_system_status_endpoint():
    """Returns basic status information about the RAG system."""
    return jsonify(rag_system.get_status())

@app.route("/documents", methods=["GET"])
def list_indexed_documents_endpoint():
    """Returns a list of all source files currently in the index."""
    try:
        return jsonify({"documents": rag_system.get_indexed_documents()})
    except Exception as e:
        logging.error(f"Failed to list documents: {e}", exc_info=True)
        return jsonify({"error": "Failed to retrieve document list"}), 500

@app.route("/rebuild-index", methods=["POST"])
def rebuild_index_endpoint():
    """Triggers a full rebuild of the vector index in a background thread."""
    thread = threading.Thread(target=rag_system.build_index_from_directory, kwargs={"force_rebuild": True})
    thread.start()
    return jsonify({"message": "Index rebuild process started in the background."}), 202

@app.route("/persist-index", methods=["POST"])
def persist_index_endpoint():
    """Forces the vector database to save its current state to disk."""
    rag_system.persist_index()
    return jsonify({"message": "Index has been persisted to disk."}), 200

# ======================================================================================
# --- APPLICATION STARTUP ---
# ======================================================================================

def warmup_llm_server():
    """Sends a dummy request to the LLM server to trigger model loading."""
    logging.info("🚀 Warming up LLM server... This may take a moment.")
    start_time = time.monotonic()
    try:
        payload = create_llm_payload("User: Hello\nAssistant:", stream=False, llm_config={"n_predict": 10})
        http_session.post(config.LLAMA_SERVER_URL, json=payload, timeout=180).raise_for_status()
        duration = time.monotonic() - start_time
        logging.info(f"✅ LLM Server is warm. Model loaded in {duration:.2f} seconds.")
    except requests.exceptions.RequestException as e:
        logging.error(f"❌ Failed to warm up LLM server: {e}")
        logging.error("   Please ensure the LLM server is running and accessible at " + config.LLAMA_SERVER_URL)

if __name__ == "__main__":
    # Ensure document directory exists
    content_extractor = ContentExtractor() 
    Path(config.DOCUMENTS_DIR).mkdir(exist_ok=True)
    
    # Run the warm-up routine for the LLM server
    run_llama_server()
    warmup_llm_server()
    
    # Start background tasks for initial indexing and file watching
    # These run as daemons, so they won't block app shutdown
    threading.Thread(target=rag_system.build_index_from_directory, daemon=True).start()
    threading.Thread(target=start_watcher, args=(rag_system,), daemon=True).start()
    
    # Start the Flask server
    # For production, use a proper WSGI server like Gunicorn or Waitress.
    # Example: gunicorn --workers 4 --bind 0.0.0.0:5000 app:app
    app.run(port=5000, host="0.0.0.0", debug=False, threaded=True)