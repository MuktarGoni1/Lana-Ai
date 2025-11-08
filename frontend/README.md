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

## Auth & Routing

- Centralized auth gating with role-based redirects is handled in `middleware.ts`.
- Public routes include: `/landing-page`, `/login`, `/register`, `/onboarding`, `/child-login`.
- Unauthenticated users are redirected to `/landing-page` when visiting protected routes.

For broader guidance on conventions and hygiene, read:
- `docs/development-habits.md` — routing hygiene, environment hygiene, DX & tooling.
