@echo off
cd /d D:\Programming\Projects\Tauri\haru\src-tauri

if "%1"=="v" (
    lib\llama-server.exe -m weights\gemma-3-4b-it-q4_0.gguf --mmproj weights\mmproj-model-f16-4B.gguf -ngl 99 -c 32768 -t 6
)
else if "%1"=="g" (
    lib\llama-server.exe -m weights\gemma-3-4b-it-q4_0.gguf -ngl 99 -c 40960 -t 6
)
else if "%1"=="t" (
    lib\llama-server.exe -m weights\Qwen3-4B-Thinking-2507-Q4_K_S.gguf -ngl 99 -c 8192 -t 6
) else (
    lib\llama-server.exe -m weights\gemma-3-4b-it-q4_0.gguf -ngl 99 -c 32768 -t 6
)
