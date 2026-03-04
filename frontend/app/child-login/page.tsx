"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail } from "lucide-react";

export default function ChildLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push("/");
    });
  }, [router]);

  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setEmailError("Email is required");
      return;
    }
    if (!validateEmail(email.trim())) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setEmailError("");
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: "https://www.lanamind.com/auth/auto-login",
        },
      });
      if (error) throw error;

      toast({
        title: "Magic link sent",
        description: "Check your email for the login link.",
      });
      router.push(`/login?magic-link-sent=true&email=${encodeURIComponent(email.trim())}`);
    } catch (error: any) {
      console.error("[Child Login] Error:", error);
      toast({
        title: "Login failed",
        description: error.message || "Failed to send magic link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/[0.02] backdrop-blur-sm rounded-2xl border border-white/[0.05] p-8 space-y-6">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-xl bg-white/[0.05] flex items-center justify-center mx-auto">
            <Mail className="w-7 h-7 text-white/70" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-white">Child Login</h1>
            <p className="text-white/40 text-sm">Use the magic link your parent shared</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs text-white/40 mb-2">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError("");
              }}
              placeholder="child@example.com"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05] text-white placeholder-white/20 text-sm focus:outline-none focus:border-white/10 focus:bg-white/[0.05] transition-all duration-200"
              required
            />
            {emailError && <p className="mt-1 text-xs text-red-400">{emailError}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 rounded-xl bg-white text-black font-medium text-sm hover:bg-white/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Sending link...</span>
              </>
            ) : (
              <span>Send Magic Link</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
