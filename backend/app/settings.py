"""
Application settings module.
Provides configuration settings for the application.
"""

from app.config import (
    API_DEBUG,
    API_SECRET_KEY,
    GROQ_API_KEY,
    GOOGLE_API_KEY,
    DATABASE_URL,
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_ANON_KEY,
    SUPABASE_KEY,
    TTS_API_KEY,
    MATH_SOLVER_API_KEY,
    CORS_ORIGINS,
    RATE_LIMIT_PER_MINUTE,
    RATE_LIMIT_PER_HOUR,
    REDIS_HOST,
    REDIS_PORT,
    REDIS_PASSWORD,
    REDIS_DB,
    REDIS_URL,
    CACHE_TTL_LESSONS,
    CACHE_TTL_TTS,
    CACHE_TTL_HISTORY,
    CACHE_TTL_POPULAR,
    CACHE_TTL_MATH
)

class Settings:
    """Settings class to hold application configuration."""
    
    def __init__(self):
        self.api_debug = API_DEBUG
        self.api_secret_key = API_SECRET_KEY
        self.groq_api_key = GROQ_API_KEY
        self.google_api_key = GOOGLE_API_KEY
        self.database_url = DATABASE_URL
        self.supabase_url = SUPABASE_URL
        self.supabase_service_role_key = SUPABASE_SERVICE_ROLE_KEY
        self.supabase_anon_key = SUPABASE_ANON_KEY
        self.supabase_key = SUPABASE_KEY
        self.tts_api_key = TTS_API_KEY
        self.math_solver_api_key = MATH_SOLVER_API_KEY
        self.cors_origins = CORS_ORIGINS
        self.rate_limit_per_minute = RATE_LIMIT_PER_MINUTE
        self.rate_limit_per_hour = RATE_LIMIT_PER_HOUR
        self.redis_host = REDIS_HOST
        self.redis_port = REDIS_PORT
        self.redis_password = REDIS_PASSWORD
        self.redis_db = REDIS_DB
        self.redis_url = REDIS_URL
        self.cache_ttl_lessons = CACHE_TTL_LESSONS
        self.cache_ttl_tts = CACHE_TTL_TTS
        self.cache_ttl_history = CACHE_TTL_HISTORY
        self.cache_ttl_popular = CACHE_TTL_POPULAR
        self.cache_ttl_math = CACHE_TTL_MATH

def load_settings():
    """Load and return application settings."""
    return Settings()
