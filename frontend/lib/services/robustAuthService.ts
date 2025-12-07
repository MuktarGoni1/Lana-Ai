import { supabase } from '@/lib/db';
import { type User } from '@supabase/supabase-js';

export interface RobustAuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  lastChecked: number | null;
}

export class RobustAuthService {
  private static instance: RobustAuthService;
  private authState: RobustAuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    lastChecked: null
  };
  private listeners: Array<(state: RobustAuthState) => void> = [];
  private refreshInterval: NodeJS.Timeout | null = null;
  private networkStatus: 'online' | 'offline' = 'online';

  private constructor() {
    this.initializeAuthListener();
    this.initializeNetworkListener();
    this.startPeriodicRefresh();
  }

  static getInstance(): RobustAuthService {
    if (!RobustAuthService.instance) {
      RobustAuthService.instance = new RobustAuthService();
    }
    return RobustAuthService.instance;
  }

  private initializeAuthListener() {
    // Listen for auth state changes
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[RobustAuthService] Auth state changed:', event);
      
      switch (event) {
        case 'SIGNED_IN':
          this.updateAuthState({
            user: session?.user || null,
            isAuthenticated: !!session?.user,
            isLoading: false,
            error: null
          });
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
        console.log('[RobustAuthService] Network online');
        this.networkStatus = 'online';
        // When coming back online, refresh the auth status
        this.checkAuthStatus();
      });
      
      window.addEventListener('offline', () => {
        console.log('[RobustAuthService] Network offline');
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

  private updateAuthState(newState: Partial<RobustAuthState>) {
    this.authState = {
      ...this.authState,
      ...newState,
      lastChecked: Date.now()
    };
    
    // Notify all listeners
    this.listeners.forEach(listener => listener(this.authState));
  }

  async checkAuthStatus(forceRefresh = false): Promise<RobustAuthState> {
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
        console.error('[RobustAuthService] Error checking auth status:', error);
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
      console.error('[RobustAuthService] Unexpected error checking auth status:', error);
      this.updateAuthState({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return { ...this.authState };
    }
  }

  subscribe(listener: (state: RobustAuthState) => void): () => void {
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

  getCurrentState(): RobustAuthState {
    return { ...this.authState };
  }

  async loginWithEmail(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      this.updateAuthState({ isLoading: true, error: null });
      
      const result = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : 'https://www.lanamind.com'}/auth/auto-login`,
        },
      });

      // Handle case where result might be undefined
      if (!result) {
        throw new Error('No response from authentication service');
      }
      
      const { data, error } = result;

      if (error) {
        console.error('[RobustAuthService] Login error:', error);
        this.updateAuthState({ 
          isLoading: false, 
          error: error.message 
        });
        return { success: false, error: error.message };
      }

      this.updateAuthState({ isLoading: false });
      return { success: true };
    } catch (error) {
      console.error('[RobustAuthService] Unexpected login error:', error);
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
      
      const result = await supabase.auth.signOut();
      
      // Handle case where result might be undefined
      if (!result) {
        throw new Error('No response from authentication service');
      }
      
      const { error } = result;
      
      if (error) {
        console.error('[RobustAuthService] Logout error:', error);
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
        localStorage.removeItem("lana_last_visited");
      }

      this.updateAuthState({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false,
        error: null 
      });
      
      return { success: true };
    } catch (error) {
      console.error('[RobustAuthService] Unexpected logout error:', error);
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
      
      const result = await supabase.auth.refreshSession();
      
      // Handle case where result might be undefined
      if (!result) {
        throw new Error('No response from authentication service');
      }
      
      const { data, error } = result;
      
      if (error) {
        console.error('[RobustAuthService] Session refresh error:', error);
        this.updateAuthState({ 
          isLoading: false, 
          error: error.message 
        });
        return { success: false, error: error.message };
      }

      this.updateAuthState({ 
        user: data?.session?.user || null,
        isAuthenticated: !!data?.session?.user,
        isLoading: false,
        error: null 
      });
      
      return { success: true };
    } catch (error) {
      console.error('[RobustAuthService] Unexpected session refresh error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateAuthState({ 
        isLoading: false, 
        error: errorMessage 
      });
      return { success: false, error: errorMessage };
    }
  }

  // Clean up resources
  destroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }
}