"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ArrowLeft, RotateCcw, Loader2, AlertCircle } from "lucide-react";
import DOMPurify from "dompurify";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------
interface Question {
  q: string;
  options: string[];
  answer: string;
  explanation?: string;
}

interface QuizState {
  questions: Question[];
  currentIndex: number;
  answers: Record<number, string>;
  isSubmitted: boolean;
  isLoading: boolean;
  error: string | null;
}

type QuizAction =
  | { type: "SET_QUESTIONS"; payload: Question[] }
  | { type: "SELECT_ANSWER"; index: number; answer: string }
  | { type: "NEXT_QUESTION" }
  | { type: "PREV_QUESTION" }
  | { type: "SUBMIT" }
  | { type: "RESTART" }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string };

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------
const MAX_QUESTIONS = 50;
const MAX_QUESTION_LENGTH = 500;
const MAX_OPTION_LENGTH = 200;
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 10;

const API_ENDPOINTS = {
  quizByLesson: (id: string) => `/api/lessons/${encodeURIComponent(id)}/quiz`,
  quizById: (id: string) => `/api/quiz/${encodeURIComponent(id)}`,
} as const;

// -----------------------------------------------------------------------------
// Utilities
// -----------------------------------------------------------------------------

/**
 * Sanitize text for safe rendering - prevents XSS
 */
function sanitizeText(text: string, maxLength: number = MAX_QUESTION_LENGTH): string {
  if (typeof text !== "string") return "";
  // Use DOMPurify to strip any HTML/scripts
  const cleaned = DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
  return cleaned.trim().slice(0, maxLength);
}

/**
 * Calculate percentage with bounds checking
 */
function percentage(num: number, total: number): number {
  if (total <= 0 || num < 0) return 0;
  return Math.min(100, Math.round((num / total) * 100));
}

/**
 * Validate and parse a single question object
 */
function validateQuestion(item: unknown): Question | null {
  if (!item || typeof item !== "object") return null;

  const obj = item as Record<string, unknown>;

  // Extract question text (handle multiple field names)
  const qRaw = obj.q ?? obj.question ?? obj.text;
  if (typeof qRaw !== "string" || !qRaw.trim()) return null;
  const q = sanitizeText(qRaw, MAX_QUESTION_LENGTH);

  // Extract options (handle multiple field names)
  const optionsRaw = obj.options ?? obj.choices ?? obj.answers;
  if (!Array.isArray(optionsRaw)) return null;

  const options = optionsRaw
    .filter((o): o is string => typeof o === "string" && o.trim().length > 0)
    .map((o) => sanitizeText(o, MAX_OPTION_LENGTH))
    .slice(0, MAX_OPTIONS);

  if (options.length < MIN_OPTIONS) return null;

  // Extract answer
  const answerRaw = obj.answer ?? obj.correct ?? obj.correctAnswer;
  if (typeof answerRaw !== "string" || !answerRaw.trim()) return null;
  const answer = sanitizeText(answerRaw, MAX_OPTION_LENGTH);

  // Validate answer is in options (case-insensitive match)
  const normalizedAnswer = answer.toLowerCase().trim();
  const matchingOption = options.find(
    (opt) => opt.toLowerCase().trim() === normalizedAnswer
  );

  if (!matchingOption) {
    // Try partial match as fallback
    const partialMatch = options.find((opt) =>
      opt.toLowerCase().includes(normalizedAnswer) ||
      normalizedAnswer.includes(opt.toLowerCase())
    );
    if (!partialMatch) return null;
  }

  // Extract optional explanation
  const explanationRaw = obj.explanation ?? obj.reason ?? obj.hint;
  const explanation =
    typeof explanationRaw === "string"
      ? sanitizeText(explanationRaw, MAX_QUESTION_LENGTH)
      : undefined;

  return {
    q,
    options,
    answer: matchingOption || answer,
    explanation,
  };
}

/**
 * Parse quiz data from URL parameter with validation
 */
function parseQuizParam(raw: string | null): Question[] {
  if (!raw) return [];

  try {
    // Limit raw input size to prevent DoS
    if (raw.length > 50000) {
      console.warn("[Quiz] URL param too large, truncating");
      raw = raw.slice(0, 50000);
    }

    const decoded = decodeURIComponent(raw);
    const data = JSON.parse(decoded);

    if (!Array.isArray(data)) return [];

    const questions: Question[] = [];
    for (const item of data.slice(0, MAX_QUESTIONS)) {
      const validated = validateQuestion(item);
      if (validated) {
        questions.push(validated);
      }
    }

    return questions;
  } catch (error) {
    console.error("[Quiz] Failed to parse URL param:", error);
    return [];
  }
}

/**
 * Transform API response to Question array
 */
function transformApiResponse(data: unknown): Question[] {
  if (!Array.isArray(data)) return [];

  const questions: Question[] = [];
  for (const item of data.slice(0, MAX_QUESTIONS)) {
    const validated = validateQuestion(item);
    if (validated) {
      questions.push(validated);
    }
  }

  return questions;
}

// -----------------------------------------------------------------------------
// Quiz State Reducer
// -----------------------------------------------------------------------------
function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case "SET_QUESTIONS":
      return {
        ...state,
        questions: action.payload,
        currentIndex: 0,
        answers: {},
        isSubmitted: false,
        isLoading: false,
        error: null,
      };

    case "SELECT_ANSWER":
      if (state.isSubmitted) return state;
      return {
        ...state,
        answers: { ...state.answers, [action.index]: action.answer },
      };

    case "NEXT_QUESTION":
      return {
        ...state,
        currentIndex: Math.min(state.currentIndex + 1, state.questions.length - 1),
      };

    case "PREV_QUESTION":
      return {
        ...state,
        currentIndex: Math.max(state.currentIndex - 1, 0),
      };

    case "SUBMIT":
      return { ...state, isSubmitted: true };

    case "RESTART":
      return {
        ...state,
        currentIndex: 0,
        answers: {},
        isSubmitted: false,
      };

    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false };

    default:
      return state;
  }
}

const initialState: QuizState = {
  questions: [],
  currentIndex: 0,
  answers: {},
  isSubmitted: false,
  isLoading: true,
  error: null,
};

// -----------------------------------------------------------------------------
// Sub-Components (defined outside main component for performance)
// -----------------------------------------------------------------------------

interface ProgressBarProps {
  current: number;
  total: number;
}

function QuizProgressBar({ current, total }: ProgressBarProps) {
  const pct = percentage(current, total);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Question {current} of {total}</span>
        <span>{pct}% complete</span>
      </div>
      <Progress value={pct} className="h-2" />
    </div>
  );
}

interface ScoreCircleProps {
  score: number;
  total: number;
}

function ScoreCircle({ score, total }: ScoreCircleProps) {
  const pct = percentage(score, total);
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * pct) / 100;

  const getScoreColor = () => {
    if (pct >= 80) return "text-green-500";
    if (pct >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="relative w-40 h-40 mx-auto" role="img" aria-label={`Score: ${score} out of ${total}, ${pct}%`}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          className="text-muted/20"
        />
        {/* Animated score circle */}
        <motion.circle
          cx="50"
          cy="50"
          r={radius}
          stroke="url(#scoreGradient)"
          strokeWidth="8"
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-4xl font-bold", getScoreColor())}>{pct}%</span>
        <span className="text-sm text-muted-foreground">
          {score}/{total}
        </span>
      </div>
    </div>
  );
}

interface QuestionOptionProps {
  option: string;
  isSelected: boolean;
  isCorrect?: boolean;
  isWrong?: boolean;
  showResult: boolean;
  disabled: boolean;
  onSelect: () => void;
  index: number;
}

function QuestionOption({
  option,
  isSelected,
  isCorrect,
  isWrong,
  showResult,
  disabled,
  onSelect,
  index,
}: QuestionOptionProps) {
  const getStyles = () => {
    if (showResult) {
      if (isCorrect) return "border-green-500 bg-green-500/10";
      if (isWrong) return "border-red-500 bg-red-500/10";
      return "border-border opacity-50";
    }
    if (isSelected) return "border-primary bg-primary/10";
    return "border-border hover:border-primary/50";
  };

  return (
    <motion.button
      onClick={onSelect}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.01 }}
      whileTap={disabled ? {} : { scale: 0.99 }}
      className={cn(
        "w-full text-left px-4 py-3 rounded-lg border transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        "disabled:cursor-not-allowed",
        getStyles()
      )}
      role="radio"
      aria-checked={isSelected}
      aria-label={`Option ${index + 1}: ${option}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex-1">{option}</span>
        {showResult && isCorrect && <Check className="w-5 h-5 text-green-500 flex-shrink-0" />}
        {showResult && isWrong && <X className="w-5 h-5 text-red-500 flex-shrink-0" />}
      </div>
    </motion.button>
  );
}

interface QuestionReviewProps {
  question: Question;
  userAnswer: string | undefined;
  index: number;
}

function QuestionReview({ question, userAnswer, index }: QuestionReviewProps) {
  const isCorrect = userAnswer === question.answer;

  return (
    <Card
      className={cn(
        "p-4",
        isCorrect ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={cn("font-medium", !isCorrect && "text-red-400")}>
          {index + 1}. {question.q}
        </p>
        {isCorrect ? (
          <Check className="w-5 h-5 text-green-500 flex-shrink-0" aria-label="Correct" />
        ) : (
          <X className="w-5 h-5 text-red-500 flex-shrink-0" aria-label="Incorrect" />
        )}
      </div>

      <div className="mt-3 space-y-2" role="list">
        {question.options.map((opt) => (
          <div
            key={opt}
            className={cn(
              "px-3 py-2 rounded-lg border text-sm flex items-center justify-between",
              opt === question.answer
                ? "border-green-500 bg-green-500/10"
                : opt === userAnswer
                ? "border-red-500 bg-red-500/10"
                : "border-border"
            )}
            role="listitem"
          >
            <span>{opt}</span>
            {opt === question.answer && (
              <Check className="w-4 h-4 text-green-500" aria-label="Correct answer" />
            )}
          </div>
        ))}
      </div>

      {!isCorrect && question.explanation && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-3 text-sm text-muted-foreground pl-3 border-l-2 border-red-400"
        >
          <strong>Explanation:</strong> {question.explanation}
        </motion.div>
      )}
    </Card>
  );
}

// -----------------------------------------------------------------------------
// Loading & Error States
// -----------------------------------------------------------------------------
function QuizSkeleton() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Loading quiz...</p>
      </div>
    </div>
  );
}

interface QuizErrorProps {
  message: string;
  onRetry?: () => void;
  onGoBack: () => void;
}

function QuizError({ message, onRetry, onGoBack }: QuizErrorProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <Card className="max-w-md w-full p-6 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
        <h2 className="text-xl font-semibold">Quiz Unavailable</h2>
        <p className="text-muted-foreground">{message}</p>
        <div className="flex gap-3 justify-center">
          {onRetry && (
            <Button variant="outline" onClick={onRetry}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          )}
          <Button onClick={onGoBack}>Go Back</Button>
        </div>
      </Card>
    </div>
  );
}

function EmptyQuiz({ onGoBack }: { onGoBack: () => void }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <Card className="max-w-md w-full p-6 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto" />
        <h2 className="text-xl font-semibold">No Questions Available</h2>
        <p className="text-muted-foreground">
          This lesson doesn&apos;t have any quiz questions yet, or there was an issue loading them.
        </p>
        <Button onClick={onGoBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Lesson
        </Button>
      </Card>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Results Screen
// -----------------------------------------------------------------------------
interface QuizResultsProps {
  questions: Question[];
  answers: Record<number, string>;
  onRestart: () => void;
  onGoHome: () => void;
  onGoBack: () => void;
}

function QuizResults({ questions, answers, onRestart, onGoHome, onGoBack }: QuizResultsProps) {
  const score = useMemo(
    () => questions.reduce((acc, q, i) => (answers[i] === q.answer ? acc + 1 : acc), 0),
    [questions, answers]
  );

  const getMessage = () => {
    const pct = percentage(score, questions.length);
    if (pct === 100) return { title: "Perfect Score! 🎉", subtitle: "You nailed every question!" };
    if (pct >= 80) return { title: "Excellent Work! 🌟", subtitle: "You really know your stuff!" };
    if (pct >= 60) return { title: "Good Job! 👍", subtitle: "Keep up the great work!" };
    if (pct >= 40) return { title: "Nice Try! 💪", subtitle: "Review the material and try again." };
    return { title: "Keep Practicing! 📚", subtitle: "Don't give up, you'll get it!" };
  };

  const { title, subtitle } = getMessage();

  return (
    <div className="min-h-screen bg-background py-10 px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto space-y-8"
      >
        {/* Score Display */}
        <div className="text-center space-y-4">
          <ScoreCircle score={score} total={questions.length} />
          <div>
            <h2 className="text-2xl font-bold">{title}</h2>
            <p className="text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        {/* Question Review */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Review Your Answers</h3>
          {questions.map((q, i) => (
            <QuestionReview key={i} question={q} userAnswer={answers[i]} index={i} />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button variant="outline" onClick={onRestart}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button variant="secondary" onClick={onGoHome}>
            More Quizzes
          </Button>
          <Button onClick={onGoBack}>Back to Lesson</Button>
        </div>
      </motion.div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Question Screen
// -----------------------------------------------------------------------------
interface QuizQuestionProps {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  selectedAnswer: string | undefined;
  onSelectAnswer: (answer: string) => void;
  onNext: () => void;
  onPrev: () => void;
  onSubmit: () => void;
  onGoBack: () => void;
  canSubmit: boolean;
}

function QuizQuestion({
  question,
  questionIndex,
  totalQuestions,
  selectedAnswer,
  onSelectAnswer,
  onNext,
  onPrev,
  onSubmit,
  onGoBack,
  canSubmit,
}: QuizQuestionProps) {
  const isFirst = questionIndex === 0;
  const isLast = questionIndex === totalQuestions - 1;
  const hasAnswered = selectedAnswer !== undefined;

  // Focus first option when question changes
  const optionsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const firstButton = optionsRef.current?.querySelector("button");
    firstButton?.focus();
  }, [questionIndex]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={onGoBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Progress */}
        <QuizProgressBar current={questionIndex + 1} total={totalQuestions} />

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={questionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="mt-8"
          >
            <h2 className="text-xl font-semibold mb-6">
              <span className="text-muted-foreground mr-2">{questionIndex + 1}.</span>
              {question.q}
            </h2>

            {/* Options */}
            <div ref={optionsRef} className="space-y-3" role="radiogroup" aria-label="Answer options">
              {question.options.map((opt, i) => (
                <QuestionOption
                  key={opt}
                  option={opt}
                  index={i}
                  isSelected={selectedAnswer === opt}
                  showResult={false}
                  disabled={false}
                  onSelect={() => onSelectAnswer(opt)}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          <div>
            {!isFirst && (
              <Button variant="outline" onClick={onPrev}>
                Previous
              </Button>
            )}
          </div>

          <div>
            {isLast ? (
              <Button onClick={onSubmit} disabled={!canSubmit}>
                Submit Quiz
              </Button>
            ) : (
              <Button onClick={onNext} disabled={!hasAnswered}>
                Next
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Main Quiz Content Component
// -----------------------------------------------------------------------------
function QuizContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const abortControllerRef = useRef<AbortController | null>(null);

  const [state, dispatch] = useState<QuizState>(initialState);
  const { questions, currentIndex, answers, isSubmitted, isLoading, error } = state;

  // Memoized values
  const currentQuestion = questions[currentIndex];
  const allAnswered = Object.keys(answers).length === questions.length && questions.length > 0;

  // Fetch quiz data
  useEffect(() => {
    // Cancel any in-flight request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    async function fetchQuiz() {
      dispatch((s) => ({ ...s, isLoading: true, error: null }));

      const lessonId = searchParams.get("lessonId");
      const quizId = searchParams.get("id");
      const rawData = searchParams.get("data");

      try {
        let questions: Question[] = [];

        if (lessonId) {
          const res = await fetch(API_ENDPOINTS.quizByLesson(lessonId), {
            signal,
            cache: "no-store",
          });

          if (!res.ok) {
            throw new Error(`Failed to load quiz: ${res.status}`);
          }

          const data = await res.json();
          questions = transformApiResponse(data);
        } else if (quizId) {
          const res = await fetch(API_ENDPOINTS.quizById(quizId), {
            signal,
            cache: "no-store",
          });

          if (!res.ok) {
            throw new Error(`Failed to load quiz: ${res.status}`);
          }

          const data = await res.json();
          questions = transformApiResponse(data);
        } else if (rawData) {
          questions = parseQuizParam(rawData);
        }

        dispatch((s) => ({
          ...s,
          questions,
          currentIndex: 0,
          answers: {},
          isSubmitted: false,
          isLoading: false,
          error: null,
        }));
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return; // Ignore aborted requests
        }

        console.error("[Quiz] Fetch error:", err);
        dispatch((s) => ({
          ...s,
          isLoading: false,
          error: err instanceof Error ? err.message : "Failed to load quiz",
        }));
      }
    }

    fetchQuiz();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [searchParams]);

  // Handlers
  const handleSelectAnswer = useCallback((answer: string) => {
    dispatch((s) => ({
      ...s,
      answers: { ...s.answers, [s.currentIndex]: answer },
    }));
  }, []);

  const handleNext = useCallback(() => {
    dispatch((s) => ({
      ...s,
      currentIndex: Math.min(s.currentIndex + 1, s.questions.length - 1),
    }));
  }, []);

  const handlePrev = useCallback(() => {
    dispatch((s) => ({
      ...s,
      currentIndex: Math.max(s.currentIndex - 1, 0),
    }));
  }, []);

  const handleSubmit = useCallback(() => {
    dispatch((s) => ({ ...s, isSubmitted: true }));
  }, []);

  const handleRestart = useCallback(() => {
    dispatch((s) => ({
      ...s,
      currentIndex: 0,
      answers: {},
      isSubmitted: false,
    }));
  }, []);

  const handleGoBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleGoHome = useCallback(() => {
    router.push("/homepage");
  }, [router]);

  const handleRetry = useCallback(() => {
    // Trigger refetch by forcing a state update
    dispatch((s) => ({ ...s, isLoading: true, error: null }));
    // Re-run the effect by navigating to same page
    router.refresh();
  }, [router]);

  // Render states
  if (isLoading) {
    return <QuizSkeleton />;
  }

  if (error) {
    return <QuizError message={error} onRetry={handleRetry} onGoBack={handleGoBack} />;
  }

  if (questions.length === 0) {
    return <EmptyQuiz onGoBack={handleGoBack} />;
  }

  if (isSubmitted) {
    return (
      <QuizResults
        questions={questions}
        answers={answers}
        onRestart={handleRestart}
        onGoHome={handleGoHome}
        onGoBack={handleGoBack}
      />
    );
  }

  return (
    <QuizQuestion
      question={currentQuestion}
      questionIndex={currentIndex}
      totalQuestions={questions.length}
      selectedAnswer={answers[currentIndex]}
      onSelectAnswer={handleSelectAnswer}
      onNext={handleNext}
      onPrev={handlePrev}
      onSubmit={handleSubmit}
      onGoBack={handleGoBack}
      canSubmit={allAnswered}
    />
  );
}

// -----------------------------------------------------------------------------
// Page Export with Suspense
// -----------------------------------------------------------------------------
export default function QuizPage() {
  return (
    <Suspense fallback={<QuizSkeleton />}>
      <QuizContent />
    </Suspense>
  );
}