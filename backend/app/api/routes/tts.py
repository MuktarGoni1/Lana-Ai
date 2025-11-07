"""
Text-to-Speech API routes.
"""
from fastapi import APIRouter, HTTPException
from app.schemas import TTSRequest, TTSResponse
from app.services.tts_service import TTSService
import base64
import io
import wave
from typing import Optional
from fastapi.responses import StreamingResponse

router = APIRouter()

def _get_tts_service():
    # Service with internal cache and env-initialized Gemini client
    return TTSService()

@router.post("/synthesize", response_model=TTSResponse)
async def synthesize_speech(request: TTSRequest):
    """Convert text to speech and return base64 WAV audio with duration."""
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    tts_service = _get_tts_service()
    # Default to 'leda' voice when not provided
    audio_bytes = await tts_service.generate_speech(request.text, request.voice or "leda")
    # Compute duration from WAV header
    try:
        with wave.open(io.BytesIO(audio_bytes), "rb") as wf:
            duration = wf.getnframes() / float(wf.getframerate())
    except Exception:
        duration = 0.0
    audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
    return TTSResponse(audio_base64=audio_b64, duration_seconds=duration)

# New: progressive audio streaming endpoint
@router.get("/stream")
async def stream_speech(text: str, voice: Optional[str] = None):
    """Stream audio/wav so playback can start while downloading."""
    if not text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    tts_service = _get_tts_service()
    # Default to 'leda' voice when not provided
    audio_bytes = await tts_service.generate_speech(text, voice or "leda")

    async def chunker():
        chunk_size = 16384  # 16 KB chunks
        for i in range(0, len(audio_bytes), chunk_size):
            yield audio_bytes[i:i + chunk_size]

    return StreamingResponse(
        chunker(),
        media_type="audio/wav",
        headers={
            "Cache-Control": "no-store",
            "Content-Disposition": "inline; filename=\"speech.wav\"",
            "X-Accel-Buffering": "no",
        },
    )

# Alias to match frontend expectation: POST /api/tts returns audio/wav
@router.post("/")
async def synthesize_wav(request: TTSRequest):
    """Convert text to speech and return audio/wav as streaming response."""
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    tts_service = _get_tts_service()
    # Default to 'leda' voice when not provided
    audio_bytes = await tts_service.generate_speech(request.text, request.voice or "leda")

    async def chunker():
        chunk_size = 16384
        for i in range(0, len(audio_bytes), chunk_size):
            yield audio_bytes[i:i + chunk_size]

    return StreamingResponse(
        chunker(),
        media_type="audio/wav",
        headers={
            "Cache-Control": "no-store",
            "Content-Disposition": "inline; filename=\"speech.wav\"",
            "X-Accel-Buffering": "no",
        },
    )