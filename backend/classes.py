from bs4 import BeautifulSoup
import torch
import json
import logging
import re
from sentence_transformers import SentenceTransformer, util
from urllib.parse import urlparse
from watchdog.events import FileSystemEventHandler
import base64
import io
import chromadb
import fitz
import mammoth 
import pandas as pd
from docx import Document
import os
import numpy as np
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor
from pathlib import Path
from urllib.parse import urlparse
import requests
import threading
import time
from constants import  TRUSTED_DOMAINS, Config, TOKEN_ENCODER
from watchdog.observers import Observer
# voice.py
import pyaudio
import numpy as np
import requests
import json
import base64
import pygame
import tempfile
import time
import threading
import os
import torch
import soundfile as sf
from kokoro import KPipeline
from llm import strip_markdown_and_emojis
import threading

def get_env(variable_name, default_value):
    """Gets an environment variable or returns a default."""
    return os.environ.get(variable_name, default_value)

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
        # Commented out indexing logic
        # if self._is_file_indexed(file_path):
        #     logging.info(f"File '{file_path.name}' is already indexed. Skipping.")
        #     return

        # logging.info(f"Processing and indexing new file: {file_path.name}")
        # try:
        #     raw_text = self._extract_text(file_path)
        #     if not raw_text or not raw_text.strip():
        #         logging.warning(f"No text extracted from {file_path.name}. Skipping.")
        #         return

        #     cleaned_text = self._clean_text(raw_text)
        #     chunks = self.text_splitter.split_text(cleaned_text)
        #     if not chunks:
        #         logging.warning(f"File {file_path.name} produced no chunks. Skipping.")
        #         return

        #     chunk_ids = [f"{str(file_path)}_{i}" for i in range(len(chunks))]
        #     metadata = [{"source": str(file_path), "filename": file_path.name} for _ in chunks]
            
        #     embeddings = self.embedding_model.encode(
        #         chunks,
        #         batch_size=self.config.EMBEDDING_BATCH_SIZE,
        #         show_progress_bar=False
        #     ).tolist()

        #     self.collection.add(documents=chunks, metadatas=metadata, ids=chunk_ids, embeddings=embeddings)
        #     logging.info(f"Successfully indexed {len(chunks)} chunks from {file_path.name}.")
        # except Exception as e:
        #     logging.error(f"Failed to process file {file_path.name}: {e}", exc_info=True)

    def build_index_from_directory(self, force_rebuild=False):
        """Scans the documents directory and indexes all supported files."""
        # Commented out indexing logic
        # if force_rebuild:
        #     logging.warning("FORCE REBUILD: Clearing existing collection.")
        #     self.client.delete_collection(name=self.config.COLLECTION_NAME)
        #     self.collection = self.client.get_or_create_collection(name=self.config.COLLECTION_NAME)

        # logging.info(f"Scanning directory: {self.config.DOCUMENTS_DIR}")
        # for file in Path(self.config.DOCUMENTS_DIR).rglob("*"):
        #     if file.is_file() and file.suffix.lower() in self.config.SUPPORTED_EXTS:
        #         self.process_document(file)
        # logging.info("Initial document scan and indexing complete.")
        
    def update_document(self, file_path: Path):
        """Removes an old document and re-indexes the new version."""
        # Commented out indexing logic
        # logging.info(f"Updating document in index: {file_path.name}")
        # self.remove_document_from_index(file_path)
        # self.process_document(file_path)

    def remove_document_from_index(self, file_path: Path):
        """Removes all chunks associated with a specific file from the index."""
        # Commented out indexing logic
        # logging.info(f"Removing document '{file_path.name}' from index...")
        # self.collection.delete(where={"source": str(file_path)})
        # logging.info(f"Successfully removed '{file_path.name}'.")

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
class StructuredDataExtractor:
    """Extract structured data from JSON-LD, meta tags, and microdata."""
    
    @staticmethod
    def extract_json_ld(html_content: str) -> dict:
        """Extract JSON-LD structured data from HTML."""
        soup = BeautifulSoup(html_content, 'html.parser')
        json_ld_scripts = soup.find_all('script', type='application/ld+json')
        
        extracted_data = {}
        for script in json_ld_scripts:
            try:
                data = json.loads(script.string)
                if isinstance(data, list):
                    data = data[0] if data else {}
                
                # Extract movie/show data
                if data.get('@type') in ['Movie', 'TVSeries', 'TVEpisode']:
                    extracted_data.update({
                        'title': data.get('name'),
                        'release_date': data.get('datePublished') or data.get('dateCreated'),
                        'genre': data.get('genre'),
                        'director': data.get('director', {}).get('name') if isinstance(data.get('director'), dict) else data.get('director'),
                        'actors': [actor.get('name') if isinstance(actor, dict) else actor for actor in data.get('actor', [])],
                        'rating': data.get('aggregateRating', {}).get('ratingValue'),
                        'description': data.get('description')
                    })
                
                # Extract awards data
                if 'award' in data or 'awards' in data:
                    awards = data.get('award') or data.get('awards', [])
                    if isinstance(awards, str):
                        awards = [awards]
                    extracted_data['awards'] = awards
                    
            except (json.JSONDecodeError, AttributeError) as e:
                logging.debug(f"Failed to parse JSON-LD: {e}")
                continue
        
        return extracted_data
    
    @staticmethod
    def extract_meta_tags(html_content: str) -> dict:
        """Extract relevant meta tags and OpenGraph data."""
        soup = BeautifulSoup(html_content, 'html.parser')
        extracted_data = {}
        
        # OpenGraph tags
        og_tags = {
            'og:title': 'title',
            'og:description': 'description', 
            'og:type': 'content_type',
            'og:url': 'canonical_url',
            'article:published_time': 'published_date',
            'article:modified_time': 'modified_date'
        }
        
        for og_tag, key in og_tags.items():
            meta = soup.find('meta', property=og_tag)
            if meta and meta.get('content'):
                extracted_data[key] = meta['content']
        
        # Standard meta tags
        meta_tags = {
            'description': 'meta_description',
            'keywords': 'keywords',
            'author': 'author'
        }
        
        for meta_name, key in meta_tags.items():
            meta = soup.find('meta', attrs={'name': meta_name})
            if meta and meta.get('content'):
                extracted_data[key] = meta['content']
        
        # IMDb specific extractions
        if 'imdb.com' in html_content:
            # Extract IMDb ID from URL or meta
            imdb_id_match = re.search(r'tt\d{7,}', html_content)
            if imdb_id_match:
                extracted_data['imdb_id'] = imdb_id_match.group()
        
        return extracted_data

class ContentExtractor:
    """
    Uses semantic search with robust content cleaning, intelligent truncation,
    and structured field parsing.
    """
    def __init__(self, model_name='all-MiniLM-L6-v2'):
        """Initializes the extractor by loading the sentence transformer model."""
        try:
            logging.info(f"Loading sentence transformer model: {model_name}...")
            self.model = SentenceTransformer(model_name)
            logging.info("Model loaded successfully.")
        except Exception as e:
            logging.error(f"Failed to load sentence transformer model: {e}", exc_info=True)
            self.model = None
        
        self.structured_extractor = StructuredDataExtractor()
    
    def extract_structured_fields(self, text: str, html_content: str = None, url: str = None) -> dict:
        """Enhanced structured field extraction with JSON-LD and meta tag support."""
        fields = {}
        
        # Extract from structured data if HTML is available
        if html_content and url:
            domain = urlparse(url).netloc.lower()
            if any(trusted in domain for trusted in TRUSTED_DOMAINS.keys()):
                # Extract JSON-LD data
                json_ld_data = self.structured_extractor.extract_json_ld(html_content)
                fields.update(json_ld_data)
                
                # Extract meta tag data
                meta_data = self.structured_extractor.extract_meta_tags(html_content)
                fields.update(meta_data)

        print(f"Extracted fields from structured data: {fields}")
        return fields
    
    def filter_boilerplate_dynamic(self, paragraphs: list[str], min_words: int = 8) -> list[str]:
        """Dynamically filter out boilerplate content using heuristics."""
        filtered = []
        
        for para in paragraphs:
            # Skip very short paragraphs
            if len(para.split()) < min_words:
                continue
            
            # Skip paragraphs with excessive repeated characters
            if re.search(r'(.)\1{10,}', para):  # 10+ repeated chars
                continue
            
            # Skip UI noise patterns
            if re.search(r'^(?:menu|navigation|header|footer|sidebar|advertisement)', para.lower()):
                continue
            
            # Skip copyright/legal boilerplate
            if re.search(r'(?:copyright|©|\(c\)|terms of service|privacy policy)', para.lower()):
                continue
            
            # Skip social media sharing text
            if re.search(r'(?:share on|follow us|like us|subscribe)', para.lower()):
                continue
            
            # Skip cookie notices
            if re.search(r'(?:cookies|gdpr|accept all)', para.lower()):
                continue
            
            filtered.append(para.strip())
        
        return filtered
    
    def intelligent_truncate(self, text: str, max_tokens: int = 500) -> str:
        """Intelligently truncate text to fit within token budget."""
        try:
            tokens = TOKEN_ENCODER.encode(text)
            if len(tokens) <= max_tokens:
                return text

            truncated_text = TOKEN_ENCODER.decode(tokens[:max_tokens])
            min_trunc_text = TOKEN_ENCODER.decode(tokens[:max(0, max_tokens - 100)])

            # MINIMUM INDEX (SOFT AAH TRUNCATION)
            min_index = len(min_trunc_text)

            for i in range(len(truncated_text) - 1, min_index - 1, -1):
                if truncated_text[i] in '.!?' and (i == len(truncated_text) - 1 or truncated_text[i + 1].isspace()):
                    return truncated_text[:i + 1] + " […continued]"

            return truncated_text + " […continued]"

        except Exception as e:
            logging.error(f"Tokenizer error: {e}", exc_info=True)
            return text[:max_tokens * 4] + " […continued]"

    # def extract_text()

    def count_tokens(self, text: str) -> int:
        """Count the number of tokens in a given text."""
        try:
            tokens = TOKEN_ENCODER.encode(text)
            return len(tokens)
        except Exception as e:
            logging.error(f"Token counting error: {e}", exc_info=True)
            return text // 4
        

    def extract_relevant_sections(self, content: str, query: str, top_k: int = 8, min_chunk_len: int = 30, html_content: str = None, url: str = None, max_tokens: int = 500) -> tuple[str, float, dict]:
        """
        ENHANCED: Lower thresholds and increase crawl depth for better date capture.
        Returns a tuple of (combined_text, max_score, extracted_fields).
        """
        if not content:
            return "", 0.0, {}
            
        # Extract structured fields from full content first (now with HTML support)
        full_fields = self.extract_structured_fields(content, html_content, url)
        
        if not self.model:
            truncated = self.intelligent_truncate(content, max_tokens)
            return truncated, 0.0, full_fields

        # 1. Split into paragraphs and filter boilerplate (with lower min_words)
        raw_chunks = content.split('\n\n')
        raw_chunks = [chunk.strip() for chunk in raw_chunks if chunk.strip()]
        
        # Apply dynamic boilerplate filtering with relaxed criteria
        chunks = self.filter_boilerplate_dynamic(raw_chunks, min_words=5)  # Lowered from 8
        chunks = [chunk for chunk in chunks if len(chunk) >= min_chunk_len]  # Lowered from 50

        if not chunks:
            # Fallback to full content if filtering removed everything
            truncated = self.intelligent_truncate(content, 500)
            return truncated, 0.0, full_fields

        # 2. Create embeddings for the query and content chunks
        try:
            query_embedding = self.model.encode(query, convert_to_tensor=True)
            chunk_embeddings = self.model.encode(chunks, convert_to_tensor=True)

            # 3. Calculate cosine similarity to find the most relevant chunks
            cosine_scores = util.cos_sim(query_embedding, chunk_embeddings)[0]
            
            # 4. Select more chunks with lower threshold
            top_scores, top_indices = torch.topk(cosine_scores, k=min(top_k, len(chunks)))
            
            relevant_chunks = []
            for score, idx in zip(top_scores, top_indices):
                # LOWERED THRESHOLD from 0.1 to 0.05 for better date capture
                if score.item() > 0.05:
                    relevant_chunks.append({'score': score.item(), 'text': chunks[idx]})

            # ENHANCED FALLBACK: More aggressive content inclusion for trusted domains
            domain = urlparse(url).netloc.lower() if url else ""
            is_trusted = any(trusted in domain for trusted in TRUSTED_DOMAINS.keys())

            for score, idx in zip(top_scores[:top_k], top_indices[:top_k]):
                chunk_text = chunks[idx]
                if not any(chunk['text'] == chunk_text for chunk in relevant_chunks):
                    relevant_chunks.append({'score': max(score.item(), 0.1), 'text': chunk_text})  # Boost trusted domain scores


            if not relevant_chunks:
                # Final fallback to full content
                truncated = self.intelligent_truncate(content, 500)
                return truncated, 0.0, full_fields

            # 5. Sort by relevance and combine them
            relevant_chunks.sort(key=lambda x: x['score'], reverse=True)
            combined_text = "\n\n".join([chunk['text'] for chunk in relevant_chunks])
            
            # 6. Apply intelligent truncation with token budget
            combined_text = self.intelligent_truncate(combined_text, 600)  # Increased from 500
            
            max_score = relevant_chunks[0]['score'] if relevant_chunks else 0.0
            
            logging.info(f"Extracted {len(relevant_chunks)} relevant sections with {len(full_fields)} structured fields.")
            return combined_text, max_score, full_fields

        except Exception as e:
            logging.error(f"Error during semantic extraction: {e}", exc_info=True)
            truncated = self.intelligent_truncate(content, 500)
            return truncated, 0.0, full_fields

class VoiceClient:
    MODEL_ID = "openai/whisper-large-v3-turbo"  # Use a class constant for model id

    def __init__(self, server_url="http://localhost:5000/voice"):
        self.server_url = server_url
        self.history = []
        
        # Audio I/O Configuration
        self.RATE = 16000
        self.CHUNK = int(self.RATE * 0.1)  # 100ms
        self.FORMAT = pyaudio.paInt16
        self.CHANNELS = 1
        
        # VAD Configuration
        self.SILENCE_THRESHOLD = 0.003
        self.SILENCE_DURATION = 1
        self.MIN_RECORDING_LENGTH = 0.5
        
        # State
        self.recording_buffer = []
        self.last_voice_time = time.time()
        self.is_recording = False
        self.is_playing = False
        self.is_thinking = False
        self.running = False  # Set to False initially
        self.transcription = ""
        self.response = ""
        
        # --- Model Loading ---
        self.stt_model, self.stt_processor = self._load_stt_model()
        self.tts_pipeline, self.voice_tensor = self._load_tts_model()

        # Audio system components will be initialized in `run()`
        self.p = None
        self.stream = None

    def _load_stt_model(self):
        """Loads the Whisper STT model and processor without forcing redownload."""
        print("Loading STT model (Whisper)...")
        try:
            device = "cuda:0" if torch.cuda.is_available() else "cpu"
            torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32
            # Only download if not present, otherwise load from cache
            model = AutoModelForSpeechSeq2Seq.from_pretrained(
                self.MODEL_ID, torch_dtype=torch_dtype
            ).to(device)
            processor = AutoProcessor.from_pretrained(self.MODEL_ID)
            print("✅ STT model loaded successfully.")
            return model, processor
        except Exception as e:
            print(f"❌ Failed to load STT model: {e}")
            return None, None

    def _load_tts_model(self):
        """Loads the Kokoro TTS model and voice."""
        print("Loading TTS model (Kokoro)...")
        try:
            pipeline = KPipeline(lang_code='a')
            voice_tensor = torch.load("voices/af_heart.pt", weights_only=True)
            print("✅ TTS model loaded successfully.")
            return pipeline, voice_tensor
        except Exception as e:
            print(f"❌ Failed to load TTS model: {e}")
            return None, None
            
    def transcribe_audio(self, audio_data):
        """Transcribes raw audio bytes using the local Whisper model."""
        if not self.stt_model:
            print("❌ STT model not available.")
            return ""
        try:
            print("🎤 Transcribing...")
            audio_array = np.frombuffer(audio_data, dtype=np.int16).astype(np.float32) / 32768.0
            
            inputs = self.stt_processor(
                audio_array, sampling_rate=self.RATE, return_tensors="pt"
            )
            inputs = inputs.to(self.stt_model.device, dtype=torch.float16 if torch.cuda.is_available() else torch.float32)

            with torch.no_grad():
                predicted_ids = self.stt_model.generate(inputs.input_features, max_new_tokens=128)

            self.transcription = self.stt_processor.batch_decode(predicted_ids, skip_special_tokens=True)[0].strip()
            print(f"🗣️ You: {self.transcription}")
            return self.transcription
        except Exception as e:
            print(f"❌ Transcription error: {e}")
            return ""

    def synthesize_speech(self, text):
        """Synthesizes speech from text using the local Kokoro model."""
        if not self.tts_pipeline:
            print("❌ TTS model not available.")
            return None
        try:
            print("🔊 Synthesizing audio...")
            generator = self.tts_pipeline(text, voice=self.voice_tensor, speed=1.0)
            
            audio_segments = [audio for _, _, audio in generator]
            if not audio_segments:
                return None
                
            full_audio = np.concatenate(audio_segments)
            
            buffer = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
            sf.write(buffer.name, full_audio, 24000)
            buffer.close()
            return buffer.name
        except Exception as e:
            print(f"❌ TTS error: {e}")
            return None

    def audio_callback(self, in_data, frame_count, time_info, status):
        """Audio input callback."""
        if self.is_playing or self.is_thinking:
            return (None, pyaudio.paContinue)

        audio_array = np.frombuffer(in_data, dtype=np.int16).astype(np.float32) / 32768.0
        rms = np.sqrt(np.mean(audio_array**2))
        current_time = time.time()
        
        if rms > self.SILENCE_THRESHOLD:
            if not self.is_recording:
                print("🔴 Recording started...")
                self.is_recording = True
                self.recording_buffer = []
            self.last_voice_time = current_time
            self.recording_buffer.append(in_data)
        elif self.is_recording:
            self.recording_buffer.append(in_data)
            if current_time - self.last_voice_time >= self.SILENCE_DURATION:
                self.is_recording = False
                total_duration = len(self.recording_buffer) * self.CHUNK / self.RATE
                if total_duration >= self.MIN_RECORDING_LENGTH:
                    audio_data = b''.join(self.recording_buffer)
                    threading.Thread(target=self.process_interaction, args=(audio_data,)).start()
                else:
                    print("⚠️ Recording too short, skipped. Listening...")
                self.recording_buffer = []

        return (None, pyaudio.paContinue)

    def process_interaction(self, source_data, is_text=False):
        """Handles the full interaction: STT -> LLM -> TTS."""
        self.is_thinking = True
        
        if is_text:
            user_message = source_data
            print(f"🗣️ You: {user_message}")
        else:
            user_message = self.transcribe_audio(source_data)
        
        if not user_message:
            print("🎤 Listening...")
            self.is_thinking = False
            return
            
        self.history.append({"role": "user", "content": user_message})

        try:
            print("🤖 Assistant: ", end="", flush=True)
            llm_response_full = ""
            
            payload = {"message": user_message, "history": self.history[:-1]} # Send history *before* this turn
            response = requests.post(self.server_url, json=payload, stream=True)
            response.raise_for_status()

            for line in response.iter_lines():
                if line.startswith(b'data:'):
                    data_str = line.decode('utf-8')[5:]
                    if data_str:
                        chunk = json.loads(data_str)
                        token = chunk.get("content", "")
                        print(token, end="", flush=True)
                        llm_response_full += token
                elif line.startswith(b'event: end'):
                    break
            
            print() # Newline after the full response
            
            if llm_response_full:
                self.history.append({"role": "assistant", "content": llm_response_full})
                self.response = strip_markdown_and_emojis(llm_response_full)
                
                # Keep history manageable
                if len(self.history) > 10:
                    self.history = self.history[-10:]

                audio_file_path = self.synthesize_speech(llm_response_full)
                if audio_file_path:
                    self.play_audio_response(audio_file_path)
            
        except requests.exceptions.ConnectionError:
             print("\n❌ CONNECTION ERROR: Could not connect to the LLM server. Is system.py running?")
        except Exception as e:
            print(f"\n❌ An error occurred during interaction: {e}")
        finally:
            self.is_thinking = False
            print("🎤 Listening...")
            
    def play_audio_response(self, file_path):
        """Plays audio from a file path and cleans up."""
        try:
            self.is_playing = True
            pygame.mixer.music.load(file_path)
            pygame.mixer.music.play()
            while pygame.mixer.music.get_busy() and self.running:
                time.sleep(0.1)
        except Exception as e:
            print(f"Audio playback error: {e}")
        finally:
            self.is_playing = False
            try:
                os.unlink(file_path)
            except Exception as e:
                print(f"Could not delete temp file {file_path}: {e}")

    def cleanup(self):
        """Stops the audio system and cleans up resources."""
        print("🛑 Shutting down...")
        self.running = False
        if self.stream and self.stream.is_active():
            self.stream.stop_stream()
        if self.stream:
            self.stream.close()
        if self.p:
            self.p.terminate()
        pygame.mixer.quit()
        print("✅ Cleanup complete")

    def run(self):
        """Starts the voice client and initializes the audio system."""
        print("\n🎤 Voice Client Ready!")
        print("   - Speak and pause for 2 seconds to send a message.")
        print("   - Type a message and press Enter to send it as text.")
        print("   - Type 'quit' to exit.\n")
        print("🎤 Listening...")

        # Initialize audio system
        self.p = pyaudio.PyAudio()
        pygame.mixer.init(frequency=24000, size=-16, channels=1, buffer=512)
        
        self.stream = self.p.open(
            format=self.FORMAT, channels=self.CHANNELS, rate=self.RATE,
            input=True, frames_per_buffer=self.CHUNK, stream_callback=self.audio_callback
        )
        self.stream.start_stream()

        self.running = True  
        try:
            while self.running:
                user_input = input()
                if user_input.lower() == 'quit':
                    break
                if user_input:
                    # Don't process if another interaction is already happening
                    if not self.is_thinking:
                        threading.Thread(target=self.process_interaction, args=(user_input, True)).start()
                    else:
                        print("⚠️ Please wait for the current response to finish.")
        except KeyboardInterrupt:
            pass
        finally:
            self.cleanup()

def start_watcher(rag_system: RAGSystem):
    """Initializes and starts the file system observer."""
    handler = DocumentHandler(rag_system, rag_system.config.WATCHER_DEBOUNCE_SECONDS)
    observer = Observer()
    observer.schedule(handler, path=rag_system.config.DOCUMENTS_DIR, recursive=True)
    observer.start()
    logging.info(f"Started watching directory: {rag_system.config.DOCUMENTS_DIR}")

# --- Global Instances ---
import threading

def initialize_instances():
    """Initialize global instances simultaneously."""
    global config, http_session, rag_system, voice_processor, client

    def init_config():
        global config
        config = Config()

    def init_http_session():
        global http_session
        http_session = requests.Session()

    def init_rag_system():
        global rag_system
        rag_system = RAGSystem(config)

    def init_voice_processor():
        global voice_processor
        voice_processor = VoiceProcessor()

    def init_client():
        global client
        client = VoiceClient()

    # Create threads for each initialization
    threads = [
        threading.Thread(target=init_config),
        threading.Thread(target=init_http_session),
        threading.Thread(target=init_rag_system),
        threading.Thread(target=init_voice_processor),
        threading.Thread(target=init_client),
    ]

    # Start all threads
    for thread in threads:
        thread.start()

    # Wait for all threads to complete
    for thread in threads:
        thread.join()

initialize_instances()