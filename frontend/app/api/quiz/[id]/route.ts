import { NextResponse } from 'next/server';

type Question = {
  q: string;
  options: string[];
  answer: string;
  explanation?: string;
};

// Reference the same in-memory store
const store: Map<string, Question[]> = (globalThis as any).__QUIZ_STORE ?? new Map();
(globalThis as any).__QUIZ_STORE = store;

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quiz = store.get(id);
  if (!quiz) {
    return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
  }
  return NextResponse.json(quiz);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ok = store.delete(id);
  return NextResponse.json({ deleted: ok });
}