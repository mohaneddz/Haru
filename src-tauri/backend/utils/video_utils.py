import asyncio
import logging
import re
import os
import time
import tempfile
from urllib.parse import urlparse
import yt_dlp
import httpx

from config.constants import VIDEO_PLACEHOLDER_IMG

# --- Constants and Configuration ---

NON_VIDEO_PATTERNS = re.compile(
    r"/blog/|/news/|/article/|/profile/|/user/|/about|/contact|/terms|/search|/apps/|/support|/hc/|/courses\?query="
)

# ======================================================================
# Fallback thumbnails for known providers
# ======================================================================
FALLBACK_THUMBNAILS = {
    "khanacademy": "https://i.ytimg.com/vi/f7Ff_Xvzsow/sddefault.jpg",
    "edx": "https://www.classcentral.com/report/wp-content/uploads/2022/03/edx-free-courses.png",
    "coursera": "https://whop.com/blog/content/images/2024/11/Coursera-Review.webp",
    "udacity": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQIyYwlELpJD2IR5qWs2E96dL9tZt5TKUD4Ug&s",
    "mitocw": "https://storage.googleapis.com/kaggle-datasets-images/6374538/10298856/5de8ac71ff5a09ef00f7d31e455fb12b/dataset-card.png?t=2024-12-25-23-10-54",
    "3blue1brown": "https://tamararubin.com/wp-content/uploads/2020/10/3blue1brown-Avi-YouTube-Channels-Lead-Safe-Mama-2020-01.jpeg",
}

# ======================================================================

YDL_OPTS_BASE = {
    "quiet": True,
    "no_warnings": True,
    "ignoreconfig": True,
    "extract_flat": "in_playlist",
    "skip_download": True,
    "force_generic_extractor": True,
    "http_headers": {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
    },
    "extractor_args": {
        "generic:impersonate": "chrome110",
        "youtubetab:skip": "authcheck"
    },
    "nocheckcertificate": True,
    "retries": 1,
    "socket_timeout": 10,
}

# --- Cookie File Handling (Race Condition Safe) ---

source_cookie_path = None
try:
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    path = os.path.join(backend_dir, 'cookies.txt')
    if os.path.exists(path):
        source_cookie_path = path
    else:
        logging.warning(f"Source cookie file not found at {path}. Proceeding without cookies.")
except Exception:
    pass

def _create_safe_cookie_snapshot() -> str | None:
    """
    Reads the source cookie file with retries to avoid race conditions.
    If successful, writes the content to a temporary file and returns its path.
    """
    if not source_cookie_path:
        return None

    for attempt in range(3):
        try:
            with open(source_cookie_path, 'r', encoding='utf-8-sig') as f:
                content = f.read()

            if content and content.strip().startswith("# Netscape HTTP Cookie File"):
                temp_file = tempfile.NamedTemporaryFile(
                    mode='w', delete=False, encoding='utf-8', suffix='.txt', newline=''
                )
                temp_file.write(content)
                temp_file.close()
                return temp_file.name
        except (IOError, FileNotFoundError):
            logging.warning(f"Attempt {attempt + 1}: Could not read cookie file, retrying...")
        except Exception as e:
            logging.error(f"Unexpected error reading cookie file: {e}")
            return None

        time.sleep(0.2)

    logging.error(f"Failed to read valid content from {source_cookie_path} after retries.")
    return None

# --- Helpers ---

def normalize_domain(domain: str) -> str:
    d = domain.lower()
    if "youtube" in d or "youtu.be" in d:
        return "youtube"
    if "khanacademy" in d:
        return "khanacademy"
    if "3blue1brown" in d or "3b1b" in d:
        return "3blue1brown"
    if "edx.org" in d:
        return "edx"
    if "coursera.org" in d:
        return "coursera"
    if "udacity.com" in d:
        return "udacity"
    if "mit.edu" in d:
        return "mitocw"
    return d.split(".")[0]

def get_thumbnail(info: dict, domain: str) -> str:
    if info.get("thumbnail"):
        return info["thumbnail"]
    if domain in FALLBACK_THUMBNAILS:
        return FALLBACK_THUMBNAILS[domain]
    return VIDEO_PLACEHOLDER_IMG

def is_potential_video_link(url: str) -> bool:
    if not url:
        return False
    if NON_VIDEO_PATTERNS.search(url):
        return False

    try:
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        path = parsed.path.lower()
        if "youtube.com" in domain and ("/channel/" in path or "/c/" in path or "/user/" in path):
            return False
        if "khanacademy.org" in domain and ("/a/" in path or ("/v/" not in path and "/lesson/" not in path)):
            return False
        if "3blue1brown.com" in domain and "/lessons/" not in path and "/e/" not in path:
            return False
        if "edx.org" in domain and "/learn/" not in path:
            return False
        if "coursera.org" in domain and ("/learn/" not in path and "/specializations/" not in path and "/professional-certificates/" not in path):
            return False
        if "udacity.com" in domain and ("/course/" not in path and "/nanodegree/" not in path):
            return False
    except Exception:
        return False
    return True

async def _yt_playlist_thumbnail_fallback(playlist_url: str) -> str | None:
    """
    Fallback path that does not rely on yt-dlp:
    - Fetch playlist HTML
    - Parse first videoId
    - Return the best available i.ytimg.com thumbnail
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
    }
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True, headers=headers) as client:
            resp = await client.get(playlist_url)
            if resp.status_code != 200:
                return None
            html = resp.text

            # Prefer finding videoId inside playlistVideoRenderer
            m = re.search(r'"playlistVideoRenderer"\s*:\s*{.*?"videoId"\s*:\s*"([a-zA-Z0-9_-]{11})"', html, re.DOTALL)
            if not m:
                m = re.search(r'"videoId"\s*:\s*"([a-zA-Z0-9_-]{11})"', html)
            if not m:
                return None
            vid = m.group(1)

            # Try best-to-worst candidates with a quick HEAD
            candidates = [
                f"https://i.ytimg.com/vi/{vid}/maxresdefault.jpg",
                f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg",
                f"https://i.ytimg.com/vi/{vid}/sddefault.jpg",
                f"https://i.ytimg.com/vi/{vid}/mqdefault.jpg",
            ]
            for url in candidates:
                try:
                    head = await client.head(url)
                    if head.status_code == 200:
                        return url
                except Exception:
                    continue
            # As a last resort, return hqdefault without verifying
            return f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg"
    except Exception as e:
        logging.debug(f"YouTube playlist thumbnail fallback failed: {e}")
        return None

async def get_youtube_playlist_thumbnail(playlist_url: str, ydl: yt_dlp.YoutubeDL) -> str | None:
    try:
        loop = asyncio.get_event_loop()
        playlist_info = await loop.run_in_executor(
            None, lambda: ydl.extract_info(f"{playlist_url}?playlist_items=1", download=False)
        )
        if playlist_info and 'entries' in playlist_info and playlist_info['entries']:
            thumb = playlist_info['entries'][0].get('thumbnail')
            if thumb:
                return thumb
    except Exception as e:
        logging.warning(f"Could not fetch first video thumbnail for playlist {playlist_url}: {type(e).__name__}")

    # Fallback: scrape HTML to get first videoId and derive thumbnail
    return await _yt_playlist_thumbnail_fallback(playlist_url)

def normalized_title_key(title: str) -> str:
    if not title:
        return ""
    s = title.lower()
    s = re.sub(r"[^a-z0-9\s]", "", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s

# --- Main Metadata Extraction ---

async def extract_video_metadata_from_url(url: str) -> dict | None:
    temp_cookie_filepath = None
    try:
        ydl_opts = YDL_OPTS_BASE.copy()
        loop = asyncio.get_running_loop()
        temp_cookie_filepath = await loop.run_in_executor(None, _create_safe_cookie_snapshot)

        if temp_cookie_filepath:
            ydl_opts["cookiefile"] = temp_cookie_filepath

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = await loop.run_in_executor(None, lambda: ydl.extract_info(url, download=False))

        if not info:
            return None

        is_playlist = info.get("extractor_key") == "YoutubeTab" or info.get("_type") == "playlist"
        domain = normalize_domain(urlparse(url).netloc)
        thumbnail = get_thumbnail(info, domain)

        if is_playlist:
            if domain == "youtube" and not info.get("thumbnail"):
                playlist_thumb = await get_youtube_playlist_thumbnail(url, ydl)
                if playlist_thumb:
                    thumbnail = playlist_thumb

            count = info.get("entry_count") or info.get("playlist_count", -1)
            return {
                "title": info.get("title", "Untitled Playlist"),
                "img": thumbnail,
                "duration": "",
                "count": count if count and count > 0 else 1,
                "tags": [domain, "playlist"],
                "link": info.get("webpage_url") or url,
            }
        else:
            duration = info.get("duration")
            return {
                "title": info.get("title", "Untitled Video"),
                "img": thumbnail,
                "duration": f"{int(duration // 60)}:{int(duration % 60):02d}" if duration else "",
                "count": 1,
                "tags": [domain],
                "link": info.get("webpage_url") or url,
            }

    except yt_dlp.utils.DownloadError:
        logging.warning(f"yt-dlp could not process '{url}'. This may be a non-video page.")
        return None
    except Exception:
        logging.exception(f"Unexpected error for '{url}'")
        return None
    finally:
        if temp_cookie_filepath:
            try:
                os.remove(temp_cookie_filepath)
            except OSError as e:
                logging.warning(f"Error removing temporary cookie file {temp_cookie_filepath}: {e}")
