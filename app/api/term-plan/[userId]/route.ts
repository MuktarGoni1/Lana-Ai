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

    const [{ data: termPlans, error: planError }, { data: topics, error: topicsError }] = await Promise.all([
      supabase
        .from('term_plans')
        .select('id, user_id, subject, grade, term, raw_syllabus, created_at, updated_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('topics')
        .select('id, user_id, term_plan_id, subject_name, title, week_number, order_index, status, unlocked_at, completed_at, created_at, updated_at')
        .eq('user_id', userId)
        .order('week_number', { ascending: true })
        .order('order_index', { ascending: true }),
    ]);

    if (planError || topicsError) {
      return NextResponse.json({ error: planError?.message || topicsError?.message }, { status: 500 });
    }

    const topicsByPlanId = new Map<string, any[]>();
    for (const topic of topics ?? []) {
      const key = topic.term_plan_id || 'unassigned';
      if (!topicsByPlanId.has(key)) topicsByPlanId.set(key, []);
      topicsByPlanId.get(key)!.push(topic);
    }

    const plansWithTopics = (termPlans ?? []).map((plan) => ({
      ...plan,
      topics: topicsByPlanId.get(plan.id) ?? [],
    }));

    return NextResponse.json({
      success: true,
      data: {
        user_id: userId,
        term_plans: plansWithTopics,
      },
    });
  } catch (error: any) {
    console.error('[term-plan/:userId] error:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

