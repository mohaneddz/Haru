import os
import logging
import re
import threading
import json
from pathlib import Path
from time import sleep

# Third-party libraries
import fitz  # PyMuPDF for PDFs
import mammoth # For .doc files
import pandas as pd
from docx import Document # For .docx files

import chromadb # Persistent, file-based vector database
import numpy as np
import requests
from flask import Flask, jsonify, request
from flask_cors import CORS # Added for Cross-Origin Resource Sharing
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer

# ======================================================================================
# --- CONFIGURATION (via Environment Variables with Defaults) ---
# ======================================================================================

def get_env(variable_name, default_value):
    """Gets an environment variable or returns a default."""
    return os.environ.get(variable_name, default_value)

class Config:
    """Centralized configuration for the RAG system."""
    # Server and Model Settings
    LLAMA_SERVER_URL = get_env("LLAMA_SERVER_URL", "http://localhost:8080/completion")
    EMBEDDING_MODEL_NAME = get_env("EMBEDDING_MODEL_NAME", "all-MiniLM-L6-v2")
    PERSIST_DIRECTORY = get_env("PERSIST_DIRECTORY", "chroma_db")
    COLLECTION_NAME = get_env("COLLECTION_NAME", "local_docs")

    # Document Processing Settings
    DOCUMENTS_DIR = get_env("DOCUMENTS_DIR", "documents")
    SUPPORTED_EXTS = {".md", ".txt", ".pdf", ".docx", ".doc", ".csv"}
    CHUNK_SIZE = int(get_env("CHUNK_SIZE", 1000))
    CHUNK_OVERLAP = int(get_env("CHUNK_OVERLAP", 200))
    EMBEDDING_BATCH_SIZE = int(get_env("EMBEDDING_BATCH_SIZE", 32))

    # Retrieval Settings
    RETRIEVAL_TOP_K = int(get_env("RETRIEVAL_TOP_K", 10)) # Increased to get more diverse sources for grouping

    # Watchdog Settings
    WATCHER_DEBOUNCE_SECONDS = float(get_env("WATCHER_DEBOUNCE_SECONDS", 2.0))

    # --- LLM Prompt Templates ---
    
    # Basic, literal prompt
    LLM_PROMPT_TEMPLATE_BASIC = """You are a helpful AI assistant. Based ONLY on the context provided below, answer the user's question.
You MUST cite the specific sources you use. At the end of each sentence that uses context, add the citation in brackets, like [Source 1], [Source 2], etc.
If the context does not contain the answer, state that you cannot answer based on the provided documents. Do not use any external knowledge.

Context:
{context}

Question: {query}
Answer:"""

    # Advanced prompt for better synthesis and flow
    LLM_PROMPT_TEMPLATE_ADVANCED = """### INSTRUCTIONS FOR AI ASSISTANT ###
You are an expert technical writer. Your task is to synthesize the information from the 'Context' section to provide a clear, comprehensive, and well-structured answer to the 'Question'.

1.  **Synthesize, Don't Summarize**: Do not simply copy-paste or list facts from the sources. Weave the information together into a cohesive and easy-to-read narrative. Use transition words to connect ideas smoothly.
2.  **Define First**: If the question is about a complex topic, you may begin with a brief, one-sentence definition to provide background. However, the main body of your answer must be based strictly on the provided context.
3.  **Cite Correctly**: When you have finished explaining a point or paragraph that relies on the context, cite all relevant sources used for that explanation. Group citations together in a single block at the end of the sentence, like `[Source 1, 3]` or `[Source 2]`. Do not place citations in the middle of a sentence.
4.  **Be Concise**: Stay on topic and answer the question directly.
5.  **Handle Missing Information**: If the context does not contain the information needed to answer the question, state that you cannot provide an answer based on the available documents. Do not use external knowledge.

### Context ###
{context}

### Question ###
{query}

### Answer ###
"""

# -- Logging --
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')


# ======================================================================================
# --- RAG SYSTEM IMPLEMENTATION (Unchanged from previous version) ---
# ======================================================================================

class RAGSystem:
    """Handles all backend logic for document processing, indexing, and retrieval."""
    def __init__(self, config: Config):
        """Initializes the RAG system components."""
        self.config = config
        logging.info("Initializing RAG System...")
        self.embedding_model = SentenceTransformer(self.config.EMBEDDING_MODEL_NAME)
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.config.CHUNK_SIZE,
            chunk_overlap=self.config.CHUNK_OVERLAP
        )
        self.client = chromadb.PersistentClient(path=self.config.PERSIST_DIRECTORY)
        self.collection = self.client.get_or_create_collection(
            name=self.config.COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"}
        )
        logging.info("RAG System Initialized.")
        
    def get_status(self):
        """Returns the current status of the RAG system."""
        return {
            "document_count": self.collection.count(),
            "collection_name": self.config.COLLECTION_NAME,
            "embedding_model": self.config.EMBEDDING_MODEL_NAME
        }

    def process_document(self, file_path: Path):
        """Processes and indexes a single document."""
        if self._is_file_indexed(file_path):
            logging.info(f"File '{file_path.name}' is already indexed. Skipping.")
            return

        logging.info(f"Processing and indexing new file: {file_path.name}")
        try:
            raw_text = self._extract_text(file_path)
            if not raw_text or not raw_text.strip():
                logging.warning(f"No text extracted from {file_path.name}. Skipping.")
                return

            cleaned_text = self._clean_text(raw_text)
            chunks = self.text_splitter.split_text(cleaned_text)
            if not chunks:
                logging.warning(f"File {file_path.name} produced no chunks. Skipping.")
                return

            chunk_ids = [f"{str(file_path)}_{i}" for i in range(len(chunks))]
            metadata = [{"source": str(file_path), "filename": file_path.name} for _ in chunks]
            
            embeddings = self.embedding_model.encode(
                chunks,
                batch_size=self.config.EMBEDDING_BATCH_SIZE,
                show_progress_bar=False
            ).tolist()

            self.collection.add(documents=chunks, metadatas=metadata, ids=chunk_ids, embeddings=embeddings)
            logging.info(f"Successfully indexed {len(chunks)} chunks from {file_path.name}.")
        except Exception as e:
            logging.error(f"Failed to process file {file_path.name}: {e}", exc_info=True)

    def build_index_from_directory(self, force_rebuild=False):
        """Scans the documents directory and indexes all supported files."""
        if force_rebuild:
            logging.warning("FORCE REBUILD: Clearing existing collection. It is recommended to backup the persistence directory first.")
            self.client.delete_collection(name=self.config.COLLECTION_NAME)
            self.collection = self.client.get_or_create_collection(name=self.config.COLLECTION_NAME)

        logging.info(f"Scanning directory: {self.config.DOCUMENTS_DIR}")
        for file in Path(self.config.DOCUMENTS_DIR).rglob("*"):
            if file.is_file() and file.suffix.lower() in self.config.SUPPORTED_EXTS:
                self.process_document(file)
        logging.info("Initial document scan and indexing complete.")
        
    def update_document(self, file_path: Path):
        """Removes an old document and re-indexes the new version."""
        logging.info(f"Updating document in index: {file_path.name}")
        self.remove_document_from_index(file_path)
        self.process_document(file_path)

    def remove_document_from_index(self, file_path: Path):
        """Removes all chunks associated with a specific file from the index."""
        logging.info(f"Removing document '{file_path.name}' from index...")
        self.collection.delete(where={"source": str(file_path)})
        logging.info(f"Successfully removed '{file_path.name}'.")

    def _extract_text(self, path: Path) -> str:
        """Extracts text from a file based on its extension."""
        ext = path.suffix.lower()
        try:
            if ext == ".pdf":
                with fitz.open(path) as doc: return "\n".join(page.get_text() for page in doc)
            elif ext == ".docx":
                return "\n".join(para.text for para in Document(path).paragraphs)
            elif ext == ".doc":
                with open(path, "rb") as f: return mammoth.extract_raw_text(f).value
            elif ext == ".csv":
                df = pd.read_csv(path, encoding_errors="ignore").fillna("").astype(str)
                return "\n".join(["Row contains: " + "; ".join(f"{col}: {val}" for col, val in row.items()) for _, row in df.iterrows()])
            else: # .txt, .md, etc.
                return path.read_text(encoding="utf-8", errors="ignore")
        except Exception as e:
            logging.warning(f"Failed to read {path.name}: {e}"); return ""

    def _clean_text(self, text: str) -> str:
        """Performs basic text cleaning."""
        return re.sub(r'\s+', ' ', text).strip()

    def _is_file_indexed(self, file_path: Path) -> bool:
        """Checks if a file has already been indexed."""
        return len(self.collection.get(where={"source": str(file_path)}, limit=1)['ids']) > 0

    def retrieve_context(self, query: str) -> list[dict]:
        """Retrieves relevant context chunks with scores and metadata."""
        query_embedding = self.embedding_model.encode([query]).tolist()
        results = self.collection.query(
            query_embeddings=query_embedding,
            n_results=self.config.RETRIEVAL_TOP_K,
            include=["metadatas", "documents", "distances"]
        )
        
        retrieved_chunks = []
        if not results or not results.get('ids', [None])[0]:
            return []

        for i in range(len(results['ids'][0])):
            distance = results['distances'][0][i]
            retrieved_chunks.append({
                "id": results['ids'][0][i],
                "content": results['documents'][0][i],
                "source": results['metadatas'][0][i]['source'],
                "score": 1 - distance # For cosine, 1 - distance = similarity
            })
        return retrieved_chunks
    
    def get_indexed_documents(self) -> list[str]:
        """Returns a list of all unique source file paths in the index."""
        all_items = self.collection.get(include=["metadatas"])
        if not all_items or not all_items['metadatas']:
            return []
        unique_sources = sorted(list(set(meta['source'] for meta in all_items['metadatas'])))
        return unique_sources

    def persist_index(self):
        """Forces a persist-to-disk of the ChromaDB index."""
        self.client.persist()
        logging.info("ChromaDB index has been persisted to disk.")

# ======================================================================================
# --- AUTOMATED DOCUMENT WATCHER (Unchanged) ---
# ======================================================================================

class DocumentHandler(FileSystemEventHandler):
    """Handles file system events to automatically update the index."""
    def __init__(self, rag_system: RAGSystem, debounce_seconds: float):
        self.rag_system = rag_system
        self.debounce_timers = {}
        self.debounce_seconds = debounce_seconds

    def _debounce_and_process(self, event_path_str, action):
        """Debounces events to avoid rapid, repeated processing of the same file."""
        if event_path_str in self.debounce_timers:
            self.debounce_timers[event_path_str].cancel()
        timer = threading.Timer(self.debounce_seconds, action)
        self.debounce_timers[event_path_str] = timer
        timer.start()

    def on_created(self, event):
        if not event.is_directory and Path(event.src_path).suffix.lower() in rag_system.config.SUPPORTED_EXTS:
            action = lambda: self.rag_system.process_document(Path(event.src_path))
            self._debounce_and_process(event.src_path, action)

    def on_modified(self, event):
        if not event.is_directory and Path(event.src_path).suffix.lower() in rag_system.config.SUPPORTED_EXTS:
            action = lambda: self.rag_system.update_document(Path(event.src_path))
            self._debounce_and_process(event.src_path, action)

    def on_deleted(self, event):
        if not event.is_directory and Path(event.src_path).suffix.lower() in rag_system.config.SUPPORTED_EXTS:
            action = lambda: self.rag_system.remove_document_from_index(Path(event.src_path))
            self._debounce_and_process(event.src_path, action)

def start_watcher(rag_system: RAGSystem):
    """Initializes and starts the file system observer."""
    handler = DocumentHandler(rag_system, rag_system.config.WATCHER_DEBOUNCE_SECONDS)
    observer = Observer()
    observer.schedule(handler, path=rag_system.config.DOCUMENTS_DIR, recursive=True)
    observer.start()
    logging.info(f"Started watching directory: {rag_system.config.DOCUMENTS_DIR}")
    try:
        observer.join()
    except KeyboardInterrupt:
        observer.stop()
        logging.info("Watcher stopped by user.")
    observer.join()


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