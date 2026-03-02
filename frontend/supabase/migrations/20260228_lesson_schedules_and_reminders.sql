-- lesson scheduling and reminders
create table if not exists public.lesson_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_name text not null,
  lesson_days text[] not null default '{}',
  reminder_enabled boolean not null default false,
  reminder_time time without time zone not null default '16:00:00'::time,
  reminder_timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, subject_name)
);

create index if not exists lesson_schedules_user_id_idx on public.lesson_schedules(user_id);
create index if not exists lesson_schedules_user_subject_idx on public.lesson_schedules(user_id, subject_name);
create index if not exists lesson_schedules_days_gin_idx on public.lesson_schedules using gin(lesson_days);

create table if not exists public.lesson_reminder_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_name text not null,
  reminder_for date not null,
  status text not null check (status in ('queued','sent','failed')),
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists lesson_reminder_logs_user_id_idx on public.lesson_reminder_logs(user_id);
create index if not exists lesson_reminder_logs_date_idx on public.lesson_reminder_logs(reminder_for);
create unique index if not exists lesson_reminder_logs_unique_per_day
  on public.lesson_reminder_logs(user_id, subject_name, reminder_for);

alter table public.lesson_schedules enable row level security;
alter table public.lesson_reminder_logs enable row level security;

drop policy if exists "lesson_schedules_select_own" on public.lesson_schedules;
create policy "lesson_schedules_select_own"
  on public.lesson_schedules for select
  using (auth.uid() = user_id);

drop policy if exists "lesson_schedules_insert_own" on public.lesson_schedules;
create policy "lesson_schedules_insert_own"
  on public.lesson_schedules for insert
  with check (auth.uid() = user_id);

drop policy if exists "lesson_schedules_update_own" on public.lesson_schedules;
create policy "lesson_schedules_update_own"
  on public.lesson_schedules for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "lesson_schedules_delete_own" on public.lesson_schedules;
create policy "lesson_schedules_delete_own"
  on public.lesson_schedules for delete
  using (auth.uid() = user_id);

drop policy if exists "lesson_reminder_logs_select_own" on public.lesson_reminder_logs;
create policy "lesson_reminder_logs_select_own"
  on public.lesson_reminder_logs for select
  using (auth.uid() = user_id);