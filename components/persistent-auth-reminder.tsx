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
  }>({ isAuthenticated: false, isLoading: true });

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
          // If useEnhancedAuth throws (e.g., outside provider), set to default state
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } catch (error) {
        // If import fails, set to default state
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
  
  // Check if user has dismissed the reminder before and show toast if needed
  useEffect(() => {
    if (auth.isLoading || auth.isAuthenticated) {
      return; // Don't show reminder if loading or authenticated
    }
    
    if (typeof window !== "undefined") {
      try {
        const storedDismissCount = localStorage.getItem("lana_auth_reminder_dismiss_count");
        const lastDismissTime = localStorage.getItem("lana_auth_reminder_last_dismiss");
        
        let dismissCount = 0;
        if (storedDismissCount) {
          dismissCount = parseInt(storedDismissCount, 10);
        }
        
        let shouldShow = false;
        
        // Show reminder immediately for new visitors
        if (!storedDismissCount) {
          shouldShow = true;
        } else {
          // For returning visitors, implement progressive intensity
          const lastDismissTimestamp = lastDismissTime ? parseInt(lastDismissTime, 10) : 0;
          const now = Date.now();
          const hoursSinceLastDismiss = (now - lastDismissTimestamp) / (1000 * 60 * 60);
          
          // Show reminder more frequently for users who keep dismissing it
          if (dismissCount >= 3 && hoursSinceLastDismiss < 24) {
            // Show every hour if dismissed 3+ times within 24 hours
            shouldShow = true;
          } else if (dismissCount >= 2 && hoursSinceLastDismiss < 48) {
            // Show every 4 hours if dismissed 2+ times within 48 hours
            shouldShow = hoursSinceLastDismiss > 4;
          } else if (dismissCount >= 1 && hoursSinceLastDismiss < 72) {
            // Show every 12 hours if dismissed 1+ times within 72 hours
            shouldShow = hoursSinceLastDismiss > 12;
          } else {
            // Default behavior - show after 24 hours
            shouldShow = hoursSinceLastDismiss > 24;
          }
        }
        
        // Show the toast if conditions are met
        if (shouldShow) {
          // Increment the dismissal count when the toast is shown (to prevent spam)
          incrementDismissalCount();
          
          toast({
            title: "Unlock Your Full Learning Experience",
            description: "Create an account to save your progress, access personalized features, and continue learning.",
            action: (
              <div className="flex flex-col gap-2">
                <ToastAction 
                  altText="Sign Up" 
                  onClick={() => {
                    // Update dismissal tracking when user clicks sign up
                    updateDismissalTracking();
                    router.push("/register");
                  }}
                  className="w-full"
                >
                  Sign Up
                </ToastAction>
                <ToastAction 
                  altText="Login" 
                  onClick={() => {
                    // Update dismissal tracking when user clicks login
                    updateDismissalTracking();
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
        }
      } catch (error) {
        console.error("Error in auth reminder logic:", error);
      }
    }
  }, [auth, toast, router]);
  
  // Function to increment dismissal count when toast is shown
  const incrementDismissalCount = () => {
    if (typeof window !== "undefined") {
      try {
        const storedDismissCount = localStorage.getItem("lana_auth_reminder_dismiss_count");
        const currentCount = storedDismissCount ? parseInt(storedDismissCount, 10) : 0;
        const newCount = currentCount + 1;
        
        localStorage.setItem("lana_auth_reminder_dismiss_count", newCount.toString());
        localStorage.setItem("lana_auth_reminder_last_dismiss", Date.now().toString());
      } catch (error) {
        console.error("Error incrementing dismissal count:", error);
      }
    }
  };
  
  // Function to update dismissal tracking when user actively engages with the toast
  const updateDismissalTracking = () => {
    if (typeof window !== "undefined") {
      try {
        // Update the last dismiss time but don't increment the count
        // This ensures that clicking on options resets the timer without increasing the spam level
        localStorage.setItem("lana_auth_reminder_last_dismiss", Date.now().toString());
      } catch (error) {
        console.error("Error updating dismissal tracking:", error);
      }
    }
  };

  // Don't render anything - this component only shows toasts
  return null;
}