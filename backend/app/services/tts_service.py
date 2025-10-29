import base64
import io
import wave
from typing import Optional

import genai
from genai.schemas import GenerateContentConfig as types
from loguru import logger

from app.repositories.interfaces import ICacheRepository


class TTSService:
    """Text-to-speech service."""

    def __init__(self, cache_repo: ICacheRepository, gemini_client: genai.Client):
        """Initialize TTS service."""
        self.cache_repo = cache_repo
        self.gemini_client = gemini_client

    async def generate_speech(self, text: str, voice_name: str = "Leda") -> bytes:
        """Generate speech from text (P-1: Async by Default)."""
        # Check cache
        cache_key = hashlib.md5(f"{text}:{voice_name}".encode()).hexdigest()[:16]
        cached_audio = await self.cache_repo.get(cache_key, namespace="tts")

        if cached_audio:
            logger.info(f"TTS cache hit")
            return cached_audio

        # Generate TTS
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

            # Create WAV
            buf = io.BytesIO()
            with wave.open(buf, "wb") as wf:
                wf.setnchannels(1)
                wf.setsampwidth(2)
                wf.setframerate(24000)
                wf.writeframes(pcm)

            audio_data = buf.getvalue()

            # Cache it
            await self.cache_repo.set(cache_key, audio_data, namespace="tts")

            return audio_data

        except Exception as e:
            logger.error(f"Error generating speech: {e}")
            raise
