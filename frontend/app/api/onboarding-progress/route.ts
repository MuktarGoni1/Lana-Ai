import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';

const ProgressSchema = z.object({
  onboarding_step: z.number().int().min(1).max(4),
  role: z.enum(['child', 'parent']).optional(),
  full_name: z.string().trim().min(1).max(120).optional(),
  age: z.number().int().min(1).max(120).nullable().optional(),
  grade: z.string().trim().max(32).nullable().optional(),
});

export async function GET() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = supabase as any;
    const [{ data: profile }, { data: learning }] = await Promise.all([
      db.from('profiles').select('role, full_name, age, grade').eq('id', user.id).maybeSingle(),
      db.from('user_learning_profiles').select('learning_profile').eq('user_id', user.id).maybeSingle(),
    ]);

    const prefs = learning?.learning_profile?.learner_preferences ?? {};

    return NextResponse.json({
      success: true,
      data: {
        onboarding_step: Number(prefs.onboarding_step ?? user.user_metadata?.onboarding_step ?? 1),
        onboarding_complete: Boolean(prefs.onboarding_complete ?? user.user_metadata?.onboarding_complete ?? false),
        role: profile?.role ?? null,
        full_name: profile?.full_name ?? null,
        age: profile?.age ?? null,
        grade: profile?.grade ?? null,
      },
    });
  } catch (error: any) {
    console.error('[onboarding-progress GET] error:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = ProgressSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
    }

    const payload = parsed.data;
    const db = supabase as any;
    const profilePatch: Record<string, any> = {};

    if (payload.role) profilePatch.role = payload.role;
    if (payload.full_name !== undefined) profilePatch.full_name = payload.full_name;
    if (payload.age !== undefined) profilePatch.age = payload.age;
    if (payload.grade !== undefined) profilePatch.grade = payload.grade;

    if (Object.keys(profilePatch).length > 0) {
      await db.from('profiles').upsert({ id: user.id, ...profilePatch }, { onConflict: 'id' });
    }

    const { data: learning } = await db
      .from('user_learning_profiles')
      .select('learning_profile')
      .eq('user_id', user.id)
      .maybeSingle();

    const existingProfile = learning?.learning_profile ?? {};
    const learnerPreferences = {
      ...(existingProfile.learner_preferences ?? {}),
      onboarding_step: payload.onboarding_step,
      age: payload.age ?? existingProfile?.learner_preferences?.age ?? null,
      grade: payload.grade ?? existingProfile?.learner_preferences?.grade ?? null,
    };

    await db.from('user_learning_profiles').upsert(
      {
        user_id: user.id,
        learning_profile: {
          ...existingProfile,
          learner_preferences: learnerPreferences,
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    await supabase.auth.updateUser({
      data: {
        onboarding_step: payload.onboarding_step,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[onboarding-progress PUT] error:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}