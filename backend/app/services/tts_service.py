import os
import base64
import io
import logging
import wave
import hashlib
from typing import Optional

try:
    from google import genai
    from google.genai import types
except Exception:
    genai = None
    types = None

from app.repositories.interfaces import ICacheRepository

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

    def _init_gemini(self):
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            logger.warning("Google API key missing; TTS will use fallback.")
            return None
        if genai is None:
            logger.warning("Google GenAI SDK not installed; TTS will use fallback.")
            return None
        try:
            return genai.Client(api_key=api_key)
        except Exception as e:
            logger.error(f"Failed to init Gemini client: {e}")
            return None

    async def synthesize(self, text: str, voice_name: str = "leda") -> str:
        """Generate base64-encoded audio from text for API response."""
        audio_bytes = await self.generate_speech(text, voice_name)
        return base64.b64encode(audio_bytes).decode("utf-8")

    async def generate_speech(self, text: str, voice_name: str = "leda") -> bytes:
        """Generate speech from text; uses cache, Gemini TTS, and WAV fallback."""
        # Normalize and default voice name
        voice_name = (voice_name or "leda")
        # Cache key
        cache_key = hashlib.md5(f"{text}:{voice_name}".encode()).hexdigest()[:16]
        cached_audio = await self.cache_repo.get(cache_key, namespace="tts")
        if cached_audio:
            logger.info("TTS cache hit")
            return cached_audio

        # Try Gemini TTS
        if self.gemini_client and types is not None:
            try:
                response = self.gemini_client.models.generate_content(
                    model="gemini-2.5-flash-preview-tts",
                    contents=text,
                    config=types.GenerateContentConfig(
                        response_modalities=["AUDIO"],
                        speech_config=types.SpeechConfig(
                            voice_config=types.VoiceConfig(
                                prebuilt_voice_config=types.PrebuiltVoiceConfig(
                                    voice_name=voice_name,
                                )
                            )
                        ),
                    ),
                )
                parts = response.candidates[0].content.parts
                pcm = parts[0].inline_data.data
                if isinstance(pcm, str):
                    pcm = base64.b64decode(pcm)
                # Build WAV from PCM
                buf = io.BytesIO()
                with wave.open(buf, "wb") as wf:
                    wf.setnchannels(1)
                    wf.setsampwidth(2)
                    wf.setframerate(24000)
                    wf.writeframes(pcm)
                audio_data = buf.getvalue()
                await self.cache_repo.set(cache_key, audio_data, namespace="tts")
                return audio_data
            except Exception as e:
                logger.error(f"Gemini TTS error: {e}")
                # Re-raise the exception to signal failure instead of silent fallback
                raise RuntimeError(f"TTS generation failed: {str(e)}") from e

        # If we reach here, TTS service is not properly configured
        logger.error("TTS service not properly configured - no Gemini client available")
        raise RuntimeError("Text-to-speech service is currently unavailable. Please check system configuration.")
