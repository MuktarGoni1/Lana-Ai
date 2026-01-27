"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserService } from '@/lib/api/userService';
import { type User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { RobustAuthService, type RobustAuthState } from '@/lib/services/robustAuthService';

interface UnifiedAuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  lastChecked: number | null;
  login: (email: string) => Promise<void>;
  loginWithEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  checkAuthStatus: (forceRefresh?: boolean) => Promise<RobustAuthState>;
  getUserRole: () => 'child' | 'guardian' | 'parent' | null;
  isOnboardingComplete: () => boolean;
}

const UnifiedAuthContext = createContext<UnifiedAuthContextType | undefined>(undefined);

export function UnifiedAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<number | null>(null);
  const router = useRouter();

  const authService = RobustAuthService.getInstance();

  // Refresh user data using secure API
  const refreshUser = useCallback(async () => {
    try {
      const profile = await UserService.getProfile();
      
      // Create a mock User object compatible with existing code
      const currentUser = {
        id: profile.id,
        email: profile.email,
        user_metadata: profile.user_metadata,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      } as User;
      
      setUser(currentUser);
      setIsAuthenticated(true);
      setError(null);
    } catch (error) {
      console.error('[UnifiedAuthContext] Error refreshing user:', error);
      setUser(null);
      setIsAuthenticated(false);
      setError(error instanceof Error ? error.message : 'Unknown error');
    }
  }, []);

  // Check authentication status
  const checkAuthStatus = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      const state = await authService.checkAuthStatus(forceRefresh);
      setUser(state.user);
      setIsAuthenticated(state.isAuthenticated);
      setError(state.error);
      setLastChecked(state.lastChecked);
      setIsLoading(false);
      return state;
    } catch (error) {
      console.error('[UnifiedAuthContext] Error checking auth status:', error);
      setUser(null);
      setIsAuthenticated(false);
      setError(error instanceof Error ? error.message : 'Unknown error');
      setIsLoading(false);
      // Return a default state in case of error
      return {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: Date.now()
      };
    }
  }, [authService]);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      await checkAuthStatus();
    };

    initializeAuth();

    // Listen for auth state changes
    const unsubscribe = authService.subscribe((state) => {
      setUser(state.user);
      setIsAuthenticated(state.isAuthenticated);
      setIsLoading(state.isLoading);
      setError(state.error);
      setLastChecked(state.lastChecked);
    });

    return () => {
      unsubscribe();
    };
  }, [checkAuthStatus, authService]);

  const login = useCallback(async (email: string) => {
    try {
      // For now, delegate to authService which should handle the OTP login
      // This maintains compatibility with existing auth flow
      await authService.loginWithEmail(email);
    } catch (error) {
      console.error('[UnifiedAuthContext] Login error:', error);
      throw error;
    }
  }, [authService]);

  const loginWithEmail = useCallback(async (email: string) => {
    return await authService.loginWithEmail(email);
  }, [authService]);

  const loginWithGoogle = useCallback(async () => {
    try {
      // Use the authService to handle Google login
      const result = await authService.loginWithGoogle();
      
      if (!result.success) {
        console.error('[UnifiedAuthContext] Google login error:', result.error);
        return { success: false, error: result.error };
      }

      // For OAuth, the redirect happens automatically
      return { success: true };
    } catch (error) {
      console.error('[UnifiedAuthContext] Unexpected Google login error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred during Google login' 
      };
    }
  }, [authService]);

  const logout = useCallback(async () => {
    try {
      // Delegate to authService for sign out
      await authService.logout();
      
      setUser(null);
      setIsAuthenticated(false);
      router.push('/login');
    } catch (error) {
      console.error('[UnifiedAuthContext] Logout error:', error);
      throw error;
    }
  }, [authService, router]);

  // Get user's role
  const getUserRole = useCallback(() => {
    if (!user) return null;
    
    const role = user.user_metadata?.role;
    if (role === 'child' || role === 'guardian' || role === 'parent') {
      return role;
    }
    
    return null;
  }, [user]);

  // Check if onboarding is complete
  const isOnboardingComplete = useCallback(() => {
    if (!user) return false;
    
    return Boolean(
      user.user_metadata?.onboarding_complete ||
      (typeof window !== 'undefined' && document.cookie.includes('lana_onboarding_complete=1'))
    );
  }, [user]);

  const value = {
    user,
    isLoading,
    isAuthenticated,
    error,
    lastChecked,
    login,
    loginWithEmail,
    loginWithGoogle,
    logout,
    refreshUser,
    setUser,
    checkAuthStatus,
    getUserRole,
    isOnboardingComplete
  };

  return (
    <UnifiedAuthContext.Provider value={value}>
      {children}
    </UnifiedAuthContext.Provider>
  );
}

export function useUnifiedAuth() {
  const context = useContext(UnifiedAuthContext);
  if (context === undefined) {
    throw new Error('useUnifiedAuth must be used within a UnifiedAuthProvider');
  }
  return context;
}