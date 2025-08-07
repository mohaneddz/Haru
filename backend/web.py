from ddgs import DDGS
import asyncio

import re
import aiohttp
from urllib.parse import urlparse
from bs4 import BeautifulSoup
import html
import trafilatura
from readability import Document
from datetime import datetime
from constants import WIKIPEDIA_API_URL, OMDB_API_KEY, TRUSTED_DOMAINS
from classes import *

async def fetch_wikipedia_api_data(title: str) -> dict:
    """Fetch structured data from Wikipedia API as fallback."""
    try:
        # Clean title for API call
        clean_title = re.sub(r'[^\w\s]', '', title).replace(' ', '_')
        url = f"{WIKIPEDIA_API_URL}{clean_title}"
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=5) as response:
                if response.status == 200:
                    data = await response.json()
                    return {
                        'title': data.get('title'),
                        'description': data.get('extract'),
                        'published_date': data.get('timestamp'),
                        'canonical_url': data.get('content_urls', {}).get('desktop', {}).get('page')
                    }
    except Exception as e:
        logging.debug(f"Wikipedia API fallback failed: {e}")
    
    return {}

async def fetch_omdb_api_data(title: str, year: str = None) -> dict:
    """Fetch movie data from OMDb API as fallback."""
    if not OMDB_API_KEY or OMDB_API_KEY == "your_omdb_key":
        return {}
    
    try:
        params = {'apikey': OMDB_API_KEY, 't': title}
        if year:
            params['y'] = year
            
        async with aiohttp.ClientSession() as session:
            async with session.get('http://www.omdbapi.com/', params=params, timeout=5) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get('Response') == 'True':
                        return {
                            'title': data.get('Title'),
                            'release_date': data.get('Released'),
                            'genre': data.get('Genre'),
                            'director': data.get('Director'),
                            'actors': data.get('Actors', '').split(', '),
                            'awards': data.get('Awards'),
                            'rating': data.get('imdbRating'),
                            'plot': data.get('Plot')
                        }
    except Exception as e:
        logging.debug(f"OMDb API fallback failed: {e}")
    
    return {}

# ==============================================================================
# WEB SEARCH FUNCTIONS
# ==============================================================================

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