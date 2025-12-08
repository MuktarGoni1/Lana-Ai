"use client";

import React, { useEffect, useCallback } from 'react';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { useToast } from '@/hooks/use-toast';

export function SessionMonitor() {
  const { checkAuthStatus, isAuthenticated, user } = useUnifiedAuth();
  const { toast } = useToast();

  // Function to handle session checks
  const performSessionCheck = useCallback(async () => {
    try {
      console.log('[SessionMonitor] Performing periodic session check');
      const result = await checkAuthStatus(true); // Force refresh
      
      // If user was authenticated but is no longer, show notification
      if (!result.isAuthenticated && isAuthenticated) {
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
  }, [checkAuthStatus, isAuthenticated, toast]);

  // Set up periodic session monitoring
  useEffect(() => {
    // Check session immediately when component mounts
    performSessionCheck();
    
    // Set up interval for periodic checks (every 2 minutes)
    const intervalId = setInterval(performSessionCheck, 2 * 60 * 1000);
    
    // Clean up interval on component unmount
    return () => {
      console.log('[SessionMonitor] Cleaning up session monitoring');
      clearInterval(intervalId);
    };
  }, [performSessionCheck]);

  // Set up visibility change listener to check session when user returns to tab
  useEffect(() => {
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
  }, [performSessionCheck]);

  // Set up online/offline event listeners
  useEffect(() => {
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
  }, [performSessionCheck, toast]);

  // This component doesn't render anything visible
  return null;
}