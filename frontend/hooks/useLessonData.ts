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
  | "waiting-auth"
  | "checking-cache"
  | "generating"
  | "ready"
  | "error";

export interface LessonDataState {
  lesson: LessonContent | null;
  questions: QuizQuestion[];
  stage: GenerationStage;
  error: string | null;
  retry: () => void;
}

const POLL_INTERVAL_MS = 2_000;
const MAX_LESSON_POLLS = 90;
const MAX_QUIZ_POLLS = 45;

function normalizeLessonContent(input: unknown): LessonContent | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const lesson = input as Record<string, unknown>;
  const rawSections = Array.isArray(lesson.sections) ? lesson.sections : [];

  const sections: LessonSection[] = rawSections
    .map((section) => {
      if (!section || typeof section !== "object") return null;
      const s = section as Record<string, unknown>;
      const heading = (
        (typeof s.heading === "string" && s.heading) ||
        (typeof s.title === "string" && s.title) ||
        ""
      ).trim();
      const body = (
        (typeof s.body === "string" && s.body) ||
        (typeof s.content === "string" && s.content) ||
        ""
      ).trim();
      const examples = Array.isArray(s.examples)
        ? s.examples.filter((e): e is string => typeof e === "string")
        : [];

      if (!heading || !body) return null;
      return { heading, body, examples };
    })
    .filter((section): section is LessonSection => Boolean(section));

  const summary = (
    (typeof lesson.summary === "string" && lesson.summary) ||
    (typeof lesson.introduction === "string" && lesson.introduction) ||
    ""
  ).trim();

  const key_terms: KeyTerm[] = Array.isArray(lesson.key_terms)
    ? lesson.key_terms
        .map((k) => {
          if (!k || typeof k !== "object") return null;
          const termObj = k as Record<string, unknown>;
          const term = (typeof termObj.term === "string" ? termObj.term : "").trim();
          const definition = (
            typeof termObj.definition === "string" ? termObj.definition : ""
          ).trim();
          if (!term || !definition) return null;
          return { term, definition };
        })
        .filter((k): k is KeyTerm => Boolean(k))
    : [];

  const estimatedMinutesRaw = lesson.estimated_minutes;
  const estimated_minutes =
    typeof estimatedMinutesRaw === "number" && Number.isFinite(estimatedMinutesRaw)
      ? estimatedMinutesRaw
      : 15;

  if (!summary || sections.length === 0) {
    return null;
  }

  return {
    summary,
    sections,
    key_terms,
    estimated_minutes,
    diagram: typeof lesson.diagram === "string" ? lesson.diagram : undefined,
  };
}

function normalizeQuestions(input: unknown): QuizQuestion[] {
  const source = (() => {
    if (Array.isArray(input)) return input;
    if (input && typeof input === "object") {
      const maybeObject = input as Record<string, unknown>;
      if (Array.isArray(maybeObject.questions)) return maybeObject.questions;
      if (Array.isArray(maybeObject.items)) return maybeObject.items;
    }
    return [];
  })();

  if (!Array.isArray(source)) {
    return [];
  }

  return source
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
  const quizPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lessonAttempts = useRef(0);
  const quizAttempts = useRef(0);
  const generationFired = useRef(false);

  const [state, setState] = useState<Omit<LessonDataState, "retry">>({
    lesson: null,
    questions: [],
    stage: "idle",
    error: null,
  });

  const stopLessonPoll = useCallback(() => {
    if (lessonPollRef.current) {
      clearInterval(lessonPollRef.current);
      lessonPollRef.current = null;
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
    async (rawLessonContent: unknown, serverQuestions?: unknown) => {
      const lessonContent = normalizeLessonContent(rawLessonContent);
      if (!lessonContent) {
        throw new Error("Generated lesson format is invalid");
      }

      stopLessonPoll();
      const normalizedServerQuestions = normalizeQuestions(serverQuestions);
      const hasServerQuestions = normalizedServerQuestions.length > 0;

      // Render lesson immediately. Quiz can hydrate independently.
      setState((s) => ({
        ...s,
        lesson: lessonContent,
        questions: hasServerQuestions ? normalizedServerQuestions : s.questions,
        stage: "ready",
        error: null,
      }));

      if (hasServerQuestions) {
        stopQuizPoll();
        return;
      }

      const fetchedQuestions = await fetchQuiz();
      if (fetchedQuestions.length > 0) {
        stopQuizPoll();
        setState((s) => ({ ...s, questions: fetchedQuestions }));
        return;
      }

      startQuizPoll();
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
        .select("lesson_content, is_ready")
        .eq("topic_id", topicId)
        .maybeSingle();

      if (unit?.is_ready && unit?.lesson_content) {
        try {
          await resolveLesson(unit.lesson_content);
        } catch (error) {
          stopLessonPoll();
          setState((s) => ({
            ...s,
            stage: "error",
            error: error instanceof Error ? error.message : "Failed to process lesson content",
          }));
        }
        return;
      }

      const { data: job } = await db
        .from("lesson_generation_jobs")
        .select("*")
        .eq("topic_id", topicId)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (job?.status === "failed") {
        stopLessonPoll();
        const failureMessage =
          (typeof job.error_message === "string" && job.error_message) ||
          (typeof job.error === "string" && job.error) ||
          (typeof job.error_code === "string" && job.error_code) ||
          "Lesson generation failed";

        setState((s) => ({
          ...s,
          stage: "error",
          error: failureMessage,
        }));
      }
    }, POLL_INTERVAL_MS);
  }, [resolveLesson, stopLessonPoll, topicId, userId]);

  const load = useCallback(async () => {
    if (!topicId) {
      setState((s) => ({
        ...s,
        stage: "error",
        error: "Missing topic id. Please return to lessons and try again.",
      }));
      return;
    }

    if (!userId) {
      setState((s) => ({ ...s, stage: "waiting-auth", error: null }));
      return;
    }

    setState((s) => ({ ...s, stage: "checking-cache", error: null }));

    const { data: unit, error: unitErr } = await db
      .from("lesson_units")
      .select("lesson_content, is_ready")
      .eq("topic_id", topicId)
      .maybeSingle();

    if (unitErr) {
      setState((s) => ({ ...s, stage: "error", error: unitErr.message }));
      return;
    }

    if (unit?.is_ready && unit?.lesson_content) {
      try {
        await resolveLesson(unit.lesson_content);
      } catch (error) {
        setState((s) => ({
          ...s,
          stage: "error",
          error: error instanceof Error ? error.message : "Failed to process lesson content",
        }));
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
          try {
            await resolveLesson(json.lesson_content, json.questions);
          } catch (error) {
            setState((s) => ({
              ...s,
              stage: "error",
              error: error instanceof Error ? error.message : "Failed to process lesson content",
            }));
          }
        }
      })
      .catch(() => {
        // Polling handles surfaced failures.
      });

    startLessonPoll();
  }, [resolveLesson, startLessonPoll, topicId, userId]);

  const retry = useCallback(() => {
    generationFired.current = false;
    lessonAttempts.current = 0;
    quizAttempts.current = 0;
    stopLessonPoll();
    stopQuizPoll();
    setState({
      lesson: null,
      questions: [],
      stage: "idle",
      error: null,
    });
    load();
  }, [load, stopLessonPoll, stopQuizPoll]);

  useEffect(() => {
    load();
    return () => {
      stopLessonPoll();
      stopQuizPoll();
    };
  }, [load, stopLessonPoll, stopQuizPoll]);

  return { ...state, retry };
}
