import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { normalizeQuizQuestions } from '@/lib/api/learning-utils';

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
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: topic } = await supabase.from('topics').select('id').eq('id', id).eq('user_id', user.id).maybeSingle();
      if (topic) {
        const { data: savedQuiz } = await supabase
          .from('quiz_questions')
          .select('questions')
          .eq('topic_id', id)
          .order('generated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const normalized = normalizeQuizQuestions(savedQuiz?.questions as any);
        if (normalized.length > 0) {
          return NextResponse.json(normalized);
        }
      }
    }

    const quiz = store.get(id);
    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }
    return NextResponse.json(quiz);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ok = store.delete(id);
  return NextResponse.json({ deleted: ok });
}
