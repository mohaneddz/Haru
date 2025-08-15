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
UNIVERSITIES_URLS = [
    "harvard.edu",
    "mit.edu",
    "stanford.edu",
    "ox.ac.uk",               # University of Oxford
    "cam.ac.uk",              # University of Cambridge
    "berkeley.edu",           # UC Berkeley
    "princeton.edu",
    "yale.edu",
    "columbia.edu",
    "caltech.edu",
    "cmu.edu",                # Carnegie Mellon
    "imperial.ac.uk",         # Imperial College London
    "nus.edu.sg",             # National University of Singapore
    "utoronto.ca",            # University of Toronto
    "ethz.ch",                # ETH Zurich
    "unimelb.edu.au",         # University of Melbourne
    "anu.edu.au",             # Australian National University
    "epfl.ch",                # École Polytechnique Fédérale de Lausanne
    "tudelft.nl",             # Delft University of Technology
    "umich.edu",              # University of Michigan
    "ucla.edu",               # University of California, Los Angeles
    "cornell.edu",
    "edinburgh.ac.uk",        # University of Edinburgh
    "unsw.edu.au",            # University of New South Wales
]


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
REFINED_PROMPT_TEMPLATE = """
**Mission:** Convert this messy lecture transcript from the teacher in class, into a clean, study-ready Obsidian note in Markdown. Preserve all content, fix errors, clarify technical terms, and apply all formatting rules. Do NOT summarize, invent facts, or add new examples. Start immediately with headers; no intros or conversation.

---
### Core Rules
1. **Correct & Clarify:** Fix typos and technical terms (e.g., `resister` → `register`), rephrase broken sentences, and infer unclear intent if necessary.
2. **Preserve The Info:** Keep every concept; remove only repetitions or irrelevant text.
3. **No Hallucinations:** Only expand acronyms or fix obvious mistakes. Do not invent content.
4. **Handle Uncertainty:**  
   - If unsure, add `*(uncertain)*`.  
   - For missing slides/diagrams, insert:  
     > [!cite] Reference: Check the Diagram / Slide ...

---
### Formatting
- **Headers:** `#` for first chunk title, `##` / `###` for sections.  
- **Emphasis:** `**bold**` for key terms, `*italic*` for subtle emphasis or uncertainty.  
- **Callouts:** > [!info], > [!question], > [!example], > [!tip], > [!cite], > [!seealso], > [!attention], > [!tldr]  
- **Technical Content:** Backticks for commands/acronyms (`CPU`, `API`), fenced code blocks, and Katex math ($inline$, $$block$$).  
- **Lists:** Bullets (`-`) for points, numbers (`1.`) for sequences, use callouts for takeaways.

---
### Output Rules
- **Markdown only.** No conversation or comments.  
- **Start immediately** with `# Title` or continuation `##` / `###` if middle chunk.  
- **Process quickly.** Avoid overthinking, don't take too long; prioritize clarity and structure.

---
## Raw Transcript Chunk:
"""

# --- UPDATED: Context instructions now inform the model about the overlap ---
CONTEXT_INSTRUCTIONS = {
    "first": "You are processing the beginning of the transcript. Start refining directly from the text provided, start with an #H1 title : <Module Name> - Lecture X, don't rewrite the original text, start directly",
    "middle": "You are processing a middle part of a larger transcript. For continuity, the start of the text may contain a small, read-only context from the end of the previous chunk, marked with '--- Context from previous chunk ---'. Do not repeat this context in your output. Your response MUST be a direct continuation of the previous section. DO NOT use a top-level H1 header ('#'). Begin with an H2 ('##') or H3 ('###') header if a new section starts, or with plain text if it's a continuation.",
    "last": "You are processing the final part of the transcript. This is the conclusion. For continuity, the start may contain context from the previous chunk. Do not repeat this context in your output. Ensure your response provides a clean and logical conclusion.",
    "single": "You are processing the entire transcript in one go. Refine it from beginning to end, following all formatting rules."
}


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
