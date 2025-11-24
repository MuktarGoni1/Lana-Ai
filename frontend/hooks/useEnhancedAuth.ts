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

  const registerParent = useCallback(async (email: string) => {
    return await authService.registerParent(email);
  }, [authService]);

  const registerChild = useCallback(async (nickname: string, age: number, grade: string, guardianEmail: string) => {
    return await authService.registerChild(nickname, age, grade, guardianEmail);
  }, [authService]);

  const logout = useCallback(async () => {
    return await authService.logout();
  }, [authService]);

  const refreshSession = useCallback(async () => {
    return await authService.refreshSession();
  }, [authService]);

  const completeOnboarding = useCallback(async () => {
    return await authService.completeOnboarding();
  }, [authService]);

  const getUserRole = useCallback(() => {
    return authService.getUserRole();
  }, [authService]);

  const isOnboardingComplete = useCallback(() => {
    return authService.isOnboardingComplete();
  }, [authService]);

  return {
    ...authState,
    loginWithEmail,
    registerParent,
    registerChild,
    logout,
    refreshSession,
    completeOnboarding,
    getUserRole,
    isOnboardingComplete
  };
}