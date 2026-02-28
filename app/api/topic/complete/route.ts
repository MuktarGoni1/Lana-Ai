import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';

const BodySchema = z.object({
  topicId: z.string().uuid(),
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

    const { topicId } = parsed.data;
    const nowIso = new Date().toISOString();

    const { data: topic, error: topicError } = await supabase
      .from('topics')
      .select('id, term_plan_id, order_index')
      .eq('id', topicId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (topicError) {
      return NextResponse.json({ error: topicError.message }, { status: 500 });
    }
    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    const { error: completeError } = await supabase
      .from('topics')
      .update({ status: 'completed', completed_at: nowIso, updated_at: nowIso })
      .eq('id', topic.id)
      .eq('user_id', user.id);

    if (completeError) {
      return NextResponse.json({ error: completeError.message }, { status: 500 });
    }

    let nextTopic: { id: string } | null = null;
    if (topic.term_plan_id) {
      const { data: next } = await supabase
        .from('topics')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('term_plan_id', topic.term_plan_id)
        .gt('order_index', topic.order_index ?? 0)
        .order('order_index', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (next?.id) {
        nextTopic = { id: next.id };
        if (next.status === 'locked') {
          await supabase
            .from('topics')
            .update({ status: 'available', unlocked_at: nowIso, updated_at: nowIso })
            .eq('id', next.id)
            .eq('user_id', user.id);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: { topic_id: topic.id, completed_at: nowIso, next_topic_id: nextTopic?.id ?? null },
    });
  } catch (error: any) {
    console.error('[topic/complete] error:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

