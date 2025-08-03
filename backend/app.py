import os
import logging
import re
import threading
import json
from pathlib import Path
import time
from urllib.parse import urlparse
import asyncio
from constants import *
from classes import *

# --- New Imports for Voice Functionality ---
import base64
import io
import numpy as np
import torch
from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor
# Note: The 'kokoro' and 'soundfile' libraries are required for TTS.
# They are imported lazily within the VoiceProcessor class.

# --- Third-Party Libraries ---
import fitz  # PyMuPDF for PDFs
import mammoth # For .doc files
import pandas as pd
from docx import Document # For .docx files
import chromadb # Persistent, file-based vector database
import requests
from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer
from web import *
from utils import (
    process_crawled_results,
    build_search_context,
    build_llm_payload,
    handle_llm_response
)

content_extractor = None

# ======================================================================================
# --- CONFIGURATION (via Environment Variables with Defaults) ---
# ======================================================================================

def get_env(variable_name, default_value):
    """Gets an environment variable or returns a default."""
    return os.environ.get(variable_name, default_value)

class Config:
    """Centralized configuration for the entire application."""
    # --- Server and Model Settings ---
    LLAMA_SERVER_URL = get_env("LLAMA_SERVER_URL", "http://localhost:8080/completion")
    EMBEDDING_MODEL_NAME = get_env("EMBEDDING_MODEL_NAME", "all-MiniLM-L6-v2")
    
    # --- RAG System Settings ---
    PERSIST_DIRECTORY = get_env("PERSIST_DIRECTORY", "chroma_db")
    COLLECTION_NAME = get_env("COLLECTION_NAME", "local_docs")
    DOCUMENTS_DIR = get_env("DOCUMENTS_DIR", "documents")
    SUPPORTED_EXTS = {".md", ".txt", ".pdf", ".docx", ".doc", ".csv"}
    CHUNK_SIZE = int(get_env("CHUNK_SIZE", 1000))
    CHUNK_OVERLAP = int(get_env("CHUNK_OVERLAP", 200))
    EMBEDDING_BATCH_SIZE = int(get_env("EMBEDDING_BATCH_SIZE", 32))
    RETRIEVAL_TOP_K = int(get_env("RETRIEVAL_TOP_K", 10))

    # --- Watchdog Settings ---
    WATCHER_DEBOUNCE_SECONDS = float(get_env("WATCHER_DEBOUNCE_SECONDS", 2.0))

    # --- LLM Prompt Templates for RAG ---
    LLM_PROMPT_TEMPLATE_BASIC = """You are a helpful AI assistant. Based ONLY on the context provided below, answer the user's question.
You MUST cite the specific sources you use. At the end of each sentence that uses context, add the citation in brackets, like [Source 1], [Source 2], etc.
If the context does not contain the answer, state that you cannot answer based on the provided documents. Do not use any external knowledge.

Context:
{context}

Question: {query}
Answer:"""

    LLM_PROMPT_TEMPLATE_ADVANCED = """### INSTRUCTIONS FOR AI ASSISTANT ###
You are an expert technical writer. Your task is to synthesize the information from the 'Context' section to provide a clear, comprehensive, and well-structured answer to the 'Question'.
1.  **Synthesize, Don't Summarize**: Weave the information together into a cohesive narrative.
2.  **Cite Correctly**: At the end of a sentence or paragraph that relies on context, group all relevant sources in a single block, like `[Source 1, 3]`.
3.  **Handle Missing Information**: If the context does not contain the answer, state that you cannot provide an answer based on the available documents.

### Context ###
{context}

### Question ###
{query}

### Answer ###
"""

# --- Logging Configuration ---
app = Flask(__name__)
CORS(app, origins="*", supports_credentials=True,
      allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
      expose_headers=["Content-Type"])
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')


# ======================================================================================
# --- RAG SYSTEM IMPLEMENTATION ---
# ======================================================================================

class RAGSystem:
    """Handles all backend logic for document processing, indexing, and retrieval."""
    def __init__(self, config: Config):
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

    def count_tokens(self, text: str) -> int:
        """Counts tokens in a string (simple split-by-space implementation)."""
        return len(text.split())

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
            logging.warning("FORCE REBUILD: Clearing existing collection.")
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
            else:
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
                "score": 1 - distance # Cosine similarity
            })
        return retrieved_chunks
    
    def get_indexed_documents(self) -> list[str]:
        """Returns a list of all unique source file paths in the index."""
        all_items = self.collection.get(include=["metadatas"])
        if not all_items or not all_items['metadatas']: return []
        return sorted(list(set(meta['source'] for meta in all_items['metadatas'])))

    def persist_index(self):
        """Forces a persist-to-disk of the ChromaDB index."""
        self.client.persist()
        logging.info("ChromaDB index has been persisted to disk.")


# ======================================================================================
# --- VOICE PROCESSING IMPLEMENTATION ---
# ======================================================================================

class VoiceProcessor:
    def __init__(self):
        """Initialize voice processing components. Models are loaded lazily on first use."""
        self.device = "cuda:0" if torch.cuda.is_available() else "cpu"
        self.torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32
        
        # Lazy loading - models will be initialized when first used
        self.stt_model = None
        self.stt_processor = None
        self.tts_pipeline = None
        self.voice_tensor = None
        
        # In-memory storage for conversation sessions
        self.voice_sessions = {}
        
        logging.info(f"VoiceProcessor initialized on device: {self.device}. Models will load on first use.")
    
    def _load_stt_model(self):
        """Lazy load the Speech-to-Text (Whisper) model."""
        if self.stt_model is None:
            logging.info("Loading Whisper STT model...")
            model_id = "openai/whisper-large-v3-turbo"
            try:
                self.stt_model = AutoModelForSpeechSeq2Seq.from_pretrained(
                    model_id, torch_dtype=self.torch_dtype, low_cpu_mem_usage=True, use_safetensors=True
                ).to(self.device)
                
                self.stt_processor = AutoProcessor.from_pretrained(model_id)
                
                # Configure generation parameters
                if hasattr(self.stt_model.config, "eos_token_id"):
                    self.stt_model.generation_config.eos_token_id = self.stt_model.config.eos_token_id
                if hasattr(self.stt_model.config, "pad_token_id") and self.stt_model.config.pad_token_id is not None:
                    self.stt_model.generation_config.pad_token_id = self.stt_model.config.pad_token_id
                else:
                    self.stt_model.generation_config.pad_token_id = self.stt_model.generation_config.eos_token_id
                
                logging.info("✅ Whisper STT model loaded successfully.")
            except Exception as e:
                logging.error(f"❌ Failed to load Whisper STT model: {e}", exc_info=True)
                self.stt_model = None # Ensure it remains None on failure
    
    def _load_tts_model(self):
        """Lazy load the Text-to-Speech (Kokoro) model."""
        if self.tts_pipeline is None:
            try:
                logging.info("Loading Kokoro TTS model...")
                from kokoro import KPipeline
                
                self.tts_pipeline = KPipeline(lang_code='a')
                # Ensure the voice file is available at this path
                self.voice_tensor = torch.load("voices/af_alloy.pt", weights_only=True)
                logging.info("✅ Kokoro TTS model loaded successfully.")
            except ImportError:
                logging.error("❌ Failed to load TTS: 'kokoro-tts' library not found. Please install it.")
                self.tts_pipeline = None
            except FileNotFoundError:
                logging.error("❌ Failed to load TTS voice file: 'voices/af_alloy.pt' not found.")
                self.tts_pipeline = None
            except Exception as e:
                logging.error(f"❌ Failed to load TTS model: {e}", exc_info=True)
                self.tts_pipeline = None
    
    def transcribe_audio(self, audio_data, sample_rate=16000) -> str:
        """Transcribe audio data (base64 string) to text."""
        self._load_stt_model()
        if not self.stt_model:
            logging.error("STT model is not available. Cannot transcribe.")
            return ""

        try:
            audio_bytes = base64.b64decode(audio_data)
            # Convert 16-bit PCM bytes to a normalized float32 numpy array
            audio_array = np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32) / 32768.0
            
            inputs = self.stt_processor(
                audio_array, sampling_rate=sample_rate, return_tensors="pt"
            ).to(self.device, self.torch_dtype)
            
            generate_kwargs = {"language": "en", "task": "transcribe", "max_new_tokens": 256}
            
            with torch.no_grad():
                predicted_ids = self.stt_model.generate(**inputs, **generate_kwargs)
            
            transcription = self.stt_processor.batch_decode(predicted_ids, skip_special_tokens=True)[0].strip()
            return transcription
            
        except Exception as e:
            logging.error(f"Error during audio transcription: {e}", exc_info=True)
            return ""
    
    def synthesize_speech(self, text: str) -> str | None:
        """Convert text to speech and return base64 encoded WAV audio."""
        self._load_tts_model()
        if not self.tts_pipeline:
            logging.error("TTS model is not available. Cannot synthesize speech.")
            return None
        
        try:
            import soundfile as sf
            
            generator = self.tts_pipeline(text, voice=self.voice_tensor, speed=1.0, split_pattern=r'[.!?]+|\n+')
            
            audio_segments = [audio for _, _, audio in generator]
            
            if not audio_segments:
                logging.warning("TTS generated no audio segments for the given text.")
                return None

            full_audio = np.concatenate(audio_segments)
            
            # Use an in-memory buffer to avoid disk I/O
            buffer = io.BytesIO()
            sf.write(buffer, full_audio, 24000, format='WAV', subtype='PCM_16')
            buffer.seek(0)
            audio_bytes = buffer.read()
            
            return base64.b64encode(audio_bytes).decode('utf-8')
            
        except Exception as e:
            logging.error(f"Error during speech synthesis: {e}", exc_info=True)
            return None
    
    def get_session(self, session_id: str) -> dict:
        """Get or create a voice conversation session."""
        if session_id not in self.voice_sessions:
            self.voice_sessions[session_id] = {'history': [], 'created': time.time()}
        return self.voice_sessions[session_id]


# ======================================================================================
# --- AUTOMATED DOCUMENT WATCHER ---
# ======================================================================================

class DocumentHandler(FileSystemEventHandler):
    """Handles file system events to automatically update the index."""
    def __init__(self, rag_system: RAGSystem, debounce_seconds: float):
        self.rag_system = rag_system
        self.debounce_timers = {}
        self.debounce_seconds = debounce_seconds

    def _debounce_and_process(self, event_path_str, action):
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

# ======================================================================================
# --- UNIFIED LLM & API HELPER FUNCTIONS ---
# ======================================================================================

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

def stream_unified_response(payload: dict, url: str, sources: list) -> Response:
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

# ======================================================================================
# --- FLASK APPLICATION & ENDPOINTS ---
# ======================================================================================

# --- Global Instances ---
config = Config()
http_session = requests.Session()
rag_system = RAGSystem(config)
voice_processor = VoiceProcessor()

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

@app.route('/voice', methods=['POST'])
def voice_endpoint():
    """Handles a full voice-to-voice interaction: STT -> LLM -> TTS."""
    try:
        data = request.get_json()
        audio_data = data.get('audio_data')
        text_input = data.get('text')
        session_id = data.get('session_id', 'default_voice_session')
        include_audio = data.get('include_audio', False)
        llm_config = data.get('llm_config', {})
        sample_rate = data.get('sample_rate', 16000)

        response_data = {
            "session_id": session_id, "transcription": "", "llm_response": "",
            "audio_data": None, "processing_time": {}
        }
        start_total = time.time()

        # Step 1: Speech-to-Text (if audio is provided)
        user_message = text_input
        if audio_data and not user_message:
            stt_start = time.time()
            user_message = voice_processor.transcribe_audio(audio_data, sample_rate)
            response_data["transcription"] = user_message
            response_data["processing_time"]["stt"] = time.time() - stt_start
            if not user_message:
                return jsonify({"error": "No speech detected in audio"}), 400
        
        if not user_message:
            return jsonify({"error": "No message provided (either as audio or text)"}), 400

        # Step 2: Build prompt from conversation history
        session = voice_processor.get_session(session_id)
        prompt = "You are a helpful AI assistant. Respond naturally and conversationally.\n\n"
        for turn in session['history'][-10:]: # Use last 10 exchanges for context
            prompt += f"{turn.get('role', 'Human').capitalize()}: {turn.get('content', '')}\n"
        prompt += f"Human: {user_message}\nAssistant:"

        # Step 3: Call LLM for a response
        llm_start = time.time()
        llama_payload = create_llm_payload(prompt, stream=False, llm_config=llm_config)
        
        try:
            llm_response_data = handle_non_streaming_llm_response(llama_payload, config.LLAMA_SERVER_URL)
            llm_response = llm_response_data.get("content", "").strip()
            
            # Clean common artifacts from the response
            for artifact in ["\nHuman:", "Human:", "Assistant:"]:
                llm_response = llm_response.split(artifact)[0].strip()

            response_data["llm_response"] = llm_response
            response_data["processing_time"]["llm"] = time.time() - llm_start

            # Update session history
            session['history'].append({"role": "Human", "content": user_message})
            session['history'].append({"role": "Assistant", "content": llm_response})
            session['history'] = session['history'][-20:] # Keep history trimmed

        except requests.exceptions.RequestException as e:
            logging.error(f"LLM processing error for voice chat: {e}", exc_info=True)
            return jsonify({"error": "Failed to get response from LLM"}), 502

        # Step 4: Text-to-Speech (if requested and there's a response)
        if include_audio and llm_response:
            tts_start = time.time()
            audio_response = voice_processor.synthesize_speech(llm_response)
            response_data["audio_data"] = audio_response
            response_data["processing_time"]["tts"] = time.time() - tts_start
        
        response_data["processing_time"]["total"] = time.time() - start_total
        return jsonify(response_data)
        
    except Exception as e:
        logging.error(f"Voice endpoint error: {e}", exc_info=True)
        return jsonify({"error": "An internal error occurred during voice processing"}), 500

@app.route('/voice/transcribe', methods=['POST'])
def transcribe_only_endpoint():
    """Endpoint for performing only Speech-to-Text."""
    try:
        data = request.get_json()
        audio_data = data.get('audio_data')
        if not audio_data: return jsonify({"error": "No audio data provided"}), 400
        
        sample_rate = data.get('sample_rate', 16000)
        transcription = voice_processor.transcribe_audio(audio_data, sample_rate)
        return jsonify({"transcription": transcription, "success": bool(transcription)})
    except Exception as e:
        logging.error(f"Transcription endpoint error: {e}", exc_info=True)
        return jsonify({"error": "Transcription failed"}), 500

@app.route('/voice/synthesize', methods=['POST'])
def synthesize_only_endpoint():
    """Endpoint for performing only Text-to-Speech."""
    try:
        data = request.get_json()
        text = data.get('text')
        if not text: return jsonify({"error": "No text provided"}), 400
        
        audio_response = voice_processor.synthesize_speech(text)
        return jsonify({"audio_data": audio_response, "success": bool(audio_response)})
    except Exception as e:
        logging.error(f"TTS endpoint error: {e}", exc_info=True)
        return jsonify({"error": "Text-to-speech synthesis failed"}), 500

@app.route('/voice/sessions/<session_id>', methods=['GET', 'DELETE'])
def manage_voice_session_endpoint(session_id):
    """Get or delete a voice conversation session history."""
    try:
        if request.method == 'GET':
            session = voice_processor.get_session(session_id)
            return jsonify({"session_id": session_id, "history": session['history'], "created": session['created']})
        
        elif request.method == 'DELETE':
            if session_id in voice_processor.voice_sessions:
                del voice_processor.voice_sessions[session_id]
                return jsonify({"message": f"Voice session '{session_id}' deleted"})
            else:
                return jsonify({"error": "Voice session not found"}), 404
    except Exception as e:
        logging.error(f"Voice session management error: {e}", exc_info=True)
        return jsonify({"error": "Session management failed"}), 500


# --- Management & Status Endpoints ---

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
    warmup_llm_server()
    
    # Start background tasks for initial indexing and file watching
    # These run as daemons, so they won't block app shutdown
    threading.Thread(target=rag_system.build_index_from_directory, daemon=True).start()
    threading.Thread(target=start_watcher, args=(rag_system,), daemon=True).start()
    
    # Start the Flask server
    # For production, use a proper WSGI server like Gunicorn or Waitress.
    # Example: gunicorn --workers 4 --bind 0.0.0.0:5000 app:app
    app.run(port=5000, host="0.0.0.0", debug=False, threaded=True)