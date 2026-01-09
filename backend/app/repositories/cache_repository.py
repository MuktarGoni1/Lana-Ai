import redis.asyncio as redis_async
import orjson
import time
from cachetools import TTLCache
from typing import Any, Dict, Optional
import logging

from app.repositories.interfaces import ICacheRepository
from app.settings import load_settings

settings = load_settings()

logger = logging.getLogger(__name__)

REDIS_AVAILABLE = True  # Assume Redis is available unless connection fails


class CacheRepository(ICacheRepository):
    """Cache repository with Redis and in-memory fallback."""

    def __init__(self):
        """Initialize cache repository."""
        self._redis_client: Optional[redis_async.Redis] = None
        self._fallback_caches: Dict[str, TTLCache] = {}
        self._stats = {"hits": 0, "misses": 0, "errors": 0, "last_reset": time.time()}

    async def _get_redis_client(self) -> Optional[redis_async.Redis]:
        """Get or create Redis client."""
        global REDIS_AVAILABLE
        if not REDIS_AVAILABLE:
            return None

        if not self._redis_client:
            try:
                self._redis_client = await redis_async.from_url(
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
                REDIS_AVAILABLE = False
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

        try:
            client = await self._get_redis_client()
            if client:
                if ttl:
                    await client.setex(full_key, ttl, orjson.dumps(value))
                else:
                    await client.set(full_key, orjson.dumps(value))
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
                return True
        except Exception as e:
            self._stats["errors"] += 1
            logger.debug(f"Redis delete failed: {e}")

        # Fallback to in-memory
        cache = self._get_fallback_cache(namespace)
        if key in cache:
            del cache[key]
        return True

    async def exists(self, key: str, namespace: str = "default") -> bool:
        """Check if key exists in cache."""
        full_key = self._make_key(key, namespace)

        try:
            client = await self._get_redis_client()
            if client:
                return await client.exists(full_key)
        except Exception as e:
            self._stats["errors"] += 1
            logger.debug(f"Redis exists failed: {e}")

        # Fallback to in-memory
        cache = self._get_fallback_cache(namespace)
        return key in cache

    async def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        return self._stats
