import { ApiErrorResponse } from '@/types/api';
import { ApiError, NetworkError } from './errors';
import rateLimiter from '@/lib/rate-limiter';

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

class ApiCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
  private CACHE_SIZE_LIMIT = 50; // Maximum number of cached responses

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if cache entry is still valid
    if (Date.now() - entry.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: T): void {
    // Enforce cache size limit
    if (this.cache.size >= this.CACHE_SIZE_LIMIT) {
      // Remove oldest entry if cache is full
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  invalidate(keyPattern: RegExp): void {
    for (const key of this.cache.keys()) {
      if (keyPattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

// Singleton cache instance
const apiCache = new ApiCache<unknown>();

// Production-safe error logging helper
const isDev = process.env.NODE_ENV === 'development';
const logError = (...args: unknown[]) => {
  if (isDev) {
    console.error(...args);
  }
};

// Map HTTP status codes to user-friendly messages
const getErrorMessage = (status: number, defaultMessage: string): string => {
  switch (status) {
    case 400:
      return 'Bad request - please check your input';
    case 401:
      return 'Authentication required - please sign in';
    case 403:
      return 'Access denied - insufficient permissions';
    case 404:
      return 'Resource not found';
    case 429:
      return 'Too many requests - please try again later';
    case 500:
      return 'Server error - please try again later';
    case 502:
    case 503:
    case 504:
      return 'Service temporarily unavailable - please try again later';
    default:
      return defaultMessage || `Request failed with status ${status}`;
  }
};

// Helper: per-request timeout and basic retry with exponential backoff
async function requestWithTimeoutAndRetry(
  url: string,
  init: RequestInit,
  opts?: { timeoutMs?: number; retries?: number; retryDelayMs?: number }
) {
  const timeoutMs = opts?.timeoutMs ?? Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS ?? 8000);
  const maxRetries = Math.max(0, opts?.retries ?? 2);
  const baseDelay = Math.max(100, opts?.retryDelayMs ?? 300);

  let attempt = 0;
  const start = typeof performance !== 'undefined' ? performance.now() : Date.now();

  while (true) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timer);
      const status = res.status;
      // Retry on transient server issues and rate limiting
      if ([429, 502, 503, 504].includes(status) && attempt < maxRetries) {
        // For rate limiting, use a longer delay
        const delay = status === 429 
          ? Math.max(5000, baseDelay * Math.pow(2, attempt)) // At least 5 seconds for rate limiting
          : baseDelay * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
        attempt++;
        continue;
      }
      const end = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const durationMs = Math.round(end - start);
      if (process.env.NODE_ENV === 'development') {
        console.info('[api] request', { url, status, durationMs });
      }
      return res;
    } catch (err) {
      clearTimeout(timer);
      // Retry on abort (timeout) or network errors if attempts remain
      const isAbort = (err as { name?: string })?.name === 'AbortError';
      const isNetwork = err instanceof TypeError; // fetch network errors in browsers
      if ((isAbort || isNetwork) && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
        attempt++;
        continue;
      }
      if (isNetwork) {
        throw new NetworkError('A network error occurred. Please check your connection.');
      }
      throw err;
    }
  }
}

// API client with caching
export const apiClient = {
  // GET request with caching
  async get<T>(url: string, options?: RequestInit, bypassCache = false): Promise<T> {
    const cacheKey = `GET:${url}`;
    
    // Try to get from cache unless bypass is requested
    if (!bypassCache) {
      const cachedData = apiCache.get(cacheKey);
      if (cachedData) {
        return cachedData as T;
      }
    }

    // Fetch fresh data
    try {
      const response = await requestWithTimeoutAndRetry(
        url,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
          },
          ...options,
        },
        { timeoutMs: Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS ?? 8000), retries: 2, retryDelayMs: 300 }
      );

      if (!response.ok) {
        // Enhanced error handling with more specific error messages
        let errorMessage = `API error: ${response.status}`;
        
        try {
          const errorData: ApiErrorResponse = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // If we can't parse the error response, use status text
          errorMessage = `${response.status} ${response.statusText}`;
        }
        
        // Map to user-friendly messages
        errorMessage = getErrorMessage(response.status, errorMessage);
        
        throw new ApiError(errorMessage, response.status);
      }

      const data = await response.json();
      
      // Cache the response
      apiCache.set(cacheKey, data);
      
      return data as T;
    } catch (e: unknown) {
      if (e instanceof ApiError || e instanceof NetworkError) {
        throw e;
      }
      logError('API GET failed:', e);
      throw new Error('An unexpected error occurred.');
    }
  },

  // POST request (no caching for mutations)
  async post<T, U>(url: string, body: U, options?: RequestInit): Promise<T> {
    // Check rate limit before making request
    // Extract endpoint from URL (e.g., /api/structured-lesson/stream)
    const endpoint = new URL(url, 'http://localhost').pathname;
    if (!rateLimiter.isAllowed(endpoint)) {
      const waitTime = rateLimiter.getTimeUntilNextRequest(endpoint);
      throw new ApiError(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds before trying again.`, 429);
    }
    
    try {
      const response = await requestWithTimeoutAndRetry(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
          },
          body: JSON.stringify(body),
          ...options,
        },
        { timeoutMs: Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS ?? 10000), retries: 2, retryDelayMs: 300 }
      );

      if (!response.ok) {
        // Enhanced error handling with more specific error messages
        let errorMessage = `API error: ${response.status}`;
        
        try {
          const errorData: ApiErrorResponse = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // If we can't parse the error response, use status text
          errorMessage = `${response.status} ${response.statusText}`;
        }
        errorMessage = getErrorMessage(response.status, errorMessage);
        throw new ApiError(errorMessage, response.status);
      }

      // Invalidate cache for related GET requests
      // This is a simple invalidation, a more robust strategy might be needed
      if (url.includes('/history')) {
        apiCache.invalidate(/GET:\/api\/history/);
      }

      return (await response.json()) as T;
    } catch (e: unknown) {
      if (e instanceof ApiError || e instanceof NetworkError) {
        throw e;
      }
      logError('API POST failed:', e);
      throw new Error('An unexpected error occurred.');
    }
  },
};
