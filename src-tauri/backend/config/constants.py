import asyncio
import os
import tiktoken
import json

# Utils =======================================================

def get_env(variable_name, default_value):
    return os.environ.get(variable_name, default_value)

def get_store_value(key, default=None):
    """Retrieve a value from the store JSON file."""
    try:
        with open(STORE_PATH, 'r') as f:
            store = json.load(f)
        return store.get(key, default)
    except (FileNotFoundError, json.JSONDecodeError):
        return default

# CONSTANTS =======================================================

# Environment variable template for future reference
LLAMA_SERVER_URL = "http://localhost:8080/v1/chat/completions"
CRAWL_SEMAPHORE = asyncio.Semaphore(16)
APPDATA = os.getenv("APPDATA")  
STORE_PATH = os.path.join(APPDATA, "com.haru.app", "store.json")
MAX_CONTEXT_TOKENS = 3500
TOKEN_ENCODER = tiktoken.encoding_for_model("gpt-3.5-turbo")
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"
EMBEDDING_DEVICE = "cuda" if os.getenv("USE_GPU", "false").lower() in ("true", "1", "yes") else "cpu"
MAX_WORKERS = 8
DEFAULT_MODEL = os.environ.get("LLAMA_MODEL", "your-model-name")
# --- RAG System Settings ---
MIN_RERANK_SCORE = 0.5
PERSIST_DIRECTORY = "chroma_db"
COLLECTION_NAME = "local_docs"
DOCUMENTS_DIR = "D:\\Programming\\Projects\\Tauri\\haru\\src-tauri\\documents"
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 150
EMBEDDING_BATCH_SIZE = 32
USE_GPU = os.getenv("USE_GPU", "false").lower() in ("true", "1", "yes")
USE_8BIT_QUANTIZATION = True
RERANKER_MODEL_NAME = 'cross-encoder/ms-marco-MiniLM-L-6-v2'
SUPPORTED_EXTS = {".pdf", ".docx", ".txt", ".md", ".csv"}
RETRIEVAL_TOP_K = 20
RERANK_TOP_K = 5
WATCHER_DEBOUNCE_SECONDS = 2.0

# --- Web Scraper Settings ---
# Constants and configs
MAX_CONCURRENCY = 24
USER_AGENT = "Mozilla/5.0 (compatible; Bot/1.0; +https://example.com/bot)" 
VIDEO_PLACEHOLDER_IMG = "https://assets.example.com/video-placeholder.png"


STT_MODEL_ID = "openai/whisper-large-v3-turbo"
TTS_VOICE_PATH = "D:/Programming/Projects/Tauri/haru/src-tauri/voices/af_nicole.pt"
STT_SAMPLE_RATE = 16000
TTS_SAMPLE_RATE = 24000
VAD_AGGRESSIVENESS = 3
END_OF_SPEECH_SILENCE_MS = 1000
FFMPEG_PATH = "D:/Programming/Projects/Tauri/haru/src-tauri/bin/ffmpeg.exe"
GLOBAL_LLM_MAX_CONCURRENCY = 4
MAX_TOKENS_PER_CHUNK = 1024
OVERLAP_TOKEN_TARGET = 75 
LLM_MAX_OUTPUT_TOKENS = -1
TOKENIZER_MODEL = "gpt-4"
LLM_TEMPERATURE = 0.1
MAX_CHUNK_SECONDS = 30  # Maximum duration for each audio chunk in seconds
