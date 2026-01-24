import { supabase } from '@/lib/db';
import { type User } from '@supabase/supabase-js';
import { authLogger } from './authLogger';
import { dataSyncService } from './dataSyncService';

// Define consent types
export interface UserConsent {
  privacyPolicyAccepted: boolean;
  termsOfServiceAccepted: boolean;
  marketingCommunication: boolean;
  childDataUsage: boolean;
  createdAt: string;
}

export interface ComprehensiveAuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isPro: boolean;
  checkingPro: boolean;
  error: string | null;
  lastChecked: number | null;
  consent: UserConsent | null;
}

export class ComprehensiveAuthService {
  private static instance: ComprehensiveAuthService;
  private authState: ComprehensiveAuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    isPro: false,
    checkingPro: true,
    error: null,
    lastChecked: null,
    consent: null
  };
  private listeners: Array<(state: ComprehensiveAuthState) => void> = [];
  private refreshInterval: NodeJS.Timeout | null = null;
  private networkStatus: 'online' | 'offline' = 'online';

  private constructor() {
    this.initializeAuthListener();
    this.initializeNetworkListener();
    this.startPeriodicRefresh();
  }

  static getInstance(): ComprehensiveAuthService {
    if (!ComprehensiveAuthService.instance) {
      ComprehensiveAuthService.instance = new ComprehensiveAuthService();
    }
    return ComprehensiveAuthService.instance;
  }

  private initializeAuthListener() {
    // Listen for auth state changes
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[ComprehensiveAuthService] Auth state changed:', event);
      
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
  }

  private initializeNetworkListener() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[ComprehensiveAuthService] Network online');
        this.networkStatus = 'online';
        // When coming back online, refresh the auth status
        this.checkAuthStatus();
        // Trigger data sync
        dataSyncService.syncPendingData();
      });
      
      window.addEventListener('offline', () => {
        console.log('[ComprehensiveAuthService] Network offline');
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

  private updateAuthState(newState: Partial<ComprehensiveAuthState>) {
    this.authState = {
      ...this.authState,
      ...newState,
      lastChecked: Date.now()
    };
    
    // Notify all listeners
    this.listeners.forEach(listener => listener(this.authState));
  }

  async checkAuthStatus(forceRefresh = false): Promise<ComprehensiveAuthState> {
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
        console.error('[ComprehensiveAuthService] Error checking auth status:', error);
        this.updateAuthState({ 
          user: null, 
          isAuthenticated: false, 
          isLoading: false,
          error: error.message 
        });
        return { ...this.authState };
      }
      
      // Load consent information if user exists
      let consent: UserConsent | null = null;
      if (data?.user) {
        consent = await this.loadUserConsent(data.user.id);
      }
      
      this.updateAuthState({ 
        user: data?.user || null, 
        isAuthenticated: !!data?.user,
        isLoading: false,
        error: null,
        consent
      });
      
      return { ...this.authState };
    } catch (error) {
      console.error('[ComprehensiveAuthService] Unexpected error checking auth status:', error);
      this.updateAuthState({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return { ...this.authState };
    }
  }

  subscribe(listener: (state: ComprehensiveAuthState) => void): () => void {
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

  getCurrentState(): ComprehensiveAuthState {
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
          console.info('[ComprehensiveAuthService.verifyEmail] timings_ms', { fetch_ms: Math.round(t1 - t0), parse_ms: Math.round(t2 - t1) });
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
          console.warn('[ComprehensiveAuthService.verifyEmail] request timed out, retrying once');
        } else if (err instanceof Error && /network|fetch|failed|timeout/i.test(err.message)) {
          console.warn('[ComprehensiveAuthService.verifyEmail] network error, retrying once');
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
      console.warn('[ComprehensiveAuthService.verifyEmail] error', error);
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
          console.debug('[ComprehensiveAuthService] Network timeout while checking user authentication');
          throw new Error('Network timeout while checking user authentication. Please check your connection and try again.');
        }
        
        // If the API call fails, fall back to using the verify-email endpoint
        console.debug('[ComprehensiveAuthService] API check failed, falling back to verify-email');
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
          console.debug('[ComprehensiveAuthService] Network timeout while verifying email');
          throw new Error('Network timeout while verifying email. Please check your connection and try again.');
        }
        
        return false;
      } catch (apiError) {
        console.debug('[ComprehensiveAuthService] API check error, falling back:', apiError);
        // If it's a network timeout error, re-throw it
        if (apiError instanceof Error && apiError.message.includes('timeout')) {
          throw apiError;
        }
        return false;
      }
    } catch (error) {
      console.debug('[ComprehensiveAuthService] isEmailAuthenticated error:', error);
      throw error;
    }
  }

  async loginWithEmail(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      this.updateAuthState({ isLoading: true, error: null });
      
      // First verify if the email is authenticated
      const verificationResult = await this.verifyEmailWithSupabaseAuth(email.trim());
      
      if (verificationResult.exists && verificationResult.confirmed) {
        // User is authenticated, send them a magic link
        // Use our enhanced magic link API route to ensure proper onboarding enforcement
        const response = await fetch('/api/auth/magic-link', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
            redirectTo: '/onboarding' // Always redirect to onboarding for new users
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to send magic link');
        }
        
        return { success: true };
      } else if (verificationResult.exists && !verificationResult.confirmed) {
        throw new Error('Email not yet authenticated. Please check your email for verification instructions.');
      } else {
        throw new Error('Email not authenticated. Please register first.');
      }
    } catch (error: unknown) {
      console.debug("[ComprehensiveAuthService] login error:", error);
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
      
      console.log('[ComprehensiveAuthService] Initiating Google login');
      console.log('[ComprehensiveAuthService] Supabase auth object:', supabase.auth);
      
      // Check if supabase.auth exists
      if (!supabase.auth) {
        const errorMessage = 'Supabase auth object is undefined';
        console.error('[ComprehensiveAuthService] Google login error:', errorMessage);
        this.updateAuthState({ 
          isLoading: false, 
          error: errorMessage 
        });
        return { success: false, error: errorMessage };
      }
      
      // For Supabase Auth, the signInWithOAuth method is available directly on supabase.auth
      // Check if supabase.auth.signInWithOAuth exists
      if (typeof supabase.auth.signInWithOAuth !== 'function') {
        const errorMessage = 'signInWithOAuth is not available. This method may not be supported in the current Supabase client configuration.';
        console.error('[ComprehensiveAuthService] Google login error:', errorMessage);
        console.error('[ComprehensiveAuthService] Available methods on supabase.auth:', Object.keys(supabase.auth));
        this.updateAuthState({ 
          isLoading: false, 
          error: errorMessage 
        });
        return { success: false, error: errorMessage };
      }
      
      // For Next.js App Router with server-side callback handling, we need to ensure
      // the OAuth flow properly redirects to our registered callback URL
      console.log('[ComprehensiveAuthService] Initiating Google login via redirect');
      
      // Always use the production site URL for OAuth redirects to ensure consistency
      // This prevents issues where window.location.origin differs between environments
      const redirectBaseUrl = 'https://www.lanamind.com';
      const callbackUrl = `${redirectBaseUrl}/api/auth/callback/google`;
      
      console.log('[ComprehensiveAuthService] Using callback URL:', callbackUrl);
      
      // Initiate the OAuth flow with the correct redirect URL
      // Ensure the redirectTo matches exactly what's registered in Supabase dashboard
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('[ComprehensiveAuthService] Google login error:', error);
        this.updateAuthState({ 
          isLoading: false, 
          error: error.message 
        });
        return { success: false, error: error.message };
      }

      // The redirect happens automatically via signInWithOAuth, so we don't need to do anything else
      // The user will be redirected to Google for authentication, then back to our callback URL
      return { success: true };
    } catch (error) {
      console.error('[ComprehensiveAuthService] Unexpected Google login error:', error);
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
        console.warn('[ComprehensiveAuthService] Failed to create guardian record:', insertError);
      }

      // Send magic link using our enhanced API route to ensure proper onboarding enforcement
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          redirectTo: '/onboarding' // Always redirect to onboarding for new users
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send magic link');
      }

      this.updateAuthState({ isLoading: false });
      return { success: true };
    } catch (error: unknown) {
      console.error('[ComprehensiveAuthService] Unexpected registration error:', error);
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
        console.error('[ComprehensiveAuthService] Child registration error:', errorMessage);
        this.updateAuthState({ 
          isLoading: false, 
          error: errorMessage 
        });
        return { success: false, error: errorMessage };
      }

      // Note: We no longer create separate child accounts as per the new architecture
      // The parent account now serves as the central hub for managing all child-related functionality
      // Store session ID for anonymous users
      if (result.data && result.data.length > 0) {
        const childData = result.data[0];
        // Session management is now handled by the unified auth system
      }

      this.updateAuthState({ isLoading: false });
      return { success: true, data: result.data };
    } catch (error: unknown) {
      console.error('[ComprehensiveAuthService] Unexpected child registration error:', error);
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
        console.error('[ComprehensiveAuthService] Logout error:', error);
        this.updateAuthState({ 
          isLoading: false, 
          error: error.message 
        });
        return { success: false, error: error.message };
      }

      // Clear local storage items related to auth
      if (typeof window !== 'undefined') {
        // Note: We no longer store lana_sid in localStorage as per the new architecture
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
      console.error('[ComprehensiveAuthService] Unexpected logout error:', error);
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
        console.error('[ComprehensiveAuthService] Session refresh error:', error);
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
      console.error('[ComprehensiveAuthService] Unexpected session refresh error:', error);
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
    
    // Only rely on server-side verified user metadata
    return Boolean(this.authState.user.user_metadata?.onboarding_complete);
  }

  // Complete onboarding
  async completeOnboarding(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.authState.user) {
        return { success: false, error: 'No authenticated user' };
      }

      // Update user metadata to mark onboarding as complete
      const { error } = await supabase.auth.updateUser({
        data: { 
          ...this.authState.user.user_metadata,
          onboarding_complete: true 
        },
      });

      if (error) {
        console.error('[ComprehensiveAuthService] Onboarding completion error:', error);
        return { success: false, error: error.message };
      }

      // Cookie setting removed - only server-side verification is trusted

      // Update the auth state directly to reflect the onboarding completion
      // This ensures the UI gets updated immediately without waiting for refresh
      this.updateAuthState({
        user: {
          ...this.authState.user,
          user_metadata: {
            ...this.authState.user.user_metadata,
            onboarding_complete: true
          }
        },
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      
      // Refresh user data
      await this.refreshSession();
      
      return { success: true };
    } catch (error) {
      console.error('[ComprehensiveAuthService] Unexpected onboarding completion error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Consent Management
  async requestUserConsent(consentData: Partial<UserConsent>): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.authState.user) {
        return { success: false, error: 'No authenticated user' };
      }

      // Validate consent data
      const requiredConsents = {
        privacyPolicyAccepted: consentData.privacyPolicyAccepted || false,
        termsOfServiceAccepted: consentData.termsOfServiceAccepted || false,
        marketingCommunication: consentData.marketingCommunication || false,
        childDataUsage: consentData.childDataUsage || false,
        createdAt: consentData.createdAt || new Date().toISOString()
      };

      // Update user metadata with consent information
      const { error } = await supabase.auth.updateUser({
        data: {
          consent: requiredConsents
        }
      });

      if (error) {
        console.error('[ComprehensiveAuthService] Consent update error:', error);
        return { success: false, error: error.message };
      }

      // Update local state
      this.updateAuthState({
        consent: requiredConsents as UserConsent
      });

      // Log consent event
      await authLogger.logConsentGranted(this.authState.user.id, this.authState.user.email || '', {
        privacyPolicyAccepted: requiredConsents.privacyPolicyAccepted,
        termsOfServiceAccepted: requiredConsents.termsOfServiceAccepted,
        marketingCommunication: requiredConsents.marketingCommunication,
        childDataUsage: requiredConsents.childDataUsage,
        createdAt: requiredConsents.createdAt
      });

      return { success: true };
    } catch (error) {
      console.error('[ComprehensiveAuthService] Unexpected consent error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async loadUserConsent(userId: string): Promise<UserConsent | null> {
    try {
      // In a real implementation, this would fetch from the database
      // For now, we'll get it from user metadata
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('[ComprehensiveAuthService] Error loading user consent:', error);
        return null;
      }

      if (user?.user_metadata?.consent) {
        return user.user_metadata.consent as UserConsent;
      }

      return null;
    } catch (error) {
      console.error('[ComprehensiveAuthService] Error loading user consent:', error);
      return null;
    }
  }

  hasGivenConsent(): boolean {
    return this.authState.consent !== null && 
           this.authState.consent.privacyPolicyAccepted && 
           this.authState.consent.termsOfServiceAccepted;
  }

  // Subscription status management
  async refreshProStatus(): Promise<{ isPro: boolean; error?: string }> {
    try {
      // Update the checking state
      this.updateAuthState({ checkingPro: true });
      
      const response = await fetch('/api/subscription/status');
      
      if (response.ok) {
        const data = await response.json();
        const isPro = Boolean(data.is_pro);
        
        // Update the auth state with the new pro status
        this.updateAuthState({ isPro, checkingPro: false });
        
        return { isPro };
      } else {
        // Handle specific error cases
        if (response.status === 404) {
          console.error('Subscription status endpoint not found');
        }
        
        // Set isPro to false if there's an error
        this.updateAuthState({ isPro: false, checkingPro: false });
        return { isPro: false, error: 'Subscription status unavailable' };
      }
    } catch (e: unknown) {
      console.error('Error checking subscription status:', e);
      this.updateAuthState({ isPro: false, checkingPro: false });
      return { isPro: false, error: e instanceof Error ? e.message : 'Unknown error' };
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
export const comprehensiveAuthService = ComprehensiveAuthService.getInstance();