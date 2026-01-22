"use client";

import React, { useEffect, useCallback, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

// Create a safe version of useComprehensiveAuth that doesn't throw during SSR
function useSafeComprehensiveAuth() {
  const [authState, setAuthState] = useState<{
    checkAuthStatus: (forceRefresh?: boolean) => Promise<any>;
    isAuthenticated: boolean;
    user: any;
  } | null>(null);

  useEffect(() => {
    // Dynamically import the useUnifiedAuth hook only on the client side
    const loadAuth = async () => {
      try {
        const { useComprehensiveAuth } = await import('@/contexts/ComprehensiveAuthContext');
        // Try to use the hook, but catch any errors
        try {
          const auth = useComprehensiveAuth();
          setAuthState({
            checkAuthStatus: auth.checkAuthStatus,
            isAuthenticated: auth.isAuthenticated,
            user: auth.user,
          });
        } catch (error) {
          // If useUnifiedAuth throws (e.g., outside provider), set to null state
          setAuthState(null);
        }
      } catch (error) {
        // If import fails, set to null state
        setAuthState(null);
      }
    };

    loadAuth();
  }, []);

  return authState;
}

export function SessionMonitor() {
  const auth = useSafeComprehensiveAuth();
  const { toast } = useToast();
  const [isInitialized, setIsInitialized] = useState(false);

  // Function to handle session checks
  const performSessionCheck = useCallback(async () => {
    if (!auth) return;
    
    try {
      console.log('[SessionMonitor] Performing periodic session check');
      const result = await auth.checkAuthStatus(true); // Force refresh
      
      // If user was authenticated but is no longer, show notification
      if (!result.isAuthenticated && auth.isAuthenticated) {
        console.log('[SessionMonitor] User session expired or invalidated');
        toast({
          title: "Session Expired",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        });
      }
      
      // Log authentication events
      console.log('[SessionMonitor] Session check result:', {
        isAuthenticated: result.isAuthenticated,
        userId: result.user?.id,
        lastChecked: result.lastChecked
      });
    } catch (error) {
      console.error('[SessionMonitor] Error during session check:', error);
      toast({
        title: "Connection Issue",
        description: "Having trouble checking your authentication status. Please check your connection.",
        variant: "destructive",
      });
    }
  }, [auth, toast]);

  // Set up periodic session monitoring
  useEffect(() => {
    if (!auth || isInitialized) return;
    
    setIsInitialized(true);
    
    // Check session immediately when component mounts
    performSessionCheck();
    
    // Set up interval for periodic checks (every 2 minutes)
    const intervalId = setInterval(performSessionCheck, 2 * 60 * 1000);
    
    // Clean up interval on component unmount
    return () => {
      console.log('[SessionMonitor] Cleaning up session monitoring');
      clearInterval(intervalId);
    };
  }, [auth, performSessionCheck, isInitialized]);

  // Set up visibility change listener to check session when user returns to tab
  useEffect(() => {
    if (!auth) return;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[SessionMonitor] Tab became visible, checking session');
        performSessionCheck();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [auth, performSessionCheck]);

  // Set up online/offline event listeners
  useEffect(() => {
    if (!auth) return;
    
    const handleOnline = () => {
      console.log('[SessionMonitor] Browser went online, checking session');
      performSessionCheck();
      toast({
        title: "Connection Restored",
        description: "You're back online. Checking authentication status...",
      });
    };

    const handleOffline = () => {
      console.log('[SessionMonitor] Browser went offline');
      toast({
        title: "Connection Lost",
        description: "You appear to be offline. Your session may become invalid.",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [auth, performSessionCheck, toast]);

  // This component doesn't render anything visible
  return null;
}