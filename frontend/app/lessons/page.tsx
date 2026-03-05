"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ChevronRight, Clock3, Lock, Moon, Sun } from "lucide-react";
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
  const [isLightMode, setIsLightMode] = useState(false);

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

  const theme = isLightMode
    ? {
        page: "bg-[#f5f5f2] text-[#111111]",
        subText: "text-black/60",
        panel: "border-black/10 bg-white",
        panelSoft: "border-black/10 bg-black/[0.03]",
        panelHover: "hover:bg-black/[0.05]",
        icon: "text-black/50",
        pulse: "bg-black/10",
        buttonPrimary: "bg-black text-white",
        buttonGhost: "border-black/15 bg-white text-black hover:bg-black/[0.04]",
        headingMuted: "text-black/70",
      }
    : {
        page: "bg-[#111111] text-[#f7f7f7]",
        subText: "text-white/60",
        panel: "border-white/10 bg-white/[0.03]",
        panelSoft: "border-white/10 bg-white/5",
        panelHover: "hover:bg-white/10",
        icon: "text-white/50",
        pulse: "bg-white/10",
        buttonPrimary: "bg-white text-black",
        buttonGhost: "border-white/20 bg-white/5 text-white hover:bg-white/10",
        headingMuted: "text-white/75",
      };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme.page}`}>
      <AppTopbar
        title="Lessons"
        subtitle="Your lessons, clearly organized"
        showBack
        backLabel="Dashboard"
        onBack={() => router.push("/")}
      />

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-5 sm:px-5 sm:py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold sm:text-2xl">Lessons</h1>
            <p className={`text-sm ${theme.subText}`}>{availableCount} available lesson{availableCount === 1 ? "" : "s"}.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsLightMode((prev) => !prev)}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${theme.buttonGhost}`}
            aria-label={isLightMode ? "Switch to dark mode" : "Switch to light mode"}
          >
            {isLightMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            {isLightMode ? "Dark mode" : "Light mode"}
          </button>
        </div>

        {!loading && isAuthenticated && (
          <section className={`rounded-2xl border p-4 ${theme.panel}`}>
            <div className="mb-3 flex items-center gap-2">
              <Clock3 className={`h-4 w-4 ${theme.icon}`} />
              <h2 className="text-sm font-semibold">Today&apos;s lessons {todayDay ? `(${todayDay})` : ""}</h2>
            </div>
            {todayLessons.length === 0 ? (
              <p className={`text-xs ${theme.subText}`}>No lessons scheduled for today.</p>
            ) : (
              <div className="space-y-2">
                {todayLessons.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => router.push(`/lesson/${topic.id}`)}
                    className={`flex min-h-14 w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors ${theme.panelSoft} ${theme.panelHover}`}
                  >
                    <div>
                      <p className="text-sm font-medium">{topic.title}</p>
                      <p className={`text-xs ${theme.subText}`}>{topic.subject_name || "Subject"} - Week {topic.week_number}</p>
                    </div>
                    <ChevronRight className={`h-4 w-4 ${theme.icon}`} />
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {loading && (
          <div className="space-y-2">
            <div className={`h-14 animate-pulse rounded-xl ${theme.pulse}`} />
            <div className={`h-14 animate-pulse rounded-xl ${theme.pulse}`} />
          </div>
        )}

        {!loading && !isAuthenticated && (
          <div className={`rounded-xl border p-4 ${theme.panelSoft}`}>
            <p className={`text-sm ${theme.subText}`}>Sign in to see your lessons.</p>
            <button onClick={() => router.push("/login")} className={`mt-3 rounded-md px-3 py-2 text-xs font-semibold ${theme.buttonPrimary}`}>
              Sign in
            </button>
          </div>
        )}

        {!loading && isAuthenticated && topics.length === 0 && (
          <div className={`rounded-xl border p-5 text-center ${theme.panelSoft}`}>
            <BookOpen className={`mx-auto h-8 w-8 ${theme.icon}`} />
            <p className={`mt-2 text-sm ${theme.subText}`}>No lessons yet.</p>
            <button
              onClick={() => router.push("/term-plan")}
              className={`mt-3 rounded-md px-3 py-2 text-xs font-semibold ${theme.buttonPrimary}`}
            >
              Add your subjects
            </button>
          </div>
        )}

        {!loading && topics.length > 0 && (
          <section className="space-y-2">
            <h2 className={`text-sm font-semibold ${theme.headingMuted}`}>All lessons</h2>
            {topics.map((topic) => {
              const locked = topic.status === "locked";
              return (
                <button
                  key={topic.id}
                  disabled={locked}
                  onClick={() => router.push(`/lesson/${topic.id}`)}
                  className={`flex min-h-14 w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                    locked ? `${theme.panelSoft} opacity-55` : `${theme.panelSoft} ${theme.panelHover}`
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium">{topic.title}</p>
                    <p className={`text-xs ${theme.subText}`}>{(topic.subject_name || "Subject")} - Week {topic.week_number}</p>
                  </div>
                  {locked ? <Lock className={`h-4 w-4 ${theme.icon}`} /> : <ChevronRight className={`h-4 w-4 ${theme.icon}`} />}
                </button>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
