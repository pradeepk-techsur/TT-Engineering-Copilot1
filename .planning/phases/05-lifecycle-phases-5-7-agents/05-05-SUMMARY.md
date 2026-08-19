---
phase: 05-lifecycle-phases-5-7-agents
plan: "05"
subsystem: ui, testing
tags: [nextjs, si-intake, ingest-revised, playwright, gap-closure, phase-workspace, e2e]

# Dependency graph
requires:
  - phase: 05-lifecycle-phases-5-7-agents
    provides: Phase 5–7 agents, SiIntakeCard component, OutputsPanel with outputs-pending testid
provides:
  - SiIntakeCard with allowRevise prop and Ingest Revised Sample AlertDialog button
  - InputReadinessPanel wiring allowRevise to SI cards when isReady=true
  - Updated E2E tests checking outputs-pending instead of static output names
affects: [05-lifecycle-phases-5-7-agents, phase-6-workspace, si-intake, e2e-suite]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "allowRevise prop pattern: parent controls when revision is allowed; SiIntakeCard renders AlertDialog conditionally"
    - "E2E test pattern: check outputs-pending testid for phases without executed outputs"

key-files:
  created: []
  modified:
    - src/components/intake/SiIntakeCard.tsx
    - src/components/intake/InputReadinessPanel.tsx
    - e2e/phases-5-7.spec.ts
    - e2e/intake-framework.spec.ts

key-decisions:
  - "allowRevise=isReady===true — Ingest Revised available whenever SI is ready, not gated by phase number; generic for all correction cycles"
  - "E2E tests updated to check outputs-pending testid — aligns with OutputsPanel design: 'Pending phase execution' shown before any phase runs"

patterns-established:
  - "SI card revision pattern: allowRevise prop + ingestingRevised state + handleIngestRevised handler mirrors initial ingest handler"
  - "Test-first output verification: check outputs-pending/outputs-panel testids for sandboxes without phase execution"

# Metrics
duration: 7min
completed: 2026-08-19
---

# Phase 5 Plan 05: Gap Closure — Ingest Revised Sample + E2E Test Alignment Summary

**SiIntakeCard gains Ingest Revised Sample AlertDialog button (allowRevise prop) and 4 E2E output tests updated to check outputs-pending testid, restoring green E2E suite (55/55 passed)**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-08-19T02:05:18Z
- **Completed:** 2026-08-19T02:12:28Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- `SiIntakeCard` now renders an "Ingest Revised Sample" AlertDialog button when `isReady=true` AND `allowRevise=true`, enabling the Phase 6 Cpk correction cycle UI
- Button POSTs to `/api/phases/${phaseId}/inputs/${inputRole}/ingest-revised` with `{ confirm_viewed: true }` — same pattern as initial ingest
- `InputReadinessPanel` passes `allowRevise={isReady===true}` to all SI intake cards (both external and internal)
- 4 previously-failing E2E tests updated to check `getByTestId('outputs-pending')` visible instead of static output names
- All 55 Playwright tests pass (0 failures, no regressions)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Ingest Revised Sample to SiIntakeCard and wire from InputReadinessPanel** — `43e5b45` (feat)
2. **Task 2: Update 4 failing E2E tests to check 'Pending phase execution'** — `d5cdb18` (fix)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `src/components/intake/SiIntakeCard.tsx` — Added `allowRevise?: boolean` prop, `ingestingRevised` state, `handleIngestRevised` handler (POSTs to `/ingest-revised`), and conditional AlertDialog button with amber styling and `data-testid="ingest-revised-sample-{inputRole}"`
- `src/components/intake/InputReadinessPanel.tsx` — Added `allowRevise={readiness.external?.isReady === true}` and `allowRevise={readiness.internal?.isReady === true}` to both SI intake card renders
- `e2e/phases-5-7.spec.ts` — Updated 3 tests: Phase 5/6/7 'shows correct expected outputs' now check `getByTestId('outputs-pending')` visible
- `e2e/intake-framework.spec.ts` — Updated 1 test: 'Phase workspace shows both expected outputs' now checks `getByTestId('outputs-pending')` visible

## Decisions Made

- `allowRevise=isReady===true` (not phase-gated): Any SI card that has been ingested once can be re-ingested. Generic — benefits any future phase with a correction cycle, not just Phase 6. The `isReady` flag already implies first ingestion occurred.
- E2E test update option (b) chosen: Update tests to check `outputs-pending` testid rather than adding a static expected-outputs list to OutputsPanel. The latter would show ghost data before phase runs — inconsistent with design intent.

## Deviations from Plan

None — plan executed exactly as written. Both tasks implemented per spec. The `allowReviseSi` helper function described in the plan was simplified to a direct inline expression `readiness.external?.isReady === true` in InputReadinessPanel — functionally equivalent and more concise.

## Known Stubs

None found.

## Issues Encountered

- **Playwright browser unavailable in Docker container** (Alpine musl vs glibc): The running app container uses Alpine Linux, which cannot run the glibc-compiled Chromium headless shell. Resolved by installing `@playwright/test` on the host system (Ubuntu) and running playwright from the host against the already-running Docker app server (`reuseExistingServer: true`). Required installing system dependencies with `playwright install-deps chromium`. This is a pre-existing environment constraint, not introduced by this plan.

## Verification Results

```
TSC:              docker exec project-app-1 npx tsc --noEmit → exit 0 (clean)
INGEST_REVISED:   grep 'ingest-revised' SiIntakeCard.tsx → lines 65, 205 (handler + testid)
ALLOW_REVISE:     grep 'allowRevise' SiIntakeCard.tsx → lines 25 (prop), 30 (destructure), 200 (conditional)
WIRING:           grep 'allowRevise' InputReadinessPanel.tsx → lines 165, 199
TESTID:           grep 'confirm-ingest-revised' SiIntakeCard.tsx → line 222
PHASES_5_7:       grep 'outputs-pending' e2e/phases-5-7.spec.ts → lines 23, 63, 92
INTAKE_FRAMEWORK: grep 'outputs-pending' e2e/intake-framework.spec.ts → line 21
PLAYWRIGHT:       55 passed (0 failed)
```

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 5 UAT gap closure complete: SI-06 (Ingest Revised Sample UI) and E2E test alignment resolved
- Phase 6 SI internal card will show "Ingest Revised Sample" button after first ingestion, enabling the Cpk correction cycle demo
- E2E suite restored to green (55/55)
- Phase 5 complete — ready for Phase 5 UAT sign-off

---
*Phase: 05-lifecycle-phases-5-7-agents*
*Completed: 2026-08-19*

## Self-Check: PASSED

- `src/components/intake/SiIntakeCard.tsx` — EXISTS, `ingest-revised` handler + `allowRevise` prop confirmed
- `src/components/intake/InputReadinessPanel.tsx` — EXISTS, `allowRevise` wiring confirmed
- `e2e/phases-5-7.spec.ts` — EXISTS, `outputs-pending` testid checks confirmed
- `e2e/intake-framework.spec.ts` — EXISTS, `outputs-pending` testid check confirmed
- `.planning/phases/05-lifecycle-phases-5-7-agents/05-05-SUMMARY.md` — EXISTS
- Commit `43e5b45` — EXISTS (feat(05-05): add Ingest Revised Sample button)
- Commit `d5cdb18` — EXISTS (fix(05-05): update 4 E2E tests)
- Build check: `docker exec project-app-1 npx tsc --noEmit` → exit 0 (PASSED)
- Known Stubs: None found
