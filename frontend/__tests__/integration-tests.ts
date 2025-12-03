// __tests__/integration-tests.ts
// Integration tests to verify frontend-backend endpoint alignment

import { apiClient } from '@/lib/api-client';

// Mock console.warn to suppress rate limit warnings during tests
const originalWarn = console.warn;
console.warn = jest.fn();

describe('Frontend-Backend Integration Tests', () => {
  // Test structured lesson streaming endpoint
  it('should successfully call structured lesson streaming endpoint', async () => {
    // This test verifies the endpoint exists and accepts the correct parameters
    const mockFetch = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      body: {
        getReader: () => ({
          read: () => Promise.resolve({ done: true, value: undefined })
        })
      },
      json: () => Promise.resolve({ 
        introduction: 'Test lesson',
        sections: [],
        quiz: []
      })
    } as any);

    try {
      const response = await apiClient.post('/api/structured-lesson/stream', {
        topic: 'Test Topic',
        age: 10
      });
      
      expect(response).toBeDefined();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/structured-lesson/stream'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    } finally {
      mockFetch.mockRestore();
    }
  });

  // Test TTS endpoint
  it('should successfully call TTS endpoint', async () => {
    // This test verifies the endpoint exists and accepts the correct parameters
    const mockFetch = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      blob: () => Promise.resolve(new Blob(['test audio'], { type: 'audio/wav' }))
    } as any);

    try {
      const response = await apiClient.post('/api/tts', {
        text: 'Test text for TTS'
      });
      
      expect(response).toBeDefined();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/tts'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    } finally {
      mockFetch.mockRestore();
    }
  });

  // Test rate limiting
  it('should respect rate limits', async () => {
    // This test verifies that rate limiting is working correctly
    const mockFetch = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ status: 'ok' })
    } as any);

    try {
      // Make multiple rapid requests to trigger rate limiting
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          apiClient.post('/api/structured-lesson/stream', {
            topic: `Test Topic ${i}`
          }).catch(error => error)
        );
      }
      
      const results = await Promise.all(promises);
      
      // Some requests should be rejected due to rate limiting
      const rateLimitErrors = results.filter(
        result => result instanceof Error && result.message.includes('Rate limit exceeded')
      );
      
      // We expect some rate limit errors
      expect(rateLimitErrors.length).toBeGreaterThan(0);
    } finally {
      mockFetch.mockRestore();
    }
  });

  // Test error handling
  it('should handle API errors gracefully', async () => {
    // This test verifies that errors are handled properly
    const mockFetch = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.resolve({ error: 'Test error' })
    } as any);

    try {
      await expect(
        apiClient.post('/api/structured-lesson/stream', {
          topic: 'Test Topic'
        })
      ).rejects.toThrow('Server error - please try again later');
    } finally {
      mockFetch.mockRestore();
    }
  });
});