import { fetchWithTimeoutAndRetry } from "@/lib/utils";
import { normalizeTopicKey, normalizeExamQuestion, shuffleArray, type ExamOption, type ExamQuestion } from "@/lib/exam-prep";

type LessonPayload = {
  quiz?: unknown;
  quiz_questions?: unknown;
  questions?: unknown;
  lesson_content?: Record<string, unknown> | null;
};

type GenerateInput = {
  topic: string;
  topicKey: string;
  missingCount: number;
  contextQuiz?: unknown;
  contextLesson?: Record<string, unknown> | null;
};

function resolveQuizAnswer(answerRaw: string, options: string[]): string | null {
  const answer = answerRaw.trim();
  if (!answer || options.length === 0) return null;
  if (options.includes(answer)) return answer;

  const ci = options.find((opt) => opt.toLowerCase() === answer.toLowerCase());
  if (ci) return ci;

  if (/^[A-Za-z]$/.test(answer)) {
    const idx = answer.toUpperCase().charCodeAt(0) - 65;
    if (idx >= 0 && idx < options.length) return options[idx];
  }

  if (/^\d+$/.test(answer)) {
    const n = Number.parseInt(answer, 10);
    if (!Number.isNaN(n)) {
      if (n >= 1 && n <= options.length) return options[n - 1];
      if (n >= 0 && n < options.length) return options[n];
    }
  }

  return null;
}

function buildOptions(correctAnswer: string, values: string[], explanation?: string): ExamOption[] {
  const selected = values.slice(0, 3);
  return selected.map((value, i) => {
    const label = (["A", "B", "C"][i] ?? "C") as "A" | "B" | "C";
    const isCorrect = value === correctAnswer;
    return {
      label,
      text: value,
      is_correct: isCorrect,
      explanation: isCorrect
        ? explanation?.trim() || "This option is correct based on the concept tested."
        : "This option is incorrect because it does not satisfy the concept being tested.",
    };
  });
}

function fromQuizLike(raw: Record<string, unknown>, topicKey: string): ExamQuestion | null {
  const q = typeof raw.q === "string" ? raw.q.trim() : typeof raw.question === "string" ? raw.question.trim() : "";
  const optionsRaw = Array.isArray(raw.options) ? raw.options : Array.isArray(raw.choices) ? raw.choices : [];
  const options = optionsRaw
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
  const answerRaw =
    typeof raw.answer === "string"
      ? raw.answer
      : typeof raw.correct === "string"
      ? raw.correct
      : typeof raw.correct_answer === "string"
      ? raw.correct_answer
      : "";
  const explanation = typeof raw.explanation === "string" ? raw.explanation : "";

  if (!q || options.length < 3 || !answerRaw) return null;
  const resolved = resolveQuizAnswer(answerRaw, options);
  if (!resolved) return null;

  const wrong = options.filter((item) => item !== resolved);
  if (wrong.length < 2) return null;
  const selected = shuffleArray([resolved, wrong[0], wrong[1]]);
  const normalized = normalizeExamQuestion({
    id: crypto.randomUUID(),
    topic_key: topicKey,
    subject_name: null,
    difficulty: "medium",
    question: q,
    options: buildOptions(resolved, selected, explanation),
  });

  return normalized;
}

function normalizeQuizArray(raw: unknown, topicKey: string): ExamQuestion[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => (row && typeof row === "object" ? fromQuizLike(row as Record<string, unknown>, topicKey) : null))
    .filter((item): item is ExamQuestion => Boolean(item));
}

function extractQuiz(payload: LessonPayload): unknown {
  if (Array.isArray(payload.questions)) return payload.questions;
  if (Array.isArray(payload.quiz_questions)) return payload.quiz_questions;
  if (Array.isArray(payload.quiz)) return payload.quiz;
  const lessonContent = payload.lesson_content;
  if (lessonContent && typeof lessonContent === "object" && Array.isArray((lessonContent as any).quiz)) {
    return (lessonContent as any).quiz;
  }
  return [];
}

function buildGenerationTopic(input: GenerateInput): string {
  const parts: string[] = [input.topic];
  if (Array.isArray(input.contextQuiz) && input.contextQuiz.length > 0) {
    const sample = input.contextQuiz
      .slice(0, 3)
      .map((item) => {
        const row = item as Record<string, unknown>;
        return typeof row.q === "string" ? row.q : typeof row.question === "string" ? row.question : "";
      })
      .filter(Boolean)
      .join(" | ");
    if (sample) parts.push(`Context quiz topics: ${sample}`);
  }
  return parts.join(" -- ");
}

export async function generateExamQuestions(input: GenerateInput): Promise<ExamQuestion[]> {
  const endpoint = `${(process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000").replace(/\/$/, "")}/api/structured-lesson`;
  const target = Math.max(3, Math.min(20, input.missingCount + 3));
  const deduped = new Map<string, ExamQuestion>();

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetchWithTimeoutAndRetry(
      endpoint,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: buildGenerationTopic(input),
          generate_video: false,
          skip_video: true,
          generate_quiz: true,
          requested_question_count: target,
        }),
      },
      { timeoutMs: 45_000, retries: 1, retryDelayMs: 500 }
    );

    if (!response.ok) {
      continue;
    }

    const payload = (await response.json().catch(() => ({}))) as LessonPayload;
    const quiz = extractQuiz(payload);
    const parsed = normalizeQuizArray(quiz, normalizeTopicKey(input.topicKey));

    for (const question of parsed) {
      deduped.set(question.question.trim().toLowerCase(), question);
    }

    if (deduped.size >= input.missingCount) break;
  }

  return Array.from(deduped.values()).slice(0, input.missingCount);
}

export function generateEmergencyExamQuestions(input: { topic: string; topicKey: string; count: number }): ExamQuestion[] {
  const topicLabel = input.topic.trim() || "this topic";
  const templates = [
    {
      question: `Which statement best describes ${topicLabel}?`,
      correct: `It is studied through core concepts, examples, and practice.`,
      wrong1: `It can only be understood by memorizing definitions without examples.`,
      wrong2: `It has no practical use in learning or real-life application.`,
      explanation: `Understanding ${topicLabel} requires concept clarity and guided practice.`,
    },
    {
      question: `What is the most effective first step to learn ${topicLabel}?`,
      correct: `Start with the fundamental concepts and simple examples.`,
      wrong1: `Skip fundamentals and begin with the hardest problems only.`,
      wrong2: `Avoid practice and rely only on reading once.`,
      explanation: `Foundational understanding and simple examples improve long-term mastery.`,
    },
    {
      question: `Why are worked examples useful when learning ${topicLabel}?`,
      correct: `They show how to apply concepts step by step.`,
      wrong1: `They replace all need for independent practice forever.`,
      wrong2: `They are only useful after full mastery is already achieved.`,
      explanation: `Worked examples bridge theory to application and reduce confusion.`,
    },
    {
      question: `How should mistakes in ${topicLabel} practice be handled?`,
      correct: `Review the error, understand why it happened, and retry.`,
      wrong1: `Ignore mistakes and continue without reflection.`,
      wrong2: `Memorize answers without checking the reasoning.`,
      explanation: `Error analysis improves understanding and prevents repeated mistakes.`,
    },
    {
      question: `What does strong progress in ${topicLabel} usually include?`,
      correct: `Consistent practice, feedback, and revision over time.`,
      wrong1: `One-time studying with no revision.`,
      wrong2: `Only watching explanations without trying questions.`,
      explanation: `Learning improves with repetition, feedback, and active recall.`,
    },
  ];

  const questions: ExamQuestion[] = [];
  let idx = 0;
  while (questions.length < input.count) {
    const t = templates[idx % templates.length];
    const options = shuffleArray([t.correct, t.wrong1, t.wrong2]);
    const examOptions: ExamOption[] = options.map((text, i) => {
      const label = (["A", "B", "C"][i] ?? "C") as "A" | "B" | "C";
      const isCorrect = text === t.correct;
      return {
        label,
        text,
        is_correct: isCorrect,
        explanation: isCorrect
          ? t.explanation
          : `This option is not correct because it does not follow an effective learning approach for ${topicLabel}.`,
      };
    });

    const normalized = normalizeExamQuestion({
      id: crypto.randomUUID(),
      topic_key: normalizeTopicKey(input.topicKey),
      subject_name: null,
      difficulty: "easy",
      question: `${t.question} (${Math.floor(idx / templates.length) + 1})`,
      options: examOptions,
    });
    if (normalized) questions.push(normalized);
    idx += 1;
  }

  return questions.slice(0, input.count);
}
