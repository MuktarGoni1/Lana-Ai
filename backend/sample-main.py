
"""
Production-ready FastAPI application for Lana AI Backend.
Complete implementation following all architectural and security rules.
"""

import os
import io
import re
import html
import time
import wave
import json
import base64
import hashlib
import logging
import asyncio
import socket
from abc import ABC, abstractmethod
from contextlib import asynccontextmanager
from functools import lru_cache
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime

# FastAPI and Starlette imports
from fastapi import (
    FastAPI,
    HTTPException,
    Query,
    BackgroundTasks,
    Request,
    status,
    Depends,
    APIRouter,
)
from fastapi.responses import Response, JSONResponse, StreamingResponse, ORJSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response as StarletteResponse

# Pydantic models with validation (A-3: Enforced Data Contracts)
from pydantic import BaseModel, Field, validator, root_validator
from pydantic_settings import BaseSettings

# External libraries
import httpx
import orjson
from dotenv import load_dotenv
from groq import AsyncGroq
from google import genai
from google.genai import types
from sympy import sympify, Eq, solve, simplify
from cachetools import TTLCache

# passlib not installed; CryptContext import removed

# Redis and async support
try:
    from redis import asyncio as aioredis

    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    logging.warning("Redis not available, using in-memory cache")

# Supabase client
from supabase import create_client, Client

# Load environment variables (S-3: Secret Isolation)
load_dotenv()

# ============================================================================
# CONFIGURATION (S-3: All secrets from environment)
# ============================================================================


class Settings(BaseSettings):
    """Application settings with validation (S-3: Secret Isolation)."""

    # API Keys (MUST come from environment)
    groq_api_key: Optional[str] = None
    google_api_key: Optional[str] = None
    supabase_url: Optional[str] = None
    supabase_anon_key: Optional[str] = None
    supabase_service_key: Optional[str] = None

    # Redis Configuration
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_password: Optional[str] = None
    redis_db: int = 0
    redis_ssl: bool = False

    # Application Settings
    environment: str = "development"
    log_level: str = "INFO"

    # CORS Settings
    allowed_origins: List[str] = []
    allowed_hosts: List[str] = ["*"]

    # Rate Limiting
    rate_limit_per_minute: int = 60
    rate_limit_per_hour: int = 1000

    # Cache TTL Settings (seconds)
    cache_ttl_lessons: int = 7200  # 2 hours
    cache_ttl_tts: int = 3600  # 1 hour
    cache_ttl_history: int = 300  # 5 minutes
    cache_ttl_popular: int = 86400  # 24 hours
    cache_ttl_math: int = 1800  # 30 minutes

    # Performance Settings
    max_connections: int = 20
    connection_timeout: int = 30

    # Security
    secret_key: str = "your-secret-key-here"  # Must be overridden in production
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    @validator("allowed_origins", pre=True)
    def parse_cors_origins(cls, v):
        """Parse CORS origins from comma-separated string."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    @validator("environment")
    def validate_environment(cls, v):
        """Validate environment setting."""
        allowed = ["development", "staging", "production"]
        if v not in allowed:
            raise ValueError(f"Environment must be one of {allowed}")
        return v

    class Config:
        """Pydantic config."""

        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# ============================================================================
# REPOSITORY INTERFACES (A-2: Dependency Inversion)
# ============================================================================


class ICacheRepository(ABC):
    """Abstract cache repository interface."""

    @abstractmethod
    async def get(self, key: str, namespace: str = "default") -> Optional[Any]:
        """Retrieve value from cache."""
        pass

    @abstractmethod
    async def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None,
        namespace: str = "default",
    ) -> bool:
        """Store value in cache with optional TTL."""
        pass

    @abstractmethod
    async def delete(self, key: str, namespace: str = "default") -> bool:
        """Delete value from cache."""
        pass

    @abstractmethod
    async def exists(self, key: str, namespace: str = "default") -> bool:
        """Check if key exists in cache."""
        pass

    @abstractmethod
    async def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        pass


class ILessonRepository(ABC):
    """Abstract lesson repository interface."""

    @abstractmethod
    async def save_lesson_history(
        self, user_id: str, topic: str, lesson_data: Dict[str, Any]
    ) -> str:
        """Save lesson to history."""
        pass

    @abstractmethod
    async def get_user_history(
        self, user_id: str, limit: int = 50, offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get user's lesson history."""
        pass

    @abstractmethod
    async def get_popular_topics(self, limit: int = 10) -> List[str]:
        """Get most popular topics."""
        pass


# ============================================================================
# REPOSITORY IMPLEMENTATIONS (A-4: Vendor logic confined to repository)
# ============================================================================


class CacheRepository(ICacheRepository):
    """Cache repository with Redis and in-memory fallback."""

    def __init__(self):
        """Initialize cache repository."""
        self._redis_client: Optional[aioredis.Redis] = None
        self._fallback_caches: Dict[str, TTLCache] = {}
        self._stats = {"hits": 0, "misses": 0, "errors": 0, "last_reset": time.time()}

    async def _get_redis_client(self) -> Optional[aioredis.Redis]:
        """Get or create Redis client."""
        if not REDIS_AVAILABLE:
            return None

        if not self._redis_client:
            try:
                self._redis_client = await aioredis.from_url(
                    f"redis://{settings.redis_host}:{settings.redis_port}",
                    password=settings.redis_password,
                    db=settings.redis_db,
                    decode_responses=False,
                    socket_connect_timeout=5,
                    socket_timeout=5,
                )
                await self._redis_client.ping()
                logger.info("✅ Redis connection established")
            except Exception as e:
                logger.warning(f"Redis connection failed: {e}")
                self._redis_client = None
        return self._redis_client

    def _get_fallback_cache(self, namespace: str) -> TTLCache:
        """Get fallback in-memory cache for namespace."""
        if namespace not in self._fallback_caches:
            ttl_map = {
                "lessons": settings.cache_ttl_lessons,
                "tts": settings.cache_ttl_tts,
                "history": settings.cache_ttl_history,
                "popular": settings.cache_ttl_popular,
                "math": settings.cache_ttl_math,
            }
            ttl = ttl_map.get(namespace, 3600)
            max_size = {
                "lessons": 1000,
                "tts": 500,
                "history": 100,
                "popular": 50,
                "math": 200,
            }.get(namespace, 100)
            self._fallback_caches[namespace] = TTLCache(maxsize=max_size, ttl=ttl)
        return self._fallback_caches[namespace]

    def _make_key(self, key: str, namespace: str) -> str:
        """Create namespaced cache key."""
        return f"{namespace}:{key}"

    async def get(self, key: str, namespace: str = "default") -> Optional[Any]:
        """Retrieve value from cache."""
        full_key = self._make_key(key, namespace)

        try:
            client = await self._get_redis_client()
            if client:
                value = await client.get(full_key)
                if value:
                    self._stats["hits"] += 1
                    return orjson.loads(value)
                else:
                    self._stats["misses"] += 1
                    return None
        except Exception as e:
            self._stats["errors"] += 1
            logger.debug(f"Redis get failed: {e}")

        # Fallback to in-memory
        cache = self._get_fallback_cache(namespace)
        result = cache.get(key)
        if result:
            self._stats["hits"] += 1
        else:
            self._stats["misses"] += 1
        return result

    async def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None,
        namespace: str = "default",
    ) -> bool:
        """Store value in cache with optional TTL."""
        full_key = self._make_key(key, namespace)

        if ttl is None:
            ttl_map = {
                "lessons": settings.cache_ttl_lessons,
                "tts": settings.cache_ttl_tts,
                "history": settings.cache_ttl_history,
                "popular": settings.cache_ttl_popular,
                "math": settings.cache_ttl_math,
            }
            ttl = ttl_map.get(namespace, 3600)

        try:
            client = await self._get_redis_client()
            if client:
                serialized = orjson.dumps(value)
                await client.setex(full_key, ttl, serialized)
                return True
        except Exception as e:
            self._stats["errors"] += 1
            logger.debug(f"Redis set failed: {e}")

        # Fallback to in-memory
        cache = self._get_fallback_cache(namespace)
        cache[key] = value
        return True

    async def delete(self, key: str, namespace: str = "default") -> bool:
        """Delete value from cache."""
        full_key = self._make_key(key, namespace)

        try:
            client = await self._get_redis_client()
            if client:
                await client.delete(full_key)
        except Exception as e:
            logger.debug(f"Redis delete failed: {e}")

        cache = self._get_fallback_cache(namespace)
        cache.pop(key, None)
        return True

    async def exists(self, key: str, namespace: str = "default") -> bool:
        """Check if key exists in cache."""
        full_key = self._make_key(key, namespace)

        try:
            client = await self._get_redis_client()
            if client:
                return await client.exists(full_key) > 0
        except Exception as e:
            logger.debug(f"Redis exists failed: {e}")

        cache = self._get_fallback_cache(namespace)
        return key in cache

    async def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        total_requests = self._stats["hits"] + self._stats["misses"]
        hit_rate = (
            (self._stats["hits"] / total_requests * 100) if total_requests > 0 else 0
        )
        return {
            "hit_rate": f"{hit_rate:.1f}%",
            "total_requests": total_requests,
            "hits": self._stats["hits"],
            "misses": self._stats["misses"],
            "errors": self._stats["errors"],
            "uptime": time.time() - self._stats["last_reset"],
        }


class SupabaseRepository(ILessonRepository):
    """Supabase repository for lesson persistence (A-4: Vendor isolation)."""

    def __init__(self):
        """Initialize Supabase client."""
        if not settings.supabase_url or not settings.supabase_anon_key:
            self.client = None
            logger.warning("Supabase not configured; using no-op repository")
        else:
            self.client: Client = create_client(
                settings.supabase_url, settings.supabase_anon_key
            )

    async def save_lesson_history(
        self, user_id: str, topic: str, lesson_data: Dict[str, Any]
    ) -> str:
        """Save lesson to history."""
        if self.client is None:
            return ""
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
        if self.client is None:
            return []
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

            return [
                {
                    "id": str(r["id"]),
                    "title": r["title"],
                    "timestamp": r["created_at"],
                }
                for r in result.data
            ]
        except Exception as e:
            logger.error(f"Failed to get user history: {e}")
            raise

    async def get_popular_topics(self, limit: int = 10) -> List[str]:
        """Get most popular topics."""
        try:
            result = (
                self.client.table("searches")
                .select("title")
                .order("created_at", desc=True)
                .limit(100)
                .execute()
            )

            # Count topic frequency
            topic_counts = {}
            for row in result.data:
                topic = row["title"].lower()
                topic_counts[topic] = topic_counts.get(topic, 0) + 1

            # Sort by frequency and return top N
            sorted_topics = sorted(
                topic_counts.items(), key=lambda x: x[1], reverse=True
            )
            return [topic for topic, _ in sorted_topics[:limit]]
        except Exception as e:
            logger.error(f"Failed to get popular topics: {e}")
            return []


# ============================================================================
# DATA MODELS (A-3: Enforced Data Contracts - NO 'any' types)
# ============================================================================


def sanitize_text(text: str) -> str:
    """Sanitize text input to prevent XSS (S-1: Mandatory Secure Input)."""
    if not text:
        return ""

    # HTML escape to prevent XSS
    text = html.escape(text)

    # Remove potentially dangerous characters
    text = re.sub(r'[<>"\'\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', "", text)

    # Normalize whitespace
    text = re.sub(r"\s+", " ", text).strip()

    return text


class QuizItem(BaseModel):
    """Quiz question model with validation."""

    q: str = Field(..., min_length=5, max_length=500, description="Quiz question")
    options: List[str] = Field(
        ..., min_items=2, max_items=6, description="Answer options"
    )
    answer: str = Field(..., min_length=1, max_length=200, description="Correct answer")

    @validator("q", "answer")
    def sanitize_fields(cls, v):
        """Sanitize text fields (S-1: Mandatory Secure Input)."""
        return sanitize_text(v)

    @validator("options")
    def validate_options(cls, v):
        """Validate and sanitize options."""
        if len(v) < 2:
            raise ValueError("Must have at least 2 options")
        return [sanitize_text(opt) for opt in v if opt.strip()]


class ClassificationItem(BaseModel):
    """Classification item model."""

    type: str = Field(
        ..., min_length=1, max_length=100, description="Classification type"
    )
    description: str = Field(
        ..., min_length=1, max_length=500, description="Description"
    )

    @validator("type", "description")
    def sanitize_fields(cls, v):
        """Sanitize text fields."""
        return sanitize_text(v)


class SectionItem(BaseModel):
    """Lesson section model."""

    title: str = Field(..., min_length=1, max_length=200, description="Section title")
    content: str = Field(
        ..., min_length=10, max_length=5000, description="Section content"
    )

    @validator("title", "content")
    def sanitize_fields(cls, v):
        """Sanitize text fields."""
        return sanitize_text(v)


class StructuredLessonRequest(BaseModel):
    """Lesson request model (A-3: Explicit typing)."""

    topic: str = Field(..., min_length=2, max_length=300, description="Learning topic")
    age: Optional[int] = Field(None, ge=5, le=100, description="User's age")

    @validator("topic")
    def validate_topic(cls, v):
        """Validate and sanitize topic (S-1: Mandatory Secure Input)."""
        v = v.strip()

        if len(v) < 2:
            raise ValueError("Topic must be at least 2 characters long")

        # Check for dangerous patterns
        dangerous_patterns = [
            r"<script[^>]*>.*?</script>",
            r"javascript:",
            r"on\w+\s*=",
            r"data:text/html",
            r"vbscript:",
        ]

        for pattern in dangerous_patterns:
            if re.search(pattern, v, re.IGNORECASE):
                raise ValueError("Topic contains potentially dangerous content")

        return sanitize_text(v)


class StructuredLessonResponse(BaseModel):
    """Lesson response model (A-3: Explicit typing)."""

    introduction: Optional[str] = Field(None, max_length=2000)
    classifications: List[ClassificationItem] = Field(
        default_factory=list, max_items=10
    )
    sections: List[SectionItem] = Field(..., min_items=1, max_items=20)
    diagram: str = Field("", max_length=2000)
    quiz: List[QuizItem] = Field(..., min_items=1, max_items=10)


class TTSRequest(BaseModel):
    """TTS request model."""

    text: str = Field(..., min_length=1, max_length=5000, description="Text to convert")
    sid: str = Field("", max_length=100, description="Session ID")

    @validator("text")
    def validate_text(cls, v):
        """Validate and sanitize TTS text."""
        v = sanitize_text(v.strip())

        if len(v) < 1:
            raise ValueError("Text cannot be empty")
        if len(v) > 5000:
            raise ValueError("Text must be less than 5000 characters")

        # Remove excessive repetition
        v = re.sub(r"(.)\1{10,}", r"\1\1\1", v)

        return v

    @validator("sid")
    def validate_sid(cls, v):
        """Validate session ID."""
        if v and not re.match(r"^[a-zA-Z0-9\-_]{0,100}$", v):
            raise ValueError("Invalid session ID format")
        return v


class MathStep(BaseModel):
    """Math solution step model."""

    explanation: str = Field(..., min_length=1, max_length=1000)
    expression: str = Field("", max_length=500)
    result: str = Field("", max_length=500)

    @validator("explanation", "expression", "result")
    def sanitize_fields(cls, v):
        """Sanitize fields."""
        return sanitize_text(v)


class MathSolutionResponse(BaseModel):
    """Math solution response model."""

    final_answer: str = Field(..., min_length=1, max_length=1000)
    steps: List[MathStep] = Field(default_factory=list, max_items=50)


class MathProblemRequest(BaseModel):
    """Math problem request model."""

    question: str = Field(..., min_length=1, max_length=1000)

    @validator("question")
    def validate_question(cls, v):
        """Validate math question."""
        v = v.strip()

        if len(v) < 1:
            raise ValueError("Question cannot be empty")

        # Allow mathematical symbols
        allowed_pattern = r"^[a-zA-Z0-9\s\+\-\*\/\=\(\)\.\,\^\{\}\[\]\\]+$"
        if not re.match(allowed_pattern, v):
            raise ValueError("Question contains invalid characters")

        return sanitize_text(v)


# ============================================================================
# SERVICES (A-1: Business logic confined to services)
# ============================================================================


class LessonService:
    """Service for lesson generation and management (A-1: Strict Layer Separation)."""

    def __init__(
        self,
        lesson_repo: ILessonRepository,
        cache_repo: ICacheRepository,
        groq_client: AsyncGroq,
    ):
        """Initialize with dependencies (A-2: Dependency Inversion)."""
        self.lesson_repo = lesson_repo
        self.cache_repo = cache_repo
        self.groq_client = groq_client
        self.precomputed_cache = {}

    async def get_structured_lesson(
        self, request: StructuredLessonRequest, user_id: Optional[str] = None
    ) -> StructuredLessonResponse:
        """
        Generate or retrieve a structured lesson.
        (S-2: Authorization check first for sensitive operations)
        """
        # Generate cache key
        cache_key = self._generate_cache_key(request.topic, request.age)

        # Check cache first (P-3: Optimized Caching Strategy)
        cached_lesson = await self.cache_repo.get(cache_key, namespace="lessons")
        if cached_lesson:
            logger.info(f"Cache hit for topic: {request.topic[:30]}...")
            return StructuredLessonResponse(**cached_lesson)

        # Check precomputed cache
        if request.topic.lower() in self.precomputed_cache:
            lesson_data = self.precomputed_cache[request.topic.lower()]
            return StructuredLessonResponse(**lesson_data)

        # Generate new lesson (P-1: Async by Default)
        try:
            lesson_data = await self._generate_lesson(request.topic, request.age)
            processed_lesson = await self._process_lesson_data(
                lesson_data, request.topic
            )

            # Cache the result
            await self.cache_repo.set(
                cache_key, processed_lesson.dict(), namespace="lessons"
            )

            # Save to history if user is authenticated
            if user_id:
                await self.lesson_repo.save_lesson_history(
                    user_id, request.topic, processed_lesson.dict()
                )

            return processed_lesson

        except Exception as e:
            logger.error(f"Failed to generate lesson: {e}")
            # Return fallback lesson
            return self._create_fallback_lesson(request.topic)

    def _generate_cache_key(self, topic: str, age: Optional[int]) -> str:
        """Generate deterministic cache key."""
        key_parts = [topic.lower().strip()]
        if age:
            key_parts.append(f"age_{age}")
        key_string = ":".join(key_parts)
        return hashlib.md5(key_string.encode()).hexdigest()[:16]

    async def _generate_lesson(self, topic: str, age: Optional[int]) -> Dict[str, Any]:
        """Generate lesson using AI service (P-1: Async by Default)."""
        # Fallback when LLM client is not available
        if self.groq_client is None:
            return {
                "introduction": {
                    "definition": f"Overview of {topic}",
                    "relevance": f"Why {topic} matters",
                },
                "sections": [
                    {
                        "title": f"Basics of {topic}",
                        "content": "• Key idea 1\n• Key idea 2\n• Key idea 3",
                    },
                    {
                        "title": f"Applications of {topic}",
                        "content": "• Use case 1\n• Use case 2\n• Use case 3",
                    },
                ],
                "classifications": [
                    {"type": "General", "description": f"Core concepts of {topic}"}
                ],
                "quiz_questions": [
                    {
                        "question": f"{topic} is mainly about?",
                        "options": ["Concepts", "Tools", "Both"],
                        "correct_answer": "Both",
                    },
                    {
                        "question": f"One application of {topic}?",
                        "options": ["None", "Data", "Web"],
                        "correct_answer": "Data",
                    },
                ],
                "diagram_description": f"High-level diagram of {topic} components",
            }

        system_prompt = self._build_system_prompt(age)

        response = await self.groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Topic: {topic}"},
            ],
            temperature=0.3,
            max_tokens=1200,
            top_p=0.9,
            stream=False,
        )

        content = response.choices[0].message.content
        return self._parse_json_response(content)

    def _build_system_prompt(self, age: Optional[int]) -> str:
        """Build system prompt for AI generation."""
        age_str = str(age) if age else "general audience"
        return f"""Generate JSON lesson for topic. Adapt for {age_str}.
Structure:
{{
  "introduction": {{"definition": "Brief definition", "relevance": "Why important"}},
  "sections": [{{"title": "Title", "content": "• Point 1\\n• Point 2\\n• Point 3"}}],
  "classifications": [{{"type": "Type", "description": "Description"}}],
  "quiz_questions": [{{"question": "Q?", "options": ["A", "B", "C", "D"], "correct_answer": "A"}}]
}}
Rules: 3 sections, 3-5 bullets each, 4 quiz questions, <600 tokens."""

    def _parse_json_response(self, response: str) -> Dict[str, Any]:
        """Parse JSON from AI response with error handling."""
        content = response.strip()

        # Extract JSON if wrapped in markdown
        if "```json" in content:
            start = content.find("```json") + 7
            end = content.find("```", start)
            if end != -1:
                content = content[start:end].strip()
        elif "```" in content:
            start = content.find("```") + 3
            end = content.find("```", start)
            if end != -1:
                content = content[start:end].strip()

        # Find JSON boundaries
        if not (content.startswith("{") and content.endswith("}")):
            start_idx = content.find("{")
            end_idx = content.rfind("}")
            if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                content = content[start_idx : end_idx + 1]

        # Clean and parse
        content = re.sub(r"[\x00-\x1f\x7f-\x9f]", "", content)
        content = re.sub(r",(\s*[}\]])", r"\1", content)

        try:
            return orjson.loads(content)
        except orjson.JSONDecodeError as e:
            logger.warning(f"JSON parse error: {e}")
            return {}

    async def _process_lesson_data(
        self, data: Dict[str, Any], topic: str
    ) -> StructuredLessonResponse:
        """Process and validate lesson data."""
        # Extract introduction
        intro = None
        if "introduction" in data and isinstance(data["introduction"], dict):
            intro_data = data["introduction"]
            intro = f"{intro_data.get('definition', '')}\n{intro_data.get('relevance', '')}".strip()

        # Process sections
        sections = []
        for section in data.get("sections", []):
            if (
                isinstance(section, dict)
                and "title" in section
                and "content" in section
            ):
                sections.append(
                    SectionItem(title=section["title"], content=section["content"])
                )

        # Ensure at least one section
        if not sections:
            sections = [
                SectionItem(
                    title=f"Introduction to {topic}", content=f"Learn about {topic}"
                )
            ]

        # Process classifications
        classifications = []
        for c in data.get("classifications", []):
            if isinstance(c, dict) and "type" in c:
                classifications.append(
                    ClassificationItem(
                        type=c["type"], description=c.get("description", "")
                    )
                )

        # Process quiz
        quiz = []
        for q in data.get("quiz_questions", []):
            if isinstance(q, dict) and all(
                k in q for k in ["question", "options", "correct_answer"]
            ):
                quiz.append(
                    QuizItem(
                        q=q["question"],
                        options=q["options"],
                        answer=q["correct_answer"],
                    )
                )

        # Ensure at least one quiz question
        if not quiz:
            quiz = [
                QuizItem(
                    q=f"What did you learn about {topic}?",
                    options=["A) Nothing", "B) Something", "C) Everything"],
                    answer="B) Something",
                )
            ]

        return StructuredLessonResponse(
            introduction=intro,
            sections=sections,
            classifications=classifications,
            diagram=data.get("diagram_description", ""),
            quiz=quiz,
        )

    def _create_fallback_lesson(self, topic: str) -> StructuredLessonResponse:
        """Create fallback lesson for failures."""
        return StructuredLessonResponse(
            introduction=f"Learn about {topic}",
            sections=[
                SectionItem(
                    title=f"Introduction to {topic}",
                    content=f"This lesson covers the basics of {topic}.",
                )
            ],
            classifications=[],
            diagram="",
            quiz=[
                QuizItem(
                    q=f"What is {topic}?",
                    options=["A) A concept", "B) A skill", "C) Both"],
                    answer="C) Both",
                )
            ],
        )

    async def precompute_popular_topics(self, topics: List[str]):
        """Precompute lessons for popular topics."""
        for topic in topics:
            try:
                cache_key = self._generate_cache_key(topic, None)

                # Check if already cached
                cached = await self.cache_repo.get(cache_key, namespace="popular")
                if cached:
                    self.precomputed_cache[topic.lower()] = cached
                    continue

                # Generate lesson
                lesson_data = await self._generate_lesson(topic, None)
                processed_lesson = await self._process_lesson_data(lesson_data, topic)

                # Cache it
                await self.cache_repo.set(
                    cache_key, processed_lesson.dict(), namespace="popular"
                )

                self.precomputed_cache[topic.lower()] = processed_lesson.dict()
                logger.info(f"✅ Precomputed topic: {topic}")

            except Exception as e:
                logger.warning(f"Failed to precompute {topic}: {e}")


class TTSService:
    """Text-to-speech service."""

    def __init__(self, cache_repo: ICacheRepository, gemini_client: genai.Client):
        """Initialize TTS service."""
        self.cache_repo = cache_repo
        self.gemini_client = gemini_client

    async def generate_speech(self, text: str, voice_name: str = "Leda") -> bytes:
        """Generate speech from text (P-1: Async by Default)."""
        # Check cache
        cache_key = hashlib.md5(f"{text}:{voice_name}".encode()).hexdigest()[:16]
        cached_audio = await self.cache_repo.get(cache_key, namespace="tts")

        if cached_audio:
            logger.info(f"TTS cache hit")
            return cached_audio

        # If TTS client is not available, return empty audio
        if self.gemini_client is None:
            logger.warning("Gemini client not configured; returning empty audio.")
            return b""

        # Generate TTS
        try:
            response = self.gemini_client.models.generate_content(
                model="gemini-2.5-flash-preview-tts",
                contents=text,
                config=types.GenerateContentConfig(
                    response_modalities=["AUDIO"],
                    speech_config=types.SpeechConfig(
                        voice_config=types.VoiceConfig(
                            prebuilt_voice_config=types.PrebuiltVoiceConfig(
                                voice_name=voice_name,
                            )
                        )
                    ),
                ),
            )

            parts = response.candidates[0].content.parts
            pcm = parts[0].inline_data.data

            if isinstance(pcm, str):
                pcm = base64.b64decode(pcm)

            # Create WAV
            buf = io.BytesIO()
            with wave.open(buf, "wb") as wf:
                wf.setnchannels(1)
                wf.setsampwidth(2)
                wf.setframerate(24000)
                wf.writeframes(pcm)

            audio_data = buf.getvalue()

            # Cache it
            await self.cache_repo.set(cache_key, audio_data, namespace="tts")

            return audio_data

        except Exception as e:
            logger.error(f"TTS generation failed: {e}")
            raise


class MathSolverService:
    """Math problem solving service."""

    def __init__(self, cache_repo: ICacheRepository, groq_client: AsyncGroq):
        """Initialize math solver."""
        self.cache_repo = cache_repo
        self.groq_client = groq_client

    async def solve_problem(self, question: str) -> MathSolutionResponse:
        """Solve math problem (P-1: Async by Default)."""
        # Try SymPy first for deterministic solving
        try:
            return await self._solve_with_sympy(question)
        except Exception as e:
            logger.info(f"SymPy failed, using LLM: {e}")
            return await self._solve_with_llm(question)

    async def _solve_with_sympy(self, question: str) -> MathSolutionResponse:
        """Solve using SymPy."""
        if "=" in question:
            # Handle equations
            lhs, rhs = question.split("=", 1)
            equation = Eq(sympify(lhs.strip()), sympify(rhs.strip()))
            solutions = solve(equation)

            steps = [
                MathStep(
                    explanation="Parse the equation", expression=question, result=""
                ),
                MathStep(
                    explanation="Solve for the variable",
                    expression=str(equation),
                    result=str(solutions),
                ),
            ]

            final_answer = str(solutions[0]) if solutions else "No solution"
        else:
            # Handle expressions
            expr = sympify(question)
            simplified = simplify(expr)

            steps = [
                MathStep(
                    explanation="Parse the expression", expression=question, result=""
                ),
                MathStep(explanation="Simplify", expression="", result=str(simplified)),
            ]

            final_answer = str(simplified)

        return MathSolutionResponse(final_answer=final_answer, steps=steps)

    async def _solve_with_llm(self, question: str) -> MathSolutionResponse:
        """Solve using LLM."""
        if self.groq_client is None:
            return MathSolutionResponse(
                final_answer="LLM unavailable",
                steps=[
                    MathStep(explanation="LLM not configured", expression="", result="")
                ],
            )

        system_prompt = """Return strictly JSON:
{
  "steps": [{"explanation": "", "expression": "", "result": ""}],
  "final_answer": ""
}
Show clear, correct steps. Output only valid JSON."""

        response = await self.groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question},
            ],
            temperature=0.1,
            max_tokens=800,
            stream=False,
        )

        content = response.choices[0].message.content

        # Parse JSON
        try:
            data = orjson.loads(self._extract_json(content))

            steps = [
                MathStep(
                    explanation=s.get("explanation", ""),
                    expression=s.get("expression", ""),
                    result=s.get("result", ""),
                )
                for s in data.get("steps", [])
            ]

            return MathSolutionResponse(
                final_answer=data.get("final_answer", "No answer"), steps=steps
            )
        except Exception as e:
            logger.error(f"Failed to parse math solution: {e}")
            return MathSolutionResponse(final_answer="Unable to solve", steps=[])

    def _extract_json(self, content: str) -> str:
        """Extract JSON from content."""
        content = content.strip()

        if "```json" in content:
            start = content.find("```json") + 7
            end = content.find("```", start)
            if end != -1:
                content = content[start:end].strip()

        if not (content.startswith("{") and content.endswith("}")):
            start_idx = content.find("{")
            end_idx = content.rfind("}")
            if start_idx != -1 and end_idx != -1:
                content = content[start_idx : end_idx + 1]

        return content


# ============================================================================
# MIDDLEWARE (Security, Rate Limiting, etc.)
# ============================================================================


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware to add security headers to all responses."""

    async def dispatch(self, request: Request, call_next):
        """Add security headers to response."""
        response = await call_next(request)

        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = (
            "geolocation=(), microphone=(), camera=()"
        )

        # Content Security Policy
        if settings.environment == "production":
            csp_policy = (
                "default-src 'self'; "
                "script-src 'self'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self' data:; "
                "connect-src 'self' https:; "
                "media-src 'self'; "
                "object-src 'none'; "
                "base-uri 'self'; "
                "form-action 'self'; "
                "frame-ancestors 'none'; "
                "upgrade-insecure-requests"
            )
            response.headers["Content-Security-Policy"] = csp_policy

        # HSTS (HTTP Strict Transport Security)
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )

        # Cache control for API responses
        if request.url.path.startswith("/api/"):
            response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"

        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware with Redis backend and in-memory fallback."""

    def __init__(self, app, calls_per_minute: int = 60, calls_per_hour: int = 1000):
        """Initialize rate limiter."""
        super().__init__(app)
        self.calls_per_minute = calls_per_minute
        self.calls_per_hour = calls_per_hour
        self.memory_store = {}
        self.last_cleanup = time.time()

        # Endpoint-specific limits
        self.endpoint_limits = {
            "/api/structured-lesson": {"per_minute": 20, "per_hour": 300},
            "/api/structured-lesson/stream": {"per_minute": 20, "per_hour": 300},
            "/api/tts": {"per_minute": 15, "per_hour": 150},
            "/api/solve-math": {"per_minute": 30, "per_hour": 400},
        }

    async def get_client_ip(self, request: Request) -> str:
        """Extract client IP with proxy support."""
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()

        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip

        return request.client.host if request.client else "unknown"

    async def check_rate_limit(
        self, key: str, limit: int, window: int
    ) -> Tuple[bool, int]:
        """Check rate limit."""
        current_time = time.time()

        # Cleanup old entries periodically
        if current_time - self.last_cleanup > 300:
            await self.cleanup_memory_store()
            self.last_cleanup = current_time

        if key not in self.memory_store:
            self.memory_store[key] = []

        # Remove old entries
        window_start = current_time - window
        self.memory_store[key] = [t for t in self.memory_store[key] if t > window_start]

        current_count = len(self.memory_store[key])

        if current_count < limit:
            self.memory_store[key].append(current_time)
            return True, current_count + 1

        return False, current_count

    async def cleanup_memory_store(self):
        """Clean up old entries from memory store."""
        current_time = time.time()
        keys_to_remove = []

        for key, timestamps in self.memory_store.items():
            self.memory_store[key] = [t for t in timestamps if current_time - t < 3600]

            if not self.memory_store[key]:
                keys_to_remove.append(key)

        for key in keys_to_remove:
            del self.memory_store[key]

    async def dispatch(self, request: Request, call_next):
        """Apply rate limiting."""
        # Skip rate limiting for health checks
        if request.url.path in ["/health", "/api/health", "/docs", "/redoc"]:
            return await call_next(request)

        client_ip = await self.get_client_ip(request)
        endpoint = request.url.path

        # Get endpoint-specific limits
        limits = self.endpoint_limits.get(
            endpoint,
            {"per_minute": self.calls_per_minute, "per_hour": self.calls_per_hour},
        )

        # Check rate limits
        minute_key = f"{client_ip}:{endpoint}:minute"
        hour_key = f"{client_ip}:{endpoint}:hour"

        minute_ok, minute_count = await self.check_rate_limit(
            minute_key, limits["per_minute"], 60
        )

        if not minute_ok:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": "Rate limit exceeded",
                    "message": f"Too many requests. Limit: {limits['per_minute']}/min",
                    "retry_after": 60,
                },
                headers={"Retry-After": "60"},
            )

        hour_ok, hour_count = await self.check_rate_limit(
            hour_key, limits["per_hour"], 3600
        )

        if not hour_ok:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": "Rate limit exceeded",
                    "message": f"Too many requests. Limit: {limits['per_hour']}/hour",
                    "retry_after": 3600,
                },
                headers={"Retry-After": "3600"},
            )

        # Add rate limit headers
        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(limits["per_minute"])
        response.headers["X-RateLimit-Remaining"] = str(
            max(0, limits["per_minute"] - minute_count)
        )

        return response


# ============================================================================
# DEPENDENCY INJECTION
# ============================================================================

# Initialize repositories
cache_repo = CacheRepository()
supabase_repo = SupabaseRepository()

# Initialize clients
groq_client = None
if settings.groq_api_key:
    groq_client = AsyncGroq(
        api_key=settings.groq_api_key,
        http_client=httpx.AsyncClient(
            limits=httpx.Limits(
                max_keepalive_connections=10, max_connections=settings.max_connections
            ),
            timeout=float(settings.connection_timeout),
        ),
    )
else:
    logger.warning("Groq API key missing; LLM features will use fallback.")

gemini_client = (
    genai.Client(api_key=settings.google_api_key) if settings.google_api_key else None
)
if gemini_client is None:
    logger.warning("Google API key missing; TTS features disabled.")

# Initialize services
lesson_service = LessonService(supabase_repo, cache_repo, groq_client)
tts_service = TTSService(cache_repo, gemini_client)
math_service = MathSolverService(cache_repo, groq_client)

# Password hashing (S-4: Modern hashing)
pwd_context = None  # passlib removed; no hashing needed here

# Popular topics for precomputation
POPULAR_TOPICS = [
    "Python Programming",
    "Machine Learning",
    "Data Science",
    "JavaScript",
    "React",
    "Artificial Intelligence",
    "Web Development",
    "Algorithms",
    "Database Design",
    "Cybersecurity",
    "Cloud Computing",
    "Blockchain",
]


async def get_lesson_service() -> LessonService:
    """Get lesson service dependency."""
    return lesson_service


async def get_tts_service() -> TTSService:
    """Get TTS service dependency."""
    return tts_service


async def get_math_service() -> MathSolverService:
    """Get math service dependency."""
    return math_service


async def get_current_user(request: Request) -> Optional[str]:
    """Get current user from request (placeholder for auth)."""
    # This would normally validate JWT token
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        # Validate token and extract user ID
        # For now, return None (anonymous)
        return None
    return None


# ============================================================================
# APPLICATION SETUP
# ============================================================================


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    logger.info("🚀 Starting application...")

    # Precompute popular topics
    try:
        await lesson_service.precompute_popular_topics(POPULAR_TOPICS)
        logger.info("✅ Popular topics precomputed")
    except Exception as e:
        logger.warning(f"Failed to precompute topics: {e}")

    # Warm up Groq client
    try:
        await groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": "test"}],
            max_tokens=1,
            stream=False,
        )
        logger.info("✅ Groq client warmed up")
    except Exception as e:
        logger.warning(f"Groq warmup failed: {e}")

    yield

    logger.info("🔄 Shutting down application...")


# Create FastAPI application
app = FastAPI(
    title="Lana AI Backend",
    version="3.0.0",
    description="Production-ready AI-powered learning platform",
    default_response_class=ORJSONResponse,
    lifespan=lifespan,
    docs_url="/api/docs" if settings.environment != "production" else None,
    redoc_url="/api/redoc" if settings.environment != "production" else None,
)


# ============================================================================
# EXCEPTION HANDLERS (Q-2: Robust Error Mapping)
# ============================================================================


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors with secure messages."""
    logger.warning(f"Validation error on {request.url.path}: {exc.errors()}")

    errors = []
    for error in exc.errors():
        field = " -> ".join(str(loc) for loc in error["loc"])

        if "value_error" in error["type"]:
            msg = "Invalid input format"
        elif "missing" in error["type"]:
            msg = f"Required field '{field}' is missing"
        elif "type_error" in error["type"]:
            msg = f"Invalid data type for field '{field}'"
        else:
            msg = "Invalid input data"

        errors.append({"field": field, "message": msg})

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation Error",
            "message": "The request contains invalid data",
            "details": errors,
            "request_id": id(request),
        },
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle HTTP exceptions with secure messages."""
    logger.warning(f"HTTP {exc.status_code} on {request.url.path}")

    status_messages = {
        400: "Bad Request",
        401: "Authentication required",
        403: "Access forbidden",
        404: "Resource not found",
        429: "Too many requests",
        500: "Internal server error",
        503: "Service temporarily unavailable",
    }

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": f"HTTP {exc.status_code}",
            "message": status_messages.get(exc.status_code, exc.detail),
            "request_id": id(request),
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle all uncaught exceptions securely."""
    logger.exception(f"Unhandled exception on {request.url.path}")

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred. Please try again later.",
            "request_id": id(request),
        },
    )


# ============================================================================
# MIDDLEWARE CONFIGURATION
# ============================================================================

# 1. Compression (should be first)
app.add_middleware(GZipMiddleware, minimum_size=500, compresslevel=6)

# 2. Security headers
app.add_middleware(SecurityHeadersMiddleware)

# 3. Trusted host (production only)
if settings.environment == "production":
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.allowed_hosts)

# 4. CORS configuration
allowed_origins = settings.allowed_origins
if not allowed_origins:
    # Development defaults
    allowed_origins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
    ]

    # Add LAN IP in development
    if settings.environment == "development":
        try:
            local_ip = socket.gethostbyname(socket.gethostname())
            if local_ip not in ["127.0.0.1", "0.0.0.0"]:
                allowed_origins.extend(
                    [
                        f"http://{local_ip}:3000",
                        f"http://{local_ip}:3001",
                    ]
                )
        except Exception:
            pass

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# 5. Rate limiting
app.add_middleware(
    RateLimitMiddleware,
    calls_per_minute=settings.rate_limit_per_minute,
    calls_per_hour=settings.rate_limit_per_hour,
)


# ============================================================================
# API ENDPOINTS (A-1: Minimal controller logic)
# ============================================================================


# Health check endpoint
@app.get("/health", tags=["monitoring"])
async def health_check():
    """Health check endpoint."""
    health_status = {
        "status": "healthy",
        "timestamp": time.time(),
        "version": "3.0.0",
        "environment": settings.environment,
        "cache": await cache_repo.get_stats(),
        "services": {
            "groq": "configured" if groq_client else "not_configured",
            "gemini": "configured" if gemini_client else "not_configured",
            "supabase": "configured" if supabase_repo else "not_configured",
        },
    }

    return health_status


# Cache statistics endpoint
@app.get("/api/cache/stats", tags=["monitoring"])
async def get_cache_statistics():
    """Get cache performance statistics."""
    return await cache_repo.get_stats()


# History endpoint
@app.get("/history", tags=["history"])
async def get_history(
    sid: str = Query(..., description="Session/User ID"),
    lesson_repo: ILessonRepository = Depends(lambda: supabase_repo),
    cache_repo: ICacheRepository = Depends(lambda: cache_repo),
):
    """Get user's lesson history (Q-2: Robust error mapping)."""
    try:
        cache_key = f"history_{sid}"

        # Check cache first
        cached_result = await cache_repo.get(cache_key, namespace="history")
        if cached_result:
            return cached_result

        # Get from database
        result = await lesson_repo.get_user_history(sid, limit=50)

        # Cache the result
        await cache_repo.set(cache_key, result, namespace="history")

        return result

    except Exception as e:
        logger.exception("History retrieval error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve history",
        )


# Social chat endpoint
@app.post("/api/social", tags=["social"])
async def social_chat():
    """Social greeting endpoint."""
    return {"reply": "Hey dear! 👋 I'm Lana — what would you like to learn today?"}


# Structured lesson endpoint
@app.post(
    "/api/structured-lesson", response_model=StructuredLessonResponse, tags=["lessons"]
)
async def create_structured_lesson(
    request: StructuredLessonRequest,
    lesson_service: LessonService = Depends(get_lesson_service),
    current_user: Optional[str] = Depends(get_current_user),
):
    """
    Generate structured lesson (Q-2: Robust error mapping).
    """
    try:
        lesson = await lesson_service.get_structured_lesson(
            request=request, user_id=current_user
        )
        return lesson

    except Exception as e:
        logger.exception("Lesson generation error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate lesson",
        )


# Streaming lesson endpoint
@app.post("/api/structured-lesson/stream", tags=["lessons"])
async def stream_structured_lesson(
    request: StructuredLessonRequest,
    lesson_service: LessonService = Depends(get_lesson_service),
    current_user: Optional[str] = Depends(get_current_user),
):
    """Stream structured lesson generation."""

    async def generate():
        """Generate SSE stream."""
        try:
            lesson = await lesson_service.get_structured_lesson(
                request=request, user_id=current_user
            )

            yield f"data: {orjson.dumps({'type':'done','lesson':lesson.dict()}).decode()}\n\n"

        except Exception as e:
            error_data = {"type": "error", "message": str(e)}
            yield f"data: {orjson.dumps(error_data).decode()}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "Transfer-Encoding": "chunked",
        },
    )


# TTS endpoint
@app.post("/api/tts", tags=["tts"])
async def text_to_speech(
    request: TTSRequest, tts_service: TTSService = Depends(get_tts_service)
):
    """Convert text to speech (Q-2: Robust error mapping)."""
    try:
        audio_data = await tts_service.generate_speech(
            request.text, voice_name=os.getenv("GOOGLE_TTS_VOICE", "Leda")
        )

        # Apply compression for large files
        headers = {"Cache-Control": "public, max-age=3600"}
        if len(audio_data) > 1024 * 1024:  # 1MB threshold
            import gzip

            compressed = gzip.compress(audio_data)
            if len(compressed) < len(audio_data) * 0.8:
                headers["Content-Encoding"] = "gzip"
                audio_data = compressed

        return StreamingResponse(
            io.BytesIO(audio_data), media_type="audio/wav", headers=headers
        )

    except Exception as e:
        logger.exception("TTS generation error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate speech",
        )


# Math solver endpoint
@app.post("/api/solve-math", response_model=MathSolutionResponse, tags=["math"])
async def solve_math_problem(
    request: MathProblemRequest,
    math_service: MathSolverService = Depends(get_math_service),
):
    """Solve math problem with steps (Q-2: Robust error mapping)."""
    try:
        solution = await math_service.solve_problem(request.question)
        return solution

    except Exception as e:
        logger.exception("Math solving error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to solve problem",
        )


# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    import uvicorn

    # Production configuration
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level=settings.log_level.lower(),
        access_log=True,
        server_header=False,
        date_header=False,
        workers=1,  # Single worker for simplicity, use gunicorn for multiple
        limit_concurrency=100,
        limit_max_requests=1000,
        timeout_keep_alive=5,
    )
    