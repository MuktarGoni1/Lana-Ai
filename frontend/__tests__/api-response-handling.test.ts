import { apiClient } from '../lib/api-client';
import { ApiError, NetworkError } from '../lib/errors';

// Mock fetch for testing
global.fetch = jest.fn();

describe('Frontend API Response Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Error Handling', () => {
    test('handles 400 Bad Request', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ message: 'Invalid input' })
      });

      await expect(apiClient.get('/test')).rejects.toThrow('Bad request - please check your input');
      await expect(apiClient.get('/test')).rejects.toBeInstanceOf(ApiError);
    });

    test('handles 401 Unauthorized', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ message: 'Authentication required' })
      });

      await expect(apiClient.get('/test')).rejects.toThrow('Authentication required - please sign in');
      await expect(apiClient.get('/test')).rejects.toBeInstanceOf(ApiError);
    });

    test('handles 403 Forbidden', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: () => Promise.resolve({ message: 'Access denied' })
      });

      await expect(apiClient.get('/test')).rejects.toThrow('Access denied - insufficient permissions');
      await expect(apiClient.get('/test')).rejects.toBeInstanceOf(ApiError);
    });

    test('handles 404 Not Found', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ message: 'Resource not found' })
      });

      await expect(apiClient.get('/test')).rejects.toThrow('Resource not found');
      await expect(apiClient.get('/test')).rejects.toBeInstanceOf(ApiError);
    });

    test('handles 429 Rate Limiting', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: () => Promise.resolve({ message: 'Rate limit exceeded' })
      });

      await expect(apiClient.get('/test')).rejects.toThrow('Too many requests - please try again later');
      await expect(apiClient.get('/test')).rejects.toBeInstanceOf(ApiError);
    });

    test('handles 500 Server Error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ message: 'Server error' })
      });

      await expect(apiClient.get('/test')).rejects.toThrow('Server error - please try again later');
      await expect(apiClient.get('/test')).rejects.toBeInstanceOf(ApiError);
    });

    test('handles 503 Service Unavailable', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: () => Promise.resolve({ message: 'Service temporarily unavailable' })
      });

      await expect(apiClient.get('/test')).rejects.toThrow('Service temporarily unavailable - please try again later');
      await expect(apiClient.get('/test')).rejects.toBeInstanceOf(ApiError);
    });

    test('handles network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new TypeError('Network error'));

      await expect(apiClient.get('/test')).rejects.toThrow('A network error occurred. Please check your connection.');
      await expect(apiClient.get('/test')).rejects.toBeInstanceOf(NetworkError);
    });
  });

  describe('Successful Responses', () => {
    test('handles successful GET requests', async () => {
      const mockData = { id: 1, name: 'Test' };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      const result = await apiClient.get('/test');
      expect(result).toEqual(mockData);
    });

    test('handles successful POST requests', async () => {
      const mockData = { id: 1, name: 'Test' };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      const result = await apiClient.post('/test', { name: 'Test' });
      expect(result).toEqual(mockData);
    });
  });

  describe('Response Data Validation', () => {
    test('validates JSON response structure', async () => {
      const mockData = { introduction: 'Test', sections: [{ title: 'Section 1', content: 'Content' }] };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      const result = await apiClient.get('/lesson');
      expect(result).toHaveProperty('introduction');
      expect(result).toHaveProperty('sections');
      expect(Array.isArray(result.sections)).toBe(true);
    });
  });

  describe('Caching', () => {
    test('caches GET requests', async () => {
      const mockData = { id: 1, name: 'Test' };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      // First request
      await apiClient.get('/test');
      // Second request should use cache
      await apiClient.get('/test');

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test('bypasses cache when requested', async () => {
      const mockData = { id: 1, name: 'Test' };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      // First request
      await apiClient.get('/test');
      // Second request bypasses cache
      await apiClient.get('/test', {}, true);

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Rate Limiting', () => {
    test('respects rate limits for POST requests', async () => {
      // This would require mocking the rate limiter
      // Implementation would depend on the specific rate limiting logic
    });
  });
});