import { supabase } from '@/lib/db';
import { createClient } from '@supabase/supabase-js';

export class AuthService {
  /**
   * Verify email exists and is confirmed in Supabase Auth via secure API.
   * Uses server-only service role behind `/api/auth/verify-email`.
   */
  async verifyEmailWithSupabaseAuth(email: string): Promise<{ exists: boolean; confirmed: boolean; userId?: string | null; }> {
    const t0 = performance.now();
    const trimmed = email.trim().toLowerCase();
    try {
      const isOffline = typeof globalThis !== 'undefined' && typeof (globalThis as any).navigator !== 'undefined' && (globalThis as any).navigator.onLine === false
      if (isOffline) {
        throw new Error('You appear to be offline. Please check your connection.');
      }

      // Setup timeout and abort controller
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const attempt = async () => {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmed }),
          signal: controller.signal,
        });
        const t1 = performance.now();
        if (!res.ok) {
          // Map common errors
          const data = await res.json().catch(() => ({}));
          if (res.status === 400) throw new Error(data?.message ?? 'Invalid email.');
          if (res.status === 429) throw new Error(data?.message ?? 'Too many attempts. Please wait and try again.');
          if (res.status === 503) throw new Error(data?.message ?? 'Verification service temporarily unavailable. Please try again later.');
          if (res.status >= 500) throw new Error(data?.message ?? 'Temporary server error. Please try again.');
          throw new Error(data?.message ?? `Verification failed (status ${res.status}).`);
        }
        const json = await res.json();
        const t2 = performance.now();
        if (process.env.NODE_ENV === 'development') {
          console.info('[AuthService.verifyEmail] timings_ms', { fetch_ms: Math.round(t1 - t0), parse_ms: Math.round(t2 - t1) });
        }
        return { exists: Boolean(json?.exists), confirmed: Boolean(json?.confirmed), userId: json?.userId ?? null };
      };

      try {
        const result = await attempt();
        clearTimeout(timeout);
        return result;
      } catch (err) {
        // Retry once for network/abort errors
        if (err instanceof DOMException && err.name === 'AbortError') {
          console.warn('[AuthService.verifyEmail] request timed out, retrying once');
        } else if (err instanceof Error && /network|fetch|failed/i.test(err.message)) {
          console.warn('[AuthService.verifyEmail] network error, retrying once');
        } else {
          clearTimeout(timeout);
          throw err;
        }
        // Small backoff
        await new Promise((r) => setTimeout(r, 300));
        const result = await attempt();
        clearTimeout(timeout);
        return result;
      }
    } catch (error) {
      console.warn('[AuthService.verifyEmail] error', error);
      throw error instanceof Error ? error : new Error('Network or server error during verification.');
    }
  }
  
  /**
   * Check if an email exists in our authenticated users dataset.
   * Uses the proper Supabase Auth methods instead of querying non-existent tables.
   */
  async isEmailAuthenticated(email: string): Promise<boolean> {
    try {
      const trimmed = email.trim();
      if (!trimmed) return false;

      // Use the secure API endpoint to check if user is authenticated
      // This avoids trying to query non-existent database tables
      try {
        const response = await fetch('/api/auth/check-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmed }),
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.exists === true;
        }
        
        // If the API call fails, fall back to using the verify-email endpoint
        console.debug('[AuthService] API check failed, falling back to verify-email');
        const verifyResponse = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmed }),
        });
        
        if (verifyResponse.ok) {
          const data = await verifyResponse.json();
          return data.exists === true;
        }
        
        return false;
      } catch (apiError) {
        console.debug('[AuthService] API check error, falling back:', apiError);
        return false;
      }
    } catch (error) {
      console.debug('[AuthService] isEmailAuthenticated error:', error);
      return false;
    }
  }
  
  async login(email: string) {
    try {
      const trimmed = email.trim();
      const { data, error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo: `${window.location.origin}/term-plan?onboarding=1`,
        },
      });
      if (error) throw error;
      return data;
    } catch (error: unknown) {
      console.debug("[AuthService] login magic link error:", error);
      throw error;
    }
  }
  
  async registerParent(email: string) {
    try {
      const trimmedEmail = email.trim();
      
      // First, create a record in the guardians table
      // Cast supabase to any to bypass typing issues
      const sb: any = supabase;
      const { error: insertError } = await sb.from("guardians").upsert({
        email: trimmedEmail,
        weekly_report: true,
        monthly_report: false,
      }, { onConflict: 'email' });
      
      if (insertError) {
        console.warn('[AuthService] Failed to create guardian record:', insertError);
        // Don't throw here as we still want to proceed with authentication
      }

      // Then send the magic link
      const { data, error } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: {
          data: { role: "guardian" },
          emailRedirectTo: `${window.location.origin}/auth/confirmed/guardian`,
        },
      });

      if (error) throw error;
      
      return data;
    } catch (error: unknown) {
      console.debug("[AuthService] registerParent error:", error);
      throw error;
    }
  }

  async registerChild(nickname: string, age: number, grade: string, guardianEmail: string) {
    try {
      const child_uid = crypto.randomUUID();
      const email = `${child_uid}@child.lana`;
      const password = crypto.randomUUID(); // Generate a secure password

      // Create the auth user
      const { data, error: signError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: { role: "child", nickname, age, grade, guardian_email: guardianEmail },
          emailRedirectTo: `${window.location.origin}/auth/confirmed/child`,
        }
      });

      if (signError) throw signError;

      // Store child row in users table (if it exists)
      try {
        // Cast supabase to any to bypass typing issues
        const sb: any = supabase;
        const { error: insertError } = await sb.from("users").insert({
          id: child_uid,
          email: email,
          user_metadata: JSON.stringify({ role: "child", nickname, age, grade, guardian_email: guardianEmail }),
        });
        
        if (insertError) {
          console.warn('[AuthService] Failed to create user record:', insertError);
          // Don't throw here as the auth was successful
        }
      } catch (tableError) {
        // If the users table doesn't exist, that's okay
        console.debug('[AuthService] Users table may not exist, continuing without it:', tableError);
      }

      // Link child to guardian
      try {
        // Cast supabase to any to bypass typing issues
        const sb: any = supabase;
        const { error: linkError } = await sb.from("guardians").insert({
          email: guardianEmail,
          child_uid: child_uid,
          weekly_report: true,
          monthly_report: false,
        });
        
        if (linkError) {
          console.warn('[AuthService] Failed to link child to guardian:', linkError);
          // Don't throw here as the auth was successful
        }
      } catch (linkError) {
        console.debug('[AuthService] Error linking child to guardian:', linkError);
      }

      // Store session ID in localStorage for anonymous users
      if (typeof window !== 'undefined') {
        localStorage.setItem("lana_sid", child_uid);
      }
      
      return data;
    } catch (error: unknown) {
      console.debug("[AuthService] registerChild error:", error);
      throw error;
    }
  }
}