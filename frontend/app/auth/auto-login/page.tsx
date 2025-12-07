"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { useRobustAuth } from "@/contexts/RobustAuthContext";

export default function AutoLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { checkAuthStatus } = useRobustAuth();
  const [status, setStatus] = useState<"idle" | "confirming" | "confirmed" | "error">("idle");

  useEffect(() => {
    const autoLogin = async () => {
      setStatus("confirming");
      try {
        // Force refresh the authentication status
        const authResult = await checkAuthStatus(true);
        
        const user = authResult.user;
        if (!user) throw new Error("No active session after magic link.");

        // Check if user has completed onboarding
        const onboardingComplete = Boolean(user.user_metadata?.onboarding_complete);
        
        // If onboarding is not complete, redirect to onboarding
        if (!onboardingComplete) {
          setStatus("confirmed");
          toast({ title: "Authentication confirmed", description: "Redirecting to onboarding..." });

          setTimeout(() => {
            router.push("/onboarding");
          }, 1000);
          return;
        }

        setStatus("confirmed");
        toast({ title: "Authentication confirmed", description: "You are now signed in." });

        // Check for last visited page in cookies
        let lastVisited = null;
        if (typeof window !== 'undefined') {
          // Try to get from localStorage first (fallback for older browsers)
          lastVisited = localStorage.getItem('lana_last_visited');
          
          // Try to get from cookies (newer approach)
          const cookies = document.cookie.split(';');
          for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'lana_last_visited') {
              lastVisited = decodeURIComponent(value);
              break;
            }
          }
        }

        // Store the last visited page in localStorage as well for redundancy
        if (typeof window !== 'undefined' && lastVisited) {
          localStorage.setItem('lana_last_visited', lastVisited);
        }

        // Redirect to last visited page if available and not an auth page, otherwise homepage
        const redirectPath = lastVisited && 
                             !lastVisited.startsWith('/login') && 
                             !lastVisited.startsWith('/register') && 
                             !lastVisited.startsWith('/auth') && 
                             lastVisited !== '/landing-page' ? 
                             lastVisited : '/homepage';

        setTimeout(() => {
          router.push(redirectPath);
        }, 1000);
      } catch (err) {
        console.error("[auto-login] confirmation error:", err);
        setStatus("error");
        toast({
          title: "Authentication issue",
          description: err instanceof Error ? err.message : "Unable to confirm authentication.",
          variant: "destructive",
        });
        // Add error tracking
        try {
          // Log error details for debugging
          console.error('[auto-login] detailed error info:', {
            message: err instanceof Error ? err.message : 'Unknown error',
            stack: err instanceof Error ? err.stack : 'No stack trace',
            timestamp: new Date().toISOString()
          });
        } catch (logError) {
          console.error('[auto-login] failed to log error details:', logError);
        }
        // Fallback: send user to landing page to avoid login loops
        setTimeout(() => router.replace("/landing-page"), 2500);
      }
    };

    autoLogin();
  }, [router, toast, checkAuthStatus]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 text-center space-y-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Signing you in</h1>
          <p className="text-white/50 text-sm">
            {status === "confirming" && "Confirming your session…"}
            {status === "confirmed" && "Authentication successful. Redirecting…"}
            {status === "error" && "We couldn't sign you in."}
          </p>
        </div>
        <div className="flex justify-center">
          <div className="w-8 h-8 border-2 border-white/10 border-t-white/30 rounded-full animate-spin"></div>
        </div>
        {status === "error" && (
          <div className="pt-4">
            <button
              onClick={() => router.replace("/login")}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm"
            >
              Return to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}