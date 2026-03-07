-- Migration: Exam preparation feature (question bank + attempts)
-- Created: 2026-03-07

CREATE TABLE IF NOT EXISTS public.exam_question_bank (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_key text NOT NULL,
  subject_name text,
  question text NOT NULL,
  difficulty text NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  options jsonb NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT exam_question_bank_options_array CHECK (jsonb_typeof(options) = 'array')
);

CREATE TABLE IF NOT EXISTS public.exam_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_key text NOT NULL,
  source_topic_id uuid REFERENCES public.topics(id) ON DELETE SET NULL,
  question_count integer NOT NULL CHECK (question_count >= 1),
  correct_count integer NOT NULL DEFAULT 0 CHECK (correct_count >= 0),
  score_percent integer NOT NULL DEFAULT 0 CHECK (score_percent >= 0 AND score_percent <= 100),
  question_snapshot jsonb NOT NULL,
  answers jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT exam_attempts_question_snapshot_array CHECK (jsonb_typeof(question_snapshot) = 'array')
);

CREATE INDEX IF NOT EXISTS exam_question_bank_topic_idx
  ON public.exam_question_bank(topic_key)
  WHERE active = true;

CREATE INDEX IF NOT EXISTS exam_attempts_user_started_idx
  ON public.exam_attempts(user_id, started_at DESC);

CREATE INDEX IF NOT EXISTS exam_attempts_user_completed_idx
  ON public.exam_attempts(user_id, completed_at DESC)
  WHERE completed_at IS NOT NULL;

ALTER TABLE public.exam_question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'exam_question_bank'
      AND policyname = 'exam_question_bank_select_authenticated'
  ) THEN
    CREATE POLICY exam_question_bank_select_authenticated
      ON public.exam_question_bank
      FOR SELECT
      TO authenticated
      USING (active = true);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'exam_attempts'
      AND policyname = 'exam_attempts_select_own'
  ) THEN
    CREATE POLICY exam_attempts_select_own
      ON public.exam_attempts
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'exam_attempts'
      AND policyname = 'exam_attempts_insert_own'
  ) THEN
    CREATE POLICY exam_attempts_insert_own
      ON public.exam_attempts
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'exam_attempts'
      AND policyname = 'exam_attempts_update_own'
  ) THEN
    CREATE POLICY exam_attempts_update_own
      ON public.exam_attempts
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

INSERT INTO public.exam_question_bank (topic_key, subject_name, question, difficulty, options, active)
VALUES
  (
    'algebra',
    'Mathematics',
    'Solve for x: 2x + 6 = 14',
    'easy',
    '[
      {"label":"A","text":"x = 4","is_correct":true,"explanation":"Subtract 6 from both sides to get 2x = 8, then divide by 2 to get x = 4."},
      {"label":"B","text":"x = 3","is_correct":false,"explanation":"If x were 3, 2x + 6 would be 12, not 14."},
      {"label":"C","text":"x = 5","is_correct":false,"explanation":"If x were 5, 2x + 6 would be 16, which is too high."}
    ]'::jsonb,
    true
  ),
  (
    'algebra',
    'Mathematics',
    'Which expression is equivalent to 3(x + 2)?',
    'easy',
    '[
      {"label":"A","text":"3x + 6","is_correct":true,"explanation":"Distribute 3 across both terms inside the parentheses: 3*x + 3*2."},
      {"label":"B","text":"3x + 2","is_correct":false,"explanation":"This misses distributing 3 to the +2 term."},
      {"label":"C","text":"x + 6","is_correct":false,"explanation":"This incorrectly drops the multiplication on x."}
    ]'::jsonb,
    true
  ),
  (
    'algebra',
    'Mathematics',
    'What is the slope of the line y = 5x - 2?',
    'medium',
    '[
      {"label":"A","text":"-2","is_correct":false,"explanation":"-2 is the y-intercept, not the slope."},
      {"label":"B","text":"5","is_correct":true,"explanation":"In slope-intercept form y = mx + b, m is the slope. Here m = 5."},
      {"label":"C","text":"2","is_correct":false,"explanation":"2 is not present as the slope in this equation."}
    ]'::jsonb,
    true
  ),
  (
    'grammar',
    'English',
    'Choose the sentence with correct subject-verb agreement.',
    'easy',
    '[
      {"label":"A","text":"The group of students are ready.","is_correct":false,"explanation":"The subject is singular (group), so it should take a singular verb."},
      {"label":"B","text":"The group of students is ready.","is_correct":true,"explanation":"The subject group is singular, so is is correct."},
      {"label":"C","text":"The group of students be ready.","is_correct":false,"explanation":"be is not correct in this present-tense structure."}
    ]'::jsonb,
    true
  ),
  (
    'grammar',
    'English',
    'Which option is punctuated correctly?',
    'medium',
    '[
      {"label":"A","text":"After dinner we went for a walk.","is_correct":false,"explanation":"An introductory phrase should be followed by a comma."},
      {"label":"B","text":"After dinner, we went for a walk.","is_correct":true,"explanation":"A comma correctly follows the introductory phrase After dinner."},
      {"label":"C","text":"After dinner we, went for a walk.","is_correct":false,"explanation":"The comma is incorrectly placed between subject and verb phrase."}
    ]'::jsonb,
    true
  ),
  (
    'grammar',
    'English',
    'Pick the best replacement for the underlined word: She did good on the test.',
    'easy',
    '[
      {"label":"A","text":"well","is_correct":true,"explanation":"well is the adverb form needed to describe how she performed."},
      {"label":"B","text":"goodly","is_correct":false,"explanation":"goodly is uncommon and not the appropriate adverb here."},
      {"label":"C","text":"good","is_correct":false,"explanation":"good is an adjective; the sentence needs an adverb."}
    ]'::jsonb,
    true
  ),
  (
    'biology',
    'Science',
    'What is the basic unit of life?',
    'easy',
    '[
      {"label":"A","text":"Atom","is_correct":false,"explanation":"Atoms are units of matter, not the basic unit of life."},
      {"label":"B","text":"Cell","is_correct":true,"explanation":"All living organisms are made of cells, the fundamental unit of life."},
      {"label":"C","text":"Tissue","is_correct":false,"explanation":"Tissues are made of many cells; they are not the most basic unit."}
    ]'::jsonb,
    true
  ),
  (
    'biology',
    'Science',
    'Which process do plants use to make food?',
    'easy',
    '[
      {"label":"A","text":"Photosynthesis","is_correct":true,"explanation":"Plants convert light energy into chemical energy through photosynthesis."},
      {"label":"B","text":"Respiration","is_correct":false,"explanation":"Plants respire too, but respiration is not the process for making food."},
      {"label":"C","text":"Fermentation","is_correct":false,"explanation":"Fermentation is not the standard food-production process in plants."}
    ]'::jsonb,
    true
  ),
  (
    'biology',
    'Science',
    'Which organelle is known as the powerhouse of the cell?',
    'medium',
    '[
      {"label":"A","text":"Nucleus","is_correct":false,"explanation":"The nucleus stores genetic information; it does not primarily produce ATP."},
      {"label":"B","text":"Mitochondrion","is_correct":true,"explanation":"Mitochondria generate most cellular ATP, earning the powerhouse label."},
      {"label":"C","text":"Ribosome","is_correct":false,"explanation":"Ribosomes synthesize proteins, not most of the cell''s ATP."}
    ]'::jsonb,
    true
  )
ON CONFLICT DO NOTHING;
