"""
Quick answer compatibility API routes.
"""
from typing import Optional
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .chat import quick_answer_handler

logger = logging.getLogger(__name__)

router = APIRouter()


class QuickGenerateRequest(BaseModel):
    topic: str
    age: Optional[int] = None
    user_id: Optional[str] = None


@router.post("/generate")
async def quick_generate(request: QuickGenerateRequest):
    """Generate a concise quick answer.

    This endpoint exists as a compatibility alias for frontend callers that use
    /api/quick/generate.
    """
    topic = (request.topic or "").strip()
    if not topic:
        raise HTTPException(status_code=400, detail="Topic is required")

    try:
        try:
            from main import _GROQ_CLIENT
        except Exception:
            _GROQ_CLIENT = None

        reply, _ = await quick_answer_handler(
            topic,
            request.age,
            _GROQ_CLIENT,
            request.user_id or "default_user",
        )

        return {
            "mode": "quick",
            "introduction": reply,
            "reply": reply,
            "quiz": None,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in quick_generate: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

