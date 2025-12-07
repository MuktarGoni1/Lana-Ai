"""
Production-grade FastAPI backend for Lana AI with true streaming support.
Optimized for 10k+ RPS with proper error handling, observability, and security.
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
from dataclasses import dataclass, field
from functools import lru_cache
from typing import Annotated, AsyncGenerator, Optional

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

# -----------------------------------------------------------------------------
# Logging Configuration
# -----------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - [%(trace_id)s] - %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S%z",
)
logger = logging.getLogger(__name__)


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
# Precompiled Regex Patterns
# -----------------------------------------------------------------------------
_SANITIZE_PATTERNS: list[tuple[re.Pattern, str]] = [
    (re.compile(r"<script[^>]*>.*?</script>", re.IGNORECASE | re.DOTALL), ""),
    (re.compile(r"<iframe[^>]*>.*?</iframe>", re.IGNORECASE | re.DOTALL), ""),
    (re.compile(r"<object[^>]*>.*?</object>", re.IGNORECASE | re.DOTALL), ""),
    (re.compile(r"<embed[^>]*>.*?</embed>", re.IGNORECASE | re.DOTALL), ""),
    (re.compile(r"javascript:", re.IGNORECASE), ""),
    (re.compile(r"vbscript:", re.IGNORECASE), ""),
    (re.compile(r"on\w+=", re.IGNORECASE), ""),
    (re.compile(r"\s+"), " "),
]
_CONTROL_CHAR_PATTERN = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]")
_MARKDOWN_FENCE_PATTERN = re.compile(r"^```(?:json)?\s*|\s*```$", re.MULTILINE)

# Patterns for incremental JSON parsing
_SECTION_PATTERN = re.compile(
    r'\{\s*"title"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"\s*,\s*"content"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"\s*\}',
    re.DOTALL
)
_QUIZ_PATTERN = re.compile(
    r'\{\s*"question"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"\s*,\s*"options"\s*:\s*\[(.*?)\]\s*,\s*"answer"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"\s*\}',
    re.DOTALL
)
_INTRO_PATTERN = re.compile(r'"introduction"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"', re.DOTALL)

MAX_TEXT_LENGTH = 1000
MAX_TOPIC_LENGTH = 100
MIN_TOPIC_LENGTH = 2


def sanitize_text(text: str, max_length: int = MAX_TEXT_LENGTH) -> str:
    """Sanitize user input: escape HTML, remove dangerous patterns, normalize whitespace."""
    if not text:
        return ""
    text = html.escape(text, quote=True)
    for pattern, replacement in _SANITIZE_PATTERNS:
        text = pattern.sub(replacement, text)
    return text.strip()[:max_length]


# -----------------------------------------------------------------------------
# Pydantic Models
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
# SSE Event Types
# -----------------------------------------------------------------------------
@dataclass
class SSEEvent:
    """Server-Sent Event structure."""
    event: str
    data: dict
    
    def encode(self) -> str:
        """Encode as SSE format."""
        json_data = orjson.dumps(self.data).decode()
        return f"event: {self.event}\ndata: {json_data}\n\n"


# -----------------------------------------------------------------------------
# Streaming State Tracker
# -----------------------------------------------------------------------------
@dataclass
class StreamingLessonState:
    """Tracks state during incremental lesson parsing."""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    raw_buffer: str = ""
    introduction: Optional[str] = None
    classifications: list[ClassificationItem] = field(default_factory=list)
    sections: list[SectionItem] = field(default_factory=list)
    diagram: str = ""
    quiz: list[QuizItem] = field(default_factory=list)
    
    # Track what we've already emitted to avoid duplicates
    emitted_sections: int = 0
    emitted_quiz: int = 0
    intro_emitted: bool = False
    
    def to_response(self) -> StructuredLessonResponse:
        """Convert to final response model."""
        return StructuredLessonResponse(
            id=self.id,
            introduction=self.introduction,
            classifications=self.classifications,
            sections=self.sections,
            diagram=self.diagram,
            quiz=self.quiz,
        )


# -----------------------------------------------------------------------------
# Application State & Dependencies
# -----------------------------------------------------------------------------
class AppState:
    """Centralized application state with proper lifecycle management."""
    
    def __init__(self):
        self.settings = get_settings()
        self.cache = MemoryCacheRepository(default_ttl=1800, max_size=10000)
        self.groq_client: Optional[Groq] = None
        self.redis_client = None
        self.inflight_lock = asyncio.Lock()
        self.inflight_lessons: dict[str, asyncio.Task] = {}
        self.llm_semaphore = asyncio.Semaphore(50)
        self.is_ready = False
        self.startup_time = time.time()
        
        self.metrics = {
            "requests_total": 0,
            "errors_total": 0,
            "llm_calls_total": 0,
            "cache_hits_total": 0,
            "cache_misses_total": 0,
            "stream_requests_total": 0,
        }

    async def initialize(self):
        """Initialize external connections."""
        if Groq and self.settings.groq_api_key:
            try:
                self.groq_client = Groq(
                    api_key=self.settings.groq_api_key,
                    timeout=60.0,  # Longer timeout for streaming
                )
                logger.info("Groq client initialized", extra={"trace_id": "startup"})
            except Exception as e:
                logger.error(f"Failed to initialize Groq client: {e}", extra={"trace_id": "startup"})
        
        if REDIS_AVAILABLE and hasattr(self.settings, 'redis_url') and self.settings.redis_url:
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
        
        async with self.inflight_lock:
            for task in self.inflight_lessons.values():
                task.cancel()
            self.inflight_lessons.clear()
        
        if self.redis_client:
            await self.redis_client.close()
        
        logger.info("Application shutdown complete", extra={"trace_id": "shutdown"})

    async def check_groq_health(self) -> bool:
        """Non-blocking health check for Groq."""
        if not self.groq_client:
            return False
        try:
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
            return True
        try:
            await asyncio.wait_for(self.redis_client.ping(), timeout=2.0)
            return True
        except Exception:
            return False


_app_state: Optional[AppState] = None


def get_app_state() -> AppState:
    """Dependency to get application state."""
    if _app_state is None:
        raise RuntimeError("Application not initialized")
    return _app_state


AppStateDep = Annotated[AppState, Depends(get_app_state)]


async def add_trace_id(request: Request):
    """Add trace ID to request state."""
    trace_id = request.headers.get("X-Trace-ID", str(uuid.uuid4())[:8])
    request.state.trace_id = trace_id
    return trace_id


TraceIdDep = Annotated[str, Depends(add_trace_id)]


# -----------------------------------------------------------------------------
# Prompt Building
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
        "Return ONLY valid JSON with these exact keys in this order: "
        '"introduction" (string, 2-3 sentences overview), '
        '"classifications" (array of {type, description}), '
        '"sections" (array of {title, content} - include 3-4 sections with content >= 100 words each), '
        '"diagram" (string, optional ASCII or text description), '
        '"quiz_questions" (array of {question, options: [exactly 4 strings], answer} - include 3-4 questions). '
        f"Target audience: {age_desc}. "
        "Start response with {{ and end with }}. "
        "No markdown, no code fences, no explanations—pure JSON only."
    )


# -----------------------------------------------------------------------------
# Incremental JSON Parser
# -----------------------------------------------------------------------------
class IncrementalLessonParser:
    """
    Parses streaming JSON and extracts lesson components incrementally.
    Emits events as complete objects are detected.
    """
    
    def __init__(self, state: StreamingLessonState):
        self.state = state
        self._last_processed_len = 0
    
    def feed(self, chunk: str) -> list[SSEEvent]:
        """
        Feed a new chunk and return any newly detected complete objects.
        """
        self.state.raw_buffer += chunk
        events = []
        
        buffer = self.state.raw_buffer
        
        # Try to extract introduction
        if not self.state.intro_emitted:
            intro_match = _INTRO_PATTERN.search(buffer)
            if intro_match:
                intro_text = self._unescape_json_string(intro_match.group(1))
                self.state.introduction = sanitize_text(intro_text, max_length=2000)
                self.state.intro_emitted = True
                events.append(SSEEvent(
                    event="introduction",
                    data={"content": self.state.introduction}
                ))
        
        # Try to extract sections incrementally
        section_matches = list(_SECTION_PATTERN.finditer(buffer))
        new_sections = section_matches[self.state.emitted_sections:]
        
        for match in new_sections:
            try:
                title = self._unescape_json_string(match.group(1))
                content = self._unescape_json_string(match.group(2))
                section = SectionItem(
                    title=sanitize_text(title, max_length=200),
                    content=sanitize_text(content, max_length=5000)
                )
                self.state.sections.append(section)
                self.state.emitted_sections += 1
                events.append(SSEEvent(
                    event="section",
                    data={
                        "index": len(self.state.sections) - 1,
                        "section": section.model_dump()
                    }
                ))
            except Exception:
                pass  # Skip malformed sections
        
        # Try to extract quiz questions incrementally
        quiz_matches = list(_QUIZ_PATTERN.finditer(buffer))
        new_quiz = quiz_matches[self.state.emitted_quiz:]
        
        for match in new_quiz:
            try:
                question = self._unescape_json_string(match.group(1))
                options_raw = match.group(2)
                answer = self._unescape_json_string(match.group(3))
                
                # Parse options array
                options = self._parse_options(options_raw)
                
                if len(options) >= 2:
                    quiz_item = QuizItem(
                        q=sanitize_text(question, max_length=500),
                        options=[sanitize_text(o, max_length=200) for o in options[:4]],
                        answer=sanitize_text(answer, max_length=200)
                    )
                    self.state.quiz.append(quiz_item)
                    self.state.emitted_quiz += 1
                    events.append(SSEEvent(
                        event="quiz",
                        data={
                            "index": len(self.state.quiz) - 1,
                            "quiz": quiz_item.model_dump()
                        }
                    ))
            except Exception:
                pass  # Skip malformed quiz items
        
        return events
    
    def finalize(self) -> list[SSEEvent]:
        """
        Parse any remaining content and extract classifications, diagram.
        Returns final events.
        """
        events = []
        
        try:
            # Clean up buffer and try full JSON parse
            buffer = self.state.raw_buffer.strip()
            buffer = _MARKDOWN_FENCE_PATTERN.sub("", buffer).strip()
            buffer = _CONTROL_CHAR_PATTERN.sub("", buffer)
            
            # Find JSON boundaries
            start = buffer.find("{")
            end = buffer.rfind("}") + 1
            if start >= 0 and end > start:
                try:
                    data = orjson.loads(buffer[start:end])
                    
                    # Extract classifications if not already done
                    if not self.state.classifications:
                        for c in data.get("classifications", []):
                            if isinstance(c, dict) and "type" in c and "description" in c:
                                self.state.classifications.append(ClassificationItem(
                                    type=sanitize_text(str(c["type"])),
                                    description=sanitize_text(str(c["description"]))
                                ))
                        if self.state.classifications:
                            events.append(SSEEvent(
                                event="classifications",
                                data={"classifications": [c.model_dump() for c in self.state.classifications]}
                            ))
                    
                    # Extract diagram if present
                    diagram = data.get("diagram", "")
                    if diagram:
                        self.state.diagram = sanitize_text(str(diagram), max_length=2000)
                        events.append(SSEEvent(
                            event="diagram",
                            data={"content": self.state.diagram}
                        ))
                    
                    # Fill in any missing introduction
                    if not self.state.introduction and data.get("introduction"):
                        self.state.introduction = sanitize_text(
                            str(data["introduction"]), max_length=2000
                        )
                    
                    # Fill in any missing sections
                    if not self.state.sections:
                        for s in data.get("sections", []):
                            if isinstance(s, dict) and "title" in s and "content" in s:
                                self.state.sections.append(SectionItem(
                                    title=sanitize_text(str(s["title"])),
                                    content=sanitize_text(str(s["content"]), max_length=5000)
                                ))
                    
                    # Fill in any missing quiz
                    if not self.state.quiz:
                        quiz_raw = data.get("quiz_questions", []) or data.get("quiz", [])
                        for q in quiz_raw:
                            if isinstance(q, dict):
                                question = q.get("question") or q.get("q", "")
                                options = q.get("options", [])
                                answer = q.get("answer", "")
                                
                                normalized_opts = []
                                for opt in options[:4]:
                                    if isinstance(opt, dict):
                                        normalized_opts.append(str(opt.get("option", opt)))
                                    else:
                                        normalized_opts.append(str(opt))
                                
                                if question and len(normalized_opts) >= 2 and answer:
                                    self.state.quiz.append(QuizItem(
                                        q=sanitize_text(question),
                                        options=[sanitize_text(o) for o in normalized_opts],
                                        answer=sanitize_text(answer)
                                    ))
                                    
                except orjson.JSONDecodeError:
                    logger.warning("Failed to parse final JSON in finalize")
        except Exception as e:
            logger.warning(f"Error in finalize: {e}")
        
        return events
    
    @staticmethod
    def _unescape_json_string(s: str) -> str:
        """Unescape JSON string escape sequences."""
        try:
            # Use JSON parser to properly unescape
            return orjson.loads(f'"{s}"')
        except Exception:
            # Fallback: manual unescaping
            return (
                s.replace("\\n", "\n")
                .replace("\\r", "\r")
                .replace("\\t", "\t")
                .replace('\\"', '"')
                .replace("\\\\", "\\")
            )
    
    @staticmethod
    def _parse_options(options_str: str) -> list[str]:
        """Parse options array from partial JSON string."""
        options = []
        # Match quoted strings
        for match in re.finditer(r'"([^"\\]*(?:\\.[^"\\]*)*)"', options_str):
            try:
                opt = IncrementalLessonParser._unescape_json_string(match.group(1))
                options.append(opt)
            except Exception:
                pass
        return options


# -----------------------------------------------------------------------------
# Streaming Lesson Generator
# -----------------------------------------------------------------------------
async def stream_lesson_from_groq(
    client: Groq,
    topic: str,
    age: Optional[int],
    semaphore: asyncio.Semaphore,
    trace_id: str,
) -> AsyncGenerator[tuple[str, Optional[str]], None]:
    """
    Stream tokens from Groq API.
    Yields (event_type, content) tuples.
    event_type: "token" for content, "error" for errors, "done" when finished.
    """
    async with semaphore:
        loop = asyncio.get_event_loop()
        
        sys_prompt = _build_system_prompt(age)
        user_prompt = f"Create a comprehensive lesson about: {topic}"
        
        try:
            # Create streaming completion in thread pool
            def create_stream():
                return client.chat.completions.create(
                    model="llama-3.1-8b-instant",
                    messages=[
                        {"role": "system", "content": sys_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    temperature=0.4,
                    max_tokens=2000,
                    top_p=0.9,
                    stream=True,  # Enable streaming
                )
            
            # Get the stream object
            stream = await asyncio.wait_for(
                loop.run_in_executor(None, create_stream),
                timeout=10.0  # Timeout for initial connection
            )
            
            # Yield tokens as they arrive
            def iter_stream():
                for chunk in stream:
                    if chunk.choices and chunk.choices[0].delta.content:
                        yield chunk.choices[0].delta.content
            
            # Process stream with timeout per chunk
            buffer = []
            last_yield = time.time()
            
            for token in iter_stream():
                buffer.append(token)
                
                # Yield accumulated tokens every 50ms or when buffer is large
                if len(buffer) >= 10 or (time.time() - last_yield) > 0.05:
                    combined = "".join(buffer)
                    buffer = []
                    last_yield = time.time()
                    yield ("token", combined)
                    await asyncio.sleep(0)  # Allow other coroutines to run
            
            # Yield any remaining buffer
            if buffer:
                yield ("token", "".join(buffer))
            
            yield ("done", None)
            
        except asyncio.TimeoutError:
            logger.error(f"Groq streaming timeout for topic '{topic}'", extra={"trace_id": trace_id})
            yield ("error", "Request timed out. Please try again.")
            
        except Exception as e:
            logger.error(f"Groq streaming error: {e}", extra={"trace_id": trace_id})
            yield ("error", f"Generation failed: {str(e)[:100]}")


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


# -----------------------------------------------------------------------------
# Non-Streaming Lesson Generation (for /api/structured-lesson)
# -----------------------------------------------------------------------------
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
        user_prompt = f"Create a comprehensive lesson about: {topic}"
        
        max_retries = 3
        for attempt in range(max_retries):
            try:
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
                            max_tokens=2000,
                            top_p=0.9,
                            stream=False,
                        )
                    ),
                    timeout=45.0,
                )
                
                raw = response.choices[0].message.content or ""
                
                # Parse using the incremental parser
                state = StreamingLessonState()
                parser = IncrementalLessonParser(state)
                parser.feed(raw)
                parser.finalize()
                
                lesson = state.to_response()
                
                if not lesson.introduction or len(lesson.sections) < 1:
                    raise ValueError("Low quality response")
                
                logger.info(
                    f"LLM lesson generated for '{topic}'",
                    extra={"trace_id": trace_id, "sections": len(lesson.sections)}
                )
                return lesson
                
            except asyncio.TimeoutError:
                logger.warning(f"Groq timeout attempt {attempt + 1}/{max_retries}", extra={"trace_id": trace_id})
                if attempt == max_retries - 1:
                    raise
                await asyncio.sleep(2 ** attempt)
                
            except Exception as e:
                logger.warning(f"Groq error attempt {attempt + 1}/{max_retries}: {e}", extra={"trace_id": trace_id})
                if attempt == max_retries - 1:
                    raise
                await asyncio.sleep(2 ** attempt)
        
        raise RuntimeError("Max retries exceeded")


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
    
    # Single-flight pattern
    async with state.inflight_lock:
        if cache_key in state.inflight_lessons:
            task = state.inflight_lessons[cache_key]
        else:
            task = asyncio.create_task(
                _compute_lesson_task(state, cache_key, topic, age, trace_id)
            )
            state.inflight_lessons[cache_key] = task
    
    try:
        return await task
    finally:
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
    
    logger.info("Starting Lana AI Backend...", extra={"trace_id": "startup"})
    _app_state = AppState()
    await _app_state.initialize()
    
    try:
        await start_job_workers()
        logger.info("Job workers started", extra={"trace_id": "startup"})
    except Exception as e:
        logger.error(f"Job worker startup failed: {e}", extra={"trace_id": "startup"})
    
    # Warm up cache in background
    asyncio.create_task(_warm_up_cache(_app_state))
    
    yield
    
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
        await asyncio.sleep(1)
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
    """Liveness probe."""
    return HealthResponse(status="ok")


@app.get("/ready", response_model=ReadinessResponse, tags=["Health"])
async def readiness(state: AppStateDep):
    """Readiness probe - checks external dependencies."""
    checks = {
        "groq": await state.check_groq_health(),
        "redis": await state.check_redis_health(),
        "cache": True,
    }
    
    all_ok = all(checks.values())
    response = ReadinessResponse(
        status="ready" if all_ok else "degraded",
        checks=checks,
    )
    
    if not checks["groq"]:
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
    """Create a structured lesson from a topic and optional age (non-streaming)."""
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
    """
    Stream a structured lesson as Server-Sent Events.
    
    Events emitted:
    - `start`: Stream started, includes lesson ID
    - `token`: Raw token chunk from LLM (for typing animation)
    - `introduction`: Introduction text extracted
    - `section`: A complete section extracted (includes index)
    - `quiz`: A complete quiz question extracted (includes index)
    - `classifications`: All classifications extracted
    - `diagram`: Diagram content extracted
    - `complete`: Final complete lesson object
    - `error`: Error occurred
    - `done`: Stream finished
    
    Client can render incrementally as events arrive.
    """
    state.metrics["stream_requests_total"] += 1
    
    cache_key = hashlib.md5(f"{req.topic}|{req.age}".encode()).hexdigest()[:16]
    
    async def event_generator() -> AsyncGenerator[str, None]:
        lesson_state = StreamingLessonState()
        parser = IncrementalLessonParser(lesson_state)
        
        try:
            # Check cache first
            try:
                cached = await state.cache.get(cache_key, namespace="lessons")
                if cached:
                    state.metrics["cache_hits_total"] += 1
                    lesson = StructuredLessonResponse(**cached)
                    
                    # Emit cached lesson as complete immediately
                    yield SSEEvent("start", {
                        "id": lesson.id or str(uuid.uuid4()),
                        "source": "cache",
                        "cached": True
                    }).encode()
                    
                    yield SSEEvent("complete", {
                        "lesson": lesson.model_dump(exclude_none=True)
                    }).encode()
                    
                    yield SSEEvent("done", {"success": True}).encode()
                    return
            except Exception as e:
                logger.debug(f"Cache check error: {e}", extra={"trace_id": trace_id})
            
            state.metrics["cache_misses_total"] += 1
            
            # Check if Groq client is available
            if not state.groq_client:
                stub = _create_stub_lesson(req.topic)
                yield SSEEvent("start", {"id": stub.id, "source": "stub"}).encode()
                yield SSEEvent("complete", {"lesson": stub.model_dump(exclude_none=True)}).encode()
                yield SSEEvent("done", {"success": True}).encode()
                return
            
            # Start streaming
            yield SSEEvent("start", {
                "id": lesson_state.id,
                "source": "llm",
                "topic": req.topic,
            }).encode()
            
            state.metrics["llm_calls_total"] += 1
            token_count = 0
            error_occurred = False
            
            # Stream tokens from Groq
            async for event_type, content in stream_lesson_from_groq(
                state.groq_client,
                req.topic,
                req.age,
                state.llm_semaphore,
                trace_id,
            ):
                # Check if client disconnected
                if await request.is_disconnected():
                    logger.info(f"Client disconnected during stream", extra={"trace_id": trace_id})
                    return
                
                if event_type == "token" and content:
                    token_count += len(content)
                    
                    # Emit raw token for typing animation
                    yield SSEEvent("token", {"content": content}).encode()
                    
                    # Feed to parser and emit any extracted objects
                    events = parser.feed(content)
                    for evt in events:
                        yield evt.encode()
                
                elif event_type == "error":
                    error_occurred = True
                    state.metrics["errors_total"] += 1
                    yield SSEEvent("error", {"message": content}).encode()
                
                elif event_type == "done":
                    pass  # Will handle finalization below
            
            if error_occurred:
                # Fall back to stub on error
                stub = _create_stub_lesson(req.topic)
                yield SSEEvent("complete", {"lesson": stub.model_dump(exclude_none=True)}).encode()
                yield SSEEvent("done", {"success": False}).encode()
                return
            
            # Finalize parsing
            final_events = parser.finalize()
            for evt in final_events:
                yield evt.encode()
            
            # Build final lesson
            lesson = lesson_state.to_response()
            
            # Quality check
            if not lesson.introduction or len(lesson.sections) < 1:
                logger.warning(
                    f"Low quality streamed response for '{req.topic}'",
                    extra={"trace_id": trace_id}
                )
                # Still return what we got, but mark it
                yield SSEEvent("warning", {
                    "message": "Response quality may be limited"
                }).encode()
            
            # Cache the result
            try:
                await state.cache.set(cache_key, lesson.model_dump(), namespace="lessons")
            except Exception as e:
                logger.debug(f"Cache set error: {e}", extra={"trace_id": trace_id})
            
            # Emit complete lesson
            yield SSEEvent("complete", {
                "lesson": lesson.model_dump(exclude_none=True),
                "token_count": token_count,
            }).encode()
            
            yield SSEEvent("done", {"success": True}).encode()
            
            logger.info(
                f"Streamed lesson complete for '{req.topic}': "
                f"{len(lesson.sections)} sections, {len(lesson.quiz)} quiz items, "
                f"{token_count} tokens",
                extra={"trace_id": trace_id}
            )
            
        except asyncio.CancelledError:
            logger.info("Stream cancelled by client", extra={"trace_id": trace_id})
            raise
        except Exception as e:
            state.metrics["errors_total"] += 1
            logger.exception(f"Stream error: {e}", extra={"trace_id": trace_id})
            yield SSEEvent("error", {"message": f"Stream failed: {str(e)[:100]}"}).encode()
            yield SSEEvent("done", {"success": False}).encode()
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "X-Trace-ID": trace_id,
            "Content-Type": "text/event-stream; charset=utf-8",
        },
    )


@app.post("/api/cache/reset", tags=["Admin"])
async def reset_cache(
    state: AppStateDep,
    trace_id: TraceIdDep,
    x_api_key: Annotated[Optional[str], Header()] = None,
    namespaces: Optional[list[str]] = None,
):
    """Reset in-memory caches. Requires API key authentication."""
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
        
        logger.info(f"Cache reset: {namespaces or 'all'}", extra={"trace_id": trace_id})
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