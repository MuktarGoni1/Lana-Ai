// lib/rate-limiter.ts
// Client-side rate limiting for API requests to prevent 429 errors

class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private limits: Map<string, { maxRequests: number; windowMs: number }> = new Map();

  // Set rate limit for a specific endpoint
  setLimit(endpoint: string, maxRequests: number, windowMs: number) {
    this.limits.set(endpoint, { maxRequests, windowMs });
  }

  // Check if a request is allowed for the given endpoint
  isAllowed(endpoint: string): boolean {
    const limit = this.limits.get(endpoint);
    if (!limit) return true; // No limit set, allow request

    const now = Date.now();
    const windowStart = now - limit.windowMs;

    // Get or create request timestamps for this endpoint
    let timestamps = this.requests.get(endpoint) || [];
    
    // Filter out requests outside the time window
    timestamps = timestamps.filter(timestamp => timestamp > windowStart);
    
    // Check if we're under the limit
    const isAllowed = timestamps.length < limit.maxRequests;
    
    // If allowed, add current timestamp
    if (isAllowed) {
      timestamps.push(now);
      this.requests.set(endpoint, timestamps);
    }
    
    return isAllowed;
  }

  // Get remaining requests for an endpoint
  getRemainingRequests(endpoint: string): number {
    const limit = this.limits.get(endpoint);
    if (!limit) return Infinity;

    const now = Date.now();
    const windowStart = now - limit.windowMs;
    const timestamps = this.requests.get(endpoint) || [];
    const recentRequests = timestamps.filter(timestamp => timestamp > windowStart);
    
    return Math.max(0, limit.maxRequests - recentRequests.length);
  }

  // Get time until next allowed request
  getTimeUntilNextRequest(endpoint: string): number {
    const limit = this.limits.get(endpoint);
    if (!limit) return 0;

    const now = Date.now();
    const windowStart = now - limit.windowMs;
    const timestamps = this.requests.get(endpoint) || [];
    const recentRequests = timestamps.filter(timestamp => timestamp > windowStart);
    
    if (recentRequests.length < limit.maxRequests) return 0;
    
    // Return time until the oldest request expires
    const oldestRequest = Math.min(...recentRequests);
    return Math.max(0, oldestRequest + limit.windowMs - now);
  }
}

// Create a singleton instance
const rateLimiter = new RateLimiter();

// Set default limits for common endpoints
rateLimiter.setLimit('/api/structured-lesson/stream', 5, 60000); // 5 requests per minute
rateLimiter.setLimit('/api/tts', 10, 60000); // 10 requests per minute

export default rateLimiter;