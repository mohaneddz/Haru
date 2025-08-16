import asyncio
import logging

# Use the new package name as recommended
from ddgs import DDGS

def sync_ddgs_search(query: str, max_results: int):
    """
    This is a synchronous wrapper function that performs the actual search.
    It's designed to be run in a separate thread by `run_in_executor`.
    """
    try:
        # --- THIS IS THE CORRECTED LINE ---
        # The method expects the argument to be named 'query', not 'keywords'.
        results = DDGS().text(query=query, max_results=max_results)
        
        return results
    except Exception as e:
        # Log any exception that occurs inside the thread.
        logging.error(f"Error inside sync_ddgs_search for query '{query}': {e}")
        return []

async def ddgs_search_full_async(query: str, max_results: int = 5):
    """
    Asynchronously performs a DuckDuckGo search by running the synchronous
    search function in a separate thread to avoid blocking the event loop.
    """
    loop = asyncio.get_running_loop()
    try:
        results = await loop.run_in_executor(
            None,
            sync_ddgs_search,
            query,
            max_results
        )
        return results
    except Exception as e:
        logging.error(f"An error occurred while dispatching DDG search for query '{query}': {e}")
        return []

def classify_document_type(title: str) -> str:
    """
    Infers the document type from its title using keywords.
    (This function is from your original file and remains unchanged).
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