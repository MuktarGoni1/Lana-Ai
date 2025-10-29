from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional


class ICacheRepository(ABC):
    """Abstract cache repository interface."""

    @abstractmethod
    async def get(self, key: str, namespace: str = "default") -> Optional[Any]:
        """Retrieve value from cache."""
        pass

    @abstractmethod
    async def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None,
        namespace: str = "default",
    ) -> bool:
        """Store value in cache with optional TTL."""
        pass

    @abstractmethod
    async def delete(self, key: str, namespace: str = "default") -> bool:
        """Delete value from cache."""
        pass

    @abstractmethod
    async def exists(self, key: str, namespace: str = "default") -> bool:
        """Check if key exists in cache."""
        pass

    @abstractmethod
    async def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        pass


class ILessonRepository(ABC):
    """Abstract lesson repository interface."""

    @abstractmethod
    async def save_lesson_history(
        self, user_id: str, topic: str, lesson_data: Dict[str, Any]
    ) -> str:
        """Save lesson to history."""
        pass

    @abstractmethod
    async def get_user_history(
        self, user_id: str, limit: int = 50, offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get user's lesson history."""
        pass

    @abstractmethod
    async def get_popular_topics(self, limit: int = 10) -> List[str]:
        """Get most popular topics."""
        pass
