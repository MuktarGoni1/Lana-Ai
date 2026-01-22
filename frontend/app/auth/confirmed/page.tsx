"use client";

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/db"
import { useToast } from "@/hooks/use-toast"
import { navigateToHomepage } from "@/lib/navigation"

// Ensure this page is not statically generated
export const dynamic = 'force-dynamic';

export default function AuthConfirmedPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "confirming" | "confirmed" | "error">("idle");

  useEffect(() => {
    const confirmAndRecord = async () => {
      setStatus("confirming");
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        const user = session?.user;
        if (!user) throw new Error("No active session after magic link.");

        const userEmail = user.email || null;
        const role = user.user_metadata?.role as "guardian" | "child" | undefined;
        setEmail(userEmail);

        // Add the user to an authenticated users list based on role
        try {
          if (role === "guardian" && userEmail) {
            // Cast supabase to any to bypass typing issues (following the pattern used in authService)
            const sb: any = supabase;
            const { error: upsertError } = await sb
              .from("guardians")
              .upsert({ email: userEmail, weekly_report: true, monthly_report: false }, { onConflict: "email" });
            if (upsertError) console.warn("[auth/confirmed] guardian upsert warn:", upsertError);
          } else if (role === "child" && userEmail) {
            // Child users typically inserted during registration; ensure existence by upserting minimal record
            // Cast supabase to any to bypass typing issues (following the pattern used in authService)
            const sb: any = supabase;
            try {
              const { error: upsertError } = await sb
                .from("users")
                .upsert({ id: user.id, email: userEmail, user_metadata: user.user_metadata }, { onConflict: "id" });
              if (upsertError) console.warn("[auth/confirmed] child upsert warn:", upsertError);
            } catch (upsertError) {
              // If the users table doesn't exist, that's okay - just log it
              console.debug("[auth/confirmed] users table may not exist:", upsertError);
            }
          }
        } catch (dbErr) {
          console.warn("[auth/confirmed] upsert error:", dbErr);
        }

        setStatus("confirmed");
        toast({ title: "Authentication confirmed", description: "You are now signed in." });

        // Show confirmation then redirect to onboarding
        setTimeout(() => {
          router.push("/onboarding");
        }, 2500);
      } catch (err) {
        console.error("[auth/confirmed] confirmation error:", err);
        setStatus("error");
        toast({
          title: "Authentication issue",
          description: err instanceof Error ? err.message : "Unable to confirm authentication.",
          variant: "destructive",
        });
        // Fallback: send user to onboarding
        setTimeout(() => router.push("/onboarding"), 2500);
      }
    };

    confirmAndRecord();
  }, [router, toast]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 text-center space-y-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Authentication Confirmed</h1>
          <p className="text-white/50 text-sm">
            {status === "confirming" && "Confirming your session…"}
            {status === "confirmed" && "Your authentication is complete/confirmed."}
            {status === "error" && "We couldn’t confirm your session."}
          </p>
        </div>
        {email && (
          <p className="text-white/40 text-xs">Signed in as {email}</p>
        )}
        <p className="text-white/60 text-sm">
          Please visit <a href="/onboarding" className="underline">onboarding</a>. You will be redirected shortly.
        </p>
      </div>
    </div>
  );
}