import asyncio
import json
import logging
import re
from datetime import datetime
from urllib.parse import urlparse
import httpx  # IMPORTANT: Use httpx to match the client from your FastAPI app
import html
import trafilatura
from bs4 import BeautifulSoup
from ddgs import DDGS

# It's recommended to keep these in a separate constants.py file
# For this example, they are included here for completeness.
TRUSTED_DOMAINS = {
    "wikipedia.org": 1.5,
    "reuters.com": 1.4,
    "apnews.com": 1.4,
    "bbc.com": 1.3,
    "nytimes.com": 1.3,
    "imdb.com": 1.2,
    "gov": 1.2,
    "edu": 1.1,
}

# ==============================================================================
# UTILITY FUNCTIONS
# ==============================================================================

def get_domain_priority(url: str) -> float:
    """Assigns a priority score to a URL based on its domain."""
    domain = urlparse(url).netloc.lower()
    for trusted_domain, priority in TRUSTED_DOMAINS.items():
        if trusted_domain in domain:
            return priority
    return 0.2 # Default priority for non-trusted domains

def recency_score_multiplier(structured_fields: dict) -> float:
    """
    Calculates a score multiplier based on the content's publication date.
    """
    date_str = (structured_fields.get('release_date') or
                structured_fields.get('published_date') or
                structured_fields.get('date'))
    if not date_str:
        return 1.0

    date_formats = [
        '%Y-%m-%d', '%Y-%m-%dT%H:%M:%SZ', '%Y-%m-%dT%H:%M:%S',
        '%B %d, %Y', '%b %d, %Y', '%Y', '%m/%d/%Y', '%d/%m/%Y'
    ]
    
    publish_date = None
    for fmt in date_formats:
        try:
            publish_date = datetime.strptime(str(date_str).strip(), fmt)
            break
        except (ValueError, TypeError):
            continue
            
    if not publish_date:
        year_match = re.search(r'\b(19|20)\d{2}\b', str(date_str))
        if year_match:
            publish_date = datetime(int(year_match.group()), 1, 1)

    if publish_date:
        days_old = (datetime.now() - publish_date).days
        if days_old <= 7: return 1.5
        if days_old <= 30: return 1.2
        if days_old <= 180: return 1.0
        if days_old <= 365: return 0.9
        return 0.8
    
    return 1.0

def extract_tables_from_html(html_content: str) -> list[str]:
    """Extracts tables from HTML and converts them to Markdown format."""
    soup = BeautifulSoup(html_content, "html.parser")
    markdown_tables = []
    for table in soup.find_all("table"):
        rows = []
        for tr in table.find_all("tr"):
            cells = [cell.get_text(strip=True) for cell in tr.find_all(["th", "td"])]
            rows.append("| " + " | ".join(cells) + " |")
        if rows:
            header = rows[0]
            separator = "| " + " | ".join(["---"] * len(header.split('|')[1:-1])) + " |"
            markdown_tables.append("\n".join([header, separator] + rows[1:]))
    return markdown_tables

# ==============================================================================
# CORE CONTENT AND DATA EXTRACTOR
# ==============================================================================

class ContentExtractor:
    """
    A comprehensive extractor that handles structured data parsing,
    and content cleaning without heavy semantic models.
    """
    def __init__(self):
        # No model loading needed to keep it lightweight
        pass

    @staticmethod
    def _extract_json_ld(html_content: str) -> dict:
        """Helper to extract and parse JSON-LD structured data from HTML."""
        soup = BeautifulSoup(html_content, 'html.parser')
        json_ld_scripts = soup.find_all('script', type='application/ld+json')
        extracted_data = {}
        for script in json_ld_scripts:
            try:
                data = json.loads(script.string)
                if isinstance(data, list):
                    data = data[0] if data else {}
                
                if data.get('@type') in ['Movie', 'TVSeries', 'TVEpisode']:
                    extracted_data.update({
                        'title': data.get('name'),
                        'release_date': data.get('datePublished') or data.get('dateCreated'),
                        'description': data.get('description')
                    })
                if 'award' in data or 'awards' in data:
                    extracted_data['awards'] = data.get('award') or data.get('awards', [])

            except (json.JSONDecodeError, AttributeError, TypeError):
                continue
        return extracted_data

    @staticmethod
    def _extract_meta_tags(html_content: str) -> dict:
        """Helper to extract relevant meta tags (OpenGraph, etc.) from HTML."""
        soup = BeautifulSoup(html_content, 'html.parser')
        extracted_data = {}
        og_tags = {
            'og:title': 'title', 'og:description': 'description',
            'article:published_time': 'published_date', 'og:type': 'content_type'
        }
        for prop, key in og_tags.items():
            meta = soup.find('meta', property=prop)
            if meta and meta.get('content'):
                extracted_data[key] = meta['content']
        return extracted_data

    def extract_structured_fields(self, html_content: str) -> dict:
        """Extracts structured data from JSON-LD and meta tags."""
        if not html_content:
            return {}
        json_ld_data = self._extract_json_ld(html_content)
        meta_data = self._extract_meta_tags(html_content)
        return {**meta_data, **json_ld_data}

    @staticmethod
    def intelligent_truncate(text: str, max_tokens: int = 500) -> str:
        """Truncates text to a maximum token count, preserving whole sentences."""
        if len(text.split()) <= max_tokens:
            return text
        truncated = text[:max_tokens * 4]
        last_punc = max(truncated.rfind('.'), truncated.rfind('!'), truncated.rfind('?'))
        if last_punc > 0:
            return truncated[:last_punc + 1]
        return truncated + "..."

    def extract_relevant_sections(self, content: str, html_content: str, **kwargs) -> tuple[str, float, dict]:
        """
        Extracts relevant sections. The signature includes **kwargs to accept
        unused arguments like 'query' or 'url' without causing an error.
        This version is lightweight and doesn't perform semantic search.
        """
        if not content:
            return "", 0.0, {}
        
        structured_fields = self.extract_structured_fields(html_content)
        
        # In this lightweight version, we don't do semantic scoring.
        # We just clean and truncate the main content.
        # The 'semantic_score' is returned as 0.0 for compatibility.
        cleaned_content = html.unescape(content or "").strip()
        truncated_content = self.intelligent_truncate(cleaned_content, 600)
        
        # Return 0.0 for semantic_score to maintain signature compatibility
        return truncated_content, 0.0, structured_fields

# ==============================================================================
# WEB CRAWLING AND PROCESSING ORCHESTRATION
# ==============================================================================

def get_web_urls(search_term: str, num_results: int = 18) -> list[str]:
    """
    Performs a web search using DDGS.
    FIXED: Uses a stable 'us-en' region to prevent DDGS exceptions.
    """
    logging.info(f"Searching web for: {search_term}")
    urls = []
    try:
        with DDGS() as ddgs:
            # Using 'us-en' region for better stability
            results = ddgs.text(search_term, region='us-en', safesearch='moderate', max_results=num_results)
            if results:
                urls.extend([r["href"] for r in results])
            
            wiki_search = f"{search_term} site:en.wikipedia.org"
            wiki_results = ddgs.text(wiki_search, region='us-en', max_results=3)
            if wiki_results:
                wiki_urls = [r["href"] for r in wiki_results]
                urls = wiki_urls + [url for url in urls if url not in wiki_urls]
            
            return list(dict.fromkeys(urls)) # Remove duplicates
    except Exception as e:
        logging.error(f"DDGS search failed: {e}")
        return urls

async def fetch_with_http_enhanced(session: httpx.AsyncClient, url: str) -> tuple[str, str, str, list]:
    """
    Fetches a webpage using httpx.AsyncClient.
    FIXED: Uses `follow_redirects=True` instead of the old `allow_redirects`.
    """
    try:
        # Use httpx syntax: `follow_redirects=True`
        response = await session.get(url, timeout=10, follow_redirects=True)
        
        if response.status_code != 200:
            return None, None, None, []
        
        html_content = response.text
        content = trafilatura.extract(html_content, include_comments=False, include_tables=True, no_fallback=False, favor_precision=True)
        soup = BeautifulSoup(html_content, "html.parser")
        title = soup.title.string if soup.title else "No Title"
        cleaned_content = html.unescape(content or "").strip()
        tables = extract_tables_from_html(html_content)
        
        return cleaned_content, title, html_content, tables
    except Exception as e:
        logging.warning(f"HTTP fetch failed for {url}: {e}")
        return None, None, None, []

async def crawl_webpages_hybrid(urls: list[str], http_client: httpx.AsyncClient) -> list[dict]:
    """Crawls a list of URLs asynchronously, prioritizing trusted domains."""
    prioritized_urls = sorted(urls, key=get_domain_priority, reverse=True)
    skip_domains = ['pinterest.com', 'slideshare.net', 'youtube.com', 'twitter.com', 'facebook.com']
    filtered_urls = [u for u in prioritized_urls if urlparse(u).netloc.lower() not in skip_domains][:10]

    tasks = [fetch_with_http_enhanced(http_client, url) for url in filtered_urls]
    crawl_results = await asyncio.gather(*tasks)

    results = []
    for i, res in enumerate(crawl_results):
        content, title, html_content, tables = res
        if content and len(content) > 100:
            results.append({
                'url': filtered_urls[i], 'title': title, 'content': content,
                'html_content': html_content, 'tables': tables
            })
    return results

def process_crawled_results(crawled_data: list[dict], query: str, content_extractor: ContentExtractor) -> list[dict]:
    """
    Processes crawled data to extract info, score it, and rank it.
    NOTE: 'query' is accepted as an argument to match the caller but is not used in this version.
    """
    processed_results = []
    for page in crawled_data:
        # The 'query' argument is passed along but not used in this lightweight version
        relevant_content, semantic_score, structured_fields = content_extractor.extract_relevant_sections(
            page['content'], page.get('html_content'), query=query, url=page['url']
        )
        if relevant_content:
            domain_priority = get_domain_priority(page['url'])
            recency_mult = recency_score_multiplier(structured_fields)
            is_trusted = domain_priority > 1.0

            # The final score is a combination of domain trust and freshness
            # The 'semantic_score' from extract_relevant_sections is 0.0 here
            combined_score = (semantic_score + 0.1) * domain_priority * recency_mult
            
            page.update({
                'content': relevant_content,
                'score': combined_score,  # Renamed 'combined_score' to 'score' for compatibility
                'structured_fields': structured_fields,
            })
            processed_results.append(page)
            
    processed_results.sort(key=lambda x: x.get('score', 0.0), reverse=True)
    return processed_results

def build_search_context(final_results: list[dict], query: str, content_extractor: ContentExtractor, max_tokens: int = 3500) -> tuple:
    """
    Builds the final context string.
    NOTE: 'query' and 'content_extractor' are accepted but not used in this version.
    """
    if not final_results:
        return "", {}, 0, 0, []

    primary_source = final_results[0]
    supporting_sources = final_results[1:4]
    primary_source_info = {"url": primary_source.get('url'), "title": primary_source.get('title')}
    
    search_context = f"**Primary Source:**\nTitle: {primary_source.get('title')}\nURL: {primary_source.get('url')}\n"
    if primary_source.get('structured_fields'):
        key_facts = {k: v for k, v in primary_source['structured_fields'].items() if v}
        if key_facts:
            search_context += f"Key Facts: {json.dumps(key_facts)}\n"
            
    search_context += f"Relevant Information:\n---\n{primary_source.get('content')}\n---\n\n"

    current_tokens = len(search_context.split())

    if supporting_sources and current_tokens < max_tokens - 500:
        search_context += "**Supporting Evidence:**\n"
        for source in supporting_sources:
            source_snippet = source.get('content', '')[:400]
            source_text = f"- From {source.get('url')}: \"{source_snippet}...\"\n"
            if current_tokens + len(source_text.split()) > max_tokens:
                break
            search_context += source_text
            current_tokens += len(source_text.split())

    final_tokens = len(search_context.split())
    return search_context, primary_source_info, len(search_context), final_tokens, supporting_sources