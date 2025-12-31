# Lana AI Report Architecture

This document describes the architecture for the reports functionality in the Lana AI system, including both user-facing reports and automated guardian reports.

## Overview

The Lana AI system provides two types of reports:

1. **User Reports**: Personalized reports for individual users, accessible through the frontend
2. **Guardian Reports**: Automated reports sent to guardians about their children's learning progress

## Architecture Components

### 1. Backend Services

#### Reports Service (`app/services/reports_service.py`)
- Provides core report generation functionality
- Handles weekly and monthly user reports
- Analyzes data from `searches` and `user_events` tables
- Calculates engagement metrics and generates recommendations

#### Guardian Reports Service (`app/services/guardian_reports_service.py`)
- Extends the base reports functionality for guardian-specific needs
- Analyzes data from `user_events` and `user_learning_profiles` tables
- Generates structured JSON reports for guardians
- Handles database operations for `guardians` and `guardian_reports` tables

### 2. API Routes

#### User Reports API (`app/api/routes/reports.py`)
- Provides `/reports/weekly`, `/reports/monthly`, and `/reports/generate` endpoints
- Returns detailed reports with lessons, activity, engagement metrics, and recommendations

#### Guardian Reports API (`app/api/routes/guardian_reports.py`)
- Provides `/guardian-reports/generate`, `/guardian-reports`, and `/guardian-reports/batch-generate` endpoints
- Used for manual guardian report generation and administration

### 3. Supabase Edge Functions

#### Generate Guardian Reports (`supabase/functions/generate-guardian-reports/index.ts`)
- Runs as a Supabase cron job
- Queries guardians where `monthly_report = true` or `weekly_report = true`
- For each child, pulls last 7/30 days of `user_events`
- Pulls `user_learning_profiles`
- Generates structured JSON reports
- Inserts reports into the `guardian_reports` table

#### Send Guardian Reports (`supabase/functions/send-guardian-reports/index.ts`)
- Runs as a Supabase cron job
- Selects `guardian_reports` WHERE `sent = false`
- Formats email using Resend
- Sends emails to guardians
- Marks reports as `sent = true`

## Data Flow

### User Reports
1. Frontend calls backend API (`/reports/weekly`, `/reports/monthly`)
2. Backend service queries `searches` and `user_events` tables
3. Report is generated and returned to frontend
4. User views report in the UI

### Guardian Reports
1. Supabase cron job triggers `generate-guardian-reports` function
2. Function queries `guardians` table for users wanting reports
3. For each child, pulls `user_events` and `user_learning_profiles`
4. Generates structured JSON reports
5. Inserts reports into `guardian_reports` table
6. Supabase cron job triggers `send-guardian-reports` function
7. Function selects unsent reports from `guardian_reports`
8. Emails are sent using Resend
9. Reports are marked as sent in the database

## Database Schema

### Key Tables
- `searches`: Stores user search history for lessons
- `user_events`: Tracks user activity events
- `user_learning_profiles`: Stores user learning preferences and profiles
- `guardians`: Links guardians to children and tracks report preferences
- `guardian_reports`: Stores generated guardian reports with send status

## Cron Job Configuration

The Supabase configuration (`supabase/config.toml`) includes:

- Weekly reports: Every Monday at 9 AM UTC
- Monthly reports: 1st of every month at 9 AM UTC
- Send reports: Every hour to process newly generated reports

## Design Decisions

### Separation of Concerns
- Report generation and email delivery are handled by separate functions
- This prevents spam issues if retries occur
- Each function has a single responsibility

### Consistent Data Models
- Both user and guardian reports use similar data analysis techniques
- Common patterns for engagement scoring and topic analysis
- Shared logic where appropriate

### Scalability
- Supabase Edge Functions handle automated scheduling
- Database-based queuing system for report delivery
- Asynchronous processing of report generation and sending

## Integration Points

The architecture maintains compatibility with existing systems:
- Reuses data access patterns from existing services
- Follows the same API conventions
- Uses the same database schema

## Error Handling

- Comprehensive error handling in all functions
- Logging for debugging and monitoring
- Graceful degradation when data is missing
- Detailed error responses for debugging

## Security Considerations

- Supabase service role keys for database access
- JWT verification disabled for cron jobs (verify_jwt = false)
- Proper data validation and sanitization
- Secure API endpoints with appropriate authentication
