import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/api-auth';
import { processLessonGenerationJob } from '@/lib/api/lesson-generation';

export async function GET(req: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId } = await params;
    const { supabase, user, unauthorized } = await requireApiUser(req);

    if (unauthorized || !user) {
      return unauthorized ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = supabase as any;
    const { data: initialJob, error: initialError } = await db
      .from('lesson_generation_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (initialError) {
      return NextResponse.json({ error: initialError.message }, { status: 500 });
    }

    if (!initialJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    let job = initialJob;
    if (job.status === 'queued' || job.status === 'processing') {
      job = await processLessonGenerationJob(db, jobId, user.id);
    }

    const generationStatus =
      job.status === 'completed'
        ? 'ready'
        : job.status === 'failed'
        ? 'failed'
        : 'processing';

    return NextResponse.json({
      success: true,
      data: {
        jobId: job.id,
        status: job.status,
        generation_status: generationStatus,
        topicId: job.topic_id,
        lessonUnitId: job.result_lesson_unit_id ?? null,
        errorCode: job.error_code ?? null,
        errorMessage: job.error_message ?? null,
        canRetry: job.status === 'failed',
        updatedAt: job.updated_at,
      },
    });
  } catch (error: any) {
    console.error('[lesson/generate-job/:jobId GET] error:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}