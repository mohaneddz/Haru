import asyncio
import logging
from typing import List, Dict, Any, Union

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
    return raw[start:end+1] if (start != -1 and end != -1 and end > start) else ""

def clean_dependencies(concepts: list[dict]) -> list[dict]:
    """
    Removes self-references, unmatched dependencies, and duplicates.
    """
    name_set = {c["name"] for c in concepts}
    for c in concepts:
        if "dependencies" not in c or not isinstance(c["dependencies"], list):
            c["dependencies"] = []
            continue

        seen = set()
        unique_deps = []
        for dep in c["dependencies"]:
            if dep not in seen and dep != c["name"] and dep in name_set:
                seen.add(dep)
                unique_deps.append(dep)
        c["dependencies"] = unique_deps
    return concepts

def enforce_dependency_rules(concepts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Enforces that dependencies only refer to concepts in the same or previous chapters
    and that there are at most 2 dependencies per concept.
    """
    concept_to_chapter_map: Dict[str, int] = {}
    for concept in concepts:
        try:
            # Safely parse chapter number (e.g., "1" from "1.2")
            chapter_num = int(concept.get("subtopic_number", "0.0").split('.')[0])
            concept_to_chapter_map[concept["name"]] = chapter_num
        except (ValueError, IndexError):
            concept_to_chapter_map[concept["name"]] = 0 # Default to 0 on parsing error
            logging.warning("Could not parse chapter from subtopic: '%s' for concept: '%s'", concept.get("subtopic_number"), concept.get("name"))

    for concept in concepts:
        current_chapter = concept_to_chapter_map.get(concept["name"], 0)
        
        valid_deps: List[str] = []
        for dep_name in concept.get("dependencies", []):
            dep_chapter = concept_to_chapter_map.get(dep_name)
            
            # Check if dependency exists and its chapter is valid
            if dep_chapter is not None and dep_chapter <= current_chapter:
                valid_deps.append(dep_name)
            else:
                logging.info(
                    "Dropping dependency '%s' for concept '%s' due to chapter rule.",
                    dep_name, concept["name"]
                )
        
        # Enforce the maximum of 2 dependencies
        if len(valid_deps) > 2:
            logging.info("Truncating dependencies for concept '%s' to 2.", concept["name"])
            concept["dependencies"] = valid_deps[:2]
        else:
            concept["dependencies"] = valid_deps
            
    return concepts

def detect_cycle_by_name(concepts: list[dict]) -> Union[list[str], None]:
    """
    Detects cycles in the dependency graph. Returns a list of nodes in the cycle
    or None if no cycle is found.
    """
    graph = {c["name"]: c.get("dependencies", []) for c in concepts}
    visiting = set()  # Nodes currently in the recursion stack
    visited = set()   # All nodes that have been fully explored

    def dfs(node):
        visiting.add(node)
        
        for neighbor in graph.get(node, []):
            if neighbor in visiting:
                # Cycle detected
                return [node, neighbor]
            if neighbor not in visited:
                cycle = dfs(neighbor)
                if cycle:
                    # Propagate cycle up
                    return cycle if cycle[0] == neighbor else [node] + cycle
        
        visiting.remove(node)
        visited.add(node)
        return None

    for node_name in graph:
        if node_name not in visited:
            cycle_path = dfs(node_name)
            if cycle_path:
                return cycle_path
    return None    