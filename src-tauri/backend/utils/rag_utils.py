import os
import re
import gc
import logging
import threading
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional
import pickle
import asyncio  # added
# import httpx  # added

import faiss
import numpy as np
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
from sentence_transformers.cross_encoder import CrossEncoder
from unstructured.partition.auto import partition
# from utils.chat_utils import create_llm_payload, handle_non_streaming_llm_response  # added
from config.constants import (
    CHUNK_SIZE, CHUNK_OVERLAP, PERSIST_DIRECTORY,
    EMBEDDING_BATCH_SIZE, DOCUMENTS_DIR, SUPPORTED_EXTS,
    RETRIEVAL_TOP_K, RERANK_TOP_K, EMBEDDING_DEVICE,
    EMBEDDING_MODEL_NAME, RERANKER_MODEL_NAME, MAX_WORKERS,
    WATCHER_DEBOUNCE_SECONDS, MIN_RERANK_SCORE
    # , LLAMA_SERVER_URL  # added
)

# Define the rephrasing prompt
REPHRASE_RAG_PROMPT = """
You are an expert at rewriting questions for a Retrieval-Augmented Generation (RAG) system. 
Your goal is to take a user's query and rephrase it to be more optimal for retrieving relevant documents from a vector database.
The rephrased query should be clear, concise, and standalone.

Original Query: "{query}"

Rephrased Query:
"""

class RAGSystem:
    """Advanced RAG with re-ranking, rich metadata, and memory optimization using FAISS."""

    def __init__(self):
        logging.info("Initializing RAG System with FAISS...")
        self.embedding_model = None
        self.reranker = None
        self.is_running = False

        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=CHUNK_SIZE,
            chunk_overlap=CHUNK_OVERLAP
        )
        
        self.index = None
        self.doc_store = []
        self.index_path = Path(PERSIST_DIRECTORY) / "faiss_index.bin"
        self.doc_store_path = Path(PERSIST_DIRECTORY) / "doc_store.pkl"

        logging.info("RAG System Ready. Loading resources in the background...")
        self.run()

    # Remove LLM-powered rephrasing from utils; rag_worker will handle it.
    def _transform_query(self, query: str) -> str:
        return query

    # === START MODIFICATION 2: Change process_document to return results ===
    def process_document(self, file_path: Path) -> Optional[Tuple[List[Dict], np.ndarray]]:
        try:
            if any(entry['metadata']['source'] == str(file_path) for entry in self.doc_store):
                logging.info(f"Skipping already indexed document: {file_path.name}")
                return None

            structured_elements = self._extract_structured_text(file_path)
            if not structured_elements:
                return None

            all_chunks = []
            for element in structured_elements:
                chunks = self.text_splitter.split_text(element['content'])
                base_metadata = element['metadata']
                for i, chunk_text in enumerate(chunks):
                    metadata = base_metadata.copy()
                    metadata["chunk_index"] = i
                    cleaned_chunk = self._clean_text(chunk_text)
                    all_chunks.append({"content": cleaned_chunk, "metadata": metadata})

            if not all_chunks:
                return None

            contents = [chunk['content'] for chunk in all_chunks]
            embeddings = self.embedding_model.encode(
                contents, batch_size=EMBEDDING_BATCH_SIZE,
                normalize_embeddings=True, show_progress_bar=False
            )
            
            logging.info(f"Processed {len(all_chunks)} chunks from {file_path.name}")
            return all_chunks, embeddings
        except Exception as e:
            logging.error(f"Error processing {file_path}: {e}", exc_info=True)
            return None
    # === END MODIFICATION 2 ===

    # === START MODIFICATION 3: Update build_index to handle results safely ===
    def build_index_from_directory(self, force_rebuild=False):
        # Ensure resources are loaded if rebuild is triggered early
        if not self.embedding_model:
            logging.info("Embedding model not loaded. Loading synchronously before building the index...")
            self.load_resources()

        if force_rebuild:
            logging.info("Rebuilding index. Clearing old FAISS index and doc store.")
            d = self.embedding_model.get_sentence_embedding_dimension()
            self.index = faiss.IndexFlatIP(d)
            self.doc_store = []
            if self.index_path.exists(): self.index_path.unlink()
            if self.doc_store_path.exists(): self.doc_store_path.unlink()

        files = [f for f in Path(DOCUMENTS_DIR).rglob("*") if f.suffix.lower() in SUPPORTED_EXTS]
        
        all_processed_chunks = []
        all_embeddings = []

        from concurrent.futures import ThreadPoolExecutor
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            # map will run process_document for each file and return the results
            results = executor.map(self.process_document, files)
            for result in results:
                if result:
                    chunks, embeddings = result
                    all_processed_chunks.extend(chunks)
                    all_embeddings.append(embeddings)

        if not all_processed_chunks:
            logging.warning("No new documents were processed. Index remains unchanged.")
            return

        # Perform the update in the main thread for safety
        final_embeddings = np.vstack(all_embeddings)
        self.index.add(final_embeddings.astype('float32'))
        self.doc_store.extend(all_processed_chunks)
        
        logging.info(f"Added {len(all_processed_chunks)} new chunks to the index.")

        self._save_faiss_index()
        logging.info("Index build complete and saved to disk.")
    # === END MODIFICATION 3 ===

    def add_chunks_to_index(self, chunks: List[Dict], embeddings: np.ndarray):
        """Safely add chunks and embeddings to FAISS and doc store, then persist."""
        if embeddings is None or len(chunks) == 0:
            return
        if self.index is None:
            d = self.embedding_model.get_sentence_embedding_dimension()
            self.index = faiss.IndexFlatIP(d)
        self.index.add(embeddings.astype('float32'))
        self.doc_store.extend(chunks)
        self._save_faiss_index()
        logging.info(f"Added {len(chunks)} chunks to the index and persisted.")

    # === START MODIFICATION 4: Integrate rephrasing into retrieve_context ===
    async def retrieve_context(self, query: str) -> List[Dict[str, Any]]:
        if not self.is_running or not self.index:
            raise RuntimeError("Resources not loaded or index is not built. Please wait.")

        if self.index.ntotal == 0:
            logging.warning("Attempted to retrieve context from an empty index.")
            return []

        # Query is assumed to be already rephrased by the caller
        transformed_query = self._transform_query(query)

        # Offload embedding to a worker thread and normalize to match index vectors
        query_emb = await asyncio.to_thread(
            self.embedding_model.encode,
            [transformed_query],
            # ...existing code...
            normalize_embeddings=True,  # fixed: pass as keyword, not positional
            show_progress_bar=False
        )
        query_emb = np.array(query_emb, dtype="float32")

        distances, indices = self.index.search(query_emb, RETRIEVAL_TOP_K)
        valid_indices = [i for i in indices[0] if i != -1]
        if not valid_indices:
            return []

        retrieved_docs = [self.doc_store[i] for i in valid_indices]
        if not retrieved_docs:
            return []

        query_doc_pairs = [[transformed_query, doc['content']] for doc in retrieved_docs]
        rerank_scores = await asyncio.to_thread(self.reranker.predict, query_doc_pairs)

        reranked_results = []
        query_tokens = set(re.findall(r'\w+', transformed_query.lower()))
        for i, doc in enumerate(retrieved_docs):
            score = float(rerank_scores[i])
            meta = doc['metadata']
            if score < MIN_RERANK_SCORE:
                continue
            content_tokens = set(re.findall(r'\w+', doc['content'].lower()))
            if not query_tokens.intersection(content_tokens):
                continue
            reranked_results.append({
                "rerank_score": score,
                "content": doc['content'],
                "source": meta.get("source", meta.get("filename", "Unknown")),
                "page": meta.get("page_number", "N/A")
            })

        reranked_results.sort(key=lambda x: x["rerank_score"], reverse=True)
        return reranked_results[:RERANK_TOP_K]
    # === END MODIFICATION 4 ===

    def _extract_structured_text(self, path: Path) -> List[Dict[str, Any]]:
        try:
            elements = partition(filename=str(path))
            structured_docs = []
            for el in elements:
                metadata = {"source": str(path), "filename": path.name}
                if hasattr(el, 'metadata') and el.metadata.page_number:
                    metadata["page_number"] = el.metadata.page_number
                structured_docs.append({"content": el.text, "metadata": metadata})
            return structured_docs
        except Exception as e:
            logging.warning(f"Failed to parse with unstructured {path.name}: {e}")
            return [{"content": path.read_text(errors="ignore"), "metadata": {"source": str(path), "filename": path.name}}]

    @staticmethod
    def _clean_text(text: str) -> str:
        return re.sub(r"\s+", " ", text).strip()

    def _save_faiss_index(self):
        if self.index and self.index.ntotal > 0:
            logging.info(f"Saving FAISS index to {self.index_path}")
            faiss.write_index(self.index, str(self.index_path))
            with open(self.doc_store_path, "wb") as f:
                pickle.dump(self.doc_store, f)
            logging.info("Index and doc store saved.")
        else:
            logging.warning("Attempted to save an empty index. Skipping.")


    def _load_faiss_index(self):
        if self.index_path.exists() and self.doc_store_path.exists():
            logging.info(f"Loading FAISS index from {self.index_path}")
            self.index = faiss.read_index(str(self.index_path))
            with open(self.doc_store_path, "rb") as f:
                self.doc_store = pickle.load(f)
            logging.info(f"FAISS index with {self.index.ntotal} vectors and doc store loaded.")
        else:
            logging.warning("No FAISS index found. Initializing a new one.")
            d = self.embedding_model.get_sentence_embedding_dimension()
            self.index = faiss.IndexFlatIP(d) 

    def load_resources(self):
        if not self.embedding_model:
            logging.info("Loading embedding and re-ranker models...")
            self.embedding_model = SentenceTransformer(EMBEDDING_MODEL_NAME, device=EMBEDDING_DEVICE)
            self.reranker = CrossEncoder(RERANKER_MODEL_NAME, device=EMBEDDING_DEVICE)

        if not self.index:
            self._load_faiss_index()
            
        self.is_running = True
        logging.info("All resources loaded and ready.")

    def run(self):
        thread = threading.Thread(target=self.load_resources)
        thread.start()
    
    def persist_index(self):
        self._save_faiss_index()

    def cleanup(self):
        self.embedding_model = None
        self.reranker = None
        self.index = None
        self.doc_store = []
        self.is_running = False
        gc.collect()
        logging.info("RAG System resources cleaned up.")


class DocumentHandler:
    def __init__(self, rag_system: RAGSystem):
        self.rag_system = rag_system
        self.debounce_timers = {}

    def _debounce(self, path_str: str, action):
        if path_str in self.debounce_timers:
            self.debounce_timers[path_str].cancel()
        timer = threading.Timer(WATCHER_DEBOUNCE_SECONDS, action)
        self.debounce_timers[path_str] = timer
        timer.start()

    def _process_and_index(self, path_str: str):
        try:
            result = self.rag_system.process_document(Path(path_str))
            if result:
                chunks, embeddings = result
                self.rag_system.add_chunks_to_index(chunks, embeddings)
        except Exception as e:
            logging.error(f"Failed to process/index {path_str}: {e}", exc_info=True)

    def on_created(self, event):
        if not event.is_directory:
            self._debounce(event.src_path, lambda: self._process_and_index(event.src_path))

    def on_modified(self, event):
        if not event.is_directory:
            self._debounce(event.src_path, lambda: self._process_and_index(event.src_path))


def start_watcher(rag_system: RAGSystem):
    from watchdog.observers import Observer
    handler = DocumentHandler(rag_system)
    observer = Observer()
    observer.schedule(handler, path=DOCUMENTS_DIR, recursive=True)
    observer.start()
    logging.info(f"Started watching {DOCUMENTS_DIR} for changes.")
    return observer