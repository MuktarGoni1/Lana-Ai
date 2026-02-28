import { NextResponse } from 'next/server';
import { requireAuth, unauthorizedResponse } from '@/lib/api-auth';
import { createServerClient } from '@/lib/supabase/server';
import { normalizeQuizQuestions } from '@/lib/api/learning-utils';

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
    // Check authentication first
    const user = await requireAuth();
    if (!user) {
      return unauthorizedResponse();
    }

    const payload = await req.json();
    const topicId = typeof payload?.topicId === 'string' ? payload.topicId : null;
    const rawQuiz = Array.isArray(payload) ? payload : payload?.questions;
    const quiz = validateQuizPayload(rawQuiz);
    if (!quiz) {
      return NextResponse.json({ error: 'Invalid quiz payload' }, { status: 400 });
    }

    if (topicId) {
      const supabase = await createServerClient();
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (currentUser) {
        const { data: topic } = await supabase
          .from('topics')
          .select('id')
          .eq('id', topicId)
          .eq('user_id', currentUser.id)
          .maybeSingle();

        if (topic) {
          await supabase.from('quiz_questions').delete().eq('topic_id', topicId);
          const { data: saved, error: saveError } = await supabase
            .from('quiz_questions')
            .insert([{ topic_id: topicId, questions: quiz }])
            .select('topic_id')
            .single();

          if (!saveError && saved) {
            return NextResponse.json({ id: saved.topic_id, topicId: saved.topic_id }, { status: 201 });
          }
        }
      }
    }

    const id = (globalThis.crypto?.randomUUID && globalThis.crypto.randomUUID()) || Math.random().toString(36).slice(2, 10);
    store.set(id, quiz);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error('Quiz POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Add GET endpoint to retrieve quizzes
export async function GET(req: Request) {
  try {
    // Check authentication first
    const user = await requireAuth();
    if (!user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Missing quiz ID' }, { status: 400 });
    }
    
    const supabase = await createServerClient();
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (currentUser) {
      const { data: topic } = await supabase.from('topics').select('id').eq('id', id).eq('user_id', currentUser.id).maybeSingle();
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
          return NextResponse.json(normalized, { status: 200 });
        }
      }
    }

    const quiz = store.get(id);
    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    return NextResponse.json(quiz, { status: 200 });
  } catch (error) {
    console.error('Quiz GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
