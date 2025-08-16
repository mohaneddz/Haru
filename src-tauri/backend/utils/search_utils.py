import re
import json
import asyncio
import logging

from datetime import datetime, timezone
from urllib.parse import urlparse, urlunparse, parse_qsl, urlencode

import httpx
import html
import trafilatura
import concurrent.futures

from bs4 import BeautifulSoup
from ddgs import DDGS
from dateutil import parser

from config.constants import TRUSTED_DOMAINS, MAX_CONCURRENCY, USER_AGENT


HTTPX_LIMITS = httpx.Limits(max_connections=MAX_CONCURRENCY, max_keepalive_connections=MAX_CONCURRENCY)

def build_search_context(final_results: list[dict], query: str, content_extractor, max_tokens: int = 3500) -> tuple:
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

def extract_trafilatura(html_content: str) -> str:
    # Use positional args only for trafilatura.extract
    return trafilatura.extract(html_content, False, True, False, False)

async def fetch_with_http_enhanced(session: httpx.AsyncClient, url: str) -> tuple[str, str, str, list]:
    try:
        async with session.stream("GET", url, timeout=10, follow_redirects=True) as response:
            if response.status_code != 200:
                return None, None, None, []
            ctype = response.headers.get("content-type", "")
            if "text/html" not in ctype:
                return None, None, None, []

            html_bytes = await response.aread()
            html_content = html_bytes.decode(errors='ignore')

        loop = asyncio.get_running_loop()
        # Create ProcessPoolExecutor per call
        with concurrent.futures.ProcessPoolExecutor(max_workers=1) as pool:
            content = await loop.run_in_executor(pool, extract_trafilatura, html_content)

        soup = BeautifulSoup(html_content, "html.parser")
        title = soup.title.string if soup.title else "No Title"
        cleaned_content = html.unescape(content or "").strip()
        tables = extract_tables_from_html(html_content)

        return cleaned_content, title, html_content, tables
    except Exception as e:
        logging.warning(f"HTTP fetch failed for {url}: {e}")
        return None, None, None, []

async def crawl_webpages_hybrid(urls: list[str], http_client: httpx.AsyncClient) -> list[dict]:
    prioritized_urls = sorted(urls, key=get_domain_priority, reverse=True)
    skip_domains = ['pinterest.com', 'slideshare.net', 'youtube.com', 'twitter.com', 'facebook.com']
    filtered_urls = [u for u in prioritized_urls if not any(skip in urlparse(u).netloc.lower() for skip in skip_domains)]
    filtered_urls = filtered_urls[:10]

    semaphore = asyncio.Semaphore(MAX_CONCURRENCY)

    async def fetch_with_sem(url):
        async with semaphore:
            return await fetch_with_http_enhanced(http_client, url)

    tasks = [fetch_with_sem(url) for url in filtered_urls]
    crawl_results = await asyncio.gather(*tasks)

    results = []
    for i, res in enumerate(crawl_results):
        content, title, html_content, tables = res
        if content and len(content) > 100:
            results.append({
                'url': filtered_urls[i],
                'title': title,
                'content': content,
                'html_content': html_content,
                'tables': tables
            })
    return results

def process_crawled_results(crawled_data: list[dict], query: str, content_extractor) -> list[dict]:
    processed_results = []
    for page in crawled_data:
        relevant_content, semantic_score, structured_fields = content_extractor.extract_relevant_sections(
            page['content'], page.get('html_content'), query=query, url=page['url']
        )
        if relevant_content:
            domain_priority = get_domain_priority(page['url'])
            recency_mult = recency_score_multiplier(structured_fields)
            combined_score = (semantic_score + 0.1) * domain_priority * recency_mult
            page.update({
                'content': relevant_content,
                'score': combined_score,
                'structured_fields': structured_fields,
            })
            processed_results.append(page)

    processed_results.sort(key=lambda x: x.get('score', 0.0), reverse=True)
    return processed_results

async def ddgs_search_async(search_term: str, max_results: int = 6) -> list[str]:
    try:
        def sync_search():
            with DDGS() as ddgs:
                results = list(ddgs.text(search_term, region='us-en', safesearch='moderate', max_results=max_results))
                return [r["href"] for r in results if r.get("href")]
        urls = await asyncio.to_thread(sync_search)
        return urls
    except Exception as e:
        logging.error(f"DDGS search failed: {e}")
        return []

async def multi_seed_search(search_term: str) -> list[str]:
    seeds = [
        search_term,
        f"{search_term} site:en.wikipedia.org",
        f"{search_term} news"
    ]

    tasks = [ddgs_search_async(seed, max_results=5) for seed in seeds]
    results = await asyncio.gather(*tasks)

    all_urls = []
    seen = set()
    for url_list in results:
        for url in url_list:
            norm = normalize_url(url)
            if norm not in seen:
                seen.add(norm)
                all_urls.append(url)

    return all_urls[:15]

async def full_search_pipeline(query: str, content_extractor):
    async with httpx.AsyncClient(limits=HTTPX_LIMITS, http2=True, headers={"User-Agent": USER_AGENT}) as client:
        urls = await multi_seed_search(query)
        crawled = await crawl_webpages_hybrid(urls, client)
        processed = process_crawled_results(crawled, query, content_extractor)
        return processed[:5]

def get_domain_priority(url: str) -> float:
    domain = urlparse(url).netloc.lower()
    for trusted_domain, priority in TRUSTED_DOMAINS.items():
        # Fix endswith and contains checks for subdomains & TLDs
        if domain == trusted_domain or domain.endswith("." + trusted_domain):
            return priority
    return 1

def normalize_url(url: str) -> str:
    """Remove tracking/query params for deduplication."""
    parsed = urlparse(url)
    qs = parse_qsl(parsed.query)
    filtered_qs = [(k, v) for k, v in qs if k.lower() not in (
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid')]
    new_query = urlencode(filtered_qs)
    normalized = urlunparse(parsed._replace(query=new_query))
    return normalized

def recency_score_multiplier(structured_fields: dict) -> float:
    date_str = (structured_fields.get('release_date') or
                structured_fields.get('published_date') or
                structured_fields.get('date'))
    if not date_str:
        return 1.0
    try:
        publish_date = parser.parse(str(date_str))
    except Exception:
        publish_date = None
    if not publish_date:
        year_match = re.search(r'\b(19|20)\d{2}\b', str(date_str))
        if year_match:
            publish_date = datetime(int(year_match.group()), 1, 1)
    if publish_date:
        now = datetime.now(timezone.utc)
        if publish_date.tzinfo is None:
            publish_date = publish_date.replace(tzinfo=timezone.utc)
        days_old = (now - publish_date).days
        if days_old <= 7:
            return 1.5
        if days_old <= 30:
            return 1.2
        if days_old <= 180:
            return 1.0
        if days_old <= 365:
            return 0.9
        return 0.8
    return 1.0

def extract_tables_from_html(html_content: str) -> list[str]:
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
