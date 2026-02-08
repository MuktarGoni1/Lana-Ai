"use client";

import React from "react";
import { useEffect, useState } from "react";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from '@/lib/db';

export default function SessionTimeoutHandler() {
  const { isAuthenticated, logout } = useUnifiedAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [timeUntilLogout, setTimeUntilLogout] = useState(60); // 60 seconds warning

  // Check session validity periodically
  useEffect(() => {
    if (!isAuthenticated) return;

    let warningTimeout: NodeJS.Timeout;
    let logoutTimeout: NodeJS.Timeout;

    const checkSession = async () => {
      try {
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session check error:", error);
          handleSessionExpired();
          return;
        }
        
        if (!session) {
          handleSessionExpired();
          return;
        }
        
        // Calculate time until expiration
        const expiresAt = session.expires_at;
        if (expiresAt) {
          const now = Math.floor(Date.now() / 1000);
          const timeLeft = expiresAt - now;
          
          // Show warning 1 minute before expiration
          if (timeLeft <= 60 && timeLeft > 0) {
            setShowWarning(true);
            setTimeUntilLogout(timeLeft);
            
            // Auto-logout when time expires
            logoutTimeout = setTimeout(() => {
              handleSessionExpired();
            }, timeLeft * 1000);
          }
        }
        
        // Check again in 30 seconds
        warningTimeout = setTimeout(checkSession, 30000);
      } catch (error) {
        console.error("Error checking session:", error);
        handleSessionExpired();
      }
    };

    // Start checking after 1 minute
    warningTimeout = setTimeout(checkSession, 60000);

    return () => {
      if (warningTimeout) clearTimeout(warningTimeout);
      if (logoutTimeout) clearTimeout(logoutTimeout);
    };
  }, [isAuthenticated, logout, router, toast]);

  const handleSessionExpired = async () => {
    setShowWarning(false);
    
    // Show toast notification
    toast({
      title: "Session Expired",
      description: "Your session has expired for security reasons. Please log in again.",
      variant: "destructive"
    });
    
    // Log out user
    await logout();
    
    // Redirect to login
    router.push("/login");
  };

  const handleStayLoggedIn = async () => {
    try {
      // Refresh the session
      const { error } = await supabase.auth.refreshSession();
      
      if (error) {
        throw error;
      }
      
      setShowWarning(false);
      toast({
        title: "Session Extended",
        description: "Your session has been extended successfully."
      });
    } catch (error) {
      console.error("Error extending session:", error);
      toast({
        title: "Error",
        description: "Failed to extend session. Please log in again.",
        variant: "destructive"
      });
      handleSessionExpired();
    }
  };

  return (
    <Dialog open={showWarning} onOpenChange={setShowWarning}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Session Expiring Soon</DialogTitle>
          <DialogDescription>
            Your session will expire in {timeUntilLogout} seconds for security reasons.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center py-4">
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16" viewBox="0 0 36 36">
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#eee"
                strokeWidth="1"
              />
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeDasharray={`${100 - (timeUntilLogout / 60 * 100)}, 100`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-medium">{timeUntilLogout}s</span>
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleSessionExpired}>
            Log Out
          </Button>
          <Button onClick={handleStayLoggedIn}>
            Stay Logged In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}