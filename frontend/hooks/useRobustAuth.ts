import { useState, useEffect, useCallback } from 'react';
import { RobustAuthService, type RobustAuthState } from '@/lib/services/robustAuthService';
import { type User } from '@supabase/supabase-js';

export function useRobustAuth() {
  const [authState, setAuthState] = useState<RobustAuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    lastChecked: null
  });

  const authService = RobustAuthService.getInstance();
  
  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = authService.subscribe((state) => {
      setAuthState(state);
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [authService]);

  const loginWithEmail = useCallback(async (email: string) => {
    return await authService.loginWithEmail(email);
  }, [authService]);

  const logout = useCallback(async () => {
    return await authService.logout();
  }, [authService]);

  const refreshSession = useCallback(async () => {
    return await authService.refreshSession();
  }, [authService]);

  const checkAuthStatus = useCallback(async (forceRefresh = false) => {
    return await authService.checkAuthStatus(forceRefresh);
  }, [authService]);

  const getUserRole = useCallback(() => {
    if (!authState.user) return null;
    
    const role = authState.user.user_metadata?.role;
    if (role === 'child' || role === 'guardian' || role === 'parent') {
      return role;
    }
    
    return null;
  }, [authState.user]);

  const isOnboardingComplete = useCallback(() => {
    if (!authState.user) return false;
    
    return Boolean(
      authState.user.user_metadata?.onboarding_complete ||
      (typeof window !== 'undefined' && document.cookie.includes('lana_onboarding_complete=1'))
    );
  }, [authState.user]);

  return {
    ...authState,
    loginWithEmail,
    logout,
    refreshSession,
    checkAuthStatus,
    getUserRole,
    isOnboardingComplete
  };
}