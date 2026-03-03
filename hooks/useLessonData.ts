"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export interface LessonSection {
  heading: string;
  body: string;
  examples: string[];
}

export interface KeyTerm {
  term: string;
  definition: string;
}

export interface LessonContent {
  summary: string;
  sections: LessonSection[];
  key_terms: KeyTerm[];
  estimated_minutes: number;
  diagram?: string;
}

export interface QuizOption {
  label: string;
  value: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  correct_answer: string;
  options: QuizOption[];
  difficulty: "easy" | "medium" | "hard";
  explanation: string;
}

export type GenerationStage =
  | "idle"
  | "checking-cache"
  | "generating"
  | "ready"
  | "error";

export type VideoStage = "idle" | "generating" | "ready" | "unavailable";

export interface LessonDataState {
  lesson: LessonContent | null;
  questions: QuizQuestion[];
  stage: GenerationStage;
  error: string | null;
  videoUrl: string | null;
  videoStage: VideoStage;
  retry: () => void;
}

const POLL_INTERVAL_MS = 2_000;
const MAX_LESSON_POLLS = 90;
const MAX_VIDEO_POLLS = 150;

export function useLessonData(topicId: string, userId: string): LessonDataState {
  const supabase = createClientComponentClient();

  const lessonPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lessonAttempts = useRef(0);
  const videoAttempts = useRef(0);
  const generationFired = useRef(false);

  const [state, setState] = useState<Omit<LessonDataState, "retry">>({
    lesson: null,
    questions: [],
    stage: "idle",
    error: null,
    videoUrl: null,
    videoStage: "idle",
  });

  const stopLessonPoll = useCallback(() => {
    if (lessonPollRef.current) {
      clearInterval(lessonPollRef.current);
      lessonPollRef.current = null;
    }
  }, []);

  const stopVideoPoll = useCallback(() => {
    if (videoPollRef.current) {
      clearInterval(videoPollRef.current);
      videoPollRef.current = null;
    }
  }, []);

  const fetchQuiz = useCallback(async (): Promise<QuizQuestion[]> => {
    const { data } = await supabase
      .from("quiz_questions")
      .select("questions")
      .eq("topic_id", topicId)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return (data?.questions as QuizQuestion[]) ?? [];
  }, [supabase, topicId]);

  const resolveLesson = useCallback(
    async (lessonContent: LessonContent, videoUrl: string | null) => {
      stopLessonPoll();
      const questions = await fetchQuiz();
      setState((s) => ({
        ...s,
        lesson: lessonContent,
        questions,
        stage: "ready",
        error: null,
        videoUrl: videoUrl ?? null,
        videoStage: videoUrl ? "ready" : s.videoStage,
      }));
    },
    [fetchQuiz, stopLessonPoll]
  );

  const startLessonPoll = useCallback(() => {
    lessonAttempts.current = 0;
    lessonPollRef.current = setInterval(async () => {
      lessonAttempts.current += 1;

      if (lessonAttempts.current > MAX_LESSON_POLLS) {
        stopLessonPoll();
        setState((s) => ({
          ...s,
          stage: "error",
          error: "Lesson generation timed out. Please try again.",
        }));
        return;
      }

      const { data: unit } = await supabase
        .from("lesson_units")
        .select("lesson_content, is_ready, video_url")
        .eq("topic_id", topicId)
        .maybeSingle();

      if (unit?.is_ready && unit?.lesson_content) {
        await resolveLesson(unit.lesson_content as LessonContent, unit.video_url ?? null);
        return;
      }

      const { data: job } = await supabase
        .from("lesson_generation_jobs")
        .select("status, error")
        .eq("topic_id", topicId)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (job?.status === "failed") {
        stopLessonPoll();
        setState((s) => ({
          ...s,
          stage: "error",
          error: job.error ?? "Lesson generation failed",
        }));
      }
    }, POLL_INTERVAL_MS);
  }, [resolveLesson, stopLessonPoll, supabase, topicId, userId]);

  const startVideoPoll = useCallback(() => {
    if (videoPollRef.current) {
      return;
    }

    videoAttempts.current = 0;
    setState((s) => ({ ...s, videoStage: "generating" }));

    videoPollRef.current = setInterval(async () => {
      videoAttempts.current += 1;

      if (videoAttempts.current > MAX_VIDEO_POLLS) {
        stopVideoPoll();
        setState((s) => ({ ...s, videoStage: "unavailable" }));
        return;
      }

      const { data: unit } = await supabase
        .from("lesson_units")
        .select("video_url")
        .eq("topic_id", topicId)
        .maybeSingle();

      if (unit?.video_url) {
        stopVideoPoll();
        setState((s) => ({ ...s, videoUrl: unit.video_url, videoStage: "ready" }));
      }
    }, POLL_INTERVAL_MS);
  }, [stopVideoPoll, supabase, topicId]);

  const load = useCallback(async () => {
    if (!topicId || !userId) {
      return;
    }

    setState((s) => ({ ...s, stage: "checking-cache", error: null }));

    const { data: unit, error: unitErr } = await supabase
      .from("lesson_units")
      .select("lesson_content, is_ready, video_url")
      .eq("topic_id", topicId)
      .maybeSingle();

    if (unitErr) {
      setState((s) => ({ ...s, stage: "error", error: unitErr.message }));
      return;
    }

    if (unit?.is_ready && unit?.lesson_content) {
      await resolveLesson(unit.lesson_content as LessonContent, unit.video_url ?? null);
      if (!unit.video_url) {
        startVideoPoll();
      }
      return;
    }

    if (generationFired.current) {
      return;
    }
    generationFired.current = true;

    const { data: topic } = await supabase
      .from("topics")
      .select("title, subject_name")
      .eq("id", topicId)
      .maybeSingle();

    const { data: profile } = await supabase
      .from("profiles")
      .select("grade")
      .eq("id", userId)
      .maybeSingle();

    setState((s) => ({ ...s, stage: "generating" }));

    fetch("/api/structured-lesson/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic_id: topicId,
        user_id: userId,
        subject: topic?.subject_name ?? "",
        title: topic?.title ?? "",
        grade: profile?.grade ?? "",
        generate_video: false,
        generate_audio: false,
      }),
    })
      .then(async (res) => {
        if (!res.ok) return;

        const json = await res.json().catch(() => null);
        if (json?.lesson_content) {
          stopLessonPoll();
          const questions = (json.questions as QuizQuestion[]) ?? (await fetchQuiz());
          setState((s) => ({
            ...s,
            lesson: json.lesson_content as LessonContent,
            questions,
            stage: "ready",
            error: null,
          }));
          if (!json.video_url) {
            startVideoPoll();
          }
        }
      })
      .catch(() => {
        // Polling handles surfaced failures.
      });

    startLessonPoll();
  }, [
    fetchQuiz,
    resolveLesson,
    startLessonPoll,
    startVideoPoll,
    stopLessonPoll,
    supabase,
    topicId,
    userId,
  ]);

  const retry = useCallback(() => {
    generationFired.current = false;
    lessonAttempts.current = 0;
    videoAttempts.current = 0;
    setState({
      lesson: null,
      questions: [],
      stage: "idle",
      error: null,
      videoUrl: null,
      videoStage: "idle",
    });
    load();
  }, [load]);

  useEffect(() => {
    load();
    return () => {
      stopLessonPoll();
      stopVideoPoll();
    };
  }, [load, stopLessonPoll, stopVideoPoll]);

  return { ...state, retry };
}
