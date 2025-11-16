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
   * Looks in `guardians` and `users` tables.
   */
  async isEmailAuthenticated(email: string): Promise<boolean> {
    try {
      const trimmed = email.trim();
      if (!trimmed) return false;

      const { data: gData, error: gErr } = await supabase
        .from('guardians')
        .select('email')
        .ilike('email', trimmed)
        .limit(1);
      if (gErr) console.debug('[AuthService] guardians check error:', gErr);
      if (Array.isArray(gData) && gData.length > 0) return true;

      const { data: uData, error: uErr } = await supabase
        .from('users')
        .select('email')
        .ilike('email', trimmed)
        .limit(1);
      if (uErr) console.debug('[AuthService] users check error:', uErr);
      return Array.isArray(uData) && uData.length > 0;
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
      const { data, error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          data: { role: "guardian" },
          emailRedirectTo: `${window.location.origin}/auth/confirmed/guardian`,
        },
      });

      if (error) throw error;

      // Also create a record in the guardians table
      const { error: insertError } = await supabase.from("guardians").insert({
        email: email.trim(),
        weekly_report: true,
        monthly_report: false,
      });
      
      if (insertError) {
        console.warn('[AuthService] Failed to create guardian record:', insertError);
        // Don't throw here as the auth was successful
      }
      
      return data;
    } catch (error: unknown) {
      console.debug("[AuthService] registerParent error:", error);
      throw error;
    }
  }

  async registerChild(nickname: string, age: number, grade: string, contactEmail?: string) {
    try {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

      const child_uid = crypto.randomUUID()
      const email = `${child_uid}@child.lana`
      const password = child_uid // Use child_uid as password for consistency

      // Create the auth user
      const { data, error: signError } = await supabase.auth.signUp({
        email: email,
        password: password, // Use child_uid as password for consistency
        options: {
          data: { role: "child", nickname, age, grade, contact_email: contactEmail ?? null },
          emailRedirectTo: `${window.location.origin}/auth/confirmed/child`,
        }
      })

      if (signError) throw signError

      // Store child row in users table
      const { error: insertError } = await supabase.from("users").insert({
        id: child_uid,
        email: email,
        user_metadata: { role: "child", nickname, age, grade, contact_email: contactEmail ?? null },
      });
      
      if (insertError) {
        console.warn('[AuthService] Failed to create user record:', insertError);
        // Don't throw here as the auth was successful
      }

      // Store session ID in localStorage for anonymous users
      localStorage.setItem("lana_sid", child_uid);
      return data;
    } catch (error: unknown) {
      console.debug("[AuthService] registerChild error:", error);
      throw error;
    }
  }
}