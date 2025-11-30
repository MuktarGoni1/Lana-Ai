// __tests__/rate-limiter.test.ts
// Unit tests for rate limiter

import rateLimiter from '@/lib/rate-limiter';

describe('Rate Limiter', () => {
  beforeEach(() => {
    // Reset rate limiter state
    (rateLimiter as any).requests.clear();
  });

  describe('isAllowed', () => {
    it('should allow requests under the limit', () => {
      rateLimiter.setLimit('/api/test', 5, 60000); // 5 requests per minute
      
      // Make 3 requests - should all be allowed
      for (let i = 0; i < 3; i++) {
        expect(rateLimiter.isAllowed('/api/test')).toBe(true);
      }
    });

    it('should block requests over the limit', () => {
      rateLimiter.setLimit('/api/test', 2, 60000); // 2 requests per minute
      
      // First 2 requests should be allowed
      expect(rateLimiter.isAllowed('/api/test')).toBe(true);
      expect(rateLimiter.isAllowed('/api/test')).toBe(true);
      
      // Third request should be blocked
      expect(rateLimiter.isAllowed('/api/test')).toBe(false);
    });

    it('should allow requests for unset endpoints', () => {
      // Requests to endpoints without limits should always be allowed
      expect(rateLimiter.isAllowed('/api/unlimited')).toBe(true);
      expect(rateLimiter.isAllowed('/api/unlimited')).toBe(true);
      expect(rateLimiter.isAllowed('/api/unlimited')).toBe(true);
    });
  });

  describe('getRemainingRequests', () => {
    it('should return correct remaining requests', () => {
      rateLimiter.setLimit('/api/test', 5, 60000); // 5 requests per minute
      
      // Initially should have all requests available
      expect(rateLimiter.getRemainingRequests('/api/test')).toBe(5);
      
      // Make 2 requests
      rateLimiter.isAllowed('/api/test');
      rateLimiter.isAllowed('/api/test');
      
      // Should have 3 remaining
      expect(rateLimiter.getRemainingRequests('/api/test')).toBe(3);
      
      // Make 3 more requests (exceeding limit)
      rateLimiter.isAllowed('/api/test');
      rateLimiter.isAllowed('/api/test');
      rateLimiter.isAllowed('/api/test');
      
      // Should have 0 remaining
      expect(rateLimiter.getRemainingRequests('/api/test')).toBe(0);
    });

    it('should return Infinity for unset endpoints', () => {
      expect(rateLimiter.getRemainingRequests('/api/unlimited')).toBe(Infinity);
    });
  });

  describe('getTimeUntilNextRequest', () => {
    it('should return 0 when requests are available', () => {
      rateLimiter.setLimit('/api/test', 5, 60000); // 5 requests per minute
      
      expect(rateLimiter.getTimeUntilNextRequest('/api/test')).toBe(0);
    });

    it('should return time until next request when limit is exceeded', () => {
      rateLimiter.setLimit('/api/test', 1, 60000); // 1 request per minute
      
      // Make the one allowed request
      rateLimiter.isAllowed('/api/test');
      
      // Should return time until the request expires (approximately 60000ms)
      const time = rateLimiter.getTimeUntilNextRequest('/api/test');
      expect(time).toBeGreaterThan(59000); // Allow some tolerance
      expect(time).toBeLessThanOrEqual(60000);
    });
  });
});