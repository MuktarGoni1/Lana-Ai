"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { navigateToHomepage } from "@/lib/navigation";

export default function GuardianConfirmedPage() {
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
        setEmail(userEmail);

        // Add or update guardian record
        if (userEmail) {
          const { error: upsertError } = await (supabase as any)
            .from("guardians")
            .upsert({ email: userEmail, weekly_report: true, monthly_report: false }, { onConflict: "email" });
          if (upsertError) console.warn("[auth/confirmed/guardian] upsert warn:", upsertError);
        }

        setStatus("confirmed");
        toast({ title: "Authentication confirmed", description: "Guardian email saved." });

        // Redirect all authenticated users to onboarding
        setTimeout(() => {
          router.push("/onboarding");
        }, 2500);
      } catch (err) {
        console.error("[auth/confirmed/guardian] confirmation error:", err);
        setStatus("error");
        toast({
          title: "Authentication issue",
          description: err instanceof Error ? err.message : "Unable to confirm authentication.",
          variant: "destructive",
        });
        setTimeout(() => router.push("/landing-page"), 2500);
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
            {status === "confirmed" && "Welcome! Your guardian account is ready."}
            {status === "error" && "We couldn’t confirm your session."}
          </p>
        </div>
        {email && (
          <p className="text-white/40 text-xs">Guardian: {email}</p>
        )}
        <p className="text-white/60 text-sm">
          You will be redirected shortly.
        </p>
      </div>
    </div>
  );
}
