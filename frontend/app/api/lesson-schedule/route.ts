import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';

const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
function normalizeTimezone(value: string): string {
  try {
    Intl.DateTimeFormat('en-US', { timeZone: value });
    return value;
  } catch {
    return 'UTC';
  }
}

const PutBodySchema = z.object({
  subjectName: z.string().trim().min(1),
  lessonDays: z.array(z.enum(validDays)).max(7),
  reminderEnabled: z.boolean().optional().default(false),
  reminderTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().default('16:00'),
  reminderTimezone: z.string().trim().min(1).max(64).optional().default('UTC'),
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
    const { data, error } = await db
      .from('lesson_schedules')
      .select('id, subject_name, lesson_days, reminder_enabled, reminder_time, reminder_timezone, created_at, updated_at')
      .eq('user_id', user.id)
      .order('subject_name', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (error: any) {
    console.error('[lesson-schedule GET] error:', error);
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

    const parsed = PutBodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
    }

    const { subjectName, lessonDays, reminderEnabled, reminderTime, reminderTimezone } = parsed.data;
    const timezone = normalizeTimezone(reminderTimezone);
    const nowIso = new Date().toISOString();

    const db = supabase as any;
    const { data, error } = await db
      .from('lesson_schedules')
      .upsert(
        {
          user_id: user.id,
          subject_name: subjectName,
          lesson_days: lessonDays,
          reminder_enabled: reminderEnabled,
          reminder_time: `${reminderTime}:00`,
          reminder_timezone: timezone,
          updated_at: nowIso,
        },
        { onConflict: 'user_id,subject_name' }
      )
      .select('id, subject_name, lesson_days, reminder_enabled, reminder_time, reminder_timezone, created_at, updated_at')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('[lesson-schedule PUT] error:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
