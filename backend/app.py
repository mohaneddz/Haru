# TODO : handle interruptions and disconnections gracefully

import os
import logging
import time
from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
from llama_cpp import Llama

# Configure logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(levelname)s - %(message)s',
                   handlers=[
                       logging.FileHandler('app.log'),
                       logging.StreamHandler()
                   ])

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'models', 'gemma-3-4b-it-q4_0.gguf')

# Global model instance
llm = None

def load_gemma_model():
    global llm
    if not os.path.exists(MODEL_PATH):
        logging.error(f"Model file not found at: {MODEL_PATH}")
        return False
    
    try:
        logging.info(f"Loading Gemma model from: {MODEL_PATH}")
        llm = Llama(
            model_path=MODEL_PATH,
            n_gpu_layers=-1,
            n_ctx=2048,
            verbose=True
        )
        logging.info("Gemma model loaded successfully!")
        return True
    except Exception as e:
        logging.error(f"Failed to load Gemma model: {str(e)}", exc_info=True)
        llm = None
        return False

app = Flask(__name__)
CORS(app)

# Request timeout configuration
REQUEST_TIMEOUT = 30  # seconds

@app.before_request
def before_request():
    request.start_time = time.time()

@app.after_request
def after_request(response):
    duration = time.time() - request.start_time
    if duration > REQUEST_TIMEOUT:
        logging.warning(f"Request took too long: {duration:.2f}s")
    response.headers['X-Request-Duration'] = str(duration)
    return response

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ready' if llm is not None else 'not ready',
        'model_loaded': llm is not None
    })

@app.route('/chat', methods=['POST'])
def chat():
    if llm is None:
        return jsonify({"error": "Model not loaded"}), 503

    try:
        data = request.get_json()
        user_message = data.get('message')
        chat_history = data.get('history', [])

        if not user_message:
            return jsonify({"error": "No message provided"}), 400

        logging.info(f"Processing message: '{user_message[:50]}...' (history: {len(chat_history)} messages)")

        # Prepare messages - consider using fresh context if issues persist
        messages_for_gemma = chat_history + [{"role": "user", "content": user_message}]

        def generate_stream():
            full_response = ""
            stream_active = True

            try:
                response_stream = llm.create_chat_completion(
                    messages=messages_for_gemma,
                    max_tokens=1024,
                    stop=["<end_of_turn>", "<|eot_id|>"],
                    temperature=0.7,
                    stream=True
                )

                for chunk in response_stream:
                    # Check if client disconnected or timeout reached
                    if not stream_active or time.time() - request.start_time > REQUEST_TIMEOUT:
                        break

                    if "choices" in chunk and len(chunk["choices"]) > 0:
                        delta = chunk["choices"][0].get("delta", {})
                        content = delta.get("content", "")
                        
                        if content:
                            full_response += content
                            try:
                                yield f"data: {content}\n\n"
                            except (BrokenPipeError, GeneratorExit):
                                logging.warning("Client disconnected during streaming")
                                stream_active = False
                                break
                            except Exception as e:
                                logging.error(f"Streaming error: {str(e)}")
                                stream_active = False
                                break

            except Exception as e:
                logging.error(f"Generation error: {str(e)}", exc_info=True)
                yield "data: [ERROR] Generation failed\n\n"
            finally:
                logging.info(f"Stream completed. Response length: {(full_response)}")
                # Log the raw response when stream is done
                if full_response:
                    logging.info(f"Raw response content: {repr(full_response)}")
                else:
                    logging.warning("Stream completed but no response content was generated")
                # Ensure resources are released
                if hasattr(llm, 'reset'):
                    try:
                        llm.reset()
                    except Exception as e:
                        logging.error(f"Error resetting model: {str(e)}")

        return Response(stream_with_context(generate_stream()), 
                       mimetype='text/event-stream',
                       headers={'Cache-Control': 'no-cache'})

    except Exception as e:
        logging.error(f"Chat endpoint error: {str(e)}", exc_info=True)
        return jsonify({"error": "Internal server error"}), 500

# Initialize model
with app.app_context():
    if not load_gemma_model():
        logging.error("Failed to initialize model - some endpoints will be unavailable")

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    logging.info(f"Starting server on port {port}")
    app.run(host='0.0.0.0', port=port, threaded=True)