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

app = Flask(__name__)

LLAMA_SERVER_PATH = r"lib\llama-server.exe"
MODEL_PATH = r"models\gemma-3-4b-it-q4_0.gguf"
LLAMA_SERVER_URL = "http://localhost:8080/completion"

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
    bm25_filter = BM25ContentFilter(user_query=query, bm25_threshold=1.2)
    markdown_gen = DefaultMarkdownGenerator(content_filter=bm25_filter)

    run_config = CrawlerRunConfig(
        markdown_generator=markdown_gen,
        excluded_tags=["nav", "footer", "header", "form", "img", "a"],
        only_text=True,
        exclude_social_media_links=True,
        keep_data_attributes=False,
        cache_mode=CacheMode.BYPASS,
        remove_overlay_elements=True,
        page_timeout=20000
    )

    browser_config = BrowserConfig(headless=True, text_mode=True, light_mode=True)

    async with AsyncWebCrawler(config=browser_config) as crawler:
        results = await crawler.arun_many(urls, config=run_config)

    processed = []
    for result in results:
        if not isinstance(result, CrawlResult) or result.error:
            continue
        content = result.markdown_v2.fit_markdown if result.markdown_v2 else ""
        processed.append({"url": result.url, "content": content[:1000]})
    return processed

def search_web(query, max_results=5):
    urls = get_allowed_urls(query, num_results=max_results)
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    results = loop.run_until_complete(crawl_and_filter(urls, query))
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
    search_results = search_web(query)
    search_context = "\n".join(
        f"{r['url']} - {r['content']}" for r in search_results
    )
    combined_prompt = (
        f"Based on the following web search results, answer the question:\n\n"
        f"{search_context}\n\n"
        f"Question: {prompt}\nAnswer:"
    )

    payload = {
        "prompt": combined_prompt,
        "n_predict": 100,
        "temperature": 0.7,
        "stop": ["</s>"]
    }

    try:
        response = requests.post(LLAMA_SERVER_URL, json=payload, timeout=60)
        response.raise_for_status()
        content = response.json().get("content", "")
        return jsonify({
            "content": content,
            "search_results": search_results  # Include web search results in the response
        })
    except Exception as e:
        print("Web+LLM request failed:", e)
        return jsonify({"error": "Web search + llama-server failed"}), 500

@app.route("/shutdown", methods=["POST"])
def shutdown_server():
    llama_process.kill()
    return jsonify({"status": "llama-server killed"})

if __name__ == "__main__":
    app.run(port=5000)
