import { fetchWithTimeoutAndRetry } from '@/lib/utils';

export type QuizQuestion = {
  q: string;
  options: string[];
  answer: string;
  explanation?: string;
};

export function normalizeQuizQuestions(input: unknown): QuizQuestion[] {
  if (!Array.isArray(input)) return [];

  const MAX_QUESTIONS = 20;
  const MAX_Q_LEN = 500;
  const MAX_OPT_LEN = 200;
  const MIN_OPTIONS = 2;
  const MAX_OPTIONS = 8;

  const cleaned: QuizQuestion[] = [];

  for (const item of input.slice(0, MAX_QUESTIONS)) {
    if (!item || typeof item !== 'object') continue;
    const raw = item as Record<string, unknown>;

    const qRaw = typeof raw.q === 'string' ? raw.q : typeof raw.question === 'string' ? raw.question : '';
    const answerRaw =
      typeof raw.answer === 'string' ? raw.answer : typeof raw.correct === 'string' ? raw.correct : '';

    const optionsRaw = Array.isArray(raw.options)
      ? raw.options
      : Array.isArray(raw.choices)
      ? raw.choices
      : [];

    const options = optionsRaw
      .filter((x): x is string => typeof x === 'string')
      .map((x) => x.trim().slice(0, MAX_OPT_LEN))
      .filter(Boolean)
      .slice(0, MAX_OPTIONS);

    const q = qRaw.trim().slice(0, MAX_Q_LEN);
    const answer = answerRaw.trim().slice(0, MAX_OPT_LEN);
    const explanation = typeof raw.explanation === 'string' ? raw.explanation.trim().slice(0, MAX_Q_LEN) : undefined;

    if (!q || !answer || options.length < MIN_OPTIONS) continue;
    if (!options.includes(answer)) continue;

    cleaned.push({ q, options, answer, explanation });
  }

  return cleaned;
}

export async function generateStructuredLesson(topic: string, age?: number | null): Promise<any> {
  const backendBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';
  const lessonUrl = `${backendBase.replace(/\/$/, '')}/api/structured-lesson`;

  const response = await fetchWithTimeoutAndRetry(
    lessonUrl,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, age }),
    },
    { timeoutMs: 30_000, retries: 2, retryDelayMs: 500 }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Lesson generation failed (${response.status}): ${text.slice(0, 200)}`);
  }

  return response.json();
}

