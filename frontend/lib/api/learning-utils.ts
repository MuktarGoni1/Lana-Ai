import { fetchWithTimeoutAndRetry } from '@/lib/utils';

export type QuizQuestion = {
  q: string;
  options: string[];
  answer: string;
  explanation?: string;
};

function resolveAnswerToOption(answerRaw: string, options: string[]): string | null {
  const answer = answerRaw.trim();
  if (!answer || options.length === 0) return null;

  // Exact match first.
  if (options.includes(answer)) return answer;

  // Case-insensitive option match.
  const ci = options.find((opt) => opt.toLowerCase() === answer.toLowerCase());
  if (ci) return ci;

  // Letter labels: A/B/C/D...
  if (/^[A-Za-z]$/.test(answer)) {
    const idx = answer.toUpperCase().charCodeAt(0) - 65;
    if (idx >= 0 && idx < options.length) return options[idx];
    return null;
  }

  // Numeric labels: supports both 1-based and 0-based indexing.
  if (/^\d+$/.test(answer)) {
    const n = Number.parseInt(answer, 10);
    if (Number.isNaN(n)) return null;
    if (n >= 1 && n <= options.length) return options[n - 1];
    if (n >= 0 && n < options.length) return options[n];
  }

  return null;
}

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
    const resolvedAnswer = resolveAnswerToOption(answerRaw.slice(0, MAX_OPT_LEN), options);
    const explanation = typeof raw.explanation === 'string' ? raw.explanation.trim().slice(0, MAX_Q_LEN) : undefined;

    if (!q || !resolvedAnswer || options.length < MIN_OPTIONS) continue;

    cleaned.push({ q, options, answer: resolvedAnswer, explanation });
  }

  return cleaned;
}

export async function generateStructuredLesson(topic: string, age?: number | null): Promise<any> {
  const lessonUrl = 'https://api.lanamind.com/api/structured-lesson';

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
