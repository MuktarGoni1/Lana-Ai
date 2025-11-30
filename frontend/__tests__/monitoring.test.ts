// __tests__/monitoring.test.ts
// Unit tests for monitoring utilities

import { apiMonitor, measureApiCall } from '@/lib/monitoring';

describe('Monitoring Utilities', () => {
  beforeEach(() => {
    apiMonitor.clear();
  });

  describe('recordMetric', () => {
    it('should record metrics correctly', () => {
      apiMonitor.recordMetric('/api/test', 'GET', 200, 100);
      
      const metrics = apiMonitor.getRecentMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toEqual({
        endpoint: '/api/test',
        method: 'GET',
        statusCode: 200,
        duration: 100,
        timestamp: expect.any(Number)
      });
    });

    it('should limit stored metrics', () => {
      // Add more metrics than the limit
      for (let i = 0; i < 110; i++) {
        apiMonitor.recordMetric(`/api/test${i}`, 'GET', 200, 100);
      }
      
      const metrics = apiMonitor.getRecentMetrics();
      expect(metrics).toHaveLength(100);
    });
  });

  describe('getErrorRate', () => {
    it('should calculate error rate correctly', () => {
      // Record successful requests
      for (let i = 0; i < 5; i++) {
        apiMonitor.recordMetric('/api/test', 'GET', 200, 100);
      }
      
      // Record failed requests
      for (let i = 0; i < 3; i++) {
        apiMonitor.recordMetric('/api/test', 'GET', 500, 100);
      }
      
      const errorRate = apiMonitor.getErrorRate('/api/test');
      expect(errorRate).toBe(37.5); // 3 errors out of 8 total requests = 37.5%
    });

    it('should return 0 for no metrics', () => {
      const errorRate = apiMonitor.getErrorRate('/api/nonexistent');
      expect(errorRate).toBe(0);
    });
  });

  describe('getAverageResponseTime', () => {
    it('should calculate average response time correctly', () => {
      apiMonitor.recordMetric('/api/test', 'GET', 200, 100);
      apiMonitor.recordMetric('/api/test', 'GET', 200, 200);
      apiMonitor.recordMetric('/api/test', 'GET', 200, 300);
      
      const avgTime = apiMonitor.getAverageResponseTime('/api/test');
      expect(avgTime).toBe(200); // (100 + 200 + 300) / 3 = 200
    });

    it('should return 0 for no metrics', () => {
      const avgTime = apiMonitor.getAverageResponseTime('/api/nonexistent');
      expect(avgTime).toBe(0);
    });
  });

  describe('measureApiCall', () => {
    it('should measure successful API calls', async () => {
      const result = await measureApiCall('/api/test', 'GET', async () => {
        // Simulate some work
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'success';
      });
      
      expect(result).toBe('success');
      
      const metrics = apiMonitor.getRecentMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].statusCode).toBe(200);
      expect(metrics[0].duration).toBeGreaterThanOrEqual(10);
    });

    it('should measure failed API calls', async () => {
      const error = new Error('Test error');
      (error as any).status = 500;
      
      await expect(
        measureApiCall('/api/test', 'GET', async () => {
          throw error;
        })
      ).rejects.toThrow('Test error');
      
      const metrics = apiMonitor.getRecentMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].statusCode).toBe(500);
    });
  });
});