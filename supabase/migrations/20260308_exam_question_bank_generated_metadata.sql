-- Migration: add provenance metadata and dedupe guard for generated exam bank rows
-- Created: 2026-03-08

ALTER TABLE public.exam_question_bank
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'seed'
  CHECK (source IN ('seed', 'generated'));

ALTER TABLE public.exam_question_bank
  ADD COLUMN IF NOT EXISTS source_topic_id uuid REFERENCES public.topics(id) ON DELETE SET NULL;

ALTER TABLE public.exam_question_bank
  ADD COLUMN IF NOT EXISTS generation_model text;

ALTER TABLE public.exam_question_bank
  ADD COLUMN IF NOT EXISTS generated_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS exam_question_bank_topic_question_uniq
  ON public.exam_question_bank (topic_key, lower(question));
