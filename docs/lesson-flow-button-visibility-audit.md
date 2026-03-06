# Lesson Flow Button Visibility Audit

Date: 2026-03-06  
Pages reviewed:
- `/lesson/[id]/learn`
- `/lesson/[id]/quiz`
- `/lesson/[id]/video`

## Audit Method
- Static UI code review of lesson-flow pages/components.
- Runtime validation through automated DOM visibility and keyboard tests.
- Contrast validation using WCAG 2.1 AA ratio checks (minimum 4.5:1 for normal text).

## Findings and Fixes

| Severity | Location | Button | Current state found | Expected state | Fix implemented |
|---|---|---|---|---|---|
| Medium | `frontend/app/lesson/[id]/learn/page.tsx` | `Back to lessons` | Small `text-xs`, no explicit focus-visible styling, no standardized min touch height. | Clearly visible, keyboard-focus ring, min 44px target. | Migrated to shared accessible button class with min height, focus ring, stronger sizing. |
| Medium | `frontend/app/lesson/[id]/learn/page.tsx` | `Continue to quiz` | Visible but not standardized for forced-colors/high-contrast environments. | Stable visibility in normal and high-contrast modes. | Added shared primary class + forced-colors media fallback. |
| Medium | `frontend/app/lesson/[id]/quiz/page.tsx` | `Back to lesson` | Small text and inconsistent interaction affordance relative to primary actions. | Consistent visual hierarchy and keyboard focus behavior. | Switched to shared secondary button class and explicit `type=\"button\"`. |
| Medium | `frontend/components/lesson-flow/flow-ui.tsx` | `Submit Quiz` | No shared focus pattern; visibility depended on local classes. | Consistent focus visibility and disabled state clarity. | Applied shared primary button class with focus-visible ring and disabled styling. |
| Medium | `frontend/components/lesson-flow/flow-ui.tsx` | `Retry Video` | Smaller, less prominent and no high-contrast hardening. | Clearly visible retry action in failure state. | Applied shared secondary class and forced-colors support. |
| Low | `frontend/components/lesson-flow/flow-ui.tsx` | `Try Again` (error state) | Used standalone style path not aligned with flow controls. | Same visibility/accessibility standard as other CTAs. | Unified with shared primary button class. |
| Low | all three lesson-flow pages | all action buttons | Missing explicit `type=\"button\"` can create implicit submit behavior in future form wrappers. | No accidental form submit behavior. | Added explicit `type=\"button\"`. |

## CSS / Rendering Root Causes
- Inconsistent local button styling across pages/components created variable prominence.
- Missing shared focus-visible treatment reduced keyboard discoverability.
- No explicit forced-colors fallback for high contrast mode.
- Small typography (`text-xs`) and no standardized min-height lowered visibility on small screens.

## WCAG 2.1 AA Checks
- `#ffffff` on `#2563eb` (primary): **passes** >= 4.5:1.
- `#1a1a18` on `#ffffff` (secondary): **passes** >= 4.5:1.
- `#ffffff` on `#dc2626` (error): **passes** >= 4.5:1.

Automated in:
- `frontend/lib/accessibility/contrast.test.ts`

## Automated Regression Coverage Added
- `frontend/components/lesson-flow/flow-ui.test.tsx`
  - Visibility assertions (`toBeVisible`) for critical buttons.
  - Keyboard navigation focus assertion (`userEvent.tab` + `toHaveFocus`).
  - State-based checks for quiz/video buttons.
  - Snapshot baseline for lesson-shell button block rendering.

## Browser/Device Coverage Note
- In this environment, cross-browser E2E runners (Chromium/Firefox/WebKit, Edge channel) are not installed/configured.
- The implemented tests are deterministic unit/integration checks that run in current CI tooling (Jest + JSDOM).
- For true browser matrix verification, run equivalent E2E checks with Playwright in a browser-enabled environment.

