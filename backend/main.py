"""
FastAPI backend for Lana AI.

"""

from __future__ import annotations

import asyncio
import hashlib
import html
import logging
import re
import time
import uuid
from contextlib import asynccontextmanager
from functools import lru_cache
from typing import Annotated, Optional

import orjson
from fastapi import Depends, FastAPI, Header, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse, StreamingResponse
from pydantic import BaseModel, Field, field_validator, ConfigDict

# Attempt optional imports with graceful fallback
try:
    from groq import Groq
except ImportError:
    Groq = None  # type: ignore

try:
    import redis.asyncio as aioredis
    REDIS_AVAILABLE = True
except ImportError:
    aioredis = None  # type: ignore
    REDIS_AVAILABLE = False

# Local imports
from app.middleware.security_headers_middleware import SecurityHeadersMiddleware
from app.middleware.request_timing_middleware import RequestTimingMiddleware, get_metrics_snapshot
from app.settings import load_settings as _load_settings
from app.repositories.memory_cache_repository import MemoryCacheRepository
from app.api.router import api_router
from app.jobs.worker_manager import start_job_workers, stop_job_workers

# Security imports
from app.middleware.security_logger import security_logger

# Database imports
from app.db_manager import db_manager

# -----------------------------------------------------------------------------
# Logging Configuration
# -----------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - [%(trace_id)s] - %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S%z",
)
logger = logging.getLogger(__name__)

# Add security logger handler if not already present
if not security_logger.handlers:
    security_handler = logging.StreamHandler()
    security_formatter = logging.Formatter(
        '%(asctime)s - SECURITY - %(levelname)s - %(message)s'
    )
    security_handler.setFormatter(security_formatter)
    security_logger.addHandler(security_handler)


class TraceIdFilter(logging.Filter):
    """Inject trace_id into log records."""
    def filter(self, record: logging.LogRecord) -> bool:
        if not hasattr(record, "trace_id"):
            record.trace_id = "no-trace"
        return True


for handler in logging.root.handlers:
    handler.addFilter(TraceIdFilter())


# -----------------------------------------------------------------------------
# Settings (cached)
# -----------------------------------------------------------------------------
@lru_cache(maxsize=1)
def get_settings():
    """Load and cache application settings."""
    return _load_settings()


# -----------------------------------------------------------------------------
# Precompiled Regex Patterns (avoid recompilation per request)
# -----------------------------------------------------------------------------
_SANITIZE_PATTERNS: list[tuple[re.Pattern, str]] = [
    (re.compile(r"<script[^>]*>.*?</script>", re.IGNORECASE | re.DOTALL), ""),
    (re.compile(r"<iframe[^>]*>.*?</iframe>", re.IGNORECASE | re.DOTALL), ""),
    (re.compile(r"<object[^>]*>.*?</object>", re.IGNORECASE | re.DOTALL), ""),
    (re.compile(r"<embed[^>]*>.*?</embed>", re.IGNORECASE | re.DOTALL), ""),
    (re.compile(r"javascript:", re.IGNORECASE), ""),
    (re.compile(r"vbscript:", re.IGNORECASE), ""),
    (re.compile(r"on\w+=", re.IGNORECASE), ""),  # Consolidated event handlers
    (re.compile(r"\s+"), " "),
]
_CONTROL_CHAR_PATTERN = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]")
_MARKDOWN_FENCE_PATTERN = re.compile(r"^```(?:json)?\s*|\s*```$", re.MULTILINE)

MAX_TEXT_LENGTH = 1000
MAX_TOPIC_LENGTH = 100
MIN_TOPIC_LENGTH = 2


def sanitize_text(text: str, max_length: int = MAX_TEXT_LENGTH) -> str:
    """Sanitize user input: escape HTML, remove dangerous patterns, normalize whitespace."""
    if not text:
        return ""
    # Escape HTML entities first
    text = html.escape(text, quote=True)
    # Apply precompiled patterns
    for pattern, replacement in _SANITIZE_PATTERNS:
        text = pattern.sub(replacement, text)
    return text.strip()[:max_length]


# -----------------------------------------------------------------------------
# Pydantic Models with validation
# -----------------------------------------------------------------------------
class ClassificationItem(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    
    type: str = Field(max_length=100)
    description: str = Field(max_length=500)

    @field_validator("type", "description", mode="before")
    @classmethod
    def sanitize(cls, v: str) -> str:
        return sanitize_text(v) if isinstance(v, str) else ""


class SectionItem(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    
    title: str = Field(max_length=200)
    content: str = Field(max_length=5000)

    @field_validator("title", "content", mode="before")
    @classmethod
    def sanitize(cls, v: str) -> str:
        return sanitize_text(v, max_length=5000) if isinstance(v, str) else ""


class QuizItem(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    
    q: str = Field(max_length=500)
    options: list[str] = Field(min_length=2, max_length=6)
    answer: str = Field(max_length=200)

    @field_validator("q", "answer", mode="before")
    @classmethod
    def sanitize(cls, v: str) -> str:
        return sanitize_text(v) if isinstance(v, str) else ""

    @field_validator("options", mode="before")
    @classmethod
    def sanitize_options(cls, v: list) -> list[str]:
        if not isinstance(v, list):
            return []
        return [sanitize_text(str(o)) for o in v[:6]]


class StructuredLessonRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    
    topic: str = Field(min_length=MIN_TOPIC_LENGTH, max_length=MAX_TOPIC_LENGTH)
    age: Optional[int] = Field(default=None, ge=1, le=120)

    @field_validator("topic", mode="before")
    @classmethod
    def validate_topic(cls, v: str) -> str:
        if not isinstance(v, str):
            raise ValueError("Topic must be a string")
        v = v.strip()
        if len(v) < MIN_TOPIC_LENGTH:
            raise ValueError("Topic too short")
        if len(v) > MAX_TOPIC_LENGTH:
            raise ValueError("Topic too long")
        # Note: Validation happens BEFORE sanitization for length checks
        # Sanitization is applied after to clean the content
        return sanitize_text(v, max_length=MAX_TOPIC_LENGTH)


class StructuredLessonResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: Optional[str] = None
    introduction: Optional[str] = None
    classifications: list[ClassificationItem] = Field(default_factory=list)
    sections: list[SectionItem] = Field(default_factory=list)
    diagram: str = ""
    quiz: list[QuizItem] = Field(default_factory=list)


class HealthResponse(BaseModel):
    status: str
    version: str = "1.0.0"


class ReadinessResponse(BaseModel):
    status: str
    checks: dict[str, bool]


# -----------------------------------------------------------------------------
# Application State & Dependencies
# -----------------------------------------------------------------------------
class AppState:
    """Centralized application state with proper lifecycle management."""
    
    def __init__(self):
        self.settings = get_settings()
        self.cache = MemoryCacheRepository(default_ttl=1800, maxsize=10000)
        self.groq_client: Optional[Groq] = None
        self.redis_client: Optional[aioredis.Redis] = None
        self.inflight_lock = asyncio.Lock()
        self.inflight_lessons: dict[str, asyncio.Task] = {}
        self.llm_semaphore = asyncio.Semaphore(50)  # Limit concurrent LLM calls
        self.is_ready = False
        self.startup_time = time.time()
        
        # Metrics
        self.metrics = {
            "requests_total": 0,
            "errors_total": 0,
            "llm_calls_total": 0,
            "cache_hits_total": 0,
            "cache_misses_total": 0,
        }
        
        # Database manager
        self.db_manager = db_manager

    async def initialize(self):
        """Initialize external connections."""
        # Initialize database connection pool
        try:
            await self.db_manager.initialize()
            logger.info("Database connection pool initialized", extra={"trace_id": "startup"})
        except Exception as e:
            logger.error(f"Failed to initialize database connection pool: {e}", extra={"trace_id": "startup"})
        
        # Initialize Groq client
        if Groq and self.settings.groq_api_key:
            try:
                self.groq_client = Groq(
                    api_key=self.settings.groq_api_key,
                    timeout=30.0,
                )
                logger.info("Groq client initialized", extra={"trace_id": "startup"})
            except Exception as e:
                logger.error(f"Failed to initialize Groq client: {e}", extra={"trace_id": "startup"})
        
        # Initialize Redis if available
        if REDIS_AVAILABLE and self.settings.redis_url:
            try:
                self.redis_client = await aioredis.from_url(
                    self.settings.redis_url,
                    encoding="utf-8",
                    decode_responses=True,
                    socket_connect_timeout=5,
                    socket_timeout=5,
                )
                await self.redis_client.ping()
                logger.info("Redis connected", extra={"trace_id": "startup"})
            except Exception as e:
                logger.warning(f"Redis unavailable: {e}", extra={"trace_id": "startup"})
                self.redis_client = None
        
        self.is_ready = True

    async def shutdown(self):
        """Cleanup resources."""
        self.is_ready = False
        
        # Cancel inflight tasks
        async with self.inflight_lock:
            for task in self.inflight_lessons.values():
                task.cancel()
            self.inflight_lessons.clear()
        
        # Close Redis
        if self.redis_client:
            await self.redis_client.close()
        
        # Close database connection pool
        try:
            await self.db_manager.close()
            logger.info("Database connection pool closed", extra={"trace_id": "shutdown"})
        except Exception as e:
            logger.error(f"Error closing database connection pool: {e}", extra={"trace_id": "shutdown"})
        
        logger.info("Application shutdown complete", extra={"trace_id": "shutdown"})

    async def check_groq_health(self) -> bool:
        """Non-blocking health check for Groq."""
        if not self.groq_client:
            return False
        try:
            # Use a very short timeout for health check
            loop = asyncio.get_event_loop()
            await asyncio.wait_for(
                loop.run_in_executor(None, lambda: self.groq_client.models.list()),
                timeout=5.0
            )
            return True
        except Exception:
            return False

    async def check_redis_health(self) -> bool:
        """Non-blocking health check for Redis."""
        if not self.redis_client:
            return True  # Redis is optional
        try:
            await asyncio.wait_for(self.redis_client.ping(), timeout=2.0)
            return True
        except Exception:
            return False
    
    async def check_database_health(self) -> bool:
        """Non-blocking health check for Database."""
        try:
            # Simple query to check database connectivity
            await self.db_manager.execute_query("SELECT 1")
            return True
        except Exception:
            return False


# Global app state instance
_app_state: Optional[AppState] = None


def get_app_state() -> AppState:
    """Dependency to get application state."""
    if _app_state is None:
        raise RuntimeError("Application not initialized")
    return _app_state


# Type alias for dependency injection
AppStateDep = Annotated[AppState, Depends(get_app_state)]


# -----------------------------------------------------------------------------
# Request Context Middleware
# -----------------------------------------------------------------------------
async def add_trace_id(request: Request):
    """Add trace ID to request state and logging context."""
    trace_id = request.headers.get("X-Trace-ID", str(uuid.uuid4())[:8])
    request.state.trace_id = trace_id
    return trace_id


TraceIdDep = Annotated[str, Depends(add_trace_id)]


# -----------------------------------------------------------------------------
# Lesson Generation Logic
# -----------------------------------------------------------------------------
def _get_age_category(age: Optional[int]) -> str:
    """Map age to category for prompt customization."""
    if age is None:
        return "general audience"
    if age <= 5:
        return "young child (use very simple words)"
    if age <= 12:
        return "child (use clear explanations)"
    if age <= 18:
        return "teenager"
    return "adult"


def _build_system_prompt(age: Optional[int]) -> str:
    """Build the system prompt for lesson generation."""
    age_desc = _get_age_category(age)
    return (
        "You are Lana, a helpful tutor. Produce a structured lesson as strict JSON only. "
        "Return ONLY valid JSON with these exact keys: "
        '"introduction" (string), '
        '"classifications" (array of {type, description}), '
        '"sections" (array of {title, content} with content >= 100 words each), '
        '"diagram" (string, optional), '
        '"quiz_questions" (array of {question, options: [4 strings], answer}). '
        f"Target audience: {age_desc}. "
        "Include 3-4 quiz questions. Start response with {{ and end with }}. "
        "No markdown, no code fences, no explanations—pure JSON only."
    )


def _parse_llm_response(raw: str) -> dict:
    """Parse LLM JSON response with robust error handling."""
    if not raw:
        raise ValueError("Empty response")
    
    # Remove markdown fences
    cleaned = _MARKDOWN_FENCE_PATTERN.sub("", raw).strip()
    
    # Remove control characters
    cleaned = _CONTROL_CHAR_PATTERN.sub("", cleaned)
    
    # Try parsing
    try:
        return orjson.loads(cleaned)
    except orjson.JSONDecodeError:
        pass
    
    # Try to find valid JSON boundaries
    start = cleaned.find("{")
    end = cleaned.rfind("}") + 1
    if start >= 0 and end > start:
        try:
            return orjson.loads(cleaned[start:end])
        except orjson.JSONDecodeError:
            pass
    
    raise ValueError(f"Cannot parse JSON: {cleaned[:100]}...")


def _extract_lesson_data(data: dict) -> StructuredLessonResponse:
    """Extract and validate lesson data from parsed JSON."""
    # Extract classifications
    classifications = []
    for c in data.get("classifications", []):
        if isinstance(c, dict) and "type" in c and "description" in c:
            classifications.append(ClassificationItem(
                type=str(c["type"]),
                description=str(c["description"])
            ))
    
    # Extract sections
    sections = []
    for s in data.get("sections", []):
        if isinstance(s, dict) and "title" in s and "content" in s:
            sections.append(SectionItem(
                title=str(s["title"]),
                content=str(s["content"])
            ))
    
    # Extract quiz
    quiz = []
    quiz_raw = data.get("quiz_questions", []) or data.get("quiz", [])
    for q in quiz_raw:
        if not isinstance(q, dict):
            continue
        question = q.get("question") or q.get("q", "")
        options = q.get("options", [])
        answer = q.get("answer", "")
        
        # Normalize options
        normalized_opts = []
        for opt in options[:4]:
            if isinstance(opt, dict):
                normalized_opts.append(str(opt.get("option", opt)))
            else:
                normalized_opts.append(str(opt))
        
        if question and len(normalized_opts) >= 2 and answer:
            quiz.append(QuizItem(q=question, options=normalized_opts, answer=answer))
    
    return StructuredLessonResponse(
        id=str(uuid.uuid4()),
        introduction=sanitize_text(str(data.get("introduction", "")), max_length=2000),
        classifications=classifications,
        sections=sections,
        diagram=sanitize_text(str(data.get("diagram", "")), max_length=1000),
        quiz=quiz,
    )


async def _call_groq_api(
    client: Groq,
    topic: str,
    age: Optional[int],
    semaphore: asyncio.Semaphore,
    trace_id: str,
) -> StructuredLessonResponse:
    """Call Groq API with proper timeout, retry, and rate limiting."""
    async with semaphore:
        loop = asyncio.get_event_loop()
        
        sys_prompt = _build_system_prompt(age)
        user_prompt = f"Create a lesson about: {topic}"
        
        # Retry logic with exponential backoff
        max_retries = 3
        for attempt in range(max_retries):
            try:
                # Run blocking call in thread pool with timeout
                response = await asyncio.wait_for(
                    loop.run_in_executor(
                        None,
                        lambda: client.chat.completions.create(
                            model="llama-3.1-8b-instant",
                            messages=[
                                {"role": "system", "content": sys_prompt},
                                {"role": "user", "content": user_prompt},
                            ],
                            temperature=0.4,
                            max_tokens=1500,
                            top_p=0.9,
                        )
                    ),
                    timeout=30.0,
                )
                
                raw = response.choices[0].message.content or ""
                data = _parse_llm_response(raw)
                lesson = _extract_lesson_data(data)
                
                # Quality check
                if not lesson.introduction or len(lesson.sections) < 1:
                    raise ValueError("Low quality response")
                
                logger.info(
                    f"LLM lesson generated for '{topic}'",
                    extra={"trace_id": trace_id, "sections": len(lesson.sections)}
                )
                return lesson
                
            except asyncio.TimeoutError:
                logger.warning(
                    f"Groq timeout attempt {attempt + 1}/{max_retries}",
                    extra={"trace_id": trace_id}
                )
                if attempt == max_retries - 1:
                    raise
                await asyncio.sleep(2 ** attempt)
                
            except Exception as e:
                logger.warning(
                    f"Groq error attempt {attempt + 1}/{max_retries}: {e}",
                    extra={"trace_id": trace_id}
                )
                if attempt == max_retries - 1:
                    raise
                await asyncio.sleep(2 ** attempt)
        
        raise RuntimeError("Max retries exceeded")


def _create_stub_lesson(topic: str) -> StructuredLessonResponse:
    """Create a stub lesson when LLM is unavailable."""
    return StructuredLessonResponse(
        id=str(uuid.uuid4()),
        introduction=f"We couldn't generate a lesson about '{topic}' at this time. Please try again later.",
        classifications=[],
        sections=[
            SectionItem(
                title="Service Temporarily Unavailable",
                content="Our lesson generation service is experiencing high demand or temporary issues. "
                        "Please try again in a few moments, or try a different topic."
            ),
        ],
        diagram="",
        quiz=[
            QuizItem(
                q="What should you do when a lesson isn't available?",
                options=["Try again later", "Try a different topic", "Contact support", "All of the above"],
                answer="All of the above"
            )
        ],
    )


async def get_or_compute_lesson(
    state: AppState,
    cache_key: str,
    topic: str,
    age: Optional[int],
    trace_id: str,
) -> tuple[StructuredLessonResponse, str]:
    """Get lesson from cache or compute with single-flight pattern."""
    
    # Check cache first
    try:
        cached = await state.cache.get(cache_key, namespace="lessons")
        if cached:
            state.metrics["cache_hits_total"] += 1
            return StructuredLessonResponse(**cached), "cache"
    except Exception as e:
        logger.debug(f"Cache get error: {e}", extra={"trace_id": trace_id})
    
    state.metrics["cache_misses_total"] += 1
    
    # Single-flight: check if already computing
    async with state.inflight_lock:
        if cache_key in state.inflight_lessons:
            task = state.inflight_lessons[cache_key]
        else:
            # Create new task
            task = asyncio.create_task(
                _compute_lesson_task(state, cache_key, topic, age, trace_id)
            )
            state.inflight_lessons[cache_key] = task
    
    try:
        return await task
    finally:
        # Cleanup
        async with state.inflight_lock:
            state.inflight_lessons.pop(cache_key, None)


async def _compute_lesson_task(
    state: AppState,
    cache_key: str,
    topic: str,
    age: Optional[int],
    trace_id: str,
) -> tuple[StructuredLessonResponse, str]:
    """Compute lesson and cache result."""
    source = "stub"
    
    if state.groq_client:
        try:
            state.metrics["llm_calls_total"] += 1
            lesson = await _call_groq_api(
                state.groq_client, topic, age, state.llm_semaphore, trace_id
            )
            source = "llm"
        except Exception as e:
            logger.error(f"LLM generation failed: {e}", extra={"trace_id": trace_id})
            state.metrics["errors_total"] += 1
            lesson = _create_stub_lesson(topic)
    else:
        lesson = _create_stub_lesson(topic)
    
    # Cache the result
    try:
        await state.cache.set(cache_key, lesson.model_dump(), namespace="lessons")
    except Exception as e:
        logger.debug(f"Cache set error: {e}", extra={"trace_id": trace_id})
    
    return lesson, source


# -----------------------------------------------------------------------------
# Lifespan Context Manager
# -----------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown logic."""
    global _app_state
    
    # Startup
    logger.info("Starting Lana AI Backend...", extra={"trace_id": "startup"})
    _app_state = AppState()
    await _app_state.initialize()
    
    # Start job workers (non-blocking)
    try:
        await start_job_workers()
        logger.info("Job workers started", extra={"trace_id": "startup"})
    except Exception as e:
        logger.error(f"Job worker startup failed: {e}", extra={"trace_id": "startup"})
    
    # Warm up cache in background
    asyncio.create_task(_warm_up_cache(_app_state))
    
    yield
    
    # Shutdown
    logger.info("Shutting down...", extra={"trace_id": "shutdown"})
    try:
        await stop_job_workers()
    except Exception as e:
        logger.error(f"Job worker shutdown error: {e}", extra={"trace_id": "shutdown"})
    
    await _app_state.shutdown()
    _app_state = None


async def _warm_up_cache(state: AppState):
    """Background task to warm up the lesson cache."""
    try:
        await asyncio.sleep(1)  # Let startup complete
        cache_key = hashlib.md5(b"warmup|10").hexdigest()[:16]
        await get_or_compute_lesson(state, cache_key, "warmup sample", 10, "warmup")
        logger.info("Cache warmup complete", extra={"trace_id": "warmup"})
    except Exception as e:
        logger.warning(f"Cache warmup failed: {e}", extra={"trace_id": "warmup"})


# -----------------------------------------------------------------------------
# FastAPI Application
# -----------------------------------------------------------------------------
app = FastAPI(
    title="Lana AI API",
    description="Backend API for Lana AI educational platform",
    version="1.0.0",
    default_response_class=ORJSONResponse,
    lifespan=lifespan,
)

# CORS configuration - explicit origins
_settings = get_settings()
_allowed_origins = _settings.cors_origins or [
    "http://localhost:3001",
    "https://api.lanamind.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Trace-ID", "X-API-Key"],
    expose_headers=["X-Content-Source", "X-Trace-ID"],
)

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestTimingMiddleware)


# -----------------------------------------------------------------------------
# Routes
# -----------------------------------------------------------------------------
@app.get("/", tags=["Root"], response_model=dict)
async def root():
    """Root endpoint - confirms API is accessible."""
    return {"message": "Welcome to Lana AI API", "status": "online"}


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health():
    """Liveness probe - returns immediately if process is running."""
    return HealthResponse(status="ok")


@app.get("/ready", response_model=ReadinessResponse, tags=["Health"])
async def readiness(state: AppStateDep):
    """
    Readiness probe - checks external dependencies.
    Returns 503 if any critical check fails.
    """
    checks = {
        "groq": await state.check_groq_health(),
        "redis": await state.check_redis_health(),
        "database": await state.check_database_health(),
        "cache": True,
    }
    
    all_ok = all(checks.values())
    response = ReadinessResponse(
        status="ready" if all_ok else "degraded",
        checks=checks,
    )
    
    if not checks["groq"]:
        # Groq is critical - return 503
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=response.model_dump(),
        )
    
    return response


@app.get("/api/metrics", tags=["Observability"])
async def metrics(state: AppStateDep, trace_id: TraceIdDep):
    """Return application metrics."""
    return {
        "paths": get_metrics_snapshot(),
        "app": state.metrics,
        "uptime_seconds": time.time() - state.startup_time,
    }


@app.post(
    "/api/structured-lesson",
    response_model=StructuredLessonResponse,
    response_model_exclude_none=True,
    tags=["Lessons"],
)
async def create_structured_lesson(
    req: StructuredLessonRequest,
    response: Response,
    state: AppStateDep,
    trace_id: TraceIdDep,
):
    """Create a structured lesson from a topic and optional age."""
    state.metrics["requests_total"] += 1
    
    cache_key = hashlib.md5(f"{req.topic}|{req.age}".encode()).hexdigest()[:16]
    
    lesson, source = await get_or_compute_lesson(
        state, cache_key, req.topic, req.age, trace_id
    )
    
    response.headers["X-Content-Source"] = source
    response.headers["X-Trace-ID"] = trace_id
    return lesson


@app.post("/api/structured-lesson/stream", tags=["Lessons"])
async def structured_lesson_stream(
    req: StructuredLessonRequest,
    request: Request,
    state: AppStateDep,
    trace_id: TraceIdDep,
):
    """Stream a structured lesson as Server-Sent Events."""
    
    async def event_generator():
        try:
            cache_key = hashlib.md5(f"{req.topic}|{req.age}".encode()).hexdigest()[:16]
            lesson, source = await get_or_compute_lesson(
                state, cache_key, req.topic, req.age, trace_id
            )
            
            lesson_dict = lesson.model_dump(exclude_none=True)
            payload = orjson.dumps({"type": "done", "lesson": lesson_dict, "source": source})
            yield f"data: {payload.decode()}\n\n"
            
        except asyncio.CancelledError:
            logger.info("SSE client disconnected", extra={"trace_id": trace_id})
            raise
        except Exception as e:
            state.metrics["errors_total"] += 1
            error_payload = orjson.dumps({"type": "error", "message": str(e)})
            yield f"data: {error_payload.decode()}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "X-Trace-ID": trace_id,
        },
    )


@app.post("/api/cache/reset", tags=["Admin"])
async def reset_cache(
    state: AppStateDep,
    trace_id: TraceIdDep,
    x_api_key: Annotated[Optional[str], Header()] = None,
    namespaces: Optional[list[str]] = None,
):
    """
    Reset in-memory caches. Requires API key authentication.
    """
    # Simple API key auth for admin endpoints
    settings = get_settings()
    expected_key = getattr(settings, "admin_api_key", None)
    
    if expected_key and x_api_key != expected_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key",
        )
    
    try:
        if namespaces:
            for ns in namespaces:
                state.cache._caches.pop(ns, None)
        else:
            state.cache._caches.clear()
        
        logger.info(
            f"Cache reset: {namespaces or 'all'}",
            extra={"trace_id": trace_id}
        )
        return {"ok": True, "namespaces": namespaces or "all"}
    except Exception as e:
        logger.error(f"Cache reset failed: {e}", extra={"trace_id": trace_id})
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


# Mount API router
app.include_router(api_router, prefix="/api")


# -----------------------------------------------------------------------------
# Error Handlers
# -----------------------------------------------------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler with structured logging."""
    trace_id = getattr(request.state, "trace_id", "unknown")
    logger.exception(f"Unhandled exception: {exc}", extra={"trace_id": trace_id})
    
    return ORJSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error", "trace_id": trace_id},
    )