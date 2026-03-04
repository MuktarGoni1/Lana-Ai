import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(_: Request, { params }: { params: Promise<{ topicId: string }> }) {
  try {
    const { topicId } = await params;
    const supabase = await createServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    const { data: activeJob } = await db
      .from('lesson_generation_jobs')
      .select('id, status, topic_id, created_at')
      .eq('user_id', user.id)
      .eq('topic_id', topicId)
      .in('status', ['queued', 'processing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

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
        force_refresh: true,
        updated_at: new Date().toISOString(),
      })
      .select('id, status, topic_id, created_at')
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: jobError?.message || 'Failed to create regeneration job' }, { status: 500 });
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
    console.error('[lesson/:topicId/regenerate POST] error:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
