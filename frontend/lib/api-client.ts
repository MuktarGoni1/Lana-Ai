import { ApiErrorResponse, StructuredLessonResponse } from '@/types/api';

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
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

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
        } catch (e: unknown) {
          // If we can't parse the error response, use status text
          errorMessage = `${response.status} ${response.statusText}`;
        }
        
        // Map to user-friendly messages
        errorMessage = getErrorMessage(response.status, errorMessage);
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Cache the response
      apiCache.set(cacheKey, data);
      
      return data as T;
    } catch (e: unknown) {
      logError('API request failed:', e);
      throw e;
    }
  },

  // POST request (no caching for mutations)
  async post<T, U>(url: string, body: U, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        body: JSON.stringify(body),
        ...options,
      });

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
        } catch (error: unknown) {
          // If we can't parse the error response, use status text
          errorMessage = `${response.status} ${response.statusText}`;
        }
        
        // Map to user-friendly messages
        errorMessage = getErrorMessage(response.status, errorMessage);
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Invalidate related GET caches
      apiCache.invalidate(new RegExp(`GET:${url}`));
      
      return data as T;
    } catch (error: unknown) {
      logError('API request failed:', error);
      throw error;
    }
  },

  // Clear all cache
  clearCache(): void {
    apiCache.clear();
  }
};