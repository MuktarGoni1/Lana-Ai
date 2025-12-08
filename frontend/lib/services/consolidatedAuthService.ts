import { supabase } from '@/lib/db';
import { type User } from '@supabase/supabase-js';
import { authLogger } from './authLogger';
import { dataSyncService } from './dataSyncService';

export interface ConsolidatedAuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  lastChecked: number | null;
}

export class ConsolidatedAuthService {
  private static instance: ConsolidatedAuthService;
  private authState: ConsolidatedAuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    lastChecked: null
  };
  private listeners: Array<(state: ConsolidatedAuthState) => void> = [];
  private refreshInterval: NodeJS.Timeout | null = null;
  private networkStatus: 'online' | 'offline' = 'online';

  private constructor() {
    this.initializeAuthListener();
    this.initializeNetworkListener();
    this.startPeriodicRefresh();
  }

  static getInstance(): ConsolidatedAuthService {
    if (!ConsolidatedAuthService.instance) {
      ConsolidatedAuthService.instance = new ConsolidatedAuthService();
    }
    return ConsolidatedAuthService.instance;
  }

  private initializeAuthListener() {
    // Listen for auth state changes
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[ConsolidatedAuthService] Auth state changed:', event);
      
      switch (event) {
        case 'SIGNED_IN':
          // Check if this was a guest user who just converted
          let guestId = null;
          if (typeof window !== 'undefined') {
            guestId = localStorage.getItem('lana_guest_id');
          }
          
          this.updateAuthState({
            user: session?.user || null,
            isAuthenticated: !!session?.user,
            isLoading: false,
            error: null
          });
          
          // Log guest conversion completion if this was a guest user
          if (guestId && session?.user) {
            await authLogger.logGuestConversionComplete(session.user.id, session.user.email);
            
            // Clear the guest cookie since conversion is complete
            if (typeof window !== 'undefined') {
              localStorage.removeItem('lana_guest_id');
            }
          }
          break;
          
        case 'SIGNED_OUT':
          this.updateAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
          break;
          
        case 'TOKEN_REFRESHED':
          this.updateAuthState({
            user: session?.user || null,
            isAuthenticated: !!session?.user,
            isLoading: false,
            error: null
          });
          break;
          
        case 'USER_UPDATED':
          this.updateAuthState({
            user: session?.user || null,
            isAuthenticated: !!session?.user,
            isLoading: false,
            error: null
          });
          break;
          
        default:
          // For other events, just update the user if available
          this.updateAuthState({
            user: session?.user || null,
            isAuthenticated: !!session?.user,
            isLoading: false,
            error: null
          });
      }
    });

    // Initial check
    this.checkAuthStatus();

    // Return unsubscribe function
    return () => {
      data?.subscription.unsubscribe();
    };
  }

  private initializeNetworkListener() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[ConsolidatedAuthService] Network online');
        this.networkStatus = 'online';
        // When coming back online, refresh the auth status
        this.checkAuthStatus();
        // Trigger data sync
        dataSyncService.syncPendingData();
      });
      
      window.addEventListener('offline', () => {
        console.log('[ConsolidatedAuthService] Network offline');
        this.networkStatus = 'offline';
        // When going offline, update state but don't change auth status
        this.updateAuthState({ 
          error: 'Network connection lost. Authentication status may be stale.'
        });
      });
    }
  }

  private startPeriodicRefresh() {
    // Check auth status every 5 minutes
    this.refreshInterval = setInterval(() => {
      if (this.networkStatus === 'online') {
        this.checkAuthStatus();
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  private updateAuthState(newState: Partial<ConsolidatedAuthState>) {
    this.authState = {
      ...this.authState,
      ...newState,
      lastChecked: Date.now()
    };
    
    // Notify all listeners
    this.listeners.forEach(listener => listener(this.authState));
  }

  async checkAuthStatus(forceRefresh = false): Promise<ConsolidatedAuthState> {
    // If we checked recently (within 30 seconds) and not forcing refresh, return current state
    if (!forceRefresh && this.authState.lastChecked && 
        Date.now() - this.authState.lastChecked < 30000) {
      return { ...this.authState };
    }

    try {
      this.updateAuthState({ isLoading: true });
      
      const result = await supabase.auth.getUser();
      
      // Handle case where result might be undefined
      if (!result) {
        throw new Error('No response from authentication service');
      }
      
      const { data, error } = result;
      
      if (error) {
        console.error('[ConsolidatedAuthService] Error checking auth status:', error);
        this.updateAuthState({ 
          user: null, 
          isAuthenticated: false, 
          isLoading: false,
          error: error.message 
        });
        return { ...this.authState };
      }
      
      this.updateAuthState({ 
        user: data?.user || null, 
        isAuthenticated: !!data?.user,
        isLoading: false,
        error: null
      });
      
      return { ...this.authState };
    } catch (error) {
      console.error('[ConsolidatedAuthService] Unexpected error checking auth status:', error);
      this.updateAuthState({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return { ...this.authState };
    }
  }

  subscribe(listener: (state: ConsolidatedAuthState) => void): () => void {
    this.listeners.push(listener);
    
    // Immediately notify the new listener with current state
    listener(this.authState);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  getCurrentState(): ConsolidatedAuthState {
    return { ...this.authState };
  }

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
          console.info('[ConsolidatedAuthService.verifyEmail] timings_ms', { fetch_ms: Math.round(t1 - t0), parse_ms: Math.round(t2 - t1) });
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
          console.warn('[ConsolidatedAuthService.verifyEmail] request timed out, retrying once');
        } else if (err instanceof Error && /network|fetch|failed|timeout/i.test(err.message)) {
          console.warn('[ConsolidatedAuthService.verifyEmail] network error, retrying once');
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
      console.warn('[ConsolidatedAuthService.verifyEmail] error', error);
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
          console.debug('[ConsolidatedAuthService] Network timeout while checking user authentication');
          throw new Error('Network timeout while checking user authentication. Please check your connection and try again.');
        }
        
        // If the API call fails, fall back to using the verify-email endpoint
        console.debug('[ConsolidatedAuthService] API check failed, falling back to verify-email');
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
          console.debug('[ConsolidatedAuthService] Network timeout while verifying email');
          throw new Error('Network timeout while verifying email. Please check your connection and try again.');
        }
        
        return false;
      } catch (apiError) {
        console.debug('[ConsolidatedAuthService] API check error, falling back:', apiError);
        // If it's a network timeout error, re-throw it
        if (apiError instanceof Error && apiError.message.includes('timeout')) {
          throw apiError;
        }
        return false;
      }
    } catch (error) {
      console.debug('[ConsolidatedAuthService] isEmailAuthenticated error:', error);
      throw error;
    }
  }

  async loginWithEmail(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      this.updateAuthState({ isLoading: true, error: null });
      
      // First verify if the email is authenticated
      const verificationResult = await this.verifyEmailWithSupabaseAuth(email.trim());
      
      if (verificationResult.exists && verificationResult.confirmed) {
        // User is authenticated, sign them in directly
        // For security, we still need to use Supabase's authentication flow
        // We'll send a magic link but with a custom redirect that handles automatic login
        const { data, error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: {
            shouldCreateUser: false, // Don't create a new user if they don't exist
            emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : 'https://www.lanamind.com'}/auth/auto-login`,
          },
        });

        if (error) throw error;
        
        return { success: true };
      } else if (verificationResult.exists && !verificationResult.confirmed) {
        throw new Error('Email not yet authenticated. Please check your email for verification instructions.');
      } else {
        throw new Error('Email not authenticated. Please register first.');
      }
    } catch (error: unknown) {
      console.debug("[ConsolidatedAuthService] login error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateAuthState({ 
        isLoading: false, 
        error: errorMessage 
      });
      return { success: false, error: errorMessage };
    }
  }

  async loginWithGoogle(): Promise<{ success: boolean; error?: string }> {
    try {
      this.updateAuthState({ isLoading: true, error: null });
      
      console.log('[ConsolidatedAuthService] Initiating Google login');
      console.log('[ConsolidatedAuthService] Supabase auth object:', supabase.auth);
      
      // Check if supabase.auth exists
      if (!supabase.auth) {
        const errorMessage = 'Supabase auth object is undefined';
        console.error('[ConsolidatedAuthService] Google login error:', errorMessage);
        this.updateAuthState({ 
          isLoading: false, 
          error: errorMessage 
        });
        return { success: false, error: errorMessage };
      }
      
      // Check if supabase.auth.signInWithOAuth exists
      if (typeof supabase.auth.signInWithOAuth !== 'function') {
        const errorMessage = 'signInWithOAuth is not available. This method may not be supported in the current Supabase client configuration.';
        console.error('[ConsolidatedAuthService] Google login error:', errorMessage);
        console.error('[ConsolidatedAuthService] Available methods on supabase.auth:', Object.keys(supabase.auth));
        this.updateAuthState({ 
          isLoading: false, 
          error: errorMessage 
        });
        return { success: false, error: errorMessage };
      }
      
      // Call signInWithOAuth with the correct parameters
      console.log('[ConsolidatedAuthService] Calling signInWithOAuth with provider: google');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${typeof window !== 'undefined' ? window.location.origin : 'https://www.lanamind.com'}/auth/auto-login`,
          scopes: 'openid email profile',
        },
      });

      if (error) {
        console.error('[ConsolidatedAuthService] Google login error:', error);
        this.updateAuthState({ 
          isLoading: false, 
          error: error.message 
        });
        return { success: false, error: error.message };
      }

      console.log('[ConsolidatedAuthService] Google login initiated successfully', data);
      
      // For OAuth, the redirect happens automatically
      this.updateAuthState({ isLoading: false });
      return { success: true };
    } catch (error) {
      console.error('[ConsolidatedAuthService] Unexpected Google login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred during Google login';
      this.updateAuthState({ 
        isLoading: false, 
        error: errorMessage 
      });
      return { success: false, error: errorMessage };
    }
  }

  async registerParent(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      this.updateAuthState({ isLoading: true, error: null });
      
      // First create/update guardian record
      const { error: insertError } = await supabase
        .from("guardians")
        .upsert({
          email: email.trim().toLowerCase(),
          weekly_report: true,
          monthly_report: false,
        } as any, { onConflict: 'email' });

      if (insertError) {
        console.warn('[ConsolidatedAuthService] Failed to create guardian record:', insertError);
      }

      // Send magic link
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          data: { role: "guardian" },
          emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : 'https://www.lanamind.com'}/auth/auto-login`,
        },
      });

      if (error) {
        console.error('[ConsolidatedAuthService] Registration error:', error);
        this.updateAuthState({ 
          isLoading: false, 
          error: error.message 
        });
        return { success: false, error: error.message };
      }

      this.updateAuthState({ isLoading: false });
      return { success: true };
    } catch (error: unknown) {
      console.error('[ConsolidatedAuthService] Unexpected registration error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateAuthState({ 
        isLoading: false, 
        error: errorMessage 
      });
      return { success: false, error: errorMessage };
    }
  }

  async registerChild(nickname: string, age: number, grade: string, guardianEmail: string): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      this.updateAuthState({ isLoading: true, error: null });
      
      const response = await fetch('/api/auth/register-child', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname: nickname.trim(),
          age,
          grade: grade.trim(),
          guardianEmail: guardianEmail.trim().toLowerCase()
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        const errorMessage = result.message || 'Failed to register child';
        console.error('[ConsolidatedAuthService] Child registration error:', errorMessage);
        this.updateAuthState({ 
          isLoading: false, 
          error: errorMessage 
        });
        return { success: false, error: errorMessage };
      }

      // Store session ID for anonymous users
      if (result.data && result.data.length > 0) {
        const childData = result.data[0];
        if (typeof window !== 'undefined') {
          localStorage.setItem("lana_sid", childData.child_uid);
        }
      }

      this.updateAuthState({ isLoading: false });
      return { success: true, data: result.data };
    } catch (error: unknown) {
      console.error('[ConsolidatedAuthService] Unexpected child registration error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateAuthState({ 
        isLoading: false, 
        error: errorMessage 
      });
      return { success: false, error: errorMessage };
    }
  }

  async logout(): Promise<{ success: boolean; error?: string }> {
    try {
      this.updateAuthState({ isLoading: true, error: null });
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('[ConsolidatedAuthService] Logout error:', error);
        this.updateAuthState({ 
          isLoading: false, 
          error: error.message 
        });
        return { success: false, error: error.message };
      }

      // Clear local storage items related to auth
      if (typeof window !== 'undefined') {
        localStorage.removeItem("lana_sid");
        localStorage.removeItem("lana_onboarding_complete");
        localStorage.removeItem("lana_local_children");
        localStorage.removeItem("lana_study_plan");
        localStorage.removeItem("lana_study_plan_pending");
        localStorage.removeItem("lana_last_visited");
        localStorage.removeItem("lana_guest_id");
      }

      this.updateAuthState({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false,
        error: null 
      });
      
      return { success: true };
    } catch (error) {
      console.error('[ConsolidatedAuthService] Unexpected logout error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateAuthState({ 
        isLoading: false, 
        error: errorMessage 
      });
      return { success: false, error: errorMessage };
    }
  }

  async refreshSession(): Promise<{ success: boolean; error?: string }> {
    try {
      this.updateAuthState({ isLoading: true, error: null });
      
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('[ConsolidatedAuthService] Session refresh error:', error);
        this.updateAuthState({ 
          isLoading: false, 
          error: error.message 
        });
        return { success: false, error: error.message };
      }

      this.updateAuthState({ 
        user: data.session?.user || null,
        isAuthenticated: !!data.session?.user,
        isLoading: false,
        error: null 
      });
      
      return { success: true };
    } catch (error) {
      console.error('[ConsolidatedAuthService] Unexpected session refresh error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateAuthState({ 
        isLoading: false, 
        error: errorMessage 
      });
      return { success: false, error: errorMessage };
    }
  }

  // Get user's role
  getUserRole(): 'child' | 'guardian' | 'parent' | null {
    if (!this.authState.user) return null;
    
    const role = this.authState.user.user_metadata?.role;
    if (role === 'child' || role === 'guardian' || role === 'parent') {
      return role;
    }
    
    return null;
  }

  // Check if onboarding is complete
  isOnboardingComplete(): boolean {
    if (!this.authState.user) return false;
    
    return Boolean(
      this.authState.user.user_metadata?.onboarding_complete ||
      (typeof window !== 'undefined' && document.cookie.includes('lana_onboarding_complete=1'))
    );
  }

  // Complete onboarding
  async completeOnboarding(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.authState.user) {
        return { success: false, error: 'No authenticated user' };
      }

      const { error } = await supabase.auth.updateUser({
        data: { onboarding_complete: true },
      });

      if (error) {
        console.error('[ConsolidatedAuthService] Onboarding completion error:', error);
        return { success: false, error: error.message };
      }

      // Set cookie for middleware bypass
      if (typeof window !== 'undefined') {
        const oneYear = 60 * 60 * 24 * 365;
        document.cookie = `lana_onboarding_complete=1; Max-Age=${oneYear}; Path=/; SameSite=Lax`;
      }

      // Refresh user data
      await this.refreshSession();
      
      return { success: true };
    } catch (error) {
      console.error('[ConsolidatedAuthService] Unexpected onboarding completion error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Clean up resources
  destroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }
}

// Export singleton instance
export const consolidatedAuthService = ConsolidatedAuthService.getInstance();