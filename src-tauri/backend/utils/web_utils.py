from ddgs import DDGS
import asyncio
from sentence_transformers import SentenceTransformer, util
from bs4 import BeautifulSoup
import re
import aiohttp
from urllib.parse import urlparse
from bs4 import BeautifulSoup
import html
import trafilatura
from readability import Document
from datetime import datetime
from constants import TRUSTED_DOMAINS, TOKEN_ENCODER, MAX_CONTEXT_TOKENS
import json
import logging
import torch 
from urllib.parse import urlparse
import asyncio

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
            # self.model = SentenceTransformer(model_name)
            self.model = None
            self.model_name = model_name
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

    def run(self):
        logging.info(f"Loading sentence transformer model: {self.model_name}...")
        self.model = SentenceTransformer(self.model_name)

# ==============================================================================
# WEB SEARCH FUNCTIONS
# ==============================================================================

def process_crawled_results(crawled_data, query, content_extractor):
    processed_results = []
    for page in crawled_data:
        if not page.get('content'):
            continue
        relevant_content, semantic_score, structured_fields = content_extractor.extract_relevant_sections(
            page['content'], query, html_content=page.get('html_content'), url=page['url']
        )
        if relevant_content:
            domain_priority = get_domain_priority(page['url'])
            domain = urlparse(page['url']).netloc.lower()
            is_trusted = any(trusted in domain for trusted in TRUSTED_DOMAINS.keys())
            if is_trusted:
                combined_score = max(domain_priority * semantic_score, domain_priority * 0.4)
            elif domain_priority >= 1.0:
                combined_score = max(domain_priority * semantic_score, domain_priority * 0.3)
            else:
                combined_score = domain_priority * semantic_score
            recency_multiplier = recency_score_multiplier(structured_fields)
            combined_score *= recency_multiplier
            page['content'] = relevant_content
            page['semantic_score'] = semantic_score
            page['domain_priority'] = domain_priority
            page['combined_score'] = combined_score
            page['structured_fields'] = structured_fields
            page['is_trusted'] = is_trusted
            page['recency_multiplier'] = recency_multiplier
            threshold = 0.005 if is_trusted else 0.01
            if combined_score > threshold:
                processed_results.append(page)
    processed_results.sort(key=lambda x: x.get('combined_score', 0.0), reverse=True)
    return processed_results

def build_search_context(final_results, query, content_extractor):
    golden_source = final_results[0]
    supporting_sources = final_results[1:3]
    golden_source_info = {"url": golden_source.get('url'), "title": golden_source.get('title')}
    search_context = (
        f"**Primary Source:**\nTitle: {golden_source.get('title')}\nURL: {golden_source.get('url')}\n"
    )
    if golden_source.get('structured_fields'):
        search_context += f"Key Facts: {golden_source['structured_fields']}\n"
    search_context += f"Relevant Information:\n---\n{golden_source.get('content')}\n---\n\n"
    current_tokens = content_extractor.count_tokens(search_context)
    if supporting_sources and current_tokens < MAX_CONTEXT_TOKENS - 500:
        search_context += "**Supporting Evidence:**\n"
        for source in supporting_sources:
            source_snippet = source.get('content', '')[:500]
            fields_str = f" (Key Facts: {source['structured_fields']})" if source.get('structured_fields') else ""
            source_text = f"- From {source.get('url')}{fields_str}: \"{source_snippet}...\"\n"
            if current_tokens + content_extractor.count_tokens(source_text) > MAX_CONTEXT_TOKENS - 200:
                break
            search_context += source_text
            current_tokens += content_extractor.count_tokens(source_text)
    context_len = len(search_context)
    final_tokens = content_extractor.count_tokens(search_context)
    return search_context, golden_source_info, context_len, final_tokens, supporting_sources


def get_domain_priority(url: str) -> float:
    """Return domain priority with trusted domain whitelist."""
    domain = urlparse(url).netloc.lower()
    
    # Check trusted domains first
    for trusted_domain, priority in TRUSTED_DOMAINS.items():
        if trusted_domain in domain:
            return priority
    return 0.2

def extract_tables_from_html(html_content: str) -> list:
    """Extract tables from HTML and return as Markdown strings."""
    soup = BeautifulSoup(html_content, "html.parser")
    tables = []
    for table in soup.find_all("table"):
        rows = []
        for tr in table.find_all("tr"):
            cells = tr.find_all(["th", "td"])
            row = [cell.get_text(strip=True) for cell in cells]
            rows.append(row)
        # Convert to Markdown table if possible
        if rows:
            header = rows[0]
            md = "| " + " | ".join(header) + " |\n"
            md += "| " + " | ".join("---" for _ in header) + " |\n"
            for row in rows[1:]:
                md += "| " + " | ".join(row) + " |\n"
            tables.append(md.strip())
    return tables

async def fetch_with_http_enhanced(session: aiohttp.ClientSession, url: str) -> tuple[str, str, str, list]:
    """Enhanced fetch with HTML content preservation for structured data extraction and table extraction."""
    try:
        async with session.get(url, timeout=8, allow_redirects=True) as response:
            if response.status == 200:
                html_content = await response.text()
                
                # Primary: Use trafilatura for main content extraction
                content = trafilatura.extract(
                    html_content, 
                    include_comments=False, 
                    include_tables=True, 
                    no_fallback=False,
                    favor_precision=True
                )
                
                # Fallback: Use readability if trafilatura fails
                if not content or len(content) < 100:
                    try:
                        doc = Document(html_content)
                        soup = BeautifulSoup(doc.summary(), "html.parser")
                        content = soup.get_text(separator=" ")
                    except:
                        # Final fallback: BeautifulSoup only
                        soup = BeautifulSoup(html_content, "html.parser")
                        content = soup.get_text(separator=" ")
                
                # Extract title
                soup = BeautifulSoup(html_content, "html.parser")
                title = soup.title.string if soup.title else "No Title"
                
                # Clean up content
                content = html.unescape(content)
                content = re.sub(r'\s+', ' ', content).strip()

                # Extract tables as Markdown
                tables = extract_tables_from_html(html_content)
                
                return content, title, html_content, tables  # Return HTML and tables for structured extraction
    except Exception as e:
        logging.warning(f"HTTP fetch failed for {url}: {e}")
    return None, None, None, []

async def crawl_webpages_hybrid(urls: list[str]) -> list[dict]:
    """Enhanced crawler with trusted domain prioritization and structured data extraction."""
    # Sort by domain priority first, then by trusted status
    def sort_key(url):
        domain_priority = get_domain_priority(url)
        is_trusted = any(trusted in urlparse(url).netloc.lower() for trusted in TRUSTED_DOMAINS.keys())
        return (is_trusted, domain_priority)
    
    prioritized_urls = sorted(urls, key=sort_key, reverse=True)
    skip_domains = ['pinterest.com', 'slideshare.net', 'youtube.com', 'vimeo.com', 'twitter.com', 'facebook.com']
    filtered_urls = [u for u in prioritized_urls if urlparse(u).netloc.lower() not in skip_domains][:12]  # Increased from 10
    logging.info(f"Crawling top {len(filtered_urls)} prioritized URLs...")

    results = []
    connector = aiohttp.TCPConnector(limit_per_host=5, limit=50, ssl=False)
    async with aiohttp.ClientSession(connector=connector, headers={'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'}) as session:
        tasks = [fetch_with_http_enhanced(session, url) for url in filtered_urls]
        crawl_results = await asyncio.gather(*tasks)

    for i, res in enumerate(crawl_results):
        content, title, html_content, tables = res
        if content and len(content) > 200:
            results.append({
                'url': filtered_urls[i], 
                'title': title, 
                'content': content,
                'html_content': html_content,  # Preserve for structured extraction
                'tables': tables               # Add extracted tables as a separate field
            })

    logging.info(f"Crawling complete. Got {len(results)} potential results.")
    return results

def get_web_urls(search_term: str, num_results: int = 18) -> list[str]:  # Increased from 15
    """Enhanced search with Wikipedia language specification."""
    try:
        with DDGS() as ddgs:
            # Configure for English Wikipedia and higher result count
            results = ddgs.text(search_term, region='wt-wt', safesearch='moderate', max_results=num_results)
            urls = [r["href"] for r in results] if results else []
            
            # Boost Wikipedia URLs by ensuring en.wikipedia.org is included
            wiki_search = f"{search_term} site:en.wikipedia.org"
            wiki_results = ddgs.text(wiki_search, region='wt-wt', max_results=3)
            if wiki_results:
                wiki_urls = [r["href"] for r in wiki_results]
                # Prepend Wikipedia URLs to prioritize them
                urls = wiki_urls + [url for url in urls if url not in wiki_urls]
            
            return urls
    except Exception as e:
        logging.error(f"DDGS search failed: {e}")
        return []

def clean_html(raw_html: str) -> str:
    """
    DEPRECATED: This function is now replaced by the enhanced cleaning in fetch_with_http_enhanced.
    Kept for compatibility but should not be called.
    """
    logging.warning("clean_html function is deprecated, use fetch_with_http_enhanced instead")
    return trafilatura.extract(raw_html, include_comments=False, include_tables=True, no_fallback=True) or ""

def detect_dynamic_stop_tokens(query: str) -> list[str]:
    """Detect user's question patterns and generate appropriate stop tokens."""
    base_stops = ["</s>", "\n\n"]
    
    # Detect question patterns
    if re.search(r'\b(?:Q:|Question:|Ask:)\s*', query, re.IGNORECASE):
        base_stops.extend(["Q:", "Question:", "\nQ:", "\nQuestion:"])
    
    if "?" in query:
        base_stops.append("\n?")
    
    # Always add answer pattern stops
    base_stops.extend(["Answer:", "\nAnswer:", "\n\nAnswer:"])
    
    return base_stops

def recency_score_multiplier(structured_fields: dict) -> float:
    """Calculate recency score based on publish date from structured fields."""
    try:
        # Try to extract date from various field names
        date_str = (structured_fields.get('release_date') or 
                   structured_fields.get('published_date') or 
                   structured_fields.get('date'))
        
        if not date_str:
            return 1.0  # neutral score if no date found
        
        # Parse various date formats
        publish_date = None
        date_formats = [
            '%Y-%m-%d',  # 2023-12-01
            '%Y-%m-%dT%H:%M:%SZ',  # 2023-12-01T10:30:00Z (ISO format)
            '%Y-%m-%dT%H:%M:%S',   # 2023-12-01T10:30:00
            '%B %d, %Y',  # December 1, 2023
            '%b %d, %Y',  # Dec 1, 2023
            '%m/%d/%Y',  # 12/01/2023
            '%d/%m/%Y',  # 01/12/2023
            '%Y'  # 2023 (year only)
        ]
        
        date_str = str(date_str).strip()
        
        for fmt in date_formats:
            try:
                publish_date = datetime.strptime(date_str, fmt)
                break
            except ValueError:
                continue
        
        # If standard formats fail, try extracting just the year
        if not publish_date:
            year_match = re.search(r'\b(19|20)\d{2}\b', date_str)
            if year_match:
                publish_date = datetime(int(year_match.group()), 1, 1)
        
        if publish_date:
            days_old = (datetime.now() - publish_date).days
            print('THIS DOCUMENT IS : ', days_old, 'Days Old')
            if days_old <= 7:
                return 1.5  # very fresh
            elif days_old <= 30:
                return 1.2  # recent
            elif days_old <= 180:
                return 1.0  # acceptable
            elif days_old <= 365:
                return 0.9  # getting old
            else:
                return 0.8  # stale, penalize
        
    except Exception as e:
        logging.debug(f"Error calculating recency score for date '{date_str}': {e}")
    
    return 1.0  # neutral score if parsing fails
