import os
import base64
import io
import logging
import wave
import hashlib
import asyncio
from typing import Optional

# Import Google GenAI SDK with proper error handling
# Using try/except ImportError to handle cases where the package is not installed
GOOGLE_GENAI_AVAILABLE = False
try:
    # Standard import pattern that works with basedpyright
    import google.genai as genai
    import google.genai.types as genai_types
    GOOGLE_GENAI_AVAILABLE = True
except (ImportError, ModuleNotFoundError):
    # Fallback definitions for when the package is not available
    genai = None
    genai_types = None

from app.repositories.interfaces import ICacheRepository
from app.config import TTS_MODEL, TTS_SAMPLE_RATE, TTS_CONCURRENT_LIMIT, TTS_CACHE_TTL
from app.jobs.queue_config import get_tts_queue

logger = logging.getLogger(__name__)


class _InMemoryCache(ICacheRepository):
    def __init__(self):
        self._store = {}
        self._stats = {"hits": 0, "misses": 0}

    async def get(self, key: str, namespace: str = "default"):
        val = self._store.get((namespace, key))
        if val is None:
            self._stats["misses"] += 1
        else:
            self._stats["hits"] += 1
        return val

    async def set(self, key: str, value, ttl: Optional[int] = None, namespace: str = "default"):
        self._store[(namespace, key)] = value
        return True

    async def delete(self, key: str, namespace: str = "default"):
        return bool(self._store.pop((namespace, key), None))

    async def exists(self, key: str, namespace: str = "default"):
        return (namespace, key) in self._store

    async def get_stats(self):
        return dict(self._stats)


class TTSService:
    """Text-to-speech service using Google's Gemini TTS when available, with WAV fallback."""

    def __init__(self, cache_repo: Optional[ICacheRepository] = None, gemini_client=None):
        self.cache_repo = cache_repo or _InMemoryCache()
        self.gemini_client = gemini_client or self._init_gemini()
        # Add concurrent request limiting
        self._semaphore = asyncio.Semaphore(TTS_CONCURRENT_LIMIT)
        # Pre-warm common phrases cache (but only in actual application context)
        if not os.getenv("TESTING_MODE"):
            self._prewarm_cache()

    def _init_gemini(self):
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            logger.warning("Google API key missing; TTS will use fallback.")
            return None
        if not GOOGLE_GENAI_AVAILABLE or genai is None:
            logger.warning("Google GenAI SDK not installed; TTS will use fallback.")
            return None
        try:
            return genai.Client(api_key=api_key)
        except Exception as e:
            logger.error(f"Failed to init Gemini client: {e}")
            return None

    def _prewarm_cache(self):
        """Pre-warm cache with common phrases to reduce initial latency."""
        # Disable pre-warming for now to avoid startup issues
        pass

    async def _prewarm_common_phrases(self):
        """Pre-generate audio for common phrases."""
        try:
            common_phrases = [
                "Welcome to Lana AI",
                "Let's learn together",
                "Great job!",
                "Try again",
                "Well done",
                "Correct answer",
                "Let me explain"
            ]
            for phrase in common_phrases:
                # Generate with default voice
                try:
                    await self.generate_speech(phrase, "leda")
                except Exception:
                    pass  # Ignore errors during pre-warming
        except Exception:
            pass  # Ignore any pre-warming errors

    async def synthesize(self, text: str, voice_name: str = "leda") -> str:
        """Generate base64-encoded audio from text for API response."""
        audio_bytes = await self.generate_speech(text, voice_name)
        return base64.b64encode(audio_bytes).decode("utf-8")

    async def create_tts_job(self, text: str, voice_name: str = "leda"):
        """Create a TTS generation job and return the job ID."""
        tts_queue = get_tts_queue()
        
        job_data = {
            "text": text,
            "voice_name": voice_name
        }
        
        job = await tts_queue.add("tts-generation", job_data)
        return job.id

    async def generate_speech(self, text: str, voice_name: str = "leda") -> bytes:
        """Generate speech from text; uses cache, Gemini TTS, and WAV fallback."""
        # Use semaphore to limit concurrent requests
        async with self._semaphore:
            # Normalize and default voice name
            voice_name = (voice_name or "leda")
            # Cache key
            cache_key = hashlib.md5(f"{text}:{voice_name}".encode()).hexdigest()[:16]
            cached_audio = await self.cache_repo.get(cache_key, namespace="tts")
            if cached_audio:
                logger.info("TTS cache hit")
                return cached_audio

            # Try Gemini TTS with optimized settings
            if (self.gemini_client and GOOGLE_GENAI_AVAILABLE and 
                genai_types is not None):
                try:
                    # Use optimized model and configuration for faster response
                    response = self.gemini_client.models.generate_content(
                        model=TTS_MODEL,  # Configurable model
                        contents=text,
                        config=genai_types.GenerateContentConfig(
                            response_modalities=["AUDIO"],
                            speech_config=genai_types.SpeechConfig(
                                voice_config=genai_types.VoiceConfig(
                                    prebuilt_voice_config=genai_types.PrebuiltVoiceConfig(
                                        voice_name=voice_name,
                                    )
                                )
                            ),
                        )
                    )
                    parts = response.candidates[0].content.parts
                    pcm = parts[0].inline_data.data
                    if isinstance(pcm, str):
                        pcm = base64.b64decode(pcm)
                    # Build WAV from PCM with optimized settings
                    buf = io.BytesIO()
                    with wave.open(buf, "wb") as wf:
                        wf.setnchannels(1)
                        wf.setsampwidth(2)
                        wf.setframerate(TTS_SAMPLE_RATE)  # Configurable sample rate
                        wf.writeframes(pcm)
                    audio_data = buf.getvalue()
                    # Cache with longer TTL for better reuse
                    await self.cache_repo.set(cache_key, audio_data, ttl=TTS_CACHE_TTL, namespace="tts")
                    return audio_data
                except Exception as e:
                    logger.error(f"Gemini TTS error: {e}")
                    # Re-raise the exception to signal failure instead of silent fallback
                    raise RuntimeError(f"TTS generation failed: {str(e)}") from e

            # If we reach here, TTS service is not properly configured
            logger.error("TTS service not properly configured - no Gemini client available")
            raise RuntimeError("Text-to-speech service is currently unavailable. Please check system configuration.")