"use client";

import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { LogOut } from "lucide-react";

export function AuthIndicator() {
  const { user, loading, signOut } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  // Handle visibility with a slight delay to ensure auth state is loaded
  useEffect(() => {
    if (!loading) {
      setIsVisible(!!user);
    }
  }, [user, loading]);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading || !isVisible) {
    return null;
  }

  return (
    <div 
      className="fixed top-4 right-4 z-50 group flex items-center gap-2"
      aria-label="Authentication status indicator"
      role="status"
    >
      <div 
        className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(0,255,0,0.5)] animate-pulse"
        aria-hidden="true"
      />
      <button
        onClick={handleLogout}
        className="hidden group-hover:flex items-center gap-1 text-xs bg-black/80 text-white px-2 py-1 rounded hover:bg-black/90 transition-colors"
        aria-label="Logout"
      >
        <LogOut className="w-3 h-3" />
        Logout
      </button>
      <div 
        className="absolute -top-8 -left-20 hidden group-hover:block bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap"
        role="tooltip"
      >
        You're logged in
      </div>
    </div>
  );
}