# WebX Ui

*Automatically synced with your [v0.dev](https://v0.dev) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/muktargoni1-3886s-projects/v0-web-x-ui)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/qg2TXVbq8Wx)

## Overview

This repository will stay in sync with your deployed chats on [v0.dev](https://v0.dev).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.dev](https://v0.dev).

## Deployment

Your project is live at:

**[https://vercel.com/muktargoni1-3886s-projects/v0-web-x-ui](https://vercel.com/muktargoni1-3886s-projects/v0-web-x-ui)**

## Build your app

Continue building your app on:

**[https://v0.dev/chat/projects/qg2TXVbq8Wx](https://v0.dev/chat/projects/qg2TXVbq8Wx)**

## How It Works

1. Create and modify your project using [v0.dev](https://v0.dev)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

## Local Development

- Install dependencies: `npm install`
- Run the dev server: `npm run dev` (defaults to `http://localhost:3001`)
- Preview in browser: open `http://localhost:3001/`

## Environment Variables

Set these in `.env.local` before running locally:
- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — your Supabase anon key
- `NEXT_PUBLIC_API_BASE` — backend API base (e.g., `http://localhost:8000`)

See `lib/env.ts` for validation and helpful warnings in development.

## Supabase Table Setup

To set up the required tables for user activity tracking:

1. Navigate to the `frontend` directory
2. Run `npm run supabase:setup` to get instructions for creating the tables
3. Run `npm run supabase:verify` to verify the tables were created

Alternatively, you can manually run the SQL files in the Supabase dashboard:
- `backend/migrations/versions/001_create_user_events_table.sql`
- `backend/migrations/versions/002_add_learning_profile_to_users.sql`

See `scripts/README.md` for more details.

### Available Scripts

- `npm run supabase:setup` - Provides step-by-step instructions for creating required Supabase tables
- `npm run supabase:verify` - Verifies that required tables and columns exist in your Supabase database

## Auth & Routing

- Centralized auth gating with role-based redirects is handled in `middleware.ts`.
- Public routes include: `/landing-page`, `/login`, `/register`, `/onboarding`, `/child-login`.
- Unauthenticated users are redirected to `/landing-page` when visiting protected routes.

## API Route Mappings

- `POST /api/tts` → Proxies to backend `POST /api/tts/` (audio/wav streaming).
- `POST /api/tts/synthesize` → Backend JSON response with base64 audio and duration.
- `GET /api/tts/stream` → Backend progressive audio/wav streaming.
- `POST /api/math-solver/solve` → Backend math solver with SymPy and Groq gate.
- `POST /api/structured-lesson/stream` → Backend SSE stream with `type: "done"` payload.
- `GET /api/history?sid=<userId:session>` → Backend history (requires Bearer Supabase JWT).
- `GET /api/subscription/status` → Frontend route returns `is_pro` from Supabase user metadata.
- `POST /api/avatar/streams/[id]/talk` → Frontend route proxies to D-ID talks API.

## Known Gaps & Notes

- Avatar stream routes (`POST /api/avatar/streams`, `DELETE /api/avatar/streams/:id`, `POST /api/avatar/streams/:id/ice`, `POST /api/avatar/streams/:id/sdp`, `GET /api/avatar/streams/health`) are referenced by the UI but only `talk` is currently implemented. Add missing routes if enabling full avatar streaming.
- History requires `sid` to be namespaced with the Supabase user id (format: `<userId>:<localId>`). The homepage now auto-prefixes when authenticated.
- Backend auth now accepts both HS256 tokens (internal) and Supabase RS256 JWTs via JWKs.

For broader guidance on conventions and hygiene, read:
- `docs/development-habits.md` — routing hygiene, environment hygiene, DX & tooling.
