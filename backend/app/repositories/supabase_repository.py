from typing import Any, Dict, List, Optional
from datetime import datetime

from supabase import create_client, Client
import orjson

import logging
from app.repositories.interfaces import ILessonRepository

logger = logging.getLogger(__name__)


class SupabaseRepository(ILessonRepository):
    """Supabase repository for lesson persistence (A-4: Vendor isolation)."""

    def __init__(self, url: str, anon_key: str):
        """Initialize Supabase client."""
        self.client: Client = create_client(url, anon_key)

    async def save_lesson_history(
        self, user_id: str, topic: str, lesson_data: Dict[str, Any]
    ) -> str:
        """Save lesson to history."""
        try:
            result = (
                self.client.table("searches")
                .insert(
                    {
                        "uid": user_id,
                        "title": topic,
                        "content": orjson.dumps(lesson_data).decode(),
                        "created_at": datetime.utcnow().isoformat(),
                    }
                )
                .execute()
            )
            return str(result.data[0]["id"]) if result.data else ""
        except Exception as e:
            logger.error(f"Failed to save lesson history: {e}")
            raise

    async def get_user_history(
        self, user_id: str, limit: int = 50, offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get user's lesson history (P-2: No N+1 queries)."""
        try:
            result = (
                self.client.table("searches")
                .select("id,title,created_at")
                .eq("uid", user_id)
                .order("created_at", desc=True)
                .limit(limit)
                .offset(offset)
                .execute()
            )
            return result.data
        except Exception as e:
            logger.error(f"Failed to retrieve user history: {e}")
            raise

    async def get_lesson_by_id(self, lesson_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific lesson by its ID."""
        try:
            result = (
                self.client.table("searches")
                .select("content")
                .eq("id", lesson_id)
                .single()
                .execute()
            )
            return orjson.loads(result.data["content"]) if result.data else None
        except Exception as e:
            logger.error(f"Failed to retrieve lesson by ID {lesson_id}: {e}")
            return None

    async def delete_lesson_by_id(self, lesson_id: str) -> bool:
        """Delete a specific lesson by its ID."""
        try:
            self.client.table("searches").delete().eq("id", lesson_id).execute()
            return True
        except Exception as e:
            logger.error(f"Failed to delete lesson by ID {lesson_id}: {e}")
            return False
