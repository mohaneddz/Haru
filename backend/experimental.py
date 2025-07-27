import subprocess
import requests
from flask import Flask, request, jsonify
import atexit
import time
from ddgs import DDGS  # Updated package name
from bs4 import BeautifulSoup
import asyncio
from crawl4ai import AsyncWebCrawler, BrowserConfig, CacheMode, CrawlerRunConfig
from crawl4ai.content_filter_strategy import BM25ContentFilter
from crawl4ai.markdown_generation_strategy import DefaultMarkdownGenerator
from crawl4ai.models import CrawlResult
import logging
import concurrent.futures # Import for ThreadPoolExecutor

app = Flask(__name__)

LLAMA_SERVER_PATH = r"lib\llama-server.exe"
MODEL_PATH = r"models\gemma-3-4b-it-q4_0.gguf"
LLAMA_SERVER_URL = "http://localhost:8080/completion"

# Configure logging for debugging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Start llama-server with optimized settings
llama_process = subprocess.Popen([
    LLAMA_SERVER_PATH,
    "-m", MODEL_PATH,
    "-t", "16",
    "-ngl", "999",
    "-c", "16000"
])
print("llama-server.exe started.")

# Kill llama-server when app exits
atexit.register(llama_process.kill)

# Optional: wait for llama-server to be ready
time.sleep(5)

def get_allowed_urls(query, num_results=5):
    discard_urls = ["youtube.com", "vimeo.com", "reddit.com", "twitter.com", "instagram.com"]
    for url in discard_urls:
        query += f" -site:{url}"

    with DDGS() as ddgs:
        results = ddgs.text(query, max_results=num_results)
        urls = [r["href"] for r in results]
    return urls

async def crawl_and_filter(urls: list[str], query: str) -> list[dict]:
    logging.info(f"Starting crawl for URLs: {urls}")
    
    # Simplified content filter
    bm25_filter = BM25ContentFilter(user_query=query, bm25_threshold=0.3)
    markdown_gen = DefaultMarkdownGenerator(content_filter=bm25_filter)

    # Faster, more aggressive crawler configuration
    run_config = CrawlerRunConfig(
        markdown_generator=markdown_gen,
        excluded_tags=["nav", "footer", "header", "form", "script", "style", "noscript", "iframe", "video", "audio"],
        only_text=True,
        exclude_social_media_links=True,
        keep_data_attributes=False,
        cache_mode=CacheMode.BYPASS,
        remove_overlay_elements=True,
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        page_timeout=12000,  # Increased to 12 seconds per page
        word_count_threshold=30,
        wait_for="body",  # Wait for body element instead of domcontentloaded
        delay_before_return_html=300  # Further reduced delay
    )
    
    # Minimal browser configuration for speed
    browser_config = BrowserConfig(
        headless=True, 
        text_mode=True, 
        light_mode=True,
        extra_args=[
            "--no-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--disable-images",
            "--disable-javascript",
            "--disable-plugins",
            "--disable-extensions",
            "--no-first-run",
            "--disable-default-apps",
            "--disable-sync",
            "--disable-translate",
            "--hide-scrollbars",
            "--mute-audio",
            "--no-default-browser-check",
            "--disable-background-networking",
            "--disable-backgrounding-occluded-windows",
            "--disable-background-timer-throttling",
            "--disable-renderer-backgrounding"
        ]
    )

    successful_results = []
    
    try:
        async with AsyncWebCrawler(config=browser_config) as crawler:
            # Process URLs one by one with reduced timeout
            for i, url in enumerate(urls):
                try:
                    logging.info(f"Crawling URL {i+1}/{len(urls)}: {url}")
                    result = await asyncio.wait_for(
                        crawler.arun(url, config=run_config), 
                        timeout=15 
                    )
                    
                    if result and result.markdown and len(result.markdown.strip()) > 30:
                        successful_results.append({
                            'url': url,
                            'content': result.markdown[:1500],
                            'title': getattr(result, 'title', 'No title')
                        })
                        logging.info(f"✓ Successfully crawled: {url} - Content length: {len(result.markdown)}")
                    else:
                        logging.warning(f"✗ Empty or insufficient content from: {url}")
                        
                except asyncio.TimeoutError:
                    logging.warning(f"⏱ Timeout crawling URL: {url}")
                    continue
                except Exception as e:
                    logging.error(f"✗ Error crawling URL {url}: {str(e)}")
                    continue
                    
                # Stop if we have enough results or processed enough URLs
                if len(successful_results) >= 2 or i >= 3:
                    break
                    
    except Exception as e:
        logging.error(f"Error during crawling setup: {str(e)}", exc_info=True)

    logging.info(f"Crawl completed. Successfully processed {len(successful_results)} URLs out of {len(urls)} attempted.")
    return successful_results

def search_web(query, max_results=5):
    logging.info(f"Performing web search for query: {query}")
    urls = get_allowed_urls(query, num_results=max_results)
    if not urls:
        logging.warning("No URLs found during web search.")
        return []

    results = []
    try:
        # Try to get the current event loop
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # If loop is running, use ThreadPoolExecutor
                
                def run_crawl():
                    new_loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(new_loop)
                    try:
                        return new_loop.run_until_complete(crawl_and_filter(urls, query))
                    finally:
                        new_loop.close()
                
                with concurrent.futures.ThreadPoolExecutor() as executor:
                    future = executor.submit(run_crawl)
                    results = future.result(timeout=70)  # Increased overall timeout to 70 seconds
            else:
                results = loop.run_until_complete(crawl_and_filter(urls, query))
        except RuntimeError:
            # No event loop exists, create a new one
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                results = loop.run_until_complete(crawl_and_filter(urls, query))
            finally:
                loop.close()
                
    except concurrent.futures.TimeoutError:
        logging.error("Overall crawling operation timed out")
        results = []
    except Exception as e:
        logging.error(f"Error during search_web: {str(e)}", exc_info=True)
        results = []

    logging.info(f"Web search and crawling completed. Found {len(results)} results.")
    return results

@app.route("/ask", methods=["POST"])
def ask_model():
    data = request.get_json()
    if not data or "prompt" not in data:
        return jsonify({"error": "Missing 'prompt'"}), 400

    payload = {
        "prompt": data["prompt"],
        "n_predict": data.get("n_predict", 100),
        "temperature": 0.7,
        "stop": ["</s>"]
    }

    try:
        response = requests.post(LLAMA_SERVER_URL, json=payload, timeout=60)
        response.raise_for_status()
        content = response.json().get("content", "")
        return jsonify({"content": content})
    except Exception as e:
        print("Request failed:", e)
        return jsonify({"error": "llama-server communication failed"}), 500

@app.route("/ask_search", methods=["POST"])
def ask_with_search():
    data = request.get_json()
    if not data or "prompt" not in data or "query" not in data:
        return jsonify({"error": "Missing 'prompt' or 'query'"}), 400

    query = data["query"]
    prompt = data["prompt"]
    
    # Add fallback for when search fails
    search_results = search_web(query)
    logging.info(f"Search results: {len(search_results)} results found")

    if search_results:
        # Use search results
        search_context = "\n".join(
            f"Source: {r['url']}\nTitle: {r.get('title', 'No title')}\nContent: {r['content'][:800]}...\n"
            for r in search_results[:3]  # Limit to top 3 results
        )
        combined_prompt = (
            f"Based on the following web search results, answer the question accurately:\n\n"
            f"{search_context}\n\n"
            f"Question: {prompt}\nAnswer:"
        )
    else:
        # Fallback when search fails
        logging.warning("No search results found, using direct prompt")
        combined_prompt = f"Question: {prompt}\nAnswer based on your knowledge:"

    payload = {
        "prompt": combined_prompt,
        "n_predict": data.get("n_predict", 150),
        "temperature": 0.7,
        "stop": ["</s>", "\n\n"]
    }

    try:
        response = requests.post(LLAMA_SERVER_URL, json=payload, timeout=60)
        response.raise_for_status()
        content = response.json().get("content", "")
        logging.info(f"LLM response: {content[:100]}...")
        
        return jsonify({
            "content": content.strip(),
            "search_results": search_results,
            "sources_used": len(search_results)
        })
    except Exception as e:
        logging.error(f"Web+LLM request failed: {str(e)}", exc_info=True)
        return jsonify({"error": "Web search + llama-server failed"}), 500

@app.route("/shutdown", methods=["POST"])
def shutdown_server():
    llama_process.kill()
    return jsonify({"status": "llama-server killed"})

if __name__ == "__main__":
    app.run(port=5000, debug=False)  # Disable debug mode for better performance