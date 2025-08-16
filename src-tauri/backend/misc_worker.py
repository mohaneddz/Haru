import os
import fitz  
import logging
import hashlib
import asyncio
import httpx

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import ORJSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware

from contextlib import asynccontextmanager
from typing import Dict

# ---- config ----
HOST = "127.0.0.1"
PORT = 3999
CACHE_DIR = os.path.abspath("./thumbnails")
os.makedirs(CACHE_DIR, exist_ok=True)

# It has been removed to ensure the entire PDF is downloaded.
USER_AGENT = "Haru/1.0 (+https://your-app.local)"
REQUEST_TIMEOUT = 120.0  # Increased timeout for potentially larger files
GENERATION_TIMEOUT = 30.0  # seconds allowed for fetch+render+save
# ----------------

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

http_client: httpx.AsyncClient
_generation_locks: Dict[str, asyncio.Lock] = {}  # per-hash locks to avoid race conditions

@asynccontextmanager
async def lifespan(app: FastAPI):
    global http_client
    # NOTE: verify=False to avoid hostname mismatch SSL problems on certain academic hosts.
    # If you require stricter SSL, change to True.
    http_client = httpx.AsyncClient(timeout=REQUEST_TIMEOUT, headers={"User-Agent": USER_AGENT}, verify=False)
    yield
    await http_client.aclose()

app = FastAPI(lifespan=lifespan, default_response_class=ORJSONResponse)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def _url_hash(url: str) -> str:
    return hashlib.sha1(url.encode("utf-8")).hexdigest()

def _make_fallback(path: str) -> None:
    from PIL import Image, ImageDraw, ImageFont
    PIL_AVAILABLE = True
    """Create a simple fallback PNG if Pillow available, else write a tiny empty PNG."""
    if os.path.exists(path):
        return
    try:
        if PIL_AVAILABLE:
            img = Image.new("RGBA", (600, 800), (30, 30, 40, 255))
            draw = ImageDraw.Draw(img)
            try:
                font = ImageFont.truetype("DejaVuSans.ttf", 28)
            except Exception:
                font = None
            text = "No preview available"
            # simple check for textsize attribute
            if hasattr(draw, 'textsize'):
                w, h = draw.textsize(text, font=font)
            else: # Pillow 10+
                bbox = draw.textbbox((0,0), text, font=font)
                w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]

            draw.text(((600 - w) / 2, (800 - h) / 2), text, fill=(200, 200, 200, 255), font=font)
            img.save(path, "PNG")
            logging.info("Created fallback thumbnail (Pillow).")
        else:
            empty_png = (b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01"
                         b"\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89"
                         b"\x00\x00\x00\nIDATx\x9cc`\x00\x00\x00\x02\x00\x01\xe2!"
                         b"\xbc\x33\x00\x00\x00\x00IEND\xaeB`\x82")
            with open(path, "wb") as f:
                f.write(empty_png)
            logging.info("Created minimal fallback thumbnail (binary).")
    except Exception as e:
        logging.warning("Failed to create fallback thumbnail: %s", e)

# ensure fallback exists
FALLBACK_NAME = "no-preview.png"
FALLBACK_PATH = os.path.join(CACHE_DIR, FALLBACK_NAME)
_make_fallback(FALLBACK_PATH)

@app.post("/pdf-thumbnail")
async def pdf_thumbnail(request: Request):
    """
    Request body: { "url": "https://..." }
    Returns: { "thumbnail": "<absolute_url_to_png>" } on success
             { "thumbnail": "<absolute_url_to_fallback_png>", "error": "..." } on failure
    """
    body = await request.json()
    pdf_url = (body.get("url") or "").strip()
    base_url = str(request.base_url).rstrip("/")
    fallback_url = f"{base_url}/thumbnails/{FALLBACK_NAME}"

    if not pdf_url:
        return {"thumbnail": fallback_url, "error": "No URL provided"}

    url_hash = _url_hash(pdf_url)
    filename = f"{url_hash}.png"
    cache_path = os.path.join(CACHE_DIR, filename)
    thumbnail_url = f"{base_url}/thumbnails/{filename}"

    if os.path.exists(cache_path):
        return {"thumbnail": thumbnail_url}

    lock = _generation_locks.setdefault(url_hash, asyncio.Lock())
    async with lock:
        if os.path.exists(cache_path):
            return {"thumbnail": thumbnail_url}

        async def _generate_and_save():
            logging.info("Fetching full PDF: %s", pdf_url)
            resp = await http_client.get(pdf_url, follow_redirects=True)
            resp.raise_for_status()
            pdf_bytes = resp.content

            # Open and process PDF in a thread to avoid blocking the event loop
            try:
                doc = await asyncio.to_thread(fitz.open, stream=pdf_bytes, filetype="pdf")
            except Exception as e:
                logging.error("fitz.open failed for %s: %s", pdf_url, e)
                raise RuntimeError("Failed to parse PDF.") from e

            try:
                if doc.page_count == 0:
                    await asyncio.to_thread(doc.close)
                    logging.error("PDF has zero pages: %s", pdf_url)
                    raise RuntimeError("PDF has no pages.")

                # render first page (2x scale for decent quality)
                page = await asyncio.to_thread(doc.load_page, 0)
                mat = fitz.Matrix(2, 2)
                pix = await asyncio.to_thread(page.get_pixmap, matrix=mat, alpha=False)
                await asyncio.to_thread(doc.close)

                tmp_path = cache_path + ".tmp.png"
                try:
                    await asyncio.to_thread(pix.save, tmp_path)
                    os.replace(tmp_path, cache_path)
                    logging.info("Thumbnail saved: %s", cache_path)
                except Exception as e:
                    logging.error("Failed to save thumbnail: %s", e)
                    if os.path.exists(tmp_path):
                        os.remove(tmp_path)
                    raise RuntimeError("Failed to save thumbnail.") from e

            finally:
                # ensure doc closed in case of early errors
                try:
                    if hasattr(doc, "close"):
                        await asyncio.to_thread(doc.close)
                except Exception:
                    pass

        try:
            await asyncio.wait_for(_generate_and_save(), timeout=GENERATION_TIMEOUT)
            return {"thumbnail": thumbnail_url}
        except asyncio.TimeoutError:
            logging.error("Thumbnail generation timed out for %s", pdf_url)
            return {"thumbnail": fallback_url, "error": "Thumbnail generation timed out."}
        except httpx.HTTPStatusError as e:
            logging.error("HTTP error fetching '%s': %s", pdf_url, e)
            return {"thumbnail": fallback_url, "error": f"HTTP error: {e.response.status_code}"}
        except Exception as e:
            logging.exception("Thumbnail generation failed for '%s':", pdf_url)
            return {"thumbnail": fallback_url, "error": str(e)}

# NEW: Endpoint to clear the cache
@app.post("/clear-cache")
async def clear_cache():
    """
    Deletes all generated .png thumbnails from the cache directory.
    The fallback image 'no-preview.png' is not deleted.
    """
    logging.info("Clear cache request received.")
    deleted_count = 0
    try:
        for filename in os.listdir(CACHE_DIR):
            if filename.endswith(".png") and filename != FALLBACK_NAME:
                file_path = os.path.join(CACHE_DIR, filename)
                os.remove(file_path)
                deleted_count += 1
        logging.info("Cache cleared. Deleted %d files.", deleted_count)
        return {"status": "success", "message": f"Cache cleared. {deleted_count} thumbnails deleted."}
    except Exception as e:
        logging.error("Failed to clear cache: %s", e)
        raise HTTPException(status_code=500, detail="Failed to clear cache.")


# FIX: Replace app.mount with a dedicated endpoint for reliability.
# This serves all files from the thumbnails directory and will fix the 404 error.
@app.get("/thumbnails/{filename:path}")
async def get_thumbnail(filename: str):
    """
    Serves a thumbnail image from the cache directory.
    """
    file_path = os.path.join(CACHE_DIR, filename)
    if os.path.isfile(file_path):
        return FileResponse(file_path)
    raise HTTPException(status_code=404, detail="Thumbnail not found.")


if __name__ == "__main__":
    import uvicorn
    logging.info("Starting PDF thumbnail server on %s:%s", HOST, PORT)
    uvicorn.run(app, host=HOST, port=PORT)