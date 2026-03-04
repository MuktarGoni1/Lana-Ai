import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(_: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;
    const supabase = await createServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [{ data: plans, error: planError }, { data: topics, error: topicsError }, { data: attempts, error: attemptsError }] =
      await Promise.all([
        supabase.from('term_plans').select('id, subject, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase
          .from('topics')
          .select('id, term_plan_id, status, subject_name, title, week_number, completed_at')
          .eq('user_id', userId),
        supabase
          .from('quiz_attempts')
          .select('id, topic_id, score, total, attempted_at')
          .eq('user_id', userId)
          .order('attempted_at', { ascending: false }),
      ]);

    if (planError || topicsError || attemptsError) {
      return NextResponse.json({ error: planError?.message || topicsError?.message || attemptsError?.message }, { status: 500 });
    }

    const topicList = topics ?? [];
    const attemptList = attempts ?? [];

    const totals = {
      total_topics: topicList.length,
      completed_topics: topicList.filter((t) => t.status === 'completed').length,
      in_progress_topics: topicList.filter((t) => t.status === 'in_progress').length,
      available_topics: topicList.filter((t) => t.status === 'available').length,
      locked_topics: topicList.filter((t) => t.status === 'locked').length,
    };

    const completionPercent = totals.total_topics > 0 ? Math.round((totals.completed_topics / totals.total_topics) * 100) : 0;

    const byTopicBest = new Map<string, { score: number; total: number; attempted_at: string | null }>();
    for (const a of attemptList) {
      const existing = byTopicBest.get(a.topic_id);
      const pct = a.total > 0 ? a.score / a.total : 0;
      const existingPct = existing && existing.total > 0 ? existing.score / existing.total : -1;
      if (!existing || pct >= existingPct) {
        byTopicBest.set(a.topic_id, { score: a.score, total: a.total, attempted_at: a.attempted_at });
      }
    }

    const recentAttempts = attemptList.slice(0, 10);

    return NextResponse.json({
      success: true,
      data: {
        user_id: userId,
        summary: { ...totals, completion_percent: completionPercent },
        term_plans: plans ?? [],
        recent_attempts: recentAttempts,
        best_scores_by_topic: Array.from(byTopicBest.entries()).map(([topic_id, scoreData]) => ({ topic_id, ...scoreData })),
      },
    });
  } catch (error: any) {
    console.error('[progress/:userId] error:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

