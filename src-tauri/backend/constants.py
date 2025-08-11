import asyncio
import os
import tiktoken
import json
import sentencepiece as spm

# CONSTANTS =======================================================

LLAMA_SERVER_URL = "http://localhost:8080/completion"
CRAWL_SEMAPHORE = asyncio.Semaphore(16)
APPDATA = os.getenv("APPDATA")  
STORE_PATH = os.path.join(APPDATA, "com.haru.app", "store.json")
MAX_CONTEXT_TOKENS = 3500
TOKEN_ENCODER = tiktoken.encoding_for_model("gpt-3.5-turbo") 
TRUSTED_DOMAINS = {
    'imdb.com': 1.5,
    'wikipedia.org': 1.5,
    'rottentomatoes.com': 1.2,
    'variety.com': 1.1,
    'hollywoodreporter.com': 1.1,
    'bbc.com': 1.0,
    'reuters.com': 1.0,
    'nytimes.com': 1.0,
    'theguardian.com': 1.0,
    'cnn.com': 1.0,
    'techcrunch.com': 1.0,
    'engadget.com': 1.0,
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
    'medium.com': 0.9,
    'quora.com': 0.8,
}

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
    USE_GPU = get_env("USE_GPU", "false").lower() in ("true", "1", "yes")

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
