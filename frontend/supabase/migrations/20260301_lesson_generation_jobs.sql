create table if not exists public.lesson_generation_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  status text not null check (status in ('queued','processing','completed','failed')) default 'queued',
  force_refresh boolean not null default false,
  attempt_count integer not null default 0,
  result_lesson_unit_id uuid references public.lesson_units(id) on delete set null,
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists lesson_generation_jobs_user_idx on public.lesson_generation_jobs(user_id);
create index if not exists lesson_generation_jobs_topic_idx on public.lesson_generation_jobs(topic_id);
create index if not exists lesson_generation_jobs_status_idx on public.lesson_generation_jobs(status);
create index if not exists lesson_generation_jobs_created_idx on public.lesson_generation_jobs(created_at desc);

alter table public.lesson_generation_jobs enable row level security;

drop policy if exists "lesson_generation_jobs_select_own" on public.lesson_generation_jobs;
create policy "lesson_generation_jobs_select_own"
  on public.lesson_generation_jobs for select
  using (auth.uid() = user_id);

drop policy if exists "lesson_generation_jobs_insert_own" on public.lesson_generation_jobs;
create policy "lesson_generation_jobs_insert_own"
  on public.lesson_generation_jobs for insert
  with check (auth.uid() = user_id);

drop policy if exists "lesson_generation_jobs_update_own" on public.lesson_generation_jobs;
create policy "lesson_generation_jobs_update_own"
  on public.lesson_generation_jobs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);