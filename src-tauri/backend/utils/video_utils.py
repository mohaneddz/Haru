import asyncio
import logging
import re
from urllib.parse import urlparse

import yt_dlp
from config.constants import VIDEO_PLACEHOLDER_IMG

# Configure yt-dlp to be quiet
YDL_OPTS = {
    "quiet": True,
    "no_warnings": True,
    "extract_flat": "in_playlist",
    "skip_download": True,
    "force_generic_extractor": True,
}


def normalize_domain(domain: str) -> str:
    d = domain.lower()
    if "youtube" in d or "youtu.be" in d:
        return "youtube"
    if "khanacademy" in d:
        return "khanacademy"
    if "3blue1brown" in d or "3b1b" in d:
        return "3blue1brown"
    # fallback: strip tld
    return d.split(".")[0]


def is_video_link(url: str) -> bool:
    """Check if a URL looks like a video link."""
    if not url:
        return False
    parsed = urlparse(url)
    domain = parsed.netloc.lower()
    if "youtube.com" in domain or "youtu.be" in domain:
        return True
    # Add more domains or patterns here if needed
    return True


async def extract_video_metadata_from_url(url: str) -> dict | None:
    """Extract metadata from a video URL using yt-dlp."""
    try:
        with yt_dlp.YoutubeDL(YDL_OPTS) as ydl:
            info = await asyncio.to_thread(ydl.extract_info, url, download=False)
            if not info:
                return None

            is_playlist = info.get("_type") == "playlist"
            domain = normalize_domain(urlparse(url).netloc)

            if is_playlist:
                return {
                    "title": info.get("title", "Untitled Playlist"),
                    "img": info.get("thumbnail") or VIDEO_PLACEHOLDER_IMG,
                    "duration": "",
                    "count": info.get("playlist_count", -1),
                    "tags": [domain, "playlist"],
                    "link": info.get("webpage_url") or url,
                }
            else:
                return {
                    "title": info.get("title", "Untitled Video"),
                    "img": info.get("thumbnail") or VIDEO_PLACEHOLDER_IMG,
                    "duration": (
                        f"{int(info['duration'] // 60)}:{int(info['duration'] % 60):02d}"
                        if info.get("duration")
                        else ""
                    ),
                    "count": 1,
                    "tags": [domain],
                    "link": info.get("webpage_url") or url,
                }
    except Exception as e:
        logging.error(f"Failed to extract metadata for {url}: {e}")
        return None


def normalized_title_key(title: str) -> str:
    """Simple normalized title key for fuzzy dedupe."""
    if not title:
        return ""
    s = title.lower()
    s = re.sub(r"[^a-z0-9\s]", "", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s