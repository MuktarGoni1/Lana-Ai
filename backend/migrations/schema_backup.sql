-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.guardian_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  child_uid uuid NOT NULL,
  guardian_email text NOT NULL,
  report_type text CHECK (report_type = ANY (ARRAY['weekly'::text, 'monthly'::text])),
  report_payload jsonb NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  sent boolean DEFAULT false,
  CONSTRAINT guardian_reports_pkey PRIMARY KEY (id),
  CONSTRAINT guardian_reports_child_uid_fkey FOREIGN KEY (child_uid) REFERENCES auth.users(id)
);
CREATE TABLE public.guardians (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL,
  child_uid uuid,
  weekly_report boolean DEFAULT true,
  monthly_report boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT guardians_pkey PRIMARY KEY (id),
  CONSTRAINT guardians_child_uid_fkey FOREIGN KEY (child_uid) REFERENCES auth.users(id)
);
CREATE TABLE public.guest_searches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  seession_id text NOT NULL DEFAULT 'unique_per_browser_session'::text UNIQUE,
  CONSTRAINT guest_searches_pkey PRIMARY KEY (id)
);
CREATE TABLE public.searches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  uid uuid NOT NULL,
  title text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT searches_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  session_id text,
  event_type text NOT NULL,
  metadata jsonb,
  user_agent text,
  url text,
  ip_address text,
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