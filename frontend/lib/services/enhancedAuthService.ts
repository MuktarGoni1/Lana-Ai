import { supabase } from '@/lib/db';
import { type User } from '@supabase/supabase-js';
import { authLogger } from './authLogger';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export class EnhancedAuthService {
  private static instance: EnhancedAuthService;
  private authState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  };
  private listeners: Array<(state: AuthState) => void> = [];

  private constructor() {
    this.initializeAuthListener();
  }

  static getInstance(): EnhancedAuthService {
    if (!EnhancedAuthService.instance) {
      EnhancedAuthService.instance = new EnhancedAuthService();
    }
    return EnhancedAuthService.instance;
  }

  private initializeAuthListener() {
    // Listen for auth state changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[EnhancedAuthService] Auth state changed:', event);
      
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

  private updateAuthState(newState: Partial<AuthState>) {
    this.authState = {
      ...this.authState,
      ...newState
    };
    
    // Notify all listeners
    this.listeners.forEach(listener => listener(this.authState));
  }

  private async checkAuthStatus() {
    try {
      this.updateAuthState({ isLoading: true });
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('[EnhancedAuthService] Error checking auth status:', error);
        this.updateAuthState({ 
          user: null, 
          isAuthenticated: false, 
          isLoading: false,
          error: error.message 
        });
        return;
      }
      
      this.updateAuthState({ 
        user, 
        isAuthenticated: !!user, 
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('[EnhancedAuthService] Unexpected error checking auth status:', error);
      this.updateAuthState({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  subscribe(listener: (state: AuthState) => void): () => void {
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

  getCurrentState(): AuthState {
    return { ...this.authState };
  }

  async loginWithEmail(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      this.updateAuthState({ isLoading: true, error: null });
      
      // Check if this is a guest user converting to authenticated user
      let guestId = null;
      if (typeof window !== 'undefined') {
        guestId = localStorage.getItem('lana_guest_id');
      }
      
      // Log guest conversion start if this is a guest user
      if (guestId) {
        await authLogger.logGuestConversionStart(guestId, email);
      }
      
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: "https://www.lanamind.com/auth/auto-login",
        },
      });

      if (error) {
        console.error('[EnhancedAuthService] Login error:', error);
        this.updateAuthState({ 
          isLoading: false, 
          error: error.message 
        });
        
        // Log guest conversion failure if this was a guest user
        if (guestId) {
          await authLogger.logGuestConversionFailure(guestId, error.message, email);
        }
        
        return { success: false, error: error.message };
      }

      this.updateAuthState({ isLoading: false });
      return { success: true };
    } catch (error) {
      console.error('[EnhancedAuthService] Unexpected login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateAuthState({ 
        isLoading: false, 
        error: errorMessage 
      });
      
      // Log guest conversion failure if this was a guest user
      let guestId = null;
      if (typeof window !== 'undefined') {
        guestId = localStorage.getItem('lana_guest_id');
      }
      
      if (guestId) {
        await authLogger.logGuestConversionFailure(guestId, errorMessage, email);
      }
      
      return { success: false, error: errorMessage };
    }
  }

  async loginWithGoogle(): Promise<{ success: boolean; error?: string }> {
    try {
      this.updateAuthState({ isLoading: true, error: null });
      
      console.log('[EnhancedAuthService] Initiating Google login');
      console.log('[EnhancedAuthService] Supabase auth object:', supabase.auth);
      
      // Check if supabase.auth exists
      if (!supabase.auth) {
        const errorMessage = 'Supabase auth object is undefined';
        console.error('[EnhancedAuthService] Google login error:', errorMessage);
        this.updateAuthState({ 
          isLoading: false, 
          error: errorMessage 
        });
        return { success: false, error: errorMessage };
      }
      
      // Check if supabase.auth.signInWithOAuth exists
      if (typeof supabase.auth.signInWithOAuth !== 'function') {
        const errorMessage = 'signInWithOAuth is not available. This method may not be supported in the current Supabase client configuration.';
        console.error('[EnhancedAuthService] Google login error:', errorMessage);
        console.error('[EnhancedAuthService] Available methods on supabase.auth:', Object.keys(supabase.auth));
        this.updateAuthState({ 
          isLoading: false, 
          error: errorMessage 
        });
        return { success: false, error: errorMessage };
      }
      
      // Call signInWithOAuth with the correct parameters
      console.log('[EnhancedAuthService] Calling signInWithOAuth with provider: google');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${typeof window !== 'undefined' ? window.location.origin : 'https://www.lanamind.com'}/auth/auto-login`,
          scopes: 'openid email profile',
        },
      });

      if (error) {
        console.error('[EnhancedAuthService] Google login error:', error);
        this.updateAuthState({ 
          isLoading: false, 
          error: error.message 
        });
        return { success: false, error: error.message };
      }

      console.log('[EnhancedAuthService] Google login initiated successfully', data);
      
      // For OAuth, the redirect happens automatically
      this.updateAuthState({ isLoading: false });
      return { success: true };
    } catch (error) {
      console.error('[EnhancedAuthService] Unexpected Google login error:', error);
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
      
      // Check if this is a guest user converting to authenticated user
      let guestId = null;
      if (typeof window !== 'undefined') {
        guestId = localStorage.getItem('lana_guest_id');
      }
      
      // Log guest conversion start if this is a guest user
      if (guestId) {
        await authLogger.logGuestConversionStart(guestId, email);
      }
      
      // First create/update guardian record
      const { error: insertError } = await supabase
        .from("guardians")
        .upsert({
          email: email.trim().toLowerCase(),
          weekly_report: true,
          monthly_report: false,
        } as any, { onConflict: 'email' });

      if (insertError) {
        console.warn('[EnhancedAuthService] Failed to create guardian record:', insertError);
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
        console.error('[EnhancedAuthService] Registration error:', error);
        this.updateAuthState({ 
          isLoading: false, 
          error: error.message 
        });
        
        // Log guest conversion failure if this was a guest user
        if (guestId) {
          await authLogger.logGuestConversionFailure(guestId, error.message, email);
        }
        
        return { success: false, error: error.message };
      }

      this.updateAuthState({ isLoading: false });
      return { success: true };
    } catch (error) {
      console.error('[EnhancedAuthService] Unexpected registration error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateAuthState({ 
        isLoading: false, 
        error: errorMessage 
      });
      
      // Log guest conversion failure if this was a guest user
      let guestId = null;
      if (typeof window !== 'undefined') {
        guestId = localStorage.getItem('lana_guest_id');
      }
      
      if (guestId) {
        await authLogger.logGuestConversionFailure(guestId, errorMessage, email);
      }
      
      return { success: false, error: errorMessage };
    }
  }

  async registerChild(nickname: string, age: number, grade: string, guardianEmail: string): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      this.updateAuthState({ isLoading: true, error: null });
      
      // Check if this is a guest user converting to authenticated user
      let guestId = null;
      if (typeof window !== 'undefined') {
        guestId = localStorage.getItem('lana_guest_id');
      }
      
      // Log guest conversion start if this is a guest user
      if (guestId) {
        await authLogger.logGuestConversionStart(guestId, guardianEmail);
      }
      
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
        console.error('[EnhancedAuthService] Child registration error:', errorMessage);
        this.updateAuthState({ 
          isLoading: false, 
          error: errorMessage 
        });
        
        // Log guest conversion failure if this was a guest user
        if (guestId) {
          await authLogger.logGuestConversionFailure(guestId, errorMessage, guardianEmail);
        }
        
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
    } catch (error) {
      console.error('[EnhancedAuthService] Unexpected child registration error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateAuthState({ 
        isLoading: false, 
        error: errorMessage 
      });
      
      // Log guest conversion failure if this was a guest user
      let guestId = null;
      if (typeof window !== 'undefined') {
        guestId = localStorage.getItem('lana_guest_id');
      }
      
      if (guestId) {
        await authLogger.logGuestConversionFailure(guestId, errorMessage, guardianEmail);
      }
      
      return { success: false, error: errorMessage };
    }
  }

  async logout(): Promise<{ success: boolean; error?: string }> {
    try {
      this.updateAuthState({ isLoading: true, error: null });
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('[EnhancedAuthService] Logout error:', error);
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
      }

      this.updateAuthState({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false,
        error: null 
      });
      
      return { success: true };
    } catch (error) {
      console.error('[EnhancedAuthService] Unexpected logout error:', error);
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
        console.error('[EnhancedAuthService] Session refresh error:', error);
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
      console.error('[EnhancedAuthService] Unexpected session refresh error:', error);
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
        console.error('[EnhancedAuthService] Onboarding completion error:', error);
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
      console.error('[EnhancedAuthService] Unexpected onboarding completion error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}