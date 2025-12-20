# Supabase Table Setup Scripts

This directory contains scripts for setting up Supabase tables for the Lana AI application.

## Available Scripts

### supabase-table-setup.js

Provides instructions for creating the required tables for user activity tracking in Supabase:

1. `user_events` table - Stores user activity tracking events
2. `learning_profile` column - Adds learning profile data to the users table

Note: Tables must be created manually using the SQL files in `backend/migrations/versions/`.

### supabase-table-verify.js

Verifies that the required tables and columns exist in your Supabase database.

## Prerequisites

Before running these scripts, ensure you have:

1. Set up your Supabase project
2. Configured the required environment variables in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

## Running the Scripts

From the `frontend` directory, run:

```bash
npm run supabase:setup
```

This will display instructions for creating the tables manually.

To verify the tables were created correctly:

```bash
npm run supabase:verify
```

## Manual SQL Creation

To create the tables, you need to manually run the SQL files in the Supabase dashboard:

1. Go to your Supabase project dashboard
2. Open the SQL editor
3. Run the SQL from `backend/migrations/versions/001_create_user_events_table.sql`
4. Run the SQL from `backend/migrations/versions/002_add_learning_profile_to_users.sql`

## Troubleshooting

If you encounter issues:

1. Verify your environment variables are correctly set
2. Ensure your Supabase service role key has the necessary permissions
3. Check that your Supabase project is accessible