import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';

const TopicSchema = z.object({
  title: z.string().trim().min(1).max(200),
});

const SubjectSchema = z.object({
  subject: z.string().trim().min(1).max(120),
  topics: z.array(TopicSchema).min(1).max(12),
});

const BodySchema = z.object({
  subjectPlan: SubjectSchema.optional(),
  subjectPlans: z.array(SubjectSchema).min(1).max(5).optional(),
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

    const subjectPlans = parsed.data.subjectPlans ?? (parsed.data.subjectPlan ? [parsed.data.subjectPlan] : []);
    if (subjectPlans.length === 0) {
      return NextResponse.json({ error: 'Invalid payload', details: 'At least one subject plan is required.' }, { status: 400 });
    }

    const seenSubjects = new Set<string>();
    for (const plan of subjectPlans) {
      const normalized = plan.subject.trim().toLowerCase();
      if (seenSubjects.has(normalized)) {
        return NextResponse.json({ error: 'Duplicate subjects are not allowed.' }, { status: 400 });
      }
      seenSubjects.add(normalized);

      const seenTopics = new Set<string>();
      for (const topic of plan.topics) {
        const normalizedTopic = topic.title.trim().toLowerCase();
        if (seenTopics.has(normalizedTopic)) {
          return NextResponse.json({ error: `Duplicate topics are not allowed in ${plan.subject}.` }, { status: 400 });
        }
        seenTopics.add(normalizedTopic);
      }
    }

    const nowIso = new Date().toISOString();
    const db = supabase as any;

    const { data: profile } = await db.from('profiles').select('grade').eq('id', user.id).maybeSingle();
    const { data: existingLearning } = await db
      .from('user_learning_profiles')
      .select('learning_profile')
      .eq('user_id', user.id)
      .maybeSingle();

    const alreadyComplete = Boolean(existingLearning?.learning_profile?.learner_preferences?.onboarding_complete);
    if (alreadyComplete) {
      return NextResponse.json({ success: true, data: { already_complete: true } });
    }

    for (const plan of subjectPlans) {
      const subject = plan.subject.trim();
      const topics = plan.topics;
      const syllabus = topics.map((t) => t.title).join('\n');

      const { data: existingPlan } = await db
        .from('term_plans')
        .select('id')
        .eq('user_id', user.id)
        .eq('subject', subject)
        .eq('raw_syllabus', syllabus)
        .limit(1)
        .maybeSingle();

      let planId = existingPlan?.id as string | undefined;

      if (!planId) {
        const { data: createdPlan, error: planError } = await db
          .from('term_plans')
          .insert({
            user_id: user.id,
            subject,
            grade: profile?.grade ?? null,
            term: "general",
            raw_syllabus: syllabus,
            updated_at: nowIso,
          })
          .select('id')
          .single();

        if (planError || !createdPlan) {
          return NextResponse.json({ error: planError?.message || 'Failed to create term plan' }, { status: 500 });
        }

        planId = createdPlan.id;
      }

      const { data: existingTopics } = await db
        .from('topics')
        .select('id')
        .eq('user_id', user.id)
        .eq('term_plan_id', planId);

      if (!existingTopics || existingTopics.length === 0) {
        const topicRows = topics.map((t, idx) => ({
          user_id: user.id,
          term_plan_id: planId,
          subject_name: subject,
          title: t.title,
          week_number: idx + 1,
          order_index: idx,
          status: idx === 0 ? 'available' : 'locked',
          updated_at: nowIso,
        }));

        const { error: topicError } = await db.from('topics').insert(topicRows);
        if (topicError) {
          return NextResponse.json({ error: topicError.message }, { status: 500 });
        }
      }
    }

    const existingProfile = existingLearning?.learning_profile ?? {};
    const learnerPreferences = {
      ...(existingProfile.learner_preferences ?? {}),
      onboarding_step: 4,
      onboarding_complete: true,
    };

    await db.from('user_learning_profiles').upsert(
      {
        user_id: user.id,
        learning_profile: {
          ...existingProfile,
          learner_preferences: learnerPreferences,
        },
        updated_at: nowIso,
      },
      { onConflict: 'user_id' }
    );

    const { error: authUpdateError } = await supabase.auth.updateUser({
      data: {
        onboarding_complete: true,
        onboarding_step: 4,
      },
    });

    if (authUpdateError) {
      return NextResponse.json({ error: authUpdateError.message }, { status: 500 });
    }

    // Do not set cookie to avoid stale data issues - rely solely on user metadata
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[onboarding/complete POST] error:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
