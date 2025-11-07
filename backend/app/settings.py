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
    RATE_LIMIT_PER_MINUTE
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

def load_settings():
    """Load and return application settings."""
    return Settings()