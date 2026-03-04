"use client";

import { useState, useEffect } from "react";
import { LogOut } from "lucide-react";
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

export function AuthIndicator() {
  const { user, isAuthenticated, isLoading, logout } = useUnifiedAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle visibility with a slight delay to ensure auth state is loaded
  useEffect(() => {
    if (!isLoading) {
      setIsVisible(isAuthenticated);
    }
  }, [isAuthenticated, isLoading]);

  // Periodically check auth status to ensure it's up to date
  useEffect(() => {
    const interval = setInterval(() => {
      // This will trigger a re-render if auth status changes
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  if (isLoading || !isVisible) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      setError('Failed to logout. Please try again.');
    }
  };

  return (
    <div 
      className="fixed top-4 right-4 z-50 group flex items-center gap-2"
      aria-label="Authentication status indicator"
      role="status"
    >
      <div 
        className={`w-3 h-3 rounded-full ${isAuthenticated ? 'bg-green-500 shadow-[0_0_8px_rgba(0,255,0,0.5)] animate-pulse' : 'bg-red-500 shadow-[0_0_8px_rgba(255,0,0,0.5)]'}`}
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
        {isAuthenticated ? "You're logged in" : "Not authenticated"}
      </div>
      {error && (
        <div className="absolute -bottom-8 left-0 bg-red-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  );
}