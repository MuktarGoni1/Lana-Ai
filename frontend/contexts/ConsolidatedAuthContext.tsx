"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/db';
import { type User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { consolidatedAuthService, type ConsolidatedAuthState } from '@/lib/services/consolidatedAuthService';

interface ConsolidatedAuthContextType {
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
  checkAuthStatus: (forceRefresh?: boolean) => Promise<ConsolidatedAuthState>;
  getUserRole: () => 'child' | 'guardian' | 'parent' | null;
  isOnboardingComplete: () => boolean;
  completeOnboarding: () => Promise<{ success: boolean; error?: string }>;
}

const ConsolidatedAuthContext = createContext<ConsolidatedAuthContextType | undefined>(undefined);

export function ConsolidatedAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<number | null>(null);
  const router = useRouter();

  // Refresh user data from Supabase
  const refreshUser = useCallback(async () => {
    try {
      const { data: { user: currentUser }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('[ConsolidatedAuthContext] Error refreshing user:', error);
        setUser(null);
        setIsAuthenticated(false);
        setError(error.message);
        return;
      }
      
      setUser(currentUser);
      setIsAuthenticated(!!currentUser);
      setError(null);
    } catch (error) {
      console.error('[ConsolidatedAuthContext] Unexpected error refreshing user:', error);
      setUser(null);
      setIsAuthenticated(false);
      setError(error instanceof Error ? error.message : 'Unknown error');
    }
  }, []);

  // Check authentication status
  const checkAuthStatus = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      const state = await consolidatedAuthService.checkAuthStatus(forceRefresh);
      setUser(state.user);
      setIsAuthenticated(state.isAuthenticated);
      setError(state.error);
      setLastChecked(state.lastChecked);
      setIsLoading(false);
      return state;
    } catch (error) {
      console.error('[ConsolidatedAuthContext] Error checking auth status:', error);
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
  }, []);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      await checkAuthStatus();
    };

    initializeAuth();

    // Listen for auth state changes
    const unsubscribe = consolidatedAuthService.subscribe((state) => {
      setUser(state.user);
      setIsAuthenticated(state.isAuthenticated);
      setIsLoading(state.isLoading);
      setError(state.error);
      setLastChecked(state.lastChecked);
    });

    return () => {
      unsubscribe();
    };
  }, [checkAuthStatus]);

  const login = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/auto-login`,
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error('[ConsolidatedAuthContext] Login error:', error);
      throw error;
    }
  }, []);

  const loginWithEmail = useCallback(async (email: string) => {
    return await consolidatedAuthService.loginWithEmail(email);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    return await consolidatedAuthService.loginWithGoogle();
  }, []);

  const logout = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      setUser(null);
      setIsAuthenticated(false);
      router.push('/login');
    } catch (error) {
      console.error('[ConsolidatedAuthContext] Logout error:', error);
      throw error;
    }
  }, [router]);

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

  // Complete onboarding
  const completeOnboarding = useCallback(async () => {
    return await consolidatedAuthService.completeOnboarding();
  }, []);

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
    isOnboardingComplete,
    completeOnboarding
  };

  return (
    <ConsolidatedAuthContext.Provider value={value}>
      {children}
    </ConsolidatedAuthContext.Provider>
  );
}

export function useConsolidatedAuth() {
  const context = useContext(ConsolidatedAuthContext);
  if (context === undefined) {
    throw new Error('useConsolidatedAuth must be used within a ConsolidatedAuthProvider');
  }
  return context;
}