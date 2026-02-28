import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function toLocalDayName(timezone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      timeZone: timezone,
    });
    return formatter.format(new Date());
  } catch {
    return new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' }).format(new Date());
  }
}

function toLocalDateYmd(timezone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  } catch {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  }
}

export async function POST(req: Request) {
  try {
    const providedSecret = req.headers.get('x-reminder-secret') || '';
    const expectedSecret = process.env.REMINDER_CRON_SECRET || '';

    if (!expectedSecret || providedSecret !== expectedSecret) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const db = getSupabaseAdmin() as any;

    const { data: schedules, error: scheduleError } = await db
      .from('lesson_schedules')
      .select('id, user_id, subject_name, lesson_days, reminder_enabled, reminder_timezone')
      .eq('reminder_enabled', true);

    if (scheduleError) {
      return NextResponse.json({ error: scheduleError.message }, { status: 500 });
    }

    const eligible = (schedules ?? []).filter((row: any) => {
      const timezone = row.reminder_timezone || 'UTC';
      const localDay = toLocalDayName(timezone);
      return Array.isArray(row.lesson_days) && row.lesson_days.includes(localDay);
    });

    if (eligible.length === 0) {
      return NextResponse.json({ success: true, data: { queued: 0, sent: 0, failed: 0 } });
    }

    let queued = 0;
    let sent = 0;
    let failed = 0;

    for (const row of eligible) {
      const timezone = row.reminder_timezone || 'UTC';
      const reminderFor = toLocalDateYmd(timezone);

      const { error: logError } = await db.from('lesson_reminder_logs').upsert(
        {
          user_id: row.user_id,
          subject_name: row.subject_name,
          reminder_for: reminderFor,
          status: 'queued',
          sent_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,subject_name,reminder_for' }
      );

      if (logError) {
        failed += 1;
        await db.from('lesson_reminder_logs').insert({
          user_id: row.user_id,
          subject_name: row.subject_name,
          reminder_for: reminderFor,
          status: 'failed',
          error_message: logError.message,
        });
        continue;
      }

      queued += 1;

      const { error: auditError } = await db.from('audit_logs').insert({
        user_id: row.user_id,
        operation: 'admin_action',
        details: {
          kind: 'lesson_reminder',
          subject_name: row.subject_name,
          day: dayNames[new Date().getDay()],
          reminder_for: reminderFor,
        },
      });

      if (auditError) {
        failed += 1;
        await db
          .from('lesson_reminder_logs')
          .update({ status: 'failed', error_message: auditError.message })
          .eq('user_id', row.user_id)
          .eq('subject_name', row.subject_name)
          .eq('reminder_for', reminderFor);
        continue;
      }

      sent += 1;
      await db
        .from('lesson_reminder_logs')
        .update({ status: 'sent' })
        .eq('user_id', row.user_id)
        .eq('subject_name', row.subject_name)
        .eq('reminder_for', reminderFor);
    }

    return NextResponse.json({
      success: true,
      data: { queued, sent, failed },
    });
  } catch (error: any) {
    console.error('[reminders/dispatch POST] error:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
