# Setting up Scheduled Functions for Guardian Reports

Your Supabase Edge Functions `generate-guardian-reports` and `send-guardian-reports` have been successfully deployed. Now you need to set up the scheduled functions (cron jobs) to run them automatically.

## Current Status

✅ Both functions deployed successfully:
- `generate-guardian-reports`
- `send-guardian-reports`

## Manual Scheduling Required

Since your Supabase CLI version doesn't support the `scheduled_functions` configuration in the config file, you'll need to set up the scheduled functions manually through the Supabase Dashboard.

## Setup Steps

1. **Go to your Supabase Dashboard**
   - Navigate to https://supabase.com/dashboard
   - Select your project (ieqqsgpaivxmcgcflanu)

2. **Navigate to Functions**
   - Click on "Functions" in the left sidebar
   - Verify that both functions appear in the list

3. **Set up Scheduled Functions**
   - Look for a "Scheduled Functions" or "Cron Jobs" section in the dashboard
   - If available, create the following scheduled functions:

   **Weekly Reports:**
   - Function: `generate-guardian-reports`
   - Schedule: `0 9 * * 1` (Every Monday at 9 AM UTC)
   - Payload: `{ "type": "weekly" }`

   **Monthly Reports:**
   - Function: `generate-guardian-reports`
   - Schedule: `0 9 1 * *` (1st of every month at 9 AM UTC)
   - Payload: `{ "type": "monthly" }`

   **Send Reports:**
   - Function: `send-guardian-reports`
   - Schedule: `0 * * * *` (Every hour)
   - Payload: `{ }`

## Alternative: Using Third-Party Scheduling Services

If the scheduled functions feature is not available in your Supabase plan, you can use external cron services:

### Option 1: Cronhooks.io
- Create an account at https://cronhooks.io/
- Create hooks that call your Supabase functions:
  - `https://<your-project-ref>.supabase.co/functions/v1/generate-guardian-reports?type=weekly` (weekly)
  - `https://<your-project-ref>.supabase.co/functions/v1/generate-guardian-reports?type=monthly` (monthly)
  - `https://<your-project-ref>.supabase.co/functions/v1/send-guardian-reports` (hourly)

### Option 2: GitHub Actions
- Create a GitHub Actions workflow that makes HTTP requests to your functions on schedule

## Environment Variables

Make sure the following environment variable is set in your Supabase project:

- `RESEND_API_KEY`: Your Resend API key for email delivery

To set environment variables:
1. Go to your Supabase Dashboard
2. Navigate to "Settings" → "Environment variables"
3. Add the required variables

## Testing

You can test the functions manually by calling them directly:

- Generate reports: `curl -X GET "https://<your-project-ref>.supabase.co/functions/v1/generate-guardian-reports?type=weekly"`
- Send reports: `curl -X GET "https://<your-project-ref>.supabase.co/functions/v1/send-guardian-reports"`

## Verification

Once scheduled, verify that:
1. Reports are generated for users with `weekly_report=true` or `monthly_report=true`
2. Emails are sent to guardians with the appropriate reports
3. The `sent` status is updated in the `guardian_reports` table

## Troubleshooting

- Check function logs in the Supabase Dashboard if functions fail
- Verify that your database tables exist and have the correct structure
- Ensure environment variables are properly set
- Confirm that the Resend API key is valid and has sufficient quota
