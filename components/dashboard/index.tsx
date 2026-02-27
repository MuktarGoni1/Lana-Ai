"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/db";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { AlertTriangle, ArrowRight, Clock, RefreshCw, Video } from "lucide-react";

type TopicStatus = "locked" | "available" | "in_progress" | "completed";

interface Profile {
  id: string;
  full_name: string | null;
  role: "parent" | "child" | null;
  age: number | null;
  grade: string | null;
}

interface Topic {
  id: string;
  term_plan_id: string | null;
  subject_name: string;
  title: string;
  week_number: number;
  order_index: number;
  status: TopicStatus;
}

interface TermPlan {
  id: string;
  subject: string;
  topics: Topic[];
}

interface SearchRow {
  id: string;
  title: string;
  created_at: string | null;
}

interface Props {
  onWatchVideo: (topic: string) => void;
}

const REQUIRED_PROFILE_FIELDS: Array<keyof Pick<Profile, "role" | "age" | "grade">> = [
  "role",
  "age",
  "grade",
];

function missingFieldLabels(profile: Profile | null) {
  return REQUIRED_PROFILE_FIELDS.filter((k) => !profile?.[k]).map((k) => {
    if (k === "age") return "age";
    if (k === "grade") return "grade";
    return "role";
  });
}

export function LanaMindDashboard({ onWatchVideo }: Props) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useUnifiedAuth();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [termPlans, setTermPlans] = useState<TermPlan[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchRow[]>([]);

  const load = useCallback(async (userId: string) => {
    setLoading(true);
    setLoadError(null);

    try {
      const db = supabase as any;

      const [profileRes, plansRes, searchesRes] = await Promise.allSettled([
          db
            .from("profiles")
          .select("id, full_name, role, age, grade")
          .eq("id", userId)
          .maybeSingle(),
          db
            .from("term_plans")
          .select("id, subject")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
          db
            .from("searches")
          .select("id, title, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      let safeProfile: Profile | null = null;
      if (profileRes.status === "fulfilled" && !profileRes.value.error) {
        safeProfile = profileRes.value.data ?? null;
      }

      let rawPlans: Array<{ id: string; subject: string }> = [];
      if (plansRes.status === "fulfilled" && !plansRes.value.error && plansRes.value.data) {
        rawPlans = plansRes.value.data;
      }

      let safeSearches: SearchRow[] = [];
      if (searchesRes.status === "fulfilled" && !searchesRes.value.error && searchesRes.value.data) {
        safeSearches = searchesRes.value.data;
      }

      let allTopics: Topic[] = [];
      if (rawPlans.length > 0) {
        const planIds = rawPlans.map((p) => p.id);
        const { data: topicsData, error: topicsError } = await db
          .from("topics")
          .select("id, term_plan_id, subject_name, title, week_number, order_index, status")
          .in("term_plan_id", planIds)
          .order("week_number", { ascending: true })
          .order("order_index", { ascending: true });

        if (!topicsError && topicsData) {
          allTopics = topicsData;
        }
      }

      const groupedPlans: TermPlan[] = rawPlans.map((plan) => ({
        id: plan.id,
        subject: plan.subject,
        topics: allTopics.filter((t) => t.term_plan_id === plan.id),
      }));

      setProfile(safeProfile);
      setTermPlans(groupedPlans);
      setRecentSearches(safeSearches);
    } catch (error) {
      console.error("[dashboard] load failed", error);
      setLoadError("Could not load your dashboard. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!isAuthenticated || !user?.id) {
      setLoading(false);
      setProfile(null);
      setTermPlans([]);
      setRecentSearches([]);
      return;
    }

    void load(user.id);
  }, [authLoading, isAuthenticated, load, user?.id]);

  const missingFields = useMemo(() => missingFieldLabels(profile), [profile]);
  const showSetupBanner = isAuthenticated && missingFields.length > 0 && !bannerDismissed;

  const continueTopic = useMemo(() => {
    const topics = termPlans.flatMap((p) => p.topics);
    return (
      topics.find((t) => t.status === "in_progress") ??
      topics.find((t) => t.status === "available") ??
      null
    );
  }, [termPlans]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="mx-auto max-w-3xl space-y-4 animate-pulse">
          <div className="h-8 w-56 rounded bg-white/10" />
          <div className="h-20 rounded-xl bg-white/5" />
          <div className="h-20 rounded-xl bg-white/5" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-black text-white grid place-items-center p-6">
        <div className="max-w-sm text-center space-y-3">
          <AlertTriangle className="mx-auto h-6 w-6 text-white/50" />
          <p className="text-white/70 text-sm">{loadError}</p>
          <button
            onClick={() => {
              if (user?.id) {
                void load(user.id);
              }
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-xs hover:bg-white/10"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white grid place-items-center p-6">
        <div className="max-w-sm text-center space-y-3">
          <p className="text-white/80 text-sm">You are not signed in.</p>
          <button
            onClick={() => router.push("/login")}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black"
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  const hasPlans = termPlans.length > 0;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <main className="mx-auto max-w-3xl space-y-6">
        {showSetupBanner && (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-amber-300/30 bg-amber-300/10 p-3">
            <div>
              <p className="text-sm font-semibold text-amber-100">Complete your profile</p>
              <p className="text-xs text-amber-100/80">
                Missing required fields: {missingFields.join(", ")}.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push("/onboarding")}
                className="rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-black"
              >
                Set up
              </button>
              <button
                onClick={() => setBannerDismissed(true)}
                className="rounded-md border border-amber-100/40 px-2 py-1 text-xs text-amber-100"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {!hasPlans && (
          <section className="space-y-3">
            <button
              onClick={() => router.push("/term-plan")}
              className="w-full rounded-xl bg-white px-4 py-4 text-left text-black"
            >
              <p className="text-sm font-semibold">Set up your study plan</p>
              <p className="text-xs text-black/60">Create your term plan and unlock lessons.</p>
            </button>

            {recentSearches.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-white/50">Topics you've explored</p>
                {recentSearches.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => router.push(`/?q=${encodeURIComponent(item.title)}`)}
                    className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-left"
                  >
                    <span className="inline-flex items-center gap-2 text-sm text-white/80">
                      <Clock className="h-3.5 w-3.5 text-white/50" />
                      {item.title}
                    </span>
                    <ArrowRight className="h-4 w-4 text-white/40" />
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {continueTopic && (
          <section className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/50">Continue learning</p>
            <p className="mt-1 text-sm font-medium">{continueTopic.title}</p>
            <p className="text-xs text-white/60">
              {continueTopic.subject_name} - Week {continueTopic.week_number}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => router.push(`/lesson/${continueTopic.id}`)}
                className="rounded-md bg-white px-3 py-2 text-xs font-medium text-black"
              >
                Open lesson
              </button>
              <button
                onClick={() => onWatchVideo(continueTopic.title)}
                className="inline-flex items-center gap-1 rounded-md border border-white/20 px-3 py-2 text-xs"
              >
                <Video className="h-3.5 w-3.5" />
                Watch video
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
