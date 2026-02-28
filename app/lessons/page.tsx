"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ChevronRight, Clock3, Lock, Save } from "lucide-react";
import Logo from "@/components/logo";
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

type LessonSchedule = {
  id: string;
  subject_name: string;
  lesson_days: string[];
  reminder_enabled: boolean;
  reminder_time: string;
  reminder_timezone: string;
};

type TodayResponse = {
  success: boolean;
  data: {
    day: string;
    lessons: Topic[];
  };
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function trimTime(value: string | undefined): string {
  if (!value) return "16:00";
  return value.slice(0, 5);
}

export default function LessonsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useUnifiedAuth();

  const [loading, setLoading] = useState(true);
  const [savingSchedule, setSavingSchedule] = useState(false);

  const [topics, setTopics] = useState<Topic[]>([]);
  const [todayDay, setTodayDay] = useState<string>("");
  const [todayLessons, setTodayLessons] = useState<Topic[]>([]);
  const [schedules, setSchedules] = useState<LessonSchedule[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);

  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("16:00");
  const [reminderTimezone, setReminderTimezone] = useState("UTC");

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
        const { data: plans } = await db.from("term_plans").select("id, subject").eq("user_id", user.id);
        const planIds = (plans ?? []).map((p: { id: string }) => p.id);

        const [{ data: topicRows }, todayRes, schedulesRes] = await Promise.all([
          planIds.length > 0
            ? db
                .from("topics")
                .select("id, title, week_number, order_index, subject_name, status")
                .in("term_plan_id", planIds)
                .order("week_number", { ascending: true })
                .order("order_index", { ascending: true })
            : Promise.resolve({ data: [] }),
          fetch("/api/lessons/today", { cache: "no-store" }),
          fetch("/api/lesson-schedule", { cache: "no-store" }),
        ]);

        const nextTopics = (topicRows ?? []) as Topic[];
        setTopics(nextTopics);

        const subjectsFromPlans = (plans ?? [])
          .map((p: { subject?: string }) => (p.subject || "").trim())
          .filter(Boolean);
        const subjectsFromTopics = nextTopics
          .map((t) => (t.subject_name || "").trim())
          .filter(Boolean);

        const uniqueSubjects = Array.from(new Set([...subjectsFromPlans, ...subjectsFromTopics]));
        setSubjectOptions(uniqueSubjects);

        if (todayRes.ok) {
          const payload = (await todayRes.json()) as TodayResponse;
          setTodayDay(payload?.data?.day || "");
          setTodayLessons(payload?.data?.lessons || []);
        } else {
          setTodayDay("");
          setTodayLessons([]);
        }

        if (schedulesRes.ok) {
          const payload = await schedulesRes.json();
          const rows = (payload?.data ?? []) as LessonSchedule[];
          setSchedules(rows);

          const defaultSubject = uniqueSubjects[0] || "";
          if (defaultSubject) {
            hydrateEditor(defaultSubject, rows);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [authLoading, isAuthenticated, user?.id]);

  const availableCount = useMemo(() => topics.filter((t) => t.status !== "locked").length, [topics]);

  function hydrateEditor(subject: string, rows: LessonSchedule[]) {
    setSelectedSubject(subject);
    const existing = rows.find((s) => s.subject_name === subject);

    if (!existing) {
      setSelectedDays([]);
      setReminderEnabled(false);
      setReminderTime("16:00");
      setReminderTimezone("UTC");
      return;
    }

    setSelectedDays(existing.lesson_days ?? []);
    setReminderEnabled(Boolean(existing.reminder_enabled));
    setReminderTime(trimTime(existing.reminder_time));
    setReminderTimezone(existing.reminder_timezone || "UTC");
  }

  function toggleDay(day: string) {
    setSelectedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  async function saveSchedule() {
    if (!selectedSubject) return;

    setSavingSchedule(true);
    try {
      const res = await fetch("/api/lesson-schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectName: selectedSubject,
          lessonDays: selectedDays,
          reminderEnabled,
          reminderTime,
          reminderTimezone,
        }),
      });

      if (!res.ok) {
        return;
      }

      const payload = await res.json();
      const saved = payload?.data as LessonSchedule;
      setSchedules((prev) => {
        const idx = prev.findIndex((row) => row.subject_name === saved.subject_name);
        if (idx < 0) return [...prev, saved];
        const next = [...prev];
        next[idx] = saved;
        return next;
      });

      const todayRes = await fetch("/api/lessons/today", { cache: "no-store" });
      if (todayRes.ok) {
        const todayPayload = (await todayRes.json()) as TodayResponse;
        setTodayDay(todayPayload?.data?.day || "");
        setTodayLessons(todayPayload?.data?.lessons || []);
      }
    } finally {
      setSavingSchedule(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Logo width={118} height={34} className="h-auto w-[96px] sm:w-[118px]" />
          <button onClick={() => router.push("/")} className="rounded-md border border-white/20 px-3 py-2 text-xs">
            Back to dashboard
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-5 py-6">
        <div>
          <h1 className="text-2xl font-semibold">Lessons</h1>
          <p className="text-sm text-white/60">{availableCount} available lesson{availableCount === 1 ? "" : "s"}.</p>
        </div>

        {!loading && isAuthenticated && (
          <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-white/70" />
              <h2 className="text-sm font-semibold">Today&apos;s lessons {todayDay ? `(${todayDay})` : ""}</h2>
            </div>
            {todayLessons.length === 0 ? (
              <p className="text-xs text-white/60">No lessons scheduled for today yet. Select lesson days by subject below.</p>
            ) : (
              <div className="space-y-2">
                {todayLessons.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => router.push(`/lesson/${topic.id}`)}
                    className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left hover:bg-white/10"
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

        {!loading && isAuthenticated && subjectOptions.length > 0 && (
          <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <h2 className="text-sm font-semibold">Lesson day and reminder settings</h2>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs text-white/60">Subject</span>
                <select
                  value={selectedSubject}
                  onChange={(e) => hydrateEditor(e.target.value, schedules)}
                  className="w-full rounded-md border border-white/15 bg-black px-3 py-2 text-sm"
                >
                  {subjectOptions.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs text-white/60">Reminder time</span>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-full rounded-md border border-white/15 bg-black px-3 py-2 text-sm"
                />
              </label>
            </div>

            <div className="mt-3">
              <p className="mb-2 text-xs text-white/60">Lesson days</p>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => {
                  const active = selectedDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`rounded-full border px-3 py-1 text-xs ${
                        active ? "border-white bg-white text-black" : "border-white/20 bg-transparent text-white/70"
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={reminderEnabled}
                  onChange={(e) => setReminderEnabled(e.target.checked)}
                  className="h-4 w-4"
                />
                Enable reminder on selected days
              </label>

              <label className="space-y-1">
                <span className="text-xs text-white/60">Reminder timezone</span>
                <input
                  value={reminderTimezone}
                  onChange={(e) => setReminderTimezone(e.target.value)}
                  placeholder="UTC"
                  className="w-full rounded-md border border-white/15 bg-black px-3 py-2 text-sm"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={saveSchedule}
              disabled={savingSchedule || !selectedSubject}
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-xs font-semibold text-black disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              {savingSchedule ? "Saving..." : "Save lesson settings"}
            </button>
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
                    locked ? "border-white/5 bg-white/5 opacity-50" : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium">{topic.title}</p>
                    <p className="text-xs text-white/50">
                      {(topic.subject_name || "Subject")} - Week {topic.week_number}
                    </p>
                  </div>
                  {locked ? <Lock className="h-4 w-4 text-white/40" /> : <ChevronRight className="h-4 w-4 text-white/40" />}
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}