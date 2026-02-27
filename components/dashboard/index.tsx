"use client";

/**
 * components/dashboard/index.tsx — LanaMind Student Dashboard
 *
 * Notes:
 * - Uses real Supabase schema: profiles, term_plans, topics, quiz_attempts, searches.
 * - No hard redirect on missing age/grade; show banner instead.
 * - Recent searches shown when no term plan exists yet.
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
  AlertTriangle,
  LoaderIcon,
  Plus,
  Video,
  RefreshCw,
  Clock,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────
// TYPES — mirror the real schema exactly
// ─────────────────────────────────────────────────────────────────

type TopicStatus = "locked" | "available" | "in_progress" | "completed";

/** mirrors public.topics */
interface Topic {
  id: string;
  term_plan_id: string | null;
  user_id: string;
  subject_name: string;
  title: string;
  week_number: number;
  order_index: number;
  status: TopicStatus;
}

/** mirrors public.term_plans */
interface TermPlan {
  id: string;
  user_id: string;
  subject: string;
  grade: string | null;
  term: string | null;
  topics: Topic[];
}

/** mirrors public.quiz_attempts */
interface QuizAttempt {
  topic_id: string;
  score: number;
  total: number;
}

/** mirrors public.profiles */
interface Profile {
  id: string;
  full_name: string | null;
  role: "parent" | "child" | null;
  parent_id: string | null;
  age: number | null;
  grade: string | null;
  diagnostic_completed: boolean;
}

interface Search {
  id: string;
  title: string;
  created_at: string | null;
}

interface DashboardState {
  profile: Profile;
  userName: string;
  termPlans: TermPlan[];
  allTopics: Topic[];
  attempts: QuizAttempt[];
  recentSearches: Search[];
  continueTopic: Topic | null;
  activeWeek: number;
  maxWeek: number;
}

// ─────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────

interface LanaMindDashboardProps {
  onWatchVideo: (topic: string) => void;
}

export function LanaMindDashboard({ onWatchVideo }: LanaMindDashboardProps) {
  const router = useRouter();
  const supabase = createClient();
  const db = supabase as any;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardState | null>(null);
  const [activeWeek, setActiveWeek] = useState(1);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // ── LOAD ─────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);

        // 1. Auth session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          router.push("/login");
          return;
        }
        const userId = session.user.id;

        // 2. Profile
        const { data: profile, error: profileErr } = await db
          .from("profiles")
          .select("id, full_name, role, parent_id, age, grade, diagnostic_completed")
          .eq("id", userId)
          .single();

        if (profileErr || !profile) {
          router.push("/child-info");
          return;
        }

        const userName =
          profile.full_name ||
          session.user.email?.split("@")[0] ||
          "there";

        // 3. Term plans
        const { data: plans } = await db
          .from("term_plans")
          .select("id, user_id, subject, grade, term")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        const rawPlans = plans ?? [];

        // 4. Topics
        const { data: rawTopics } = await db
          .from("topics")
          .select("id, term_plan_id, user_id, subject_name, title, week_number, order_index, status")
          .eq("user_id", userId)
          .order("week_number", { ascending: true })
          .order("order_index", { ascending: true });

        const allTopics: Topic[] = rawTopics ?? [];

        // 5. Attach topics to plans
        const termPlans: TermPlan[] = rawPlans.map((p: any) => ({
          ...p,
          topics: allTopics.filter((t) => t.term_plan_id === p.id),
        }));

        // 6. Quiz attempts
        const topicIds = allTopics.map((t) => t.id);
        let attempts: QuizAttempt[] = [];
        if (topicIds.length > 0) {
          const { data: att } = await db
            .from("quiz_attempts")
            .select("topic_id, score, total")
            .eq("user_id", userId)
            .in("topic_id", topicIds)
            .order("attempted_at", { ascending: false })
            .limit(30);
          attempts = att ?? [];
        }

        // 7. Recent searches
        const { data: recentSearches } = await db
          .from("searches")
          .select("id, title, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(5);

        // 8. Continue topic
        const continueTopic =
          allTopics.find((t) => t.status === "in_progress") ||
          allTopics.find((t) => t.status === "available") ||
          null;

        // 9. Active week — lowest week with non-locked topics
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

        if (cancelled) return;

        setActiveWeek(week);
        setData({
          profile,
          userName,
          termPlans,
          allTopics,
          attempts,
          recentSearches: recentSearches ?? [],
          continueTopic,
          activeWeek: week,
          maxWeek,
        });
      } catch (err: any) {
        if (!cancelled) {
          console.error("[dashboard]", err);
          setError("Something went wrong loading your dashboard.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  // ── HELPERS ───────────────────────────────────────────────────────

  const bestScore = useCallback(
    (topicId: string): number | null => {
      if (!data) return null;
      const relevant = data.attempts.filter((a) => a.topic_id === topicId);
      if (!relevant.length) return null;
      return Math.max(
        ...relevant.map((a) => Math.round((a.score / a.total) * 100))
      );
    },
    [data]
  );

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const statusIcon = (status: TopicStatus) => {
    switch (status) {
      case "completed":
        return <CircleCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />;
      case "in_progress":
        return <Circle className="w-4 h-4 text-blue-400 flex-shrink-0 animate-pulse" />;
      case "locked":
        return <Lock className="w-4 h-4 text-white/20 flex-shrink-0" />;
      default:
        return <Circle className="w-4 h-4 text-white/30 flex-shrink-0" />;
    }
  };

  const scoreColor = (pct: number) =>
    pct >= 80
      ? "bg-emerald-500/15 text-emerald-400"
      : pct >= 60
      ? "bg-amber-500/15 text-amber-400"
      : "bg-red-500/15 text-red-400";

  // ── LOADING ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        >
          <LoaderIcon className="w-7 h-7 text-white/25" />
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 p-6">
        <AlertTriangle className="w-6 h-6 text-white/30" />
        <p className="text-white/50 text-sm text-center">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>
    );
  }

  if (!data) return null;

  // ── DERIVED DATA ──────────────────────────────────────────────────

  const hasPlans = data.termPlans.length > 0;
  const isProfileIncomplete = !data.profile.age || !data.profile.grade;
  const showBanner = isProfileIncomplete && !bannerDismissed;

  // Topics for the active week
  const weekTopics = data.allTopics.filter(
    (t) => t.week_number === activeWeek
  );

  // Subject progress — group topics by subject_name
  const subjectMap: Record<string, { done: number; total: number; next: Topic | null }> = {};
  for (const t of data.allTopics) {
    if (!subjectMap[t.subject_name]) {
      subjectMap[t.subject_name] = { done: 0, total: 0, next: null };
    }
    subjectMap[t.subject_name].total++;
    if (t.status === "completed") subjectMap[t.subject_name].done++;
    if (!subjectMap[t.subject_name].next &&
        (t.status === "available" || t.status === "in_progress")) {
      subjectMap[t.subject_name].next = t;
    }
  }

  // Recent scores (best per topic, max 3)
  const seenTopics = new Set<string>();
  const recentScores = data.attempts
    .filter((a) => {
      if (seenTopics.has(a.topic_id)) return false;
      seenTopics.add(a.topic_id);
      return true;
    })
    .slice(0, 3);

  // Topic meta lookup
  const topicMeta: Record<string, { title: string; subject: string }> = {};
  for (const t of data.allTopics) {
    topicMeta[t.id] = { title: t.title, subject: t.subject_name };
  }

  // ─────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black text-white">

      {/* ── NAV ───────────────────────────────────────────────────── */}
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

      {/* ── MAIN ──────────────────────────────────────────────────── */}
      <main className="max-w-xl mx-auto px-5 pb-24 pt-7 space-y-8">

        {/* PROFILE INCOMPLETE BANNER */}
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
                  Add your age and grade to personalize your lessons.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => router.push("/child-info")}
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

        {/* GREETING */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <p className="text-white/35 text-sm mb-0.5">{greeting()},</p>
          <h1 className="text-2xl font-bold tracking-tight capitalize">
            {data.userName} 👋
          </h1>
          {data.profile.grade && (
            <p className="text-white/25 text-xs mt-1">
              Grade {data.profile.grade}
            </p>
          )}
        </motion.div>

        {/* SETUP CTA — no plans yet */}
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
                  <p className="text-sm font-normal text-black/55 mt-0.5">
                    Add your school syllabus — we build your lessons
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 flex-shrink-0" />
            </button>

            {data.recentSearches.length > 0 && (
              <div>
                <Label>Recent topics you explored</Label>
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

        {/* CONTINUE CARD */}
        {data.continueTopic && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
          >
            <Label>Continue learning</Label>
            <motion.button
              whileTap={{ scale: 0.985 }}
              onClick={() =>
                router.push(`/lesson/${data.continueTopic!.id}`)
              }
              className="w-full flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/7 transition-all text-left"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/35 mb-1">
                  {data.continueTopic.subject_name} · Week{" "}
                  {data.continueTopic.week_number}
                </p>
                <p className="font-semibold text-lg leading-snug truncate">
                  {data.continueTopic.title}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0 ml-4">
                <span className="text-xs text-white/30">Resume</span>
                <ChevronRight className="w-4 h-4 text-white/25" />
              </div>
            </motion.button>
          </motion.div>
        )}

        {/* THIS WEEK */}
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
                const score = bestScore(topic.id);
                return (
                  <motion.button
                    key={topic.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    whileTap={locked ? {} : { scale: 0.985 }}
                    disabled={locked}
                    onClick={() =>
                      !locked && router.push(`/lesson/${topic.id}`)
                    }
                    className={cn(
                      "w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all",
                      locked
                        ? "border-white/5 bg-white/2 cursor-not-allowed opacity-35"
                        : "border-white/10 bg-white/4 hover:border-white/20 hover:bg-white/7"
                    )}
                  >
                    {statusIcon(topic.status)}

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {topic.title}
                      </p>
                      <p className="text-xs text-white/35 mt-0.5">
                        {topic.subject_name}
                      </p>
                    </div>

                    {score !== null && (
                      <span className={cn(
                        "text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0",
                        scoreColor(score)
                      )}>
                        {score}%
                      </span>
                    )}

                    {!locked && (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onWatchVideo(topic.title);
                          }}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/12 transition-colors"
                          aria-label="Watch video lesson"
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

        {/* SUBJECTS GRID — built from subject_name on topics */}
        {hasPlans && Object.keys(subjectMap).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
          >
            <Label>Your subjects</Label>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(subjectMap).map(([subject, prog], idx) => {
                const pct =
                  prog.total > 0
                    ? Math.round((prog.done / prog.total) * 100)
                    : 0;
                const plan = data.termPlans.find(
                  (p) => p.subject === subject
                );
                return (
                  <motion.button
                    key={subject}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.14 + idx * 0.055 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() =>
                      plan
                        ? router.push(`/subject/${plan.id}`)
                        : router.push("/term-plan")
                    }
                    className="flex flex-col p-4 rounded-2xl bg-white/4 border border-white/10 hover:border-white/18 hover:bg-white/6 transition-all text-left"
                  >
                    <p className="font-semibold text-sm truncate mb-0.5">
                      {subject}
                    </p>
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

        {/* RECENT SCORES */}
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
                const pct = Math.round((a.score / a.total) * 100);
                return (
                  <div
                    key={a.topic_id}
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-white/3 border border-white/8"
                  >
                    <Star className="w-4 h-4 text-white/15 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">
                        {meta?.title ?? "Topic"}
                      </p>
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

        {/* ADD SUBJECT */}
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

// ── SMALL HELPERS ──────────────────────────────────────────────────

function Label({
  children,
  noMargin,
}: {
  children: React.ReactNode;
  noMargin?: boolean;
}) {
  return (
    <p className={cn(
      "text-xs text-white/35 font-semibold uppercase tracking-widest",
      !noMargin && "mb-3"
    )}>
      {children}
    </p>
  );
}
