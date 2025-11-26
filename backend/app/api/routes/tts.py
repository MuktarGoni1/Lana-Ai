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
    # Apply rate limiting
    client_ip = await rate_limiter.get_client_ip(http_request)
    endpoint = "/api/tts/synthesize"
    
    # Get endpoint-specific limits
    limits = rate_limiter.endpoint_limits.get(
        endpoint,
        {"per_minute": 15, "per_hour": 150},
    )
    
    # Check rate limits
    minute_key = f"{client_ip}:{endpoint}:minute"
    hour_key = f"{client_ip}:{endpoint}:hour"
    
    minute_ok, minute_count = await rate_limiter.check_rate_limit(
        minute_key, limits["per_minute"], 60
    )
    
    if not minute_ok:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Limit: {limits['per_minute']}/min",
            headers={
                "Retry-After": "60",
                "X-RateLimit-Limit": str(limits["per_minute"]),
                "X-RateLimit-Remaining": str(0),
                "X-RateLimit-Reset": str(60),
            },
        )
    
    hour_ok, hour_count = await rate_limiter.check_rate_limit(
        hour_key, limits["per_hour"], 3600
    )
    
    if not hour_ok:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Limit: {limits['per_hour']}/hour",
            headers={
                "Retry-After": "3600",
                "X-RateLimit-Limit": str(limits["per_hour"]),
                "X-RateLimit-Remaining": str(0),
                "X-RateLimit-Reset": str(3600),
            },
        )
    
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
    # Apply rate limiting
    if http_request:
        client_ip = await rate_limiter.get_client_ip(http_request)
        endpoint = "/api/tts/stream"
        
        # Get endpoint-specific limits
        limits = rate_limiter.endpoint_limits.get(
            endpoint,
            {"per_minute": 15, "per_hour": 150},
        )
        
        # Check rate limits
        minute_key = f"{client_ip}:{endpoint}:minute"
        hour_key = f"{client_ip}:{endpoint}:hour"
        
        minute_ok, minute_count = await rate_limiter.check_rate_limit(
            minute_key, limits["per_minute"], 60
        )
        
        if not minute_ok:
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded. Limit: {limits['per_minute']}/min",
                headers={
                    "Retry-After": "60",
                    "X-RateLimit-Limit": str(limits["per_minute"]),
                    "X-RateLimit-Remaining": str(0),
                    "X-RateLimit-Reset": str(60),
                },
            )
        
        hour_ok, hour_count = await rate_limiter.check_rate_limit(
            hour_key, limits["per_hour"], 3600
        )
        
        if not hour_ok:
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded. Limit: {limits['per_hour']}/hour",
                headers={
                    "Retry-After": "3600",
                    "X-RateLimit-Limit": str(limits["per_hour"]),
                    "X-RateLimit-Remaining": str(0),
                    "X-RateLimit-Reset": str(3600),
                },
            )
    
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
    # Apply rate limiting
    client_ip = await rate_limiter.get_client_ip(http_request)
    endpoint = "/api/tts/"
    
    # Get endpoint-specific limits
    limits = rate_limiter.endpoint_limits.get(
        endpoint,
        {"per_minute": 15, "per_hour": 150},
    )
    
    # Check rate limits
    minute_key = f"{client_ip}:{endpoint}:minute"
    hour_key = f"{client_ip}:{endpoint}:hour"
    
    minute_ok, minute_count = await rate_limiter.check_rate_limit(
        minute_key, limits["per_minute"], 60
    )
    
    if not minute_ok:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Limit: {limits['per_minute']}/min",
            headers={
                "Retry-After": "60",
                "X-RateLimit-Limit": str(limits["per_minute"]),
                "X-RateLimit-Remaining": str(0),
                "X-RateLimit-Reset": str(60),
            },
        )
    
    hour_ok, hour_count = await rate_limiter.check_rate_limit(
        hour_key, limits["per_hour"], 3600
    )
    
    if not hour_ok:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Limit: {limits['per_hour']}/hour",
            headers={
                "Retry-After": "3600",
                "X-RateLimit-Limit": str(limits["per_hour"]),
                "X-RateLimit-Remaining": str(0),
                "X-RateLimit-Reset": str(3600),
            },
        )
    
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