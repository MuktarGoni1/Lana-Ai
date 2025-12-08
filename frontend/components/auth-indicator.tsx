"use client";

import { useState, useEffect } from "react";
import { LogOut } from "lucide-react";

// Create a safe version of useAuth that doesn't throw during SSR
function useSafeAuth() {
  const [authState, setAuthState] = useState<{
    user: any;
    loading: boolean;
    signOut: () => Promise<void>;
  } | null>(null);

  useEffect(() => {
    // Dynamically import the useAuth hook only on the client side
    const loadAuth = async () => {
      try {
        const { useAuth } = await import("@/hooks/useAuth");
        // Try to use the hook, but catch any errors
        try {
          const auth = useAuth();
          setAuthState(auth);
        } catch (error) {
          // If useAuth throws (e.g., outside provider), set to null state
          setAuthState({
            user: null,
            loading: false,
            signOut: async () => {},
          });
        }
      } catch (error) {
        // If import fails, set to null state
        setAuthState({
          user: null,
          loading: false,
          signOut: async () => {},
        });
      }
    };

    loadAuth();
  }, []);

  return authState;
}

export function AuthIndicator() {
  const auth = useSafeAuth();
  const [isVisible, setIsVisible] = useState(false);

  // Handle visibility with a slight delay to ensure auth state is loaded
  useEffect(() => {
    if (auth && !auth.loading) {
      setIsVisible(!!auth.user);
    }
  }, [auth]);

  if (!auth || auth.loading || !isVisible) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

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