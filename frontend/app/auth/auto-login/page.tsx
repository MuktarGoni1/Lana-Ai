"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";

export default function AutoLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [status, setStatus] = useState<"idle" | "confirming" | "confirmed" | "error">("idle");

  useEffect(() => {
    const autoLogin = async () => {
      setStatus("confirming");
      try {
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        const user = session?.user;
        if (!user) throw new Error("No active session after magic link.");

        // Check if user has completed onboarding
        const onboardingComplete = Boolean(user.user_metadata?.onboarding_complete);
        
        // If onboarding is not complete, redirect to term-plan for onboarding
        if (!onboardingComplete) {
          // Set cookie for middleware
          try {
            const oneYear = 60 * 60 * 24 * 365;
            document.cookie = `lana_onboarding_complete=1; Max-Age=${oneYear}; Path=/; SameSite=Lax`;
          } catch (cookieErr) {
            console.warn("[auto-login] failed to set completion cookie:", cookieErr);
          }

          setStatus("confirmed");
          toast({ title: "Authentication confirmed", description: "Redirecting to onboarding..." });

          setTimeout(() => {
            router.replace("/term-plan?onboarding=1");
          }, 1000);
          return;
        }

        setStatus("confirmed");
        toast({ title: "Authentication confirmed", description: "You are now signed in." });

        // Redirect based on user role
        const role = user.user_metadata?.role as "guardian" | "child" | undefined;
        setTimeout(() => {
          if (role === "child") {
            router.replace("/personalised-ai-tutor");
          } else if (role === "guardian") {
            router.replace("/guardian");
          } else {
            router.replace("/homepage");
          }
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
  }, [router, toast]);

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