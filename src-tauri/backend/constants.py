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
USER_AGENT = "Mozilla/5.0 (compatible; Bot/1.0; +https://example.com/bot)"  # Customize

STT_MODEL_ID = "openai/whisper-large-v3-turbo"
TTS_VOICE_PATH = "D:/Programming/Projects/Tauri/haru/src-tauri/voices/af_nicole.pt"
STT_SAMPLE_RATE = 16000
TTS_SAMPLE_RATE = 24000
VAD_AGGRESSIVENESS = 3
END_OF_SPEECH_SILENCE_MS = 2000

# --- WEB Scraper Settings ---
TRUSTED_DOMAINS = {
    'imdb.com': 1.5,
    'wikipedia.org': 1.5,
    'rottentomatoes.com': 1.2,
    'variety.com': 1.1,
    'hollywoodreporter.com': 1.1,
    'bbc.com': 1.2,
    'reuters.com': 1.2,
    'nytimes.com': 1.2,
    'theguardian.com': 1.3,
    'cnn.com': 1.1,
    'techcrunch.com': 1.1,
    'engadget.com': 1.2,
    'stackoverflow.com': 1.4,
    'arxiv.org': 1.3,
    'sciencedaily.com': 1.2,
    'nature.com': 1.3,
    'academia.edu': 1.2,
    'medium.com': 0.9,
    'ted.com': 1.1,
    'khanacademy.org': 1.3,
    'britannica.com': 1.4,
    'nih.gov': 1.4,
    'cdc.gov': 1.4,
    'edx.org': 1.2,
    'coursera.org': 1.2,
    'stackoverflow.com': 1.4,
    'github.com': 1.3,
    'medium.com': 1.2,
    'quora.com': 1.2,
}

LLM_PROMPT_TEMPLATE_BASIC = """You are a helpful AI assistant.  
Based ONLY on the provided context, answer the user's question clearly and concisely.  
Cite sources immediately after facts using brackets, e.g., [Source 1].  
If the context does not contain the answer, say: "I cannot answer based on the provided documents."  
Do NOT use any external knowledge.

Context:
{context}

Question: {query}
Answer:"""

LLM_PROMPT_TEMPLATE_ADVANCED = """### INSTRUCTIONS FOR AI ASSISTANT ###
You are an expert technical writer. Provide a clear, concise, and well-structured answer synthesizing the information from the Context to address the Question.

1. Keep answers brief and focused; avoid unnecessary details.  
2. Synthesize information into a cohesive narrative—do NOT just summarize or repeat.  
3. Cite all sources immediately after relevant facts or paragraphs as [Source 1, 3].  
4. If the context lacks the necessary information, state clearly: "I cannot provide an answer based on the available documents."  
5. Avoid adding any information not present in the context.

### Context ###
{context}

### Question ###
{query}

### Answer ###
"""
