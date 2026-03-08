"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import type { ExamQuestion } from "@/lib/exam-prep";

type AttemptPayload = {
  id: string;
  topic_key: string;
  question_count: number;
  question_snapshot: ExamQuestion[];
  completed_at: string | null;
};

type SubmitResult = {
  total: number;
  correct: number;
  wrong: number;
  scorePercent: number;
};

function normalizeCachedAttempt(raw: unknown, attemptId: string): AttemptPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;

  const snapshot = Array.isArray(value.question_snapshot)
    ? (value.question_snapshot as ExamQuestion[])
    : Array.isArray(value.questions)
    ? (value.questions as ExamQuestion[])
    : [];

  if (snapshot.length === 0) return null;

  return {
    id: typeof value.id === "string" ? value.id : typeof value.attemptId === "string" ? value.attemptId : attemptId,
    topic_key:
      typeof value.topic_key === "string"
        ? value.topic_key
        : typeof value.topicKey === "string"
        ? value.topicKey
        : "exam-preparation",
    question_count:
      typeof value.question_count === "number"
        ? value.question_count
        : typeof value.questionCount === "number"
        ? value.questionCount
        : snapshot.length,
    question_snapshot: snapshot,
    completed_at:
      typeof value.completed_at === "string"
        ? value.completed_at
        : typeof value.completedAt === "string"
        ? value.completedAt
        : null,
  };
}

function toTitle(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function ExamPrepAttemptPage() {
  const router = useRouter();
  const params = useParams<{ attemptId?: string | string[] }>();
  const attemptId = Array.isArray(params?.attemptId) ? params.attemptId[0] : params?.attemptId || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<AttemptPayload | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, "A" | "B" | "C">>({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [startTime] = useState(Date.now());
  const [seconds, setSeconds] = useState(0);
  const [recoveredOnce, setRecoveredOnce] = useState(false);

  useEffect(() => {
    if (result) return;
    const timer = setInterval(() => {
      setSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [result, startTime]);

  useEffect(() => {
    if (!attemptId) {
      setError("Invalid exam attempt.");
      setLoading(false);
      return;
    }

    async function loadAttempt() {
      setLoading(true);
      setError(null);
      try {
        let lastStatus = 0;
        let payload: { error?: string; data?: AttemptPayload } = {};
        let data: AttemptPayload | null = null;

        for (let attemptNo = 0; attemptNo < 6; attemptNo += 1) {
          const response = await fetch(`/api/exam-prep/attempt/${attemptId}`, { cache: "no-store" });
          lastStatus = response.status;
          payload = await response.json().catch(() => ({}));

          if (response.status === 401) {
            router.replace(`/login?next=${encodeURIComponent(`/exam-prep/${attemptId}`)}`);
            return;
          }

          if (response.ok) {
            data = payload?.data as AttemptPayload;
            break;
          }

          if (attemptNo < 5 && (response.status === 404 || response.status >= 500)) {
            await new Promise((resolve) => setTimeout(resolve, 450 * (attemptNo + 1)));
            continue;
          }
          break;
        }

        if (!data) {
          if (lastStatus === 404 && typeof window !== "undefined") {
            const cachedAttemptRaw = sessionStorage.getItem(`lana_exam_attempt_${attemptId}`);
            if (cachedAttemptRaw) {
              const cachedAttempt = normalizeCachedAttempt(JSON.parse(cachedAttemptRaw), attemptId);
              if (cachedAttempt) {
                setAttempt(cachedAttempt);
                setLoading(false);
                return;
              }
            }

            if (!recoveredOnce) {
              setRecoveredOnce(true);
              await new Promise((resolve) => setTimeout(resolve, 1200));
              router.replace(`/exam-prep/${attemptId}`);
              return;
            }
          }

          throw new Error(payload?.error || `Failed to load exam attempt (${lastStatus || "unknown"})`);
        }

        if (!data || !Array.isArray(data.question_snapshot) || data.question_snapshot.length === 0) {
          throw new Error("This exam attempt has no questions.");
        }
        setAttempt(data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load exam attempt.");
      } finally {
        setLoading(false);
      }
    }

    void loadAttempt();
  }, [attemptId, recoveredOnce, router]);

  const questions = attempt?.question_snapshot ?? [];
  const currentQuestion = questions[currentIndex] ?? null;
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const progressPercent = useMemo(
    () => (questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0),
    [answeredCount, questions.length]
  );

  const computedScore = useMemo(() => {
    if (!questions.length) return 0;
    let correct = 0;
    for (const question of questions) {
      const selected = answers[question.id];
      const correctOption = question.options.find((option) => option.is_correct);
      if (selected && correctOption && selected === correctOption.label) {
        correct += 1;
      }
    }
    return Math.round((correct / questions.length) * 100);
  }, [answers, questions]);

  async function submitAttempt() {
    if (!attempt || submitLoading) return;
    setSubmitLoading(true);
    setSubmitError(null);
    try {
      let payload: Record<string, unknown> = {};
      let lastStatus = 0;

      for (let submitTry = 0; submitTry < 3; submitTry += 1) {
        const response = await fetch(`/api/exam-prep/attempt/${attempt.id}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers }),
        });
        lastStatus = response.status;
        payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;

        if (response.ok) {
          setResult(payload?.data as SubmitResult);
          return;
        }

        if (submitTry < 2 && (response.status === 404 || response.status >= 500)) {
          await new Promise((resolve) => setTimeout(resolve, 450 * (submitTry + 1)));
          continue;
        }

        throw new Error((payload?.error as string) || `Failed to submit attempt (${lastStatus || "unknown"})`);
      }
    } catch (submitErr) {
      setSubmitError(submitErr instanceof Error ? submitErr.message : "Submission failed.");
    } finally {
      setSubmitLoading(false);
    }
  }

  function formatElapsed(totalSeconds: number) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white grid place-items-center px-4">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          <p className="text-sm text-white/70">Loading exam session...</p>
        </div>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="min-h-screen bg-black text-white grid place-items-center px-4">
        <div className="max-w-md space-y-3 rounded-xl border border-white/10 bg-white/5 p-5 text-center">
          <AlertTriangle className="mx-auto h-6 w-6 text-rose-300" />
          <p className="text-sm text-white/80">{error || "Unable to open exam."}</p>
          <button
            type="button"
            className="min-h-10 rounded-md border border-white/20 px-4 py-2 text-xs"
            onClick={() => router.push("/dashboard")}
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen bg-black px-4 py-6 text-white">
        <div className="mx-auto max-w-4xl space-y-5">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-wider text-white/50">Exam Performance</p>
            <h1 className="mt-2 text-2xl font-semibold">{toTitle(attempt.topic_key)} Practice Review</h1>
            <p className="mt-1 text-sm text-white/70">
              Score: {result.correct}/{result.total} ({result.scorePercent}%) • Time: {formatElapsed(seconds)}
            </p>
          </section>

          <section className="space-y-3">
            {questions.map((question, index) => {
              const selected = answers[question.id] || null;
              const correct = question.options.find((option) => option.is_correct)?.label;
              const isCorrect = selected && correct ? selected === correct : false;
              return (
                <article key={question.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-white">
                      {index + 1}. {question.question}
                    </p>
                    {isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                    ) : (
                      <XCircle className="h-5 w-5 shrink-0 text-rose-400" />
                    )}
                  </div>
                  <div className="space-y-2">
                    {question.options.map((option) => {
                      const isSelected = selected === option.label;
                      return (
                        <div
                          key={`${question.id}-${option.label}`}
                          className={`rounded-lg border px-3 py-2 text-sm ${
                            option.is_correct
                              ? "border-emerald-400/30 bg-emerald-500/10"
                              : isSelected
                              ? "border-rose-400/30 bg-rose-500/10"
                              : "border-white/10 bg-white/[0.03]"
                          }`}
                        >
                          <p className="font-medium text-white">
                            {option.label}. {option.text}
                          </p>
                          <p className="mt-1 text-xs text-white/70">{option.explanation}</p>
                        </div>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </section>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="min-h-10 rounded-md bg-white px-4 py-2 text-xs font-semibold text-black"
              onClick={() => router.push("/dashboard")}
            >
              Back to dashboard
            </button>
            <button
              type="button"
              className="min-h-10 rounded-md border border-white/20 px-4 py-2 text-xs"
              onClick={() => router.push("/dashboard")}
            >
              Start another exam
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  const selectedCurrent = answers[currentQuestion.id] ?? null;
  const correctCurrent = currentQuestion.options.find((option) => option.is_correct) ?? null;

  return (
    <div className="min-h-screen bg-black px-4 py-6 text-white">
      <div className="mx-auto max-w-3xl space-y-4">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="inline-flex min-h-10 items-center gap-2 rounded-md border border-white/20 px-3 py-2 text-xs text-white/80"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to dashboard
        </button>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold">{toTitle(attempt.topic_key)} Practice Exam</p>
            <p className="text-xs text-white/60">
              Question {currentIndex + 1}/{questions.length} • {formatElapsed(seconds)}
            </p>
          </div>
          <div className="mt-3 h-2 rounded-full bg-white/10">
            <div className="h-full rounded-full bg-white transition-all duration-300" style={{ width: `${progressPercent}%` }} />
          </div>
          <p className="mt-2 text-xs text-white/60">
            Progress: {answeredCount}/{questions.length} • Current score: {computedScore}%
          </p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm font-medium">{currentQuestion.question}</p>
          <div className="mt-4 space-y-2">
            {currentQuestion.options.map((option) => {
              const isSelected = selectedCurrent === option.label;
              const showFeedback = Boolean(selectedCurrent);
              const tone = showFeedback
                ? option.is_correct
                  ? "border-emerald-400/40 bg-emerald-500/10"
                  : isSelected
                  ? "border-rose-400/40 bg-rose-500/10"
                  : "border-white/10 bg-white/[0.03]"
                : isSelected
                ? "border-white/40 bg-white/10"
                : "border-white/10 bg-white/[0.03]";

              return (
                <button
                  key={`${currentQuestion.id}-${option.label}`}
                  type="button"
                  disabled={Boolean(selectedCurrent)}
                  onClick={() => setAnswers((prev) => ({ ...prev, [currentQuestion.id]: option.label }))}
                  className={`w-full rounded-lg border px-3 py-3 text-left transition ${tone} disabled:cursor-default`}
                >
                  <p className="text-sm font-medium">
                    {option.label}. {option.text}
                  </p>
                  {selectedCurrent && (
                    <p className="mt-1 text-xs text-white/70">{option.explanation}</p>
                  )}
                </button>
              );
            })}
          </div>

          {selectedCurrent && correctCurrent && (
            <div className="mt-4 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/80">
              {selectedCurrent === correctCurrent.label ? (
                <span className="text-emerald-300">Correct. Nice work.</span>
              ) : (
                <span className="text-rose-300">
                  Not correct. The right answer is {correctCurrent.label}. {correctCurrent.text}
                </span>
              )}
            </div>
          )}
        </section>

        <section className="flex flex-wrap justify-between gap-2">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            className="min-h-10 rounded-md border border-white/20 px-4 py-2 text-xs disabled:opacity-40"
          >
            Previous
          </button>
          {currentIndex < questions.length - 1 ? (
            <button
              type="button"
              disabled={!selectedCurrent}
              onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              className="min-h-10 rounded-md bg-white px-4 py-2 text-xs font-semibold text-black disabled:opacity-40"
            >
              Next question
            </button>
          ) : (
            <button
              type="button"
              disabled={answeredCount < questions.length || submitLoading}
              onClick={() => {
                void submitAttempt();
              }}
              className="min-h-10 rounded-md bg-white px-4 py-2 text-xs font-semibold text-black disabled:opacity-40"
            >
              {submitLoading ? "Submitting..." : "Finish exam"}
            </button>
          )}
        </section>

        {submitError && <p className="text-xs text-rose-300">{submitError}</p>}
      </div>
    </div>
  );
}
