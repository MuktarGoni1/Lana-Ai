-- Migration: Create user_events table
-- Description: Table to store user activity tracking events

CREATE TABLE IF NOT EXISTS user_events (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_id TEXT,
    event_type TEXT NOT NULL,
    metadata JSONB,
    user_agent TEXT,
    url TEXT,
    ip_address TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_events_user_id ON user_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_event_type ON user_events(event_type);
CREATE INDEX IF NOT EXISTS idx_user_events_timestamp ON user_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_events_session_id ON user_events(session_id);

-- Add comments for documentation
COMMENT ON TABLE user_events IS 'Tracks all user activity events for analytics and personalization';
COMMENT ON COLUMN user_events.id IS 'Unique identifier for the event';
COMMENT ON COLUMN user_events.user_id IS 'Identifier for the user who triggered the event';
COMMENT ON COLUMN user_events.session_id IS 'Identifier for the user session';
COMMENT ON COLUMN user_events.event_type IS 'Type of event (e.g., page_view, lesson_start, quiz_complete)';
COMMENT ON COLUMN user_events.metadata IS 'Additional event-specific data in JSON format';
COMMENT ON COLUMN user_events.user_agent IS 'Browser user agent string';
COMMENT ON COLUMN user_events.url IS 'URL where the event occurred';
COMMENT ON COLUMN user_events.ip_address IS 'IP address of the user (if collected)';
COMMENT ON COLUMN user_events.timestamp IS 'Timestamp when the event occurred';