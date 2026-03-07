"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/db";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { useLessonData } from "@/hooks/useLessonData";
import { useLessonVideo } from "@/hooks/useLessonVideo";
import {
  ErrorState,
  LESSON_FLOW_BUTTON_SECONDARY,
  LESSON_THEME_VARS,
  LessonShell,
  LessonSkeleton,
  ProUpgradeVideoSection,
  VideoSection,
} from "@/components/lesson-flow/flow-ui";

export default function LessonVideoPage() {
  const router = useRouter();
  const params = useParams<{ id?: string | string[] }>();
  const { user, isAuthenticated, isLoading: authLoading } = useUnifiedAuth();

  const routeTopicId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const topicId = routeTopicId || "";
  const userId = user?.id ?? "";

  const [topicTitle, setTopicTitle] = useState("Loading topic...");
  const [subjectName, setSubjectName] = useState("Lesson");
  const [isPro, setIsPro] = useState(false);
  const [accessLoading, setAccessLoading] = useState(true);

  const { lesson, questions, stage, error, retry } = useLessonData(topicId, userId);
  const {
    videoUrl,
    status: videoStatusRaw,
    progress: videoProgress,
    error: videoError,
    startGeneration,
    retry: retryVideo,
  } = useLessonVideo(topicId, userId);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    let mounted = true;

    async function loadSubscriptionStatus() {
      if (!isAuthenticated) {
        if (!mounted) return;
        setIsPro(false);
        setAccessLoading(false);
        return;
      }

      try {
        setAccessLoading(true);
        const response = await fetch("/api/subscription/status", { cache: "no-store" });
        const payload = await response.json().catch(() => ({ is_pro: false }));
        if (!mounted) return;
        setIsPro(Boolean(payload?.is_pro));
      } catch {
        if (!mounted) return;
        setIsPro(false);
      } finally {
        if (mounted) setAccessLoading(false);
      }
    }

    void loadSubscriptionStatus();
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, userId]);

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

  useEffect(() => {
    if (!accessLoading && isPro && lesson && videoStatusRaw === "idle") {
      void startGeneration();
    }
  }, [accessLoading, isPro, lesson, startGeneration, videoStatusRaw]);

  if (
    authLoading ||
    accessLoading ||
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

  const videoStatus =
    !isPro
      ? "unavailable"
      : videoStatusRaw === "completed"
      ? "ready"
      : videoStatusRaw === "failed" || videoStatusRaw === "unavailable"
      ? "unavailable"
      : "pending";

  return (
    <LessonShell
      subjectName={subjectName}
      topicTitle={topicTitle}
      step="video"
      lessonStatus={lesson ? "ready" : "pending"}
      quizStatus={questions.length > 0 ? "ready" : "pending"}
      videoStatus={videoStatus}
      estimatedMinutes={lesson?.estimated_minutes}
      sectionCount={lesson?.sections.length}
      questionCount={questions.length > 0 ? questions.length : undefined}
    >
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => router.push(`/lesson/${topicId}/quiz`)}
            className={LESSON_FLOW_BUTTON_SECONDARY}
          >
            Back to quiz
          </button>
          <button
            type="button"
            onClick={() => router.push("/lessons")}
            className={LESSON_FLOW_BUTTON_SECONDARY}
          >
            Finish and return to lessons
          </button>
        </div>

        {isPro ? (
          <VideoSection
            videoUrl={videoUrl}
            status={videoStatusRaw}
            progress={videoProgress}
            error={videoError}
            onRetry={retryVideo}
          />
        ) : (
          <ProUpgradeVideoSection onUpgrade={() => router.push("/upgrade")} />
        )}
      </div>
    </LessonShell>
  );
}
