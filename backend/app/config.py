"""
Configuration module for the application.
Loads environment variables and provides configuration settings.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

"""
Environment loading policy:
- Prefer backend/.env, but gracefully fall back to repo-root .env if present.
- This ensures deployments where env is stored at the project root still work.
"""
env_dir = Path(__file__).parent.parent  # backend/
backend_env = env_dir / ".env"
root_env = Path(__file__).resolve().parents[2] / ".env"

# Load backend .env first
if backend_env.exists():
    load_dotenv(dotenv_path=backend_env)
else:
    # Fallback to repo-root .env
    if root_env.exists():
        load_dotenv(dotenv_path=root_env)

# API Configuration
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))
API_DEBUG = os.getenv("API_DEBUG", "False").lower() in ("true", "1", "t")
API_SECRET_KEY = os.getenv("API_SECRET_KEY")
if not API_SECRET_KEY:
    if API_DEBUG:
        API_SECRET_KEY = "default_secret_key_change_in_production"
        print("WARNING: Using default API_SECRET_KEY. Do not use in production!")
    else:
        # In production, we should probably fail or at least warn heavily.
        # For now, we'll default but log a critical warning if logging were set up here.
        API_SECRET_KEY = "default_secret_key_change_in_production"

# Primary API keys
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")

# Database Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "")

# Supabase Configuration (service-side only)
# Support projects where vars are named with NEXT_PUBLIC_* by mapping fallbacks.
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
# Prefer service role on server; never expose to frontend
SUPABASE_KEY = SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY

# Service Configurations (legacy names for compatibility)
TTS_API_KEY = os.getenv("TTS_API_KEY", GOOGLE_API_KEY)
MATH_SOLVER_API_KEY = os.getenv("MATH_SOLVER_API_KEY", "")

# Application Settings
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")
RATE_LIMIT_PER_MINUTE = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))
RATE_LIMIT_PER_HOUR = int(os.getenv("RATE_LIMIT_PER_HOUR", "1000"))

# Redis Configuration
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", None)
REDIS_DB = int(os.getenv("REDIS_DB", "0"))
REDIS_URL = os.getenv("REDIS_URL", f"redis://{REDIS_HOST}:{REDIS_PORT}")

# Cache TTLs
CACHE_TTL_LESSONS = int(os.getenv("CACHE_TTL_LESSONS", "3600"))
CACHE_TTL_TTS = int(os.getenv("CACHE_TTL_TTS", "86400"))
CACHE_TTL_HISTORY = int(os.getenv("CACHE_TTL_HISTORY", "300"))
CACHE_TTL_POPULAR = int(os.getenv("CACHE_TTL_POPULAR", "3600"))
CACHE_TTL_MATH = int(os.getenv("CACHE_TTL_MATH", "3600"))
