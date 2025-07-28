import subprocess
import sys

main_process = None

# lib\llama-server.exe -m models\gemma-3-4b-it-q4_0.gguf -ngl 99 -c 8192 -t 6
def run_llama_server():
    global main_process
    try:
        main_process = subprocess.Popen([
            "lib/llama-server.exe",
            "-m", "models/gemma-3-4b-it-q4_0.gguf",
            "-ngl", "99",
            "-c", "8192",
            "-t", "6"
        ], check=True)
    except subprocess.CalledProcessError as e:
        print(f"Error running llama-server: {e}", file=sys.stderr)
        sys.exit(1)

def kill_llama_server():
    global main_process
    if main_process:
        main_process.terminate()
        main_process = None

def restart_llama_server():
    kill_llama_server()
    run_llama_server()