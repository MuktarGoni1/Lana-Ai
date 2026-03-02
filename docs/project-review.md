# Project Review: Lana AI Frontend (Next.js)

## Snapshot
- **Framework**: Next.js App Router with TypeScript and React 18.
- **UI Stack**: Tailwind CSS + Radix UI-based component library in `components/ui`.
- **Auth/Data**: Supabase client/auth + custom middleware gatekeeping.
- **Observability**: Sentry instrumentation and custom health endpoints.
- **Runtime Shape**: Hybrid app with both page routes (`app/**/page.tsx`) and route handlers (`app/api/**/route.ts`).

## High-Level Architecture

### 1) Application shell and providers
- `app/layout.tsx` is the root shell; it wires fonts, metadata, theme provider, auth provider, analytics, session monitoring, and service-worker registration.
- Shared client-side provider composition lives in `app/providers.tsx`.

### 2) Route organization
- **User-facing pages** are under `app/` (examples: onboarding, chatbot, pricing, dashboard, lesson flows).
- **Route groups** like `app/(parent)` and `app/(child)` segment role-specific experiences without changing URL structure.
- **Backend-facing API routes** are colocated under `app/api/**` and include auth, quiz, lesson generation, subscription status, TTS, video generation, payments, and onboarding progress.

### 3) API strategy
- `next.config.mjs` defines a proxy-style rewrite layer to forward many `/api/*` paths to an external backend (`NEXT_PUBLIC_API_BASE`) while preserving selected frontend-owned endpoints.
- Middleware in `middleware.ts` protects non-public API routes by checking for Supabase auth cookies and returns 401 for unauthenticated protected requests.

### 4) Integrations
- **Supabase**: client/auth helpers and cookie-based session checks.
- **Sentry**: wrapped Next config and instrumentation files (`instrumentation.ts`, `instrumentation-client.ts`, sentry config files).
- **Payments**: checkout and refund endpoints exist in `app/api/create-checkout-session`, `app/api/process-payment`, and `app/api/process-refund`.

## Notable Strengths
- Clear App Router structure with many capability-specific API route handlers.
- Security hardening in `next.config.mjs` headers (HSTS, X-Frame-Options, no-sniff, etc.).
- Explicit health endpoint and no-store policy for API responses.
- Role-aware app organization via route groups and auth/session components.

## Risks / Gaps Observed
1. **README drift**: `README.md` references `docs/development-habits.md`, which is not present in the repository.
2. **Potential dependency/setup mismatch**: `npm run lint` currently fails because `next` is not available in this environment PATH (likely dependencies not installed in the active workspace context).
3. **Large repository footprint**: the repository appears to contain a very broad file set including a nested `frontend/node_modules` tree, which can make CI and code navigation noisier.

## Suggested Next Steps
1. Add or remove stale docs references in `README.md` (especially `docs/development-habits.md`).
2. Standardize developer bootstrap instructions with a verified "first-run" command set (`npm ci`, env var checklist, lint/test/build order).
3. Audit route ownership between frontend route handlers and backend-proxied rewrites to avoid overlap/regression.
4. Consider pruning committed dependency artifacts (if intentional, document why; otherwise add cleanup).

## Quick Start Validation Checklist
- Install dependencies and ensure local `next` binary resolves.
- Validate `npm run lint`, `npm run test`, and `npm run build`.
- Verify required env vars for Supabase and backend API base.
- Smoke-test key user journeys: auth, dashboard load, quiz flow, lesson generation, and checkout.
