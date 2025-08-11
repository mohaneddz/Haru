
# @app.route("/health", methods=["GET"])
# def health_check_endpoint():
#     """Performs a health check on the service and its dependencies."""
#     try:
#         # Check LLM Server
#         llm_status = "ok" if http_session.get(config.LLAMA_SERVER_URL, timeout=5).ok else "unavailable"
#     except requests.exceptions.RequestException:
#         llm_status = "unavailable"
    
#     try: # Check Vector DB
#         rag_system.collection.count()
#         db_status = "ok"
#     except Exception:
#         db_status = "error"
        
#     is_healthy = llm_status == "ok" and db_status == "ok"
#     status_code = 200 if is_healthy else 503
    
#     return jsonify({
#         "status": "ok" if is_healthy else "error",
#         "dependencies": {"llm_server": llm_status, "vector_database": db_status}
#     }), status_code

# @app.route("/status", methods=["GET"])
# def get_system_status_endpoint():
#     """Returns basic status information about the RAG system."""
#     return jsonify(rag_system.get_status())

# @app.route("/documents", methods=["GET"])
# def list_indexed_documents_endpoint():
#     """Returns a list of all source files currently in the index."""
#     try:
#         return jsonify({"documents": rag_system.get_indexed_documents()})
#     except Exception as e:
#         logging.error(f"Failed to list documents: {e}", exc_info=True)
#         return jsonify({"error": "Failed to retrieve document list"}), 500

# @app.route("/rebuild-index", methods=["POST"])
# def rebuild_index_endpoint():
#     """Triggers a full rebuild of the vector index in a background thread."""
#     thread = threading.Thread(target=rag_system.build_index_from_directory, kwargs={"force_rebuild": True})
#     thread.start()
#     return jsonify({"message": "Index rebuild process started in the background."}), 202

# @app.route("/persist-index", methods=["POST"])
# def persist_index_endpoint():
#     """Forces the vector database to save its current state to disk."""
#     rag_system.persist_index()
#     return jsonify({"message": "Index has been persisted to disk."}), 200

# @app.route("/store")
# def read_store():
#     try:
#         with open(store_path, "r", encoding="utf-8") as f:
#             data = json.load(f)
#         return jsonify(data)
#     except Exception as e:
#         return {"error": str(e)}, 500
