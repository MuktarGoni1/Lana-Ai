import { useState, useEffect, useCallback } from 'react';
import { consolidatedAuthService, type ConsolidatedAuthState } from '@/lib/services/consolidatedAuthService';
import { type User } from '@supabase/supabase-js';

export function useConsolidatedAuth() {
  const [authState, setAuthState] = useState<ConsolidatedAuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    lastChecked: null
  });

  // Add debugging
  console.log('[useConsolidatedAuth] Initializing hook');

  useEffect(() => {
    console.log('[useConsolidatedAuth] useEffect running');
    // Subscribe to auth state changes
    const unsubscribe = consolidatedAuthService.subscribe((state) => {
      console.log('[useConsolidatedAuth] Auth state updated:', state);
      setAuthState(state);
    });

    // Cleanup subscription on unmount
    return () => {
      console.log('[useConsolidatedAuth] Cleaning up subscription');
      unsubscribe();
    };
  }, []);

  const loginWithEmail = useCallback(async (email: string) => {
    console.log('[useConsolidatedAuth] loginWithEmail called with:', email);
    return await consolidatedAuthService.loginWithEmail(email);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    console.log('[useConsolidatedAuth] loginWithGoogle called');
    return await consolidatedAuthService.loginWithGoogle();
  }, []);

  const registerParent = useCallback(async (email: string) => {
    console.log('[useConsolidatedAuth] registerParent called with:', email);
    return await consolidatedAuthService.registerParent(email);
  }, []);

  const registerChild = useCallback(async (nickname: string, age: number, grade: string, guardianEmail: string) => {
    console.log('[useConsolidatedAuth] registerChild called with:', { nickname, age, grade, guardianEmail });
    return await consolidatedAuthService.registerChild(nickname, age, grade, guardianEmail);
  }, []);

  const logout = useCallback(async () => {
    console.log('[useConsolidatedAuth] logout called');
    return await consolidatedAuthService.logout();
  }, []);

  const refreshSession = useCallback(async () => {
    console.log('[useConsolidatedAuth] refreshSession called');
    return await consolidatedAuthService.refreshSession();
  }, []);

  const checkAuthStatus = useCallback(async (forceRefresh = false) => {
    console.log('[useConsolidatedAuth] checkAuthStatus called with forceRefresh:', forceRefresh);
    return await consolidatedAuthService.checkAuthStatus(forceRefresh);
  }, []);

  const completeOnboarding = useCallback(async () => {
    console.log('[useConsolidatedAuth] completeOnboarding called');
    return await consolidatedAuthService.completeOnboarding();
  }, []);

  const getUserRole = useCallback(() => {
    console.log('[useConsolidatedAuth] getUserRole called');
    return consolidatedAuthService.getUserRole();
  }, []);

  const isOnboardingComplete = useCallback(() => {
    console.log('[useConsolidatedAuth] isOnboardingComplete called');
    return consolidatedAuthService.isOnboardingComplete();
  }, []);

  const returnValue = {
    ...authState,
    loginWithEmail,
    loginWithGoogle,
    registerParent,
    registerChild,
    logout,
    refreshSession,
    checkAuthStatus,
    completeOnboarding,
    getUserRole,
    isOnboardingComplete
  };
  
  console.log('[useConsolidatedAuth] Returning value:', returnValue);
  
  return returnValue;
}