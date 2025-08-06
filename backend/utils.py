import requests
import logging
import json
from flask import jsonify, Response, stream_with_context
from urllib.parse import urlparse
import asyncio
from web import (
    get_web_urls,
    crawl_webpages_hybrid,
    get_domain_priority,
    recency_score_multiplier,
    detect_dynamic_stop_tokens,
    fetch_wikipedia_api_data,
    fetch_omdb_api_data
)
from constants import LLAMA_SERVER_URL, MAX_CONTEXT_TOKENS, TRUSTED_DOMAINS

def process_crawled_results(crawled_data, query, content_extractor):
    processed_results = []
    for page in crawled_data:
        if not page.get('content'):
            continue
        relevant_content, semantic_score, structured_fields = content_extractor.extract_relevant_sections(
            page['content'], query, html_content=page.get('html_content'), url=page['url']
        )
        # Fallback API enrichment
        if not structured_fields.get('release_date') and any(term in query.lower() for term in ['movie', 'film', 'show', 'release', 'when']):
            if 'wikipedia' in page['url']:
                api_data = asyncio.run(fetch_wikipedia_api_data(page['title']))
                structured_fields.update(api_data)
            elif any(term in query.lower() for term in ['movie', 'film']):
                api_data = asyncio.run(fetch_omdb_api_data(page['title']))
                structured_fields.update(api_data)
        if relevant_content:
            domain_priority = get_domain_priority(page['url'])
            domain = urlparse(page['url']).netloc.lower()
            is_trusted = any(trusted in domain for trusted in TRUSTED_DOMAINS.keys())
            if is_trusted:
                combined_score = max(domain_priority * semantic_score, domain_priority * 0.4)
            elif domain_priority >= 1.0:
                combined_score = max(domain_priority * semantic_score, domain_priority * 0.3)
            else:
                combined_score = domain_priority * semantic_score
            recency_multiplier = recency_score_multiplier(structured_fields)
            combined_score *= recency_multiplier
            page['content'] = relevant_content
            page['semantic_score'] = semantic_score
            page['domain_priority'] = domain_priority
            page['combined_score'] = combined_score
            page['structured_fields'] = structured_fields
            page['is_trusted'] = is_trusted
            page['recency_multiplier'] = recency_multiplier
            threshold = 0.005 if is_trusted else 0.01
            if combined_score > threshold:
                processed_results.append(page)
    processed_results.sort(key=lambda x: x.get('combined_score', 0.0), reverse=True)
    return processed_results

def build_search_context(final_results, query, content_extractor):
    golden_source = final_results[0]
    supporting_sources = final_results[1:3]
    golden_source_info = {"url": golden_source.get('url'), "title": golden_source.get('title')}
    search_context = (
        f"**Primary Source:**\nTitle: {golden_source.get('title')}\nURL: {golden_source.get('url')}\n"
    )
    if golden_source.get('structured_fields'):
        search_context += f"Key Facts: {golden_source['structured_fields']}\n"
    search_context += f"Relevant Information:\n---\n{golden_source.get('content')}\n---\n\n"
    current_tokens = content_extractor.count_tokens(search_context)
    if supporting_sources and current_tokens < MAX_CONTEXT_TOKENS - 500:
        search_context += "**Supporting Evidence:**\n"
        for source in supporting_sources:
            source_snippet = source.get('content', '')[:500]
            fields_str = f" (Key Facts: {source['structured_fields']})" if source.get('structured_fields') else ""
            source_text = f"- From {source.get('url')}{fields_str}: \"{source_snippet}...\"\n"
            if current_tokens + content_extractor.count_tokens(source_text) > MAX_CONTEXT_TOKENS - 200:
                break
            search_context += source_text
            current_tokens += content_extractor.count_tokens(source_text)
    context_len = len(search_context)
    final_tokens = content_extractor.count_tokens(search_context)
    return search_context, golden_source_info, context_len, final_tokens, supporting_sources

def build_llm_payload(search_context, query, data, supporting_sources):
    combined_prompt = (
        "You are a helpful research assistant. Answer the user's question based *only* on the information provided in the context below. "
        "Synthesize the information from the Primary Source and Supporting Evidence into a single, coherent answer. Be concise.\n\n"
        "--- START OF CONTEXT ---\n"
        f"{search_context}"
        "--- END OF CONTEXT ---\n\n"
        f"Question: {query}\n\n"
        "Answer:"
    )
    dynamic_stops = detect_dynamic_stop_tokens(query)
    payload = {
        "prompt": combined_prompt,
        "n_predict": data.get("n_predict", 512),
        "temperature": 0.1,
        "stop": dynamic_stops,
        "stream": data.get("stream", False)
    }
    return payload

def handle_llm_response(payload, stream, final_results, golden_source_info, context_len, final_tokens):
    try:
        response = requests.post(LLAMA_SERVER_URL, json=payload, timeout=90, stream=stream)
        response.raise_for_status()
        if stream:
            def generate_sse_proxy(resp):
                for line_bytes in resp.iter_lines():
                    if line_bytes:
                        line_str = line_bytes.decode('utf-8')
                        if line_str.startswith("data:"):
                            yield f"{line_str}\n\n"
            return Response(
                stream_with_context(generate_sse_proxy(response)),
                mimetype='text/event-stream',
                headers={
                    "X-Sources-Used": str(len(final_results)),
                    "X-Golden-Source": json.dumps(golden_source_info),
                    "X-Context-Length": str(context_len),
                    "X-Context-Tokens": str(final_tokens),
                    "X-Detailed-Sources": json.dumps([
                        {"url": s["url"], "title": s["title"], "combined_score": s.get("combined_score", 0)}
                        for s in final_results
                    ])
                }
            )
        else:
            content = response.json().get("content", "")
            return jsonify({
                "content": content.strip(),
                "golden_source": golden_source_info,
                "sources_used": len(final_results),
                "context_length": context_len,
                "context_tokens": final_tokens,
                "structured_fields": {s["url"]: s.get("structured_fields", {}) for s in final_results if s.get("structured_fields")},
                "detailed_sources": [
                    {"url": s["url"], "title": s["title"], "combined_score": s.get("combined_score", 0)}
                    for s in final_results
                ]
            })
    except Exception as e:
        logging.error(f"LLM request failed: {e}", exc_info=True)
        return jsonify({"error": "Web search successful, but LLM request failed"}), 500