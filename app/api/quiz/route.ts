import { NextResponse } from 'next/server';

type Question = {
  q: string;
  options: string[];
  answer: string;
  explanation?: string;
};

// Simple in-memory store for short-lived quiz payloads
const store: Map<string, Question[]> = (globalThis as any).__QUIZ_STORE ?? new Map();
(globalThis as any).__QUIZ_STORE = store;

function validateQuizPayload(payload: unknown): Question[] | null {
  if (!Array.isArray(payload)) return null;
  const MAX_QUESTIONS = 50;
  const MAX_Q_LEN = 500;
  const MAX_OPT_LEN = 200;
  const MIN_OPTIONS = 2;
  const MAX_OPTIONS = 10;

  const cleaned: Question[] = [];
  for (const item of payload.slice(0, MAX_QUESTIONS)) {
    if (!item || typeof item !== 'object') continue;
    const anyItem = item as any;
    const q = typeof anyItem.q === 'string' ? anyItem.q.trim().slice(0, MAX_Q_LEN) : null;
    const options = Array.isArray(anyItem.options)
      ? anyItem.options
          .filter((o: unknown) => typeof o === 'string')
          .map((o: string) => o.trim().slice(0, MAX_OPT_LEN))
      : null;
    const answer = typeof anyItem.answer === 'string' ? anyItem.answer.trim().slice(0, MAX_OPT_LEN) : null;
    const explanation = typeof anyItem.explanation === 'string' ? anyItem.explanation.trim().slice(0, MAX_Q_LEN) : undefined;

    if (!q || !options || options.length < MIN_OPTIONS || options.length > MAX_OPTIONS || !answer) continue;
    if (!options.includes(answer)) continue;

    cleaned.push({ q, options, answer, explanation });
  }
  return cleaned.length ? cleaned : null;
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const quiz = validateQuizPayload(payload);
    if (!quiz) {
      return NextResponse.json({ error: 'Invalid quiz payload' }, { status: 400 });
    }
    const id = (globalThis.crypto?.randomUUID && globalThis.crypto.randomUUID()) || Math.random().toString(36).slice(2, 10);
    store.set(id, quiz);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error('Quiz POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}