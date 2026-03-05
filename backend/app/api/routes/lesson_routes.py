"""
lesson_routes.py — Unified lesson generation API endpoints.

GET /api/lessons/status — Returns job state + content in one response.
    The frontend should poll this every 3-5 seconds until status is 'ready'.

POST /api/lessons/generate — Enqueues a lesson generation job.
    Idempotent: if a job already exists and is still active, returns its current status.

These endpoints replace the broken pattern of querying lesson_units directly
and getting empty responses before generation completes.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
import logging

from app.api.dependencies.auth import get_current_user, CurrentUser
from app.repositories.supabase_repository import SupabaseRepository
from app.types.db_types import (
    validate_columns,
    LessonGenerationJob,
    LessonUnit,
    QuizQuestionsRow,
    get_lesson_unit_columns,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/lessons", tags=["lessons"])

# ─── Pydantic Models ─────────────────────────────────────────────────────────


class GenerateLessonRequest(BaseModel):
    topic_id: str = Field(..., description="The topic ID to generate a lesson for")


class GenerateLessonResponse(BaseModel):
    job_id: str
    status: str  # 'queued', 'processing', 'completed'
    message: str


class LessonStatusResponse(BaseModel):
    """Unified response for lesson status polling."""

    topic_id: str
    job_status: str  # 'queued', 'processing', 'completed', 'failed', 'none'
    is_ready: bool  # true only when lesson_content AND quiz exist
    error: Optional[str] = None
    error_code: Optional[str] = None
    attempts: int = 0
    # Populated only when is_ready = true:
    lesson_content: Optional[Dict[str, Any]] = None
    questions: Optional[List[Dict[str, Any]]] = None
    video_ready: Optional[bool] = None
    audio_ready: Optional[bool] = None
    video_url: Optional[str] = None
    audio_url: Optional[str] = None


# ─── Dependencies ────────────────────────────────────────────────────────────


def get_supabase_repo() -> SupabaseRepository:
    """Get Supabase repository instance."""
    from app.config import SUPABASE_URL, SUPABASE_KEY

    if not SUPABASE_URL or not SUPABASE_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not configured",
        )
    return SupabaseRepository(SUPABASE_URL, SUPABASE_KEY)


# ─── POST /api/lessons/generate ──────────────────────────────────────────────


@router.post("/generate", response_model=GenerateLessonResponse)
async def generate_lesson(
    request: GenerateLessonRequest,
    current_user: CurrentUser = Depends(get_current_user),
    repo: SupabaseRepository = Depends(get_supabase_repo),
):
    """
    Enqueue a lesson generation job for a topic.

    Idempotent: if a job already exists and is still active,
    returns its current status without creating a duplicate.
    """
    topic_id = request.topic_id
    user_id = str(current_user.id)

    # ── 1. Verify topic exists and belongs to this user ────────────────────
    topic_result = (
        repo.supabase.table("topics")
        .select("id, status, user_id")
        .eq("id", topic_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )

    if not topic_result.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Topic not found or access denied",
        )

    topic = topic_result.data
    if topic.get("status") == "locked":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Topic is locked and cannot be generated yet",
        )

    # ── 2. Check if an active job already exists ──────────────────────────
    existing_result = (
        repo.supabase.table("lesson_generation_jobs")
        .select("id, status")
        .eq("topic_id", topic_id)
        .eq("user_id", user_id)
        .in_("status", ["queued", "processing", "completed"])
        .order("created_at", desc=True)
        .limit(1)
        .maybe_single()
        .execute()
    )

    if existing_result.data:
        job = existing_result.data
        job_status = job.get("status")

        if job_status == "completed":
            return GenerateLessonResponse(
                job_id=str(job["id"]),
                status="completed",
                message="Lesson already generated",
            )

        return GenerateLessonResponse(
            job_id=str(job["id"]),
            status=job_status,
            message="Generation already in progress",
        )

    # ── 3. Create a new job ────────────────────────────────────────────────
    # ONLY insert the columns that actually exist on the table.
    # This is the fix for the 400 error: we previously sent video_status,
    # video_job_id, video_progress — none of which exist in the schema.
    try:
        insert_result = (
            repo.supabase.table("lesson_generation_jobs")
            .insert(
                {
                    "user_id": user_id,
                    "topic_id": topic_id,
                    # status, attempts, max_retries all have DB defaults
                }
            )
            .select("id, status")
            .single()
            .execute()
        )

        if not insert_result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to queue lesson generation",
            )

        new_job = insert_result.data
        logger.info(f"Job queued: {new_job['id']}, topic={topic_id}, user={user_id}")

        return GenerateLessonResponse(
            job_id=str(new_job["id"]),
            status="queued",
            message="Lesson generation queued",
        )

    except Exception as e:
        logger.error(
            f"Failed to create generation job: {e}, user={user_id}, topic={topic_id}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to queue lesson generation",
        )


# ─── GET /api/lessons/status ─────────────────────────────────────────────────


@router.get("/status", response_model=LessonStatusResponse)
async def lesson_status(
    topic_id: str = Query(..., description="The topic ID to check status for"),
    current_user: CurrentUser = Depends(get_current_user),
    repo: SupabaseRepository = Depends(get_supabase_repo),
):
    """
    Get the full generation state for a topic in one response.

    The frontend should poll this every 3-5 seconds until status is
    'ready' or 'failed'. This replaces the broken pattern of querying
    lesson_units directly and getting an empty array.
    """
    user_id = str(current_user.id)

    try:
        # ── 1. Latest job for this topic ──────────────────────────────────────
        job_result = (
            repo.supabase.table("lesson_generation_jobs")
            .select("id, status, error, error_code, attempts")
            .eq("topic_id", topic_id)
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(1)
            .maybe_single()
            .execute()
        )

        job = job_result.data

        # ── 2. Lesson unit — only fetch the columns that exist ─────────────────
        # ⚠️  DO NOT add video_status, video_job_id, video_progress here.
        #     Those columns do not exist. See app/types/db_types.py for the schema.
        valid_columns = [
            "is_ready",
            "lesson_content",
            "video_ready",
            "audio_ready",
            "video_url",
            "audio_url",
        ]

        unit_result = (
            repo.supabase.table("lesson_units")
            .select(",".join(valid_columns))
            .eq("topic_id", topic_id)
            .maybe_single()
            .execute()
        )

        unit = unit_result.data

        # ── 3. Quiz questions ─────────────────────────────────────────────────
        quiz_result = (
            repo.supabase.table("quiz_questions")
            .select("questions")
            .eq("topic_id", topic_id)
            .maybe_single()
            .execute()
        )

        quiz = quiz_result.data

        # ── 4. Build unified response ─────────────────────────────────────────
        is_ready = (
            unit
            and unit.get("is_ready") == True
            and unit.get("lesson_content")
            and quiz
            and quiz.get("questions")
        )

        response = LessonStatusResponse(
            topic_id=topic_id,
            job_status=job.get("status") if job else "none",
            is_ready=bool(is_ready),
            error=job.get("error") if job else None,
            error_code=job.get("error_code") if job else None,
            attempts=job.get("attempts", 0) if job else 0,
        )

        if is_ready:
            response.lesson_content = unit.get("lesson_content")
            response.questions = quiz.get("questions")
            response.video_ready = unit.get("video_ready")
            response.audio_ready = unit.get("audio_ready")
            response.video_url = unit.get("video_url")
            response.audio_url = unit.get("audio_url")

        return response

    except Exception as e:
        logger.error(
            f"Unexpected error in lesson_status: {e}, topic={topic_id}, user={user_id}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )
