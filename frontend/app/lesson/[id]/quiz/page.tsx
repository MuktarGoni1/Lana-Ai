"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/db";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { useLessonData } from "@/hooks/useLessonData";
import {
  ErrorState,
  LESSON_THEME_VARS,
  LessonShell,
  LessonSkeleton,
  QuizRenderer,
} from "@/components/lesson-flow/flow-ui";

export default function LessonQuizPage() {
  const router = useRouter();
  const params = useParams<{ id?: string | string[] }>();
  const { user, isAuthenticated, isLoading: authLoading } = useUnifiedAuth();

  const routeTopicId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const topicId = routeTopicId || "";
  const userId = user?.id ?? "";

  const [topicTitle, setTopicTitle] = useState("Loading topic...");
  const [subjectName, setSubjectName] = useState("Lesson");
  const [submitting, setSubmitting] = useState(false);

  const { lesson, questions, stage, error, retry } = useLessonData(topicId, userId);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (authLoading || topicId) return;
    const timer = setTimeout(() => router.replace("/lessons"), 900);
    return () => clearTimeout(timer);
  }, [authLoading, router, topicId]);

  useEffect(() => {
    let mounted = true;
    async function loadTopicMeta() {
      const { data } = await supabase
        .from("topics")
        .select("title, subject_name")
        .eq("id", topicId)
        .maybeSingle();
      if (!mounted) return;
      setTopicTitle(data?.title ?? "Lesson");
      setSubjectName(data?.subject_name ?? "Lesson");
    }
    if (topicId) {
      void loadTopicMeta();
    }
    return () => {
      mounted = false;
    };
  }, [topicId]);

  async function handleSubmitQuiz(payload: { score: number; total: number; answers: Record<string, string> }) {
    if (submitting) return;
    setSubmitting(true);
    try {
      await fetch("/api/quiz/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, ...payload }),
      });

      await fetch("/api/topic/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId }),
      });

      router.push(`/lesson/${topicId}/video`);
    } finally {
      setSubmitting(false);
    }
  }

  if (
    authLoading ||
    stage === "resolving-route" ||
    stage === "waiting-auth" ||
    stage === "checking-cache" ||
    (stage === "idle" && !lesson)
  ) {
    return (
      <div className="min-h-screen px-4 py-6" style={LESSON_THEME_VARS}>
        <div className="mx-auto max-w-3xl">
          <LessonSkeleton />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (stage === "error" && !lesson) {
    return <ErrorState message={error ?? "Unknown error"} onRetry={retry} />;
  }

  return (
    <LessonShell
      subjectName={subjectName}
      topicTitle={topicTitle}
      step="quiz"
      lessonStatus={lesson ? "ready" : "pending"}
      quizStatus={questions.length > 0 ? "ready" : "pending"}
      videoStatus="pending"
    >
      <div className="space-y-5">
        <button
          onClick={() => router.push(`/lesson/${topicId}/learn`)}
          className="rounded-md border border-[var(--color-border)] px-3 py-2 text-xs text-[var(--color-text)]"
        >
          Back to lesson
        </button>
        <QuizRenderer
          questions={questions}
          isLoading={stage === "generating" || (stage === "ready" && questions.length === 0)}
          onSubmitQuiz={handleSubmitQuiz}
        />
        {submitting && (
          <p className="text-sm text-[var(--color-text-muted)]">Saving quiz results…</p>
        )}
      </div>
    </LessonShell>
  );
}
