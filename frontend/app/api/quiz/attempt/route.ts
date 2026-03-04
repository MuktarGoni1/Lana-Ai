import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';

const BodySchema = z.object({
  topicId: z.string().uuid(),
  score: z.number().int().min(0),
  total: z.number().int().min(1),
  answers: z.unknown().optional(),
});

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
    }

    const { topicId, score, total, answers } = parsed.data;
    if (score > total) {
      return NextResponse.json({ error: 'Score cannot be greater than total' }, { status: 400 });
    }

    const { data: topic, error: topicError } = await supabase
      .from('topics')
      .select('id')
      .eq('id', topicId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (topicError) {
      return NextResponse.json({ error: topicError.message }, { status: 500 });
    }
    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    const { data: attempt, error: attemptError } = await supabase
      .from('quiz_attempts')
      .insert([
        {
          topic_id: topicId,
          user_id: user.id,
          score,
          total,
          answers: answers ?? null,
        },
      ])
      .select()
      .single();

    if (attemptError) {
      return NextResponse.json({ error: attemptError.message }, { status: 500 });
    }

    const { data: allAttempts } = await supabase
      .from('quiz_attempts')
      .select('score, total')
      .eq('topic_id', topicId)
      .eq('user_id', user.id);

    let bestPercent = 0;
    for (const a of allAttempts ?? []) {
      const pct = a.total > 0 ? (a.score / a.total) * 100 : 0;
      if (pct > bestPercent) bestPercent = pct;
    }

    return NextResponse.json({
      success: true,
      data: attempt,
      meta: { best_score_percent: Math.round(bestPercent), attempt_count: allAttempts?.length ?? 1 },
    });
  } catch (error: any) {
    console.error('[quiz/attempt] error:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

