# Guardian Reports Setup Guide

This guide explains how to set up and deploy the automated guardian reports functionality in the Lana AI system.

## Prerequisites

- Supabase project with the required database schema
- Resend API key for email delivery
- Proper environment variables configured

## Database Schema

Ensure your Supabase database includes the following tables:

```sql
-- Guardians table
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

-- Guardian reports table
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
```

## Environment Variables

Set the following environment variables in your Supabase project:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `RESEND_API_KEY`: Your Resend API key
- `RESEND_FROM_EMAIL`: The email address to send from (optional, defaults to "onboarding@resend.dev")

## Deployment

### 1. Deploy Supabase Edge Functions

Deploy the Edge Functions to your Supabase project:

```bash
supabase functions deploy generate-guardian-reports
supabase functions deploy send-guardian-reports
```

### 2. Configure Cron Jobs

The `supabase/config.toml` file contains the cron job configuration:

- Weekly reports: Every Monday at 9 AM UTC (`0 9 * * 1`)
- Monthly reports: 1st of every month at 9 AM UTC (`0 9 1 * *`)
- Send reports: Every hour to process newly generated reports (`0 * * * *`)

## API Endpoints

The backend provides the following API endpoints for guardian reports:

- `POST /guardian-reports/generate`: Generate a guardian report for a specific child
- `GET /guardian-reports`: Get guardian reports with optional filters
- `POST /guardian-reports/batch-generate`: Batch generate reports for all eligible guardians

## Testing

### Backend Testing

Run the validation script to ensure all components are properly set up:

```bash
cd backend
python test_guardian_reports.py
```

### Manual Testing

You can manually trigger guardian report generation using the API:

```bash
# Generate a weekly report for a child
curl -X POST "http://localhost:8000/guardian-reports/generate?child_uid=YOUR_CHILD_UID&report_type=weekly"

# Generate reports for all eligible guardians
curl -X POST "http://localhost:8000/guardian-reports/batch-generate?report_type=weekly"
```

## Architecture Overview

The guardian reports system consists of:

1. **Supabase Edge Functions** (automated):
   - `generate-guardian-reports`: Runs on cron schedule to generate reports
   - `send-guardian-reports`: Runs on cron schedule to send unsent reports

2. **Backend Services** (manual/programmatic access):
   - `GuardianReportsService`: Core logic for generating guardian reports
   - API routes for manual report generation and management

## Data Flow

1. The `generate-guardian-reports` Edge Function runs on schedule
2. It queries the `guardians` table for users wanting reports
3. For each child, it analyzes `user_events` and `user_learning_profiles`
4. Structured reports are saved to the `guardian_reports` table
5. The `send-guardian-reports` Edge Function sends unsent reports via email
6. Reports are marked as sent in the database

## Troubleshooting

### Common Issues

- **Missing environment variables**: Ensure all required environment variables are set in Supabase
- **Database permissions**: Ensure the service role key has proper permissions to read/write the required tables
- **Email delivery**: Verify your Resend API key and from email address

### Logs

Check Supabase function logs for debugging:

```bash
supabase functions logs generate-guardian-reports
supabase functions logs send-guardian-reports
```
