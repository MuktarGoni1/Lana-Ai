# backend/main.py
"""
Simplified FastAPI application for Lana AI Backend.
"""

import logging

# FastAPI imports
from fastapi import FastAPI, Response  # type: ignore
import uuid
from fastapi.middleware.cors import CORSMiddleware  # type: ignore
from app.middleware.security_headers_middleware import SecurityHeadersMiddleware
from app.middleware.request_timing_middleware import RequestTimingMiddleware, get_metrics_snapshot
from app.settings import load_settings
from app.repositories.memory_cache_repository import MemoryCacheRepository

from app.api.routes.tts import router as tts_router
from app.api.router import api_router
from fastapi.responses import StreamingResponse  # type: ignore
import time
import json
import asyncio
import hashlib
try:
    from groq import Groq  # type: ignore
except Exception:
    Groq = None

# Import job worker manager
from app.jobs.worker_manager import start_job_workers, stop_job_workers

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title="Lana AI API",
    description="Backend API for Lana AI educational platform",
    version="1.0.0",
)

# Load settings for global config
settings = load_settings()
# Initialize shared cache and Groq client for structured lessons
_STRUCTURED_LESSON_CACHE = MemoryCacheRepository(default_ttl=1800)
_GROQ_CLIENT = Groq(api_key=settings.groq_api_key) if (Groq and settings.groq_api_key) else None
_INFLIGHT_LESSONS: dict[str, asyncio.Future] = {}

# Add CORS middleware
# Avoid invalid configuration: credentials + wildcard origins
_allow_origins = settings.cors_origins or ["*"]
_allow_credentials = True
if "*" in _allow_origins:
    # Starlette requires explicit origins when credentials are allowed
    _allow_credentials = False

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins,
    allow_credentials=_allow_credentials,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Add security headers middleware
app.add_middleware(SecurityHeadersMiddleware)
# Add request timing middleware
app.add_middleware(RequestTimingMiddleware)

# Root endpoint
@app.get("/", tags=["Root"]) 
async def root():
    """Simple root endpoint to confirm API is accessible."""
    return {"message": "Welcome to Lana AI API", "status": "online"}

# Startup event to initialize job workers
@app.on_event("startup")
async def startup_event():
    """Initialize job workers on startup."""
    try:
        await start_job_workers()
        logger.info("Job workers started successfully")
    except Exception as e:
        logger.error(f"Failed to start job workers: {e}")
        # Don't raise the exception to avoid crashing the application
        pass

# Shutdown event to stop job workers
@app.on_event("shutdown")
async def shutdown_event():
    """Stop job workers on shutdown."""
    try:
        await stop_job_workers()
        logger.info("Job workers stopped successfully")
    except Exception as e:
        logger.error(f"Error stopping job workers: {e}")
        pass

# Removed duplicate sample lesson endpoints; use `/api/lessons` router from app.api.routes.lessons
# Removed duplicate math solver sample; use `/api/math-solver/solve` route from app.api.routes.math_solver
# Include modular API routes under /api
# (only TTS for now to avoid pulling extra dependencies)
# app.include_router(tts_router, prefix="/api/tts")
app.include_router(api_router, prefix="/api")

from pydantic import BaseModel, Field, field_validator  # type: ignore
from typing import List, Optional


def sanitize_text(text: str) -> str:
    import re, html
    if not text:
        return ""
    text = html.escape(text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


class ClassificationItem(BaseModel):
    type: str
    description: str

    @field_validator("type", "description")
    def _san(cls, v):
        return sanitize_text(v)


class SectionItem(BaseModel):
    title: str
    content: str

    @field_validator("title", "content")
    def _san(cls, v):
        return sanitize_text(v)


class QuizItem(BaseModel):
    q: str  # Changed from 'question' to 'q' to match frontend expectations
    options: List[str]
    answer: str

    @field_validator("q", "answer")  # Changed from 'question' to 'q'
    def _san(cls, v):
        return sanitize_text(v)

    @field_validator("options")
    def _san_opts(cls, v):
        return [sanitize_text(o) for o in v]


class StructuredLessonRequest(BaseModel):
    topic: str
    age: Optional[int] = None

    @field_validator("topic")
    def _val_topic(cls, v):
        v = sanitize_text(v.strip())
        if len(v) < 2:
            raise ValueError("Topic too short")
        return v


class StructuredLessonResponse(BaseModel):
    id: Optional[str] = None
    introduction: Optional[str] = None
    classifications: List[ClassificationItem] = []
    sections: List[SectionItem]
    diagram: str = ""
    quiz: List[QuizItem]


async def _stub_lesson(topic: str) -> StructuredLessonResponse:
    intro = f"Let's learn about {topic} in a clear, friendly way."
    classifications = [ClassificationItem(type="Category", description=topic.title())]
    sections = [
        SectionItem(title="Overview", content=f"{topic} - key ideas and examples."),
        SectionItem(title="Details", content=f"Deeper look at {topic}."),
    ]
    quiz = [
        QuizItem(q=f"What is {topic}?", options=[f"A) A {topic} concept", f"B) A {topic} skill", f"C) A {topic} application", "D) All of the above"], answer="D) All of the above"),
    ]
    return StructuredLessonResponse(
        id=str(uuid.uuid4()),  # Generate a unique ID for the lesson
        introduction=intro,
        classifications=classifications,
        sections=sections,
        diagram="",
        quiz=quiz,
    )


async def _compute_structured_lesson(cache_key: str, topic: str, age: Optional[int]) -> tuple[StructuredLessonResponse, str]:
    if _GROQ_CLIENT is not None:
        raw_excerpt = ""  # Initialize raw_excerpt to ensure it's always available
        try:
            sys_prompt = (
                "You are a helpful tutor who produces a structured lesson as strict JSON. "
                "Return only JSON with keys: introduction (string), classifications (array of {type, description}), "
                "sections (array of {title, content}), diagram (string; ASCII or description), "
                "quiz (array of {question, options, answer}). For quiz questions, create 4 multiple choice questions with 4 options each. "
                "Make sure the questions test understanding of the topic and have clear correct answers. "
                "Keep language clear for the learner."
            )
            # Build prompt with optional age field
            user_prompt = {
                "topic": topic,
                "requirements": "Educational, concise, accurate, friendly."
            }
            if age is not None:
                user_prompt["age"] = str(age)  # Convert to string
            completion = _GROQ_CLIENT.chat.completions.create(
                model="llama-3.1-8b-instant",
                temperature=0.3,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": sys_prompt},
                    {"role": "user", "content": json.dumps(user_prompt)},
                ],
            )
            content = completion.choices[0].message.content
            raw_excerpt = (content or "")[:300]  # Update raw_excerpt with actual content
            # Parse JSON with robust normalization for string fields
            data = json.loads(content)

            def _to_str(val: Optional[object], default: str = "") -> str:
                try:
                    if isinstance(val, str):
                        return val
                    if isinstance(val, dict) and "text" in val:
                        t = val.get("text")
                        return t if isinstance(t, str) else default
                    if val is None:
                        return default
                    return str(val)
                except Exception:
                    return default

            intro_norm = _to_str(data.get("introduction"), default="")  # Changed from None to empty string
            diagram_norm = _to_str(data.get("diagram"), default="")

            # Keep list items strict; they already map to our pydantic models
            classifications = [ClassificationItem(**c) for c in data.get("classifications", [])]
            sections = [SectionItem(**s) for s in data.get("sections", [])]
            # Map question field to q for QuizItem compatibility
            quiz_data = data.get("quiz", [])
            quiz_items = []
            for q_item in quiz_data:
                # Create a copy and rename question to q
                quiz_item_copy = q_item.copy()
                if "question" in quiz_item_copy:
                    quiz_item_copy["q"] = quiz_item_copy.pop("question")
                quiz_items.append(QuizItem(**quiz_item_copy))
            quiz = quiz_items

            resp = StructuredLessonResponse(
                id=str(uuid.uuid4()),  # Generate a unique ID for the lesson
                introduction=intro_norm,
                classifications=classifications,
                sections=sections,
                diagram=diagram_norm,
                quiz=quiz,
            )
            if resp.sections:
                try:
                    await _STRUCTURED_LESSON_CACHE.set(cache_key, resp.model_dump(), namespace="lessons")
                except Exception:
                    pass
                return resp, "llm"
            return await _stub_lesson(topic), "stub"
        except Exception as e:
            # Include raw excerpt to aid troubleshooting and reduce persistent stub fallbacks
            try:
                logger.warning(f"Structured lesson LLM error: {e}. raw_excerpt={raw_excerpt}")
            except Exception:
                logger.warning(f"Structured lesson LLM error: {e}")
            return await _stub_lesson(topic), "stub"
    else:
        return await _stub_lesson(topic), "stub"

async def _get_or_compute_lesson(cache_key: str, topic: str, age: Optional[int]) -> tuple[StructuredLessonResponse, str]:
    fut = _INFLIGHT_LESSONS.get(cache_key)
    if fut and not fut.done():
        return await fut
    loop = asyncio.get_event_loop()
    fut = loop.create_future()
    _INFLIGHT_LESSONS[cache_key] = fut
    async def _run():
        try:
            result = await _compute_structured_lesson(cache_key, topic, age)
            fut.set_result(result)
        except Exception as e:
            logger.error(f"Structured lesson compute failed: {e}")
            fut.set_result((await _stub_lesson(topic), "stub"))
        finally:
            _INFLIGHT_LESSONS.pop(cache_key, None)
    asyncio.create_task(_run())
    return await fut


@app.on_event("startup")
async def warm_up_structured_lessons():
    """Warm the structured lesson pipeline to reduce first-request latency.

    If a Groq client is configured, this primes the model and cache by generating
    one small sample lesson. Otherwise, it seeds the in-memory cache with a stub.
    """
    try:
        sample_topics = ["warm-up sample"]
        sample_age = 10
        for t in sample_topics:
            cache_key = hashlib.md5(f"{t}|{sample_age}".encode()).hexdigest()[:16]
            await _get_or_compute_lesson(cache_key, t, sample_age)
        logger.info(
            "Structured lessons warm-up complete: topics=%d, llm=%s",
            len(sample_topics),
            "enabled" if _GROQ_CLIENT is not None else "disabled",
        )
    except Exception as e:
        logger.warning(f"Structured lessons warm-up error: {e}")


@app.post("/api/structured-lesson", response_model=StructuredLessonResponse, tags=["Lessons"]) 
async def create_structured_lesson(req: StructuredLessonRequest, response: Response):
    """Create a structured lesson from a topic and optional age constraints."""
    def _stub(topic: str) -> StructuredLessonResponse:
        intro = f"Let's learn about {topic} in a clear, friendly way."
        classifications = [ClassificationItem(type="Category", description=topic.title())]
        sections = [
            SectionItem(title="Overview", content=f"{topic} - key ideas and examples."),
            SectionItem(title="Details", content=f"Deeper look at {topic}."),
        ]
        quiz = [
            QuizItem(q=f"What is {topic}?", options=[f"A) A {topic} concept", f"B) A {topic} skill", f"C) A {topic} application", "D) All of the above"], answer="D) All of the above"),
        ]
        return StructuredLessonResponse(
            id=str(uuid.uuid4()),  # Generate a unique ID for the lesson
            introduction=intro,
            classifications=classifications,
            sections=sections,
            diagram="",
            quiz=quiz,
        )

    topic = req.topic
    age = req.age
    # Build cache key and try cache first
    cache_key = hashlib.md5(f"{topic}|{age}".encode()).hexdigest()[:16]
    try:
        cached = await _STRUCTURED_LESSON_CACHE.get(cache_key, namespace="lessons")
        if cached:
            response.headers["X-Content-Source"] = "cache"
            return StructuredLessonResponse(**cached)
    except Exception:
        pass

    # Compute with single-flight to avoid duplicate LLM calls
    lesson, src = await _get_or_compute_lesson(cache_key, topic, age)
    response.headers["X-Content-Source"] = src
    return lesson
class TTSRequest(BaseModel):
    text: str


class TTSResponse(BaseModel):
    message: str
    text: str
    audio_url: str


@app.post("/api/tts/synthesize_stub", response_model=TTSResponse, tags=["Text-to-Speech"]) 
async def synthesize_speech(req: TTSRequest):
    """Stub TTS endpoint demonstrating Pydantic request/response models."""
    return TTSResponse(
        message="TTS synthesis stub",
        text=req.text,
        audio_url="This would be a URL to the synthesized audio",
    )
    # History endpoints moved to app.api.routes.history

# Health endpoint for tests
@app.get("/health")
async def health():
    """Liveness probe for Render and tests."""
    return {"status": "ok"}

# Simple metrics endpoint for monitoring
@app.get("/api/metrics")
async def metrics():
    """Return basic per-path timing metrics collected in-process."""
    return {"paths": get_metrics_snapshot()}

@app.post("/api/cache/reset")
async def reset_cache(namespaces: Optional[list[str]] = None):
    """Reset in-memory caches to eliminate stale or hardcoded responses.

    - If `namespaces` provided, clears only those; otherwise clears all.
    - Targets the structured lesson cache; extendable for other caches if needed.
    """
    try:
        if namespaces:
            for ns in namespaces:
                try:
                    _STRUCTURED_LESSON_CACHE._caches.pop(ns, None)
                except Exception:
                    pass
        else:
            try:
                _STRUCTURED_LESSON_CACHE._caches.clear()
            except Exception:
                pass
        try:
            _STRUCTURED_LESSON_CACHE._stats["last_reset"] = time.time()
        except Exception:
            pass
        return {"ok": True, "namespaces": namespaces or "all"}
    except Exception as e:
        logger.warning(f"Cache reset error: {e}")
        return {"ok": False, "error": str(e)}
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, Query  # type: ignore
from pydantic import BaseModel  # type: ignore

from app.config import SUPABASE_URL, SUPABASE_KEY
from app.repositories.interfaces import IChatRepository
try:
    from app.repositories.supabase_chat_repository import SupabaseChatRepository
except Exception:
    SupabaseChatRepository = None  # Graceful if supabase SDK not installed


class InMemoryChatRepository(IChatRepository):
    """Simple in-memory chat repository for development fallback."""

    def __init__(self) -> None:
        self._store: Dict[str, List[Dict[str, Any]]] = {}

    async def append_message(self, sid: str, role: str, content: str) -> bool:
        if not sid:
            return False
        self._store.setdefault(sid, []).append(
            {
                "sid": sid,
                "role": role,
                "content": content,
                "created_at": "",
            }
        )
        return True

    async def get_history(self, sid: str, limit: int = 100) -> List[Dict[str, Any]]:
        messages = self._store.get(sid, [])
        return messages[:limit]



@app.post("/api/structured-lesson/stream", tags=["Lessons"])
async def stream_structured_lesson(req: StructuredLessonRequest):
    """Stream a structured lesson as a single SSE 'done' event for fast UI consumption."""
    try:
        topic = req.topic
        age = req.age
        cache_key = hashlib.md5(f"{topic}|{age}".encode()).hexdigest()[:16]
        source = "stub"
        # Try cache first
        try:
            cached = await _STRUCTURED_LESSON_CACHE.get(cache_key, namespace="lessons")
            if cached:
                lesson = StructuredLessonResponse(**cached)
                source = "cache"
            else:
                raise Exception("no-cache")
        except Exception:
            # Compute lesson using single-flight; fallback handled inside helper
            lesson, source = await _get_or_compute_lesson(cache_key, topic, age)
        async def event_generator():
            # Use model_dump for Pydantic v2 compatibility
            try:
                payload_lesson = lesson.model_dump()
            except Exception:
                payload_lesson = lesson.dict()
            payload = {"type": "done", "source": source, "lesson": payload_lesson}
            yield f"data: {json.dumps(payload)}\n\n"
        stream_resp = StreamingResponse(event_generator(), media_type="text/event-stream")
        try:
            stream_resp.headers["X-Content-Source"] = source
        except Exception:
            pass
        return stream_resp
    except Exception as e:
        err = {"type": "error", "message": str(e)}
        async def error_stream():
            yield f"data: {json.dumps(err)}\n\n"
        return StreamingResponse(error_stream(), media_type="text/event-stream")
