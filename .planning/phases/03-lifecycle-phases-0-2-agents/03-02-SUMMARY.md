---
phase: 03-lifecycle-phases-0-2-agents
plan: 02
subsystem: api
tags: [agents, phase1, phase2, xlsx, deterministic-check, si-01, correction-cycle, gate-enforcement]

requires:
  - phase: 03-lifecycle-phases-0-2-agents
    provides: BaseAgent, generateXlsx, generateDocx, SYNTHETIC_DISCLAIMER, AI_ACTOR_BLOCKLIST gate pattern (from 03-01)
  - phase: 01-foundation
    provides: DB schema (checkResults, findings, phaseOutputs, phaseStates, phaseInputs, inputVersions)
  - phase: 02-input-intake-framework
    provides: phaseInputs readiness status, inputVersions active flag

provides:
  - ProposalCostAgent (Phase 1) producing Costed Proposal DOCX and Resource Schedule XLSX
  - RequirementsAgent (Phase 2) with RequirementTestability deterministic check and correction cycle
  - runTestabilityCheck() — deterministic check detecting SI-01 (REQ-THERM-004 non-testable)
  - Phase 1 and Phase 2 execute/outputs/gate-review/gate-decide API routes
  - F2-001-original finding with seeded=true, severity=Major raised when REQ-THERM-004 fails
  - F2-001 marked VerifiedClosed when isRevised=true run passes

affects: [03-03]

tech-stack:
  added: []
  patterns:
    - BaseAgent-extends pattern applied to ProposalCostAgent and RequirementsAgent
    - Deterministic check outside LLM for RequirementTestability (testabilityCheck.ts)
    - isRevised parameter pattern for correction cycle support
    - seeded=true flag on findings for SI-01 distinguishing seeded vs discovered issues
    - onConflictDoNothing() for idempotent finding inserts on correction reruns

key-files:
  created:
    - src/server/agents/phase1/outputGenerators.ts
    - src/server/agents/phase1/proposalCostAgent.ts
    - src/server/agents/phase2/testabilityCheck.ts
    - src/server/agents/phase2/outputGenerators.ts
    - src/server/agents/phase2/requirementsAgent.ts
    - src/app/api/phases/1/execute/route.ts
    - src/app/api/phases/1/outputs/route.ts
    - src/app/api/gates/1/review/route.ts
    - src/app/api/gates/1/decide/route.ts
    - src/app/api/phases/2/execute/route.ts
    - src/app/api/phases/2/outputs/route.ts
    - src/app/api/gates/2/review/route.ts
    - src/app/api/gates/2/decide/route.ts
    - tests/phase1-2-agents.test.ts
  modified: []

key-decisions:
  - "RequirementTestability check is deterministic (no LLM call) — isTestable() is pure TypeScript on criterion text"
  - "isRevised=true parameter controls which SEEDED_REQUIREMENTS vs REVISED_REQUIREMENTS set is used"
  - "Phase 2 outputs only inserted once — existingOutputs.length===0 guard prevents duplicate inserts on rerun"
  - "Gate 2 review includes deterministicChecks field for transparency of check results to human reviewer"
  - "Finding F2-001 uses onConflictDoNothing() for idempotent inserts; closedAt set to ISO string not Date object"
  - "executionStartedAt uses .toISOString() — schema column is timestamptz(mode:'string'), not Date object"

patterns-established:
  - "Deterministic check pattern: pure TypeScript function, no LLM call, inserts to check_results, raises seeded finding"
  - "Correction cycle pattern: isRevised boolean parameter flows from API route to agent.run() to runTestabilityCheck()"
  - "Gate review: seededFindings surfaced separately for human reviewer prominence"

duration: 10min
completed: 2026-08-17
---

# Phase 3 Plan 2: Phase 1 Proposal & Cost Agent, Phase 2 Requirements Agent, SI-01 Detection and Correction Summary

**ProposalCostAgent (Phase 1) generating Costed Proposal + Resource Schedule; RequirementsAgent (Phase 2) with deterministic RequirementTestability check detecting SI-01 seeded issue (REQ-THERM-004), correction cycle support (isRevised=true), F2-001 finding with seeded=true, and AI_ACTOR_BLOCKLIST-enforced Gate 1 and Gate 2 routes**

## Performance

- **Duration:** 10 min
- **Started:** 2026-08-17T18:21:51Z
- **Completed:** 2026-08-17T18:32:02Z
- **Tasks:** 2 (plus prerequisite 03-01 execution)
- **Files modified:** 14

## Accomplishments
- ProposalCostAgent produces exactly 2 Phase 1 outputs: Costed Proposal (DOCX) and Resource Schedule XLSX (7 milestone rows)
- RequirementTestability check is deterministic (0 LLM calls) — detects REQ-THERM-004 as non-testable via pure TypeScript
- SI-01 seeded issue: F2-001-original raised with seeded=true, severity=Major when REQ-THERM-004 criterion is 'TBD'
- Correction cycle: isRevised=true reruns with revised criterion → REQ-THERM-004 passes → F2-001 VerifiedClosed
- Gate 1 and Gate 2 decide endpoints both enforce AI actor prohibition (GATE_AI_PROHIBITED, HTTP 403)
- All 14 vitest unit tests pass (8 from phase0-agent.test.ts + 6 from phase1-2-agents.test.ts)

## Task Commits

Each task was committed atomically:

1. **Task 1: Phase 1 Proposal & Cost Agent with compact outputs and Gate 1 routes** - `ca79b5d` (feat)
2. **Task 2: RequirementTestability check, Phase 2 agent, SI-01 correction cycle, Gate 2 routes, unit tests** - `730e19e` (feat)

**Prerequisite (03-01 Task 2):** `9d34224` (feat)

## Files Created/Modified
- `src/server/agents/phase1/outputGenerators.ts` - generateCostedProposal(), generateResourceMilestoneSchedule()
- `src/server/agents/phase1/proposalCostAgent.ts` - ProposalCostAgent extending BaseAgent
- `src/server/agents/phase2/testabilityCheck.ts` - DETERMINISTIC RequirementTestability check, runTestabilityCheck()
- `src/server/agents/phase2/outputGenerators.ts` - generateRTM(), generateTestabilityReport()
- `src/server/agents/phase2/requirementsAgent.ts` - RequirementsAgent with correction cycle support
- `src/app/api/phases/1/execute/route.ts` - Phase 1 execution endpoint
- `src/app/api/phases/1/outputs/route.ts` - Phase 1 outputs endpoint with AC-03 enforcement
- `src/app/api/gates/1/review/route.ts` - Gate 1 review workspace endpoint
- `src/app/api/gates/1/decide/route.ts` - Gate 1 human decision with AI prohibition
- `src/app/api/phases/2/execute/route.ts` - Phase 2 execution with isRevised parameter
- `src/app/api/phases/2/outputs/route.ts` - Phase 2 outputs endpoint
- `src/app/api/gates/2/review/route.ts` - Gate 2 review with seededFindings and deterministicChecks
- `src/app/api/gates/2/decide/route.ts` - Gate 2 human decision with AI prohibition
- `tests/phase1-2-agents.test.ts` - 6 passing unit tests for SI-01 detection

## Decisions Made
- RequirementTestability check is deterministic — `isTestable()` inspects criterion text for numeric values, units, or test method references; never calls LLM
- isRevised boolean controls which requirement set is used (SEEDED_REQUIREMENTS vs REVISED_REQUIREMENTS)
- Phase 2 output insert guarded by `existingOutputs.length === 0` to prevent duplicate rows on correction rerun
- Gate 2 review exposes `seededFindings` and `deterministicChecks` separately for human reviewer
- Finding insert uses `.onConflictDoNothing()` for idempotent rerun safety

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Plan 03-01 had not been executed — BaseAgent and artifactGenerator files missing**
- **Found during:** Pre-execution dependency check
- **Issue:** 03-02 depends_on 03-01 but 03-01 had no SUMMARY.md; BaseAgent, artifactGenerator absent
- **Fix:** Executed 03-01 Tasks 1 and 2 fully (BaseAgent, artifactGenerator, Phase 0 agent, Gate 0 routes, tests)
- **Files modified:** 11 files created for 03-01 (see 03-01-SUMMARY.md)
- **Verification:** 8/8 vitest tests pass
- **Committed in:** 0c5dbd8 (pre-existing) + 9d34224

**2. [Rule 1 - Bug] TypeScript Date vs string type error in executionStartedAt and closedAt**
- **Found during:** Task 2 (tsc --noEmit after file creation)
- **Issue:** `executionStartedAt: new Date()` and `closedAt: new Date()` caused TS2322 errors — schema column is timestamp with `mode: 'string'`
- **Fix:** Changed all `new Date()` to `new Date().toISOString()` in execute routes and testabilityCheck.ts
- **Files modified:** src/app/api/phases/1/execute/route.ts, src/app/api/phases/2/execute/route.ts, src/server/agents/phase2/testabilityCheck.ts
- **Verification:** `npx tsc --noEmit` produces no errors
- **Committed in:** 730e19e (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking prerequisite, 1 type bug)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Known Stubs

None found — all handlers implement real logic. No hardcoded responses, empty bodies, or placeholder returns.

## Issues Encountered
- None beyond documented deviations

## Next Phase Readiness
- Phase 0, 1, and 2 agents fully operational with compact artifact standards
- SI-01 detection and correction cycle proven in unit tests
- Gate 1 and Gate 2 enforce human-only decisions
- Pattern established for Phase 3+ agents

---
*Phase: 03-lifecycle-phases-0-2-agents*
*Completed: 2026-08-17*

## Self-Check: PASSED

**Files verified present:**
- [FOUND] src/server/agents/phase2/testabilityCheck.ts
- [FOUND] src/server/agents/phase1/proposalCostAgent.ts
- [FOUND] src/server/agents/phase2/requirementsAgent.ts
- [FOUND] src/app/api/phases/1/execute/route.ts
- [FOUND] src/app/api/phases/2/execute/route.ts
- [FOUND] src/app/api/gates/1/decide/route.ts
- [FOUND] src/app/api/gates/2/decide/route.ts
- [FOUND] tests/phase1-2-agents.test.ts

**Commits verified:**
- ca79b5d: feat(03-02) Task 1 — Phase 1 agent and Gate 1 routes
- 730e19e: feat(03-02) Task 2 — Phase 2 agent, SI-01, correction cycle, Gate 2 routes

**Build check:** `npx tsc --noEmit` → exit 0 (no errors)
**Unit tests:** `npx vitest run tests/phase1-2-agents.test.ts` → 6/6 passed
**Known Stubs:** None found
