import { createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// Type definition for rate limit records
interface RateLimitRecord {
  id: string;
  endpoint: string;
  identifier: string; // IP address or user ID
  request_count: number;
  window_start: string; // ISO date string
  created_at: string; // ISO date string
}

// Rate limit configuration
interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

class ServerSideRateLimiter {
  private defaultLimits: Map<string, RateLimitConfig> = new Map();

  constructor() {
    // Set default limits for common endpoints
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // More generous limits for local development
    this.defaultLimits.set('/api/structured-lesson', { 
      maxRequests: isDevelopment ? 10 : 5, 
      windowMs: 60000 // 1 minute
    });
    this.defaultLimits.set('/api/structured-lesson/stream', { 
      maxRequests: isDevelopment ? 5 : 5, 
      windowMs: 60000 // 1 minute
    });
    this.defaultLimits.set('/api/tts', { 
      maxRequests: isDevelopment ? 3 : 1, 
      windowMs: 60000 // 1 minute
    });
    this.defaultLimits.set('/api/tts/lesson', { 
      maxRequests: isDevelopment ? 3 : 1, 
      windowMs: 60000 // 1 minute
    });
    this.defaultLimits.set('/api/chat', { 
      maxRequests: isDevelopment ? 20 : 10, 
      windowMs: 60000 // 1 minute
    });
    this.defaultLimits.set('/api/auth/register-parent', { 
      maxRequests: isDevelopment ? 10 : 5, 
      windowMs: 60000 // 1 minute
    });
    this.defaultLimits.set('/api/auth/register-child', { 
      maxRequests: isDevelopment ? 20 : 10, 
      windowMs: 60000 // 1 minute
    });
  }

  /**
   * Gets the client's IP address from headers
   */
  private getClientIP(requestHeaders?: Headers): string {
    // Extract IP from request headers when available
    if (requestHeaders) {
      const forwarded = requestHeaders.get('x-forwarded-for');
      const realIP = requestHeaders.get('x-real-ip');
      
      if (forwarded && typeof forwarded === 'string') {
        return forwarded.split(',')[0].trim();
      }
      if (realIP && typeof realIP === 'string') {
        return realIP.trim();
      }
    }
    
    // For server-side usage where we might not have direct access to request
    // This is a fallback that should be overridden when called from API routes
    return 'unknown';
  }

  /**
   * Gets the rate limit configuration for an endpoint
   */
  private getLimitConfig(endpoint: string): RateLimitConfig {
    return this.defaultLimits.get(endpoint) || { maxRequests: 100, windowMs: 60000 }; // Default generous limit
  }

  /**
   * Checks if a request is allowed based on rate limiting rules
   */
  async isAllowed(endpoint: string, identifier?: string): Promise<{ allowed: boolean; retryAfter?: number; resetTime?: number }> {
    // If no identifier is provided, use IP address as the identifier
    const id = identifier || this.getClientIP();
    
    if (!id || id === 'unknown') {
      // If we can't identify the requester, be lenient but log for monitoring
      console.warn(`[ServerRateLimiter] Unable to identify requester for endpoint ${endpoint}, allowing request`);
      return { allowed: true };
    }

    const config = this.getLimitConfig(endpoint);
    const now = new Date();
    const windowStart = new Date(now.getTime() - config.windowMs);

    try {
      // Create a Supabase client for server-side operations
      const supabase = await createServerClient();

      // Attempt to find existing rate limit record for this endpoint and identifier within the time window
      // Since there's no dedicated rate limits table, we'll use the user_events table
      // We'll store rate limit events as a special type of user event
      
      // First, try to increment an existing counter or create a new one
      const { data: existingRecords, error: fetchError } = await supabase
        .from('user_events')
        .select('id, event_type, metadata, timestamp')
        .eq('event_type', 'rate_limit_check')
        .eq('metadata->>identifier', id)
        .eq('metadata->>endpoint', endpoint)
        .gte('timestamp', windowStart.toISOString())
        .order('timestamp', { ascending: false });

      if (fetchError) {
        console.error('[ServerRateLimiter] Error fetching rate limit data:', fetchError);
        // If there's an error accessing the DB, be lenient to avoid blocking legitimate requests
        return { allowed: true };
      }

      const recentRequests = existingRecords?.length || 0;
      
      if (recentRequests >= config.maxRequests) {
        // Calculate when the rate limit window resets
        const nextWindowStart = new Date(windowStart.getTime() + config.windowMs);
        const timeUntilReset = nextWindowStart.getTime() - now.getTime();
        const resetTime = nextWindowStart.getTime();
        
        return {
          allowed: false,
          retryAfter: Math.ceil(timeUntilReset / 1000),
          resetTime
        };
      }

      // Record this request in the database
      const { error: insertError } = await supabase
        .from('user_events')
        .insert([{
          event_type: 'rate_limit_check',
          ip_address: id, // Store IP as the primary identifier
          metadata: {
            identifier: id,
            endpoint: endpoint,
            timestamp: now.toISOString()
          },
          timestamp: now.toISOString(),
          user_id: id // Using identifier as user_id for rate limiting purposes
        }]);

      if (insertError) {
        console.error('[ServerRateLimiter] Error recording rate limit check:', insertError);
        // Still allow the request even if we couldn't record it
      }

      return {
        allowed: true,
        resetTime: new Date(windowStart.getTime() + config.windowMs).getTime()
      };

    } catch (error) {
      console.error('[ServerRateLimiter] Unexpected error:', error);
      // Fail open - if there's an error, allow the request to go through
      return { allowed: true };
    }
  }

  /**
   * Alternative implementation using a temporary storage approach if the user_events table isn't suitable
   * This would require a dedicated rate limits table in the future
   */
  async isAllowedSimple(endpoint: string, identifier?: string): Promise<{ allowed: boolean; retryAfter?: number; resetTime?: number }> {
    // If no identifier is provided, use IP address as the identifier
    const id = identifier || this.getClientIP();
    
    if (!id || id === 'unknown') {
      // If we can't identify the requester, be lenient but log for monitoring
      console.warn(`[ServerRateLimiter] Unable to identify requester for endpoint ${endpoint}, allowing request`);
      return { allowed: true };
    }

    const config = this.getLimitConfig(endpoint);
    const now = new Date();
    const windowStart = new Date(now.getTime() - config.windowMs);

    try {
      // Create a Supabase client for server-side operations
      const supabase = await createServerClient();

      // Query user_events table to count recent requests for this identifier and endpoint
      const { data, error, count } = await supabase
        .from('user_events')
        .select('*', { count: 'exact' })
        .eq('user_id', id) // Using user_id field to store the identifier
        .eq('event_type', 'api_request') // Assuming we'll categorize API requests
        .eq('metadata->>endpoint', endpoint)
        .gte('timestamp', windowStart.toISOString());

      if (error) {
        console.error('[ServerRateLimiter] Error querying rate limit data:', error);
        // If there's an error accessing the DB, be lenient to avoid blocking legitimate requests
        return { allowed: true };
      }

      const requestCount = count || 0;
      
      if (requestCount >= config.maxRequests) {
        // Rate limit exceeded
        const nextWindowStart = new Date(windowStart.getTime() + config.windowMs);
        const timeUntilReset = nextWindowStart.getTime() - now.getTime();
        
        return {
          allowed: false,
          retryAfter: Math.ceil(timeUntilReset / 1000),
          resetTime: nextWindowStart.getTime()
        };
      }

      // Record this request
      const { error: insertError } = await supabase
        .from('user_events')
        .insert([{
          user_id: id,
          event_type: 'api_request',
          ip_address: id,
          metadata: { endpoint },
          timestamp: now.toISOString(),
          url: endpoint,
        }]);

      if (insertError) {
        console.error('[ServerRateLimiter] Error recording API request:', insertError);
        // Still allow the request even if we couldn't record it
      }

      return {
        allowed: true,
        resetTime: new Date(windowStart.getTime() + config.windowMs).getTime()
      };

    } catch (error) {
      console.error('[ServerRateLimiter] Unexpected error:', error);
      // Fail open - if there's an error, allow the request to go through
      return { allowed: true };
    }
  }
}

// Create a singleton instance
const serverRateLimiter = new ServerSideRateLimiter();

export default serverRateLimiter;