-- Migration: Add video status tracking to lesson_units
-- Created: 2026-03-04
-- Purpose: Track async video generation status separately from lesson content

-- Add video status column with enum constraint
ALTER TABLE public.lesson_units 
ADD COLUMN IF NOT EXISTS video_status text 
  CHECK (video_status IN ('idle', 'pending', 'queued', 'scripting', 'generating_assets', 'rendering', 'completed', 'failed', 'unavailable'))
  DEFAULT 'idle';

-- Add video job ID column for external video service tracking
ALTER TABLE public.lesson_units
ADD COLUMN IF NOT EXISTS video_job_id text;

-- Add video generation progress (0-100)
ALTER TABLE public.lesson_units
ADD COLUMN IF NOT EXISTS video_progress integer 
  CHECK (video_progress >= 0 AND video_progress <= 100)
  DEFAULT 0;

-- Add index for efficient polling of active video generations
CREATE INDEX IF NOT EXISTS lesson_units_video_status_idx 
ON public.lesson_units(video_status) 
WHERE video_status NOT IN ('idle', 'completed', 'failed', 'unavailable');

-- Add index for video job lookups
CREATE INDEX IF NOT EXISTS lesson_units_video_job_idx 
ON public.lesson_units(video_job_id) 
WHERE video_job_id IS NOT NULL;

-- Add index for topic-based video lookups
CREATE INDEX IF NOT EXISTS lesson_units_topic_video_idx 
ON public.lesson_units(topic_id, video_status);

-- Update RLS policies to allow video status updates
-- Note: Existing RLS policies should already cover this via user_id joins through topics

-- Add helpful comment
COMMENT ON COLUMN public.lesson_units.video_status IS 'Tracks async video generation status: idle->pending->queued->scripting->generating_assets->rendering->completed/failed';
COMMENT ON COLUMN public.lesson_units.video_job_id IS 'External video service job ID for status polling';
COMMENT ON COLUMN public.lesson_units.video_progress IS 'Video generation progress percentage (0-100)';
