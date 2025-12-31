// Supabase Table Setup Script
// This script provides instructions for setting up the required Supabase tables

console.log('='.repeat(60));
console.log('Lana AI - Supabase Table Setup Instructions');
console.log('='.repeat(60));
console.log();

console.log('This script will guide you through setting up the required');
console.log('Supabase tables for the Lana AI application.');
console.log();

console.log('Prerequisites:');
console.log('1. A Supabase project set up and running');
console.log('2. Your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY configured');
console.log();

console.log('Required Tables:');
console.log('1. user_events - Stores user activity tracking events');
console.log('2. learning_profile column - Adds learning profile to users table');
console.log();

console.log('To create these tables, follow these steps:');
console.log();
console.log('1. Go to your Supabase Dashboard: https://app.supabase.com/');
console.log('2. Select your project');
console.log('3. Navigate to "SQL Editor" in the sidebar');
console.log('4. Copy and run the following SQL commands:');
console.log();

console.log('--- SQL for user_events table ---');
console.log(`CREATE TABLE IF NOT EXISTS user_events (
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
COMMENT ON COLUMN user_events.timestamp IS 'Timestamp when the event occurred';`);
console.log();

console.log('--- SQL for learning_profile column ---');
console.log(`ALTER TABLE users 
ADD COLUMN IF NOT EXISTS learning_profile JSONB;

-- Add comment for documentation
COMMENT ON COLUMN users.learning_profile IS 'Stores the user''s learning profile including knowledge level, learning style, and preferences';`);
console.log();

console.log('Alternative method:');
console.log('You can also run these SQL files directly in the Supabase SQL Editor:');
console.log('- backend/migrations/versions/001_create_user_events_table.sql');
console.log('- backend/migrations/versions/002_add_learning_profile_to_users.sql');
console.log();

console.log('After creating the tables, verify the setup by running:');
console.log('$ npm run supabase:verify');
console.log();

console.log('='.repeat(60));
console.log('Setup instructions completed!');
console.log('='.repeat(60));