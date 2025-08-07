import subprocess
import sys
import os

# Get the absolute path to the current script's directory
script_dir = os.path.dirname(os.path.abspath(__file__))

try:
    process = subprocess.Popen([
        os.path.join(script_dir, "llama-server.exe"),
        "-m", os.path.join(script_dir, "gemma-3-4b-it-q4_0.gguf"),
        "-t", "6",
        "-ngl", "99",
        "-c", "2048"
    ], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    
except FileNotFoundError as e:
    print("ERROR: executable not found:", e, file=sys.stderr)
    sys.exit(1)

# Print output in real-time
try:
    for line in process.stdout:
        print(line, end="")
    for line in process.stderr:
        print(line, end="", file=sys.stderr)
except KeyboardInterrupt:
    process.terminate()

# wait until llama-server exits
returncode = process.wait()
print("llama-server exited with return code:", returncode)
sys.exit(returncode)