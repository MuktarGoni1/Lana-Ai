import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { qualityCheckLesson, validateLessonPayload } from '@/lib/api/lesson-schema';


function isMissingLessonGenerationJobsTable(errorMessage: string | undefined) {
  if (!errorMessage) return false;
  return errorMessage.includes('lesson_generation_jobs') && errorMessage.includes('schema cache');
}


export async function GET(_: Request, { params }: { params: Promise<{ topicId: string }> }) {
  try {
    const { topicId } = await params;
    const supabase = await createServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          details: 'No server session found. Refresh login or call /api/auth/sync-session before loading lesson state.',
        },
        { status: 401 }
      );
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

    const db = supabase as any;
    const [{ data: unit, error: unitError }, { data: latestJob, error: latestJobError }] = await Promise.all([
      db.from('lesson_units').select('*').eq('topic_id', topicId).maybeSingle(),
      db
        .from('lesson_generation_jobs')
        .select('id, status, error_code, error_message, updated_at')
        .eq('topic_id', topicId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (unitError) {
      return NextResponse.json({ error: unitError.message }, { status: 500 });
    }

    if (latestJobError && !isMissingLessonGenerationJobsTable(latestJobError.message)) {
      return NextResponse.json({ error: latestJobError.message }, { status: 500 });
    }

    const generationStatus = latestJob?.status === 'failed'
      ? 'failed'
      : latestJob?.status === 'queued' || latestJob?.status === 'processing'
      ? 'processing'
      : unit
      ? 'ready'
      : 'missing';

    if (!unit) {
      return NextResponse.json(
        {
          success: false,
          error: 'Lesson unit not generated for this topic',
          meta: {
            generated: false,
            cached: false,
            generation_status: generationStatus,
            quality_status: 'invalid',
            can_retry: generationStatus === 'failed',
            job: latestJob
              ? {
                  id: latestJob.id,
                  status: latestJob.status,
                  error_code: latestJob.error_code,
                  error_message: latestJob.error_message,
                }
              : null,
          },
        },
        { status: 404 }
      );
    }

    const validation = validateLessonPayload(unit.lesson_content);
    const quality = validation.ok ? qualityCheckLesson(validation.data) : { ok: false as const };
    const qualityStatus = validation.ok && quality.ok ? 'valid' : 'invalid';

    return NextResponse.json({
      success: true,
      data: unit,
      meta: {
        generated: true,
        cached: true,
        topic_id: topicId,
        generation_status: generationStatus,
        quality_status: qualityStatus,
        can_retry: qualityStatus === 'invalid' || generationStatus === 'failed',
        job: latestJob
          ? {
              id: latestJob.id,
              status: latestJob.status,
              error_code: latestJob.error_code,
              error_message: latestJob.error_message,
            }
          : null,
      },
    });
  } catch (error: any) {
    console.error('[lesson/:topicId] error:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
