import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';

const BodySchema = z.object({
  topicId: z.string().uuid(),
  forceRefresh: z.boolean().optional().default(false),
});

function isMissingLessonGenerationJobsTable(errorMessage: string | undefined) {
  if (!errorMessage) return false;
  return errorMessage.includes("lesson_generation_jobs") && errorMessage.includes("schema cache");
}


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

    const nowIso = new Date().toISOString();
    const db = supabase as any;

    const { data: activeJob, error: activeJobError } = await db
      .from('lesson_generation_jobs')
      .select('id, status, topic_id, created_at')
      .eq('user_id', user.id)
      .eq('topic_id', topicId)
      .in('status', ['queued', 'processing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (activeJobError) {
      if (isMissingLessonGenerationJobsTable(activeJobError.message)) {
        return NextResponse.json(
          {
            error: 'Lesson generation queue table is unavailable. Falling back to direct generation is required.',
            code: 'LESSON_GENERATION_QUEUE_MISSING',
          },
          { status: 501 }
        );
      }
      return NextResponse.json({ error: activeJobError.message }, { status: 500 });
    }

    if (activeJob) {
      return NextResponse.json({
        success: true,
        data: {
          jobId: activeJob.id,
          status: activeJob.status,
          topicId: activeJob.topic_id,
          createdAt: activeJob.created_at,
          reused: true,
        },
      });
    }

    const { data: job, error: jobError } = await db
      .from('lesson_generation_jobs')
      .insert({
        user_id: user.id,
        topic_id: topicId,
        status: 'queued',
        force_refresh: forceRefresh,
        updated_at: nowIso,
      })
      .select('id, status, topic_id, created_at')
      .single();

    if (jobError || !job) {
      if (isMissingLessonGenerationJobsTable(jobError?.message)) {
        return NextResponse.json(
          {
            error: 'Lesson generation queue table is unavailable. Falling back to direct generation is required.',
            code: 'LESSON_GENERATION_QUEUE_MISSING',
          },
          { status: 501 }
        );
      }
      return NextResponse.json({ error: jobError?.message || 'Failed to create generation job' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        jobId: job.id,
        status: job.status,
        topicId: job.topic_id,
        createdAt: job.created_at,
      },
    });
  } catch (error: any) {
    console.error('[lesson/generate-job POST] error:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
