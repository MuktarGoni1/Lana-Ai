import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';

const BodySchema = z.object({
  videoUrl: z.string().url(),
});

export async function POST(req: Request, { params }: { params: Promise<{ topicId: string }> }) {
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

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
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

    const nowIso = new Date().toISOString();
    const db = supabase as any;
    const { data, error } = await db
      .from('lesson_units')
      .upsert(
        {
          topic_id: topicId,
          video_url: parsed.data.videoUrl,
          refreshed_at: nowIso,
          is_ready: true,
        },
        { onConflict: 'topic_id' }
      )
      .select('id, topic_id, video_url, refreshed_at')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('[lesson/:topicId/video POST] error:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}