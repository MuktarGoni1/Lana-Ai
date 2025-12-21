"use client"
import React, { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/db"

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    // Helper to apply post-auth routing rules
    const applyRouting = (session: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]) => {
      if (!session) return;
      const currentPath = window.location.pathname + window.location.search;
      const meta = session.user.user_metadata || {};
      const cookieComplete = /(^|;)\s*lana_onboarding_complete=1\s*(;|$)/.test(document.cookie);
      const isComplete = Boolean(meta.onboarding_complete) || cookieComplete;
      const role = meta.role as 'child' | 'guardian' | undefined;

      // Avoid reroute if already on consolidated onboarding
      const isOnboardingRoute = window.location.pathname.startsWith('/consolidated-onboarding') || 
                             (window.location.pathname.startsWith('/term-plan') && new URLSearchParams(window.location.search).get('onboarding') === '1');
      
      // If onboarding not complete and not a child → go to consolidated onboarding
      if (!isComplete && role !== 'child' && !isOnboardingRoute) {
        router.replace('/consolidated-onboarding');
        return true;
      }

      // From auth pages → go to homepage and preserve query
      if (window.location.pathname === "/login" || window.location.pathname.startsWith("/register")) {
        router.replace(`/homepage${window.location.search || ""}`);
        return true;
      }

      return false;
    }

    // 1) Apply routing immediately on mount for existing sessions (fixes magic-link landing-page misroute)
    supabase.auth.getSession().then(({ data }) => {
      try { applyRouting(data.session); } catch (_) { /* noop */ }
    }).catch(() => {/* noop */})

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        // 2) Also apply routing on SIGNED_IN events to cover live transitions
        applyRouting(session);
      } else if (event === "SIGNED_OUT") {
        // For seamless guest experience, return to homepage instead of login
        router.replace("/homepage");
      }
    });
    return () => {
      if (listener?.subscription) {
        listener.subscription.unsubscribe();
      }
    };
  }, [router])

  return <>{children}</>
}