import asyncio
import json
import logging
from typing import List, Dict, Any

from contextlib import asynccontextmanager
from urllib.parse import urlparse

import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse

from config.constants import LLAMA_SERVER_URL, DEFAULT_MODEL
from config.lists import PDF_SEARCH_DOMAINS, VIDEO_SEARCH_DOMAINS, UNIVERSITIES_URLS
from config.prompts import get_system_prompt, get_user_prompt, get_syllabus_user_prompt, get_mindmap_user_prompt, get_syllabus_system_prompt

from utils.chat_utils import create_llm_payload,handle_non_streaming_llm_response
from utils.search_utils import ddgs_search_async,normalize_url,crawl_webpages_hybrid,process_crawled_results
from utils.web_utils import ContentExtractor

from utils.document_utils import ddgs_search_full_async, detect_cycle_by_name , clean_dependencies, safe_json_extract, enforce_dependency_rules
from utils.video_utils import (
    extract_video_metadata_from_url,
    is_potential_video_link,
    normalized_title_key,
    FALLBACK_THUMBNAILS,
    normalize_domain,
)

# CONFIG ==========================

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
# Reduce verbosity of other libraries
logging.getLogger("httpx").setLevel(logging.WARNING)


# Global variables
http_client: httpx.AsyncClient
content_extractor: ContentExtractor

@asynccontextmanager
async def lifespan(app: FastAPI):
    global http_client, content_extractor
    logging.info("Starting up and creating a persistent httpx client...")
    http_client = httpx.AsyncClient(timeout=120.0)
    content_extractor = ContentExtractor() # Initialize the content extractor
    yield
    logging.info("Shutting down and closing the httpx client...")
    if http_client:
        await http_client.aclose()

app = FastAPI(lifespan=lifespan, default_response_class=ORJSONResponse)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ENDPOINTS ==========================

@app.post("/module-documents")
async def module_documents(request: Request):
    """
    Endpoint to fetch PDF documents related to a course module from the web.
    """
    from utils.document_utils  import ddgs_search_full_async, classify_document_type
    try:
        body = await request.json()
        module_name = body.get("module_name")
        if not module_name:
            return ORJSONResponse(status_code=400, content={"error": "module_name is required"})
    except json.JSONDecodeError:
        return ORJSONResponse(status_code=400, content={"error": "Invalid JSON payload"})

    logging.info(f"Received document request for module: {module_name}")

    # 1. Construct targeted search queries for PDFs
    search_queries = []
    for domain in PDF_SEARCH_DOMAINS:
        search_queries.append(f'site:{domain} "{module_name}" filetype:pdf')

    search_queries.extend([
        f'"{module_name}" textbook filetype:pdf',
        f'"{module_name}" lecture notes filetype:pdf',
        f'"{module_name}" tutorial filetype:pdf'
    ])

    # 2. Perform asynchronous search
    logging.info(f"Searching for PDF documents with {len(search_queries)} queries...")
    search_tasks = [ddgs_search_full_async(q, max_results=4) for q in search_queries]
    search_results_list = await asyncio.gather(*search_tasks)

    # 3. Process and format the results
    unique_links = set()
    documents = []

    all_results = [item for sublist in search_results_list for item in sublist]

    for result in all_results:
        link = result.get('href')
        title = result.get('title')

        if not link or not title or not link.endswith('.pdf'):
            continue

        normalized_link = normalize_url(link)
        if normalized_link in unique_links:
            continue

        # Unique PDF link
        unique_links.add(normalized_link)

        doc_type = classify_document_type(title)

        document_obj = {
            "title": title,
            "type": doc_type,
            "link": normalized_link,
            "tags": [module_name.capitalize(), doc_type],
            "local": False
        }
        documents.append(document_obj)

        if len(documents) >= 10:
            break

    if not documents:
        return ORJSONResponse(
            status_code=404,
            content={"error": f"Could not find any PDF documents for the module '{module_name}'."}
        )

    logging.info(f"Successfully found {len(documents)} documents for {module_name}")
    return ORJSONResponse(content=documents)

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
    
    # 6. Get response from LLM
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

@app.post("/module-videos")
async def module_videos(request: Request):
    try:
        body = await request.json()
        module_name = body.get("module_name")
        print(f"Searching for videos in module: {module_name}")
        if not module_name:
            return ORJSONResponse(
                status_code=400, content={"error": "module_name is required"}
            )
    except json.JSONDecodeError:
        return ORJSONResponse(status_code=400, content={"error": "Invalid JSON payload"})

    logging.info(f"Searching videos for module: %s", module_name)

    # --- UPGRADED: More targeted queries for better results ---
    queries = [
        f'site:youtube.com "{module_name}" course playlist',
        f'site:khanacademy.org "{module_name}"',
        f'site:3blue1brown.com "{module_name}" lessons',
    ]
    queries += [f'site:{d} "{module_name}" video lecture' for d in VIDEO_SEARCH_DOMAINS]
    queries.append(f'"{module_name}" lecture series site:youtube.com')

    search_tasks = [ddgs_search_full_async(q, max_results=6) for q in queries]
    search_results_list = await asyncio.gather(*search_tasks)
    all_results = [item for sublist in search_results_list for item in sublist]

    # Create a map of URL to its search result title for fallback
    url_to_title_map = {result.get("href"): result.get("title") for result in all_results if result.get("href")}

    seen_urls = set()
    tasks = []
    
    for result in all_results:
        raw_link = result.get("href")
        if not raw_link or raw_link in seen_urls:
            continue
        
        # Use the smart filter to pre-qualify URLs
        if is_potential_video_link(raw_link):
            seen_urls.add(raw_link)
            tasks.append(extract_video_metadata_from_url(raw_link))

    metadata_results = await asyncio.gather(*tasks)

    videos = []
    seen_title_keys = set()
    
    # --- CRITICAL: Create "best-effort" metadata for failed extractions ---
    processed_urls = {meta['link'] for meta in metadata_results if meta}
    for url in seen_urls:
        if url not in processed_urls:
            domain_key = normalize_domain(urlparse(url).netloc)
            fallback_img = FALLBACK_THUMBNAILS.get(domain_key)
            # Only create fallback for known educational sites to avoid junk
            if fallback_img:
                meta = {
                    "title": url_to_title_map.get(url, "External Course Resource"),
                    "img": fallback_img,
                    "duration": "",
                    "count": 1,
                    "tags": [domain_key, "course"],
                    "link": url,
                    "local": False,
                }
                metadata_results.append(meta)

    for meta in metadata_results:
        if not meta:
            continue
        title_key = normalized_title_key(meta["title"])
        if title_key in seen_title_keys:
            continue
            
        seen_title_keys.add(title_key)
        videos.append(meta)
        if len(videos) >= 20: # Increased limit for more results
            break

    if not videos:
        return ORJSONResponse(
            status_code=404,
            content={"error": f"No videos found for module '{module_name}'."},
        )

    logging.info("Returning %d videos for module %s", len(videos), module_name)
    return ORJSONResponse(content=videos)

@app.post("/module-tools")
async def module_tools(request: Request):
    """
    Endpoint to find useful tools, websites, and resources for a course module.
    """
    try:
        body = await request.json()
        module_name = body.get("module_name")
        if not module_name:
            return ORJSONResponse(status_code=400, content={"error": "module_name is required"})
    except json.JSONDecodeError:
        return ORJSONResponse(status_code=400, content={"error": "Invalid JSON payload"})

    logging.info(f"Received tools request for module: {module_name}")

    # 1. Construct targeted search queries for tools and resources
    search_queries = [
        f'"{module_name}" online tools',
        f'"{module_name}" interactive simulation OR visualization',
        f'"{module_name}" online calculator',
        f'"{module_name}" cheat sheet OR reference guide',
        f'best "{module_name}" resources for students',
        f'github awesome list "{module_name}"',
        f'"{module_name}" online exercises'
    ]

    # 2. Perform asynchronous search
    logging.info(f"Searching for tools with {len(search_queries)} queries...")
    search_tasks = [ddgs_search_full_async(q, max_results=5) for q in search_queries]
    search_results_list = await asyncio.gather(*search_tasks)

    # 3. Process and format the results
    unique_links = set()
    tools = []
    
    all_results = [item for sublist in search_results_list for item in sublist]

    for result in all_results:
        link = result.get('href')
        title = result.get('title')
        description = result.get('body')

        if not link or not title or not description:
            continue

        normalized_link = normalize_url(link)
        if normalized_link in unique_links:
            continue
        
        unique_links.add(normalized_link)

        # Limit title and description lengths and capitalize title
        truncated_title = title[:50].title() + "..." if len(title) > 50 else title.title()
        truncated_description = description[:100] + "..." if len(description) > 100 else description

        # Limit tags to 2
        tags = [module_name.lower(), "tool", "resource"][:2]

        tool_obj = {
            "title": truncated_title,
            "description": truncated_description,
            "link": normalized_link,
            "tags": tags
        }
        tools.append(tool_obj)

        if len(tools) >= 15:
            break

    # 4. Fallback search if not enough results are found
    if len(tools) < 10:
        logging.info(f"Found only {len(tools)} tools, performing a broader search...")
        broad_search_tasks = [ddgs_search_full_async(f'"{module_name}" useful learning resources', max_results=15)]
        broad_search_results = await asyncio.gather(*broad_search_tasks)
        
        for result in broad_search_results[0]:
            link = result.get('href')
            title = result.get('title')
            description = result.get('body')

            if not link or not title or not description:
                continue

            normalized_link = normalize_url(link)
            if normalized_link in unique_links:
                continue

            unique_links.add(normalized_link)

            # Apply the same truncation and tag limits
            truncated_title = title[:20].title() + "..." if len(title) > 20 else title.title()
            truncated_description = description[:40] + "..." if len(description) > 40 else description
            tags = [module_name.lower(), "resource"][:2]

            tool_obj = {
                "title": truncated_title,
                "description": truncated_description,
                "link": normalized_link,
                "tags": tags
            }
            tools.append(tool_obj)
            
            if len(tools) >= 15:
                break
    
    if not tools:
        return ORJSONResponse(
            status_code=404,
            content={"error": f"Could not find any useful tools or websites for the module '{module_name}'."}
        )

    logging.info(f"Successfully found {len(tools)} tools for {module_name}")
    return ORJSONResponse(content=tools)

@app.post("/module-syllabus")
async def module_syllabus(request: Request):
    """
    Constructs a chapter->topic->subtopic syllabus for a given course module.
    Each Topic contains subtopics as objects with explanations.
    """
    try:
        body = await request.json()
        module_name = body.get("module_name")
        if not module_name:
            return ORJSONResponse(status_code=400, content={"error": "module_name is required"})
    except json.JSONDecodeError:
        return ORJSONResponse(status_code=400, content={"error": "Invalid JSON payload"})

    logging.info(f"Received syllabus request for module: {module_name}")

    # 1. Search queries
    search_queries = [
        f'"{module_name}" textbook table of contents',
        f'"{module_name}" course curriculum structure',
        f'site:.edu "{module_name}" course syllabus chapters',
        f'"{module_name}" learning path OR modules',
        f'OpenCourseWare "{module_name}" curriculum',
    ]

    # 2. Asynchronously search for URLs
    search_tasks = [ddgs_search_async(q, max_results=5) for q in search_queries]
    url_nested_list = await asyncio.gather(*search_tasks)

    # 3. Deduplicate URLs
    unique_urls = {normalize_url(url) for sublist in url_nested_list for url in sublist}
    if not unique_urls:
        return ORJSONResponse(status_code=404, content={"error": "No source material found."})

    # 4. Crawl and process web content
    crawled_data = await crawl_webpages_hybrid(list(unique_urls)[:15], http_client)
    processed_results = process_crawled_results(crawled_data, module_name, content_extractor)
    if not processed_results:
        return ORJSONResponse(status_code=404, content={"error": "Could not extract enough information to build a syllabus."})

    # 5. Build context string for LLM
    context_parts = [
        f"Source [{i+1}] | URL: {res['url']}\nContent: {res['content']}\n---"
        for i, res in enumerate(processed_results[:10])
    ]
    context_string = "\n".join(context_parts)

    # 6. LLM request
    messages = [
        {"role": "system", "content": get_syllabus_system_prompt()},
        {"role": "user", "content": get_syllabus_user_prompt(module_name, context_string)}
    ]
    llm_config = {"model": DEFAULT_MODEL, "temperature": 0.1, "max_tokens": 8192}
    payload = await create_llm_payload(messages, stream=False, llm_config=llm_config)

    raw_llm_output = ""
    try:
        response = await handle_non_streaming_llm_response(http_client, payload, LLAMA_SERVER_URL, retries=1)
        raw_llm_output = response.get('content', '').strip()

        # Standard JSON cleaning
        start, end = raw_llm_output.find('{'), raw_llm_output.rfind('}')
        if start != -1 and end != -1:
            clean_json_str = raw_llm_output[start:end+1]
            json_response = json.loads(clean_json_str)
            logging.info(f"Successfully generated syllabus JSON for {module_name}")
            return ORJSONResponse(content=json_response)
        else:
            raise json.JSONDecodeError("No valid JSON object found in LLM output.", raw_llm_output, 0)

    except json.JSONDecodeError as e:
        logging.error(f"Failed to decode syllabus JSON: {e}")
        logging.error(f"Raw output:\n{raw_llm_output}")
        return ORJSONResponse(status_code=500, content={"error": "The model produced invalid syllabus JSON."})
    except Exception as e:
        logging.error(f"Unexpected error during syllabus generation: {e}")
        return ORJSONResponse(status_code=500, content={"error": "Internal server error during syllabus generation."})
    

@app.post("/module-concepts")
async def module_concepts(request: Request):
    try:
        payload_body = await request.json()
        module_name = payload_body.get("moduleName")
        syllabus = payload_body.get("syllabus")
        if not syllabus or not module_name:
            return ORJSONResponse(status_code=400, content={"error": "moduleName and syllabus are required"})
    except json.JSONDecodeError:
        return ORJSONResponse(status_code=400, content={"error": "Invalid JSON payload"})

    logging.info(f"Received concept generation request for module: {module_name}")

    syllabus_str = ""
    try:
        for chapter_obj in syllabus:
            for chapter_title, subtopics_list in chapter_obj.items():
                syllabus_str += f"Chapter: {chapter_title}\n"
                for subtopic_obj in subtopics_list:
                    for subtopic_title, subtopic_desc in subtopic_obj.items():
                        syllabus_str += f"- {subtopic_title}: {subtopic_desc}\n"
                syllabus_str += "\n"
    except Exception as e:
        logging.error(f"Failed to parse the provided syllabus structure: {e}")
        return ORJSONResponse(status_code=400, content={"error": "Invalid syllabus format provided."})

    messages = [
        {"role": "system", "content": "You are a helpful assistant that generates JSON data for educational concept maps. Follow instructions exactly."},
        {"role": "user", "content": get_mindmap_user_prompt(module_name, syllabus_str)}
    ]
    
    # --- LLM Call ---
    payload = await create_llm_payload(
        messages,
        stream=False,
        llm_config={"model": DEFAULT_MODEL, "temperature": 0.1, "max_tokens": 8192}
    )

    raw_output = ""
    try:
        resp = await handle_non_streaming_llm_response(
            http_client, payload, LLAMA_SERVER_URL, retries=1
        )
        raw_output = resp.get("content", "").strip()

        clean_json_str = safe_json_extract(raw_output)
        parsed_json = json.loads(clean_json_str)
        concepts = parsed_json.get("concepts", [])
        if not isinstance(concepts, list):
            raise ValueError("'concepts' key must contain a list")

        # --- START: Data Processing Pipeline ---

        # 1. Normalize and Deduplicate
        normalized: List[Dict[str, Any]] = []
        seen = set()
        for c in concepts:
            name = " ".join((c.get("name") or "").strip().split())
            if not name or name.lower() in seen:
                continue
            
            seen.add(name.lower())
            deps = c.get("dependencies") or []
            normalized.append({
                "name": name,
                "description": (c.get("description") or "").strip(),
                "dependencies": [d.strip() for d in deps if isinstance(d, str) and d.strip()],
                "subtopic_number": (c.get("subtopic_number") or "").strip(),
                "date_learned": None
            })

        # 2. Fix Dependency Name References (case-insensitive)
        name_map = {c["name"].lower(): c["name"] for c in normalized}
        for c in normalized:
            fixed_deps = [name_map.get(d.lower()) for d in c["dependencies"]]
            c["dependencies"] = [d for d in fixed_deps if d] # Remove None entries for unmatched deps

        # 3. *** THIS IS THE NEW, CRITICAL STEP ***
        # Enforce the chapter scope and max dependency count rules.
        processed_concepts = enforce_dependency_rules(normalized)

        # 4. Final Cleanup (remove self-references, unmatched deps, and duplicates)
        processed_concepts = clean_dependencies(processed_concepts)

        # 5. Cycle Detection
        cycles = detect_cycle_by_name(processed_concepts)
        if cycles:
            logging.warning("Cycle detected in generated concepts: %s", cycles)
            return ORJSONResponse(
                content={
                    "error": "cycle_detected_in_concepts",
                    "cycle_nodes": cycles,
                    "concepts": processed_concepts,
                },
            )

        # 6. Enforce Minimum Count
        if len(processed_concepts) < 50:
            logging.warning("Generated too few concepts: %d", len(processed_concepts))
            return ORJSONResponse(
                content={
                    "error": "too_few_concepts",
                    "message": "LLM returned fewer than the required 50 concepts.",
                    "count": len(processed_concepts),
                    "concepts": processed_concepts,
                },
            )

        logging.info(f"Successfully generated and validated {len(processed_concepts)} concepts for {module_name}")
        return ORJSONResponse(content={"concepts": processed_concepts})

    except json.JSONDecodeError as e:
        logging.error("Concepts JSON decode failed: %s", e)
        logging.error("Raw LLM output:\n%s", raw_output)
        return ORJSONResponse(status_code=500, content={"error": "The model produced invalid concepts JSON."})
    except Exception:
        logging.exception("An unexpected error occurred in /module-concepts")
        return ORJSONResponse(status_code=500, content={"error": "An internal server error occurred."})

# MAIN ==========================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=4999)
