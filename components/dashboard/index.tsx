"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/db";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import Logo from "@/components/logo";
import {
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  Clock,
  Lock,
  RefreshCw,
  Star,
  Video,
} from "lucide-react";

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
  subject_name: string | null;
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

interface QuizAttempt {
  topic_id: string;
  score: number;
  total: number;
}

interface Props {
  onWatchVideo: (topic: string) => void;
}

const REQUIRED_PROFILE_FIELDS: Array<keyof Pick<Profile, "role" | "age" | "grade">> = [
  "role",
  "age",
  "grade",
];

const DASHBOARD_CACHE_KEY = "lana_dashboard_cache";

function missingFieldLabels(profile: Profile | null) {
  return REQUIRED_PROFILE_FIELDS.filter((k) => !profile?.[k]).map((k) => {
    if (k === "age") return "age";
    if (k === "grade") return "grade";
    return "role";
  });
}

function readDashboardCache() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DASHBOARD_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as {
      profile: Profile | null;
      termPlans: TermPlan[];
      recentSearches: SearchRow[];
      recentAttempts: QuizAttempt[];
      cachedAt: string;
    };
  } catch {
    return null;
  }
}

function writeDashboardCache(payload: {
  profile: Profile | null;
  termPlans: TermPlan[];
  recentSearches: SearchRow[];
  recentAttempts: QuizAttempt[];
}) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      DASHBOARD_CACHE_KEY,
      JSON.stringify({ ...payload, cachedAt: new Date().toISOString() })
    );
  } catch {
    // Ignore cache write errors.
  }
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
  const [recentAttempts, setRecentAttempts] = useState<QuizAttempt[]>([]);
  const [currentWeek, setCurrentWeek] = useState(1);

  const load = useCallback(async (userId: string) => {
    setLoading(true);
    setLoadError(null);

    const cached = readDashboardCache();

    try {
      const db = supabase as any;

      const [profileRes, plansRes, searchesRes] = await Promise.allSettled([
        db.from("profiles").select("id, full_name, role, age, grade").eq("id", userId).maybeSingle(),
        db.from("term_plans").select("id, subject").eq("user_id", userId).order("created_at", { ascending: false }),
        db.from("searches").select("id, title, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
      ]);

      let safeProfile: Profile | null = null;
      if (profileRes.status === "fulfilled" && !profileRes.value.error) {
        safeProfile = profileRes.value.data ?? null;
      } else if (cached?.profile) {
        safeProfile = cached.profile;
      }

      let rawPlans: Array<{ id: string; subject: string }> = [];
      if (plansRes.status === "fulfilled" && !plansRes.value.error && plansRes.value.data) {
        rawPlans = plansRes.value.data;
      } else if (cached?.termPlans?.length) {
        rawPlans = cached.termPlans.map((plan) => ({ id: plan.id, subject: plan.subject }));
      }

      let safeSearches: SearchRow[] = [];
      if (searchesRes.status === "fulfilled" && !searchesRes.value.error && searchesRes.value.data) {
        safeSearches = searchesRes.value.data;
      } else if (cached?.recentSearches) {
        safeSearches = cached.recentSearches;
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
        } else if (cached?.termPlans?.length) {
          allTopics = cached.termPlans.flatMap((plan) => plan.topics);
        }
      }

      const groupedPlans: TermPlan[] = rawPlans.map((plan) => ({
        id: plan.id,
        subject: plan.subject,
        topics: allTopics.filter((t) => t.term_plan_id === plan.id),
      }));

      let safeAttempts: QuizAttempt[] = [];
      if (groupedPlans.length > 0) {
        const topicIds = groupedPlans.flatMap((plan) => plan.topics.map((t) => t.id));
        if (topicIds.length > 0) {
          const { data: attemptsData, error: attemptsError } = await db
            .from("quiz_attempts")
            .select("topic_id, score, total")
            .eq("user_id", userId)
            .in("topic_id", topicIds)
            .order("attempted_at", { ascending: false })
            .limit(10);

          if (!attemptsError && attemptsData) {
            safeAttempts = attemptsData;
          } else if (cached?.recentAttempts) {
            safeAttempts = cached.recentAttempts;
          }
        }
      }

      setProfile(safeProfile);
      setTermPlans(groupedPlans);
      setRecentSearches(safeSearches);
      setRecentAttempts(safeAttempts);

      writeDashboardCache({
        profile: safeProfile,
        termPlans: groupedPlans,
        recentSearches: safeSearches,
        recentAttempts: safeAttempts,
      });

      const liveWeeks = groupedPlans
        .flatMap((plan) => plan.topics)
        .filter((topic) => topic.status === "available" || topic.status === "in_progress")
        .map((topic) => topic.week_number);
      const nextWeek = liveWeeks.length > 0 ? Math.min(...liveWeeks) : 1;
      setCurrentWeek(nextWeek);
    } catch (error) {
      console.error("[dashboard] load failed", error);
      if (cached) {
        setProfile(cached.profile ?? null);
        setTermPlans(cached.termPlans ?? []);
        setRecentSearches(cached.recentSearches ?? []);
        setRecentAttempts(cached.recentAttempts ?? []);
      } else {
        setLoadError("Could not load your dashboard. Please try again.");
      }
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
      setRecentAttempts([]);
      return;
    }

    void load(user.id);
  }, [authLoading, isAuthenticated, load, user?.id]);

  const missingFields = useMemo(() => missingFieldLabels(profile), [profile]);
  const showSetupBanner = isAuthenticated && missingFields.length > 0 && !bannerDismissed;

  const hasPlans = termPlans.length > 0;

  const continueTopic = useMemo(() => {
    const topics = termPlans.flatMap((p) => p.topics);
    return (
      topics.find((t) => t.status === "in_progress") ??
      topics.find((t) => t.status === "available") ??
      null
    );
  }, [termPlans]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const bestScore = useCallback(
    (topicId: string) => {
      const attempts = recentAttempts.filter((attempt) => attempt.topic_id === topicId);
      if (!attempts.length) return null;
      const best = Math.max(...attempts.map((attempt) => Math.round((attempt.score / attempt.total) * 100)));
      return Number.isFinite(best) ? best : null;
    },
    [recentAttempts]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="mx-auto max-w-4xl space-y-4 animate-pulse">
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

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="sticky top-0 z-30 border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Logo />
          {isAuthenticated ? (
            <button
              onClick={() => router.push("/settings")}
              className="h-9 w-9 rounded-full bg-white/10 text-sm font-semibold text-white"
              aria-label="Open settings"
            >
              {(profile?.full_name?.[0] ?? user?.email?.[0] ?? "U").toUpperCase()}
            </button>
          ) : (
            <button
              onClick={() => router.push("/login")}
              className="rounded-full border border-white/20 px-4 py-2 text-xs"
            >
              Sign in
            </button>
          )}
        </div>
      </div>

      <main className="mx-auto max-w-5xl space-y-8 px-5 pb-16 pt-6">
        <section className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-white/40">{greeting}</p>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold">
              {profile?.full_name || user?.email?.split("@")[0] || "Welcome back"}
            </h1>
            <p className="text-sm text-white/50">Your learning dashboard is ready.</p>
          </div>
        </section>

        {showSetupBanner && (
          <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-amber-100">Complete your profile</p>
              <p className="text-xs text-amber-100/80">
                Missing required fields: {missingFields.join(", ")}. You can skip for now.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push("/onboarding")}
                className="rounded-md bg-amber-100 px-3 py-2 text-xs font-medium text-black"
              >
                Set up
              </button>
              <button
                onClick={() => setBannerDismissed(true)}
                className="rounded-md border border-amber-100/40 px-3 py-2 text-xs text-amber-100"
              >
                Dismiss
              </button>
            </div>
          </section>
        )}

        {!isAuthenticated && (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-medium">You are not signed in.</p>
            <p className="mt-1 text-xs text-white/60">
              Sign in to save your plan and continue lessons on any device.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => router.push("/login")}
                className="rounded-md bg-white px-3 py-2 text-xs font-semibold text-black"
              >
                Sign in
              </button>
              <button
                onClick={() => router.push("/register")}
                className="rounded-md border border-white/20 px-3 py-2 text-xs"
              >
                Create account
              </button>
            </div>
          </section>
        )}

        {!hasPlans && (
          <section className="space-y-4">
            <button
              onClick={() => router.push("/term-plan")}
              className="flex w-full items-center justify-between rounded-2xl bg-white px-5 py-4 text-left text-black"
            >
              <div>
                <p className="text-sm font-semibold">Set up your study plan</p>
                <p className="text-xs text-black/60">Create your term plan and unlock lessons.</p>
              </div>
              <ArrowRight className="h-5 w-5" />
            </button>

            {recentSearches.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-widest text-white/40">
                  Topics you have explored
                </p>
                {recentSearches.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => router.push(`/?q=${encodeURIComponent(item.title)}`)}
                    className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left"
                  >
                    <span className="inline-flex items-center gap-2 text-sm text-white/80">
                      <Clock className="h-4 w-4 text-white/40" />
                      {item.title}
                    </span>
                    <ArrowRight className="h-4 w-4 text-white/30" />
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {continueTopic && (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-widest text-white/40">Continue learning</p>
            <p className="mt-2 text-lg font-semibold">{continueTopic.title}</p>
            <p className="text-xs text-white/60">
              {(continueTopic.subject_name || "Subject")} - Week {continueTopic.week_number}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => router.push(`/lesson/${continueTopic.id}`)}
                className="rounded-md bg-white px-3 py-2 text-xs font-semibold text-black"
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

        {hasPlans && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-widest text-white/40">Week {currentWeek}</p>
              <div className="flex gap-2 text-xs text-white/50">
                <button
                  onClick={() => setCurrentWeek((week) => Math.max(1, week - 1))}
                  className="rounded-md border border-white/10 px-2 py-1"
                >
                  Prev
                </button>
                <button
                  onClick={() => setCurrentWeek((week) => week + 1)}
                  className="rounded-md border border-white/10 px-2 py-1"
                >
                  Next
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {termPlans
                .flatMap((plan) =>
                  plan.topics
                    .filter((topic) => topic.week_number === currentWeek)
                    .map((topic) => ({ ...topic, subject: plan.subject }))
                )
                .map((topic) => {
                  const locked = topic.status === "locked";
                  const score = bestScore(topic.id);
                  return (
                    <button
                      key={topic.id}
                      onClick={() => (!locked ? router.push(`/lesson/${topic.id}`) : null)}
                      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                        locked
                          ? "border-white/5 bg-white/2 opacity-50"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                      disabled={locked}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {locked ? (
                          <Lock className="h-4 w-4 text-white/30" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-white/40" />
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{topic.title}</p>
                          <p className="text-xs text-white/50">{topic.subject}</p>
                        </div>
                      </div>
                      {score !== null && (
                        <span className="rounded-full bg-white/10 px-2 py-1 text-xs font-semibold">
                          {score}%
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          </section>
        )}

        {hasPlans && (
          <section className="space-y-3">
            <p className="text-xs uppercase tracking-widest text-white/40">Your subjects</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {termPlans.map((plan) => {
                const completed = plan.topics.filter((t) => t.status === "completed").length;
                const total = plan.topics.length || 1;
                const percent = Math.round((completed / total) * 100);
                const nextTopic = plan.topics.find(
                  (topic) => topic.status === "available" || topic.status === "in_progress"
                );
                return (
                  <button
                    key={plan.id}
                    onClick={() => router.push(`/subject/${plan.id}`)}
                    className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-left"
                  >
                    <p className="text-sm font-semibold">{plan.subject}</p>
                    <p className="text-xs text-white/50">
                      {completed} of {plan.topics.length} topics
                    </p>
                    <div className="h-1 w-full rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-white" style={{ width: `${percent}%` }} />
                    </div>
                    {nextTopic && (
                      <p className="text-xs text-white/40">Next: {nextTopic.title}</p>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {recentAttempts.length > 0 && (
          <section className="space-y-3">
            <p className="text-xs uppercase tracking-widest text-white/40">Recent scores</p>
            <div className="space-y-2">
              {recentAttempts.slice(0, 3).map((attempt) => (
                <div
                  key={`${attempt.topic_id}-${attempt.score}-${attempt.total}`}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <Star className="h-4 w-4 text-white/40" />
                  <div className="min-w-0">
                    <p className="truncate text-sm">Topic score</p>
                    <p className="text-xs text-white/40">{Math.round((attempt.score / attempt.total) * 100)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {hasPlans && (
          <button
            onClick={() => router.push("/term-plan")}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 px-4 py-3 text-xs text-white/60"
          >
            Add another subject
          </button>
        )}
      </main>
    </div>
  );
}
