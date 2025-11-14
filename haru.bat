@echo off
REM Activate conda environment
call conda activate haru

REM Change directory to backend
cd /d D:\Programming\Tauri\haru\src-tauri\backend

REM Determine argument
if "%1"=="chat" (
    uvicorn chat_worker:app --host 0.0.0.0 --port 5000 --workers 1
) else if "%1"=="rag" (
    uvicorn rag_worker:app --host 0.0.0.0 --port 5001 --workers 1
) else if "%1"=="web" (
    uvicorn web_worker:app --host 0.0.0.0 --port 5002 --workers 1
) else if "%1"=="tts" (
    uvicorn tts_worker:app --host 0.0.0.0 --port 5003 --workers 1
) else if "%1"=="stt" (
    uvicorn stt_worker:app --host 0.0.0.0 --port 5004 --workers 1
) else if "%1"=="misc" (
    uvicorn misc_worker:app --host 0.0.0.0 --port 3999 --workers 1
) else if "%1"=="home" (
    uvicorn home_worker:app --host 0.0.0.0 --port 4999 --workers 1
) else if "%1"=="voice" (
    uvicorn voice_worker:app --host 0.0.0.0 --port 5005 --workers 1
) else (
    echo Unknown argument: %1
)
