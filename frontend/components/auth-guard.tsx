"use client";

import React from "react";
import { useEffect } from "react";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { useRouter } from "next/navigation";

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export default function AuthGuard({ children, redirectTo = "/login" }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useUnifiedAuth();
  const router = useRouter();

  useEffect(() => {
    // If not authenticated and not loading, redirect to login
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, redirectTo, router]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-white/10 border-t-white/30 rounded-full animate-spin mx-auto" />
          <p className="text-white/30 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated, render children
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // If not authenticated and not loading, don't render anything
  // (redirect will happen in useEffect)
  return null;
}