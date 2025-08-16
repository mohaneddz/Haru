import asyncio
import json
import logging
from contextlib import asynccontextmanager
from urllib.parse import urlparse

import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse

from config.lists import VIDEO_SEARCH_DOMAINS
from config.constants import VIDEO_PLACEHOLDER_IMG
from utils.document_utils import ddgs_search_full_async
from utils.video_utils import (
    extract_video_metadata_from_url,
    is_video_link,
    normalized_title_key,
)


# Config
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)

# Global variables
http_client: httpx.AsyncClient


@asynccontextmanager
async def lifespan(app: FastAPI):
    global http_client
    logging.info("Starting up and creating a persistent httpx client...")
    http_client = httpx.AsyncClient(timeout=120.0)
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


@app.post("/module-videos")
async def module_videos(request: Request):
    try:
        body = await request.json()
        module_name = body.get("module_name")
        if not module_name:
            return ORJSONResponse(
                status_code=400, content={"error": "module_name is required"}
            )
    except json.JSONDecodeError:
        return ORJSONResponse(status_code=400, content={"error": "Invalid JSON payload"})

    logging.info(f"Searching videos for module: %s", module_name)

    # build queries
    queries = [f'site:{d} "{module_name}" video' for d in VIDEO_SEARCH_DOMAINS]
    queries += [
        f'"{module_name}" lecture site:youtube.com',
        f'"{module_name}" playlist site:youtube.com',
    ]

    # async search
    search_tasks = [ddgs_search_full_async(q, max_results=6) for q in queries]
    search_results_list = await asyncio.gather(*search_tasks)
    all_results = [item for sublist in search_results_list for item in sublist]

    seen_urls = set()
    seen_title_keys = set()
    videos = []

    for result in all_results:
        raw_link = result.get("href")
        if not raw_link or not is_video_link(raw_link):
            continue

        meta = await extract_video_metadata_from_url(raw_link)
        if not meta:
            continue

        # dedupe by normalized URL
        if meta["link"] in seen_urls:
            continue

        # dedupe by normalized title (fuzzy)
        title_key = normalized_title_key(meta["title"])
        if title_key in seen_title_keys:
            continue

        # ensure img fallback
        if not meta.get("img"):
            meta["img"] = VIDEO_PLACEHOLDER_IMG

        # accept
        seen_urls.add(meta["link"])
        if title_key:
            seen_title_keys.add(title_key)
        videos.append(meta)

        if len(videos) >= 12:  # slightly larger pool, you can cap to 10 later
            break

    if not videos:
        return ORJSONResponse(
            status_code=404,
            content={"error": f"No videos found for module '{module_name}'."},
        )

    logging.info("Returning %d videos for module %s", len(videos), module_name)
    return ORJSONResponse(content=videos[:10])


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=4999)