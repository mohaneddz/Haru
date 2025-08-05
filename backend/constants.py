import asyncio
import os
import tiktoken
import logging

LLAMA_SERVER_URL = "http://localhost:8080/completion"
CRAWL_SEMAPHORE = asyncio.Semaphore(16)

# NEW: Token budget configuration
MAX_CONTEXT_TOKENS = 3500  # Leave room for system prompt and response
TOKEN_ENCODER = tiktoken.encoding_for_model("gpt-3.5-turbo")  # Close approximation for token counting

# NEW: Trusted domains configuration
TRUSTED_DOMAINS = {
    'imdb.com': 1.5,
    'wikipedia.org': 1.3,
    'rottentomatoes.com': 1.2,
    'variety.com': 1.1,
    'hollywoodreporter.com': 1.1,
    'bbc.com': 1.0,
    'reuters.com': 1.0
}

# TODO : replace with my key
OMDB_API_KEY = "your_omdb_key"  
WIKIPEDIA_API_URL = "https://en.wikipedia.org/api/rest_v1/page/summary/"

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

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
