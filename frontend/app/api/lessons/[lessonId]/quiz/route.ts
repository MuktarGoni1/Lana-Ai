import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { normalizeQuizQuestions } from '@/lib/api/learning-utils';

export async function GET(request: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  try {
    const { lessonId } = await params;
    const supabase = await createServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: topic } = await supabase
      .from('topics')
      .select('id')
      .eq('id', lessonId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!topic) {
      return NextResponse.json({ error: 'Lesson/topic not found' }, { status: 404 });
    }

    const { data: quizRow, error: quizError } = await supabase
      .from('quiz_questions')
      .select('questions')
      .eq('topic_id', lessonId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (quizError) {
      return NextResponse.json({ error: quizError.message }, { status: 500 });
    }

    const quiz = normalizeQuizQuestions(quizRow?.questions as any);

    if (!quiz || quiz.length === 0) {
      return NextResponse.json(
        { error: 'Quiz not found for this lesson' }, 
        { status: 404 }
      );
    }

    return NextResponse.json(quiz, { status: 200 });
  } catch (error) {
    console.error('Error fetching quiz by lesson ID:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quiz' }, 
      { status: 500 }
    );
  }
}

// Allow CORS for local development
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
