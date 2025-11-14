import re
import httpx
import asyncio
import logging
import tiktoken
import soundfile as sf

from contextlib import asynccontextmanager
from typing import List,Tuple

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse

from utils.chat_utils import create_llm_payload, handle_non_streaming_llm_response

import math
import subprocess
import tempfile

from pydantic import BaseModel
from pathlib import Path

from config.constants import FFMPEG_PATH, STT_SAMPLE_RATE, GLOBAL_LLM_MAX_CONCURRENCY,MAX_TOKENS_PER_CHUNK, OVERLAP_TOKEN_TARGET , LLM_MAX_OUTPUT_TOKENS, TOKENIZER_MODEL, LLM_TEMPERATURE, MAX_CHUNK_SECONDS, LLAMA_SERVER_URL
from config.lists import CONTEXT_INSTRUCTIONS
from config.prompts import REFINED_PROMPT_TEMPLATE

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
stt = None

class TranscribeRequest(BaseModel):
    file_path: str

class RefineRequest(BaseModel):
    transcript: str

# --- Utility Functions ---

def extract_final_markdown(text: str) -> str:
    markdown_blocks = re.findall(r"```markdown\n(.*?)\n```", text, re.DOTALL)
    if markdown_blocks:
        logging.info("Found a fenced markdown block. Extracting content from the last one.")
        return markdown_blocks[-1].strip()
    h1_match = re.search(r"^#\s.*", text, re.MULTILINE)
    if h1_match:
        return text[h1_match.start():].strip()
    logging.warning("Could not find a markdown block or H1 header. Returning the full text as a last resort.")
    return text.strip()

def strip_boilerplate(text: str) -> str:
    closing_tag = "</think>"
    index = text.lower().find(closing_tag)
    if index != -1:
        return text[index + len(closing_tag):].lstrip()
    return text.strip()

# --- NEW: Helper function to get the overlap context ---
def _get_overlap_context(text: str, tokenizer, max_tokens: int) -> str:
    """Extracts the last few sentences of a text chunk to use as overlap."""
    if not text:
        return ""
    
    sentences = re.split(r'(?<=[.!?])\s+', text)
    overlap_sentences = []
    current_tokens = 0
    
    for sentence in reversed(sentences):
        sentence_tokens = len(tokenizer.encode(sentence))
        if current_tokens + sentence_tokens > max_tokens:
            break
        overlap_sentences.insert(0, sentence)
        current_tokens += sentence_tokens
        
    if not overlap_sentences:
        return ""

    # Return a formatted context block
    context = " ".join(overlap_sentences)
    return f"--- Context from previous chunk ---\n{context}\n---\n\n"


# --- NEW: The chunking function with overlap logic ---
def chunk_transcript_with_overlap(transcript: str) -> List[str]:
    """
    Splits the transcript into chunks with a small, specified overlap
    to maintain context between LLM calls.
    """
    try:
        tokenizer = tiktoken.encoding_for_model(TOKENIZER_MODEL)
    except KeyError:
        tokenizer = tiktoken.get_encoding("cl100k_base")

    paragraphs = transcript.split('\n\n')
    chunks, current_chunk_paragraphs, current_chunk_tokens = [], [], 0
    overlap_context = ""

    # Effective max tokens for new content, reserving space for overlap
    effective_max_tokens = MAX_TOKENS_PER_CHUNK - OVERLAP_TOKEN_TARGET

    for p in (p.strip() for p in paragraphs if p.strip()):
        p_tokens = len(tokenizer.encode(p))

        # This paragraph is too large even for a single chunk, so split it by sentence
        if p_tokens > effective_max_tokens:
            # First, process any existing paragraphs as a chunk
            if current_chunk_paragraphs:
                chunk_content = "\n\n".join(current_chunk_paragraphs)
                chunks.append(overlap_context + chunk_content)
                overlap_context = _get_overlap_context(chunk_content, tokenizer, OVERLAP_TOKEN_TARGET)
                current_chunk_paragraphs, current_chunk_tokens = [], 0

            # Now, process the oversized paragraph by sentences
            sentences = re.split(r'(?<=[.!?])\s+', p)
            current_sentence_group, current_sentence_tokens = [], 0
            for sentence in sentences:
                sentence_tokens = len(tokenizer.encode(sentence))
                if current_sentence_tokens + sentence_tokens > effective_max_tokens and current_sentence_group:
                    chunk_content = " ".join(current_sentence_group)
                    chunks.append(overlap_context + chunk_content)
                    overlap_context = _get_overlap_context(chunk_content, tokenizer, OVERLAP_TOKEN_TARGET)
                    current_sentence_group = [sentence]
                    current_sentence_tokens = sentence_tokens
                else:
                    current_sentence_group.append(sentence)
                    current_sentence_tokens += sentence_tokens
            if current_sentence_group:
                current_chunk_paragraphs = [" ".join(current_sentence_group)]
                current_chunk_tokens = current_sentence_tokens
            continue

        # Normal case: add paragraph to the current chunk if it fits
        if current_chunk_tokens + p_tokens > effective_max_tokens and current_chunk_paragraphs:
            chunk_content = "\n\n".join(current_chunk_paragraphs)
            chunks.append(overlap_context + chunk_content)
            overlap_context = _get_overlap_context(chunk_content, tokenizer, OVERLAP_TOKEN_TARGET)
            current_chunk_paragraphs = [p]
            current_chunk_tokens = p_tokens
        else:
            current_chunk_paragraphs.append(p)
            current_chunk_tokens += p_tokens

    # Add the final remaining chunk
    if current_chunk_paragraphs:
        chunk_content = "\n\n".join(current_chunk_paragraphs)
        chunks.append(overlap_context + chunk_content)

    return chunks

# --- process_chunk and other functions remain the same ---
async def process_chunk(chunk: str, context_instruction: str, index: int) -> Tuple[int, str]:
    async with global_llm_semaphore:
        try:
            logging.info(f"Processing chunk {index}...")
            system_prompt = f"{REFINED_PROMPT_TEMPLATE}\n\n{context_instruction}"
            messages = [{"role": "system", "content": system_prompt}, {"role": "user", "content": chunk}]
            
            llm_config = {
                "temperature": LLM_TEMPERATURE,
                "max_tokens": LLM_MAX_OUTPUT_TOKENS
            }
            
            payload = await create_llm_payload(
                messages=messages, 
                stream=False,
                llm_config=llm_config
            )
            
            response_data = await handle_non_streaming_llm_response(
                client=http_client,
                payload=payload,
                url=LLAMA_SERVER_URL
            )
            
            raw_content = response_data.get("content", "").strip()
            
            if not raw_content:
                logging.warning(f"Chunk {index} returned empty content from LLM. Falling back to original chunk.")
                return (index, chunk)
            
            cleaned_content = extract_final_markdown(raw_content)
            cleaned_content = strip_boilerplate(cleaned_content)

            if not cleaned_content:
                logging.warning(f"Markdown extraction failed for chunk {index}. Falling back to original chunk.")
                return (index, chunk)

            logging.info(f"Successfully processed and cleaned chunk {index}.")
            return (index, cleaned_content)
        
        except httpx.TimeoutException as e:
            logging.error(f"Timeout error processing chunk {index}: {e}. The LLM server took too long to respond. Falling back.")
            return (index, chunk)
        except httpx.HTTPStatusError as e:
            logging.error(f"HTTP error processing chunk {index}: {e.response.status_code} - {e.response.text}. Falling back.")
            return (index, chunk)
        except Exception as e:
            logging.error(f"A critical, unexpected error occurred while processing chunk {index}: {type(e).__name__} - {e}. Falling back.")
            return (index, chunk)

# --- Application Lifecycle and Core Logic ---
http_client = None
global_llm_semaphore = asyncio.Semaphore(GLOBAL_LLM_MAX_CONCURRENCY)

@asynccontextmanager
async def lifespan(app: FastAPI):
    global http_client
    logging.info("Starting up and creating persistent httpx client...")
    timeout_config = httpx.Timeout(None)
    http_client = httpx.AsyncClient(timeout=timeout_config)
    yield
    logging.info("Shutting down and closing httpx client...")
    if http_client:
        await http_client.aclose()

app = FastAPI(lifespan=lifespan, default_response_class=ORJSONResponse)t
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

# --- Endpoints ---
@app.post("/transcribe_file")
async def transcribe_file(req: TranscribeRequest):
    """
    Transcribes any audio/video file.

    Workflow:
    1. Converts the input file to a standardized WAV format (16kHz, mono).
    2. If the WAV is longer than `max_chunk_seconds`, it's split into smaller chunks.
    3. Each chunk is transcribed sequentially.
    4. The final transcript is returned.
    """
    global stt
    from utils.stt_utils import STT
    if stt is None:
        stt = STT()
    if not stt.is_ready():
        raise HTTPException(status_code=503, detail="STT model is not loaded or ready.")

    if not Path(FFMPEG_PATH).exists():
        raise HTTPException(status_code=500, detail=f"FFmpeg executable not found at '{FFMPEG_PATH}'")

    input_path = Path(req.file_path)
    if not input_path.exists():
        raise HTTPException(status_code=404, detail=f"File not found at path: {req.file_path}")

    # Use a temporary directory for all generated files (safer and auto-cleans)
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_dir_path = Path(temp_dir)
        standard_wav_path = temp_dir_path / "converted.wav"
        
        # 1. Convert input to a standard WAV file for processing
        logging.info(f"Converting '{input_path.name}' to standard WAV format using '{FFMPEG_PATH}'...")
        try:
            cmd = [
                FFMPEG_PATH, "-y", "-i", str(input_path),
                "-ar", str(STT_SAMPLE_RATE),
                "-ac", "1",
                "-c:a", "pcm_s16le",
                str(standard_wav_path)
            ]
            subprocess.run(cmd, check=True, capture_output=True, text=True)
            logging.info(f"Successfully converted to {standard_wav_path}")
        except subprocess.CalledProcessError as e:
            logging.error(f"FFmpeg conversion failed: {e.stderr}")
            raise HTTPException(status_code=500, detail=f"Failed to convert file. FFmpeg error: {e.stderr}")

        # 2. Check duration and split if necessary
        info = sf.info(str(standard_wav_path))
        duration = info.duration
        total_seconds = float(duration)
        chunk_files = []

        if total_seconds <= MAX_CHUNK_SECONDS:
            logging.info(f"Audio duration ({total_seconds:.1f}s) is within the limit. No splitting needed.")
            chunk_files.append(standard_wav_path)
        else:
            num_chunks = math.ceil(total_seconds / MAX_CHUNK_SECONDS)
            logging.info(f"Audio duration ({total_seconds:.1f}s) exceeds limit. Splitting into {num_chunks} chunks...")
            try:
                chunk_filename_pattern = temp_dir_path / "chunk_%03d.wav"
                cmd_split = [
                FFMPEG_PATH, "-y", "-i", str(standard_wav_path),
                "-f", "segment",
                "-segment_time", str(MAX_CHUNK_SECONDS),
                str(chunk_filename_pattern)
                ]

                subprocess.run(cmd_split, check=True, capture_output=True, text=True)
                chunk_files = sorted(list(temp_dir_path.glob("chunk_*.wav")))
                logging.info(f"Successfully split audio into {len(chunk_files)} files.")
            except subprocess.CalledProcessError as e:
                logging.error(f"FFmpeg splitting failed: {e.stderr}")
                raise HTTPException(status_code=500, detail=f"Failed to split audio file. FFmpeg error: {e.stderr}")

        # 3. Transcribe each chunk
        full_transcript = []
        for i, chunk_path in enumerate(chunk_files):
            logging.info(f"Transcribing chunk {i+1}/{len(chunk_files)}: {chunk_path.name}")
            transcript_part = stt.transcribe_from_file(str(chunk_path))
            if transcript_part:
                full_transcript.append(transcript_part)
        
        logging.info("Transcription complete.")

        return {
            "status": "success",
            "duration_sec": total_seconds,
            "chunks_processed": len(chunk_files),
            "transcription": "\n".join(full_transcript)
        }


@app.post('/refine_transcript')
async def refine_transcript_semantic(payload: RefineRequest):
    transcript = payload.transcript
    if not transcript or not transcript.strip():
        return {"refined_chunks": []}

    # --- UPDATED: Use the new chunking function ---
    chunks = chunk_transcript_with_overlap(transcript)
    if not chunks:
        raise HTTPException(status_code=400, detail="Transcript is empty or could not be chunked.")
    
    num_chunks = len(chunks)
    logging.info(f"Split transcript into {num_chunks} overlapping chunks.")
    
    tasks = []
    if num_chunks == 1:
        tasks.append(process_chunk(chunks[0], CONTEXT_INSTRUCTIONS["single"], 0))
    else:
        tasks.append(process_chunk(chunks[0], CONTEXT_INSTRUCTIONS["first"], 0))
        for i, chunk in enumerate(chunks[1:-1], start=1):
            tasks.append(process_chunk(chunk, CONTEXT_INSTRUCTIONS["middle"], i))
        tasks.append(process_chunk(chunks[-1], CONTEXT_INSTRUCTIONS["last"], num_chunks - 1))
        
    processed_results = await asyncio.gather(*tasks)
    processed_results.sort(key=lambda x: x[0])
    
    return {"refined_chunks": processed_results}

# --- Server Execution (No changes needed here) ---
if __name__ == "__main__":
    import uvicorn
    logging.info("Starting Haru refinement server...")
    uvicorn.run("main:app", host="0.0.0.0", port=5004, reload=True)