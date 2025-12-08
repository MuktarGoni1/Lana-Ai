"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useEnhancedAuth } from "@/hooks/useEnhancedAuth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ToastAction } from "@/components/ui/toast";

export function PersistentAuthReminder() {
  const { isAuthenticated, isLoading } = useEnhancedAuth();
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
    if (!isLoading && !isAuthenticated && shouldShowReminder) {
      // Show a toast reminder with login/signup options
      toast({
        title: "Unlock Your Full Learning Experience",
        description: "Create an account to save your progress, access personalized features, and continue learning.",
        action: (
          <div className="flex flex-col gap-2">
            <ToastAction 
              altText="Sign Up" 
              onClick={() => router.push("/register")}
              className="w-full"
            >
              Sign Up
            </ToastAction>
            <ToastAction 
              altText="Login" 
              onClick={() => router.push("/login")}
              className="w-full border border-input bg-transparent hover:bg-accent hover:text-accent-foreground"
            >
              Login
            </ToastAction>
          </div>
        ),
        duration: 10000, // Show for 10 seconds
      });
    }
  }, [isAuthenticated, isLoading, shouldShowReminder, toast, router]);

  // Don't render anything if authenticated or loading
  if (isLoading || isAuthenticated) {
    return null;
  }

  return null; // This component doesn't render anything directly, it just shows toasts
}