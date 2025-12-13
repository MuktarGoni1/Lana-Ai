"""
Database connection manager.
Handles database connections with proper pooling and security.
"""

import asyncio
import logging
from typing import Optional, AsyncGenerator
import asyncpg
from app.db_config import get_database_url, get_database_settings

logger = logging.getLogger(__name__)

class DatabaseManager:
    """Manages database connections with pooling and security."""
    
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None
        self._lock = asyncio.Lock()
    
    async def initialize(self) -> None:
        """Initialize the database connection pool."""
        async with self._lock:
            if self.pool is None:
                try:
                    settings = get_database_settings()
                    database_url = get_database_url()
                    
                    logger.info("Initializing database connection pool")
                    
                    self.pool = await asyncpg.create_pool(
                        database_url,
                        min_size=settings.db_pool_min_size,
                        max_size=settings.db_pool_max_size,
                        ssl=settings.db_ssl_mode if settings.db_ssl_mode != "prefer" else None
                    )
                    
                    logger.info("Database connection pool initialized successfully")
                    
                except Exception as e:
                    logger.error(f"Failed to initialize database connection pool: {e}")
                    raise
    
    async def close(self) -> None:
        """Close the database connection pool."""
        async with self._lock:
            if self.pool:
                await self.pool.close()
                self.pool = None
                logger.info("Database connection pool closed")
    
    async def get_connection(self) -> AsyncGenerator[asyncpg.Connection, None]:
        """
        Get a database connection from the pool.
        
        Yields:
            asyncpg.Connection: Database connection
        """
        if self.pool is None:
            await self.initialize()
        
        async with self.pool.acquire() as connection:
            yield connection
    
    async def execute_query(self, query: str, *args) -> list:
        """
        Execute a query and return results.
        
        Args:
            query: SQL query to execute
            *args: Query parameters
            
        Returns:
            list: Query results
        """
        async with self.get_connection() as conn:
            return await conn.fetch(query, *args)
    
    async def execute_command(self, command: str, *args) -> str:
        """
        Execute a command and return status.
        
        Args:
            command: SQL command to execute
            *args: Command parameters
            
        Returns:
            str: Command status
        """
        async with self.get_connection() as conn:
            return await conn.execute(command, *args)
    
    async def insert_guardian(self, email: str, child_uid: str, weekly_report: bool = True, monthly_report: bool = True) -> dict:
        """
        Insert or update a guardian record.
        
        Args:
            email: Guardian's email
            child_uid: Child's user ID
            weekly_report: Whether to send weekly reports
            monthly_report: Whether to send monthly reports
            
        Returns:
            dict: Inserted/updated guardian record
        """
        query = """
            INSERT INTO guardians (id, email, child_uid, weekly_report, monthly_report)
            VALUES (gen_random_uuid(), $1, $2, $3, $4)
            ON CONFLICT (email) 
            DO UPDATE SET 
                child_uid = EXCLUDED.child_uid,
                weekly_report = EXCLUDED.weekly_report,
                monthly_report = EXCLUDED.monthly_report
            RETURNING *
        """
        
        async with self.get_connection() as conn:
            result = await conn.fetchrow(query, email, child_uid, weekly_report, monthly_report)
            return dict(result) if result else {}

# Global database manager instance
db_manager = DatabaseManager()