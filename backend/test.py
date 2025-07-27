from llama_cpp import Llama
llm = Llama(model_path="D:/Programming/Projects/Tauri/haru/backend/models/gemma-3-4b-it-q4_0.gguf", n_gpu_layers=-1, verbose=True)
print(llm("Q: What is 2+2?\nA:", max_tokens=5))
