"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/db';
import { type User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { comprehensiveAuthService, type ComprehensiveAuthState } from '@/lib/services/comprehensiveAuthService';

interface ComprehensiveAuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isPro: boolean;
  checkingPro: boolean;
  error: string | null;
  lastChecked: number | null;
  login: (email: string) => Promise<void>;
  loginWithEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshProStatus: () => Promise<void>;
  setUser: (user: User | null) => void;
  checkAuthStatus: (forceRefresh?: boolean) => Promise<ComprehensiveAuthState>;
  getUserRole: () => 'child' | 'guardian' | 'parent' | null;
  isOnboardingComplete: () => boolean;
  requestUserConsent: (consentData: any) => Promise<{ success: boolean; error?: string }>;
  hasGivenConsent: () => boolean;
}

const ComprehensiveAuthContext = createContext<ComprehensiveAuthContextType | undefined>(undefined);

export function ComprehensiveAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPro, setIsPro] = useState<boolean>(false);
  const [checkingPro, setCheckingPro] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<number | null>(null);
  const router = useRouter();

  const authService = comprehensiveAuthService;

  // Refresh user data from Supabase
  const refreshUser = useCallback(async () => {
    try {
      const { data: { user: currentUser }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('[ComprehensiveAuthContext] Error refreshing user:', error);
        setUser(null);
        setIsAuthenticated(false);
        setError(error.message);
        return;
      }
      
      setUser(currentUser);
      setIsAuthenticated(!!currentUser);
      setError(null);
    } catch (error) {
      console.error('[ComprehensiveAuthContext] Unexpected error refreshing user:', error);
      setUser(null);
      setIsAuthenticated(false);
      setError(error instanceof Error ? error.message : 'Unknown error');
    }
  }, []);

  const refreshProStatus = useCallback(async () => {
    try {
      setCheckingPro(true);
      
      const response = await fetch('/api/subscription/status');
      
      if (response.ok) {
        const data = await response.json();
        setIsPro(Boolean(data.is_pro));
      } else {
        // Handle specific error cases
        if (response.status === 404) {
          console.error('Subscription status endpoint not found');
          setIsPro(false);
        } else {
          // Treat any other status as non-pro without noisy logging
          setIsPro(false);
        }
      }
    } catch (e: unknown) {
      console.error('Error checking subscription status:', e);
      setIsPro(false);
    } finally {
      setCheckingPro(false);
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
      setIsPro(state.isPro);
      setCheckingPro(state.checkingPro);
      setIsLoading(false);
      return state;
    } catch (error) {
      console.error('[ComprehensiveAuthContext] Error checking auth status:', error);
      setUser(null);
      setIsAuthenticated(false);
      setError(error instanceof Error ? error.message : 'Unknown error');
      setIsLoading(false);
      // Return a default state in case of error
      return {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isPro: false,
        checkingPro: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: Date.now(),
        consent: null
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
      setIsPro(state.isPro);
      setCheckingPro(state.checkingPro);
      setError(state.error);
      setLastChecked(state.lastChecked);
    });

    return () => {
      unsubscribe();
    };
  }, [checkAuthStatus, authService]);

  const login = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : 'https://www.lanamind.com'}/auth/auto-login`,
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error('[ComprehensiveAuthContext] Login error:', error);
      throw error;
    }
  }, []);

  const loginWithEmail = useCallback(async (email: string) => {
    return await authService.loginWithEmail(email);
  }, [authService]);

  const loginWithGoogle = useCallback(async () => {
    try {
      // Use the authService to handle Google login
      const result = await authService.loginWithGoogle();
      
      if (!result.success) {
        console.error('[ComprehensiveAuthContext] Google login error:', result.error);
        return { success: false, error: result.error };
      }

      // For OAuth, the redirect happens automatically
      return { success: true };
    } catch (error) {
      console.error('[ComprehensiveAuthContext] Unexpected Google login error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred during Google login' 
      };
    }
  }, [authService]);

  const logout = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      setUser(null);
      setIsAuthenticated(false);
      router.push('/login');
    } catch (error) {
      console.error('[ComprehensiveAuthContext] Logout error:', error);
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
    
    // Only rely on server-side verified user metadata
    return Boolean(user.user_metadata?.onboarding_complete);
  }, [user]);

  // Consent management
  const requestUserConsent = useCallback(async (consentData: any) => {
    return await authService.requestUserConsent(consentData);
  }, [authService]);

  const hasGivenConsent = useCallback(() => {
    return authService.hasGivenConsent();
  }, [authService]);

  const value = {
    user,
    isLoading,
    isAuthenticated,
    isPro,
    checkingPro,
    error,
    lastChecked,
    login,
    loginWithEmail,
    loginWithGoogle,
    logout,
    refreshUser,
    refreshProStatus,
    setUser,
    checkAuthStatus,
    getUserRole,
    isOnboardingComplete,
    requestUserConsent,
    hasGivenConsent
  };

  return (
    <ComprehensiveAuthContext.Provider value={value}>
      {children}
    </ComprehensiveAuthContext.Provider>
  );
}

export function useComprehensiveAuth() {
  const context = useContext(ComprehensiveAuthContext);
  if (context === undefined) {
    throw new Error('useComprehensiveAuth must be used within a ComprehensiveAuthProvider');
  }
  return context;
}