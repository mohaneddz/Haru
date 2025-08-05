import logging
import re
import threading
from pathlib import Path

import requests
from flask import Flask, jsonify, request
from flask_cors import CORS # Added for Cross-Origin Resource Sharing

from classes import Config, RAGSystem, start_watcher

# ======================================================================================
# --- API HELPER FUNCTIONS (Refactored Logic) ---
# ======================================================================================

def retrieve_and_prepare_context(query: str) -> list[dict]:
    """Retrieves and deduplicates context chunks for a given query."""
    retrieved_chunks = rag_system.retrieve_context(query)
    if not retrieved_chunks:
        return []
    
    unique_contents = set()
    deduplicated_chunks = [
        chunk for chunk in retrieved_chunks 
        if chunk['content'] not in unique_contents and not unique_contents.add(chunk['content'])
    ]
    return deduplicated_chunks

def _create_llm_prompt(query: str, retrieved_chunks: list[dict], use_advanced_prompt: bool, config_obj: Config) -> str:
    """Formats the retrieved context and query into a final prompt for the LLM."""
    context_parts = []
    for i, chunk in enumerate(retrieved_chunks):
        filename = Path(chunk['source']).name
        context_parts.append(f"[Source {i+1}: {filename}]\n{chunk['content']}")
    
    context_string = "\n---\n".join(context_parts)
    
    template = config_obj.LLM_PROMPT_TEMPLATE_ADVANCED if use_advanced_prompt else config_obj.LLM_PROMPT_TEMPLATE_BASIC
    return template.format(context=context_string, query=query)

def generate_llm_response(full_prompt: str, llm_config: dict, config_obj: Config) -> str:
    """Sends the prompt to the LLM server and gets a response."""
    payload = {
        "prompt": full_prompt,
        "n_predict": llm_config.get("n_predict", 512),
        "temperature": llm_config.get("temperature", 0.2),
        "stop": llm_config.get("stop", ["\n###", "\nUser:", "<|eot_id|>"]),
        "stream": False
    }
    
    response = requests.post(config_obj.LLAMA_SERVER_URL, json=payload, timeout=120)
    response.raise_for_status()
    
    llm_data = response.json()
    raw_answer = llm_data.get("content", "")
    return re.sub(r'(\[Source \d+\])\1+', r'\1', raw_answer).strip() # Post-process and clean

def _group_sources_for_client(chunks: list[dict]) -> list[dict]:
    """Groups retrieved chunks by their source file for a cleaner client-side display."""
    if not chunks:
        return []

    source_groups = {}
    for i, chunk in enumerate(chunks):
        source_path = chunk['source']
        if source_path not in source_groups:
            source_groups[source_path] = {"path": source_path, "scores": [], "prompt_indices": [], "sections": []}
        
        prompt_index = i + 1
        source_groups[source_path]['prompt_indices'].append(prompt_index)
        source_groups[source_path]['scores'].append(chunk['score'])
        section_preview = chunk['content'][:100].strip() + "..."
        source_groups[source_path]['sections'].append(section_preview)
    
    client_sources = [
        {
            "id": f"S{i+1}",
            "path": group_data['path'],
            "score_range": [round(min(group_data['scores']), 4), round(max(group_data['scores']), 4)],
            "prompt_indices": group_data['prompt_indices'],
            "sections": group_data['sections']
        } for i, group_data in enumerate(source_groups.values())
    ]
    return client_sources

def format_final_response(answer: str, sources: list[dict], use_advanced_prompt: bool):
    """Constructs the final JSON response payload for the client."""
    return {
        "answer": answer,
        "sources": sources,
        "prompt_used": "advanced" if use_advanced_prompt else "basic"
    }

def process_rag_query(query_data: dict):
    """Orchestrates the entire RAG process from query to response."""
    query = query_data.get("query")
    use_advanced_prompt = query_data.get("use_advanced_prompt", False)
    llm_config = query_data.get("llm_config", {})
    
    if not query:
        return jsonify({"error": "Query is missing"}), 400

    try:
        # 1. Retrieve and prepare context
        deduplicated_chunks = retrieve_and_prepare_context(query)
        if not deduplicated_chunks:
            return jsonify({"answer": "I could not find any relevant documents to answer your question.", "sources": []})

        # 2. Group sources for the client *before* generating the prompt
        sources_for_client = _group_sources_for_client(deduplicated_chunks)
        
        # 3. Create the prompt for the LLM
        full_prompt = _create_llm_prompt(query, deduplicated_chunks, use_advanced_prompt, config)

        # 4. Generate the final answer from the LLM
        final_answer = generate_llm_response(full_prompt, llm_config, config)

        # 5. Format and return the final JSON payload
        response_payload = format_final_response(final_answer, sources_for_client, use_advanced_prompt)
        return jsonify(response_payload)

    except requests.exceptions.RequestException as e:
        logging.error(f"Request to LLM server failed: {e}", exc_info=True)
        return jsonify({"error": f"Failed to connect to the language model at {config.LLAMA_SERVER_URL}"}), 502
    except Exception as e:
        logging.error(f"RAG endpoint error: {e}", exc_info=True)
        return jsonify({"error": "An internal error occurred"}), 500

def check_dependencies(config_obj: Config, rag_sys: RAGSystem):
    """Performs a health check on the service and its dependencies."""
    try:
        requests.get(config_obj.LLAMA_SERVER_URL, timeout=5)
        llm_status = "ok"
    except requests.exceptions.RequestException:
        llm_status = "unavailable"
    
    try:
        rag_sys.collection.count()
        db_status = "ok"
    except Exception:
        db_status = "error"
        
    is_healthy = llm_status == "ok" and db_status == "ok"
    status_code = 200 if is_healthy else 503
    
    return jsonify({
        "status": "ok" if is_healthy else "error",
        "dependencies": {"llm_server": llm_status, "vector_database": db_status}
    }), status_code

def start_index_rebuild(rag_sys: RAGSystem):
    """Initiates a full index rebuild in a background thread."""
    thread = threading.Thread(target=rag_sys.build_index_from_directory, kwargs={"force_rebuild": True})
    thread.start()
    return jsonify({"message": "Index rebuild process started in the background. Check logs for progress."}), 202

# ======================================================================================
# --- FLASK API SERVER ---
# ======================================================================================

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# --- Global RAG System Instance ---
config = Config()
rag_system = RAGSystem(config)


# --- API Endpoints ---

@app.route("/rag", methods=["POST"])
def rag_query_endpoint():
    """Handles a RAG query by delegating to the processing function."""
    return process_rag_query(request.get_json())

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
    """Triggers a full rebuild of the vector index."""
    return start_index_rebuild(rag_system)

@app.route("/persist-index", methods=["POST"])
def persist_index_endpoint():
    """Forces the vector database to save its current state to disk."""
    rag_system.persist_index()
    return jsonify({"message": "Index has been persisted to disk."}), 200

# ======================================================================================
# --- MAIN EXECUTION ---
# ======================================================================================

if __name__ == "__main__":
    Path(config.DOCUMENTS_DIR).mkdir(exist_ok=True)
    
    # Start background tasks for initial indexing and file watching
    threading.Thread(target=rag_system.build_index_from_directory, daemon=True).start()
    threading.Thread(target=start_watcher, args=(rag_system,), daemon=True).start()
    
    # For production, use a proper WSGI server like Gunicorn or Waitress.
    # Example: gunicorn --workers 4 --bind 0.0.0.0:5000 your_script_name:app
    app.run(port=5000, host="0.0.0.0", debug=False)