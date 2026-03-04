import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

    const todayName = dayNames[new Date().getDay()];
    const db = supabase as any;

    const { data: schedules, error: scheduleError } = await db
      .from('lesson_schedules')
      .select('subject_name, lesson_days, reminder_enabled, reminder_time, reminder_timezone')
      .eq('user_id', user.id)
      .contains('lesson_days', [todayName]);

    if (scheduleError) {
      return NextResponse.json({ error: scheduleError.message }, { status: 500 });
    }

    const subjects = Array.from(
      new Set(
        (schedules ?? [])
          .map((s: any) => (typeof s.subject_name === 'string' ? s.subject_name : '').trim())
          .filter(Boolean)
      )
    );

    if (subjects.length === 0) {
      return NextResponse.json({
        success: true,
        data: { day: todayName, subjects: [], lessons: [] },
      });
    }

    const { data: lessons, error: lessonError } = await db
      .from('topics')
      .select('id, title, week_number, order_index, subject_name, status, updated_at')
      .eq('user_id', user.id)
      .in('subject_name', subjects)
      .in('status', ['available', 'in_progress'])
      .order('week_number', { ascending: true })
      .order('order_index', { ascending: true });

    if (lessonError) {
      return NextResponse.json({ error: lessonError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        day: todayName,
        subjects,
        schedule: schedules ?? [],
        lessons: lessons ?? [],
      },
    });
  } catch (error: any) {
    console.error('[lessons/today GET] error:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}