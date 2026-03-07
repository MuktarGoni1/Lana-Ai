# Project Understanding: Lana AI

## What this project is
Lana AI is a full-stack educational tutoring platform in a monorepo:
- **Frontend**: Next.js + React + TypeScript app (`frontend/`)
- **Backend**: FastAPI service in Python (`backend/`)
- **Data layer**: Supabase/Postgres migrations (`supabase/migrations/`)

At the root, npm workspaces orchestrate frontend/backend development and testing from a single command surface.

## High-level architecture

### Frontend
- Runs on port **3001** in local development.
- Uses Next.js App Router and client/server components.
- Includes auth/service abstractions in `frontend/lib/services/*` and typed API contracts in `frontend/types/*`.
- Uses local API routes and backend proxying depending on endpoint ownership.

### Backend
- Runs on port **8000** in local development.
- Exposes `/api/*` routes via a central router (`backend/app/api/router.py`).
- Adds global middleware for:
  - CORS
  - security headers
  - request timing/metrics
  - rate limiting (with Redis fallback behavior)
- Starts/stops async job workers during app lifecycle and warms lesson generation on startup.

### Database and async workflows
- Supabase migrations track schema changes and feature rollouts.
- Backend includes job/queue modules in `backend/app/jobs/*` for asynchronous lesson/video-related processing.
- Lesson flow is designed for progressive delivery (lesson first, richer assets like video afterward).

## How to run

### Monorepo commands (root)
- `npm run dev` – starts frontend + backend together.
- `npm run test` – frontend Jest suite.
- `npm run test:backend` – backend pytest suite.
- `npm run lint` – frontend linting.

### Docker option
`docker-compose.yml` spins up:
- `frontend` (`3001:3001`)
- `backend` (`8000:8000`)

## Key project characteristics observed
- **Good separation of concerns** between UI, API, and persistence/migrations.
- **Production-minded middleware/security posture** in backend bootstrap.
- **Broad feature surface** (lessons, quick mode, chat, reports, guardian reports, TTS, jobs).
- **Operational complexity** is moderate due to multi-service stack + external integrations (Groq, Supabase, video API, optional Redis).

## Where to look first when onboarding
1. `README.md` for local setup and architecture summary.
2. `package.json` (root) for canonical dev/test commands.
3. `backend/main.py` for lifecycle, middleware, and service wiring.
4. `backend/app/api/router.py` for API surface map.
5. `frontend/package.json` + `frontend/app/` for UI runtime and route entrypoints.
6. `supabase/migrations/` for data model evolution.

