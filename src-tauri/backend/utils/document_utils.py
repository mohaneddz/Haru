import asyncio
import logging
import re
from typing import List, Dict, Any

def sync_ddgs_search(query: str, max_results: int):
    """
    This is a synchronous wrapper function that performs the actual search.
    It's designed to be run in a separate thread by `run_in_executor`.
    """
    from ddgs import DDGS
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

def safe_json_extract(raw: str) -> str:
    """Return substring that starts with first { and ends at last }."""
    start = raw.find('{')
    end = raw.rfind('}')
    return raw[start:end+1] if (start != -1 and end != -1 and end > start) else raw

def canonicalize_name(name: str) -> str:
    s = name.strip()
    s = re.sub(r'\s+', ' ', s)
    s = re.sub(r'[^\w\s-]', '', s)  # remove punctuation
    s = s.title()
    return s

def make_id(name: str) -> str:
    return re.sub(r'\W+', '_', name.strip().lower())

def dedupe_concepts(concepts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Merge concepts with same canonical id, preferring longer descriptions."""
    seen = {}
    for c in concepts:
        cid = make_id(c['id'])
        if cid not in seen:
            seen[cid] = c
        else:
            # merge descriptions, prefer existing if longer
            if len(c.get('description','')) > len(seen[cid].get('description','')):
                seen[cid]['description'] = c['description']
            # merge dependencies
            deps = set(seen[cid].get('dependencies',[])) | set(c.get('dependencies',[]))
            seen[cid]['dependencies'] = list(deps)
    return list(seen.values())

def detect_cycle(concepts: List[Dict[str, Any]]) -> List[str]:
    """Return cycle nodes if cycle exists, else empty list. Simple DFS."""
    graph = {make_id(c['id']): [make_id(d) for d in c.get('dependencies',[])] for c in concepts}
    visited = {}
    stack = []
    cycles = []

    def dfs(node):
        if visited.get(node,0) == 1:
            # found back edge
            cycles.append(node)
            return True
        if visited.get(node,0) == 2:
            return False
        visited[node] = 1
        for nei in graph.get(node,[]):
            if dfs(nei):
                return True
        visited[node] = 2
        return False

    for n in graph:
        if visited.get(n,0) == 0:
            if dfs(n):
                break
    return cycles