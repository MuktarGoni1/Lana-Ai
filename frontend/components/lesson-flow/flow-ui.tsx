"use client";

import React, { type CSSProperties, useState } from "react";
import type { KeyTerm, LessonContent, LessonSection, QuizQuestion } from "@/hooks/useLessonData";
import type { VideoStatus } from "@/hooks/useLessonVideo";
import { decodeHTMLEntities } from "@/lib/html-entity-decoder";

export const LESSON_THEME_VARS: CSSProperties = {
  ["--color-bg" as string]: "#fafaf8",
  ["--color-surface" as string]: "#ffffff",
  ["--color-border" as string]: "#e8e8e4",
  ["--color-text" as string]: "#1a1a18",
  ["--color-text-muted" as string]: "#6b6b65",
  ["--color-accent" as string]: "#2563eb",
  ["--color-accent-muted" as string]: "#dbeafe",
  ["--color-skel" as string]: "#f0f0eb",
  ["--color-green" as string]: "#16a34a",
};

export type LessonFlowStep = "learn" | "quiz" | "video";

export const LESSON_FLOW_BUTTON_BASE =
  "lesson-flow-btn relative z-10 inline-flex min-h-11 items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]";

export const LESSON_FLOW_BUTTON_PRIMARY = `${LESSON_FLOW_BUTTON_BASE} bg-[var(--color-accent)] text-white hover:bg-blue-700`;
export const LESSON_FLOW_BUTTON_SECONDARY = `${LESSON_FLOW_BUTTON_BASE} border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-skel)]`;

export function statusTone(label: "ready" | "pending" | "unavailable") {
  if (label === "ready") return "bg-emerald-50 border-emerald-300 text-emerald-900";
  if (label === "unavailable") return "bg-red-50 border-red-300 text-red-900";
  return "bg-blue-50 border-blue-300 text-blue-900";
}

export function LessonShell({
  subjectName,
  topicTitle,
  step,
  lessonStatus,
  quizStatus,
  videoStatus,
  children,
}: {
  subjectName: string;
  topicTitle: string;
  step: LessonFlowStep;
  lessonStatus: "ready" | "pending";
  quizStatus: "ready" | "pending";
  videoStatus: "ready" | "pending" | "unavailable";
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
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-3">
          <span className="inline-flex rounded-md bg-[var(--color-accent-muted)] px-2 py-1 text-xs font-semibold text-[var(--color-accent)]">
            {decodeHTMLEntities(subjectName)}
          </span>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">{decodeHTMLEntities(topicTitle)}</h1>
          <div className="flex flex-wrap gap-2">
            {steps.map((item) => (
              <span
                key={item.id}
                className={`inline-flex rounded-full border px-3 py-1 text-xs ${
                  item.id === step
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                    : "border-[var(--color-border)] bg-white text-[var(--color-text-muted)]"
                }`}
              >
                {item.label}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex rounded-full border px-3 py-1 text-xs ${statusTone(lessonStatus)}`}>Lesson {lessonStatus}</span>
            <span className={`inline-flex rounded-full border px-3 py-1 text-xs ${statusTone(quizStatus)}`}>Quiz {quizStatus}</span>
            <span className={`inline-flex rounded-full border px-3 py-1 text-xs ${statusTone(videoStatus)}`}>Video {videoStatus}</span>
          </div>
        </div>
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
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <p className="text-sm leading-relaxed text-[var(--color-text)]">{decodeHTMLEntities(lesson.summary)}</p>
      </section>

      {lesson.sections?.map((section: LessonSection, i: number) => (
        <section key={i} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h2 className="mb-2 text-base font-semibold text-[var(--color-text)]">{decodeHTMLEntities(section.heading)}</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--color-text)]">{decodeHTMLEntities(section.body)}</p>
          {section.examples?.length > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--color-text-muted)]">
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
          <dl className="space-y-3">
            {lesson.key_terms.map((term: KeyTerm, i: number) => (
              <div key={i}>
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
}: {
  questions: QuizQuestion[];
  isLoading: boolean;
  onSubmitQuiz?: (payload: { score: number; total: number; answers: Record<string, string> }) => Promise<void> | void;
}) {
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await onSubmitQuiz?.({ score, total: questions.length, answers: selected });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
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
                  className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm ${
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
        </section>
      ))}

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        {submitted ? (
          <p className="text-sm font-semibold text-[var(--color-text)]">
            Score: {score}/{questions.length}
          </p>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={Object.keys(selected).length < questions.length || submitting}
            className={`${LESSON_FLOW_BUTTON_PRIMARY} disabled:cursor-not-allowed disabled:opacity-40`}
          >
            {submitting ? "Submitting..." : "Submit Quiz"}
          </button>
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
        <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
          <video src={videoUrl} controls autoPlay playsInline className="absolute inset-0 h-full w-full bg-black object-cover" />
        </div>
      </section>
    );
  }

  if (status === "failed" || status === "unavailable") {
    return (
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
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
      <p className="text-sm text-[var(--color-text-muted)]">Generating video... {progress}%</p>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--color-accent-muted)]">
        <div className="h-full bg-[var(--color-accent)] transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
    </section>
  );
}
