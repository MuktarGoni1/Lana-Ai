"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/db';
import { type User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { RobustAuthService, type RobustAuthState } from '@/lib/services/robustAuthService';

interface RobustAuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  lastChecked: number | null;
  login: (email: string) => Promise<void>;
  loginWithEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  checkAuthStatus: (forceRefresh?: boolean) => Promise<RobustAuthState>;
}

const RobustAuthContext = createContext<RobustAuthContextType | undefined>(undefined);

export function RobustAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<number | null>(null);
  const router = useRouter();

  const authService = RobustAuthService.getInstance();

  // Refresh user data from Supabase
  const refreshUser = useCallback(async () => {
    try {
      const { data: { user: currentUser }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('[RobustAuthContext] Error refreshing user:', error);
        setUser(null);
        setIsAuthenticated(false);
        setError(error.message);
        return;
      }
      
      setUser(currentUser);
      setIsAuthenticated(!!currentUser);
      setError(null);
    } catch (error) {
      console.error('[RobustAuthContext] Unexpected error refreshing user:', error);
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
      return state; // Return the state to match the updated type signature
    } catch (error) {
      console.error('[RobustAuthContext] Error checking auth status:', error);
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
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/auto-login`,
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error('[RobustAuthContext] Login error:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      setUser(null);
      setIsAuthenticated(false);
      router.push('/login');
    } catch (error) {
      console.error('[RobustAuthContext] Logout error:', error);
      throw error;
    }
  }, [router]);

  const value = {
    user,
    isLoading,
    isAuthenticated,
    error,
    lastChecked,
    login,
    loginWithEmail: authService.loginWithEmail,
    logout,
    refreshUser,
    setUser,
    checkAuthStatus
  };

  return (
    <RobustAuthContext.Provider value={value}>
      {children}
    </RobustAuthContext.Provider>
  );
}

export function useRobustAuth() {
  const context = useContext(RobustAuthContext);
  if (context === undefined) {
    throw new Error('useRobustAuth must be used within a RobustAuthProvider');
  }
  return context;
}