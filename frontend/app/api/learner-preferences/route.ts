import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';

const LearningStyleSchema = z.object({
  learning_style: z.enum(['visual', 'auditory', 'reading_writing', 'kinesthetic']),
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
    const { data: learning } = await db
      .from('user_learning_profiles')
      .select('learning_profile')
      .eq('user_id', user.id)
      .maybeSingle();

    const learningStyle =
      learning?.learning_profile?.learner_preferences?.learning_style ||
      user.user_metadata?.learning_style ||
      'visual';

    return NextResponse.json({ success: true, data: { learning_style: learningStyle } });
  } catch (error: any) {
    console.error('[learner-preferences GET] error:', error);
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

    const parsed = LearningStyleSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
    }

    const db = supabase as any;
    const { data: learning } = await db
      .from('user_learning_profiles')
      .select('learning_profile')
      .eq('user_id', user.id)
      .maybeSingle();

    const existingProfile = learning?.learning_profile ?? {};
    const learnerPreferences = {
      ...(existingProfile.learner_preferences ?? {}),
      learning_style: parsed.data.learning_style,
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
        learning_style: parsed.data.learning_style,
      },
    });

    return NextResponse.json({ success: true, data: { learning_style: parsed.data.learning_style } });
  } catch (error: any) {
    console.error('[learner-preferences PUT] error:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}