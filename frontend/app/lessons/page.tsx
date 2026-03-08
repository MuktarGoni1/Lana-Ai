"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ChevronRight, Clock3, Lock } from "lucide-react";
import AppTopbar from "@/components/layout/app-topbar";
import { supabase } from "@/lib/db";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";

type TopicStatus = "locked" | "available" | "in_progress" | "completed";

type Topic = {
  id: string;
  title: string;
  week_number: number;
  order_index: number;
  subject_name: string | null;
  status: TopicStatus;
};

type TodayResponse = {
  success: boolean;
  data: {
    day: string;
    lessons: Topic[];
  };
};

export default function LessonsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, isOnboardingComplete } = useUnifiedAuth();

  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [todayDay, setTodayDay] = useState<string>("");
  const [todayLessons, setTodayLessons] = useState<Topic[]>([]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && !isOnboardingComplete()) {
      router.replace("/onboarding");
    }
  }, [authLoading, isAuthenticated, isOnboardingComplete, router]);

  useEffect(() => {
    const load = async () => {
      if (authLoading) return;
      if (!isAuthenticated || !user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const db = supabase as any;
        const { data: plans } = await db.from("term_plans").select("id").eq("user_id", user.id);
        const planIds = (plans ?? []).map((p: { id: string }) => p.id);

        const [{ data: topicRows }, todayRes] = await Promise.all([
          planIds.length > 0
            ? db
                .from("topics")
                .select("id, title, week_number, order_index, subject_name, status")
                .in("term_plan_id", planIds)
                .order("week_number", { ascending: true })
                .order("order_index", { ascending: true })
            : Promise.resolve({ data: [] }),
          fetch("/api/lessons/today", { cache: "no-store" }),
        ]);

        setTopics((topicRows ?? []) as Topic[]);

        if (todayRes.ok) {
          const payload = (await todayRes.json()) as TodayResponse;
          setTodayDay(payload?.data?.day || "");
          setTodayLessons(payload?.data?.lessons || []);
        }
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [authLoading, isAuthenticated, user?.id]);

  const availableCount = useMemo(() => topics.filter((t) => t.status !== "locked").length, [topics]);

  return (
    <div className="min-h-screen bg-black text-white">
      <AppTopbar
        title="Lessons"
        subtitle="Your lessons, clearly organized"
        showBack
        backLabel="Dashboard"
        onBack={() => router.push("/dashboard")}
      />

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-5 sm:px-5 sm:py-6">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">Lessons</h1>
          <p className="text-sm text-white/60">{availableCount} available lesson{availableCount === 1 ? "" : "s"}.</p>
        </div>

        {!loading && isAuthenticated && (
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-white/70" />
              <h2 className="text-sm font-semibold">Today&apos;s lessons {todayDay ? `(${todayDay})` : ""}</h2>
            </div>
            {todayLessons.length === 0 ? (
              <p className="text-xs text-white/60">No lessons scheduled for today.</p>
            ) : (
              <div className="space-y-2">
                {todayLessons.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => router.push(`/lesson/${topic.id}/learn`)}
                    className="flex min-h-14 w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left hover:bg-white/10"
                  >
                    <div>
                      <p className="text-sm font-medium">{topic.title}</p>
                      <p className="text-xs text-white/50">{topic.subject_name || "Subject"} - Week {topic.week_number}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-white/40" />
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {loading && (
          <div className="space-y-2">
            <div className="h-14 animate-pulse rounded-xl bg-white/5" />
            <div className="h-14 animate-pulse rounded-xl bg-white/5" />
          </div>
        )}

        {!loading && !isAuthenticated && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-white/80">Sign in to see your lessons.</p>
            <button onClick={() => router.push("/login")} className="mt-3 rounded-md bg-white px-3 py-2 text-xs font-semibold text-black">
              Sign in
            </button>
          </div>
        )}

        {!loading && isAuthenticated && topics.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-white/40" />
            <p className="mt-2 text-sm text-white/80">No lessons yet.</p>
            <button
              onClick={() => router.push("/term-plan")}
              className="mt-3 rounded-md bg-white px-3 py-2 text-xs font-semibold text-black"
            >
              Add your subjects
            </button>
          </div>
        )}

        {!loading && topics.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-white/75">All lessons</h2>
            {topics.map((topic) => {
              const locked = topic.status === "locked";
              return (
                <button
                  key={topic.id}
                  disabled={locked}
                  onClick={() => router.push(`/lesson/${topic.id}/learn`)}
                  className={`flex min-h-14 w-full items-center justify-between rounded-xl border px-4 py-3 text-left ${
                    locked ? "border-white/5 bg-white/5 opacity-50" : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium">{topic.title}</p>
                    <p className="text-xs text-white/50">{(topic.subject_name || "Subject")} - Week {topic.week_number}</p>
                  </div>
                  {locked ? <Lock className="h-4 w-4 text-white/40" /> : <ChevronRight className="h-4 w-4 text-white/40" />}
                </button>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
