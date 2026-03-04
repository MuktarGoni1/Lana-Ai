-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  operation text NOT NULL CHECK (operation = ANY (ARRAY['login'::text, 'logout'::text, 'register'::text, 'profile_update'::text, 'password_change'::text, 'child_created'::text, 'lesson_start'::text, 'lesson_complete'::text, 'quiz_attempt'::text, 'term_plan_created'::text, 'topic_unlocked'::text, 'topic_completed'::text, 'guardian_report_sent'::text, 'subscription_change'::text, 'admin_action'::text])),
  details jsonb,
  user_id uuid,
  ip_address inet,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.contact_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text,
  email text NOT NULL,
  subject text DEFAULT 'General Inquiry'::text,
  message text NOT NULL,
  source text DEFAULT 'website'::text
  status text DEFAULT 'new'::text CHECK (status = ANY (ARRAY['new'::text, 'read'::text, 'replied'::text, 'closed'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
  CONSTRAINT contact_submissions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.demo_requests (
id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  role text,
  company text,
  message text,
source text DEFAULT 'website'::text,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'scheduled'::text, 'completed'::text, 'cancelled'::text])),
  scheduled_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT demo_requests_pkey PRIMARY KEY (id)
)
;CREATE TABLE public.guardian_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  guardian_email text NOT NULL,
  report_type text CHECK (report_type = ANY (ARRAY['weekly'::text, 'monthly'::text])),
  report_payload jsonb NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  sent boolean DEFAULT false,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT guardian_reports_pkey PRIMARY KEY (id),
  CONSTRAINT guardian_reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.guardian_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  weekly_report boolean DEFAULT true,
monthly_report boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  user_id uuid,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT guardian_settings_pkey PRIMARY KEY (id),
  CONSTRAINT guardian_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.lesson_chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid()
  topic_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['user'::text, 'assistant'::text])),
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT lesson_chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT lesson_chat_messages_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES public.topics(id),
  CONSTRAINT lesson_chat_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.lesson_generation_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  topic_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'queued'::text CHECK (status = ANY (ARRAY['queued'::text, 'processing'::text, 'completed'::text, 'failed'::text])),
  error text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT lesson_generation_jobs_pkey PRIMARY KEY (id),
  CONSTRAINT lesson_generation_jobs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT lesson_generation_jobs_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES public.topics(id)
);
CREATE TABLE public.lesson_units (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL UNIQUE,
  lesson_content jsonb,
  video_url text,
  audio_url text,
  is_ready boolean DEFAULT false,
  generated_at timestamp with time zone,
  refreshed_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  video_ready boolean NOT NULL DEFAULT true,
  audio_ready boolean NOT NULL DEFAULT true,
  CONSTRAINT lesson_units_pkey PRIMARY KEY (id),
  CONSTRAINT lesson_units_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES public.topics(id)
);
CREATE TABLE public.newsletter_subscribers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  source text DEFAULT 'website'::text,
tags ARRAY DEFAULT '{}'::text[],
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'unsubscribed'::text, 'bounced'::text])),
  subscribed_at timestamp with time zone DEFAULT now(),
  unsubscribed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT newsletter_subscribers_pkey PRIMARY KEY (id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text,
  role text CHECK (role = ANY (ARRAY['parent'::text, 'child'::text])),
  parent_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  diagnostic_completed boolean DEFAULT false,
  is_active boolean DEFAULT true,
  age integer CHECK (age IS NULL OR age >= 5 AND age <= 18),
  grade text CHECK (grade IS NULL OR (grade = ANY (ARRAY['1'::text, '2'::text, '3'::text, '4'::text, '5'::text, '6'::text, '7'::text, '8'::text, '9'::text, '10'::text, '11'::text, '12'::text, 'college'::text]))),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT profiles_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.quiz_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL,
  user_id uuid NOT NULL,
  score integer NOT NULL CHECK (score >= 0),
  total integer NOT NULL CHECK (total > 0),
  answers jsonb,
  attempted_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT quiz_attempts_pkey PRIMARY KEY (id),
  CONSTRAINT quiz_attempts_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES public.topics(id),
CONSTRAINT quiz_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.quiz_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL,
  questions jsonb NOT NULL,
  generated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT quiz_questions_pkey PRIMARY KEY (id),
  CONSTRAINT quiz_questions_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES public.topics(id)
);
CREATE TABLE public.searches 
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT searches_pkey PRIMARY KEY (id),
  CONSTRAINT searches_uid_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.term_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject text NOT NULL,
  grade text CHECK (grade IS NULL OR (grade = ANY (ARRAY['1'::text, '2'::text, '3'::text, '4'::text, '5'::text, '6'::text, '7'::text, '8'::text, '9'::text, '10'::text, '11'::text, '12'::text, 'college'::text]))),
  term text,
  raw_syllabus text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT term_plans_pkey PRIMARY KEY (id),
  CONSTRAINT term_plans_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.topics (
id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  term_plan_id uuid,
subject_name text NOT NULL,
  title text NOT NULL,
  week_number integer DEFAULT 1,
  order_index integer DEFAULT 0,
status text DEFAULT 'locked'::text CHECK (status = ANY (ARRAY['locked'::text, 'available'::text, 'in_progress'::text, 'completed'::text])),
  unlocked_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT topics_pkey PRIMARY KEY (id),
  CONSTRAINT topics_term_plan_id_fkey FOREIGN KEY (term_plan_id) REFERENCES public.term_plans(id),
  CONSTRAINT topics_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  session_id text,
  event_type text NOT NULL,
  metadata jsonb,
  user_agent text,
  url text,
  ip_address inet,
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_events_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_learning_profiles (
  user_id uuid NOT NULL,
  learning_profile jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_learning_profiles_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_learning_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  user_metadata jsonb DEFAULT '{}'::jsonb,
  study_plan jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENC
