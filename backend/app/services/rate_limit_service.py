import time
import logging
from typing import Dict, Optional
from collections import defaultdict

logger = logging.getLogger(__name__)

class RateLimitService:
    """Service for handling rate limiting across all modes."""
    
    def __init__(self, requests_per_minute: int = 60, requests_per_hour: int = 1000):
        self.requests_per_minute = requests_per_minute
        self.requests_per_hour = requests_per_hour
        self.client_requests: Dict[str, Dict[str, list]] = defaultdict(lambda: defaultdict(list))
        
    def is_allowed(self, client_id: str, endpoint: str) -> bool:
        """Check if a client is allowed to make a request to an endpoint."""
        current_time = time.time()
        minute_ago = current_time - 60
        hour_ago = current_time - 3600
        
        # Clean up old requests
        self._cleanup_old_requests(client_id, endpoint, minute_ago, hour_ago)
        
        # Get requests for this client and endpoint
        requests = self.client_requests[client_id][endpoint]
        
        # Count requests in the last minute and hour
        minute_count = sum(1 for ts in requests if ts > minute_ago)
        hour_count = sum(1 for ts in requests if ts > hour_ago)
        
        # Check if limits are exceeded
        if minute_count >= self.requests_per_minute:
            return False
            
        if hour_count >= self.requests_per_hour:
            return False
            
        # Add current request
        requests.append(current_time)
        return True
        
    def _cleanup_old_requests(self, client_id: str, endpoint: str, minute_ago: float, hour_ago: float):
        """Remove old requests from tracking."""
        requests = self.client_requests[client_id][endpoint]
        # Keep only requests from the last hour
        self.client_requests[client_id][endpoint] = [ts for ts in requests if ts > hour_ago]
        
    def get_wait_time(self, client_id: str, endpoint: str) -> float:
        """Get the time in seconds until the client can make another request."""
        current_time = time.time()
        minute_ago = current_time - 60
        
        requests = self.client_requests[client_id][endpoint]
        minute_requests = [ts for ts in requests if ts > minute_ago]
        
        if len(minute_requests) < self.requests_per_minute:
            return 0
            
        # Return time until the oldest request expires
        oldest_request = min(minute_requests)
        return max(0, oldest_request + 60 - current_time)