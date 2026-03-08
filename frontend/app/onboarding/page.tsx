"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { supabase } from "@/lib/db";

type LearningStyle = "visual" | "auditory" | "reading_writing" | "kinesthetic";

type Step = 1 | 2 | 3 | 4;
type SubjectDraft = {
  id: string;
  subject: string;
  topicInput: string;
  topics: string[];
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MAX_SUBJECTS = 5;

function createSubjectDraft(): SubjectDraft {
  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 10);
  return {
    id,
    subject: "",
    topicInput: "",
    topics: [],
  };
}

function getTimezoneList(): string[] {
  try {
    const intlAny = Intl as any;
    if (typeof intlAny.supportedValuesOf === "function") {
      return intlAny.supportedValuesOf("timeZone");
    }
  } catch {
  }
  return ["UTC"];
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, refreshSession, checkAuthStatus } = useUnifiedAuth();

  const timezoneOptions = useMemo(() => getTimezoneList(), []);

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [role, setRole] = useState<"child" | "parent">("child");
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [grade, setGrade] = useState("");

  const [learningStyle, setLearningStyle] = useState<LearningStyle>("visual");

  const [lessonDays, setLessonDays] = useState<string[]>([]);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState("16:00");
  const [reminderTimezone, setReminderTimezone] = useState("UTC");

  const [subjects, setSubjects] = useState<SubjectDraft[]>([createSubjectDraft()]);

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    setReminderTimezone(tz);
  }, []);


  async function ensureServerSessionSynced() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token || !session?.refresh_token) return;

    await fetch("/api/auth/sync-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      }),
      cache: "no-store",
    });
  }

  async function authFetch(input: RequestInfo | URL, init?: RequestInit) {
    await ensureServerSessionSynced();
    return fetch(input, {
      ...(init || {}),
      credentials: "include",
      cache: init?.cache ?? "no-store",
    });
  }

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const load = async () => {
      if (!isAuthenticated || !user?.id) {
        if (!isLoading) setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const [progressRes, prefRes, scheduleRes] = await Promise.all([
          authFetch("/api/onboarding-progress"),
          authFetch("/api/learner-preferences"),
          authFetch("/api/lesson-schedule"),
        ]);

        if (progressRes.ok) {
          const progress = await progressRes.json();
          const data = progress?.data || {};

          const nextStep = Number(data.onboarding_step || 1);
          setStep((Math.min(4, Math.max(1, nextStep)) as Step) || 1);
          setRole(data.role === "parent" ? "parent" : "child");
          setFullName(data.full_name || "");
          setAge(data.age ? String(data.age) : "");
          setGrade(data.grade || "");

          if (data.onboarding_complete) {
            router.replace("/dashboard");
            return;
          }
        }

        if (prefRes.ok) {
          const pref = await prefRes.json();
          const s = pref?.data?.learning_style;
          if (["visual", "auditory", "reading_writing", "kinesthetic"].includes(s)) {
            setLearningStyle(s as LearningStyle);
          }
        }

        if (scheduleRes.ok) {
          const schedulePayload = await scheduleRes.json();
          const firstSchedule = Array.isArray(schedulePayload?.data) ? schedulePayload.data[0] : null;
          if (firstSchedule) {
            setLessonDays(Array.isArray(firstSchedule.lesson_days) ? firstSchedule.lesson_days : []);
            setReminderEnabled(Boolean(firstSchedule.reminder_enabled));
            setReminderTime(typeof firstSchedule.reminder_time === "string" ? firstSchedule.reminder_time.slice(0, 5) : "16:00");
            setReminderTimezone(firstSchedule.reminder_timezone || "UTC");
          }
        }
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [isAuthenticated, isLoading, router, user?.id]);

  function toggleDay(day: string) {
    setLessonDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  function addSubject() {
    setSubjects((prev) => {
      if (prev.length >= MAX_SUBJECTS) return prev;
      return [...prev, createSubjectDraft()];
    });
  }

  function removeSubject(subjectId: string) {
    setSubjects((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== subjectId) : prev));
  }

  function updateSubjectName(subjectId: string, value: string) {
    setSubjects((prev) =>
      prev.map((item) => (item.id === subjectId ? { ...item, subject: value } : item))
    );
  }

  function updateSubjectTopicInput(subjectId: string, value: string) {
    setSubjects((prev) =>
      prev.map((item) => (item.id === subjectId ? { ...item, topicInput: value } : item))
    );
  }

  function addTopic(subjectId: string) {
    setSubjects((prev) =>
      prev.map((item) => {
        if (item.id !== subjectId) return item;
        const trimmed = item.topicInput.trim();
        if (!trimmed) return item;
        const exists = item.topics.some((topic) => topic.toLowerCase() === trimmed.toLowerCase());
        if (exists) return { ...item, topicInput: "" };
        return {
          ...item,
          topics: [...item.topics, trimmed],
          topicInput: "",
        };
      })
    );
  }

  function removeTopic(subjectId: string, topic: string) {
    setSubjects((prev) =>
      prev.map((item) =>
        item.id === subjectId ? { ...item, topics: item.topics.filter((t) => t !== topic) } : item
      )
    );
  }

  async function saveProgress(nextStep: Step) {
    const ageNum = age ? Number(age) : null;

    const res = await authFetch("/api/onboarding-progress", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        onboarding_step: nextStep,
        role,
        full_name: fullName.trim() || undefined,
        age: Number.isFinite(ageNum) ? ageNum : null,
        grade: grade.trim() || null,
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error || "Could not save onboarding progress.");
    }
  }

  async function handleNext() {
    setError(null);

    if (step === 1) {
      if (!fullName.trim()) {
        setError("Please enter a name to continue.");
        return;
      }
      if (!grade.trim()) {
        setError("Please enter a grade to continue.");
        return;
      }
      const ageNum = Number(age);
      if (age && (!Number.isFinite(ageNum) || ageNum < 1 || ageNum > 120)) {
        setError("Please enter a valid age.");
        return;
      }

      setSaving(true);
      try {
        await saveProgress(2);
        setStep(2);
      } finally {
        setSaving(false);
      }
      return;
    }

    if (step === 2) {
      setSaving(true);
      try {
        const prefRes = await authFetch("/api/learner-preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ learning_style: learningStyle }),
        });
        if (!prefRes.ok) {
          const body = await prefRes.json().catch(() => ({}));
          throw new Error(body?.error || "Could not save learning style.");
        }
        await saveProgress(3);
        setStep(3);
      } catch (err: any) {
        setError(err?.message || "Could not continue.");
      } finally {
        setSaving(false);
      }
      return;
    }

    if (step === 3) {
      if (lessonDays.length === 0) {
        setError("Select at least one lesson day to continue.");
        return;
      }
      setSaving(true);
      try {
        await saveProgress(4);
        setStep(4);
      } catch (err: any) {
        setError(err?.message || "Could not continue.");
      } finally {
        setSaving(false);
      }
      return;
    }

    if (step === 4) {
      const normalizedSubjects = subjects.map((subject) => ({
        ...subject,
        subject: subject.subject.trim(),
        topics: subject.topics.map((topic) => topic.trim()).filter(Boolean),
      }));

      if (normalizedSubjects.length === 0) {
        setError("Add at least one subject to continue.");
        return;
      }

      if (normalizedSubjects.length > MAX_SUBJECTS) {
        setError(`You can add up to ${MAX_SUBJECTS} subjects during onboarding.`);
        return;
      }

      const seen = new Set<string>();
      for (const subject of normalizedSubjects) {
        if (!subject.subject) {
          setError("Each subject card needs a subject name.");
          return;
        }
        if (subject.topics.length === 0) {
          setError(`Add at least one topic for ${subject.subject}.`);
          return;
        }
        const key = subject.subject.toLowerCase();
        if (seen.has(key)) {
          setError("Duplicate subject names are not allowed.");
          return;
        }
        seen.add(key);
      }

      setSaving(true);
      try {
        for (const subject of normalizedSubjects) {
          const scheduleRes = await authFetch("/api/lesson-schedule", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subjectName: subject.subject,
              lessonDays,
              reminderEnabled,
              reminderTime,
              reminderTimezone,
            }),
          });

          if (!scheduleRes.ok) {
            const body = await scheduleRes.json().catch(() => ({}));
            throw new Error(body?.error || "Could not save lesson-day settings.");
          }
        }

        const completeRes = await authFetch("/api/onboarding/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subjectPlans: normalizedSubjects.map((subject) => ({
              subject: subject.subject,
              topics: subject.topics.map((title) => ({ title })),
            })),
          }),
        });

        if (!completeRes.ok) {
          const body = await completeRes.json().catch(() => ({}));
          throw new Error(body?.error || "Failed to complete onboarding");
        }

        // Keep a local completion marker and force refresh auth state to avoid redirect loops.
        try {
          const oneYear = 60 * 60 * 24 * 365;
          document.cookie = `lana_onboarding_complete=1; Max-Age=${oneYear}; Path=/; SameSite=Lax`;
          localStorage.setItem("lana_onboarding_complete", "1");
        } catch {
          // Non-fatal
        }

        await refreshSession();
        await checkAuthStatus(true);
        router.replace("/dashboard");
      } catch (err: any) {
        setError(err?.message || "Could not complete onboarding.");
      } finally {
        setSaving(false);
      }
    }
  }

  function handleBack() {
    if (step === 1 || saving) return;
    setError(null);
    setStep((prev) => (prev - 1) as Step);
  }

  if (isLoading || loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-black text-white">
        <Loader2 className="h-8 w-8 animate-spin text-white/60" />
      </div>
    );
  }

  const stepLabels = ["About You", "Learning Style", "Lesson Days", "Subjects & Topics"];

  return (
    <div className="min-h-screen bg-black px-4 py-8 text-white">
      <div className="mx-auto w-full max-w-lg rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <div className="mb-5">
          <p className="text-xs uppercase tracking-widest text-white/45">Step {step} of 4</p>
          <h1 className="mt-1 text-xl font-semibold">{stepLabels[step - 1]}</h1>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className={`h-1.5 rounded-full ${s <= step ? "bg-white" : "bg-white/15"}`} />
            ))}
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setRole("child")}
                className={`min-h-10 rounded-md border px-3 py-2 text-sm ${
                  role === "child" ? "border-white bg-white text-black" : "border-white/20 bg-black text-white/80"
                }`}
              >
                I&apos;m a student
              </button>
              <button
                onClick={() => setRole("parent")}
                className={`min-h-10 rounded-md border px-3 py-2 text-sm ${
                  role === "parent" ? "border-white bg-white text-black" : "border-white/20 bg-black text-white/80"
                }`}
              >
                I&apos;m a parent
              </button>
            </div>

            <label className="block space-y-1">
              <span className="text-xs text-white/60">Name</span>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-md border border-white/15 bg-black px-3 py-2 text-sm"
                placeholder={role === "parent" ? "Child name" : "Your name"}
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-xs text-white/60">Age</span>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full rounded-md border border-white/15 bg-black px-3 py-2 text-sm"
                  placeholder="Age"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs text-white/60">Grade</span>
                <input
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full rounded-md border border-white/15 bg-black px-3 py-2 text-sm"
                  placeholder="e.g. 7"
                />
              </label>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            {[
              { id: "visual", label: "Visual", desc: "Diagrams, charts, and examples" },
              { id: "auditory", label: "Auditory", desc: "Explainers and spoken walkthroughs" },
              { id: "reading_writing", label: "Reading/Writing", desc: "Clear notes and summaries" },
              { id: "kinesthetic", label: "Kinesthetic", desc: "Practice-first and active checkpoints" },
            ].map((item) => {
              const active = learningStyle === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setLearningStyle(item.id as LearningStyle)}
                  className={`flex min-h-12 w-full items-center justify-between rounded-lg border px-3 py-2 text-left ${
                    active ? "border-white bg-white text-black" : "border-white/20 bg-black text-white"
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className={`text-xs ${active ? "text-black/70" : "text-white/60"}`}>{item.desc}</p>
                  </div>
                  {active && <Check className="h-4 w-4" />}
                </button>
              );
            })}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs text-white/60">Choose lesson days</p>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => {
                  const active = lessonDays.includes(day);
                  return (
                    <button
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`min-h-9 rounded-full border px-3 py-1 text-xs ${
                        active ? "border-white bg-white text-black" : "border-white/20 bg-black text-white/80"
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={reminderEnabled} onChange={(e) => setReminderEnabled(e.target.checked)} />
              Enable reminders
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-xs text-white/60">Reminder time</span>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-full rounded-md border border-white/15 bg-black px-3 py-2 text-sm"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs text-white/60">Timezone</span>
                <select
                  value={reminderTimezone}
                  onChange={(e) => setReminderTimezone(e.target.value)}
                  className="w-full rounded-md border border-white/15 bg-black px-3 py-2 text-sm"
                >
                  {timezoneOptions.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <p className="text-xs text-white/60">
              Add up to {MAX_SUBJECTS} subjects. Each subject needs at least one topic.
            </p>

            <div className="space-y-3">
              {subjects.map((subject, index) => (
                <div key={subject.id} className="space-y-2 rounded-lg border border-white/10 bg-white/[0.02] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-white/60">Subject {index + 1}</span>
                    {subjects.length > 1 && (
                      <button
                        onClick={() => removeSubject(subject.id)}
                        className="rounded-md border border-white/15 px-2 py-1 text-[11px] text-white/70"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <input
                    value={subject.subject}
                    onChange={(e) => updateSubjectName(subject.id, e.target.value)}
                    className="w-full rounded-md border border-white/15 bg-black px-3 py-2 text-sm"
                    placeholder="e.g. Mathematics"
                  />

                  <div className="flex gap-2">
                    <input
                      value={subject.topicInput}
                      onChange={(e) => updateSubjectTopicInput(subject.id, e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTopic(subject.id))}
                      className="w-full rounded-md border border-white/15 bg-black px-3 py-2 text-sm"
                      placeholder="e.g. Fractions"
                    />
                    <button
                      onClick={() => addTopic(subject.id)}
                      className="rounded-md border border-white/20 px-3 py-2 text-xs"
                    >
                      Add
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {subject.topics.map((topic) => (
                      <button
                        key={`${subject.id}-${topic}`}
                        onClick={() => removeTopic(subject.id, topic)}
                        className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-white/90"
                        title="Remove topic"
                      >
                        {topic} x
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-[11px] text-white/50">
                {subjects.length} / {MAX_SUBJECTS} subjects added
              </p>
              <button
                onClick={addSubject}
                disabled={subjects.length >= MAX_SUBJECTS}
                className="rounded-md border border-white/20 px-3 py-2 text-xs disabled:opacity-40"
              >
                Add another subject
              </button>
            </div>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

        <div className="mt-6 flex items-center gap-2">
          <button
            onClick={handleBack}
            disabled={step === 1 || saving}
            className="inline-flex min-h-10 items-center gap-1 rounded-md border border-white/20 px-3 py-2 text-xs disabled:opacity-40"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>

          <button
            onClick={handleNext}
            disabled={saving}
            className="inline-flex min-h-10 flex-1 items-center justify-center gap-1 rounded-md bg-white px-3 py-2 text-xs font-semibold text-black disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : step === 4 ? "Start learning" : "Continue"}
            {!saving && <ArrowRight className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
