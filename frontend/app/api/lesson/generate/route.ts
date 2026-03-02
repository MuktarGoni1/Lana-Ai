import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { generateStructuredLesson, normalizeQuizQuestions } from '@/lib/api/learning-utils';

const BodySchema = z.object({
  topicId: z.string().uuid(),
  forceRefresh: z.boolean().optional().default(false),
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

    const { topicId, forceRefresh } = parsed.data;

    const { data: topic, error: topicError } = await supabase
      .from('topics')
      .select('id, user_id, title')
      .eq('id', topicId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (topicError) {
      return NextResponse.json({ error: topicError.message }, { status: 500 });
    }
    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    const { data: existingUnit, error: existingError } = await supabase
      .from('lesson_units')
      .select('id, lesson_content, is_ready, generated_at, refreshed_at')
      .eq('topic_id', topic.id)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    if (existingUnit && existingUnit.is_ready && !forceRefresh) {
      return NextResponse.json({
        success: true,
        data: existingUnit,
        meta: { generated: false, cached: true, topic_id: topic.id },
      });
    }

    const { data: profile } = await supabase.from('profiles').select('age').eq('id', user.id).maybeSingle();
    const lessonContent = await generateStructuredLesson(topic.title, profile?.age ?? null);

    const nowIso = new Date().toISOString();
    const upsertPayload = existingUnit
      ? {
          id: existingUnit.id,
          topic_id: topic.id,
          lesson_content: lessonContent,
          is_ready: true,
          refreshed_at: nowIso,
        }
      : {
          topic_id: topic.id,
          lesson_content: lessonContent,
          is_ready: true,
          generated_at: nowIso,
        };

    const { data: savedUnit, error: unitSaveError } = await supabase
      .from('lesson_units')
      .upsert(upsertPayload)
      .select()
      .single();

    if (unitSaveError) {
      return NextResponse.json({ error: unitSaveError.message }, { status: 500 });
    }

    const quiz = normalizeQuizQuestions((lessonContent as any)?.quiz);
    if (quiz.length > 0) {
      await supabase.from('quiz_questions').delete().eq('topic_id', topic.id);
      await supabase.from('quiz_questions').insert([{ topic_id: topic.id, questions: quiz }]);
    }

    await supabase
      .from('topics')
      .update({ status: 'in_progress', unlocked_at: nowIso, updated_at: nowIso })
      .eq('id', topic.id)
      .in('status', ['available', 'locked']);

    return NextResponse.json({
      success: true,
      data: savedUnit,
      meta: { generated: true, cached: false, topic_id: topic.id },
    });
  } catch (error: any) {
    console.error('[lesson/generate] error:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

