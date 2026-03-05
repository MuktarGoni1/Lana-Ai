-- Migration: Harden job queue with atomic claiming and stale job cleanup
-- This prevents the race conditions and stuck jobs that caused production failures

-- Add worker tracking columns to lesson_generation_jobs (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lesson_generation_jobs' AND column_name = 'worker_id') THEN
        ALTER TABLE lesson_generation_jobs ADD COLUMN worker_id TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lesson_generation_jobs' AND column_name = 'locked_at') THEN
        ALTER TABLE lesson_generation_jobs ADD COLUMN locked_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lesson_generation_jobs' AND column_name = 'max_retries') THEN
        ALTER TABLE lesson_generation_jobs ADD COLUMN max_retries INTEGER NOT NULL DEFAULT 3;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lesson_generation_jobs' AND column_name = 'error_code') THEN
        ALTER TABLE lesson_generation_jobs ADD COLUMN error_code TEXT;
    END IF;
END $$;

-- Index for efficient job polling (queued or processing jobs, ordered by creation)
CREATE INDEX IF NOT EXISTS idx_lgj_queue_poll 
ON lesson_generation_jobs(status, created_at) 
WHERE status IN ('queued', 'processing');

-- Index for looking up job status by topic (frontend polling)
CREATE INDEX IF NOT EXISTS idx_lgj_topic_status 
ON lesson_generation_jobs(topic_id, created_at DESC);

-- Partial unique index: prevents duplicate active jobs for the same topic
-- Only one queued/processing job per topic is allowed
CREATE UNIQUE INDEX IF NOT EXISTS idx_lgj_one_active_per_topic 
ON lesson_generation_jobs(topic_id) 
WHERE status IN ('queued', 'processing');

-- Index for cleanup of stale jobs
CREATE INDEX IF NOT EXISTS idx_lgj_locked_at 
ON lesson_generation_jobs(locked_at) 
WHERE status = 'processing';

-- Index for lesson_units hot path (lesson open page)
CREATE INDEX IF NOT EXISTS idx_lesson_units_topic_id 
ON lesson_units(topic_id);

-- Index for topics dashboard query
CREATE INDEX IF NOT EXISTS idx_topics_user_status 
ON topics(user_id, status, order_index);

-- Index for quiz questions hot path
CREATE INDEX IF NOT EXISTS idx_quiz_questions_topic_id 
ON quiz_questions(topic_id);

-- Function: Atomically claim the next available job
-- Uses FOR UPDATE SKIP LOCKED to prevent race conditions between multiple workers
CREATE OR REPLACE FUNCTION claim_next_lesson_job(p_worker_id TEXT)
RETURNS TABLE (
    id UUID,
    topic_id UUID,
    user_id UUID
) AS $$
BEGIN
    RETURN QUERY
    WITH next_job AS (
        SELECT lgj.id, lgj.topic_id, lgj.user_id
        FROM lesson_generation_jobs lgj
        WHERE lgj.status = 'queued'
        ORDER BY lgj.created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
    )
    UPDATE lesson_generation_jobs lgj
    SET 
        status = 'processing',
        worker_id = p_worker_id,
        locked_at = NOW(),
        started_at = COALESCE(lgj.started_at, NOW()),
        attempts = lgj.attempts + 1,
        updated_at = NOW()
    FROM next_job
    WHERE lgj.id = next_job.id
    RETURNING lgj.id, lgj.topic_id, lgj.user_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Clean up stale jobs (workers that crashed mid-processing)
-- Re-queues jobs that have been processing for > 10 minutes
CREATE OR REPLACE FUNCTION cleanup_stale_jobs()
RETURNS INTEGER AS $$
DECLARE
    reclaimed_count INTEGER := 0;
    job_record RECORD;
BEGIN
    -- Find stale jobs (processing for > 10 minutes)
    FOR job_record IN 
        SELECT id, attempts, max_retries
        FROM lesson_generation_jobs
        WHERE status = 'processing'
        AND locked_at < NOW() - INTERVAL '10 minutes'
    LOOP
        IF job_record.attempts >= job_record.max_retries THEN
            -- Max retries exceeded, mark as failed
            UPDATE lesson_generation_jobs
            SET 
                status = 'failed',
                error = 'Worker crashed and max retries exceeded',
                error_code = 'MAX_RETRIES_EXCEEDED',
                worker_id = NULL,
                locked_at = NULL,
                completed_at = NOW(),
                updated_at = NOW()
            WHERE id = job_record.id;
        ELSE
            -- Re-queue for retry
            UPDATE lesson_generation_jobs
            SET 
                status = 'queued',
                worker_id = NULL,
                locked_at = NULL,
                error = COALESCE(error, 'Worker crashed, retrying...'),
                updated_at = NOW()
            WHERE id = job_record.id;
        END IF;
        
        reclaimed_count := reclaimed_count + 1;
    END LOOP;
    
    RETURN reclaimed_count;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions to authenticated users (for edge functions)
GRANT EXECUTE ON FUNCTION claim_next_lesson_job(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_stale_jobs() TO authenticated;
GRANT EXECUTE ON FUNCTION claim_next_lesson_job(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_stale_jobs() TO service_role;

-- Comment documenting the phantom columns that must NOT be used
COMMENT ON TABLE lesson_units IS 
'IMPORTANT: Valid columns are: id, topic_id, lesson_content, video_url, audio_url, is_ready, video_ready, audio_ready, generated_at, refreshed_at, created_at. 
DO NOT use video_status, video_job_id, video_progress - these columns do not exist and will cause 400 errors.';

COMMENT ON TABLE lesson_generation_jobs IS
'Job queue for lesson generation. Use claim_next_lesson_job() to atomically claim jobs. 
Cleanup stale jobs with cleanup_stale_jobs() every 5 minutes.';
