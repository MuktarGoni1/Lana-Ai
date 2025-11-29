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

# Redis availability check
try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

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

# Log API key status for debugging
if settings.groq_api_key:
    logger.info(f"Groq API key loaded (length: {len(settings.groq_api_key)})")
else:
    logger.warning("No Groq API key found - LLM features will use fallback responses")

# Initialize shared cache and Groq client for structured lessons
_STRUCTURED_LESSON_CACHE = MemoryCacheRepository(default_ttl=1800)
_GROQ_CLIENT = None
if Groq and settings.groq_api_key:
    try:
        _GROQ_CLIENT = Groq(api_key=settings.groq_api_key)
        logger.info("Groq client initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Groq client: {e}")
        _GROQ_CLIENT = None
else:
    if not Groq:
        logger.warning("Groq library not available")
    if not settings.groq_api_key:
        logger.warning("No Groq API key provided")

_INFLIGHT_LESSONS: dict[str, asyncio.Future] = {}

# Add CORS middleware
# Use secure CORS configuration
_allow_origins = settings.cors_origins or ["http://localhost:3000", "http://localhost:3001", "https://lana-ai.onrender.com"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS", "PUT", "DELETE"],
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

app.include_router(api_router, prefix="/api")

from pydantic import BaseModel, Field, field_validator  # type: ignore
from typing import List, Optional


def sanitize_text(text: str) -> str:
    import re, html
    if not text:
        return ""
    # Escape HTML entities
    text = html.escape(text)
    # Remove any script tags and other potentially dangerous content
    text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r'<iframe[^>]*>.*?</iframe>', '', text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r'<object[^>]*>.*?</object>', '', text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r'<embed[^>]*>.*?</embed>', '', text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r'javascript:', '', text, flags=re.IGNORECASE)
    text = re.sub(r'vbscript:', '', text, flags=re.IGNORECASE)
    text = re.sub(r'onload=', '', text, flags=re.IGNORECASE)
    text = re.sub(r'onerror=', '', text, flags=re.IGNORECASE)
    # Normalize whitespace
    text = re.sub(r"\s+", " ", text).strip()
    # Limit length to prevent abuse
    return text[:1000]


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
        if len(v) > 100:
            raise ValueError("Topic too long")
        # Prevent injection attempts
        if any(char in v for char in ['<', '>', '&lt;', '&gt;', 'script', 'javascript']):
            raise ValueError("Invalid characters in topic")
        return v

    @field_validator("age")
    def _val_age(cls, v):
        if v is not None and (v < 1 or v > 100):
            raise ValueError("Age must be between 1 and 100")
        return v


class StructuredLessonResponse(BaseModel):
    id: Optional[str] = None
    introduction: Optional[str] = None
    classifications: List[ClassificationItem] = []
    sections: List[SectionItem]
    diagram: str = ""
    quiz: List[QuizItem]


async def _stub_lesson(topic: str, age: Optional[int] = None) -> StructuredLessonResponse:
    # Create age-appropriate introduction
    age_str = ""
    if age is not None:
        if age <= 2:
            age_str = "in a simple, fun way"
        elif age <= 5:
            age_str = "in a clear, friendly way"
        elif age <= 12:
            age_str = "in an engaging way"
        elif age <= 18:
            age_str = "in a detailed way"
        else:
            age_str = "in depth"
    
    intro = f"Let's learn about {topic} {age_str}!"
    classifications = [ClassificationItem(type="Category", description=topic.title())]
    
    # Create age-appropriate sections
    if age is not None and age <= 5:
        sections = [
            SectionItem(title="Overview", content=f"{topic} - key ideas and examples."),
            SectionItem(title="Details", content=f"Deeper look at {topic}."),
        ]
    elif age is not None and age <= 12:
        sections = [
            SectionItem(title="What is it?", content=f"{topic} - key ideas and examples."),
            SectionItem(title="How does it work?", content=f"Understanding how {topic} works."),
            SectionItem(title="Why is it important?", content=f"Learning why {topic} matters."),
        ]
    else:
        sections = [
            SectionItem(title="Introduction", content=f"Understanding {topic} - key concepts and definitions."),
            SectionItem(title="Key Principles", content=f"Core principles and theories of {topic}."),
            SectionItem(title="Applications", content=f"How {topic} is applied in real-world scenarios."),
        ]
    
    # Generate age-appropriate quiz questions
    if age is not None and age <= 5:
        quiz = [
            QuizItem(q=f"What is {topic}?", options=[f"A) A {topic} concept", f"B) A {topic} skill", f"C) A {topic} application", "D) All of the above"], answer="D) All of the above"),
            QuizItem(q=f"Which is a key aspect of {topic}?", options=[f"A) {topic} principles", f"B) {topic} applications", f"C) {topic} benefits", "D) All of the above"], answer="D) All of the above"),
            QuizItem(q=f"How is {topic} typically used?", options=[f"A) In {topic} projects", f"B) For {topic} development", f"C) As a {topic} tool", "D) All of the above"], answer="D) All of the above"),
            QuizItem(q=f"What should you know about {topic}?", options=[f"A) {topic} basics", f"B) {topic} advanced concepts", f"C) {topic} best practices", "D) All of the above"], answer="D) All of the above"),
        ]
    elif age is not None and age <= 12:
        quiz = [
            QuizItem(q=f"What is {topic}?", options=[f"A) A {topic} concept", f"B) A {topic} skill", f"C) A {topic} application", "D) All of the above"], answer="D) All of the above"),
            QuizItem(q=f"Why is {topic} important?", options=[f"A) It helps us understand the world", f"B) It has practical applications", f"C) It builds critical thinking", "D) All of the above"], answer="D) All of the above"),
            QuizItem(q=f"How can {topic} be used?", options=[f"A) In school projects", f"B) In daily life", f"C) In future careers", "D) All of the above"], answer="D) All of the above"),
            QuizItem(q=f"What should you remember about {topic}?", options=[f"A) Key definitions", f"B) Main concepts", f"C) Real-world examples", "D) All of the above"], answer="D) All of the above"),
        ]
    else:
        quiz = [
            QuizItem(q=f"What is {topic}?", options=[f"A) A {topic} concept", f"B) A {topic} skill", f"C) A {topic} application", "D) All of the above"], answer="D) All of the above"),
            QuizItem(q=f"Which is a key aspect of {topic}?", options=[f"A) {topic} principles", f"B) {topic} applications", f"C) {topic} benefits", "D) All of the above"], answer="D) All of the above"),
            QuizItem(q=f"How is {topic} typically used?", options=[f"A) In {topic} projects", f"B) For {topic} development", f"C) As a {topic} tool", "D) All of the above"], answer="D) All of the above"),
            QuizItem(q=f"What should you know about {topic}?", options=[f"A) {topic} basics", f"B) {topic} advanced concepts", f"C) {topic} best practices", "D) All of the above"], answer="D) All of the above"),
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
    """Compute structured lesson using LLM or fallback to stub."""
    if _GROQ_CLIENT is not None:
        raw_excerpt = ""
        try:
            # Enhanced system prompt with better age-based instructions
            age_str = ""
            if age is not None:
                if age <= 2:
                    age_str = "toddler"
                elif age <= 5:
                    age_str = "preschooler"
                elif age <= 12:
                    age_str = "child"
                elif age <= 18:
                    age_str = "teenager"
                else:
                    age_str = "adult"
            
            sys_prompt = (
                "You are a helpful tutor who produces a structured lesson as strict JSON. "
                "Return only JSON with keys: introduction (string), classifications (array of {type, description}), "
                "sections (array of {title, content}), diagram_description (string), quiz_questions (array of {question, options, correct_answer}). "
                f"The learner is a {age_str if age_str else 'general audience'}. "
                "Keep each section content at least 100 words. Include 4 quiz questions with 4 options each."
            )

            user_prompt = f"Topic: {topic}"

            # Call Groq API
            response = _GROQ_CLIENT.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": sys_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.4,
                max_tokens=1200,
                top_p=0.9,
                stream=False,
            )

            raw_excerpt = response.choices[0].message.content or ""
            raw_excerpt = raw_excerpt.strip()

            # Extract JSON if wrapped in code
            if '```json' in raw_excerpt:
                start = raw_excerpt.find('```json') + 7
                end = raw_excerpt.find('```', start)
                if end != -1:
                    raw_excerpt = raw_excerpt[start:end].strip()
            elif '```' in raw_excerpt:
                start = raw_excerpt.find('```') + 3
                end = raw_excerpt.find('```', start)
                if end != -1:
                    raw_excerpt = raw_excerpt[start:end].strip()

            # Parse JSON
            import orjson
            data = orjson.loads(raw_excerpt)
            
            # Normalize and validate response
            intro_norm = data.get("introduction", "").strip()
            diagram_norm = data.get("diagram_description", "").strip()
            
            # Process classifications
            classifications = []
            for c in data.get("classifications", []):
                if isinstance(c, dict) and "type" in c and "description" in c:
                    classifications.append(ClassificationItem(type=c["type"], description=c["description"]))
            
            # Process sections
            sections = []
            for s in data.get("sections", []):
                if isinstance(s, dict) and "title" in s and "content" in s:
                    sections.append(SectionItem(title=s["title"], content=s["content"]))
            
            # Process quiz
            quiz = []
            for q in data.get("quiz_questions", []):
                if (isinstance(q, dict) and 
                    "question" in q and 
                    "options" in q and 
                    "correct_answer" in q and
                    len(q["options"]) >= 2):
                    quiz.append(QuizItem(q=q["question"], options=q["options"], answer=q["correct_answer"]))
            
            # Convert question field to q for frontend compatibility
            quiz_items = []
            for q_item in quiz:
                # Create a copy and rename question to q
                quiz_items.append(QuizItem(q=q_item.q, options=q_item.options, answer=q_item.answer))
            quiz = quiz_items

            resp = StructuredLessonResponse(
                id=str(uuid.uuid4()),  # Generate a unique ID for the lesson
                introduction=intro_norm,
                classifications=classifications,
                sections=sections,
                diagram=diagram_norm,
                quiz=quiz,
            )
            # Only cache and return LLM response if it has both sections and quiz questions
            # Also validate that content is substantial (not just generic templates)
            has_substantial_content = (
                resp.sections and resp.quiz and
                len(resp.sections) >= 2 and  # At least 2 sections
                all(len(s.content) > 20 for s in resp.sections) and  # Each section has substantial content (reduced from 50 to 20 chars)
                len(resp.quiz) >= 3  # At least 3 quiz questions
            )
            
            if has_substantial_content:
                try:
                    await _STRUCTURED_LESSON_CACHE.set(cache_key, resp.model_dump(), namespace="lessons")
                except Exception:
                    pass
                return resp, "llm"
            # Log when we're falling back to stub due to incomplete or low-quality LLM response
            logger.warning(f"LLM response for '{topic}' was low-quality - falling back to stub. "
                          f"Sections: {len(resp.sections)}, Quiz: {len(resp.quiz)}, "
                          f"Section quality: {[len(s.content) for s in resp.sections]}")
            return await _stub_lesson(topic, age), "stub"
        except Exception as e:
            # Include raw excerpt to aid troubleshooting and reduce persistent stub fallbacks
            try:
                logger.warning(f"Structured lesson LLM error for topic '{topic}': {e}. raw_excerpt={raw_excerpt}")
            except Exception:
                logger.warning(f"Structured lesson LLM error for topic '{topic}': {e}")
            return await _stub_lesson(topic, age), "stub"
    else:
        logger.info(f"Falling back to stub lesson for '{topic}' - no Groq client available")
        return await _stub_lesson(topic, age), "stub"


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
            fut.set_result((await _stub_lesson(topic, age), "stub"))
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