# Project Understanding: Lana AI

## 1) What this repository is

Lana AI is a monorepo for an education platform with:

- A **Next.js frontend** (`frontend/`) for user-facing experiences and Next API routes.
- A **FastAPI backend** (`backend/`) for AI lesson generation, chat, TTS, reports, and job orchestration.
- **Supabase migrations** (`supabase/migrations/`) for persistent schema evolution.

The root workspace scripts coordinate running frontend and backend together.

## 2) Runtime architecture (high level)

### Frontend (Next.js App Router)

- Uses **Next.js 16** + React + TypeScript.
- Includes many page routes (`frontend/app/...`) for parent/child flows, lessons, onboarding, pricing, blog, and account management.
- Includes extensive **Next API route handlers** under `frontend/app/api/**`.
  - Some routes proxy to backend services.
  - Others handle platform concerns such as auth, payments, onboarding, reminders, and lesson/video orchestration.

### Backend (FastAPI)

- Entry point: `backend/main.py`.
- Registers middleware for:
  - CORS
  - security headers
  - global rate limiting
  - request timing/metrics
- Loads settings, initializes optional Groq client, and configures cache-backed lesson services.
- Includes API router under `/api` with route modules for lessons, math solver, tts, history, jobs, chat, quick mode, reports, and guardian reports.

### Data layer

- Supabase/Postgres is the primary persistent store.
- SQL migrations in `supabase/migrations/` and `backend/migrations/versions/` show active schema and feature evolution.

## 3) Repo layout and responsibilities

- `frontend/`
  - `app/`: pages + API routes
  - `components/`: UI and feature components
  - `hooks/`: frontend state and data hooks
  - `lib/`: auth, API clients, security utilities, analytics, monitoring, service abstractions
  - `types/`: shared TypeScript types
- `backend/`
  - `app/api/routes/`: endpoint modules
  - `app/services/`: lesson, quiz, reports, tts, chat-adjacent, math solver, guardian workflows
  - `app/repositories/`: cache/supabase/history repository abstractions
  - `app/jobs/`: job workers/processors/queue configuration
  - top-level `test_*.py`: functional and integration-oriented checks
- `supabase/migrations/`: centralized SQL migration history for product features
- `docs/`: internal implementation notes/audits

## 4) Key capabilities inferred from code organization

- **AI lesson generation** with structured lesson routes and caching.
- **Async job model** for long-running generation workflows.
- **Video generation/status flows** with frontend and backend endpoints.
- **Parent/child education workflows** including guardian-specific pages and guardian reports.
- **Authentication and session management** around Supabase.
- **Operational hardening** via middleware for security headers, rate limits, and timing metrics.

## 5) How to run locally

From repo root:

1. Install dependencies:
   - `npm run install:all`
2. Run both apps:
   - `npm run dev`
3. Default ports:
   - Frontend: `3001`
   - Backend: `8000`

Docker is also supported via `docker-compose.yml` scripts.

## 6) Practical orientation for new contributors

- Start with `README.md` for setup and architecture intent.
- For UI/product flows, inspect `frontend/app/**` routes first.
- For backend features, trace from `backend/app/api/routes/*` to `backend/app/services/*`.
- For data impacts, inspect `supabase/migrations/*` and `backend/migrations/versions/*`.
- For behavior changes affecting orchestration, include both frontend route handlers and backend endpoints in verification.

## 7) Suggested next deep-dive checkpoints

- Build an endpoint map linking each frontend API route to backend route(s) and expected payload contract.
- Document critical auth/session flows end-to-end (parent, child, guardian).
- Inventory asynchronous job states and retry/error behavior.
- Create a test matrix by feature area (lesson generation, video pipeline, reports, payments, onboarding).
