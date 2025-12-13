"""
Database configuration module.
Handles secure database connection setup using environment variables.
"""

import os
from typing import Optional
from pydantic import BaseModel
from pydantic_settings import BaseSettings

class DatabaseSettings(BaseSettings):
    """Database configuration settings."""
    
    # Database connection settings
    db_host: str = os.getenv("DB_HOST", "localhost")
    db_port: int = int(os.getenv("DB_PORT", "5432"))
    db_name: str = os.getenv("DB_NAME", "lana_ai")
    db_user: str = os.getenv("DB_USER", "postgres")
    db_password: str = os.getenv("DB_PASSWORD", "")
    
    # Connection pool settings
    db_pool_min_size: int = int(os.getenv("DB_POOL_MIN_SIZE", "5"))
    db_pool_max_size: int = int(os.getenv("DB_POOL_MAX_SIZE", "20"))
    
    # SSL settings
    db_ssl_mode: str = os.getenv("DB_SSL_MODE", "prefer")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

def get_database_url() -> str:
    """
    Construct database URL from environment variables.
    
    Returns:
        str: Database connection URL
    """
    settings = DatabaseSettings()
    
    # Handle special case for Supabase-like URLs
    if os.getenv("DATABASE_URL"):
        return os.getenv("DATABASE_URL")
    
    # Construct URL from individual components
    return (
        f"postgresql://{settings.db_user}:{settings.db_password}@"
        f"{settings.db_host}:{settings.db_port}/{settings.db_name}"
        f"?sslmode={settings.db_ssl_mode}"
    )

def get_database_settings() -> DatabaseSettings:
    """
    Get database settings from environment variables.
    
    Returns:
        DatabaseSettings: Database configuration settings
    """
    return DatabaseSettings()

# Example usage:
# DATABASE_URL = get_database_url()
# This would typically be used with asyncpg or another database driver