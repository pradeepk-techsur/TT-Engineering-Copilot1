---
phase: 05-lifecycle-phases-5-7-agents
plan: 01
subsystem: agents
tags: [cpk, deterministic-check, phase5, vv-agent, thermal-exceedance, vitest, typescript, gate5, evinv-poc-std-001]

# Dependency graph
requires:
  - phase: 04-lifecycle-phases-3-4-agents-flagship
    provides: EVINV_POC_STD_001 (cpk §5.1 threshold=1.33), POC_STD_LABEL, toolTypes.ts CheckToolResult
  - phase: 03-lifecycle-phases-0-2-agents
    provides: BaseAgent abstract class, generateXlsx(), generateDocx(), SYNTHETIC_DISCLAIMER
provides:
  - runCpkCalculation() — deterministic Cpk check (zero LLM), detects SI-06 SOLDER_JOINT_SHEAR_HV_BUS Cpk 0.131 < 1.33
  - CpkItem interface
  - VVAgent — Phase 5 Validation & Verification agent with SI-05 thermal exceedance detection
  - Phase 5 output generators (generateVVMatrix XLSX, generateGate5Summary DOCX)
  - POST /api/phases/5/execute — triggers VVAgent with isRevised support
  - GET /api/phases/5/outputs — Phase 5 outputs with AC-03 enforcement
  - GET /api/gates/5/review — Gate 5 Review Workspace from ProjectState
  - POST /api/gates/5/decide — human-only gate decision (403 for AI actors)
  - 6/6 vitest unit tests covering Cpk formula, SI-05/06 seeded logic, LLM-free assertion
affects: [SI-05, SI-06, Phase 6 Cpk tool use, Gate 5 review/decide, LC-08]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CpkCalculation deterministic check pattern: Cpk = min((USL−μ)/(3σ),(μ−LSL)/(3σ)) with seeded INITIAL/REVISED_PROCESS_DATA arrays"
    - "VVAgent correction cycle: INITIAL_VV_DATA seeded with SI-05 thermal fail; REVISED_VV_DATA switches REQ-THERM-004 to Pass at 82°C"
    - "Two-insert pattern for correction cycle: revised run inserts NEW check_results row (new checkId), original row preserved with invalidated=false"
    - "closedAt uses new Date().toISOString() — timestamptz mode:string pattern (consistent with Phases 1–4)"

key-files:
  created:
    - src/server/tools/cpkCalculation.ts (runCpkCalculation, CpkItem — zero LLM, detects SI-06)
    - src/server/agents/phase5/vvAgent.ts (VVAgent — SI-05 thermal exceedance, correction cycle)
    - src/server/agents/phase5/outputGenerators.ts (generateVVMatrix, generateGate5Summary)
    - src/app/api/phases/5/execute/route.ts (POST with isRevised support)
    - src/app/api/phases/5/outputs/route.ts (GET with AC-03 output limit)
    - src/app/api/gates/5/review/route.ts (seededFindings + deterministicChecks)
    - src/app/api/gates/5/decide/route.ts (AI actor prohibition)
    - tests/cpk-and-phase5.test.ts (6 unit tests)
  modified:
    - src/server/tools/cpkCalculation.ts (closedAt ISO string fix, itemsChecked as any[])
    - src/app/api/checks/phase/6/run/route.ts (fixed pre-existing TS2783 phaseId duplicate)

key-decisions:
  - "itemsChecked cast as any[] — CpkItem lacks index signature to satisfy CheckItem; consistent with hvClearanceCheck/others"
  - "closedAt uses new Date().toISOString() — timestamptz mode:string requires ISO string (same as Phases 1–4 pattern)"
  - "Phase 5 external=SI (test methods/standards), internal=UP (validation evidence package) — consistent with FRD II-12/13"

patterns-established:
  - "CpkCalculation pattern: zero LLM, pure TypeScript Cpk formula, INITIAL/REVISED data arrays with seeded SI flag"
  - "VVAgent LLM-after-deterministic pattern: check results written to DB first, narrative prompt explicitly says 'do NOT recalculate'"

# Metrics
duration: 7min
completed: 2026-08-18
---

# Phase 5 Plan 01: CpkCalculation + Phase 5 V&V Agent Summary

**Deterministic Cpk check (zero LLM, SI-06 seeded) + Phase 5 VVAgent with thermal exceedance correction cycle (SI-05: TP-CASE-1 91°C→82°C) + Gate 5 execute/review/decide routes with AI actor prohibition**

## Performance

- **Duration:** 7 min
- **Started:** 2026-08-18T20:19:08Z
- **Completed:** 2026-08-18T20:26:21Z
- **Tasks:** 2 completed
- **Files modified:** 9 files created, 2 modified

## Accomplishments

- `cpkCalculation.ts` — fully deterministic Cpk check: formula `min((USL−μ)/(3σ),(μ−LSL)/(3σ))`, zero LLM calls verified by grep and vitest source-scan; SOLDER_JOINT_SHEAR_HV_BUS initial Cpk ~0.131 < 1.33 threshold (SI-06); revised data mean=32.2,std=0.7 → Cpk=1.333 ≥ threshold
- `VVAgent` — Phase 5 V&V agent raises F5-001 with `seeded=true` (SI-05: TP-CASE-1 91°C > 85°C criterion); revised run switches thermal result to 82°C, F5-001 `VerifiedClosed`; original `check_results` row preserved with new `checkId` per revised run
- Phase 5 Gate 5 API routes (execute, outputs, review, decide) following exact Phase 4 pattern; decide enforces `GATE_AI_PROHIBITED` 403 for AI actors
- 6/6 vitest unit tests passing — Cpk formula validation, SI-06/05 seeded issue logic, LLM-free assertion

## Task Commits

Each task was committed atomically:

1. **Task 1: CpkCalculation deterministic check + unit tests** - `e79b2fc` (feat)
2. **Task 2: Phase 5 VVAgent, output generators, Gate 5 routes + TS fixes** - `8b536aa` (feat)

**Plan metadata:** _(this commit)_ (docs: complete plan)

## Files Created/Modified

- `src/server/tools/cpkCalculation.ts` — runCpkCalculation(), CpkItem interface, zero LLM, SI-06 seeded
- `src/server/agents/phase5/vvAgent.ts` — VVAgent with SI-05 thermal exceedance and correction cycle
- `src/server/agents/phase5/outputGenerators.ts` — generateVVMatrix() XLSX + generateGate5Summary() DOCX
- `src/app/api/phases/5/execute/route.ts` — POST with isRevised support
- `src/app/api/phases/5/outputs/route.ts` — GET with AC-03 output count enforcement
- `src/app/api/gates/5/review/route.ts` — seededFindings + deterministicChecks surfaced
- `src/app/api/gates/5/decide/route.ts` — GATE_AI_PROHIBITED + compact phase summary
- `tests/cpk-and-phase5.test.ts` — 6 unit tests (all passing)
- `src/app/api/checks/phase/6/run/route.ts` — pre-existing TS2783 phaseId duplicate fixed (blocking build)

## Decisions Made

1. **itemsChecked cast as `any[]`**: `CpkItem` lacks the `[key: string]: unknown` index signature required by `CheckItem`. Consistent with `hvClearanceCheck.ts` and others — cast at DB insert boundary only.

2. **closedAt ISO string**: `timestamptz` helper uses `mode: 'string'`, requires ISO string not `Date` object. Consistent with Phases 1–4 pattern.

3. **Phase 5 input roles**: external = SI (test methods/standards), internal = UP (validation evidence package) — follows FRD II-12/13 specification.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed closedAt Date type mismatch in cpkCalculation.ts**
- **Found during:** Task 2 (TypeScript check post-task)
- **Issue:** `.set({ status: 'VerifiedClosed', closedAt: new Date() })` passed a Date object; schema `timestamptz` helper uses `mode: 'string'` requiring ISO string
- **Fix:** Changed to `.set({ status: 'VerifiedClosed', closedAt: new Date().toISOString() })`
- **Files modified:** `src/server/tools/cpkCalculation.ts`
- **Verification:** `npx tsc --noEmit` → no errors in our files
- **Committed in:** 8b536aa (Task 2 commit)

**2. [Rule 1 - Bug] Fixed itemsChecked type error in cpkCalculation.ts return**
- **Found during:** Task 2 (TypeScript check)
- **Issue:** `itemsChecked: computed` returned `CpkItem[]` which doesn't satisfy `CheckItem[]` (missing index signature)
- **Fix:** Cast to `computed as any[]` — consistent with all other deterministic check files
- **Files modified:** `src/server/tools/cpkCalculation.ts`
- **Verification:** `npx tsc --noEmit` → no errors in our files
- **Committed in:** 8b536aa (Task 2 commit)

**3. [Rule 3 - Blocking] Fixed pre-existing TS2783 build failure in phase/6/run/route.ts**
- **Found during:** Task 2 (npm run build)
- **Issue:** `return NextResponse.json({ phaseId: 6, isRevised, ...result })` — `result` already contains `phaseId` from `CheckToolResult`, causing TypeScript error TS2783 (duplicate property); build failed
- **Fix:** Reordered to `return NextResponse.json({ isRevised, ...result, phaseId: 6 })` — explicit `phaseId: 6` overrides `result.phaseId` without TypeScript complaint
- **Files modified:** `src/app/api/checks/phase/6/run/route.ts`
- **Verification:** `npm run build` → Compiled successfully
- **Committed in:** 8b536aa (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 blocking)
**Impact on plan:** All fixes required for TypeScript correctness and build success. No scope creep.

## Known Stubs

None found — all implementations are real logic with seeded data arrays, DB writes, finding inserts, and gate enforcement.

## Issues Encountered

None beyond the auto-fixed deviations above.

## User Setup Required

None - no external service configuration required. ANTHROPIC_API_KEY must be set for LLM narrative calls in VVAgent at runtime.

## Next Phase Readiness

- CpkCalculation ready for Phase 6 DFM/manufacturing agent use
- Phase 5 V&V agent fully executable: execute → VVAgent → V&V Matrix XLSX + Gate 5 Summary DOCX → Gate 5 review workspace populated → human can record Pass/Fail
- SI-05 correction cycle demonstrated: 91°C initial fail → 82°C revised pass; original check_results preserved
- Gate 5 decide enforces AI actor prohibition
- seeded=true flags in place for SI-05 (F5-001) — enabling correction cycle tracking

---
*Phase: 05-lifecycle-phases-5-7-agents*
*Completed: 2026-08-18*

## Self-Check: PASSED

- [x] `src/server/tools/cpkCalculation.ts` — FOUND
- [x] `src/server/agents/phase5/vvAgent.ts` — FOUND
- [x] `src/server/agents/phase5/outputGenerators.ts` — FOUND
- [x] `src/app/api/phases/5/execute/route.ts` — FOUND
- [x] `src/app/api/phases/5/outputs/route.ts` — FOUND
- [x] `src/app/api/gates/5/review/route.ts` — FOUND
- [x] `src/app/api/gates/5/decide/route.ts` — FOUND
- [x] `tests/cpk-and-phase5.test.ts` — FOUND
- [x] Commits e79b2fc, 8b536aa — both present in git log
- [x] Build check: `npm run build` → Compiled successfully (exit 0)
- [x] Unit tests: 6/6 passed (cpk-and-phase5.test.ts)
- [x] TypeScript: `npx tsc --noEmit` → only pre-existing error in phase/6/run/route.ts (fixed in 8b536aa)
- [x] LLM check: `grep -rn 'Anthropic|callLLM' src/server/tools/cpkCalculation.ts` → CLEAN
- [x] No blocking stubs found
