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

    if (!forceRefresh) {
      const { data: existing } = await supabase
        .from('quiz_questions')
        .select('id, topic_id, questions, generated_at')
        .eq('topic_id', topic.id)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({
          success: true,
          data: existing,
          meta: { generated: false, cached: true, topic_id: topic.id },
        });
      }
    }

    let questions = [] as ReturnType<typeof normalizeQuizQuestions>;

    const { data: lessonUnit } = await supabase
      .from('lesson_units')
      .select('lesson_content')
      .eq('topic_id', topic.id)
      .maybeSingle();

    questions = normalizeQuizQuestions((lessonUnit?.lesson_content as any)?.quiz);

    if (questions.length === 0) {
      const { data: profile } = await supabase.from('profiles').select('age').eq('id', user.id).maybeSingle();
      const generatedLesson = await generateStructuredLesson(topic.title, profile?.age ?? null);
      questions = normalizeQuizQuestions((generatedLesson as any)?.quiz);
    }

    if (questions.length === 0) {
      return NextResponse.json({ error: 'Quiz generation returned no valid questions' }, { status: 502 });
    }

    await supabase.from('quiz_questions').delete().eq('topic_id', topic.id);
    const { data: savedQuiz, error: saveError } = await supabase
      .from('quiz_questions')
      .insert([{ topic_id: topic.id, questions }])
      .select()
      .single();

    if (saveError) {
      return NextResponse.json({ error: saveError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: savedQuiz,
      meta: { generated: true, cached: false, topic_id: topic.id },
    });
  } catch (error: any) {
    console.error('[quiz/generate] error:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

