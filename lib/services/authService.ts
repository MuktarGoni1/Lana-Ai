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
          if (res.status === 504) throw new Error(data?.message ?? 'Network timeout while verifying email. Please check your connection and try again.');
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
        } else if (err instanceof Error && /network|fetch|failed|timeout/i.test(err.message)) {
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
          // Check both that the user exists and that their email is confirmed
          return data.exists === true && data.confirmed === true;
        }
        
        // Handle specific error cases
        if (response.status === 504) {
          console.debug('[AuthService] Network timeout while checking user authentication');
          throw new Error('Network timeout while checking user authentication. Please check your connection and try again.');
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
          return data.exists === true && data.confirmed === true;
        }
        
        // Handle specific error cases for verify-email endpoint
        if (verifyResponse.status === 504) {
          console.debug('[AuthService] Network timeout while verifying email');
          throw new Error('Network timeout while verifying email. Please check your connection and try again.');
        }
        
        return false;
      } catch (apiError) {
        console.debug('[AuthService] API check error, falling back:', apiError);
        // If it's a network timeout error, re-throw it
        if (apiError instanceof Error && apiError.message.includes('timeout')) {
          throw apiError;
        }
        return false;
      }
    } catch (error) {
      console.debug('[AuthService] isEmailAuthenticated error:', error);
      throw error;
    }
  }
  
  async login(email: string) {
    try {
      const trimmed = email.trim();
      // First verify if the email is authenticated
      const verificationResult = await this.verifyEmailWithSupabaseAuth(trimmed);
      
      if (verificationResult.exists && verificationResult.confirmed) {
        // User is authenticated, sign them in directly
        // For security, we still need to use Supabase's authentication flow
        // We'll send a magic link but with a custom redirect that handles automatic login
        const { data, error } = await supabase.auth.signInWithOtp({
          email: trimmed,
          options: {
            shouldCreateUser: false, // Don't create a new user if they don't exist
            emailRedirectTo: 'https://www.lanamind.com/auth/auto-login',
          },
        });

        if (error) throw error;
        
        return data;
      } else if (verificationResult.exists && !verificationResult.confirmed) {
        throw new Error('Email not yet authenticated. Please check your email for verification instructions.');
      } else {
        throw new Error('Email not authenticated. Please register first.');
      }
    } catch (error: unknown) {
      console.debug("[AuthService] login error:", error);
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
          emailRedirectTo: 'https://www.lanamind.com/auth/auto-login',
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
      // Call the enhanced API route
      const response = await fetch('/api/auth/register-child', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname,
          age,
          grade,
          guardianEmail
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        // If API registration fails due to offline status, save locally
        if (result.offline) {
          this.saveChildLocally(nickname, age, grade, guardianEmail);
          return {
            success: false,
            message: result.message,
            offline: true
          };
        }
        // For other failures, still save locally
        this.saveChildLocally(nickname, age, grade, guardianEmail);
        throw new Error(result.message || 'Failed to register child');
      }
      
      // Store session ID in localStorage for anonymous users (using first child if bulk)
      if (typeof window !== 'undefined' && result.data && result.data.length > 0) {
        const childData = result.data[0];
        localStorage.setItem("lana_sid", childData.child_uid);
      }
      
      return result;
    } catch (error: unknown) {
      console.debug("[AuthService] registerChild error:", error);
      // Save locally on any network error
      this.saveChildLocally(nickname, age, grade, guardianEmail);
      throw error;
    }
  }

  async registerMultipleChildren(children: { nickname: string; age: number; grade: string }[], guardianEmail: string) {
    try {
      // Call the enhanced API route for bulk registration
      const response = await fetch('/api/auth/register-child', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          children,
          guardianEmail
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        // If API registration fails due to offline status, save locally
        if (result.offline) {
          children.forEach(child => {
            this.saveChildLocally(child.nickname, child.age, child.grade, guardianEmail);
          });
          return {
            success: false,
            message: result.message,
            offline: true
          };
        }
        // For other failures, still save locally
        children.forEach(child => {
          this.saveChildLocally(child.nickname, child.age, child.grade, guardianEmail);
        });
        throw new Error(result.message || 'Failed to register children');
      }
      
      return result;
    } catch (error: unknown) {
      console.debug("[AuthService] registerMultipleChildren error:", error);
      // Save locally on any network error
      children.forEach(child => {
        this.saveChildLocally(child.nickname, child.age, child.grade, guardianEmail);
      });
      throw error;
    }
  }

  // Save child data locally when API registration fails
  saveChildLocally(nickname: string, age: number, grade: string, guardianEmail: string) {
    if (typeof window !== 'undefined') {
      try {
        // Get existing local children or initialize empty array
        const localChildren = this.getLocalChildren();
        
        // Create new child object
        const newChild = {
          id: crypto.randomUUID(),
          nickname,
          age,
          grade,
          guardianEmail,
          createdAt: new Date().toISOString(),
          linked: false // Mark as not yet linked to account
        };
        
        // Add new child to local storage
        localChildren.push(newChild);
        localStorage.setItem('lana_local_children', JSON.stringify(localChildren));
        
        console.log('[AuthService] Child data saved locally:', newChild);
      } catch (error) {
        console.error('[AuthService] Failed to save child data locally:', error);
      }
    }
  }

  // Get locally saved children
  getLocalChildren() {
    if (typeof window !== 'undefined') {
      try {
        const localChildren = localStorage.getItem('lana_local_children');
        return localChildren ? JSON.parse(localChildren) : [];
      } catch (error) {
        console.error('[AuthService] Failed to retrieve local children:', error);
        return [];
      }
    }
    return [];
  }

  // Link local children to account when connection is restored
  async linkLocalChildrenToAccount(guardianEmail: string) {
    try {
      const localChildren: any[] = this.getLocalChildren();
      
      if (localChildren.length === 0) {
        return { success: true, message: 'No local children to link' };
      }
      
      // Try to register each local child
      const results: any[] = [];
      const failedChildren: any[] = [];
      
      for (const child of localChildren) {
        try {
          const response = await fetch('/api/auth/register-child', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              nickname: child.nickname,
              age: child.age,
              grade: child.grade,
              guardianEmail: child.guardianEmail
            }),
          });
          
          const result = await response.json();
          
          if (result.success) {
            results.push({ ...child, linked: true });
          } else {
            failedChildren.push({ child, error: result.message });
          }
        } catch (error) {
          failedChildren.push({ child, error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }
      
      // Update local storage with linked status
      if (results.length > 0) {
        const remainingLocalChildren = localChildren.filter((localChild: any) => 
          !results.some((result: any) => result.id === localChild.id)
        );
        localStorage.setItem('lana_local_children', JSON.stringify(remainingLocalChildren));
      }
      
      return {
        success: true,
        linked: results,
        failed: failedChildren,
        message: `${results.length} children linked, ${failedChildren.length} failed`
      };
    } catch (error) {
      console.error('[AuthService] Error linking local children:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to link local children'
      };
    }
  }
}