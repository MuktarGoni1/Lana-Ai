"""
Text-to-Speech API routes.
"""
from fastapi import APIRouter, HTTPException, Request
from app.schemas import TTSRequest, TTSResponse
from app.services.tts_service import TTSService
import base64
import io
import wave
from typing import Optional
from fastapi.responses import StreamingResponse
from app.config import TTS_CHUNK_SIZE
from app.middleware.rate_limit_middleware import RateLimitMiddleware
import time

router = APIRouter()

# Create a singleton TTSService so its cache/client are reused across requests
_TTS_SERVICE = TTSService()
rate_limiter = RateLimitMiddleware(None)

def _get_tts_service():
    return _TTS_SERVICE

@router.post("/synthesize", response_model=TTSResponse)
async def synthesize_speech(request: TTSRequest, http_request: Request):
    """Convert text to speech and return base64 WAV audio with duration."""
    # Apply rate limiting through middleware
    pass  # Rate limiting is handled by middleware now
    
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    tts_service = _get_tts_service()
    try:
        # Default to 'leda' voice when not provided
        audio_bytes = await tts_service.generate_speech(request.text, request.voice or "leda")
        # Compute duration from WAV header
        try:
            with wave.open(io.BytesIO(audio_bytes), "rb") as wf:
                duration = wf.getnframes() / float(wf.getframerate())
        except Exception:
            duration = 0.0
        audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
        response = TTSResponse(audio_base64=audio_b64, duration_seconds=duration)
        return response
    except RuntimeError as e:
        # Handle TTS service errors with proper HTTP status
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        # Handle unexpected errors
        raise HTTPException(status_code=500, detail=f"Internal TTS error: {str(e)}")

# New: progressive audio streaming endpoint
@router.get("/stream")
async def stream_speech(text: str, voice: Optional[str] = None, http_request: Request = None):
    """Stream audio/wav so playback can start while downloading."""
    # Apply rate limiting through middleware
    pass  # Rate limiting is handled by middleware now
    
    if not text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    tts_service = _get_tts_service()
    try:
        # Default to 'leda' voice when not provided
        audio_bytes = await tts_service.generate_speech(text, voice or "leda")

        async def chunker():
            # Increased chunk size for faster streaming
            chunk_size = TTS_CHUNK_SIZE  # Configurable chunk size
            for i in range(0, len(audio_bytes), chunk_size):
                yield audio_bytes[i:i + chunk_size]

        return StreamingResponse(
            chunker(),
            media_type="audio/wav",
            headers={
                "Cache-Control": "no-store",
                "Content-Disposition": "inline; filename=\"speech.wav\"",
                "Accept-Ranges": "bytes",
                "X-Accel-Buffering": "no",
                # Add streaming optimization headers
                "Connection": "keep-alive",
                "Transfer-Encoding": "chunked",
            },
        )
    except RuntimeError as e:
        # Handle TTS service errors with proper HTTP status
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        # Handle unexpected errors
        raise HTTPException(status_code=500, detail=f"Internal TTS error: {str(e)}")

# Alias to match frontend expectation: POST /api/tts returns audio/wav as streaming response.
@router.post("/")
async def synthesize_wav(request: TTSRequest, http_request: Request):
    """Convert text to speech and return audio/wav as streaming response."""
    # Apply rate limiting through middleware
    pass  # Rate limiting is handled by middleware now
    
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    tts_service = _get_tts_service()
    try:
        # Default to 'leda' voice when not provided
        audio_bytes = await tts_service.generate_speech(request.text, request.voice or "leda")

        async def chunker():
            # Increased chunk size for faster streaming
            chunk_size = TTS_CHUNK_SIZE  # Configurable chunk size
            for i in range(0, len(audio_bytes), chunk_size):
                yield audio_bytes[i:i + chunk_size]

        return StreamingResponse(
            chunker(),
            media_type="audio/wav",
            headers={
                "Cache-Control": "no-store",
                "Content-Disposition": "inline; filename=\"speech.wav\"",
                "Accept-Ranges": "bytes",
                "X-Accel-Buffering": "no",
                # Add streaming optimization headers
                "Connection": "keep-alive",
                "Transfer-Encoding": "chunked",
            },
        )
    except RuntimeError as e:
        # Handle TTS service errors with proper HTTP status
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        # Handle unexpected errors
        raise HTTPException(status_code=500, detail=f"Internal TTS error: {str(e)}")