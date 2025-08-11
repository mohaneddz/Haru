import logging, re, threading
from pathlib import Path
import pandas as pd
import fitz, mammoth
from docx import Document
from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer
from sentence_transformers import SentenceTransformer
from langchain_text_splitters import RecursiveCharacterTextSplitter
import chromadb

class RAGSystem:
    """Fast RAG for school notes/docs with improved similarity + batch indexing."""
    def __init__(self, config):
        self.config = config
        logging.info("Initializing RAG System...")
        
        # Embedding model
        self.embedding_model = None
        self.is_running = False
        
        # Text splitter
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.config.CHUNK_SIZE,
            chunk_overlap=self.config.CHUNK_OVERLAP
        )
        
        # Persistent ChromaDB
        self.client = chromadb.PersistentClient(path=self.config.PERSIST_DIRECTORY)
        self.collection = self.client.get_or_create_collection(
            name=self.config.COLLECTION_NAME,
            metadata={"hnsw:space": "ip"}  # dot-product similarity
        )
        logging.info("RAG System Ready.")

    def process_document(self, file_path: Path):
        try:
            raw_text = self._extract_text(file_path)
            if not raw_text.strip():
                return
            
            cleaned_text = self._clean_text(raw_text)
            chunks = self.text_splitter.split_text(cleaned_text)
            if not chunks:
                return
            
            chunk_ids = [f"{file_path}_{i}" for i in range(len(chunks))]
            metadata = [{"source": str(file_path), "filename": file_path.name} for _ in chunks]
            
            embeddings = self.embedding_model.encode(
                chunks,
                batch_size=self.config.EMBEDDING_BATCH_SIZE,
                normalize_embeddings=True,
                show_progress_bar=False
            ).tolist()
            
            self.collection.add(
                documents=chunks,
                metadatas=metadata,
                ids=chunk_ids,
                embeddings=embeddings
            )
            logging.info(f"Indexed {len(chunks)} chunks from {file_path.name}")
        except Exception as e:
            logging.error(f"Error processing {file_path}: {e}", exc_info=True)

    def build_index_from_directory(self, force_rebuild=False):
        if force_rebuild:
            self.client.delete_collection(name=self.config.COLLECTION_NAME)
            self.collection = self.client.get_or_create_collection(
                name=self.config.COLLECTION_NAME,
                metadata={"hnsw:space": "ip"}
            )
        
        files = [f for f in Path(self.config.DOCUMENTS_DIR).rglob("*") 
                 if f.suffix.lower() in self.config.SUPPORTED_EXTS]
        
        from concurrent.futures import ThreadPoolExecutor
        with ThreadPoolExecutor(max_workers=self.config.MAX_WORKERS) as executor:
            executor.map(self.process_document, files)
        
        logging.info("Index build complete.")

    def retrieve_context(self, query: str):
        query_emb = self.embedding_model.encode(
            [query], normalize_embeddings=True
        ).tolist()
        results = self.collection.query(
            query_embeddings=query_emb,
            n_results=self.config.RETRIEVAL_TOP_K,
            include=["metadatas", "documents", "distances"]
        )
        if not results["ids"]:
            return []
        
        return [
            {
                "score": 1 - dist,
                "content": doc,
                "source": meta["source"]
            }
            for doc, meta, dist in zip(
                results["documents"][0],
                results["metadatas"][0],
                results["distances"][0]
            )
        ]

    def _extract_text(self, path: Path):
        ext = path.suffix.lower()
        try:
            if ext == ".pdf":
                with fitz.open(path) as doc:
                    return "\n".join(p.get_text() for p in doc)
            elif ext == ".docx":
                return "\n".join(p.text for p in Document(path).paragraphs)
            elif ext == ".doc":
                with open(path, "rb") as f:
                    return mammoth.extract_raw_text(f).value
            elif ext == ".csv":
                df = pd.read_csv(path, encoding_errors="ignore").fillna("").astype(str)
                return "\n".join("; ".join(f"{c}: {v}" for c, v in row.items()) for _, row in df.iterrows())
            return path.read_text(encoding="utf-8", errors="ignore")
        except Exception as e:
            logging.warning(f"Read fail {path.name}: {e}")
            return ""

    @staticmethod
    def _clean_text(text: str):
        return re.sub(r"\s+", " ", text).strip()

    def run(self):
        if not self.embedding_model:
            logging.info("Loading embedding model...")
            self.embedding_model = SentenceTransformer(
                self.config.EMBEDDING_MODEL_NAME,
                device=self.config.EMBEDDING_DEVICE
            )
            self.is_running = True

    def clean_up(self):
        if self.embedding_model:
            self.embedding_model = None
        self.is_running = False


class DocumentHandler(FileSystemEventHandler):
    def __init__(self, rag_system, debounce_seconds):
        self.rag_system = rag_system
        self.debounce_seconds = debounce_seconds
        self.debounce_timers = {}

    def _debounce(self, path, action):
        if path in self.debounce_timers:
            self.debounce_timers[path].cancel()
        t = threading.Timer(self.debounce_seconds, action)
        self.debounce_timers[path] = t
        t.start()

    def on_created(self, e):
        if not e.is_directory:
            self._debounce(e.src_path, lambda: self.rag_system.process_document(Path(e.src_path)))

    def on_modified(self, e):
        if not e.is_directory:
            self._debounce(e.src_path, lambda: self.rag_system.process_document(Path(e.src_path)))

def start_watcher(rag_system):
    handler = DocumentHandler(rag_system, rag_system.config.WATCHER_DEBOUNCE_SECONDS)
    obs = Observer()
    obs.schedule(handler, path=rag_system.config.DOCUMENTS_DIR, recursive=True)
    obs.start()
