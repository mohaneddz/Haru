import requests
from flask import Flask, request, jsonify, Response, stream_with_context
import asyncio
import logging
from urllib.parse import urlparse
import json # Import json for parsing
# Assuming constants, classes, and web are available
from constants import *
from classes import *
from web import *
from flask_cors import CORS

content_extractor = None

app = Flask(__name__)
CORS(app, origins="*", supports_credentials=True,
      allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
      expose_headers=["Content-Type"])
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# ==============================================================================
# FLASK ENDPOINTS
# ==============================================================================

@app.route("/ask_search", methods=["POST"])
def ask_with_search():
    # ... (Your existing ask_search code, no changes needed here for the described problem)
    data = request.get_json()
    if not data or "prompt" not in data:
        return jsonify({"error": "Missing 'prompt'"}), 400

    query = data["prompt"]
    stream = data.get("stream", False)
    
    try:
        urls = get_web_urls(query)
        if not urls: return jsonify({"error": "Web search returned no results."}), 500

        crawled_data = asyncio.run(crawl_webpages_hybrid(urls))
        if not crawled_data: return jsonify({"error": "Crawling failed to retrieve any content."}), 500

        if not content_extractor or not content_extractor.model:
            return jsonify({"error": "Could not load the semantic search model."}), 500

        processed_results = []
        print("\n" + "="*40)
        print("SOURCES USED WITH EXTRACTED CONTENT:")
        print("="*40)
        
        for i, page in enumerate(crawled_data, 1):
            if not page.get('content'):
                logging.warning(f"Skipping page {i} due to missing content: {page.get('url')}!!!!")
                continue
            relevant_content, semantic_score, structured_fields = content_extractor.extract_relevant_sections(
                page['content'], query, html_content=page.get('html_content'), url=page['url']
            )
            
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

        for i, page in enumerate(processed_results[:5], 1):
            print(f"\nSOURCE {i} (Combined: {page.get('combined_score', 0.0):.3f}, Semantic: {page.get('semantic_score', 0.0):.3f}, Domain: {page.get('domain_priority', 0.0):.1f}, Recency: {page.get('recency_multiplier', 1.0):.1f}):")
            print(f"URL: {page['url']}")
            print(f"TITLE: {page['title']}")
            if page.get('structured_fields'):
                print(f"STRUCTURED FIELDS: {page['structured_fields']}")
            print(f"EXTRACTED_CONTENT:")
            print("-" * 60)
            print(page['content'])
            print("-" * 60)
            print(f"Content Length: {len(page['content'])} characters\n")

        print("="*40)
        print(f"TOTAL SOURCES PROCESSED: {len(processed_results)}")
        print("="*40 + "\n")
        
        if not processed_results:
            return jsonify({"content": "I found some web pages, but none contained specific information relevant to your question."}), 200

        final_results = processed_results

    except Exception as e:
        logging.error(f"Error during web search pipeline: {e}", exc_info=True)
        return jsonify({"error": f"An error occurred: {e}"}), 500
    
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
    
    combined_prompt = (
        "You are a helpful research assistant. Answer the user's question based *only* on the information provided in the context below. "
        "Synthesize the information from the Primary Source and Supporting Evidence into a single, coherent answer. Be concise.\n\n"
        "--- START OF CONTEXT ---\n"
        f"{search_context}"
        "--- END OF CONTEXT ---\n\n"
        f"Question: {query}\n\n"
        "Answer:"
    )

    print("\n" + "="*40)
    print("FINAL PROMPT SENT TO LLM:")
    print("="*40)
    print(f"Token Count: {content_extractor.count_tokens(combined_prompt)}")
    print(f"Character Count: {len(combined_prompt)}")
    print("-" * 40)
    print(combined_prompt)
    print("="*40 + "\n")

    dynamic_stops = detect_dynamic_stop_tokens(query)
    
    payload = {
        "prompt": combined_prompt,
        "n_predict": data.get("n_predict", 512),
        "temperature": 0.1,
        "stop": dynamic_stops,
        "stream": stream
    }

    try:
        response = requests.post(LLAMA_SERVER_URL, json=payload, timeout=90, stream=stream)
        response.raise_for_status()

        if stream:
            def generate():
                for chunk in response.iter_content(chunk_size=None):
                    if chunk:
                        try:
                            # This part is for the ask_search endpoint.
                            # It's assumed that the LLAMA_SERVER_URL for ask_search
                            # also sends pure JSON in its stream. If not, this might need
                            # the same `line.removeprefix("data: ")` logic.
                            obj = json.loads(chunk.decode("utf-8"))
                            content = obj.get("content", "")
                            if content:
                                yield f"data: {content}\n\n"
                        except Exception as e:
                            logging.warning(f"Bad chunk in ask_search: {e}")
            return Response(stream_with_context(generate()), mimetype='text/event-stream')
        else:
            content = response.json().get("content", "")
            return jsonify({
                "content": content.strip(),
                "golden_source": golden_source_info,
                "sources_used": len(final_results),
                "context_length": context_len,
                "context_tokens": final_tokens,
                "structured_fields": {s["url"]: s.get("structured_fields", {}) for s in final_results if s.get("structured_fields")},
                "detailed_sources": [{"url": s["url"], "title": s["title"], "content": s["content"], "combined_score": s.get("combined_score", 0)} for s in final_results]
            })
    except Exception as e:
        logging.error(f"LLM request failed: {e}", exc_info=True)
        return jsonify({"error": "Web search successful, but LLM request failed"}), 500

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        stream = data.get("stream", False)
        user_message = data.get('message')
        chat_history = data.get('history', [])

        if not user_message:
            return jsonify({"error": "No message provided"}), 400

        logging.info(f"Processing message: '{user_message[:50]}...' (history: {len(chat_history)} messages)")

        # Compose prompt for LLM
        prompt = ""
        for turn in chat_history:
            role = turn.get("role", "user")
            content = turn.get("content", "")
            prompt += f"{role.capitalize()}: {content}\n"
        prompt += f"User: {user_message}\nAssistant:"

        token_count = content_extractor.count_tokens(prompt) if content_extractor else len(prompt.split())

        llama_payload = {
            "prompt": prompt,
            "n_predict": 512,
            "temperature": 0.7,
            "stop": ["\nUser:", "User:", "<end_of_turn>", "<|eot_id|>"],  # <-- Add these stop sequences
            "stream": stream
        }

        LLAMA_URL = LLAMA_SERVER_URL if LLAMA_SERVER_URL.startswith("http") else "http://localhost:8080/completion"

        if stream:
            # This nested function will be our clean, reliable stream proxy.
            # We pass the payload and URL as arguments to avoid any scope issues.
            def generate_sse_proxy(payload_to_send, url_to_use):
                """
                Acts as a simple, robust proxy for the SSE stream from the LLM server.
                It forwards valid data lines directly to the client without parsing them.
                """
                try:
                    # Open a streaming connection to the LLM server
                    with requests.post(url_to_use, json=payload_to_send, stream=True, timeout=90) as response:
                        # Immediately check for HTTP errors (e.g., 404, 500, 502)
                        response.raise_for_status()

                        # Use `iter_lines` to process the stream line by line.
                        # This automatically handles buffering and is much safer than iter_content.
                        for line_bytes in response.iter_lines():
                            if line_bytes:
                                line_str = line_bytes.decode('utf-8')
                                
                                # The Llama.cpp server sends lines like "data: {...}".
                                # We only need to forward these valid data lines.
                                if line_str.startswith("data:"):
                                    # Yield the original line plus the required SSE terminator.
                                    # This forwards the JSON object perfectly.
                                    yield f"{line_str}\n\n"

                except requests.exceptions.RequestException as e:
                    logging.error(f"Failed to connect to LLM server during stream: {e}")
                    # Create and send a properly formatted SSE error message
                    error_payload = json.dumps({"error": "The connection to the language model failed."})
                    yield f"data: {error_payload}\n\n"
                except Exception as e:
                    logging.error(f"An unexpected error occurred in the streaming proxy: {e}")
                    error_payload = json.dumps({"error": "An internal server error occurred during the stream."})
                    yield f"data: {error_payload}\n\n"

            # Call the proxy function and return its response
            return Response(stream_with_context(generate_sse_proxy(llama_payload, LLAMA_SERVER_URL)), mimetype='text/event-stream')

        else:
            try:
                response = requests.post(LLAMA_URL, json=llama_payload, timeout=90)
                response.raise_for_status()
                content = response.json().get("content", "")
                return jsonify({
                    "content": content.strip(),
                    "tokens": token_count
                })
            except requests.exceptions.RequestException as e:
                logging.error(f"Chat backend error: {str(e)}", exc_info=True)
                return jsonify({"error": "Backend connection failed"}), 502

    except Exception as e:
        logging.error(f"Chat endpoint error: {str(e)}", exc_info=True)
        return jsonify({"error": "Internal server error"}), 500


if __name__ == "__main__":
    print("Pre-loading semantic search model for the application...")
    content_extractor = ContentExtractor() 
    app.run(port=5000, debug=False)