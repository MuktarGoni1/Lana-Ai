# UI/UX Audit: Core Product Flows (Severity-Ranked)

Date: 2026-03-06  
Scope: auth/onboarding, dashboard, term-plan, lessons, lesson generation/open lesson, chatbot  
Method: static flow audit across frontend routes, Next API handlers, and backend route ownership

## P0 Findings

### 1) Lesson generation ownership is fragmented across 3+ contracts
- Flow: `dashboard/lessons -> lesson/[id] -> generation -> open lesson`
- Reproduction path:
1. Open a topic without a cached `lesson_units` record.
2. Frontend triggers `/api/structured-lesson/stream` and also polls Supabase job/unit tables.
3. Depending on which path resolves first, UI may land in inconsistent error/ready states.
- Observed behavior:
  - Frontend hook mixes direct API response handling with independent DB polling.
  - Next route `frontend/app/api/structured-lesson/stream/route.ts` hardcodes backend base URL.
  - Backend also has a separate "unified" lesson status/generate contract (`lesson_routes.py`) that is not wired into the main API router.
- Evidence:
  - `frontend/hooks/useLessonData.ts:205`, `frontend/hooks/useLessonData.ts:397`, `frontend/hooks/useLessonData.ts:416`, `frontend/hooks/useLessonData.ts:466`
  - `frontend/app/api/structured-lesson/stream/route.ts:5`, `frontend/app/api/structured-lesson/stream/route.ts:121`, `frontend/app/api/structured-lesson/stream/route.ts:177`
  - `backend/main.py:619`, `backend/main.py:732`
  - `backend/app/api/routes/lesson_routes.py:2`
  - `backend/app/api/router.py:11`
- Expected behavior:
  - One authoritative generation contract and one state model used by both frontend and backend.
- Root-cause hypothesis:
  - New and legacy lesson-generation paths coexist; frontend and backend were partially migrated but not converged.
- Fix direction:
  - Standardize on one API contract (`generate + status` or `stream + status`) and remove competing paths.
  - Register only one backend lesson generation surface in main router and deprecate unused/legacy handlers.
  - Replace hardcoded backend URL with environment-driven config in stream proxy route.
- Validation checks:
  - For one topic: generated, in-progress, failed, and retry states all resolve through same API path.
  - No direct DB polling fallback needed to recover from API ambiguity.

### 2) Persistent "Backend returned empty lesson" remains a user-facing terminal state
- Flow: `lesson/[id]` open/generate
- Reproduction path:
1. Backend returns stream payload shape not fully matched by parser, or transient parsing misses lesson payload.
2. Stream proxy marks job failed with `EMPTY_LESSON`.
3. User sees generic error and manual retry loop.
- Observed behavior:
  - Frontend stream route returns hard failure when `extractLesson` returns null.
  - Hook suppresses fetch catch details and relies on polling fallback.
- Evidence:
  - `frontend/app/api/structured-lesson/stream/route.ts:173`, `frontend/app/api/structured-lesson/stream/route.ts:177`
  - `frontend/hooks/useLessonData.ts:466`
- Expected behavior:
  - Empty/payload mismatch should degrade into deterministic retryable states with actionable error reason.
- Root-cause hypothesis:
  - Weak contract validation boundaries between stream payload parsing and persisted job state.
- Fix direction:
  - Enforce strict schema validation before persisting failure.
  - Persist parser reason and source payload metadata for observability.
  - Add bounded automatic retry with jitter for `EMPTY_LESSON` before surfacing terminal error.
- Validation checks:
  - Synthetic payload variants (SSE done, direct lesson, payload.lesson_content) all pass parser tests.
  - Terminal empty-lesson error rate drops in logs after retries/validation.

## P1 Findings

### 3) URL canonicalization is inconsistent (`/`, `/homepage`) and causes navigation friction
- Flow: chatbot/dashboard/quiz/children redirects
- Reproduction path:
1. Enter from components that navigate to `/homepage`.
2. App redirects back to `/` (homepage route is redirect-only).
3. Back-stack and page identity become inconsistent.
- Observed behavior:
  - Many components still push `/homepage`.
  - `frontend/app/homepage/page.tsx` is only a redirect.
- Evidence:
  - `frontend/components/chat-with-sidebar.tsx:268`, `frontend/components/chat-with-sidebar.tsx:492`
  - `frontend/lib/navigation.ts:39`
  - `frontend/app/homepage/page.tsx:4`
- Expected behavior:
  - One canonical dashboard route used across app navigation.
- Root-cause hypothesis:
  - Legacy route alias not fully removed from navigation code.
- Fix direction:
  - Canonicalize to `/` and replace `/homepage` pushes/hrefs with a shared route constant.
  - Keep `/homepage` as compatibility redirect only.
- Validation checks:
  - Navigation telemetry shows no internal pushes to `/homepage`.
  - Back button behavior remains stable across dashboard/chatbot/quiz.

### 4) Chatbot mutates URL to `/` while user is still on chatbot view
- Flow: `term-plan -> chatbot?topic=...`
- Reproduction path:
1. Navigate to `/chatbot?topic=Fractions`.
2. Component ingests query and calls `window.history.replaceState({}, '', '/')`.
3. URL shows `/` while chatbot UI remains mounted.
- Observed behavior:
  - URL and rendered view become desynchronized.
- Evidence:
  - `frontend/components/chat-with-sidebar.tsx:118`
  - `frontend/components/chat-with-sidebar.tsx:123`
- Expected behavior:
  - URL should remain `/chatbot` (or `/chatbot?topic=` stripped to `/chatbot`) while on chatbot page.
- Root-cause hypothesis:
  - Query cleanup implementation replaced full pathname instead of only search params.
- Fix direction:
  - Replace with route-consistent cleanup (`/chatbot`) via router replace.
- Validation checks:
  - Loading `/chatbot?topic=...` keeps pathname `/chatbot` after param cleanup.

### 5) Onboarding completion state is written/read from too many sources
- Flow: onboarding gating into dashboard/lessons
- Reproduction path:
1. Complete onboarding via one surface.
2. Another surface reads a different state source (cookie/localStorage/metadata) first.
3. User sees unexpected onboarding redirect/banner state.
- Observed behavior:
  - Completion read from metadata + cookie + localStorage.
  - Completion written in multiple places (API route, onboarding page, term-plan, auth service variants).
- Evidence:
  - `frontend/contexts/UnifiedAuthContext.tsx:230`
  - `frontend/contexts/UnifiedAuthContext.tsx:231`
  - `frontend/contexts/UnifiedAuthContext.tsx:232`
  - `frontend/app/api/onboarding/complete/route.ts:168`
  - `frontend/app/onboarding/page.tsx:378`
  - `frontend/app/term-plan/page.tsx:318`, `frontend/app/term-plan/page.tsx:345`
- Expected behavior:
  - Single source of truth for completion with explicit sync rules.
- Root-cause hypothesis:
  - Backward compatibility patches accumulated without consolidation.
- Fix direction:
  - Make server profile/metadata authoritative.
  - Treat cookie/localStorage as cache hints only, not gate criteria.
  - Centralize writes in one API endpoint.
- Validation checks:
  - Logout/login and refresh preserve identical onboarding state across pages.

### 6) Parent experience is split across two divergent dashboards
- Flow: parent navigation
- Reproduction path:
1. Parent visits root dashboard (`/`) and sees modern dashboard.
2. Parent visits `(parent)/dashboard` and sees separate legacy-style dashboard with different actions.
- Observed behavior:
  - Two dashboards with different UX and behavior.
- Evidence:
  - `frontend/app/page.tsx:27`
  - `frontend/components/dashboard/index.tsx:114`
  - `frontend/app/(parent)/dashboard/page.tsx:11`, `frontend/app/(parent)/dashboard/page.tsx:54`
- Expected behavior:
  - One parent dashboard paradigm with shared components and action semantics.
- Root-cause hypothesis:
  - Parallel implementations created during role-specific feature development.
- Fix direction:
  - Consolidate parent dashboards into one route/component system.
- Validation checks:
  - Parent sees one consistent dashboard regardless of entry path.

### 7) "New Chat" cannot create a distinct session for authenticated users
- Flow: chatbot session management
- Reproduction path:
1. Authenticated user clicks `New Chat`.
2. Code generates `newSid` then overwrites it with `user.id`.
3. History/session remains effectively same identity.
- Observed behavior:
  - Session reset action does not create new logical conversation scope for signed-in users.
- Evidence:
  - `frontend/components/chat-with-sidebar.tsx:231`, `frontend/components/chat-with-sidebar.tsx:235`, `frontend/components/chat-with-sidebar.tsx:238`
- Expected behavior:
  - New chat creates a new conversation/session id while still linked to user account.
- Root-cause hypothesis:
  - SID overloaded to represent both user identity and chat thread identity.
- Fix direction:
  - Separate `user_id` from `session_id` in client and history API.
- Validation checks:
  - Two consecutive "New Chat" actions produce distinct thread ids and isolated history.

## P2 Findings

### 8) Legacy onboarding route stack still coexists with consolidated onboarding flow
- Flow: auth -> onboarding
- Reproduction path:
1. User can still enter old step pages (`/child-info`, `/learning-preference`, `/schedule`) and legacy navigation helpers.
2. New consolidated `/onboarding` has different step model and persistence behavior.
- Observed behavior:
  - Multiple onboarding stacks coexist.
- Evidence:
  - `frontend/lib/navigation.ts:71`, `frontend/lib/navigation.ts:83`, `frontend/lib/navigation.ts:94`, `frontend/lib/navigation.ts:105`
  - `frontend/app/child-info/page.tsx:102`, `frontend/app/learning-preference/page.tsx:76`, `frontend/app/schedule/page.tsx:72`
  - `frontend/app/onboarding/page.tsx` (single 4-step implementation)
- Expected behavior:
  - One onboarding journey with one state model.
- Root-cause hypothesis:
  - Migration to consolidated onboarding left legacy routes active.
- Fix direction:
  - Mark legacy routes as deprecated and route them to canonical onboarding.
- Validation checks:
  - All onboarding entry points resolve to one flow and one completion endpoint.

### 9) Auth/route guard logic is duplicated across layouts/pages with different redirect targets
- Flow: parent/children/settings/lessons
- Reproduction path:
1. Enter restricted routes while auth state is resolving.
2. Different components apply different redirect destinations and timing.
3. User can observe inconsistent transitions/spinner screens.
- Observed behavior:
  - Guarding exists in middleware (API only), per-layout, and per-page.
- Evidence:
  - `frontend/middleware.ts` (API auth guard only)
  - `frontend/app/(parent)/layout.tsx:25`
  - `frontend/app/children/layout.tsx:28`
  - `frontend/app/lessons/page.tsx:39`
  - `frontend/components/dashboard/index.tsx:240`
- Expected behavior:
  - Shared page guard strategy with consistent fallback routes.
- Root-cause hypothesis:
  - Role-based protections were added incrementally without central orchestration.
- Fix direction:
  - Centralize protected-route and role-route decisions in one guard utility.
- Validation checks:
  - Unauthorized users see one consistent redirect policy across protected pages.

## P3 Findings

### 10) Error UX patterns are inconsistent (`toast`, inline cards, `alert`, generic "Something went wrong")
- Flow: cross-feature error handling
- Observed behavior:
  - Core and adjacent flows use mixed interaction patterns and inconsistent actionability.
- Evidence:
  - `frontend/app/lesson/[id]/page.tsx:176`
  - `frontend/app/subscription-management/page.tsx:62`, `frontend/app/subscription-management/page.tsx:99`
  - `frontend/app/test-auth/page.tsx:31`
- Expected behavior:
  - Standardized user error components and recovery actions by error category.
- Fix direction:
  - Adopt one error presentation system for async actions and route failures.

## Highest-Leverage Fix Sequence (Top 5)

1. Consolidate lesson generation contract and remove duplicate paths.
2. Canonicalize routing to `/` for dashboard and remove `/homepage` internal pushes.
3. Consolidate onboarding completion state to one server-authoritative source.
4. Split chat `session_id` from `user_id` and fix "New Chat" semantics.
5. Centralize page/role guard behavior for consistent redirect UX.
