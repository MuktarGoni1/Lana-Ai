"use client";

import React, { type CSSProperties, useState } from "react";
import type { KeyTerm, LessonContent, LessonSection, QuizQuestion } from "@/hooks/useLessonData";
import type { VideoStatus } from "@/hooks/useLessonVideo";
import { decodeHTMLEntities } from "@/lib/html-entity-decoder";

export const LESSON_THEME_VARS: CSSProperties = {
  ["--color-bg" as string]: "#f5f3ee",
  ["--color-surface" as string]: "#ffffff",
  ["--color-border" as string]: "#ddd8ce",
  ["--color-text" as string]: "#1f1d18",
  ["--color-text-muted" as string]: "#6d6658",
  ["--color-accent" as string]: "#1f4ea3",
  ["--color-accent-muted" as string]: "#e6eefc",
  ["--color-skel" as string]: "#ebe7df",
  ["--color-green" as string]: "#166534",
  ["--color-gold" as string]: "#6a4a00",
};

export type LessonFlowStep = "learn" | "quiz" | "video";

export const LESSON_FLOW_BUTTON_BASE =
  "lesson-flow-btn relative z-10 inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]";

export const LESSON_FLOW_BUTTON_PRIMARY = `${LESSON_FLOW_BUTTON_BASE} bg-[var(--color-accent)] text-white hover:bg-[#1a428a]`;
export const LESSON_FLOW_BUTTON_SECONDARY = `${LESSON_FLOW_BUTTON_BASE} border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[#f6f3ec]`;

export function statusTone(label: "ready" | "pending" | "unavailable") {
  if (label === "ready") return "bg-emerald-50 border-emerald-300 text-emerald-900";
  if (label === "unavailable") return "bg-rose-50 border-rose-300 text-rose-900";
  return "bg-amber-50 border-amber-300 text-amber-900";
}

export function LessonShell({
  subjectName,
  topicTitle,
  step,
  lessonStatus,
  quizStatus,
  videoStatus,
  estimatedMinutes,
  sectionCount,
  questionCount,
  children,
}: {
  subjectName: string;
  topicTitle: string;
  step: LessonFlowStep;
  lessonStatus: "ready" | "pending";
  quizStatus: "ready" | "pending";
  videoStatus: "ready" | "pending" | "unavailable";
  estimatedMinutes?: number;
  sectionCount?: number;
  questionCount?: number;
  children: React.ReactNode;
}) {
  const steps: Array<{ id: LessonFlowStep; label: string }> = [
    { id: "learn", label: "Learn" },
    { id: "quiz", label: "Quiz" },
    { id: "video", label: "Video" },
  ];

  return (
    <div className="min-h-screen px-4 py-6" style={LESSON_THEME_VARS as CSSProperties}>
      <style>{`
        @media (forced-colors: active) {
          .lesson-flow-btn {
            forced-color-adjust: none;
            background: ButtonFace !important;
            color: ButtonText !important;
            border: 1px solid ButtonText !important;
          }
        }
      `}</style>
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <div className="space-y-3">
            <span className="inline-flex rounded-md bg-[var(--color-accent-muted)] px-2 py-1 text-xs font-semibold tracking-wide text-[var(--color-accent)]">
            {decodeHTMLEntities(subjectName)}
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">{decodeHTMLEntities(topicTitle)}</h1>
            <div className="flex flex-wrap gap-2 text-xs text-[var(--color-text-muted)]">
              {typeof estimatedMinutes === "number" && <span>{estimatedMinutes} min read</span>}
              {typeof sectionCount === "number" && <span>{sectionCount} sections</span>}
              {typeof questionCount === "number" && <span>{questionCount} quiz questions</span>}
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 overflow-x-auto py-1">
            {steps.map((item, index) => {
              const active = item.id === step;
              return (
                <React.Fragment key={item.id}>
                  <span
                    className={`inline-flex min-w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                      active
                        ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                        : "border-[var(--color-border)] bg-white text-[var(--color-text-muted)]"
                    }`}
                  >
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/10 text-[10px]">{index + 1}</span>
                    {item.label}
                  </span>
                  {index < steps.length - 1 && <span className="h-px w-7 bg-[var(--color-border)]" aria-hidden="true" />}
                </React.Fragment>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className={`inline-flex rounded-full border px-3 py-1 text-xs ${statusTone(lessonStatus)}`}>Lesson {lessonStatus}</span>
            <span className={`inline-flex rounded-full border px-3 py-1 text-xs ${statusTone(quizStatus)}`}>Quiz {quizStatus}</span>
            <span className={`inline-flex rounded-full border px-3 py-1 text-xs ${statusTone(videoStatus)}`}>Video {videoStatus}</span>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}

export function LessonSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="h-7 w-1/2 rounded bg-[var(--color-skel)]" />
      <div className="h-4 rounded bg-[var(--color-skel)]" />
      <div className="h-4 w-10/12 rounded bg-[var(--color-skel)]" />
      <div className="space-y-3 pt-4">
        <div className="h-24 rounded-xl bg-[var(--color-skel)]" />
        <div className="h-24 rounded-xl bg-[var(--color-skel)]" />
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="grid min-h-[60vh] place-items-center px-4">
      <div className="max-w-md space-y-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-center">
        <p className="font-semibold text-red-900">Something went wrong</p>
        <p className="text-sm text-red-800">{message}</p>
        {onRetry && (
          <button type="button" onClick={onRetry} className={LESSON_FLOW_BUTTON_PRIMARY}>
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

export function LessonRenderer({ lesson }: { lesson: LessonContent }) {
  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(31,78,163,0.16),transparent_52%),linear-gradient(120deg,rgba(230,238,252,0.72),rgba(255,255,255,0.96)_48%,rgba(245,243,238,0.92))]"
        />
        <div className="relative">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-accent)]">Overview</p>
          <p className="text-sm leading-7 text-[var(--color-text)]">{decodeHTMLEntities(lesson.summary)}</p>
        </div>
      </section>

      {lesson.sections?.map((section: LessonSection, i: number) => (
        <section key={i} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Section {i + 1}</p>
          <h2 className="mb-2 text-lg font-semibold text-[var(--color-text)]">{decodeHTMLEntities(section.heading)}</h2>
          <p className="whitespace-pre-line text-sm leading-7 text-[var(--color-text)]">{decodeHTMLEntities(section.body)}</p>
          {section.examples?.length > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-[var(--color-text-muted)]">
              {section.examples.map((example: string, index: number) => (
                <li key={index}>{decodeHTMLEntities(example)}</li>
              ))}
            </ul>
          )}
        </section>
      ))}

      {lesson.key_terms?.length > 0 && (
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h2 className="mb-2 text-base font-semibold text-[var(--color-text)]">Key Terms</h2>
          <dl className="grid gap-3 sm:grid-cols-2">
            {lesson.key_terms.map((term: KeyTerm, i: number) => (
              <div key={i} className="rounded-xl border border-[var(--color-border)] bg-[#faf8f2] p-3">
                <dt className="text-sm font-semibold text-[var(--color-text)]">{decodeHTMLEntities(term.term)}</dt>
                <dd className="text-sm text-[var(--color-text-muted)]">{decodeHTMLEntities(term.definition)}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}

export function QuizRenderer({
  questions,
  isLoading,
  onSubmitQuiz,
  onContinueToNext,
  continueLabel = "Continue to video",
}: {
  questions: QuizQuestion[];
  isLoading: boolean;
  onSubmitQuiz?: (payload: { score: number; total: number; answers: Record<string, string> }) => Promise<void> | void;
  onContinueToNext?: () => void;
  continueLabel?: string;
}) {
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <p className="text-sm text-[var(--color-text-muted)]">Loading quiz questions…</p>
      </section>
    );
  }

  if (!questions.length) {
    return (
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <p className="text-sm text-[var(--color-text-muted)]">No quiz questions are available for this lesson yet.</p>
      </section>
    );
  }

  const score = questions.filter((q) => selected[q.id] === q.correct_answer).length;
  const wrongCount = questions.length - score;
  const answered = Object.keys(selected).length;
  const progressPercent = Math.min(100, Math.round((answered / questions.length) * 100));

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmitQuiz?.({ score, total: questions.length, answers: selected });
      setSubmitted(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to save quiz results");
    } finally {
      setSubmitting(false);
    }
  }

  function handleTryAgain() {
    setSelected({});
    setSubmitted(false);
    setSubmitting(false);
    setSubmitError(null);
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-[var(--color-text)]">
            Quiz Progress: {answered}/{questions.length}
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">{submitted ? "Submitted" : "Answer all questions before submitting."}</p>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--color-accent-muted)]">
          <div
            className="h-full bg-[var(--color-accent)] transition-all duration-500"
            style={{ width: `${submitted ? 100 : progressPercent}%` }}
          />
        </div>
      </section>
      {questions.map((question, index) => (
        <section key={question.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <p className="mb-3 text-sm font-semibold text-[var(--color-text)]">
            {index + 1}. {decodeHTMLEntities(question.question)}
          </p>
          <div className="space-y-2">
            {question.options.map((opt) => {
              const isSelected = selected[question.id] === opt.value;
              const isCorrect = submitted && opt.value === question.correct_answer;
              const isWrongSelection = submitted && isSelected && !isCorrect;
              return (
                <button
                  type="button"
                  key={`${question.id}-${opt.label}`}
                  disabled={submitted}
                  onClick={() => setSelected((prev) => ({ ...prev, [question.id]: opt.value }))}
                  className={`flex min-h-11 w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    isCorrect
                      ? "border-emerald-300 bg-emerald-50"
                      : isWrongSelection
                      ? "border-red-300 bg-red-50"
                      : isSelected
                      ? "border-blue-300 bg-blue-50"
                      : "border-[var(--color-border)] bg-white"
                  }`}
                >
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-[var(--color-skel)] text-xs font-bold text-[var(--color-text-muted)]">
                    {opt.label}
                  </span>
                  <span className="text-[var(--color-text)]">{decodeHTMLEntities(opt.value)}</span>
                </button>
              );
            })}
          </div>
          {submitted && question.explanation && (
            <p className="mt-3 text-xs italic text-[var(--color-text-muted)]">{decodeHTMLEntities(question.explanation)}</p>
          )}
          {submitted && (
            <div className="mt-3 space-y-1 text-xs">
              <p className="text-[var(--color-text-muted)]">
                Your answer:{" "}
                <span
                  className={
                    selected[question.id] === question.correct_answer ? "font-semibold text-emerald-700" : "font-semibold text-rose-700"
                  }
                >
                  {decodeHTMLEntities(selected[question.id] || "No answer")}
                </span>
              </p>
              <p className="text-[var(--color-text-muted)]">
                Correct answer: <span className="font-semibold text-emerald-700">{decodeHTMLEntities(question.correct_answer)}</span>
              </p>
            </div>
          )}
        </section>
      ))}

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        {submitted ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-[var(--color-text)]">
              Score: {score}/{questions.length}
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="inline-flex rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 font-semibold text-emerald-900">
                Right: {score}
              </span>
              <span className="inline-flex rounded-full border border-rose-300 bg-rose-50 px-3 py-1 font-semibold text-rose-900">
                Wrong: {wrongCount}
              </span>
            </div>
            <button type="button" onClick={handleTryAgain} className={LESSON_FLOW_BUTTON_SECONDARY}>
              Try Again
            </button>
            {onContinueToNext && (
              <button type="button" onClick={onContinueToNext} className={LESSON_FLOW_BUTTON_PRIMARY}>
                {continueLabel}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={Object.keys(selected).length < questions.length || submitting}
              className={`${LESSON_FLOW_BUTTON_PRIMARY} disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {submitting ? "Submitting..." : "Submit Quiz"}
            </button>
            {submitError && <p className="text-xs text-rose-700">{submitError}</p>}
          </div>
        )}
      </section>
    </div>
  );
}

export function VideoSection({
  videoUrl,
  status,
  progress,
  error,
  onRetry,
}: {
  videoUrl: string | null;
  status: VideoStatus;
  progress: number;
  error: string | null;
  onRetry: () => void;
}) {
  if (status === "completed" && videoUrl) {
    return (
      <section className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="border-b border-[var(--color-border)] bg-[#f8f6f0] px-4 py-2">
          <p className="text-sm font-semibold text-[var(--color-text)]">Lesson video is ready</p>
        </div>
        <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
          <video src={videoUrl} controls autoPlay playsInline className="absolute inset-0 h-full w-full bg-black object-cover" />
        </div>
      </section>
    );
  }

  if (status === "failed" || status === "unavailable") {
    return (
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <p className="mb-1 text-sm font-semibold text-[var(--color-text)]">Video unavailable</p>
        <p className="text-sm text-[var(--color-text-muted)]">{error || "Video generation is currently unavailable."}</p>
        {status === "failed" && (
          <button type="button" onClick={onRetry} className={`mt-3 ${LESSON_FLOW_BUTTON_SECONDARY}`}>
            Retry Video
          </button>
        )}
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <p className="text-sm font-semibold text-[var(--color-text)]">Generating video narration</p>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">Progress: {progress}%</p>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--color-accent-muted)]">
        <div className="h-full bg-[var(--color-accent)] transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
    </section>
  );
}

export function ProUpgradeVideoSection({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <p className="text-sm font-semibold text-[var(--color-text)]">Explainer video is a Pro feature</p>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
        Subscribe to Pro to unlock AI explainer videos after each lesson and quiz.
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--color-text-muted)]">
        <li>Step-by-step narrated explanation</li>
        <li>Visual reinforcement of key concepts</li>
        <li>Better retention and revision support</li>
      </ul>
      <button type="button" onClick={onUpgrade} className={`mt-4 ${LESSON_FLOW_BUTTON_PRIMARY}`}>
        Subscribe to Pro
      </button>
    </section>
  );
}
