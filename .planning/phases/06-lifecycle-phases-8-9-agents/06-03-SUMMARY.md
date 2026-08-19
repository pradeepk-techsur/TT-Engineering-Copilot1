---
phase: 06-lifecycle-phases-8-9-agents
plan: 03
subsystem: ui
tags: [outputspanel, alert-dialog, playwright, swr, base-ui, gap-closure]

# Dependency graph
requires:
  - phase: 06-lifecycle-phases-8-9-agents
    provides: Phase 8/9 output API routes (/api/phases/8/outputs, /api/phases/9/outputs)
provides:
  - OutputsPanel rendered for ALL phases 0–9 (phaseId <= 7 guard removed)
  - AlertDialogAction wraps AlertDialogPrimitive.Close (confirm auto-closes dialog)
  - 41 Playwright E2E tests passing in eol-and-closure.spec.ts
affects:
  - gate/GateDecisionSelector.tsx (AlertDialogAction confirm now auto-closes)
  - intake/SiIntakeCard.tsx (AlertDialogAction confirm now auto-closes)
  - settings/LlmKeyConfigCard.tsx (AlertDialogAction confirm now auto-closes)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "AlertDialogPrimitive.Close render-prop pattern for all close-triggering actions"
    - "Unconditional OutputsPanel render for all phases — SWR handles pending/loaded states"

key-files:
  created: []
  modified:
    - src/app/phase/[id]/page.tsx
    - src/components/ui/alert-dialog.tsx
    - e2e/eol-and-closure.spec.ts

key-decisions:
  - "OutputsPanel rendered unconditionally for all phaseIds 0–9 — SWR 'Pending phase execution' state is correct UX before phase runs"
  - "AlertDialogAction uses AlertDialogPrimitive.Close with render={<Button/>} — mirrors AlertDialogCancel pattern"
  - "Phase 8/9 expected-outputs tests updated to check OutputsPanel testid (not static config text) — aligns with SWR behavior"
  - "getByLabel('Pass', {exact:true}).first() in E2E test — avoids strict-mode violation from multiple label matches (RadioGroupItem + hidden native input + partial 'Conditional Pass' match)"

patterns-established:
  - "AlertDialogAction pattern: wrap AlertDialogPrimitive.Close with render={<Button variant size />} — all confirm actions use this"

# Metrics
duration: 15min
completed: 2026-08-19
---

# Phase 6 Plan 03: Gap Closure — OutputsPanel Phase Cap + AlertDialog Auto-Close Summary

**Two surgical source fixes: removed phaseId <= 7 cap from OutputsPanel (phases 8/9 now show SWR download links after running), and wrapped AlertDialogAction in AlertDialogPrimitive.Close (confirm button now auto-dismisses dialog in all callers)**

## Performance

- **Duration:** 15 min
- **Started:** 2026-08-19T10:19:31Z
- **Completed:** 2026-08-19T10:34:33Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Removed `phaseId <= 7` guard in `src/app/phase/[id]/page.tsx` — OutputsPanel SWR now renders for all phases 0–9, enabling real download links for phases 8/9 after agent execution
- Fixed `AlertDialogAction` in `src/components/ui/alert-dialog.tsx` to wrap `AlertDialogPrimitive.Close` with `render={<Button/>}` — clicking Confirm in any AlertDialog now auto-closes the dialog (GateDecisionSelector, SiIntakeCard, LlmKeyConfigCard all fixed by this single change)
- Added new `AlertDialog auto-close on Confirm` Playwright test — verifies structural fix: fills reviewer role, selects Pass outcome, opens AlertDialog, clicks Confirm, asserts dialog closes
- All 41 Playwright E2E tests in `eol-and-closure.spec.ts` pass (40 updated + 1 new)

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove OutputsPanel phase cap** - `af9aab1` (feat)
2. **Task 2: Fix AlertDialogAction + add E2E test** - `3b157cd` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `src/app/phase/[id]/page.tsx` — Removed phaseId <= 7 conditional; replaced with unconditional `<OutputsPanel phaseId={phaseId} />`; updated stale comment
- `src/components/ui/alert-dialog.tsx` — AlertDialogAction now wraps AlertDialogPrimitive.Close with render-prop pattern (type signature uses Close.Props & Pick<Button, "variant"|"size">)
- `e2e/eol-and-closure.spec.ts` — Added AlertDialog auto-close test; updated Phase 8/9 outputs tests to use `outputs-panel` testid (SWR pattern replaces static config text check)

## Decisions Made

- `OutputsPanel` rendered unconditionally for all phases — SWR component correctly shows "Pending phase execution" when phase hasn't run yet; this is the intended UX
- `AlertDialogAction` uses exact same pattern as `AlertDialogCancel`: `AlertDialogPrimitive.Close` with `render={<Button/>}` — the `onClick` handler still fires before the dismiss
- Phase 8/9 "expected outputs" tests updated to check `outputs-panel` testid (not static text from `config.outputs`) — these tests now verify the SWR component renders, not specific output names that only appear post-execution
- Playwright strict-mode fix: `getByLabel('Pass', {exact:true}).first()` — `RadioGroupItem` renders both an accessible radio and a hidden native input, both labelled "Pass"

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Playwright strict-mode violation in AlertDialog test**
- **Found during:** Task 2 (E2E test execution)
- **Issue:** `page.getByLabel('Pass')` resolved to 3 elements (RadioGroupItem span, hidden native input with id="outcome-Pass", and hidden input for "Conditional Pass" which partially matched)
- **Fix:** Changed to `page.getByLabel('Pass', { exact: true }).first()` to target only the exact "Pass" label radio element
- **Files modified:** `e2e/eol-and-closure.spec.ts`
- **Verification:** AlertDialog test passes (1/1)
- **Committed in:** 3b157cd (Task 2 commit)

**2. [Rule 1 - Bug] Updated Phase 8/9 expected-outputs tests for SWR behavior**
- **Found during:** Task 2 (E2E test execution after Task 1 change)
- **Issue:** Tests `Phase 8 shows correct expected outputs` and `Phase 9 shows correct expected outputs` checked for static config text ("Obsolescence and Supply-Risk Forecast", etc.) which no longer appears — Task 1 replaced the static fallback with OutputsPanel SWR, which shows "Pending phase execution" when phase hasn't run
- **Fix:** Updated tests to check for `outputs-panel` testid and expect either `outputs-pending` or `output-row` to be visible (accommodating both pre-run and post-run states)
- **Files modified:** `e2e/eol-and-closure.spec.ts`
- **Verification:** Both tests now pass; all 41 tests pass
- **Committed in:** 3b157cd (Task 2 commit)

**3. [Rule 3 - Blocking] Installed Playwright browser + system dependencies**
- **Found during:** Task 2 (E2E test execution)
- **Issue:** Playwright browser not installed in sandbox (`/root/.cache/ms-playwright/chromium_headless_shell-1234` missing); then `libnspr4.so` missing after browser download
- **Fix:** Ran `npx playwright install chromium` then `npx playwright install-deps chromium` to install browser and system dependencies; also ran `npm run db:migrate && npm run db:seed` as DB was empty (dev server running natively but DB container was freshly started)
- **Files modified:** None (runtime environment setup)
- **Verification:** 41 tests pass
- **Committed in:** N/A (environment setup, not code change)

---

**Total deviations:** 3 auto-fixed (2 test bugs, 1 blocking environment setup)
**Impact on plan:** Test bugs required fixing to achieve the 41-pass target. Environment setup was one-time sandbox initialization. No scope creep.

## Issues Encountered

- Playwright browser not cached in sandbox — required `npx playwright install chromium` and `npx playwright install-deps chromium` (one-time setup)
- DB container was freshly started with empty tables — required `npm run db:migrate` + `npm run db:seed` for SWR components and API routes to return data

## Known Stubs

None found.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 6 gap closure complete: OutputsPanel works for all phases 0–9, AlertDialog confirms auto-close across all dialogs
- All 41 E2E tests in `eol-and-closure.spec.ts` pass
- Ready for Phase 6 verify-work or next milestone phase

---
*Phase: 06-lifecycle-phases-8-9-agents*
*Completed: 2026-08-19*

## Self-Check: PASSED

- `src/app/phase/[id]/page.tsx` — exists ✓
- `src/components/ui/alert-dialog.tsx` — exists ✓
- `e2e/eol-and-closure.spec.ts` — exists ✓
- Task 1 commit af9aab1 — exists ✓
- Task 2 commit 3b157cd — exists ✓
- Build check: `npx tsc --noEmit` → exit 0, 0 errors ✓
- Playwright: 41 passed, 0 failed ✓
- Known stubs: None ✓
