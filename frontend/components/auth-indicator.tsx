"use client";

import { useState, useEffect } from "react";
import { LogOut } from "lucide-react";
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

// Declare gtag on Window interface
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export function AuthIndicator() {
  const { user, isAuthenticated, isLoading, logout } = useUnifiedAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<'authenticated' | 'pending' | 'expired' | 'unknown'>('unknown');

  // Handle visibility with a slight delay to ensure auth state is loaded
  useEffect(() => {
    if (!isLoading) {
      setIsVisible(true);
      // Set auth status based on authentication state
      let newAuthStatus: 'authenticated' | 'pending' | 'expired' | 'unknown' = 'unknown';
      if (isAuthenticated) {
        newAuthStatus = 'authenticated';
      }
      
      setAuthStatus(newAuthStatus);
      
      // Log authentication status change for monitoring
      if (process.env.NODE_ENV === 'development') {
        console.log('[AuthIndicator] Auth status updated:', { 
          newAuthStatus, 
          isAuthenticated, 
          userId: user?.id,
          userEmail: user?.email
        });
      }
      
      // Log indicator display event
      if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        window.gtag('event', 'auth_indicator_display', {
          status: newAuthStatus,
          authenticated: isAuthenticated
        });
      }
    }
  }, [isAuthenticated, isLoading, user]);

  // Periodically check auth status to ensure it's up to date
  useEffect(() => {
    const interval = setInterval(() => {
      // This will trigger a re-render if auth status changes
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Get indicator color based on auth status
  const getIndicatorColor = () => {
    switch (authStatus) {
      case 'authenticated':
        return 'bg-green-500 shadow-[0_0_8px_rgba(0,255,0,0.5)] animate-pulse';
      case 'pending':
        return 'bg-yellow-500 shadow-[0_0_8px_rgba(255,255,0,0.5)]';
      case 'expired':
        return 'bg-orange-500 shadow-[0_0_8px_rgba(255,165,0,0.5)]';
      default:
        return 'bg-red-500 shadow-[0_0_8px_rgba(255,0,0,0.5)]';
    }
  };

  // Get tooltip text based on auth status
  const getTooltipText = () => {
    switch (authStatus) {
      case 'authenticated':
        return "You're logged in";
      case 'pending':
        return "Authentication pending";
      case 'expired':
        return "Session expired";
      default:
        return "Not authenticated";
    }
  };

  if (isLoading || !isVisible) {
    return null;
  }

  const handleLogout = async () => {
    try {
      // Log logout action
      if (process.env.NODE_ENV === 'development') {
        console.log('[AuthIndicator] User initiated logout');
      }
      
      // Log logout event
      if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        window.gtag('event', 'logout_initiated');
      }
      
      await logout();
      
      // Log successful logout
      if (process.env.NODE_ENV === 'development') {
        console.log('[AuthIndicator] User logged out successfully');
      }
    } catch (error) {
      console.error('Logout error:', error);
      setError('Failed to logout. Please try again.');
      
      // Log logout error
      if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        window.gtag('event', 'logout_error', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  };

  return (
    <div 
      className="fixed top-4 right-4 z-50 group flex items-center gap-2"
      aria-label="Authentication status indicator"
      role="status"
      data-auth-status={authStatus}
    >
      <div 
        className={`w-3 h-3 rounded-full ${getIndicatorColor()}`}
        aria-hidden="true"
      />
      {isAuthenticated && (
        <button
          onClick={handleLogout}
          className="hidden group-hover:flex items-center gap-1 text-xs bg-black/80 text-white px-2 py-1 rounded hover:bg-black/90 transition-colors"
          aria-label="Logout"
        >
          <LogOut className="w-3 h-3" />
          Logout
        </button>
      )}
      <div 
        className="absolute -top-8 -left-20 hidden group-hover:block bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap"
        role="tooltip"
      >
        {getTooltipText()}
      </div>
      {error && (
        <div className="absolute -bottom-8 left-0 bg-red-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  );
}