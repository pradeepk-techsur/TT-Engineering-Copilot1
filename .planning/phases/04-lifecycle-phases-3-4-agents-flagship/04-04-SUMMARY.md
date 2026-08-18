---
phase: 04-lifecycle-phases-3-4-agents-flagship
plan: 04
subsystem: ui
tags: [gap-closure, seed, phase3, isRevised, deterministicChecks, OutputsPanel, InputReadinessPanel, GateReviewWorkspace, playwright]

# Dependency graph
requires:
  - phase: 04-01
    provides: checkResults table, deterministicChecks data shape (checkId PK)
  - phase: 04-02
    provides: /api/phases/3/execute (checks phaseInputs readiness), /api/phases/4/execute (reads body.isRevised), /api/gates/4/review (returns deterministicChecks array)
  - phase: 04-03
    provides: InputReadinessPanel.tsx, GateReviewWorkspace.tsx, OutputsPanel component, flagship-phase4.spec.ts
provides:
  - Phase 3 phaseInputs seed rows (external SI ready + internal UP ready) — POST /api/phases/3/execute no longer returns 409
  - OutputsPanel SWR guard widened to phaseId <= 4 (Phase 3 and 4 show live artifact rows)
  - isRevised detection from readiness.internal.activeVersion > 1 in InputReadinessPanel
  - POST body carries { isRevised } to /api/phases/4/execute
  - "Run Revised Phase" button label when isRevised is true
  - Deterministic Check Results card in GateReviewWorkspace rendering deterministicChecks with Pass/Fail badges (checkId key)
  - UX copy explaining revised baseline workflow on Phase 4 workspace
  - 3 new Playwright tests (Phase 3 OutputsPanel, POST not-409 for Phase 3, Gate 4 heading + check card)
affects: [verify-work, UAT-08, UAT-10]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "isRevised derivation from readiness.internal.activeVersion > 1 — pure client-side, matches server body.isRevised === true strict equality"
    - "onConflictDoNothing() for phaseInputs seed rows — idempotent across container restarts"
    - "Conditional card pattern: (data.deterministicChecks ?? []).length > 0 && <Card> — hides card when no check results yet"

key-files:
  created: []
  modified:
    - src/db/seed.ts (Phase 3 phaseInputs rows, both external SI + internal UP)
    - src/app/phase/[id]/page.tsx (phaseId <= 4 guard; stale comment updated)
    - src/components/intake/InputReadinessPanel.tsx (isRevised detection, POST body, button label, UX hint)
    - src/components/gate/GateReviewWorkspace.tsx (deterministicChecks card; checkId key fixed from code-review)
    - e2e/flagship-phase4.spec.ts (replaced static-text test; +3 new tests)

key-decisions:
  - "phaseId <= 4 replaces phaseId <= 2 — Phase 3/4 now use OutputsPanel SWR; phases 5-9 still use static config.outputs list"
  - "isRevised derived from readiness.internal?.activeVersion > 1 with ?? 0 fallback — safe when readiness data not yet loaded"
  - "onConflictDoNothing() for seed phaseInputs — prevents overwrite of live agent-set state on container restart"
  - "check.checkId (not checkResultId) — code-review W1 caught the field name mismatch against Drizzle schema PK"

patterns-established:
  - "Gap closure seed pattern: phaseInputs rows with exact readinessStatus strings that execute route checks — no reformatting"
  - "UX hint pattern: phase-gated explanatory <p> below error area (phaseId === 4 && !isRevised) — scoped to only the relevant phase"

# Metrics
duration: 15min
completed: 2026-08-18
---

# Phase 4 Plan 04: Gap Closure — Run Phase 3 + Revised-Run Button + Deterministic Check Results Card

**Phase 3 phaseInputs seed rows unlock execute (non-409); OutputsPanel SWR for phases 3–4; isRevised detection + "Run Revised Phase" button closes the revised-run UX gap; deterministicChecks card in Gate 4 Review surfaces check results — closes UAT Tests 8 and 10**

## Performance

- **Duration:** 15 min
- **Started:** 2026-08-18T14:15:00Z
- **Completed:** 2026-08-18T14:35:00Z
- **Tasks:** 2 auto + 1 human checkpoint
- **Files modified:** 5 files

## Accomplishments

- Phase 3 phaseInputs seed rows (external: `Synthetic System Input Ready`, internal: `User Input Ready`) — POST /api/phases/3/execute now reaches the PDR agent instead of returning 409 INPUTS_NOT_READY
- `phaseId <= 4` guard in page.tsx — Phase 3 and Phase 4 workspaces render `<OutputsPanel>` SWR component with live artifact polling
- isRevised detection from `readiness.internal?.activeVersion > 1` in InputReadinessPanel; POST body sends `{ isRevised }`; button label changes to "Run Revised Phase" after a second internal upload
- Deterministic Check Results card in GateReviewWorkspace renders `data.deterministicChecks` with Pass (green) / Fail (red) badges, citing checkId (not checkResultId — fixed by code review)
- 3 new Playwright tests (Phase 3 OutputsPanel data-testid, POST not-409 validation, Gate 4 heading + conditional check card)

## Task Commits

1. **Task 1: Seed Phase 3 phaseInputs rows + fix OutputsPanel guard** - `7139859` (fix)
2. **Task 2: isRevised detection + revised-run button + deterministicChecks card + Playwright tests** - `225ae81` (feat)
3. **Code review fix: checkId field name + stale comment** - `85ced38` (fix)

## Files Created/Modified

- `src/db/seed.ts` — Phase 3 phaseInputs insert block (external + internal, onConflictDoNothing)
- `src/app/phase/[id]/page.tsx` — `phaseId <= 4` guard; comment updated to "phases 0–4"
- `src/components/intake/InputReadinessPanel.tsx` — isRevised derivation, POST body, button label, UX hint paragraph
- `src/components/gate/GateReviewWorkspace.tsx` — deterministicChecks card with Pass/Fail badges; `check.checkId` key
- `e2e/flagship-phase4.spec.ts` — replaced static-text test with OutputsPanel data-testid; +3 new tests

## Decisions Made

- `phaseId <= 4` chosen (not dynamic route check) — simple, readable, consistent with phaseConfig structure where phases 0–4 have /api/phases/{id}/outputs routes
- `body.isRevised === true` strict equality in execute route was pre-existing — client sends boolean, no coercion needed
- `check.checkId` corrected from `check.checkResultId` after code review W1 — Drizzle schema PK is `checkId`

## Deviations from Plan

### Auto-fixed Issues

**1. [Code review W1] checkResultId → checkId in GateReviewWorkspace map key**
- **Found during:** Code review iteration 1
- **Issue:** Plan specified `check.checkResultId` but Drizzle schema PK is `checkId`; key always resolved to `undefined`, falling back to index
- **Fix:** Changed `check.checkResultId ?? idx` to `check.checkId ?? idx`
- **Files modified:** src/components/gate/GateReviewWorkspace.tsx
- **Verification:** `grep -n "checkId" src/components/gate/GateReviewWorkspace.tsx` → line 86
- **Committed in:** 85ced38 (fix)

**2. [Code review W2] Stale comment in page.tsx**
- **Issue:** Comment still said "Route handlers exist for phases 0–2" after guard widened to phaseId <= 4
- **Fix:** Updated to "phases 0–4"
- **Committed in:** 85ced38 (fix)

---

**Total deviations:** 2 auto-fixed (both from code review — field name correctness + documentation accuracy)
**Impact on plan:** Both fixes necessary for correctness (W1) and maintainability (W2). No scope creep.

## Issues Encountered

None — all five file changes applied cleanly, TSC clean, 61/61 tests pass.

## Self-Check

build: pass (npm run build — exit 0)
tests: pass (61/61 vitest — exit 0)
key-files:
  - grep phaseId <= 4 src/app/phase/[id]/page.tsx → line 79 ✓
  - grep "Synthetic System Input Ready" src/db/seed.ts → line 91 ✓
  - grep isRevised src/components/intake/InputReadinessPanel.tsx → lines 41, 80, 82, 83, 120 ✓
  - grep deterministicChecks src/components/gate/GateReviewWorkspace.tsx → lines 77, 84 ✓

## Next Phase Readiness

Phase 4 gaps closed. UAT Tests 8 and 10 now have deterministic repro evidence on disk. VERIFICATION.md status: passed. Phase 4 complete — Phase 5 (Lifecycle Phases 5–7 Agents) may proceed.

---
*Phase: 04-lifecycle-phases-3-4-agents-flagship*
*Completed: 2026-08-18*
