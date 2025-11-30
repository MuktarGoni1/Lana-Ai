// lib/monitoring.ts
// Simple monitoring utilities for tracking API performance and errors

interface ApiMetrics {
  endpoint: string;
  method: string;
  statusCode: number;
  duration: number;
  timestamp: number;
}

class ApiMonitor {
  private metrics: ApiMetrics[] = [];
  private readonly MAX_METRICS = 100; // Limit stored metrics to prevent memory issues

  // Record an API call metric
  recordMetric(endpoint: string, method: string, statusCode: number, duration: number) {
    const metric: ApiMetrics = {
      endpoint,
      method,
      statusCode,
      duration,
      timestamp: Date.now()
    };

    this.metrics.push(metric);
    
    // Trim old metrics if we exceed the limit
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.info(`[API Monitor] ${method} ${endpoint} - ${statusCode} (${duration}ms)`);
    }
  }

  // Record an error
  recordError(endpoint: string, method: string, error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[API Monitor] Error on ${method} ${endpoint}:`, error);
    }
  }

  // Get recent metrics
  getRecentMetrics(minutes: number = 5): ApiMetrics[] {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.metrics.filter(metric => metric.timestamp >= cutoff);
  }

  // Get error rate for an endpoint
  getErrorRate(endpoint: string, minutes: number = 5): number {
    const recentMetrics = this.getRecentMetrics(minutes);
    const endpointMetrics = recentMetrics.filter(m => m.endpoint === endpoint);
    
    if (endpointMetrics.length === 0) return 0;
    
    const errors = endpointMetrics.filter(m => m.statusCode >= 400).length;
    return (errors / endpointMetrics.length) * 100;
  }

  // Get average response time for an endpoint
  getAverageResponseTime(endpoint: string, minutes: number = 5): number {
    const recentMetrics = this.getRecentMetrics(minutes);
    const endpointMetrics = recentMetrics.filter(m => m.endpoint === endpoint);
    
    if (endpointMetrics.length === 0) return 0;
    
    const totalDuration = endpointMetrics.reduce((sum, m) => sum + m.duration, 0);
    return totalDuration / endpointMetrics.length;
  }

  // Clear all metrics
  clear() {
    this.metrics = [];
  }
}

// Export a singleton instance
export const apiMonitor = new ApiMonitor();

// Utility function to measure API call performance
export async function measureApiCall<T>(
  endpoint: string,
  method: string,
  apiCall: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  
  try {
    const result = await apiCall();
    const end = performance.now();
    const duration = Math.round(end - start);
    
    apiMonitor.recordMetric(endpoint, method, 200, duration);
    return result;
  } catch (error) {
    const end = performance.now();
    const duration = Math.round(end - start);
    
    // Try to extract status code from error if it's an ApiError
    let statusCode = 500;
    if (error instanceof Error && 'status' in error) {
      statusCode = (error as any).status;
    }
    
    apiMonitor.recordMetric(endpoint, method, statusCode, duration);
    apiMonitor.recordError(endpoint, method, error);
    
    throw error;
  }
}