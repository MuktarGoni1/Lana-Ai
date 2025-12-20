# backend/main.py
"""
Simplified FastAPI application for Lana AI Backend.
"""

import logging

# FastAPI imports
from fastapi import FastAPI, Response, Request
import uuid
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware  # type: ignore
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.middleware.security_headers_middleware import SecurityHeadersMiddleware
from app.middleware.request_timing_middleware import RequestTimingMiddleware, get_metrics_snapshot
from app.middleware.rate_limit_middleware import RateLimitMiddleware
from app.settings import load_settings
from app.repositories.memory_cache_repository import MemoryCacheRepository

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
    logger.info("Groq API key loaded")
else:
    logger.warning("No Groq API key found - LLM features will use fallback responses")

# Log all relevant settings for debugging
logger.info(f"Supabase URL configured: {bool(settings.supabase_url)}")
logger.info(f"Google API key configured: {bool(settings.google_api_key)}")

# Initialize shared cache and Groq client for structured lessons
_STRUCTURED_LESSON_CACHE = MemoryCacheRepository(default_ttl=1800)
_GROQ_CLIENT = None
if Groq and settings.groq_api_key:
    try:
        _GROQ_CLIENT = Groq(api_key=settings.groq_api_key)
        logger.info("Groq client initialized successfully")
        # Test the client with a simple request
        try:
            test_response = _GROQ_CLIENT.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": "test"}],
                max_tokens=10
            )
            logger.info("Groq client test successful")
        except Exception as test_error:
            logger.error(f"Groq client test failed: {test_error}")
            _GROQ_CLIENT = None  # Set to None if test fails
    except Exception as e:
        logger.error(f"Failed to initialize Groq client: {e}")
        _GROQ_CLIENT = None
else:
    if not Groq:
        logger.warning("Groq library not available")
    if not settings.groq_api_key:
        logger.warning("No Groq API key provided")

_INFLIGHT_LESSONS: dict[str, asyncio.Future] = {}

# Add middleware
app.add_middleware(RateLimitMiddleware)
app.add_middleware(RequestTimingMiddleware)
app.add_middleware(SecurityHeadersMiddleware)

# Add CORS middleware
# Use secure CORS configuration
_allow_origins = settings.cors_origins or ["http://localhost:3001", "https://api.lanamind.com"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    allow_headers=["*"],
)


@app.exception_handler(StarletteHTTPException)
async def _http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": "http_error", "message": exc.detail},
    )


@app.exception_handler(RequestValidationError)
async def _validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"error": "validation_error", "message": "Validation failed", "details": exc.errors()},
    )


@app.exception_handler(Exception)
async def _unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled server error")
    return JSONResponse(
        status_code=500,
        content={"error": "internal_server_error", "message": "Internal server error"},
    )


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
        started = await start_job_workers()
        if started:
            logger.info("Job workers started successfully")
        else:
            logger.info("Job workers skipped")
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
    q: str
    options: List[str]
    answer: str

    @field_validator("q", "answer") 
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
    """Generate a stub lesson with clear error messaging instead of generic templates."""
    logger.info(f"Generating stub lesson for topic: '{topic}' with age: {age}")
    
    # Create a clear error message instead of generic template
    error_message = f"Unable to generate a detailed lesson about '{topic}' at this time. This could be due to high demand or a temporary issue. Please try again later or ask about a different topic."
    
    # Create minimal valid response with clear error messaging
    intro = error_message
    classifications = []
    
    # Create sections with helpful information
    sections = [
        SectionItem(
            title="Service Temporarily Unavailable", 
            content=error_message
        ),
        SectionItem(
            title="Try These Alternatives",
            content="1. Try rephrasing your question\n2. Ask about a different topic\n3. Check back in a few minutes\n4. Contact support if the issue persists"
        )
    ]
    
    # Create a helpful quiz
    quiz = [
        QuizItem(
            q="What should you do when a lesson fails to generate?",
            options=[
                "A) Try rephrasing the question",
                "B) Ask about a different topic", 
                "C) Check back later",
                "D) All of the above"
            ],
            answer="D) All of the above"
        )
    ]
    
    response = StructuredLessonResponse(
        id=str(uuid.uuid4()),  # Generate a unique ID for the lesson
        introduction=intro,
        classifications=classifications,
        sections=sections,
        diagram="",
        quiz=quiz,
    )
    logger.info(f"Stub lesson generated with error messaging for '{topic}'")
    return response


async def _compute_structured_lesson(cache_key: str, topic: str, age: Optional[int]) -> tuple[StructuredLessonResponse, str]:
    """Compute structured lesson using LLM or fallback to stub."""
    if _GROQ_CLIENT is not None:
        raw_excerpt = ""
        try:

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
                "You are lana, a helpful tutor who produces a structured lesson as strict JSON. "
                "Return ONLY valid JSON with these exact keys: "
                "introduction (string), "
                "classifications (array of objects with type and description string fields), "
                "sections (array of objects with title and content string fields), "
                "diagram (string), "
                "quiz_questions (array of objects with question, options array, and answer string fields). "
                "Each quiz question must have exactly 4 options. "
                f"The learner is a {age_str if age_str else 'general audience'}. "
                "Keep each section content at least 100 words. Include 4 quiz questions with 4 options each. "
                "IMPORTANT: Respond ONLY with valid JSON, no markdown code blocks, no extra text, no explanations. "
                "Start your response with '{' and end with '}'. "
                "Example format: {\"introduction\": \"...\", \"classifications\":[{\"type\":\"...\",\"description\":\"...\"}], \"sections\":[{\"title\":\"...\",\"content\":\"...\"}], \"diagram\":\"...\", \"quiz_questions\":[{\"question\":\"...\",\"options\":[\"...\",\"...\",\"...\",\"...\"],\"answer\":\"...\"}]}")

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
            
            # Log the raw response for debugging
            logger.info(f"Raw LLM response for topic '{topic}': {raw_excerpt[:200]}...")

            # Parse JSON - handle markdown code blocks and clean up the response
            import orjson
            import json
            
            # Clean up the response - remove markdown code blocks if present
            clean_excerpt = raw_excerpt.strip()
            
            # More robust markdown removal
            while clean_excerpt.startswith('```'):
                if clean_excerpt.startswith('```json'):
                    clean_excerpt = clean_excerpt[7:].strip()  # Remove ```json
                else:
                    clean_excerpt = clean_excerpt[3:].strip()  # Remove ```
            
            # Remove trailing ```
            while clean_excerpt.endswith('```'):
                clean_excerpt = clean_excerpt[:-3].strip()
            
            # Fix invalid control characters by removing them
            # Remove incorrect escaping logic
            # repaired = repaired.replace('\n', '\\n')
            # repaired = repaired.replace('\r', '\\r')
            # repaired = repaired.replace('\t', '\\t')
            # Only escape unescaped backslashes
            # repaired = re.sub(r'(?<!\\)\\(?!\\)', '\\\\', repaired)
                            
            # Instead, just ensure we have valid JSON by removing any control characters
            # that might cause issues
            import re
            clean_excerpt = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', clean_excerpt)
            
            # Try to parse with orjson first, fallback to json
            try:
                data = orjson.loads(clean_excerpt)
            except Exception as orjson_error:
                try:
                    # Fallback to standard json parser
                    data = json.loads(clean_excerpt)
                except Exception as json_error:
                    # Try to handle incomplete JSON by finding the last complete object
                    try:
                        # Look for the last complete JSON object in the response
                        last_brace = clean_excerpt.rfind('}')
                        if last_brace != -1:
                            truncated = clean_excerpt[:last_brace + 1]
                            data = json.loads(truncated)
                            logger.info(f"Successfully parsed truncated JSON for topic '{topic}'")
                        else:
                            raise
                    except Exception:
                        # Try additional JSON repair techniques
                        try:
                            # Attempt to fix common JSON issues
                            repaired = clean_excerpt
                                                        
                            import re
                                                        
                            # Additional cleanup - remove any remaining markdown artifacts
                            if repaired.startswith('```'):
                                # Remove opening ``` if still present
                                repaired = repaired[3:].strip()
                            if repaired.endswith('```'):
                                # Remove closing ``` if still present
                                repaired = repaired[:-3].strip()
                                                        
                            repaired = re.sub(r'(?<!\\)\\(?!\\)', '\\\\', repaired)
                            
                            repaired = re.sub(r'}\s*{', '},{', repaired)

                            repaired = re.sub(r'}\s*("[^"]+"\s*:)', r'},\1', repaired)
                                                        
                            quote_matches = [m.start() for m in re.finditer('"', repaired)]
                            if len(quote_matches) % 2 != 0:

                                repaired = repaired + '"'
                                                        
                            # Try to parse the repaired JSON
                            data = json.loads(repaired)
                            logger.info(f"Successfully parsed repaired JSON for topic '{topic}'")
                        except Exception as repair_error:
                            # Last resort - try to parse whatever JSON we can get
                            try:
                                # Try to find and parse any valid JSON object in the response
                                import re
                                json_match = re.search(r'\{[^{]*(?:\{[^{]*\}[^{]*)*\}', repaired)
                                if json_match:
                                    potential_json = json_match.group(0)
                                    data = json.loads(potential_json)
                                    logger.info(f"Successfully parsed extracted JSON for topic '{topic}'")
                                else:
                                    raise
                            except Exception:
                                logger.warning(f"Failed to parse JSON with both orjson and json for topic '{topic}'. "
                                              f"orjson error: {orjson_error}, json error: {json_error}, repair error: {repair_error}. "
                                              f"Raw excerpt length: {len(clean_excerpt)}")
                                raise
            
            # Normalize and validate response
            # Handle introduction - could be string or dict with title/text
            intro_data = data.get("introduction", "")
            if isinstance(intro_data, dict):
                # If it's a dict, try to get text or title
                intro_norm = (intro_data.get("text", "") or intro_data.get("title", "") or "").strip()
            else:
                intro_norm = str(intro_data).strip()
            
            # Handle diagram - could be in different fields
            diagram_norm = (data.get("diagram_description", "") or data.get("diagram", "")).strip()
            
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
            
            # Process quiz - handle both 'quiz' and 'quiz_questions' field names
            quiz_data = data.get("quiz", data.get("quiz_questions", []))
            quiz = []
            for q in quiz_data:
                if (isinstance(q, dict) and 
                    "question" in q and 
                    "options" in q and 
                    "answer" in q and  # Changed from "correct_answer" to "answer"
                    len(q["options"]) >= 2):
                    # Handle options that might be objects with an "option" key
                    options = []
                    for opt in q["options"]:
                        if isinstance(opt, dict) and "option" in opt:
                            options.append(str(opt["option"]))
                        else:
                            options.append(str(opt))
                    quiz.append(QuizItem(q=q["question"], options=options, answer=q["answer"]))
                elif (isinstance(q, dict) and 
                      "question" in q and 
                      "options" in q and 
                      "correct_answer" in q and  # Keep backward compatibility
                      len(q["options"]) >= 2):
                    # Handle options that might be objects with an "option" key
                    options = []
                    for opt in q["options"]:
                        if isinstance(opt, dict) and "option" in opt:
                            options.append(str(opt["option"]))
                        else:
                            options.append(str(opt))
                    quiz.append(QuizItem(q=q["question"], options=options, answer=q["correct_answer"]))
                elif (isinstance(q, dict) and 
                      "q" in q and 
                      "options" in q and 
                      "answer" in q and  # Handle 'q' field directly
                      len(q["options"]) >= 2):
                    # Handle options that might be objects with an "option" key
                    options = []
                    for opt in q["options"]:
                        if isinstance(opt, dict) and "option" in opt:
                            options.append(str(opt["option"]))
                        else:
                            options.append(str(opt))
                    quiz.append(QuizItem(q=q["q"], options=options, answer=q["answer"]))
            
            # Quiz items are already created with 'q' field, no need for additional conversion

            resp = StructuredLessonResponse(
                id=str(uuid.uuid4()),
                introduction=intro_norm,
                classifications=classifications,
                sections=sections,
                diagram=diagram_norm,
                quiz=quiz,
            )
            # Accept LLM response if it has at least one section with content
            # This is more lenient to avoid falling back to stubs unnecessarily
            has_minimal_content = (
                resp.sections and len(resp.sections) >= 1 and  # At least 1 section
                any(len(s.content) > 10 for s in resp.sections)  # At least one section with meaningful content
            )
            
            # Log detailed quality metrics for debugging
            logger.info(f"LLM response quality check for '{topic}': "
                       f"Has sections: {bool(resp.sections)}, "
                       f"Has quiz: {bool(resp.quiz)}, "
                       f"Section count: {len(resp.sections) if resp.sections else 0}, "
                       f"Quiz count: {len(resp.quiz) if resp.quiz else 0}")
            
            if resp.sections:
                section_details = [(s.title, len(s.content)) for s in resp.sections]
                logger.info(f"Section details: {section_details}")
            
            if resp.quiz:
                logger.info(f"Quiz questions: {len(resp.quiz)}")
            
            if has_minimal_content:
                try:
                    await _STRUCTURED_LESSON_CACHE.set(cache_key, resp.model_dump(), namespace="lessons")
                    logger.info(f"LLM response for '{topic}' accepted and cached")
                except Exception as cache_error:
                    logger.warning(f"Failed to cache LLM response for '{topic}': {cache_error}")
                return resp, "llm"
            
            # Log when we're falling back to stub due to incomplete or low-quality LLM response
            logger.warning(f"LLM response for '{topic}' was low-quality - falling back to stub. "
                          f"Sections: {len(resp.sections) if resp.sections else 0}, "
                          f"Quiz: {len(resp.quiz) if resp.quiz else 0}, "
                          f"Section quality: {[len(s.content) for s in resp.sections] if resp.sections else []}")
            return await _stub_lesson(topic, age), "stub"
        except Exception as e:
            # Include raw excerpt to aid troubleshooting and reduce persistent stub fallbacks
            try:
                logger.warning(f"Structured lesson LLM error for topic '{topic}': {e}. raw_excerpt={raw_excerpt}")
            except Exception:
                logger.warning(f"Structured lesson LLM error for topic '{topic}': {e}")
            logger.warning(f"Falling back to stub lesson for '{topic}' due to LLM error")
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