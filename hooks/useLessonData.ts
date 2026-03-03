"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/db";

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
const MAX_QUIZ_POLLS = 45;

function normalizeQuestions(input: unknown): QuizQuestion[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item, index) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const q = item as Record<string, unknown>;
      const question =
        (typeof q.question === "string" && q.question.trim()) ||
        (typeof q.q === "string" && q.q.trim()) ||
        "";
      const correctAnswer =
        (typeof q.correct_answer === "string" && q.correct_answer.trim()) ||
        (typeof q.answer === "string" && q.answer.trim()) ||
        "";

      const rawOptions = Array.isArray(q.options) ? q.options : [];
      const options = rawOptions
        .map((option, optIndex) => {
          if (typeof option === "string") {
            return { label: String.fromCharCode(65 + optIndex), value: option };
          }
          if (option && typeof option === "object") {
            const parsed = option as Record<string, unknown>;
            const value = typeof parsed.value === "string" ? parsed.value : "";
            const label = typeof parsed.label === "string" ? parsed.label : String.fromCharCode(65 + optIndex);
            if (value) {
              return { label, value };
            }
          }
          return null;
        })
        .filter((option): option is QuizOption => Boolean(option));

      if (!question || !correctAnswer || options.length < 2) {
        return null;
      }

      return {
        id: (typeof q.id === "string" && q.id) || `${index + 1}`,
        question,
        correct_answer: correctAnswer,
        options,
        difficulty:
          q.difficulty === "easy" || q.difficulty === "medium" || q.difficulty === "hard"
            ? q.difficulty
            : "medium",
        explanation: typeof q.explanation === "string" ? q.explanation : "",
      } as QuizQuestion;
    })
    .filter((question): question is QuizQuestion => Boolean(question));
}

export function useLessonData(topicId: string, userId: string): LessonDataState {
  const db = supabase as any;
  const lessonPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const quizPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lessonAttempts = useRef(0);
  const videoAttempts = useRef(0);
  const quizAttempts = useRef(0);
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

  const stopQuizPoll = useCallback(() => {
    if (quizPollRef.current) {
      clearInterval(quizPollRef.current);
      quizPollRef.current = null;
    }
  }, []);

  const fetchQuiz = useCallback(async (): Promise<QuizQuestion[]> => {
    const { data } = await db
      .from("quiz_questions")
      .select("questions")
      .eq("topic_id", topicId)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return normalizeQuestions(data?.questions);
  }, [topicId]);

  const startQuizPoll = useCallback(() => {
    if (quizPollRef.current) {
      return;
    }

    quizAttempts.current = 0;

    quizPollRef.current = setInterval(async () => {
      quizAttempts.current += 1;
      if (quizAttempts.current > MAX_QUIZ_POLLS) {
        stopQuizPoll();
        return;
      }

      const questions = await fetchQuiz();
      if (questions.length > 0) {
        stopQuizPoll();
        setState((s) => ({ ...s, questions }));
      }
    }, POLL_INTERVAL_MS);
  }, [fetchQuiz, stopQuizPoll]);

  const resolveLesson = useCallback(
    async (lessonContent: LessonContent, videoUrl: string | null, serverQuestions?: unknown) => {
      stopLessonPoll();
      const normalizedServerQuestions = normalizeQuestions(serverQuestions);
      const questions = normalizedServerQuestions.length > 0 ? normalizedServerQuestions : await fetchQuiz();

      setState((s) => ({
        ...s,
        lesson: lessonContent,
        questions,
        stage: "ready",
        error: null,
        videoUrl: videoUrl ?? null,
        videoStage: videoUrl ? "ready" : s.videoStage,
      }));

      if (questions.length === 0) {
        startQuizPoll();
      } else {
        stopQuizPoll();
      }
    },
    [fetchQuiz, startQuizPoll, stopLessonPoll, stopQuizPoll]
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

      const { data: unit } = await db
        .from("lesson_units")
        .select("lesson_content, is_ready, video_url")
        .eq("topic_id", topicId)
        .maybeSingle();

      if (unit?.is_ready && unit?.lesson_content) {
        await resolveLesson(unit.lesson_content as unknown as LessonContent, unit.video_url ?? null);
        return;
      }

      const { data: job } = await db
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
          error: typeof job.error === "string" ? job.error : "Lesson generation failed",
        }));
      }
    }, POLL_INTERVAL_MS);
  }, [resolveLesson, stopLessonPoll, topicId, userId]);

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

      const { data: unit } = await db
        .from("lesson_units")
        .select("video_url")
        .eq("topic_id", topicId)
        .maybeSingle();

      if (unit?.video_url) {
        stopVideoPoll();
        setState((s) => ({ ...s, videoUrl: unit.video_url, videoStage: "ready" }));
      }
    }, POLL_INTERVAL_MS);
  }, [stopVideoPoll, topicId]);

  const load = useCallback(async () => {
    if (!topicId || !userId) {
      return;
    }

    setState((s) => ({ ...s, stage: "checking-cache", error: null }));

    const { data: unit, error: unitErr } = await db
      .from("lesson_units")
      .select("lesson_content, is_ready, video_url")
      .eq("topic_id", topicId)
      .maybeSingle();

    if (unitErr) {
      setState((s) => ({ ...s, stage: "error", error: unitErr.message }));
      return;
    }

    if (unit?.is_ready && unit?.lesson_content) {
      await resolveLesson(unit.lesson_content as unknown as LessonContent, unit.video_url ?? null);
      if (!unit.video_url) {
        startVideoPoll();
      }
      return;
    }

    if (generationFired.current) {
      return;
    }
    generationFired.current = true;

    const { data: topic } = await db
      .from("topics")
      .select("title, subject_name")
      .eq("id", topicId)
      .maybeSingle();

    const { data: profile } = await db
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
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          stopLessonPoll();
          const payload = await res.json().catch(() => ({}));
          const message =
            (typeof payload?.error === "string" && payload.error) ||
            (typeof payload?.details === "string" && payload.details) ||
            `Lesson generation failed (${res.status})`;

          setState((s) => ({
            ...s,
            stage: "error",
            error: message,
          }));
          return;
        }

        const json = await res.json().catch(() => null);
        if (json?.lesson_content) {
          await resolveLesson(
            json.lesson_content as unknown as LessonContent,
            typeof json.video_url === "string" ? json.video_url : null,
            json.questions
          );

          if (!json.video_url) {
            startVideoPoll();
          }
        }
      })
      .catch(() => {
        // Polling handles surfaced failures.
      });

    startLessonPoll();
  }, [resolveLesson, startLessonPoll, startVideoPoll, topicId, userId]);

  const retry = useCallback(() => {
    generationFired.current = false;
    lessonAttempts.current = 0;
    videoAttempts.current = 0;
    quizAttempts.current = 0;
    stopLessonPoll();
    stopVideoPoll();
    stopQuizPoll();
    setState({
      lesson: null,
      questions: [],
      stage: "idle",
      error: null,
      videoUrl: null,
      videoStage: "idle",
    });
    load();
  }, [load, stopLessonPoll, stopQuizPoll, stopVideoPoll]);

  useEffect(() => {
    load();
    return () => {
      stopLessonPoll();
      stopVideoPoll();
      stopQuizPoll();
    };
  }, [load, stopLessonPoll, stopVideoPoll, stopQuizPoll]);

  return { ...state, retry };
}
