import { useState, useEffect, useCallback } from 'react';
import { EnhancedAuthService, type AuthState } from '@/lib/services/enhancedAuthService';
import { type User } from '@supabase/supabase-js';

export function useEnhancedAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });

  const authService = EnhancedAuthService.getInstance();
  
  // Add debugging
  console.log('[useEnhancedAuth] Initializing hook');
  console.log('[useEnhancedAuth] authService:', authService);
  console.log('[useEnhancedAuth] loginWithGoogle method:', authService.loginWithGoogle);
  console.log('[useEnhancedAuth] typeof loginWithGoogle:', typeof authService.loginWithGoogle);

  useEffect(() => {
    console.log('[useEnhancedAuth] useEffect running');
    // Subscribe to auth state changes
    const unsubscribe = authService.subscribe((state) => {
      console.log('[useEnhancedAuth] Auth state updated:', state);
      setAuthState(state);
    });

    // Cleanup subscription on unmount
    return () => {
      console.log('[useEnhancedAuth] Cleaning up subscription');
      unsubscribe();
    };
  }, [authService]);

  const loginWithEmail = useCallback(async (email: string) => {
    console.log('[useEnhancedAuth] loginWithEmail called with:', email);
    return await authService.loginWithEmail(email);
  }, [authService]);

  const loginWithGoogle = useCallback(async () => {
    console.log('[useEnhancedAuth] loginWithGoogle called');
    console.log('[useEnhancedAuth] authService object:', authService);
    console.log('[useEnhancedAuth] loginWithGoogle property:', authService.loginWithGoogle);
    console.log('[useEnhancedAuth] typeof loginWithGoogle:', typeof authService.loginWithGoogle);
    
    // Check if the function exists on the service
    if (typeof authService.loginWithGoogle !== 'function') {
      console.error('[useEnhancedAuth] loginWithGoogle is not a function on authService');
      console.error('[useEnhancedAuth] Available methods on authService:', Object.getOwnPropertyNames(Object.getPrototypeOf(authService)));
      return { success: false, error: 'Google login function is not available' };
    }
    return await authService.loginWithGoogle();
  }, [authService]);

  const registerParent = useCallback(async (email: string) => {
    console.log('[useEnhancedAuth] registerParent called with:', email);
    return await authService.registerParent(email);
  }, [authService]);

  const registerChild = useCallback(async (nickname: string, age: number, grade: string, guardianEmail: string) => {
    console.log('[useEnhancedAuth] registerChild called with:', { nickname, age, grade, guardianEmail });
    return await authService.registerChild(nickname, age, grade, guardianEmail);
  }, [authService]);

  const logout = useCallback(async () => {
    console.log('[useEnhancedAuth] logout called');
    return await authService.logout();
  }, [authService]);

  const refreshSession = useCallback(async () => {
    console.log('[useEnhancedAuth] refreshSession called');
    return await authService.refreshSession();
  }, [authService]);

  const completeOnboarding = useCallback(async () => {
    console.log('[useEnhancedAuth] completeOnboarding called');
    return await authService.completeOnboarding();
  }, [authService]);

  const getUserRole = useCallback(() => {
    console.log('[useEnhancedAuth] getUserRole called');
    return authService.getUserRole();
  }, [authService]);

  const isOnboardingComplete = useCallback(() => {
    console.log('[useEnhancedAuth] isOnboardingComplete called');
    return authService.isOnboardingComplete();
  }, [authService]);

  const returnValue = {
    ...authState,
    loginWithEmail,
    loginWithGoogle,
    registerParent,
    registerChild,
    logout,
    refreshSession,
    completeOnboarding,
    getUserRole,
    isOnboardingComplete
  };
  
  console.log('[useEnhancedAuth] Returning value:', returnValue);
  
  return returnValue;
}