"""
db_job_worker.py — Multi-user concurrent lesson generation worker using PostgreSQL queue.

Architecture:
  - Polls the DB for queued jobs using claim_next_lesson_job() — an atomic
    SQL function that uses FOR UPDATE SKIP LOCKED, so multiple worker
    processes can run safely without double-processing any job.
  - Each claimed job runs through generate → write → complete in one
    try/except block. Any error is classified and written back to the DB.
  - Retryable errors (LLM timeout, rate limit, DB flap) re-queue the job
    up to max_retries. Non-retryable errors (invalid topic, unknown) fail
    the job permanently.
  - On startup, cleanup_stale_jobs() reclaims jobs from any previously
    crashed workers.

This worker replaces the Redis/BullMQ based worker for lesson generation,
providing better durability and atomicity guarantees.
"""

import os
import asyncio
import logging
from typing import Optional, Dict, Any
from datetime import datetime

from postgrest import APIError

from app.types.db_types import (
    LessonGenerationJob,
    JobErrorCode,
    LessonUnitUpsert,
    QuizQuestionsUpsert,
    Topic,
    Profile,
    UserLearningProfile,
    JobStatus,
    validate_columns,
)
from app.repositories.supabase_repository import SupabaseRepository
from app.services.lesson_service import LessonService
from app.repositories.memory_cache_repository import MemoryCacheRepository

logger = logging.getLogger(__name__)

# ─── Config ───────────────────────────────────────────────────────────────────

POLL_INTERVAL_MS = 3_000  # check for new jobs every 3 s
MAX_CONCURRENT_JOBS = 3  # max parallel generations per worker
STALE_JOB_THRESHOLD_MINUTES = 10

# Retry backoff in seconds: immediate, 5s, 15s, 30s
RETRY_BACKOFF_S = [0, 5, 15, 30]

# ─── Error Classes ───────────────────────────────────────────────────────────


class AppError(Exception):
    """Base class for all application errors with error codes."""

    def __init__(self, error_code: JobErrorCode, message: str, retryable: bool = False):
        super().__init__(message)
        self.error_code = error_code
        self.retryable = retryable


class LLMTimeoutError(AppError):
    def __init__(self, msg: str = "LLM request timed out after 60s"):
        super().__init__("LLM_TIMEOUT", msg, retryable=True)


class RateLimitError(AppError):
    def __init__(self):
        super().__init__("RATE_LIMITED", "Rate limited by Groq API", retryable=True)


class InvalidTopicError(AppError):
    def __init__(self, topic_id: str):
        super().__init__(
            "INVALID_TOPIC",
            f"Topic {topic_id} not found or access denied",
            retryable=False,
        )


class DBWriteError(AppError):
    def __init__(self, detail: str):
        super().__init__(
            "DB_WRITE_FAILED", f"DB write failed: {detail}", retryable=True
        )


class GroqError(AppError):
    def __init__(self, detail: str):
        super().__init__("GROQ_ERROR", f"Groq API error: {detail}", retryable=True)


def to_app_error(err: Exception) -> AppError:
    """Normalize any exception into an AppError."""
    if isinstance(err, AppError):
        return err
    return AppError("UNKNOWN", str(err), retryable=False)


# ─── DB Worker Class ──────────────────────────────────────────────────────────


class DBLessonWorker:
    """
    PostgreSQL-based lesson generation worker.

    Uses atomic job claiming via FOR UPDATE SKIP LOCKED to ensure
    multiple workers can run concurrently without race conditions.
    """

    def __init__(
        self, supabase_repo: SupabaseRepository, worker_id: Optional[str] = None
    ):
        self.repo = supabase_repo
        self.worker_id = worker_id or f"worker-{os.getpid()}"
        self.running = False
        self.active_jobs = 0
        self._shutdown_event = asyncio.Event()

        # Initialize lesson service
        cache = MemoryCacheRepository()
        self.lesson_service = LessonService(
            cache_repository=cache, lesson_repository=supabase_repo
        )

    async def start(self):
        """Start the worker loop."""
        logger.info(
            f"Worker starting: {self.worker_id}, max_concurrent={MAX_CONCURRENT_JOBS}"
        )
        self.running = True

        # Clean up stale jobs from any previously crashed workers
        await self._cleanup_stale_jobs()

        # Start cleanup loop (every 5 minutes)
        asyncio.create_task(self._cleanup_loop())

        # Start main poll loop
        while self.running and not self._shutdown_event.is_set():
            try:
                await self._worker_tick()
            except Exception as e:
                logger.error(f"Worker tick error: {e}")

            try:
                await asyncio.wait_for(
                    self._shutdown_event.wait(), timeout=POLL_INTERVAL_MS / 1000
                )
            except asyncio.TimeoutError:
                pass  # Normal poll interval

    async def stop(self, timeout_seconds: float = 90.0):
        """Graceful shutdown. Waits for active jobs to complete."""
        logger.info(
            f"Worker shutting down, waiting for {self.active_jobs} active jobs..."
        )
        self.running = False
        self._shutdown_event.set()

        # Wait for active jobs to finish
        deadline = asyncio.get_event_loop().time() + timeout_seconds
        while self.active_jobs > 0 and asyncio.get_event_loop().time() < deadline:
            await asyncio.sleep(0.5)

        if self.active_jobs > 0:
            logger.warning(f"Shutdown timeout: {self.active_jobs} jobs still active")
        else:
            logger.info("All jobs completed, worker stopped")

    async def _worker_tick(self):
        """Check for and claim next job if capacity available."""
        if self.active_jobs >= MAX_CONCURRENT_JOBS:
            return

        job = await self._claim_next_job()
        if not job:
            return  # Queue empty

        self.active_jobs += 1
        # Run in background so we can poll for more immediately
        asyncio.create_task(self._process_job_wrapper(job))

    async def _process_job_wrapper(self, job: LessonGenerationJob):
        """Wrapper to handle job completion and decrement active count."""
        try:
            await self._process_job(job)
        finally:
            self.active_jobs -= 1

    async def _claim_next_job(self) -> Optional[LessonGenerationJob]:
        """Atomically claim the next queued job for this worker."""
        try:
            result = self.repo.supabase.rpc(
                "claim_next_lesson_job", {"p_worker_id": self.worker_id}
            ).execute()

            rows = result.data if result.data else []
            if not rows:
                return None

            # Fetch full job record
            job_data = rows[0]
            job_result = (
                self.repo.supabase.table("lesson_generation_jobs")
                .select("*")
                .eq("id", job_data["id"])
                .single()
                .execute()
            )

            if job_result.data:
                return LessonGenerationJob.from_dict(job_result.data)
            return None

        except Exception as e:
            logger.error(f"Failed to claim job: {e}")
            return None

    async def _cleanup_stale_jobs(self) -> int:
        """Reclaim jobs from crashed workers."""
        try:
            result = self.repo.supabase.rpc("cleanup_stale_jobs").execute()
            count = result.data if isinstance(result.data, int) else 0
            if count > 0:
                logger.info(f"Reclaimed {count} stale jobs")
            return count
        except Exception as e:
            logger.warning(f"Stale job cleanup failed: {e}")
            return 0

    async def _cleanup_loop(self):
        """Run cleanup every 5 minutes."""
        while self.running:
            await asyncio.sleep(5 * 60)  # 5 minutes
            if self.running:
                await self._cleanup_stale_jobs()

    async def _process_job(self, job: LessonGenerationJob):
        """Process a single lesson generation job."""
        start_time = datetime.now()
        logger.info(f"Job started: {job.id}, topic={job.topic_id}, user={job.user_id}")

        try:
            # 1. Fetch topic details
            topic = await self._fetch_topic(job.topic_id)

            # 2. Fetch user context
            profile, learning_profile = await self._fetch_user_context(job.user_id)

            # 3. Mark topic in_progress
            await self._mark_topic_in_progress(job.topic_id)

            # 4. Generate lesson content (calls Groq)
            lesson_data = await self._generate_lesson(topic, profile, learning_profile)

            now = datetime.now().isoformat()

            # 5. Write lesson_units — ONLY columns that exist in the schema
            await self._write_lesson_unit(
                {
                    "topic_id": job.topic_id,
                    "lesson_content": lesson_data["lesson_content"],
                    "is_ready": True,
                    "generated_at": now,
                    "refreshed_at": now,
                }
            )

            # 6. Write quiz_questions — ONLY columns that exist in the schema
            await self._write_quiz_questions(
                {
                    "topic_id": job.topic_id,
                    "questions": lesson_data["questions"],
                    "generated_at": now,
                }
            )

            # 7. Mark job completed
            await self._update_job(
                job.id,
                {
                    "status": "completed",
                    "completed_at": now,
                    "worker_id": None,
                    "locked_at": None,
                },
            )

            elapsed = (datetime.now() - start_time).total_seconds()
            logger.info(f"Job completed: {job.id}, elapsed={elapsed:.2f}s")

        except Exception as e:
            elapsed = (datetime.now() - start_time).total_seconds()
            app_err = to_app_error(e)

            logger.error(
                f"Job failed: {job.id}, error={app_err.error_code}, retryable={app_err.retryable}, elapsed={elapsed:.2f}s"
            )

            # Determine retry fate
            can_retry = app_err.retryable and job.attempts < job.max_retries

            await self._update_job(
                job.id,
                {
                    "status": "queued" if can_retry else "failed",
                    "error": app_err.error_code,
                    "error_code": app_err.error_code,
                    "completed_at": None if can_retry else datetime.now().isoformat(),
                    "worker_id": None,
                    "locked_at": None,
                },
            )

            if can_retry:
                logger.info(
                    f"Job re-queued for retry: {job.id}, attempt={job.attempts + 1}/{job.max_retries}"
                )

    async def _fetch_topic(self, topic_id: str) -> Topic:
        """Fetch topic details. Raises InvalidTopicError if not found."""
        try:
            validate_columns("lesson_units", ["id", "title", "subject_name"])
            result = (
                self.repo.supabase.table("topics")
                .select("id, title, subject_name")
                .eq("id", topic_id)
                .single()
                .execute()
            )

            if not result.data:
                raise InvalidTopicError(topic_id)

            return Topic.from_dict(result.data)
        except APIError:
            raise InvalidTopicError(topic_id)

    async def _fetch_user_context(
        self, user_id: str
    ) -> tuple[Profile, Optional[UserLearningProfile]]:
        """Fetch profile and learning profile for a user."""
        # Fetch both in parallel
        profile_task = (
            self.repo.supabase.table("profiles")
            .select("age, grade")
            .eq("id", user_id)
            .single()
            .execute()
        )

        ulp_task = (
            self.repo.supabase.table("user_learning_profiles")
            .select("learning_profile")
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )

        profile_result = (
            await profile_task
            if asyncio.iscoroutine(profile_result := profile_task)
            else profile_task
        )
        ulp_result = (
            await ulp_task if asyncio.iscoroutine(ulp_result := ulp_task) else ulp_task
        )

        profile_data = profile_result.data or {"age": None, "grade": None}
        profile = Profile.from_dict({"id": user_id, **profile_data})

        ulp = None
        if ulp_result.data:
            ulp = UserLearningProfile.from_dict({"user_id": user_id, **ulp_result.data})

        return profile, ulp

    async def _mark_topic_in_progress(self, topic_id: str):
        """Flip the topic status to in_progress."""
        try:
            self.repo.supabase.table("topics").update(
                {"status": "in_progress", "updated_at": datetime.now().isoformat()}
            ).eq("id", topic_id).in_("status", ["available", "locked"]).execute()
        except Exception as e:
            logger.warning(f"Failed to mark topic in_progress: {e}")

    async def _generate_lesson(
        self,
        topic: Topic,
        profile: Profile,
        learning_profile: Optional[UserLearningProfile],
    ) -> Dict[str, Any]:
        """Generate lesson content and quiz via LessonService."""
        # Extract preferences
        prefs = (
            learning_profile.learning_profile.learner_preferences
            if learning_profile and learning_profile.learning_profile
            else None
        )
        knowledge_level = prefs.knowledge_level if prefs else "intermediate"
        age = prefs.age if prefs else (profile.age or 12)

        # Generate lesson using existing service
        lesson, source = await self.lesson_service.generate_structured_lesson(
            topic=topic.title,
            age=age,
            groq_client=None,  # Will use service's internal client
            mode=knowledge_level,
        )

        # Parse and validate the response
        if not lesson:
            raise GroqError("Empty lesson response")

        # Extract content from lesson format
        lesson_content = {
            "introduction": lesson.get("introduction", ""),
            "classifications": lesson.get("classifications", []),
            "sections": lesson.get("sections", []),
            "diagram": lesson.get("diagram", ""),
        }
        questions = lesson.get("quiz", [])

        return {
            "lesson_content": lesson_content,
            "questions": questions,
        }

    async def _write_lesson_unit(self, upsert: LessonUnitUpsert):
        """Write lesson_units row (upsert by topic_id)."""
        # Validate no phantom columns
        valid_keys = {
            "topic_id",
            "lesson_content",
            "is_ready",
            "generated_at",
            "refreshed_at",
        }
        filtered = {k: v for k, v in upsert.items() if k in valid_keys}

        try:
            result = (
                self.repo.supabase.table("lesson_units")
                .upsert(filtered, on_conflict="topic_id")
                .execute()
            )

            if hasattr(result, "error") and result.error:
                raise DBWriteError(str(result.error))
        except Exception as e:
            raise DBWriteError(str(e))

    async def _write_quiz_questions(self, upsert: QuizQuestionsUpsert):
        """Write quiz_questions row (upsert by topic_id)."""
        # Validate no phantom columns
        valid_keys = {"topic_id", "questions", "generated_at"}
        filtered = {k: v for k, v in upsert.items() if k in valid_keys}

        try:
            result = (
                self.repo.supabase.table("quiz_questions")
                .upsert(filtered, on_conflict="topic_id")
                .execute()
            )

            if hasattr(result, "error") and result.error:
                raise DBWriteError(str(result.error))
        except Exception as e:
            raise DBWriteError(str(e))

    async def _update_job(self, job_id: str, update: Dict[str, Any]):
        """Write a job status update to the DB."""
        # Add updated_at automatically
        update["updated_at"] = datetime.now().isoformat()

        # Remove None values to avoid overwriting with null
        filtered = {k: v for k, v in update.items() if v is not None}

        try:
            self.repo.supabase.table("lesson_generation_jobs").update(filtered).eq(
                "id", job_id
            ).execute()
        except Exception as e:
            logger.error(f"Failed to update job {job_id}: {e}")


# ─── Global Worker Instance ───────────────────────────────────────────────────

_worker_instance: Optional[DBLessonWorker] = None


async def start_db_worker(
    supabase_repo: SupabaseRepository, worker_id: Optional[str] = None
):
    """Start the DB-based lesson worker."""
    global _worker_instance
    _worker_instance = DBLessonWorker(supabase_repo, worker_id)
    await _worker_instance.start()


async def stop_db_worker(timeout_seconds: float = 90.0):
    """Stop the DB-based lesson worker."""
    global _worker_instance
    if _worker_instance:
        await _worker_instance.stop(timeout_seconds)
        _worker_instance = None
