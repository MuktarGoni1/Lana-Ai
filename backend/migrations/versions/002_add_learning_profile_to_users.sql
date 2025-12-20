-- Migration: Add learning_profile column to users table
-- Description: Add column to store user's learning profile data

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS learning_profile JSONB;

-- Add comment for documentation
COMMENT ON COLUMN users.learning_profile IS 'Stores the user''s learning profile including knowledge level, learning style, and preferences';