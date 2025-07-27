import subprocess
import requests
from flask import Flask, request, jsonify
import atexit

app = Flask(__name__)

LLAMA_SERVER_PATH = r"lib\llama-server.exe"
MODEL_PATH = r"models\gemma-3-4b-it-q4_0.gguf"
LLAMA_SERVER_URL = "http://localhost:8080/completion"

# Start llama-server with optimized settings
llama_process = subprocess.Popen([
    LLAMA_SERVER_PATH,
    "-m", MODEL_PATH,
    "-t", "16",         # Use all 16 threads
    "-ngl", "999",      # Use all GPU layers
    "-c", "2048"        # Full context size
])
print("llama-server.exe started.")

# Ensure server gets killed on exit
atexit.register(llama_process.kill)

@app.route("/ask", methods=["POST"])
def ask_model():
    data = request.get_json()
    if not data or "prompt" not in data:
        return jsonify({"error": "Missing 'prompt'"}), 400

    payload = {
        "prompt": data["prompt"],
        "n_predict": 100,
        "temperature": 0.7,
        "stop": ["</s>"]
    }

    try:
        response = requests.post(LLAMA_SERVER_URL, json=payload)
        response.raise_for_status()
        content = response.json().get("content", "")
        return jsonify({"content": content})
    except Exception as e:
        print("Request failed:", e)
        return jsonify({"error": "llama-server communication failed"}), 500

@app.route("/shutdown", methods=["POST"])
def shutdown_server():
    llama_process.kill()
    return jsonify({"status": "llama-server killed"})

if __name__ == "__main__":
    app.run(port=5000)
