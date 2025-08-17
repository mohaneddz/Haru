import os
import re
import gc
import logging
import threading
from pathlib import Path
from typing import List, Dict, Any

from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
from sentence_transformers.cross_encoder import CrossEncoder
from unstructured.partition.auto import partition
import chromadb

from config.constants import (
    CHUNK_SIZE, CHUNK_OVERLAP, PERSIST_DIRECTORY, COLLECTION_NAME,
    EMBEDDING_BATCH_SIZE, DOCUMENTS_DIR, SUPPORTED_EXTS,
    RETRIEVAL_TOP_K, RERANK_TOP_K, EMBEDDING_DEVICE,
    EMBEDDING_MODEL_NAME, RERANKER_MODEL_NAME, MAX_WORKERS,
    USE_8BIT_QUANTIZATION, WATCHER_DEBOUNCE_SECONDS, MIN_RERANK_SCORE
)

class RAGSystem:
    """Advanced RAG with re-ranking, rich metadata, and memory optimization."""

    def __init__(self):
        logging.info("Initializing RAG System...")
        self.embedding_model = None
        self.reranker = None
        self.is_running = False

        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=CHUNK_SIZE,
            chunk_overlap=CHUNK_OVERLAP
        )
        self.client = None
        self.collection = None
        logging.info("RAG System Ready. Loading resources in the background...")
        self.run()

    def _transform_query(self, query: str) -> str:
        """
        Placeholder for query transformation techniques like HyDE.
        For now, it returns the original query.
        """
        return query

    def process_document(self, file_path: Path):
        try:
            structured_elements = self._extract_structured_text(file_path)
            if not structured_elements:
                return

            all_chunks, all_metadata = [], []
            for element in structured_elements:
                chunks = self.text_splitter.split_text(element['content'])
                base_metadata = element['metadata']
                for i, chunk_text in enumerate(chunks):
                    metadata = base_metadata.copy()
                    metadata["chunk_index"] = i
                    all_chunks.append(self._clean_text(chunk_text))
                    all_metadata.append(metadata)

            if not all_chunks:
                return

            chunk_ids = [f"{file_path}_{i}" for i in range(len(all_chunks))]
            embeddings = self.embedding_model.encode(
                all_chunks, batch_size=EMBEDDING_BATCH_SIZE,
                normalize_embeddings=True, show_progress_bar=False
            ).tolist()

            self.collection.add(
                documents=all_chunks, metadatas=all_metadata,
                ids=chunk_ids, embeddings=embeddings
            )
            logging.info(f"Indexed {len(all_chunks)} chunks from {file_path.name}")
        except Exception as e:
            logging.error(f"Error processing {file_path}: {e}", exc_info=True)

    def build_index_from_directory(self, force_rebuild=False):
        if force_rebuild and self.client.get_collection(name=COLLECTION_NAME):
            logging.info(f"Rebuilding index. Deleting old collection: {COLLECTION_NAME}")
            self.client.delete_collection(name=COLLECTION_NAME)
            self.collection = self.client.get_or_create_collection(
                name=COLLECTION_NAME, metadata={"hnsw:space": "ip"}
            )

        files = [f for f in Path(DOCUMENTS_DIR).rglob("*") if f.suffix.lower() in SUPPORTED_EXTS]
        from concurrent.futures import ThreadPoolExecutor
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            executor.map(self.process_document, files)
        logging.info("Index build complete.")

    def retrieve_context(self, query: str) -> List[Dict[str, Any]]:
        if not self.is_running:
            raise RuntimeError("Resources not loaded yet. Please wait.")

        transformed_query = self._transform_query(query)
        query_emb = self.embedding_model.encode(
            [transformed_query], normalize_embeddings=True
        ).tolist()

        results = self.collection.query(
            query_embeddings=query_emb, n_results=RETRIEVAL_TOP_K,
            include=["metadatas", "documents"]
        )
        if not results["ids"] or not results["documents"]:
            return []

        query_doc_pairs = [[query, doc] for doc in results["documents"][0]]
        rerank_scores = self.reranker.predict(query_doc_pairs)

        reranked_results = []
        query_tokens = set(re.findall(r'\w+', query.lower()))  # basic token set for filtering

        for i, doc_content in enumerate(results["documents"][0]):
            score = rerank_scores[i]
            meta = results["metadatas"][0][i]

            # Filter 1: Minimum rerank score threshold
            if score < MIN_RERANK_SCORE:
                continue

            # Filter 2: Check if doc contains query keywords (simple containment)
            content_tokens = set(re.findall(r'\w+', doc_content.lower()))
            if not query_tokens.intersection(content_tokens):
                continue

            reranked_results.append({
                "rerank_score": score,
                "content": doc_content,
                "source": meta.get("filename", "Unknown"),
                "page": meta.get("page_number", "N/A")
            })

        reranked_results.sort(key=lambda x: x["rerank_score"], reverse=True)

        # Limit to top rerank results after filtering
        return reranked_results[:RERANK_TOP_K]
    
    def _extract_structured_text(self, path: Path) -> List[Dict[str, Any]]:
        try:
            elements = partition(filename=str(path))
            structured_docs = []
            for el in elements:
                metadata = {"source": str(path), "filename": path.name}
                if hasattr(el, 'metadata'):
                    if el.metadata.page_number:
                        metadata["page_number"] = el.metadata.page_number
                structured_docs.append({"content": el.text, "metadata": metadata})
            return structured_docs
        except Exception as e:
            logging.warning(f"Failed to parse with unstructured {path.name}: {e}")
            return [{"content": path.read_text(errors="ignore"), "metadata": {"source": str(path), "filename": path.name}}]

    @staticmethod
    def _clean_text(text: str) -> str:
        return re.sub(r"\s+", " ", text).strip()

    def load_resources(self):
        if not self.embedding_model:
            logging.info("Loading embedding and re-ranker models...")
            model_kwargs = {'device': EMBEDDING_DEVICE}

            # Remove quantization code:
            # if USE_8BIT_QUANTIZATION:
            #     from transformers import BitsAndBytesConfig
            #     model_kwargs['quantization_config'] = BitsAndBytesConfig(
            #         load_in_8bit=True, bnb_8bit_compute_dtype="float16"
            #     )

            self.embedding_model = SentenceTransformer(EMBEDDING_MODEL_NAME, device=EMBEDDING_DEVICE)
            self.reranker = CrossEncoder(RERANKER_MODEL_NAME, device=EMBEDDING_DEVICE)

        if not self.client:
            os.environ["CHROMA_TELEMETRY_ENABLED"] = "false"
            self.client = chromadb.PersistentClient(path=PERSIST_DIRECTORY)

        self.collection = self.client.get_or_create_collection(
            name=COLLECTION_NAME, metadata={"hnsw:space": "ip"}
        )
        self.is_running = True
        logging.info("All resources loaded and ready.")

    def run(self):
        thread = threading.Thread(target=self.load_resources)
        thread.start()

def cleanup(self):
    self.embedding_model = None
    self.reranker = None
    self.client = None
    self.collection = None
    self.is_running = False
    gc.collect()
    # No torch import, no cuda cache clearing
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

    def on_created(self, event):
        if not event.is_directory:
            self._debounce(event.src_path, lambda: self.rag_system.process_document(Path(event.src_path)))

    def on_modified(self, event):
        if not event.is_directory:
            self._debounce(event.src_path, lambda: self.rag_system.process_document(Path(event.src_path)))


def start_watcher(rag_system: RAGSystem):
    from watchdog.observers import Observer
    handler = DocumentHandler(rag_system)
    observer = Observer()
    observer.schedule(handler, path=DOCUMENTS_DIR, recursive=True)
    observer.start()
    logging.info(f"Started watching {DOCUMENTS_DIR} for changes.")
    return observer
