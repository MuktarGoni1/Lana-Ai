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

      // Check if this is a Google signup by checking the cookie
      const isGoogleSignup = document.cookie.includes('lana_google_signup=true');
      
      // If this is a Google signup, ensure onboarding is marked as incomplete
      if (isGoogleSignup && !meta.onboarding_complete) {
        // Clear the Google signup cookie
        document.cookie = 'lana_google_signup=; Max-Age=0; path=/;';
      }
      
      // Avoid reroute if already on term-plan onboarding
      const isOnboardingRoute = window.location.pathname.startsWith('/term-plan') && new URLSearchParams(window.location.search).get('onboarding') === '1';
      
      // If onboarding is complete and user is on onboarding page, redirect to term-plan
      if (isComplete && window.location.pathname === '/onboarding') {
        // Validate the path before redirecting
        try {
          const url = new URL('/term-plan', window.location.origin);
          router.replace(url.pathname);
        } catch (e) {
          console.error('[AuthWrapper] Invalid path for term-plan redirect:', e);
          router.replace('/homepage');
        }
        return true;
      }
      
      // If onboarding not complete and not a child → go to onboarding (not term-plan)
      if (!isComplete && role !== 'child' && !isOnboardingRoute && !window.location.pathname.startsWith('/term-plan')) {
        const returnTo = encodeURIComponent(currentPath || "/homepage");
        // Validate the path before redirecting
        try {
          const url = new URL(`/onboarding?returnTo=${returnTo}`, window.location.origin);
          router.replace(url.pathname + url.search);
        } catch (e) {
          console.error('[AuthWrapper] Invalid path for onboarding redirect:', e);
          router.replace('/onboarding');
        }
        return true;
      }
      
      // If user is on term-plan page but onboarding is not complete, redirect to onboarding
      if (!isComplete && window.location.pathname.startsWith('/term-plan')) {
        const returnTo = encodeURIComponent(currentPath || "/homepage");
        // Validate the path before redirecting
        try {
          const url = new URL(`/onboarding?returnTo=${returnTo}`, window.location.origin);
          router.replace(url.pathname + url.search);
        } catch (e) {
          console.error('[AuthWrapper] Invalid path for term-plan to onboarding redirect:', e);
          router.replace('/onboarding');
        }
        return true;
      }

      // From auth pages → go to homepage and preserve query
      if (window.location.pathname === "/login" || window.location.pathname.startsWith("/register")) {
        // Validate the path before redirecting
        try {
          const url = new URL(`/homepage${window.location.search || ""}`, window.location.origin);
          router.replace(url.pathname + url.search);
        } catch (e) {
          console.error('[AuthWrapper] Invalid path for auth page redirect:', e);
          router.replace('/homepage');
        }
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
        // Validate the path before redirecting
        try {
          const url = new URL("/homepage", window.location.origin);
          router.replace(url.pathname);
        } catch (e) {
          console.error('[AuthWrapper] Invalid path for signed out redirect:', e);
          // Fallback to window.location
          if (typeof window !== 'undefined') {
            window.location.href = '/homepage';
          }
        }
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