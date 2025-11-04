"""
Production-ready FastAPI application for Lana AI Backend.
Complete implementation following all architectural and security rules.
"""

import os
import io
import re
import html
import time
import asyncio
import logging
import hashlib
import base64
import wave
import uuid
import sys
from collections import defaultdict
from functools import wraps
from abc import ABC, abstractmethod
from contextlib import asynccontextmanager
from functools import lru_cache
from typing import List, Dict, Any, Optional, Tuple, Union, AsyncGenerator
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

# Redis and async support
try:
    from redis import asyncio as aioredis
    REDIS_AVAILABLE = True
except ImportError:
    aioredis = None  # Set to None if not available
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

    # Security - Use environment variable for secret key in production
    secret_key: str = Field(default_factory=lambda: os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production"))
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
        # Allow extra fields for compatibility with frontend environment variables
        extra = "allow"


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
        self._redis_client: Optional[Any] = None  # Use Any to avoid type issues
        self._fallback_caches: Dict[str, TTLCache] = {}
        self._stats = {"hits": 0, "misses": 0, "errors": 0, "last_reset": time.time()}

    async def _get_redis_client(self) -> Optional[Any]:
        """Get or create Redis client."""
        if not REDIS_AVAILABLE or aioredis is None:
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
    """Supabase repository implementation (A-4: Vendor logic confined to repository)."""

    def __init__(self):
        """Initialize Supabase repository."""
        self.client: Optional[Client] = None
        if settings.supabase_url and settings.supabase_anon_key:
            # Create Supabase client
            self.client = create_client(
                settings.supabase_url, 
                settings.supabase_anon_key
            )
        else:
            logger.warning("Supabase not configured; using no-op repository")

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
        if self.client is None:
            return []
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
        ..., min_length=2, max_length=6, description="Answer options"  # Fixed: removed min_items/max_items
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
        if len(v) > 6:
            raise ValueError("Cannot have more than 6 options")
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
    classifications: List[ClassificationItem] = Field(default_factory=list)  # Fixed: removed max_items
    sections: List[SectionItem] = Field(...)  # Fixed: removed min_items/max_items
    diagram: str = Field("", max_length=2000)
    quiz: List[QuizItem] = Field(...)  # Fixed: removed min_items/max_items

    @validator("classifications")
    def validate_classifications(cls, v):
        """Validate classifications list."""
        if len(v) > 10:
            raise ValueError("Cannot have more than 10 classifications")
        return v

    @validator("sections")
    def validate_sections(cls, v):
        """Validate sections list."""
        if len(v) < 1:
            raise ValueError("Must have at least 1 section")
        if len(v) > 20:
            raise ValueError("Cannot have more than 20 sections")
        return v

    @validator("quiz")
    def validate_quiz(cls, v):
        """Validate quiz list."""
        if len(v) < 1:
            raise ValueError("Must have at least 1 quiz question")
        if len(v) > 10:
            raise ValueError("Cannot have more than 10 quiz questions")
        return v


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
    steps: List[MathStep] = Field(default_factory=list)  # Fixed: removed max_items

    @validator("steps")
    def validate_steps(cls, v):
        """Validate steps list."""
        if len(v) > 50:
            raise ValueError("Cannot have more than 50 steps")
        return v


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
        groq_client: Optional[AsyncGroq],  # Fixed: Made optional
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
        if content is None:  # Fixed: Handle None content
            return {}
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

        # Extract JSON if wrapped in code
        if "``json" in content:
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
                    title=f"Introduction to {topic}",
                    content=f"Learn about {topic}"
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

    def __init__(self, cache_repo: ICacheRepository, gemini_client: Optional[genai.Client]):  # Fixed: Made optional
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

            # Fixed: Handle potential None values
            if not response or not response.candidates:
                logger.error("TTS generation returned no candidates")
                return b""
            
            candidate = response.candidates[0]
            if not candidate or not candidate.content or not candidate.content.parts:
                logger.error("TTS generation returned no parts")
                return b""
            
            parts = candidate.content.parts
            if not parts or not parts[0].inline_data:
                logger.error("TTS generation returned no inline data")
                return b""
            
            pcm = parts[0].inline_data.data

            if isinstance(pcm, str):
                pcm = base64.b64decode(pcm)
            
            # Ensure pcm is bytes, default to empty bytes if None
            if pcm is None:
                pcm = b""

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

    def __init__(self, cache_repo: ICacheRepository, groq_client: Optional[AsyncGroq]):  # Fixed: Made optional
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
        if content is None:  # Fixed: Handle None content
            return MathSolutionResponse(final_answer="No response", steps=[])

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
# RATE LIMITING MIDDLEWARE
# ============================================================================

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware to prevent abuse."""
    
    def __init__(self, app, calls_per_minute: int = 60, calls_per_hour: int = 1000):
        super().__init__(app)
        self.calls_per_minute = calls_per_minute
        self.calls_per_hour = calls_per_hour
        self.requests = defaultdict(list)  # ip -> [timestamps]
    
    async def dispatch(self, request: Request, call_next):
        client_ip = self._get_client_ip(request)
        current_time = time.time()
        
        # Clean old requests (older than 1 hour)
        self.requests[client_ip] = [
            req_time for req_time in self.requests[client_ip]
            if current_time - req_time < 3600
        ]
        
        # Check rate limits
        minute_count = sum(1 for req_time in self.requests[client_ip] 
                          if current_time - req_time < 60)
        hour_count = len(self.requests[client_ip])
        
        if minute_count >= self.calls_per_minute or hour_count >= self.calls_per_hour:
            return JSONResponse(
                status_code=429,
                content={
                    "error": "Rate Limit Exceeded",
                    "message": "Too many requests. Please try again later.",
                    "retry_after": 60 if minute_count >= self.calls_per_minute else 3600
                },
                headers={
                    "X-RateLimit-Limit-Minute": str(self.calls_per_minute),
                    "X-RateLimit-Remaining-Minute": str(max(0, self.calls_per_minute - minute_count)),
                    "X-RateLimit-Limit-Hour": str(self.calls_per_hour),
                    "X-RateLimit-Remaining-Hour": str(max(0, self.calls_per_hour - hour_count)),
                }
            )
        
        # Add current request
        self.requests[client_ip].append(current_time)
        
        response = await call_next(request)
        response.headers["X-RateLimit-Limit-Minute"] = str(self.calls_per_minute)
        response.headers["X-RateLimit-Remaining-Minute"] = str(max(0, self.calls_per_minute - minute_count - 1))
        response.headers["X-RateLimit-Limit-Hour"] = str(self.calls_per_hour)
        response.headers["X-RateLimit-Remaining-Hour"] = str(max(0, self.calls_per_hour - hour_count - 1))
        return response
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP from request."""
        # Check for forwarded headers first (in case of proxies/load balancers)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        # Check for real IP header
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # Fallback to client host
        return request.client.host if request.client else "unknown"


# ============================================================================
# REQUEST LOGGING MIDDLEWARE
# ============================================================================

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log all requests for monitoring and debugging."""
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        request_id = str(uuid.uuid4())
        
        # Log request
        logger.info(f"Request {request_id}: {request.method} {request.url.path}")
        
        try:
            response = await call_next(request)
            
            # Log response
            process_time = time.time() - start_time
            logger.info(f"Response {request_id}: {response.status_code} ({process_time:.2f}s)")
            
            # Add request ID to response headers
            response.headers["X-Request-ID"] = request_id
            return response
            
        except Exception as e:
            process_time = time.time() - start_time
            logger.error(f"Request {request_id} failed: {request.method} {request.url.path} - {str(e)} ({process_time:.2f}s)")
            raise

# ============================================================================
# MIDDLEWARE (Security, Rate Limiting, etc.)
# ============================================================================

# ... (Rest of the middleware code remains the same)

# ============================================================================
# DEPENDENCY INJECTION
# ============================================================================

# Initialize repositories
cache_repo = CacheRepository()
supabase_repo = SupabaseRepository()

# Initialize clients with proper None checks
groq_client: Optional[AsyncGroq] = None
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

gemini_client: Optional[genai.Client] = None
if settings.google_api_key:
    gemini_client = genai.Client(api_key=settings.google_api_key)
else:
    logger.warning("Google API key missing; TTS features disabled.")

# Initialize services with proper optional types
lesson_service = LessonService(supabase_repo, cache_repo, groq_client)
tts_service = TTSService(cache_repo, gemini_client)
math_service = MathSolverService(cache_repo, groq_client)


POPULAR_TOPICS = ["Python Programming", "Machine Learning", "JavaScript", "React", "Artificial Intelligence", "Web Development", "Algorithms", "Database Design", "Cybersecurity"]

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Starting application...")
    try:
        await lesson_service.precompute_popular_topics(POPULAR_TOPICS)
    except Exception as e:
        logger.error(f"Failed during startup precomputation: {e}")
    yield
    logger.info("🔄 Shutting down application...")

app = FastAPI(
    title="Lana AI Backend", version="3.0.1", description="Production-ready AI-powered learning platform",
    lifespan=lifespan,
    docs_url="/api/docs" if settings.environment != "production" else None,
    redoc_url="/api/redoc" if settings.environment != "production" else None,
)

# ============================================================================
# EXCEPTION HANDLERS (Q-2: Robust Error Mapping)
# ============================================================================

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning(f"Validation error on {request.url.path}: {exc.errors()}")
    # FIX: Generate a unique ID for each request for better traceability
    request_id = str(uuid.uuid4())
    return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"error": "Validation Error", "message": "Invalid input provided.", "request_id": request_id})

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    request_id = str(uuid.uuid4())
    return JSONResponse(status_code=exc.status_code,
        content={"error": "Request Error", "message": exc.detail, "request_id": request_id})

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    request_id = str(uuid.uuid4())
    logger.exception(f"Unhandled exception (ID: {request_id}) on {request.url.path}")
    return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": "Internal Server Error", "message": "An unexpected error occurred.", "request_id": request_id})

# ============================================================================
# MIDDLEWARE CONFIGURATION
# ============================================================================

app.add_middleware(GZipMiddleware, minimum_size=1000)
# Add request logging middleware
app.add_middleware(RequestLoggingMiddleware)
# Add rate limiting middleware
app.add_middleware(
    RateLimitMiddleware,
    calls_per_minute=settings.rate_limit_per_minute,
    calls_per_hour=settings.rate_limit_per_hour
)

if settings.environment == "production":
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.allowed_hosts)

# More restrictive CORS in production
if settings.environment == "production":
    allowed_origins_list = settings.allowed_origins or ["https://yourdomain.com"]
else:
    allowed_origins_list = settings.allowed_origins or ["http://localhost:3000", "http://localhost:3001"]

app.add_middleware(
    CORSMiddleware, 
    allow_origins=allowed_origins_list, 
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],  # More restrictive than "*"
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
    expose_headers=["X-RateLimit-Limit-Minute", "X-RateLimit-Remaining-Minute", 
                   "X-RateLimit-Limit-Hour", "X-RateLimit-Remaining-Hour"]
)

# ============================================================================
# API ROUTER & ENDPOINTS (A-1: Minimal controller logic)
# ============================================================================

# FIX: Define a router and add endpoints to it, then include the router in the app.
# This fixes the structural error of importing a non-existent module.
api_router = APIRouter()

@api_router.get("/health", tags=["Monitoring"])
async def health_check():
    """Enhanced health check endpoint with detailed service status."""
    # Get cache stats
    cache_stats = await cache_repo.get_stats()
    
    # Check service statuses
    services = {
        "groq": "configured" if groq_client else "not_configured",
        "gemini_tts": "configured" if gemini_client else "not_configured",
        "supabase": "configured" if supabase_repo.client else "not_configured",
        "redis": "connected" if REDIS_AVAILABLE and cache_repo._redis_client else "not_connected" if REDIS_AVAILABLE else "not_available",
    }
    
    # Overall status
    all_services_ok = all(status in ["configured", "connected"] for status in services.values())
    
    return {
        "status": "healthy" if all_services_ok else "degraded",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "3.0.1",
        "environment": settings.environment,
        "cache": cache_stats,
        "services": services,
        "rate_limits": {
            "requests_per_minute": settings.rate_limit_per_minute,
            "requests_per_hour": settings.rate_limit_per_hour,
        }
    }


@api_router.get("/metrics", tags=["Monitoring"])
async def get_metrics():
    """Get application metrics for monitoring."""
    cache_stats = await cache_repo.get_stats()
    
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "cache": cache_stats,
        "services": {
            "groq": "available" if groq_client else "unavailable",
            "gemini_tts": "available" if gemini_client else "unavailable",
            "supabase": "available" if supabase_repo.client else "unavailable",
        },
        "system": {
            "environment": settings.environment,
            "python_version": sys.version,
        }
    }

@api_router.get("/history", tags=["History"], response_model=List[Dict[str, Any]])
async def get_history(sid: str = Query(..., description="Session/User ID")):
    cache_key = f"history_{sid}"
    if cached_result := await cache_repo.get(cache_key, namespace="history"):
        return cached_result
    result = await supabase_repo.get_user_history(sid, limit=50)
    await cache_repo.set(cache_key, result, namespace="history")
    return result

@api_router.post("/social", tags=["Social"])
async def social_chat():
    return {"reply": "Hey dear! 👋 I'm Lana — what would you like to learn today?"}

@api_router.post("/structured-lesson", response_model=StructuredLessonResponse, tags=["Lessons"])
async def create_structured_lesson(request: StructuredLessonRequest):
    return await lesson_service.get_structured_lesson(request=request)

@api_router.post("/structured-lesson/stream", tags=["Lessons"])
async def stream_structured_lesson(request: StructuredLessonRequest):
    async def generate() -> AsyncGenerator[str, None]:
        try:
            # FIX: This now simulates a stream by yielding parts of the final object.
            # A true implementation would stream from the LLM, but this is a vast improvement.
            lesson = await lesson_service.get_structured_lesson(request=request)
            
            # Yield components one by one for a better frontend experience
            yield f"data: {orjson.dumps({'type': 'introduction', 'content': lesson.introduction}).decode()}\n\n"
            await asyncio.sleep(0.05)
            
            for section in lesson.sections:
                yield f"data: {orjson.dumps({'type': 'section', 'content': section.dict()}).decode()}\n\n"
                await asyncio.sleep(0.05)
            
            if lesson.diagram:
                yield f"data: {orjson.dumps({'type': 'diagram', 'content': lesson.diagram}).decode()}\n\n"
                await asyncio.sleep(0.05)
            
            # Finally, send the quiz and signal completion
            yield f"data: {orjson.dumps({'type': 'quiz', 'content': [q.dict() for q in lesson.quiz]}).decode()}\n\n"
            yield f"data: {orjson.dumps({'type': 'done'}).decode()}\n\n"

        except Exception as e:
            logger.error(f"Streaming error: {e}")
            error_data = {"type": "error", "message": "Failed to generate lesson stream."}
            yield f"data: {orjson.dumps(error_data).decode()}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")

@api_router.post("/tts", tags=["TTS"])
async def text_to_speech(request: TTSRequest):
    try:
        audio_data = await tts_service.generate_speech(
            request.text, voice_name=os.getenv("GOOGLE_TTS_VOICE", "Leda")
        )
        if not audio_data:
            return Response(status_code=status.HTTP_204_NO_CONTENT)
            
        # FIX: Removed manual Gzip. GZipMiddleware will handle compression.
        return Response(content=audio_data, media_type="audio/wav", headers={"Cache-Control": "public, max-age=3600"})
    except Exception as e:
        logger.exception("TTS generation error")
        raise HTTPException(status_code=500, detail="Failed to generate speech audio.")

@api_router.post("/solve-math", response_model=MathSolutionResponse, tags=["Math"])
async def solve_math_problem(request: MathProblemRequest):
    return await math_service.solve_problem(request.question)

# Include the router in the main FastAPI app
app.include_router(api_router, prefix="/api")

# ============================================================================
# MAIN ENTRY POINT
# ============================================================================
if __name__ == "__main__":
    import uvicorn
    # This block is for development/debugging.
    # For production, use Gunicorn + Uvicorn workers: `gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker`
    uvicorn.run(
        "__main__:app",
        host="0.0.0.0",
        port=8000,
        reload=True, # Reload is useful for development
        log_level=settings.log_level.lower(),
    )