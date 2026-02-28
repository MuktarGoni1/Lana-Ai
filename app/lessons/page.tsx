"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ChevronRight, Lock } from "lucide-react";
import Logo from "@/components/logo";
import { supabase } from "@/lib/db";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";

type TopicStatus = "locked" | "available" | "in_progress" | "completed";

interface Topic {
  id: string;
  title: string;
  week_number: number;
  order_index: number;
  subject_name: string | null;
  status: TopicStatus;
}

export default function LessonsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useUnifiedAuth();
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState<Topic[]>([]);

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
        const { data: plans } = await db
          .from("term_plans")
          .select("id")
          .eq("user_id", user.id);

        const planIds = (plans ?? []).map((p: { id: string }) => p.id);
        if (planIds.length === 0) {
          setTopics([]);
          return;
        }

        const { data: topicRows } = await db
          .from("topics")
          .select("id, title, week_number, order_index, subject_name, status")
          .in("term_plan_id", planIds)
          .order("week_number", { ascending: true })
          .order("order_index", { ascending: true });

        setTopics((topicRows ?? []) as Topic[]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [authLoading, isAuthenticated, user?.id]);

  const availableCount = useMemo(
    () => topics.filter((t) => t.status !== "locked").length,
    [topics]
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
          <Logo width={118} height={34} className="w-[96px] sm:w-[118px] h-auto" />
          <button
            onClick={() => router.push("/")}
            className="rounded-md border border-white/20 px-3 py-2 text-xs"
          >
            Back to dashboard
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-4 px-5 py-6">
        <div>
          <h1 className="text-2xl font-semibold">Lessons</h1>
          <p className="text-sm text-white/60">
            {availableCount} available lesson{availableCount === 1 ? "" : "s"}.
          </p>
        </div>

        {loading && (
          <div className="space-y-2">
            <div className="h-14 rounded-xl bg-white/5 animate-pulse" />
            <div className="h-14 rounded-xl bg-white/5 animate-pulse" />
          </div>
        )}

        {!loading && !isAuthenticated && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-white/80">Sign in to see your lessons.</p>
            <button
              onClick={() => router.push("/login")}
              className="mt-3 rounded-md bg-white px-3 py-2 text-xs font-semibold text-black"
            >
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
              Set up your study plan
            </button>
          </div>
        )}

        {!loading && topics.length > 0 && (
          <div className="space-y-2">
            {topics.map((topic) => {
              const locked = topic.status === "locked";
              return (
                <button
                  key={topic.id}
                  disabled={locked}
                  onClick={() => router.push(`/lesson/${topic.id}`)}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left ${
                    locked
                      ? "border-white/5 bg-white/5 opacity-50"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium">{topic.title}</p>
                    <p className="text-xs text-white/50">
                      {(topic.subject_name || "Subject")} - Week {topic.week_number}
                    </p>
                  </div>
                  {locked ? (
                    <Lock className="h-4 w-4 text-white/40" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-white/40" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
