import time
import logging
from functools import wraps
from fastapi import HTTPException, status
from collections import defaultdict
from typing import Dict, Tuple
from app.middleware.security_logger import log_rate_limit_exceeded

logger = logging.getLogger(__name__)

# In-memory store for rate limiting
# In production, you would use Redis or another distributed cache
_rate_limits: Dict[str, Tuple[int, float]] = defaultdict(lambda: (0, 0.0))  # (count, reset_time)

class RateLimiter:
    """Simple rate limiter for API endpoints."""
    
    def __init__(self, max_requests: int = 10, window_seconds: int = 3600):
        """
        Initialize rate limiter.
        
        Args:
            max_requests: Maximum number of requests allowed
            window_seconds: Time window in seconds
        """
        self.max_requests = max_requests
        self.window_seconds = window_seconds
    
    def is_allowed(self, key: str) -> bool:
        """
        Check if a request is allowed for the given key.
        
        Args:
            key: Unique identifier for the client (e.g., IP address, user ID)
            
        Returns:
            bool: True if request is allowed, False otherwise
        """
        current_time = time.time()
        count, reset_time = _rate_limits[key]
        
        # Reset counter if window has expired
        if current_time > reset_time:
            count = 0
            reset_time = current_time + self.window_seconds
        
        # Check if limit exceeded
        if count >= self.max_requests:
            return False
        
        # Increment counter
        _rate_limits[key] = (count + 1, reset_time)
        return True
    
    def get_retry_after(self, key: str) -> int:
        """
        Get seconds until next allowed request.
        
        Args:
            key: Unique identifier for the client
            
        Returns:
            int: Seconds until next allowed request
        """
        current_time = time.time()
        _, reset_time = _rate_limits[key]
        return max(0, int(reset_time - current_time))

def rate_limit(max_requests: int = 10, window_seconds: int = 3600, key_func=None):
    """
    Decorator to apply rate limiting to FastAPI endpoints.
    
    Args:
        max_requests: Maximum number of requests allowed
        window_seconds: Time window in seconds
        key_func: Function to generate rate limit key from request
    """
    limiter = RateLimiter(max_requests, window_seconds)
    
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract request from args (FastAPI passes request as first argument)
            request = None
            for arg in args:
                if hasattr(arg, 'client') and hasattr(arg, 'headers'):
                    request = arg
                    break
            
            if request is None:
                # Try to get request from kwargs
                request = kwargs.get('request')
            
            if request is None:
                # If we can't get request, skip rate limiting
                logger.warning("Could not extract request for rate limiting")
                return await func(*args, **kwargs)
            
            # Generate rate limit key
            if key_func:
                key = key_func(request)
            else:
                # Default key is user ID from auth or IP address
                user_id = getattr(request.state, 'user_id', None) if hasattr(request.state, 'user_id') else None
                if user_id:
                    key = f"user:{user_id}"
                else:
                    client_ip = request.client.host if request.client else "unknown"
                    key = f"ip:{client_ip}"
            
            # Check rate limit
            if not limiter.is_allowed(key):
                retry_after = limiter.get_retry_after(key)
                logger.warning(f"Rate limit exceeded for key: {key}")
                
                # Log security event
                user_email = getattr(request.state, 'user_email', None) if hasattr(request.state, 'user_email') else None
                client_ip = request.client.host if request.client else "unknown"
                log_rate_limit_exceeded(
                    user_id=user_id,
                    user_email=user_email,
                    ip_address=client_ip,
                    endpoint=request.url.path,
                    request_count=_rate_limits[key][0]
                )
                
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    headers={"Retry-After": str(retry_after)},
                    detail=f"Rate limit exceeded. Try again in {retry_after} seconds."
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator