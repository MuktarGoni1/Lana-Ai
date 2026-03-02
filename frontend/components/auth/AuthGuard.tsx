"use client";

import React, { useEffect, useState } from 'react';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { useRouter } from 'next/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const { isAuthenticated, isLoading, checkAuthStatus } = useUnifiedAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      // Force a fresh check of authentication status
      await checkAuthStatus(true);
      setIsChecking(false);
    };

    if (requireAuth) {
      verifyAuth();
    } else {
      setIsChecking(false);
    }
  }, [requireAuth, checkAuthStatus]);

  useEffect(() => {
    // If authentication is required and user is not authenticated, redirect to login
    if (requireAuth && !isLoading && !isChecking && !isAuthenticated) {
      console.log('[AuthGuard] User not authenticated, redirecting to login');
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, isChecking, requireAuth, router]);

  // Show loading state while checking auth status
  if (requireAuth && (isLoading || isChecking)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white/10 border-t-white/30 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/50">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // If authentication is not required, or user is authenticated, render children
  if (!requireAuth || isAuthenticated) {
    return <>{children}</>;
  }

  // This case should be rare, but just in case
  return null;
}