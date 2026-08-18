---
phase: 04-lifecycle-phases-3-4-agents-flagship
plan: 01
subsystem: deterministic-checks
tags: [deterministic, engineering-checks, hv-clearance, derating, test-point, cross-artifact, evinv-poc-std-001, vitest, typescript]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: check_results table, findings table, DB schema (checkResults, findings pgTable definitions)
  - phase: 03-lifecycle-phases-0-2-agents
    provides: agentTypes.ts (AgentFinding interface)
provides:
  - EVINV_POC_STD_001 constant with synthetic label, all thresholds (clearance §3.1, derating §3.3, testPoint §4.2, consistency §2.1, cpk §5.1)
  - POC_STD_LABEL = 'Synthetic POC Standard, not an approved TT or industry standard'
  - runHVClearanceCheck() — deterministic, detects SI-03a (VBUS+ to GND_SHIELD 6.2mm < 8.0mm)
  - runComponentDeratingCheck() — deterministic, detects SI-03b (C_BULK_3 4.4% < 50%)
  - runTestPointCoverageCheck() — deterministic, detects SI-03c (DIAG_TEMP_IGBT_CASE no TP)
  - runCrossArtifactConsistencyCheck() — deterministic, detects SI-03d (C_HV_1 0805 vs 1206)
  - CheckToolResult/CheckItem/HVClearanceItem/DeratingItem/TestPointItem/ConsistencyItem interfaces
  - POST /api/checks/phase/[id]/run — runs all 4 checks; supports isRevised=true
  - GET /api/checks/phase/[id]/results — returns stored check results
  - 15/15 vitest unit tests covering all seeded issue detection and post-revision pass scenarios
affects: [SI-03a, SI-03b, SI-03c, SI-03d, Phase 4 gate review, correction cycle verification]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Deterministic check pattern: zero LLM calls, pure TypeScript arithmetic/string comparison with seeded data arrays"
    - "REVISED_* data arrays pattern: initial data detects issue, revised data passes after correction — controls isRevised flag"
    - "sourceReference always composed as ${clause} — ${POC_STD_LABEL} to ensure synthetic label propagates to every check result"
    - "onConflictDoNothing() for finding inserts prevents duplicate findings on repeated check runs"

key-files:
  created:
    - src/server/tools/evinvPocStd001.ts (EVINV_POC_STD_001 + POC_STD_LABEL)
    - src/server/tools/toolTypes.ts (CheckToolResult, CheckItem, specialized item interfaces)
    - src/server/tools/hvClearanceCheck.ts (runHVClearanceCheck, detects SI-03a)
    - src/server/tools/componentDeratingCheck.ts (runComponentDeratingCheck, detects SI-03b)
    - src/server/tools/testPointCoverageCheck.ts (runTestPointCoverageCheck, detects SI-03c)
    - src/server/tools/crossArtifactConsistencyCheck.ts (runCrossArtifactConsistencyCheck, detects SI-03d)
    - src/app/api/checks/phase/[id]/run/route.ts (POST — runs all 4 checks for Phase 4)
    - src/app/api/checks/phase/[id]/results/route.ts (GET — returns stored results)
    - tests/deterministic-checks.test.ts (15 unit tests, all passing)
  modified: []

key-decisions:
  - "Concrete RawComponent/ComputedComponent interfaces in componentDeratingCheck.ts — DeratingItem extends CheckItem (index signature) made Omit<DeratingItem,...> produce unknown-typed fields, breaking arithmetic"
  - "closedAt uses new Date().toISOString() — schema timestamptz helper uses mode: 'string', requires ISO string not Date object (consistent with Phase 1 decision)"
  - "toolTypes.ts uses CheckItem with [key: string]: unknown index signature for jsonb column compatibility; check files use concrete local interfaces for type-safe computation, cast to unknown[] for DB insert"
  - "All four checks share the same isRevised parameter pattern — consistent with Phase 3 isRevised pattern established in Plan 03-01"

patterns-established:
  - "Deterministic check pattern: pure TypeScript with seeded data arrays, zero LLM dependency, verified by grep + vitest source-scan test"
  - "EVINV-POC-STD-001 sourceReference pattern: every check result cites clause with POC_STD_LABEL suffix"
  - "seeded=true at finding insert — never modified, distinguishes seeded vs discovered issues"

# Metrics
duration: 5min
completed: 2026-08-18
---

# Phase 4 Plan 01: Deterministic Engineering Checks Summary

**Four deterministic engineering checks (HVClearance, ComponentDerating, TestPointCoverage, CrossArtifactConsistency) with EVINV-POC-STD-001 synthetic standard definition — zero LLM calls, all four Phase 4 seeded issues detected and verified correctable**

## Performance

- **Duration:** 5 min
- **Started:** 2026-08-18T04:20:37Z
- **Completed:** 2026-08-18T04:26:09Z
- **Tasks:** 2 completed
- **Files modified:** 9 files created

## Accomplishments

- EVINV_POC_STD_001 synthetic standard with mandatory `POC_STD_LABEL = 'Synthetic POC Standard, not an approved TT or industry standard'` — every check result's sourceReference carries this label
- Four deterministic checks with zero LLM calls — verified by grep and vitest source-scan test; all seeded issues detected with `seeded=true` at finding insert time
- Revised data arrays in each check produce Pass on all four checks — demonstrating the full correction cycle
- Check runner API (POST /api/checks/phase/[id]/run with isRevised support) and results GET route
- 15/15 vitest unit tests passing — covering all seeded issue detection, post-revision pass, and no-LLM-dependency assertions

## Task Commits

Each task was committed atomically:

1. **Task 1: EVINV-POC-STD-001 definition, tool types, and four deterministic checks** - `d99e790` (feat) + `046c721` (feat: prerequisite checks pre-committed)
2. **Task 2: Check runner API routes and unit tests** - already committed in `046c721`

**Plan metadata:** _(this commit)_ (docs: complete plan)

## Files Created/Modified

- `src/server/tools/evinvPocStd001.ts` — EVINV_POC_STD_001 constant + POC_STD_LABEL export
- `src/server/tools/toolTypes.ts` — CheckToolResult, CheckItem, HVClearanceItem, DeratingItem, TestPointItem, ConsistencyItem
- `src/server/tools/hvClearanceCheck.ts` — detects SI-03a; seeded=true on VBUS+ to GND_SHIELD finding
- `src/server/tools/componentDeratingCheck.ts` — detects SI-03b; seeded=true on C_BULK_3 finding
- `src/server/tools/testPointCoverageCheck.ts` — detects SI-03c; seeded=true on DIAG_TEMP_IGBT_CASE finding
- `src/server/tools/crossArtifactConsistencyCheck.ts` — detects SI-03d; seeded=true on C_HV_1 finding
- `src/app/api/checks/phase/[id]/run/route.ts` — POST handler running all 4 checks for Phase 4
- `src/app/api/checks/phase/[id]/results/route.ts` — GET handler returning stored check results
- `tests/deterministic-checks.test.ts` — 15 unit tests (15/15 passing)

## Decisions Made

1. **Concrete local interfaces in componentDeratingCheck**: `DeratingItem extends CheckItem` produces `unknown`-typed arithmetic fields via TypeScript's index signature propagation. Used concrete `RawComponent`/`ComputedComponent` interfaces for type-safe computation; cast to `unknown[]` only at DB insert boundary.

2. **closedAt as ISO string**: Consistent with Phase 1 + Phase 3 decisions — `timestamptz` helper uses `mode: 'string'`, so all timestamps use `new Date().toISOString()`.

3. **sourceReference template pattern**: Every `sourceReference` is built as `` `${EVINV_POC_STD_001.<domain>.clause} — ${POC_STD_LABEL}` `` — the clause constant already contains "Synthetic POC Standard" in the string, and POC_STD_LABEL appends the full "not an approved TT or industry standard" warning. This ensures the synthetic label is never separable from any check result record.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed DeratingItem extends CheckItem index signature making arithmetic fields unknown**
- **Found during:** Task 1 (TypeScript check after writing componentDeratingCheck.ts)
- **Issue:** `Omit<DeratingItem, ...>` produced `unknown`-typed fields for `rated_value` and `operating_value` because `DeratingItem extends CheckItem` with `[key: string]: unknown` index signature; TypeScript reported TS18046 errors
- **Fix:** Replaced `Omit<DeratingItem,...>` with concrete `RawComponent` and `ComputedComponent` interfaces for type-safe arithmetic; cast to `unknown[]` at DB insert boundary only
- **Files modified:** `src/server/tools/componentDeratingCheck.ts`
- **Verification:** `npx tsc --noEmit` → 0 errors
- **Committed in:** d99e790 (Task 1 commit)

**2. [Rule 1 - Bug] Fixed closedAt Date type mismatch in hvClearanceCheck.ts**
- **Found during:** Task 1 (TypeScript check)
- **Issue:** `.set({ closedAt: new Date() })` passed a Date object; schema `timestamptz` helper uses `mode: 'string'` requiring ISO string
- **Fix:** Changed to `.set({ closedAt: new Date().toISOString() })`
- **Files modified:** `src/server/tools/hvClearanceCheck.ts`
- **Verification:** `npx tsc --noEmit` → 0 errors
- **Committed in:** d99e790 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes required for TypeScript correctness. No scope creep.

## Known Stubs

None found — all implementations are real deterministic logic with seeded data arrays, DB writes, and finding inserts.

## Issues Encountered

- Task 2 files (API routes, test file) were already committed in `046c721` (feat(04-02): prerequisite deterministic checks from 04-01) by a previous phase-4 execution that ran as Rule 3 prerequisite work. This was discovered when git status showed those files already tracked. All verification still run and passed.

## User Setup Required

None - no external service configuration required. Deterministic checks use no external services.

## Next Phase Readiness

- All four deterministic checks ready for Phase 4 gate agent integration (Plan 04-02)
- EVINV-POC-STD-001 standard definition available for all future checks (Phase 6 Cpk)
- seeded=true flags in place for SI-03a–d — enabling correction cycle tracking in Phase 4 gate review
- Check runner API supports isRevised=true for correction cycle demonstration

---
*Phase: 04-lifecycle-phases-3-4-agents-flagship*
*Completed: 2026-08-18*

## Self-Check: PASSED

- [x] `src/server/tools/evinvPocStd001.ts` — FOUND
- [x] `src/server/tools/toolTypes.ts` — FOUND
- [x] `src/server/tools/hvClearanceCheck.ts` — FOUND
- [x] `src/server/tools/componentDeratingCheck.ts` — FOUND
- [x] `src/server/tools/testPointCoverageCheck.ts` — FOUND
- [x] `src/server/tools/crossArtifactConsistencyCheck.ts` — FOUND
- [x] `src/app/api/checks/phase/[id]/run/route.ts` — FOUND
- [x] `src/app/api/checks/phase/[id]/results/route.ts` — FOUND
- [x] `tests/deterministic-checks.test.ts` — FOUND
- [x] Commits d99e790, 046c721 — both present in git log
- [x] Build check: `npm run build` → Compiled successfully (ioredis errors during prerender are expected without Redis in sandbox)
- [x] Unit tests: `npx vitest run tests/` → 53/53 passed across 6 test files
- [x] TypeScript: `npx tsc --noEmit` → 0 errors
- [x] LLM check: `grep -rn 'Anthropic|callLLM' src/server/tools/` → CLEAN
- [x] No blocking stubs found
