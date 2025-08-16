import asyncio
from ddgs import DDGS
import logging

async def ddgs_search_full_async(query: str, max_results: int = 5):
    """
    Asynchronously performs a DuckDuckGo search and returns the full result objects.
    """
    try:
        # The DDGS().text method is synchronous, so we run it in a thread pool
        # to avoid blocking the asyncio event loop.
        loop = asyncio.get_event_loop()
        with DDGS() as ddgs:
            results = await loop.run_in_executor(
                None,  # Uses the default executor
                lambda: list(ddgs.text(query, max_results=max_results))
            )
        return results
    except Exception as e:
        logging.error(f"An error occurred during DDG search for query '{query}': {e}")
        return []

def classify_document_type(title: str) -> str:
    """
    Infers the document type from its title using keywords.
    """
    title_lower = title.lower()
    if "book" in title_lower:
        return "Book"
    if "lecture" in title_lower or "notes" in title_lower or "slides" in title_lower:
        return "Lecture"
    if "tutorial" in title_lower or "guide" in title_lower:
        return "Tutorial"
    if "paper" in title_lower or "article" in title_lower or "proceedings" in title_lower:
        return "Paper"
    if "handbook" in title_lower or "manual" in title_lower:
        return "Handbook"
    if "supplement" in title_lower:
        return "Supplement"
    return "Document"
