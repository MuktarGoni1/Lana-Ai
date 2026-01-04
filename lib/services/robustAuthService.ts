import { supabase } from '@/lib/db';
import { type User } from '@supabase/supabase-js';

export interface RobustAuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  lastChecked: number | null;
}

// Configuration interface for the service
interface RobustAuthConfig {
  refreshInterval?: number; // in milliseconds
  cacheTimeout?: number;    // in milliseconds
  maxListeners?: number;
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
  private offlineQueue: Array<() => Promise<any>> = [];
  private readonly DEFAULT_CONFIG: Required<RobustAuthConfig> = {
    refreshInterval: 5 * 60 * 1000, // 5 minutes
    cacheTimeout: 30000, // 30 seconds
    maxListeners: 100
  };
  private config: Required<RobustAuthConfig>;

  private constructor(config: RobustAuthConfig = {}) {
    this.config = { ...this.DEFAULT_CONFIG, ...config };
    this.initializeAuthListener();
    this.initializeNetworkListener();
    this.startPeriodicRefresh();
  }

  static getInstance(config?: RobustAuthConfig): RobustAuthService {
    if (!RobustAuthService.instance) {
      RobustAuthService.instance = new RobustAuthService(config);
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
        // Clear offline error when coming back online
        if (this.authState.error?.includes('Network connection lost')) {
          this.clearError();
        }
        // Process queued requests
        this.processOfflineQueue();
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
    // Check auth status every configured interval with ±30s jitter
    const jitter = Math.random() * 60000 - 30000; // ±30 seconds
    const intervalWithJitter = this.config.refreshInterval + jitter;
    
    this.refreshInterval = setInterval(() => {
      if (this.networkStatus === 'online') {
        this.checkAuthStatus();
      }
    }, intervalWithJitter);
  }

  private clearError() {
    if (this.authState.error) {
      this.updateAuthState({ error: null });
    }
  }

  private async processOfflineQueue() {
    while (this.offlineQueue.length > 0 && this.networkStatus === 'online') {
      const request = this.offlineQueue.shift();
      if (request) {
        try {
          await request();
        } catch (error) {
          console.error('[RobustAuthService] Failed to process queued request:', error);
        }
      }
    }
  }

  private updateAuthState(newState: Partial<RobustAuthState>) {
    const updatedState = {
      ...this.authState,
      ...newState,
      lastChecked: Date.now()
    };
    
    // Only notify listeners if state actually changed to prevent unnecessary updates
    const currentStateStr = JSON.stringify(this.authState);
    const updatedStateStr = JSON.stringify(updatedState);
    
    if (currentStateStr !== updatedStateStr) {
      this.authState = updatedState;
      // Notify all listeners
      this.listeners.forEach(listener => {
        try {
          listener(this.authState);
        } catch (error) {
          console.error('[RobustAuthService] Error notifying listener:', error);
        }
      });
    }
  }

  async checkAuthStatus(forceRefresh = false): Promise<RobustAuthState> {
    // If we're offline, return cached state but with error
    if (this.networkStatus === 'offline' && !forceRefresh) {
      return { 
        ...this.authState,
        error: 'Network connection lost. Authentication status may be stale.'
      };
    }
    
    // If we checked recently (within cache timeout) and not forcing refresh, return current state
    if (!forceRefresh && this.authState.lastChecked && 
        Date.now() - this.authState.lastChecked < this.config.cacheTimeout) {
      return { ...this.authState };
    }

    try {
      this.updateAuthState({ isLoading: true });
      
      // Use getUser() for secure user data instead of relying on session.user directly
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('[RobustAuthService] Error checking auth status:', error);
        this.updateAuthState({ 
          user: null, 
          isAuthenticated: false, 
          isLoading: false,
          error: error.message 
        });
        return { 
          user: null, 
          isAuthenticated: false, 
          isLoading: false,
          error: error.message,
          lastChecked: Date.now()
        };
      }
      
      // Update auth state with fresh data
      this.updateAuthState({ 
        user, 
        isAuthenticated: !!user, 
        isLoading: false,
        error: null
      });
      
      return { 
        user, 
        isAuthenticated: !!user, 
        isLoading: false,
        error: null,
        lastChecked: Date.now()
      };
    } catch (error) {
      console.error('[RobustAuthService] Unexpected error checking auth status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateAuthState({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false,
        error: errorMessage
      });
      return { 
        user: null, 
        isAuthenticated: false, 
        isLoading: false,
        error: errorMessage,
        lastChecked: Date.now()
      };
    }
  }

  subscribe(listener: (state: RobustAuthState) => void): () => void {
    if (this.listeners.length >= this.config.maxListeners) {
      console.warn('[RobustAuthService] Maximum listeners reached, possible memory leak');
    }
    
    this.listeners.push(listener);
    
    // Immediately notify the new listener with current state
    try {
      listener(this.authState);
    } catch (error) {
      console.error('[RobustAuthService] Error notifying new listener:', error);
    }
    
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
          emailRedirectTo: 'https://www.lanamind.com/auth/auto-login',
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

      this.clearError();
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

  async registerParent(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      this.updateAuthState({ isLoading: true, error: null });
      
      // Create/update guardian record first
      const { error: insertError } = await supabase
        .from("guardians")
        .upsert({
          email: email.trim().toLowerCase(),
          weekly_report: true,
          monthly_report: false,
        } as any, { onConflict: 'email' });

      if (insertError) {
        console.warn('[RobustAuthService] Failed to create guardian record:', insertError);
      }

      // Send magic link
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          data: { role: "guardian" },
          emailRedirectTo: 'https://www.lanamind.com/auth/auto-login',
        },
      });

      if (error) {
        console.error('[RobustAuthService] Registration error:', error);
        this.updateAuthState({ 
          isLoading: false, 
          error: error.message 
        });
        return { success: false, error: error.message };
      }

      this.updateAuthState({ isLoading: false });
      return { success: true };
    } catch (error: unknown) {
      console.error('[RobustAuthService] Unexpected registration error:', error);
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
      
      const result = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://www.lanamind.com/auth/auto-login',
          scopes: 'openid email profile',
        },
      });

      // Handle case where result might be undefined
      if (!result) {
        throw new Error('No response from authentication service');
      }

      const { data, error } = result;

      if (error) {
        console.error('[RobustAuthService] Google login error:', error);
        this.updateAuthState({ 
          isLoading: false, 
          error: error.message 
        });
        return { success: false, error: error.message };
      }

      // For OAuth, the redirect happens automatically
      this.clearError();
      this.updateAuthState({ isLoading: false });
      return { success: true };
    } catch (error) {
      console.error('[RobustAuthService] Unexpected Google login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred during Google login';
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

      this.clearError();
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

      this.clearError();
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
    // Clear listeners to prevent memory leaks
    this.listeners = [];
    // Clear offline queue
    this.offlineQueue = [];
  }
}