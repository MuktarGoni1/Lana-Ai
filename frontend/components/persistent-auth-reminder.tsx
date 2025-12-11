"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ToastAction } from "@/components/ui/toast";

// Create a safe version of useEnhancedAuth that doesn't throw during SSR
function useSafeEnhancedAuth() {
  const [authState, setAuthState] = useState<{
    isAuthenticated: boolean;
    isLoading: boolean;
  } | null>(null);

  useEffect(() => {
    // Dynamically import the useEnhancedAuth hook only on the client side
    const loadAuth = async () => {
      try {
        const { useEnhancedAuth } = await import("@/hooks/useEnhancedAuth");
        // Try to use the hook, but catch any errors
        try {
          const auth = useEnhancedAuth();
          setAuthState({
            isAuthenticated: auth.isAuthenticated,
            isLoading: auth.isLoading,
          });
        } catch (error) {
          // If useEnhancedAuth throws (e.g., outside provider), set to null state
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } catch (error) {
        // If import fails, set to null state
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    loadAuth();
  }, []);

  return authState;
}

export function PersistentAuthReminder() {
  const auth = useSafeEnhancedAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [dismissCount, setDismissCount] = useState(0);
  const [shouldShowReminder, setShouldShowReminder] = useState(false);

  // Check if user has dismissed the reminder before
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedDismissCount = localStorage.getItem("lana_auth_reminder_dismiss_count");
      const lastDismissTime = localStorage.getItem("lana_auth_reminder_last_dismiss");
      
      if (storedDismissCount) {
        setDismissCount(parseInt(storedDismissCount, 10));
      }
      
      // Show reminder immediately for new visitors
      if (!storedDismissCount) {
        setShouldShowReminder(true);
      } else {
        // For returning visitors, implement progressive intensity
        const dismissCountNum = parseInt(storedDismissCount, 10);
        const lastDismissTimestamp = lastDismissTime ? parseInt(lastDismissTime, 10) : 0;
        const now = Date.now();
        const hoursSinceLastDismiss = (now - lastDismissTimestamp) / (1000 * 60 * 60);
        
        // Show reminder more frequently for users who keep dismissing it
        if (dismissCountNum >= 3 && hoursSinceLastDismiss < 24) {
          // Show every hour if dismissed 3+ times within 24 hours
          setShouldShowReminder(true);
        } else if (dismissCountNum >= 2 && hoursSinceLastDismiss < 48) {
          // Show every 4 hours if dismissed 2+ times within 48 hours
          setShouldShowReminder(hoursSinceLastDismiss > 4);
        } else if (dismissCountNum >= 1 && hoursSinceLastDismiss < 72) {
          // Show every 12 hours if dismissed 1+ times within 72 hours
          setShouldShowReminder(hoursSinceLastDismiss > 12);
        } else {
          // Default behavior - show after 24 hours
          setShouldShowReminder(hoursSinceLastDismiss > 24);
        }
      }
    }
  }, []);

  // Handle showing the reminder toast
  useEffect(() => {
    // Add extra safety check to ensure we never show reminders to authenticated users
    if (auth && !auth.isLoading && !auth.isAuthenticated && shouldShowReminder) {
      // Log that we're showing a reminder to an unauthenticated user
      if (process.env.NODE_ENV === 'development') {
        console.log('[PersistentAuthReminder] Showing auth reminder to unauthenticated user');
      }
      
      // Show a toast reminder with login/signup options
      toast({
        title: "Unlock Your Full Learning Experience",
        description: "Create an account to save your progress, access personalized features, and continue learning.",
        action: (
          <div className="flex flex-col gap-2">
            <ToastAction 
              altText="Sign Up" 
              onClick={() => {
                // Log signup action
                if (process.env.NODE_ENV === 'development') {
                  console.log('[PersistentAuthReminder] User clicked Sign Up');
                }
                router.push("/register");
              }}
              className="w-full"
            >
              Sign Up
            </ToastAction>
            <ToastAction 
              altText="Login" 
              onClick={() => {
                // Log login action
                if (process.env.NODE_ENV === 'development') {
                  console.log('[PersistentAuthReminder] User clicked Login');
                }
                router.push("/login");
              }}
              className="w-full border border-input bg-transparent hover:bg-accent hover:text-accent-foreground"
            >
              Login
            </ToastAction>
          </div>
        ),
        duration: 10000, // Show for 10 seconds
      });
      
      // Mark that we've shown the reminder
      setShouldShowReminder(false);
      
      // Update dismiss count in localStorage
      const newDismissCount = dismissCount + 1;
      setDismissCount(newDismissCount);
      localStorage.setItem("lana_auth_reminder_dismiss_count", newDismissCount.toString());
      localStorage.setItem("lana_auth_reminder_last_dismiss", Date.now().toString());
    }
    
    // Extra safety: Even if somehow the condition above fails, double-check we never show reminders to authenticated users
    if (auth && auth.isAuthenticated) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[PersistentAuthReminder] Authenticated user detected, suppressing reminder');
      }
      setShouldShowReminder(false);
    }
  }, [auth, shouldShowReminder, toast, router, dismissCount]);

  // Don't render anything if authenticated or loading
  if (!auth || auth.isLoading || auth.isAuthenticated) {
    return null;
  }

  return null; // This component doesn't render anything directly, it just shows toasts
}