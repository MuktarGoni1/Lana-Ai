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
    async def get_lesson_by_id(self, lesson_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific lesson by ID."""
        pass

    @abstractmethod
    async def delete_lesson_by_id(self, lesson_id: str) -> bool:
        """Delete a lesson by ID."""
        pass

    @abstractmethod
    async def get_popular_topics(self, limit: int = 10) -> List[str]:
        """Get most popular topics."""
        pass


class IChatRepository(ABC):
    """Abstract chat repository interface for storing conversation history."""

    @abstractmethod
    async def append_message(self, sid: str, role: str, content: str) -> bool:
        """Append a message to a chat session."""
        pass

    @abstractmethod
    async def get_history(self, sid: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Retrieve ordered chat history for a session."""
        pass
