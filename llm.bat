@echo off
cd /d D:\Programming\Projects\Tauri\haru\src-tauri

if "%1"=="v" (
    lib\llama-server.exe -m weights\gemma-3-4b-it-q4_0.gguf --mmproj weights\mmproj-model-f16-4B.gguf -ngl 99 -c 8192 -t 6
) else (
    lib\llama-server.exe -m weights\gemma-3-4b-it-q4_0.gguf -ngl 99 -c 8192 -t 6
)
