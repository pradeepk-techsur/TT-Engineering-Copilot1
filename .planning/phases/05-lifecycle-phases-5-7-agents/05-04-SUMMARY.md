---
phase: 05-lifecycle-phases-5-7-agents
plan: "04"
subsystem: ui, testing
tags: [nextjs, cpk, swr, outputs-panel, gap-closure, phase-workspace]

# Dependency graph
requires:
  - phase: 05-lifecycle-phases-5-7-agents
    provides: Phase 5–7 agents, /api/phases/5-7/outputs routes, cpkCalculation tool with seeded SI-06 finding
provides:
  - OutputsPanel rendered for phases 5, 6, 7 (SWR live artifact downloads)
  - INITIAL_PROCESS_DATA with exactly one Cpk failure (SOLDER_JOINT_SHEAR_HV_BUS SI-06)
  - Targeted F6-001-SOLDER_JOINT_SHEAR_HV_BUS closure on revised Cpk run
affects: [05-lifecycle-phases-5-7-agents, gate-6-review, phase-5-workspace, phase-6-workspace, phase-7-workspace]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Targeted characteristic-specific finding closure instead of aggregate overallStatus check"
    - "OutputsPanel guard boundary phaseId <= 7 covers all phases with live /outputs routes"

key-files:
  created: []
  modified:
    - src/app/phase/[id]/page.tsx
    - src/server/tools/cpkCalculation.ts

key-decisions:
  - "phaseId <= 7 guard replaces phaseId <= 4 — phases 5, 6, 7 now use SWR OutputsPanel with live download links"
  - "Closure condition targets SOLDER_JOINT_SHEAR_HV_BUS.status === 'Pass' not overallStatus — more resilient to future data additions"
  - "Three INITIAL_PROCESS_DATA rows corrected so only SI-06 fails: HV_BUS_PRESS_FIT Cpk=1.389, BRACKET_TORQUE_MOP012 Cpk=1.667, OUTPUT_POWER_ACCURACY Cpk=1.333"

patterns-established:
  - "Finding closure: target the specific seeded characteristic, not aggregate overallStatus"
  - "OutputsPanel guard = highest phase with live /api/phases/{id}/outputs route"

# Metrics
duration: 2min
completed: 2026-08-18
---

# Phase 5 Plan 04: Gap Closure — OutputsPanel Guard + Cpk Data Fix Summary

**OutputsPanel guard extended to phaseId <= 7 and INITIAL_PROCESS_DATA corrected so only SOLDER_JOINT_SHEAR_HV_BUS fails (Cpk=0.131), enabling targeted F6-001 closure on revised Cpk run**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-08-18T23:43:38Z
- **Completed:** 2026-08-18T23:44:57Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Phases 5, 6, 7 workspaces now render the SWR-powered OutputsPanel component with live artifact download links (was showing static config list with no download links)
- `INITIAL_PROCESS_DATA` corrected: exactly one failing characteristic (`SOLDER_JOINT_SHEAR_HV_BUS` Cpk=0.1310 < 1.33); three previously-failing rows now pass (HV_BUS_PRESS_FIT Cpk=1.389, BRACKET_TORQUE_MOP012 Cpk=1.667, OUTPUT_POWER_ACCURACY Cpk=1.333)
- On the revised Cpk run, `SOLDER_JOINT_SHEAR_HV_BUS` passes (Cpk=1.333) and the targeted closure condition fires, setting `F6-001-SOLDER_JOINT_SHEAR_HV_BUS` to `VerifiedClosed`

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend OutputsPanel guard to phaseId <= 7** — `860b31d` (feat)
2. **Task 2: Fix cpkCalculation.ts data and closure condition** — `6b095e0` (fix)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `src/app/phase/[id]/page.tsx` — Changed `phaseId <= 4` → `phaseId <= 7` guard on OutputsPanel; updated comment to reflect phases 0–7 have live outputs routes
- `src/server/tools/cpkCalculation.ts` — Corrected three INITIAL_PROCESS_DATA rows (HV_BUS_PRESS_FIT, BRACKET_TORQUE_MOP012, OUTPUT_POWER_ACCURACY) to produce Cpk ≥ 1.33; replaced `overallStatus === 'Pass'` closure with targeted `solderJointResult.status === 'Pass'` condition

## Decisions Made

- `phaseId <= 7` is the correct boundary because `/api/phases/5/outputs`, `/api/phases/6/outputs`, and `/api/phases/7/outputs` were all already deployed with real artifact records — the guard was a UI filter, not an auth boundary
- Targeted closure condition (`solderJointResult.status === 'Pass'`) is more resilient than aggregate `overallStatus === 'Pass'` — if a future data change adds another non-seeded characteristic that fails, F6-001 still closes correctly as long as the specific SI-06 finding is resolved

## Deviations from Plan

None — plan executed exactly as written. Bug 2 in the plan correctly noted that the closure condition (`overallStatus === 'Pass'`) would have fired correctly after Bug 1 was fixed, but recommended the targeted condition for robustness. Both changes implemented as specified.

## Known Stubs

None found.

## Issues Encountered

None — both changes are minimal targeted edits (2 lines in page.tsx, 8 lines in cpkCalculation.ts). TypeScript compilation clean (`npx tsc --noEmit` exits 0 with no errors).

## Verification Results

```
GUARD OK:    grep 'phaseId <= 7' src/app/phase/[id]/page.tsx → line 79
HV_BUS OK:   HV_BUS_PRESS_FIT Cpk=1.3889 PASS
BRACKET OK:  BRACKET_TORQUE_MOP012 Cpk=1.6667 PASS
POWER OK:    OUTPUT_POWER_ACCURACY Cpk=1.3333 PASS
SOLDER SI06: SOLDER_JOINT_SHEAR_HV_BUS Cpk=0.1310 FAIL (correct)
DATA_FIX_VALID
CLOSURE OK:  solderJointResult.status === 'Pass' condition present
TypeScript:  npx tsc --noEmit → exit 0 (clean)
```

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 5 UAT gaps SI-06 and OP-07 are closed
- Phase 5, 6, 7 workspace OutputsPanel renders with live download links
- Phase 6 Cpk correction cycle now correctly closes F6-001-SOLDER_JOINT_SHEAR_HV_BUS to VerifiedClosed
- Ready for Phase 5 UAT re-run / Phase 5 completion

---
*Phase: 05-lifecycle-phases-5-7-agents*
*Completed: 2026-08-18*

## Self-Check: PASSED

- `src/app/phase/[id]/page.tsx` — EXISTS, `phaseId <= 7` guard confirmed
- `src/server/tools/cpkCalculation.ts` — EXISTS, corrected values and `solderJointResult` closure confirmed
- Commit `860b31d` — EXISTS (feat(05-04): extend OutputsPanel guard to phaseId <= 7)
- Commit `6b095e0` — EXISTS (fix(05-04): correct INITIAL_PROCESS_DATA Cpk values and targeted F6-001 closure)
- Build check: `npx tsc --noEmit` → exit 0 (PASSED)
- Known Stubs: None found
