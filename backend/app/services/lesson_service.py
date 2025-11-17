import uuid
from typing import List, Dict, Any, Optional

import logging
logger = logging.getLogger(__name__)
from app.repositories.interfaces import ICacheRepository, ILessonRepository


class LessonService:
    """Manages lesson generation and retrieval, utilizing caching and persistence."""

    def __init__(
        self, cache_repository: ICacheRepository, lesson_repository: ILessonRepository
    ):
        self.cache_repository = cache_repository
        self.lesson_repository = lesson_repository

    async def get_or_create_lesson(
        self,
        user_id: str,
        topic: str,
        difficulty: str,
        lesson_type: str,
        refresh_cache: bool = False,
    ) -> Dict[str, Any]:
        """Retrieves a lesson from cache or generates a new one."""
        cache_key = f"{user_id}:{topic}:{difficulty}:{lesson_type}"

        if not refresh_cache:
            cached_lesson = await self.cache_repository.get(
                cache_key, namespace="lessons"
            )
            if cached_lesson:
                logger.info(f"Lesson for {topic} ({lesson_type}) retrieved from cache.")
                return cached_lesson

        logger.info(f"Generating new lesson for {topic} ({lesson_type})...")
        # Generate a unique ID for the lesson
        lesson_id = str(uuid.uuid4())
        
        # Placeholder for actual lesson generation logic
        # This would involve calls to LLMs, TTS, etc.
        new_lesson = {
            "id": lesson_id,
            "topic": topic,
            "difficulty": difficulty,
            "type": lesson_type,
            "content": "This is a generated lesson about {topic}.",
            "quiz": [],
            "audio_url": "",
        }

        await self.cache_repository.set(cache_key, new_lesson, namespace="lessons")
        await self.lesson_repository.save_lesson_history(user_id, topic, new_lesson)

        return new_lesson

    async def get_user_lesson_history(
        self, user_id: str, limit: int = 50, offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Retrieves a user's lesson history."""
        return await self.lesson_repository.get_user_history(user_id, limit, offset)

    async def get_lesson_detail(self, lesson_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves the full detail of a specific lesson from history."""
        return await self.lesson_repository.get_lesson_by_id(lesson_id)

    async def delete_lesson(self, lesson_id: str) -> bool:
        """Deletes a lesson from history."""
        return await self.lesson_repository.delete_lesson_by_id(lesson_id)

    async def get_popular_topics(self, limit: int = 10) -> List[str]:
        """Retrieves a list of popular lesson topics."""
        return await self.lesson_repository.get_popular_topics(limit)
