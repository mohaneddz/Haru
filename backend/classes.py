from bs4 import BeautifulSoup
import torch
import json
import logging
import re
from sentence_transformers import SentenceTransformer, util
from constants import *
from urllib.parse import urlparse

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
            
            if (not relevant_chunks or sum(len(chunk['text']) for chunk in relevant_chunks) < 150) and is_trusted:
                logging.info(f"Trusted domain {domain}: including more chunks regardless of semantic score")
                # For trusted domains, include more chunks with even lower threshold
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


