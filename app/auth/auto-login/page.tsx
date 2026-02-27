"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { createClient } from "@/lib/supabase/client";

export default function AutoLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { checkAuthStatus } = useUnifiedAuth();
  const [status, setStatus] = useState<"confirming" | "confirmed" | "error">("confirming");

  useEffect(() => {
    async function autoLogin() {
      try {
        const authResult = await checkAuthStatus(true);
        const user = authResult.user;
        if (!user) throw new Error("No active session after magic link.");

        const supabase = createClient() as any;
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, age, grade")
          .eq("id", user.id)
          .maybeSingle();

        const needsSetup = !profile?.role || profile?.age == null || !profile?.grade;

        let lastVisited: string | null = null;
        if (typeof window !== "undefined") {
          lastVisited = localStorage.getItem("lana_last_visited");
          const cookies = document.cookie.split(";");
          for (const cookie of cookies) {
            const [name, value] = cookie.trim().split("=");
            if (name === "lana_last_visited") {
              lastVisited = decodeURIComponent(value);
              break;
            }
          }
          if (lastVisited) localStorage.setItem("lana_last_visited", lastVisited);
        }

        const redirectPath =
          needsSetup
            ? "/onboarding"
            : lastVisited &&
                !lastVisited.startsWith("/login") &&
                !lastVisited.startsWith("/register") &&
                !lastVisited.startsWith("/auth") &&
                lastVisited !== "/landing-page"
              ? lastVisited
              : "/";

        setStatus("confirmed");
        toast({ title: "Authentication confirmed", description: "Redirecting..." });
        setTimeout(() => router.push(redirectPath), 600);
      } catch (err) {
        console.error("[auto-login] confirmation error:", err);
        setStatus("error");
        toast({
          title: "Authentication issue",
          description: err instanceof Error ? err.message : "Unable to confirm authentication.",
          variant: "destructive",
        });
        setTimeout(() => router.replace("/login"), 1200);
      }
    }

    void autoLogin();
  }, [checkAuthStatus, router, toast]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 text-center space-y-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Signing you in</h1>
          <p className="text-white/50 text-sm">
            {status === "confirming" && "Confirming your session..."}
            {status === "confirmed" && "Authentication successful. Redirecting..."}
            {status === "error" && "We could not sign you in."}
          </p>
        </div>
        <div className="flex justify-center">
          <div className="w-8 h-8 border-2 border-white/10 border-t-white/30 rounded-full animate-spin" />
        </div>
      </div>
    </div>
  );
}
