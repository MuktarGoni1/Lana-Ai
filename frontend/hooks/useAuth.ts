import { useState, useEffect } from 'react';

interface AuthState {
  user: any | null;
  isAuthenticated: boolean;
  loading: boolean;
  isLoading?: boolean;
  error: string | null;
  role?: string;
  isPro?: boolean;
  checkingPro?: boolean;
  isParent?: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: true,
    isLoading: true,
    error: null,
    isParent: false,
  });

  useEffect(() => {
    // Initialize auth state
    const initializeAuth = async () => {
      try {
        // Simulate auth check - in a real app, this would check the actual auth state
        setAuthState(prev => ({ ...prev, loading: false }));
      } catch (error) {
        setAuthState({
          user: null,
          isAuthenticated: false,
          loading: false,
          error: error instanceof Error ? error.message : 'An unknown error occurred',
        });
      }
    };

    initializeAuth();
  }, []);

  return authState;
};