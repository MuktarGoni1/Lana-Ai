import time
from typing import Tuple, Dict, Any
import redis.asyncio as aioredis

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette import status

from backend.main import settings, REDIS_AVAILABLE


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware with Redis backend and in-memory fallback."""

    def __init__(self, app):
        """Initialize rate limiter."""
        super().__init__(app)
        self.calls_per_minute = settings.rate_limit_per_minute
        self.calls_per_hour = settings.rate_limit_per_hour
        self.memory_store: Dict[str, Any] = {}
        self.last_cleanup = time.time()
        self._redis_client = None

        # Endpoint-specific limits
        self.endpoint_limits = {
            "/api/structured-lesson": {"per_minute": 20, "per_hour": 300},
            "/api/structured-lesson/stream": {"per_minute": 20, "per_hour": 300},
            "/api/quick": {"per_minute": 30, "per_hour": 400},
            "/api/quick/stream": {"per_minute": 30, "per_hour": 400},
            "/api/tts": {"per_minute": 15, "per_hour": 150},
            "/api/solve-math": {"per_minute": 30, "per_hour": 400},
        }

    async def _get_redis_client(self):
        """Get or create a Redis client."""
        if not REDIS_AVAILABLE:
            return None
        if self._redis_client is None or self._redis_client.closed:
            try:
                self._redis_client = await redis_async.from_url(
                    settings.redis_url, encoding="utf-8", decode_responses=True
                )
            except Exception as e:
                print(f"Could not connect to Redis: {e}")
                self._redis_client = None
        return self._redis_client

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
        """Check rate limit using Redis or in-memory fallback."""
        redis = await self._get_redis_client()
        current_time = time.time()

        if redis:
            # Use Redis for rate limiting
            # Remove scores older than 'window' seconds ago
            await redis.zremrangebyscore(key, 0, current_time - window)
            # Add current request timestamp
            await redis.zadd(key, {current_time: current_time})
            # Set expiration for the key to prevent it from living forever
            await redis.expire(key, window + 5)  # +5 seconds buffer

            count = await redis.zcard(key)
            return count <= limit, count
        else:
            # Fallback to in-memory store
            # Cleanup old entries periodically
            if current_time - self.last_cleanup > 300:
                await self.cleanup_memory_store()
                self.last_cleanup = current_time

            if key not in self.memory_store:
                self.memory_store[key] = []

            # Remove old entries
            window_start = current_time - window
            self.memory_store[key] = [
                t for t in self.memory_store[key] if t > window_start
            ]

            # Add current request
            self.memory_store[key].append(current_time)

            return len(self.memory_store[key]) <= limit, len(self.memory_store[key])

    async def cleanup_memory_store(self):
        """Clean up old entries from memory store."""
        current_time = time.time()
        keys_to_remove = []
        for key, timestamps in self.memory_store.items():
            self.memory_store[key] = [t for t in timestamps if t > current_time - 3600]
            if not self.memory_store[key]:
                keys_to_remove.append(key)

        for key in keys_to_remove:
            del self.memory_store[key]

    async def dispatch(self, request: Request, call_next):
        """Apply rate limiting."""
        # Skip rate limiting for health checks and OpenAPI docs
        if request.url.path in [
            "/health",
            "/api/health",
            "/docs",
            "/redoc",
            "/openapi.json",
        ]:
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
                headers={
                    "Retry-After": "60",
                    "X-RateLimit-Limit": str(limits["per_minute"]),
                    "X-RateLimit-Remaining": str(0),
                    "X-RateLimit-Reset": str(
                        60
                    ),  # Assuming a 60 second window for minute limit
                },
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
                headers={
                    "Retry-After": "3600",
                    "X-RateLimit-Limit": str(limits["per_hour"]),
                    "X-RateLimit-Remaining": str(0),
                    "X-RateLimit-Reset": str(
                        3600
                    ),  # Assuming a 3600 second window for hour limit
                },
            )

        # Add rate limit headers
        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(limits["per_minute"])
        response.headers["X-RateLimit-Remaining"] = str(
            max(0, limits["per_minute"] - minute_count)
        )
        response.headers["X-RateLimit-Reset"] = str(
            60
        )  # Assuming a 60 second window for minute limit

        return response
