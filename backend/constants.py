import asyncio
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