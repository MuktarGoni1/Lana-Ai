from typing import Any, Dict, List
from app.repositories.interfaces import IChatRepository


class NotFoundError(Exception):
    pass


class ForbiddenError(Exception):
    pass


def sanitize_text(text: str) -> str:
    import re
    if not text:
        return ""
    # Only escape the most dangerous HTML characters, preserve readable text
    # Instead of using html.escape() which encodes apostrophes as &#x27;
    # manually escape only <, >, & that could lead to XSS, preserve readable text characters
    text = text.replace("&", "&amp;")  # Must be first to avoid double-encoding
    text = text.replace("<", "&lt;")
    text = text.replace(">", "&gt;")
    # For quotes, only escape when they might be in dangerous contexts
    # For now, we'll still escape them but decode in frontend - more sophisticated approach would be context-aware
    text = text.replace("\"", "&quot;")
    text = text.replace("'", "&#x27;")
    text = re.sub(r"\s+", " ", text).strip()
    return text


class HistoryService:
    """Service layer for chat history operations.

    Enforces authorization checks (S-2), input sanitization (S-1), and returns
    normalized DTOs for API responses (A-3). All repository I/O is async (P-1).
    """

    def __init__(self, repo: IChatRepository) -> None:
        """Initialize with a repository abstraction (A-2)."""
        self.repo = repo

    async def get_history(self, user_id: str, sid: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Return chat history for a user-scoped session id.

        Raises ForbiddenError if the session doesn't belong to the user (S-2).
        """
        # Basic IDOR protection: session IDs must be namespaced by user
        if not sid.startswith(f"{user_id}:"):
            raise ForbiddenError("Session does not belong to user")
        msgs = await self.repo.get_history(sid, limit=limit)
        return [
            {
                "id": f"{m.get('sid','')}-{i}",
                "title": (m.get("content") or "").strip()[:48] or "(empty)",
                "timestamp": m.get("created_at") or "",
            }
            for i, m in enumerate(msgs)
        ]

    async def append_message(self, user_id: str, sid: str, role: str, content: str) -> bool:
        """Append a message to a session after role and ownership checks."""
        if role not in {"user", "assistant"}:
            raise ForbiddenError("Invalid role")
        if not sid.startswith(f"{user_id}:"):
            raise ForbiddenError("Session does not belong to user")
        content = sanitize_text(content)
        return await self.repo.append_message(sid, role, content)