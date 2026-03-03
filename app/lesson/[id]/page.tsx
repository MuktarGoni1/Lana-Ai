"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { useLessonData } from "@/hooks/useLessonData";
import type {
  KeyTerm,
  LessonContent,
  LessonSection,
  QuizQuestion,
  VideoStage,
} from "@/hooks/useLessonData";

interface PageProps {
  params: { id: string };
}

function LessonSkeleton() {
  return (
    <div className="animate-pulse space-y-5 w-full">
      <div className="h-6 bg-[var(--color-skel)] rounded-lg w-2/5" />
      <div className="h-4 bg-[var(--color-skel)] rounded w-full" />
      <div className="h-4 bg-[var(--color-skel)] rounded w-11/12" />
      <div className="h-4 bg-[var(--color-skel)] rounded w-4/5" />
      <div className="mt-8 space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-[var(--color-border)] p-5 space-y-3">
            <div className="h-5 bg-[var(--color-skel)] rounded w-1/3" />
            <div className="h-3 bg-[var(--color-skel)] rounded w-full" />
            <div className="h-3 bg-[var(--color-skel)] rounded w-5/6" />
            <div className="h-3 bg-[var(--color-skel)] rounded w-4/6" />
          </div>
        ))}
      </div>
    </div>
  );
}

function VideoSkeleton() {
  return (
    <div className="w-full rounded-2xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[var(--color-skel)]">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-4 border-[var(--color-accent-muted)]" />
            <div
              className="absolute inset-0 rounded-full border-4 border-transparent border-t-[var(--color-accent)] animate-spin"
              style={{ animationDuration: "1.2s" }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="text-[var(--color-accent)]"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                <line x1="7" y1="2" x2="7" y2="22" />
                <line x1="17" y1="2" x2="17" y2="22" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <line x1="2" y1="7" x2="7" y2="7" />
                <line x1="2" y1="17" x2="7" y2="17" />
                <line x1="17" y1="17" x2="22" y2="17" />
                <line x1="17" y1="7" x2="22" y2="7" />
              </svg>
            </div>
          </div>
          <p className="text-sm font-medium text-[var(--color-text-muted)]">Generating your explainer video…</p>
          <p className="text-xs text-[var(--color-text-subtle)] max-w-[240px] text-center">
            This usually takes 1–2 minutes. Your lesson is ready now.
          </p>
        </div>
      </div>
    </div>
  );
}

function VideoPlayer({ url }: { url: string }) {
  return (
    <div className="w-full rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-sm">
      <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
        <video
          src={url}
          controls
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover bg-black"
        />
      </div>
    </div>
  );
}

function GeneratingLesson({ stage }: { stage: string }) {
  const labels: Record<string, string> = {
    "checking-cache": "Loading your lesson…",
    generating: "Building your personalised lesson…",
    idle: "Preparing…",
  };

  return (
    <div className="lesson-page flex flex-col items-center justify-center min-h-[60vh] gap-5">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-[var(--color-accent-muted)]" />
        <div
          className="absolute inset-0 rounded-full border-4 border-transparent border-t-[var(--color-accent)] animate-spin"
          style={{ animationDuration: "0.9s" }}
        />
      </div>
      <div className="text-center">
        <p className="font-semibold text-[var(--color-text)] text-base">{labels[stage] ?? "Loading…"}</p>
        {stage === "generating" && (
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">Usually takes 15–30 seconds</p>
        )}
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="lesson-page flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6">
      <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          className="text-red-500"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <div>
        <p className="font-semibold text-[var(--color-text)]">Something went wrong</p>
        <p className="mt-1 text-sm text-[var(--color-text-muted)] max-w-xs">{message}</p>
      </div>
      <button onClick={onRetry} className="btn-primary">
        Try Again
      </button>
    </div>
  );
}

function LessonRenderer({ lesson }: { lesson: LessonContent }) {
  return (
    <div className="space-y-6">
      <div className="card card-accent">
        <div className="flex items-center gap-2 mb-3">
          <span className="tag">Overview</span>
          {lesson.estimated_minutes && (
            <span className="text-xs text-[var(--color-text-muted)]">⏱ {lesson.estimated_minutes} min</span>
          )}
        </div>
        <p className="text-[var(--color-text)] leading-relaxed text-[15px]">{lesson.summary}</p>
      </div>

      {lesson.sections?.map((section: LessonSection, i: number) => (
        <div key={i} className="card">
          <h3 className="section-heading">{section.heading}</h3>
          <p
            className="text-[var(--color-text)] leading-relaxed text-[15px]"
            dangerouslySetInnerHTML={{
              __html: section.body
                .replace(/&#x27;/g, "'")
                .replace(/&amp;/g, "&")
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .replace(/&quot;/g, '"'),
            }}
          />
          {section.examples?.length > 0 && (
            <ul className="mt-3 space-y-1">
              {section.examples.map((ex: string, j: number) => (
                <li key={j} className="flex items-start gap-2 text-sm text-[var(--color-text-muted)]">
                  <span className="mt-0.5 text-[var(--color-accent)]">•</span>
                  <span>{ex}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}

      {lesson.key_terms?.length > 0 && (
        <div className="card">
          <h3 className="section-heading">Key Terms</h3>
          <dl className="space-y-4">
            {lesson.key_terms.map((kt: KeyTerm, i: number) => (
              <div key={i} className="flex gap-3">
                <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] flex-shrink-0" />
                <div>
                  <dt className="font-semibold text-[var(--color-text)] text-sm">{kt.term}</dt>
                  <dd className="mt-0.5 text-sm text-[var(--color-text-muted)] leading-relaxed">
                    {kt.definition}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}

function QuizRenderer({ questions }: { questions: QuizQuestion[] }) {
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);

  if (!questions?.length) return null;

  const score = submitted
    ? questions.filter((q) => selected[q.id] === q.correct_answer).length
    : 0;

  const handleSubmit = () => {
    setSubmitted(true);
    setShowResults(true);
  };

  const handleReset = () => {
    setSelected({});
    setSubmitted(false);
    setShowResults(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[var(--color-text)]">Quiz</h2>
        <span className="text-xs text-[var(--color-text-muted)]">
          {questions.length} question{questions.length !== 1 ? "s" : ""}
        </span>
      </div>

      {showResults && (
        <div className={`card ${score === questions.length ? "card-success" : "card-accent"} flex items-center justify-between`}>
          <div>
            <p className="font-semibold text-[var(--color-text)]">
              {score === questions.length ? "🎉 Perfect score!" : `${score} / ${questions.length} correct`}
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              {score === questions.length
                ? "Excellent work — you've mastered this topic."
                : "Review the sections above, then try again."}
            </p>
          </div>
          <button onClick={handleReset} className="btn-outline text-xs px-3 py-1.5">
            Retry
          </button>
        </div>
      )}

      {questions.map((q: QuizQuestion, i: number) => {
        const chosen = selected[q.id];

        return (
          <div key={q.id} className="card space-y-3">
            <p className="font-medium text-[var(--color-text)] text-[15px] leading-snug">
              {i + 1}. {q.question}
            </p>

            <div className="space-y-2">
              {q.options?.map((opt) => {
                const isSelected = chosen === opt.value;
                const isAnswer = opt.value === q.correct_answer;

                let optClass = "quiz-option";
                if (submitted) {
                  if (isAnswer) optClass += " quiz-option-correct";
                  else if (isSelected && !isAnswer) optClass += " quiz-option-wrong";
                  else optClass += " quiz-option-dimmed";
                } else if (isSelected) {
                  optClass += " quiz-option-selected";
                }

                return (
                  <button
                    key={`${q.id}-${opt.label}`}
                    disabled={submitted}
                    onClick={() => !submitted && setSelected((s) => ({ ...s, [q.id]: opt.value }))}
                    className={optClass}
                  >
                    <span className="quiz-option-label">{opt.label}</span>
                    <span className="text-sm leading-snug">{opt.value}</span>
                    {submitted && isAnswer && <span className="ml-auto text-[var(--color-green)]">✓</span>}
                    {submitted && isSelected && !isAnswer && <span className="ml-auto text-red-500">✗</span>}
                  </button>
                );
              })}
            </div>

            {submitted && q.explanation && (
              <p className="text-xs text-[var(--color-text-muted)] italic border-t border-[var(--color-border)] pt-3 mt-2">
                {q.explanation}
              </p>
            )}
          </div>
        );
      })}

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={Object.keys(selected).length < questions.length}
          className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Submit Answers
        </button>
      )}
    </div>
  );
}

function VideoSection({ videoUrl, videoStage }: { videoUrl: string | null; videoStage: VideoStage }) {
  if (videoStage === "unavailable") return null;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-[var(--color-text)]">Explainer Video</h2>
      {videoStage === "ready" && videoUrl ? <VideoPlayer url={videoUrl} /> : <VideoSkeleton />}
    </div>
  );
}

export default function LessonPage({ params }: PageProps) {
  const supabase = createClientComponentClient();
  const { user } = useUnifiedAuth();
  const topicId = params.id;
  const userId = user?.id ?? "";

  const [topicTitle, setTopicTitle] = useState("Loading topic...");
  const [subjectName, setSubjectName] = useState("Lesson");

  const { lesson, questions, stage, error, videoUrl, videoStage, retry } = useLessonData(topicId, userId);

  useEffect(() => {
    let mounted = true;

    const loadTopicMeta = async () => {
      const { data } = await supabase
        .from("topics")
        .select("title, subject_name")
        .eq("id", topicId)
        .maybeSingle();

      if (!mounted) return;
      setTopicTitle(data?.title ?? "Lesson");
      setSubjectName(data?.subject_name ?? "Lesson");
    };

    if (topicId) {
      void loadTopicMeta();
    }

    return () => {
      mounted = false;
    };
  }, [supabase, topicId]);

  if (stage === "checking-cache" || (stage === "idle" && !lesson)) {
    return (
      <div className="lesson-page">
        <div className="lesson-container space-y-6">
          <div className="h-8 bg-[var(--color-skel)] rounded-lg w-1/3 animate-pulse" />
          <LessonSkeleton />
        </div>
      </div>
    );
  }

  if (stage === "generating" && !lesson) {
    return <GeneratingLesson stage={stage} />;
  }

  if (stage === "error") {
    return <ErrorState message={error ?? "Unknown error"} onRetry={retry} />;
  }

  if (!lesson) {
    return null;
  }

  return (
    <>
      <style>{`
        :root {
          --color-bg: #fafaf8;
          --color-surface: #ffffff;
          --color-border: #e8e8e4;
          --color-text: #1a1a18;
          --color-text-muted: #6b6b65;
          --color-text-subtle: #9d9d96;
          --color-accent: #2563eb;
          --color-accent-muted: #dbeafe;
          --color-skel: #f0f0eb;
          --color-green: #16a34a;
        }

        .lesson-page { min-height: 100vh; background: var(--color-bg); padding: 24px 16px 80px; }
        .lesson-container { max-width: 720px; margin: 0 auto; }

        .card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 16px;
          padding: 20px;
        }
        .card-accent { background: #eff6ff; border-color: #bfdbfe; }
        .card-success { background: #f0fdf4; border-color: #bbf7d0; }

        .section-heading { font-size: 15px; font-weight: 700; color: var(--color-text); margin-bottom: 10px; }

        .tag {
          display: inline-block;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--color-accent);
          background: var(--color-accent-muted);
          padding: 2px 8px;
          border-radius: 6px;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: var(--color-accent);
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          padding: 10px 20px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          transition: background 0.15s;
        }
        .btn-primary:hover { background: #1d4ed8; }

        .btn-outline {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          color: var(--color-text);
          font-size: 13px;
          font-weight: 500;
          padding: 6px 14px;
          border-radius: 8px;
          border: 1px solid var(--color-border);
          cursor: pointer;
          transition: background 0.15s;
        }
        .btn-outline:hover { background: var(--color-skel); }

        .quiz-option {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-align: left;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1.5px solid var(--color-border);
          background: var(--color-surface);
          color: var(--color-text);
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
        }
        .quiz-option:hover:not(:disabled) { border-color: var(--color-accent); background: #f0f7ff; }
        .quiz-option-selected { border-color: var(--color-accent) !important; background: #eff6ff !important; }
        .quiz-option-correct { border-color: #16a34a !important; background: #f0fdf4 !important; color: #15803d !important; }
        .quiz-option-wrong { border-color: #dc2626 !important; background: #fef2f2 !important; color: #b91c1c !important; }
        .quiz-option-dimmed { opacity: 0.45; }
        .quiz-option:disabled { cursor: default; }

        .quiz-option-label {
          min-width: 26px;
          height: 26px;
          border-radius: 6px;
          background: var(--color-skel);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          color: var(--color-text-muted);
          flex-shrink: 0;
        }
      `}</style>

      <div className="lesson-page">
        <div className="lesson-container space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="tag">{subjectName}</span>
            </div>
            <h1 className="text-2xl font-bold text-[var(--color-text)] leading-snug">{topicTitle}</h1>
          </div>

          <LessonRenderer lesson={lesson} />
          <QuizRenderer questions={questions} />
          <VideoSection videoUrl={videoUrl} videoStage={videoStage} />
        </div>
      </div>
    </>
  );
}
