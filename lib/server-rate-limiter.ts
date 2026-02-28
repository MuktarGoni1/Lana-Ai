import { createServerClient } from '@/lib/supabase/server';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
  resetTime?: number;
}

class ServerSideRateLimiter {
  private defaultLimits: Map<string, RateLimitConfig> = new Map();
  private localBuckets: Map<string, { count: number; resetAt: number }> = new Map();

  constructor() {
    const isDevelopment = process.env.NODE_ENV === 'development';

    this.defaultLimits.set('/api/structured-lesson', {
      maxRequests: isDevelopment ? 10 : 5,
      windowMs: 60_000,
    });
    this.defaultLimits.set('/api/structured-lesson/stream', {
      maxRequests: isDevelopment ? 5 : 5,
      windowMs: 60_000,
    });
    this.defaultLimits.set('/api/tts', {
      maxRequests: isDevelopment ? 3 : 1,
      windowMs: 60_000,
    });
    this.defaultLimits.set('/api/tts/lesson', {
      maxRequests: isDevelopment ? 3 : 1,
      windowMs: 60_000,
    });
    this.defaultLimits.set('/api/chat', {
      maxRequests: isDevelopment ? 20 : 10,
      windowMs: 60_000,
    });
    this.defaultLimits.set('/api/auth/register-parent', {
      maxRequests: isDevelopment ? 10 : 5,
      windowMs: 60_000,
    });
    this.defaultLimits.set('/api/auth/register-child', {
      maxRequests: isDevelopment ? 20 : 10,
      windowMs: 60_000,
    });
  }

  private getLimitConfig(endpoint: string): RateLimitConfig {
    return this.defaultLimits.get(endpoint) || { maxRequests: 100, windowMs: 60_000 };
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  private checkLocalLimit(endpoint: string, identifier: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now();
    const key = `${endpoint}:${identifier}`;
    const existing = this.localBuckets.get(key);

    if (!existing || existing.resetAt <= now) {
      const resetAt = now + config.windowMs;
      this.localBuckets.set(key, { count: 1, resetAt });
      return { allowed: true, resetTime: resetAt };
    }

    if (existing.count >= config.maxRequests) {
      const retryAfter = Math.ceil((existing.resetAt - now) / 1000);
      return { allowed: false, retryAfter, resetTime: existing.resetAt };
    }

    existing.count += 1;
    this.localBuckets.set(key, existing);
    return { allowed: true, resetTime: existing.resetAt };
  }

  private async checkPersistentLimit(
    endpoint: string,
    userId: string,
    eventType: 'rate_limit_check' | 'api_request'
  ): Promise<RateLimitResult> {
    const config = this.getLimitConfig(endpoint);
    const now = new Date();
    const windowStart = new Date(now.getTime() - config.windowMs).toISOString();
    const resetAt = now.getTime() + config.windowMs;

    try {
      const supabase = await createServerClient();

      const { count, error } = await supabase
        .from('user_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', eventType)
        .eq('user_id', userId)
        .eq('metadata->>endpoint', endpoint)
        .gte('timestamp', windowStart);

      if (error) {
        console.error('[ServerRateLimiter] Persistent read failed, falling back to local limiter:', error);
        return this.checkLocalLimit(endpoint, userId, config);
      }

      if ((count || 0) >= config.maxRequests) {
        return {
          allowed: false,
          retryAfter: Math.ceil((resetAt - now.getTime()) / 1000),
          resetTime: resetAt,
        };
      }

      const { error: insertError } = await supabase.from('user_events').insert([
        {
          user_id: userId,
          event_type: eventType,
          metadata: { endpoint },
          timestamp: now.toISOString(),
          url: endpoint,
        },
      ]);

      if (insertError) {
        console.error('[ServerRateLimiter] Persistent write failed:', insertError);
      }

      return { allowed: true, resetTime: resetAt };
    } catch (error) {
      console.error('[ServerRateLimiter] Unexpected error, falling back to local limiter:', error);
      return this.checkLocalLimit(endpoint, userId, config);
    }
  }

  async isAllowed(endpoint: string, identifier?: string): Promise<RateLimitResult> {
    const id = (identifier || 'unknown').trim();
    const config = this.getLimitConfig(endpoint);

    if (!id || id === 'unknown') {
      return { allowed: true };
    }

    if (!this.isUuid(id)) {
      return this.checkLocalLimit(endpoint, id, config);
    }

    return this.checkPersistentLimit(endpoint, id, 'rate_limit_check');
  }

  async isAllowedSimple(endpoint: string, identifier?: string): Promise<RateLimitResult> {
    const id = (identifier || 'unknown').trim();
    const config = this.getLimitConfig(endpoint);

    if (!id || id === 'unknown') {
      return { allowed: true };
    }

    if (!this.isUuid(id)) {
      return this.checkLocalLimit(endpoint, id, config);
    }

    return this.checkPersistentLimit(endpoint, id, 'api_request');
  }
}

const serverRateLimiter = new ServerSideRateLimiter();

export default serverRateLimiter;
