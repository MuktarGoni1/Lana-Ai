"use client";

/**
 * components/dashboard/index.tsx
 *
 * Core principles:
 *   - Authenticated users ALWAYS see this page. No hard redirects.
 *   - Null age, missing grade, no term plans → inline banners/prompts, not errors.
 *   - Recent searches shown as fallback content while no term plan exists.
 *   - All data fetches fail silently — partial data is fine.
 *   - Loading skeleton, never a blank white flash.
 */

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import {
  BookOpen,
  ChevronRight,
  Star,
  Lock,
  CircleCheck,
  Circle,
  ArrowRight,
  LoaderIcon,
  Plus,
  Video,
  RefreshCw,
  Clock,
  X,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

type TopicStatus = "locked" | "available" | "in_progress" | "completed";

interface Profile {
  id: string;
  full_name: string | null;
  role: "parent" | "child" | null;
  age: number | null;
  grade: string | null;
  diagnostic_completed: boolean;
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
  grade: string | null;
  term: string | null;
  topics: Topic[];
}

interface QuizAttempt {
  topic_id: string;
  score: number;
  total: number;
}

interface Search {
  id: string;
  title: string;
  created_at: string;
}

interface DashboardData {
  profile: Profile | null;
  userName: string;
  termPlans: TermPlan[];
  allTopics: Topic[];
  attempts: QuizAttempt[];
  recentSearches: Search[];
  continueTopic: Topic | null;
  maxWeek: number;
}

// ─────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────

interface Props {
  onWatchVideo: (topic: string) => void;
}

export function LanaMindDashboard({ onWatchVideo }: Props) {
  const router = useRouter();

  const [loading, setLoading]           = useState(true);
  const [data, setData]                 = useState<DashboardData | null>(null);
  const [loadError, setLoadError]       = useState<string | null>(null);
  const [activeWeek, setActiveWeek]     = useState(1);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // ── FETCH ─────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient() as any;

      try {
        // 1. Auth — if no session, middleware handles redirect, but be safe
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          router.push("/login");
          return;
        }
        const userId = session.user.id;
        const emailName = session.user.email?.split("@")[0] ?? "there";

        // 2. All fetches run in parallel — each fails independently
        const [profileRes, plansRes, searchesRes] = await Promise.allSettled([

          // Profile — age, name, grade
          supabase
            .from("profiles")
            .select("id, full_name, role, age, grade, diagnostic_completed")
            .eq("id", userId)
            .maybeSingle(),

          // Term plans with topics
          supabase
            .from("term_plans")
            .select("id, subject, grade, term, topics(id, term_plan_id, subject_name, title, week_number, order_index, status)")
            .eq("user_id", userId)
            .order("created_at", { ascending: false }),

          // Recent searches as fallback content
          supabase
            .from("searches")
            .select("id, title, created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

        if (cancelled) return;

        // 3. Extract profile safely
        const profile: Profile | null =
          profileRes.status === "fulfilled" && profileRes.value.data
            ? profileRes.value.data
            : null;

        const userName =
          profile?.full_name ||
          emailName;

        // 4. Extract term plans safely
        const rawPlans =
          plansRes.status === "fulfilled" && plansRes.value.data
            ? plansRes.value.data
            : [];

        const termPlans: TermPlan[] = rawPlans.map((p: any) => ({
          ...p,
          topics: (p.topics ?? []).sort((a: Topic, b: Topic) =>
            a.week_number !== b.week_number
              ? a.week_number - b.week_number
              : a.order_index - b.order_index
          ),
        }));

        const allTopics = termPlans.flatMap((p) => p.topics);

        // 5. Quiz attempts — only if we have topics
        let attempts: QuizAttempt[] = [];
        const topicIds = allTopics.map((t) => t.id);
        if (topicIds.length > 0) {
          const { data: att } = await supabase
            .from("quiz_attempts")
            .select("topic_id, score, total")
            .eq("user_id", userId)
            .in("topic_id", topicIds)
            .order("attempted_at", { ascending: false })
            .limit(20);
          attempts = att ?? [];
        }

        // 6. Recent searches
        const recentSearches: Search[] =
          searchesRes.status === "fulfilled" && searchesRes.value.data
            ? searchesRes.value.data
            : [];

        // 7. Continue topic
        const continueTopic =
          allTopics.find((t) => t.status === "in_progress") ||
          allTopics.find((t) => t.status === "available") ||
          null;

        // 8. Active week
        const liveTopics = allTopics.filter(
          (t) => t.status === "available" || t.status === "in_progress"
        );
        const week =
          liveTopics.length > 0
            ? Math.min(...liveTopics.map((t) => t.week_number))
            : 1;
        const maxWeek =
          allTopics.length > 0
            ? Math.max(...allTopics.map((t) => t.week_number))
            : 1;

        setActiveWeek(week);
        setData({
          profile,
          userName,
          termPlans,
          allTopics,
          attempts,
          recentSearches,
          continueTopic,
          maxWeek,
        });
      } catch (err: any) {
        if (!cancelled) {
          console.error("[dashboard]", err);
          setLoadError("Couldn't load your dashboard. Check your connection.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // ── HELPERS ───────────────────────────────────────────────────────

  const bestScore = useCallback((topicId: string): number | null => {
    if (!data) return null;
    const relevant = data.attempts.filter((a) => a.topic_id === topicId);
    if (!relevant.length) return null;
    return Math.max(...relevant.map((a) => Math.round((a.score / a.total) * 100)));
  }, [data]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const scoreChip = (pct: number) => (
    <span className={cn(
      "text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0",
      pct >= 80 ? "bg-emerald-500/15 text-emerald-400"
        : pct >= 60 ? "bg-amber-500/15 text-amber-400"
        : "bg-red-500/15 text-red-400"
    )}>
      {pct}%
    </span>
  );

  const statusIcon = (status: TopicStatus) => {
    if (status === "completed")
      return <CircleCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />;
    if (status === "in_progress")
      return <Circle className="w-4 h-4 text-blue-400 flex-shrink-0 animate-pulse" />;
    if (status === "locked")
      return <Lock className="w-4 h-4 text-white/20 flex-shrink-0" />;
    return <Circle className="w-4 h-4 text-white/30 flex-shrink-0" />;
  };

  // ── LOADING SKELETON ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-md border-b border-white/8 px-5 h-14 flex items-center justify-between">
          <span className="text-white font-bold text-base">
            Lana<span className="text-white/30">Mind</span>
          </span>
          <div className="w-8 h-8 rounded-full bg-white/8 animate-pulse" />
        </header>
        <div className="max-w-xl mx-auto px-5 pt-7 space-y-5">
          <div className="space-y-2">
            <div className="h-3 w-24 bg-white/8 rounded-full animate-pulse" />
            <div className="h-7 w-40 bg-white/10 rounded-full animate-pulse" />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // ── LOAD ERROR ─────────────────────────────────────────────────────
  if (loadError) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 p-6 text-center">
        <AlertTriangle className="w-6 h-6 text-white/30" />
        <p className="text-white/50 text-sm max-w-xs">{loadError}</p>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors border border-white/10 rounded-lg px-3 py-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try again
        </button>
      </div>
    );
  }

  if (!data) return null;

  // ── DERIVED ───────────────────────────────────────────────────────
  const hasPlans    = data.termPlans.length > 0;
  const isIncomplete = !data.profile?.age || !data.profile?.grade;
  const showBanner  = isIncomplete && !bannerDismissed;

  const weekTopics = data.allTopics.filter((t) => t.week_number === activeWeek);

  // Subject progress by subject_name
  const subjectMap: Record<string, { done: number; total: number; planId?: string; next: Topic | null }> = {};
  for (const plan of data.termPlans) {
    for (const t of plan.topics) {
      if (!subjectMap[t.subject_name]) {
        subjectMap[t.subject_name] = { done: 0, total: 0, planId: plan.id, next: null };
      }
      subjectMap[t.subject_name].total++;
      if (t.status === "completed") subjectMap[t.subject_name].done++;
      if (!subjectMap[t.subject_name].next &&
          (t.status === "available" || t.status === "in_progress")) {
        subjectMap[t.subject_name].next = t;
      }
    }
  }

  // Recent unique quiz scores
  const seen = new Set<string>();
  const recentScores = data.attempts.filter((a) => {
    if (seen.has(a.topic_id)) return false;
    seen.add(a.topic_id);
    return true;
  }).slice(0, 3);

  const topicMeta: Record<string, { title: string; subject: string }> = {};
  for (const t of data.allTopics) {
    topicMeta[t.id] = { title: t.title, subject: t.subject_name };
  }

  // ─────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black text-white">

      {/* ── NAV ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-md border-b border-white/8 px-5 h-14 flex items-center justify-between">
        <span className="text-white font-bold tracking-wide text-base">
          Lana<span className="text-white/30">Mind</span>
        </span>
        <button
          onClick={() => router.push("/settings")}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center text-sm font-semibold transition-colors"
          aria-label="Settings"
        >
          {data.userName.charAt(0).toUpperCase()}
        </button>
      </header>

      <main className="max-w-xl mx-auto px-5 pb-24 pt-6 space-y-7">

        {/* ── PROFILE INCOMPLETE BANNER ─────────────────────────── */}
        <AnimatePresence>
          {showBanner && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="flex items-start gap-3 p-3.5 rounded-xl bg-white/4 border border-white/10"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/70 font-medium">
                  Complete your profile
                </p>
                <p className="text-xs text-white/35 mt-0.5">
                  Add your age and grade to personalise your lessons.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => router.push("/onboarding")}
                  className="text-xs text-white/60 hover:text-white border border-white/15 hover:border-white/30 px-2.5 py-1.5 rounded-lg transition-all"
                >
                  Set up
                </button>
                <button
                  onClick={() => setBannerDismissed(true)}
                  className="text-white/20 hover:text-white/50 transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── GREETING ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-white/35 text-sm mb-0.5">{greeting()},</p>
          <h1 className="text-2xl font-bold tracking-tight capitalize">
            {data.userName} 👋
          </h1>
          {data.profile?.grade && (
            <p className="text-white/25 text-xs mt-1">Grade {data.profile.grade}</p>
          )}
        </motion.div>

        {/* ── NO PLAN: SETUP CTA ────────────────────────────────────── */}
        {!hasPlans && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="space-y-3"
          >
            <button
              onClick={() => router.push("/term-plan")}
              className="w-full flex items-center justify-between p-5 rounded-2xl bg-white text-black hover:bg-white/90 transition-colors"
            >
              <div className="flex items-start gap-3 text-left">
                <BookOpen className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Set up your study plan</p>
                  <p className="text-sm font-normal text-black/50 mt-0.5">
                    Add your syllabus — we build your lessons
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 flex-shrink-0" />
            </button>

            {/* Recent searches as fallback content */}
            {data.recentSearches.length > 0 && (
              <div>
                <Label>Topics you've explored</Label>
                <div className="space-y-2">
                  {data.recentSearches.map((s, idx) => (
                    <motion.button
                      key={s.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      onClick={() => router.push(`/?q=${encodeURIComponent(s.title)}`)}
                      className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-white/4 border border-white/8 hover:border-white/15 hover:bg-white/7 transition-all text-left"
                    >
                      <Clock className="w-3.5 h-3.5 text-white/25 flex-shrink-0" />
                      <span className="text-sm text-white/70 flex-1 truncate">
                        {s.title}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-white/20 flex-shrink-0" />
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── CONTINUE CARD ────────────────────────────────────────── */}
        {data.continueTopic && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
          >
            <Label>Continue learning</Label>
            <button
              onClick={() => router.push(`/lesson/${data.continueTopic!.id}`)}
              className="w-full flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/7 transition-all text-left"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/35 mb-1">
                  {data.continueTopic.subject_name} · Week {data.continueTopic.week_number}
                </p>
                <p className="font-semibold text-lg leading-snug truncate">
                  {data.continueTopic.title}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0 ml-4">
                <span className="text-xs text-white/30">Resume</span>
                <ChevronRight className="w-4 h-4 text-white/25" />
              </div>
            </button>
          </motion.div>
        )}

        {/* ── THIS WEEK ─────────────────────────────────────────────── */}
        {hasPlans && weekTopics.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-3">
              <Label noMargin>Week {activeWeek}</Label>
              <div className="flex items-center gap-0.5">
                <button
                  disabled={activeWeek <= 1}
                  onClick={() => setActiveWeek((w) => w - 1)}
                  className="px-2.5 py-1 text-xs text-white/30 hover:text-white/60 disabled:opacity-20 transition-colors"
                >
                  ‹
                </button>
                <button
                  disabled={activeWeek >= data.maxWeek}
                  onClick={() => setActiveWeek((w) => w + 1)}
                  className="px-2.5 py-1 text-xs text-white/30 hover:text-white/60 disabled:opacity-20 transition-colors"
                >
                  ›
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {weekTopics.map((topic, idx) => {
                const locked = topic.status === "locked";
                const score  = bestScore(topic.id);
                return (
                  <motion.button
                    key={topic.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    disabled={locked}
                    onClick={() => !locked && router.push(`/lesson/${topic.id}`)}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all",
                      locked
                        ? "border-white/5 bg-white/2 cursor-not-allowed opacity-35"
                        : "border-white/10 bg-white/4 hover:border-white/20 hover:bg-white/7"
                    )}
                  >
                    {statusIcon(topic.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{topic.title}</p>
                      <p className="text-xs text-white/35 mt-0.5">{topic.subject_name}</p>
                    </div>
                    {score !== null && scoreChip(score)}
                    {!locked && (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); onWatchVideo(topic.title); }}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/12 transition-colors"
                          aria-label="Watch video"
                        >
                          <Video className="w-3.5 h-3.5 text-white/40" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-white/20" />
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── SUBJECTS GRID ────────────────────────────────────────── */}
        {hasPlans && Object.keys(subjectMap).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
          >
            <Label>Your subjects</Label>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(subjectMap).map(([subject, prog], idx) => {
                const pct = prog.total > 0
                  ? Math.round((prog.done / prog.total) * 100)
                  : 0;
                return (
                  <motion.button
                    key={subject}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.14 + idx * 0.05 }}
                    onClick={() =>
                      prog.planId
                        ? router.push(`/subject/${prog.planId}`)
                        : router.push("/term-plan")
                    }
                    className="flex flex-col p-4 rounded-2xl bg-white/4 border border-white/10 hover:border-white/18 hover:bg-white/6 transition-all text-left"
                  >
                    <p className="font-semibold text-sm truncate mb-0.5">{subject}</p>
                    <p className="text-xs text-white/35 mb-3">
                      {prog.done}/{prog.total} topics
                    </p>
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-white rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, delay: 0.3 + idx * 0.06 }}
                      />
                    </div>
                    {prog.next && (
                      <p className="text-xs text-white/25 mt-2 truncate">
                        Next: {prog.next.title}
                      </p>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── RECENT SCORES ────────────────────────────────────────── */}
        {recentScores.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
          >
            <Label>Recent scores</Label>
            <div className="space-y-2">
              {recentScores.map((a) => {
                const meta = topicMeta[a.topic_id];
                const pct  = Math.round((a.score / a.total) * 100);
                return (
                  <div
                    key={a.topic_id}
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-white/3 border border-white/8"
                  >
                    <Star className="w-4 h-4 text-white/15 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{meta?.title ?? "Topic"}</p>
                      <p className="text-xs text-white/30">{meta?.subject}</p>
                    </div>
                    <span className={cn(
                      "text-xs font-bold flex-shrink-0",
                      pct >= 80 ? "text-emerald-400"
                        : pct >= 60 ? "text-amber-400"
                        : "text-red-400"
                    )}>
                      {a.score}/{a.total}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── ADD SUBJECT ──────────────────────────────────────────── */}
        {hasPlans && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.22 }}
            onClick={() => router.push("/term-plan")}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-white/12 text-white/25 hover:text-white/50 hover:border-white/22 transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            Add another subject
          </motion.button>
        )}

      </main>
    </div>
  );
}

// ── LABEL ────────────────────────────────────────────────────────────

function Label({ children, noMargin }: { children: React.ReactNode; noMargin?: boolean }) {
  return (
    <p className={cn(
      "text-xs text-white/35 font-semibold uppercase tracking-widest",
      !noMargin && "mb-3"
    )}>
      {children}
    </p>
  );
}
