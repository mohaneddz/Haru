import logging
import asyncio
import json
from fastapi import FastAPI, Request
from fastapi.responses import ORJSONResponse
from fastapi.middleware.cors import CORSMiddleware
import httpx
from contextlib import asynccontextmanager

from prompts import get_system_prompt, get_user_prompt
from constants import LLAMA_SERVER_URL, DEFAULT_MODEL, UNIVERSITIES_URLS
from utils.chat_utils import create_llm_payload, handle_non_streaming_llm_response
from utils.web_utils import (
    ContentExtractor,
    ddgs_search_async,
    normalize_url,
    crawl_webpages_hybrid,
    process_crawled_results
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# Global variables to be initialized in the lifespan context
http_client: httpx.AsyncClient
content_extractor: ContentExtractor

@asynccontextmanager
async def lifespan(app: FastAPI):
    global http_client, content_extractor
    logging.info("Starting up and creating a persistent httpx client...")
    http_client = httpx.AsyncClient(timeout=120.0)
    content_extractor = ContentExtractor()
    yield
    logging.info("Shutting down and closing the httpx client...")
    if http_client:
        await http_client.aclose()

app = FastAPI(lifespan=lifespan, default_response_class=ORJSONResponse)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple health check to verify server is up
@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/module-info")
async def module_info(request: Request):
    """
    Endpoint to fetch, process, and generate structured information about a course module.
    """
    try:
        body = await request.json()
        module_name = body.get("module_name")
        if not module_name:
            return ORJSONResponse(status_code=400, content={"error": "module_name is required"})
    except json.JSONDecodeError:
        return ORJSONResponse(status_code=400, content={"error": "Invalid JSON payload"})

    logging.info(f"Received request for module: {module_name}")

    # 1. Improved Search Strategy
    search_queries = []
    for uni_domain in UNIVERSITIES_URLS:
        search_queries.append(f'site:{uni_domain} "{module_name}" course syllabus OR outline OR "course catalog"')
    search_queries.extend([
        f'"{module_name}" course syllabus learning outcomes',
        f'"{module_name}" university course prerequisites',
        f'introduction to "{module_name}" course topics',
    ])

    # 2. Asynchronously search for URLs
    logging.info(f"Performing targeted web search with {len(search_queries)} queries...")
    search_tasks = [ddgs_search_async(q, max_results=2) for q in search_queries]
    url_nested_list = await asyncio.gather(*search_tasks)

    # 3. Deduplicate URLs
    unique_urls = set()
    for url_list in url_nested_list:
        for url in url_list:
            unique_urls.add(normalize_url(url))
    
    if not unique_urls:
        return ORJSONResponse(status_code=404, content={"error": "Could not find any web pages for the module."})

    # 4. Crawl and process web content
    logging.info(f"Crawling {len(unique_urls)} unique URLs...")
    crawled_data = await crawl_webpages_hybrid(list(unique_urls)[:25], http_client)
    processed_results = process_crawled_results(crawled_data, module_name, content_extractor)

    if not processed_results:
        return ORJSONResponse(status_code=404, content={"error": "Could not find enough information for the module."})

    # 5. Build context
    logging.info("Building context for the language model...")
    context_parts = []
    for i, res in enumerate(processed_results[:7]):
        context_parts.append(f"Source [{i+1}] | URL: {res['url']}\nContent: {res['content']}\n---")
    context_string = "\n".join(context_parts)

    # 6. ADVANCED PROMPT ENGINEERING v4: Generalized reasoning and strict output formatting

    # 7. Create payload and get response
    logging.info("Sending request to the local LLM...")
    messages = [
        {"role": "system", "content": get_system_prompt()},
        {"role": "user", "content": get_user_prompt(module_name, context_string)}
    ]
    llm_config = {"model": DEFAULT_MODEL, "temperature": 0.05, "max_tokens": 2048}
    payload = await create_llm_payload(messages, stream=False, llm_config=llm_config)
    
    raw_llm_output = ""
    try:
        response = await handle_non_streaming_llm_response(http_client, payload, LLAMA_SERVER_URL, retries=1)
        raw_llm_output = response.get('content', '').strip()

        # 8. Clean and parse the LLM's JSON output
        start = raw_llm_output.find('{')
        end = raw_llm_output.rfind('}')
        if start != -1 and end != -1:
            clean_json_str = raw_llm_output[start:end+1]
            json_response = json.loads(clean_json_str)
            logging.info(f"Successfully generated JSON for {module_name}")
            return ORJSONResponse(content=json_response)
        else:
            raise json.JSONDecodeError("No valid JSON object found in the LLM output.", raw_llm_output, 0)

    except json.JSONDecodeError as e:
        logging.error(f"Failed to decode JSON from LLM response: {e}")
        logging.error(f"Raw LLM output was:\n---\n{raw_llm_output}\n---")
        return ORJSONResponse(status_code=500, content={"error": "The model produced an invalid JSON structure."})
    except Exception as e:
        logging.error(f"An unexpected error occurred: {e}")
        return ORJSONResponse(status_code=500, content={"error": "An internal server error occurred."})

if __name__ == "__main__":
    import uvicorn
    # Bind explicitly to 127.0.0.1 for consistency with frontend calls
    uvicorn.run(app, host="127.0.0.1", port=4999)