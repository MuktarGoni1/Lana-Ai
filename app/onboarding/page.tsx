"use client";

/**
 * app/onboarding/page.tsx
 *
 * Simple 2-step onboarding. Fully skippable at any point.
 * Saves to public.profiles (the real table) not user_metadata.
 *
 * Step 1: Who are you? (student / parent)
 * Step 2: A bit about you (name, age, grade) — all optional
 *
 * Skip at any step → goes straight to dashboard.
 * On completion → goes to dashboard.
 * Never blocks. Never loops.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight, GraduationCap, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Grades your target users are in
const GRADES = ["6", "7", "8", "9", "10", "11", "12"];

type Role = "child" | "parent";

interface FormState {
  role: Role | null;
  name: string;
  age: string;
  grade: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    role: null,
    name: "",
    age: "",
    grade: "",
  });

  // ── save to profiles and go to dashboard ─────────────────────────
  async function saveAndContinue() {
    setSaving(true);
    setError(null);

    try {
      const supabase = createClient() as any;
      const {
        data: { user },
        error: authErr,
      } = await supabase.auth.getUser();

      if (authErr || !user) {
        // Not logged in — just go to dashboard, they'll be redirected to login
        router.push("/");
        return;
      }

      // Build the update — only include fields that have values
      const updates: Record<string, any> = {};
      if (form.role) updates.role = form.role;
      if (form.name.trim()) updates.full_name = form.name.trim();

      const ageNum = parseInt(form.age, 10);
      if (!isNaN(ageNum) && ageNum >= 5 && ageNum <= 18) {
        updates.age = ageNum;
      }
      if (form.grade) updates.grade = form.grade;

      // Always mark diagnostic as completed when they reach this point
      updates.diagnostic_completed = true;

      // Upsert in case the profile row doesn't exist yet
      const { error: upsertErr } = await supabase
        .from("profiles")
        .upsert({ id: user.id, ...updates }, { onConflict: "id" });

      if (upsertErr) {
        // Non-fatal — log and continue to dashboard anyway
        console.error("[onboarding] profile save failed:", upsertErr.message);
        // Don't show this to the user — just continue
      }

      router.push("/");
    } catch (err: any) {
      console.error("[onboarding] unexpected error:", err);
      // Even on error, take them to the dashboard
      router.push("/");
    } finally {
      setSaving(false);
    }
  }

  // Skip entirely — go straight to dashboard, no save
  function skip() {
    router.push("/");
  }

  // ── step 1: role selection ────────────────────────────────────────
  const Step1 = (
    <motion.div
      key="step1"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-white">Welcome to LanaMind</h1>
        <p className="text-white/50 text-sm mt-1">Quick question — who's using this?</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Student */}
        <button
          onClick={() => {
            setForm((f) => ({ ...f, role: "child" }));
            setStep(2);
          }}
          className={cn(
            "flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all",
            form.role === "child"
              ? "border-white/40 bg-white/10"
              : "border-white/10 bg-white/4 hover:border-white/20 hover:bg-white/7"
          )}
        >
          <GraduationCap className="w-7 h-7 text-white/70" />
          <div className="text-center">
            <p className="text-sm font-semibold text-white">I'm a student</p>
            <p className="text-xs text-white/40 mt-0.5">Here to learn</p>
          </div>
        </button>

        {/* Parent */}
        <button
          onClick={() => {
            setForm((f) => ({ ...f, role: "parent" }));
            setStep(2);
          }}
          className={cn(
            "flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all",
            form.role === "parent"
              ? "border-white/40 bg-white/10"
              : "border-white/10 bg-white/4 hover:border-white/20 hover:bg-white/7"
          )}
        >
          <Users className="w-7 h-7 text-white/70" />
          <div className="text-center">
            <p className="text-sm font-semibold text-white">I'm a parent</p>
            <p className="text-xs text-white/40 mt-0.5">Setting up for my child</p>
          </div>
        </button>
      </div>

      <button
        onClick={skip}
        className="w-full text-center text-xs text-white/25 hover:text-white/50 transition-colors py-2"
      >
        Skip for now
      </button>
    </motion.div>
  );

  // ── step 2: optional details ──────────────────────────────────────
  const Step2 = (
    <motion.div
      key="step2"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-white">
          {form.role === "parent" ? "About your child" : "A bit about you"}
        </h1>
        <p className="text-white/50 text-sm mt-1">
          Optional — helps us tailor lessons.{" "}
          <button onClick={skip} className="text-white/40 underline hover:text-white/60">
            Skip this
          </button>
        </p>
      </div>

      <div className="space-y-3">
        {/* Name */}
        <div>
          <label className="text-xs text-white/40 mb-1.5 block">
            {form.role === "parent" ? "Child's name" : "Your name"}
          </label>
          <input
            type="text"
            placeholder="e.g. Alex"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            maxLength={60}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-white/25 transition-colors"
          />
        </div>

        {/* Age */}
        <div>
          <label className="text-xs text-white/40 mb-1.5 block">Age</label>
          <input
            type="number"
            placeholder="e.g. 14"
            value={form.age}
            min={5}
            max={18}
            onChange={(e) => {
              setError(null);
              setForm((f) => ({ ...f, age: e.target.value }));
            }}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-white/25 transition-colors"
          />
          {form.age && (parseInt(form.age) < 5 || parseInt(form.age) > 18) && (
            <p className="text-xs text-red-400/80 mt-1.5">
              Please enter an age between 5 and 18
            </p>
          )}
        </div>

        {/* Grade */}
        <div>
          <label className="text-xs text-white/40 mb-1.5 block">School grade</label>
          <div className="grid grid-cols-4 gap-2">
            {GRADES.map((g) => (
              <button
                key={g}
                onClick={() =>
                  setForm((f) => ({ ...f, grade: f.grade === g ? "" : g }))
                }
                className={cn(
                  "py-2 rounded-xl text-sm font-medium border transition-all",
                  form.grade === g
                    ? "border-white/40 bg-white/12 text-white"
                    : "border-white/10 bg-white/4 text-white/50 hover:border-white/20 hover:text-white/80"
                )}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-400/80 bg-red-500/8 border border-red-500/15 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setStep(1)}
          className="px-4 py-2.5 rounded-xl border border-white/10 text-sm text-white/40 hover:text-white/70 hover:border-white/20 transition-all"
        >
          Back
        </button>
        <button
          onClick={saveAndContinue}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 disabled:opacity-60 transition-all"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              Saving…
            </span>
          ) : (
            <>
              Go to dashboard
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      <button
        onClick={skip}
        className="w-full text-center text-xs text-white/20 hover:text-white/40 transition-colors py-1"
      >
        Skip everything and go to dashboard
      </button>
    </motion.div>
  );

  // ── render ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-5">
      {/* Close / skip button — always accessible */}
      <button
        onClick={skip}
        className="fixed top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-white/8 hover:bg-white/14 text-white/40 hover:text-white/70 transition-all"
        aria-label="Skip onboarding"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="w-full max-w-sm">
        {/* Step dots */}
        <div className="flex items-center gap-1.5 mb-8">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1 rounded-full transition-all duration-300",
                s === step ? "w-6 bg-white" : "w-3 bg-white/20"
              )}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? Step1 : Step2}
        </AnimatePresence>
      </div>
    </div>
  );
}
