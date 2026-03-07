"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/db";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { useLessonData } from "@/hooks/useLessonData";
import {
  ErrorState,
  LESSON_THEME_VARS,
  LESSON_FLOW_BUTTON_PRIMARY,
  LESSON_FLOW_BUTTON_SECONDARY,
  LessonRenderer,
  LessonShell,
  LessonSkeleton,
} from "@/components/lesson-flow/flow-ui";

export default function LessonLearnPage() {
  const router = useRouter();
  const params = useParams<{ id?: string | string[] }>();
  const { user, isAuthenticated, isLoading: authLoading } = useUnifiedAuth();

  const routeTopicId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const topicId = routeTopicId || "";
  const userId = user?.id ?? "";

  const [topicTitle, setTopicTitle] = useState("Loading topic...");
  const [subjectName, setSubjectName] = useState("Lesson");

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

  if (!lesson) return null;

  return (
    <LessonShell
      subjectName={subjectName}
      topicTitle={topicTitle}
      step="learn"
      lessonStatus="ready"
      quizStatus={questions.length > 0 ? "ready" : "pending"}
      videoStatus="pending"
      estimatedMinutes={lesson.estimated_minutes}
      sectionCount={lesson.sections.length}
      questionCount={questions.length > 0 ? questions.length : undefined}
    >
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => router.push("/lessons")}
          className={LESSON_FLOW_BUTTON_SECONDARY}
        >
          Back to lessons
        </button>
        <LessonRenderer lesson={lesson} />
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <button
            type="button"
            onClick={() => router.push(`/lesson/${topicId}/quiz`)}
            className={LESSON_FLOW_BUTTON_PRIMARY}
          >
            Continue to quiz
          </button>
        </div>
      </div>
    </LessonShell>
  );
}
