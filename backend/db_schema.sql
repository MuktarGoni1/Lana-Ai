-- Database Schema for Lana AI Application
-- This file contains the database structure for the application

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table for guest searches
-- Stores search history for unauthenticated users
CREATE TABLE public.guest_searches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  session_id text NOT NULL,
  search_query text,
  CONSTRAINT guest_searches_pkey PRIMARY KEY (id)
);

-- Table for guardians
-- Stores information about parents/guardians
CREATE TABLE public.guardians (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  child_uid uuid,
  weekly_report boolean DEFAULT true,
  monthly_report boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT guardians_pkey PRIMARY KEY (id),
  CONSTRAINT guardians_child_uid_fkey FOREIGN KEY (child_uid) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Table for searches
-- Stores search history for authenticated users
CREATE TABLE public.searches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  uid uuid NOT NULL,
  title text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT searches_pkey PRIMARY KEY (id),
  CONSTRAINT searches_uid_fkey FOREIGN KEY (uid) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes for better query performance
CREATE INDEX idx_guest_searches_session_id ON public.guest_searches(session_id);
CREATE INDEX idx_guest_searches_created_at ON public.guest_searches(created_at);
CREATE INDEX idx_guardians_email ON public.guardians(email);
CREATE INDEX idx_guardians_child_uid ON public.guardians(child_uid);
CREATE INDEX idx_searches_uid ON public.searches(uid);
CREATE INDEX idx_searches_created_at ON public.searches(created_at);
CREATE INDEX idx_searches_title ON public.searches(title);

-- Comments for documentation
COMMENT ON TABLE public.guest_searches IS 'Stores search history for unauthenticated users';
COMMENT ON TABLE public.guardians IS 'Stores information about parents/guardians';
COMMENT ON TABLE public.searches IS 'Stores search history for authenticated users';