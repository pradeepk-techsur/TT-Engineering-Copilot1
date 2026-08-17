---
phase: 01-foundation
plan: 02
subsystem: orchestrator
tags: [state-machine, gate-enforcement, context-assembly, redis, typescript, vitest]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: 11-table Drizzle schema (phaseStates, gateDecisions, auditHistory, actions, phaseInputs) from plan 01-01
provides:
  - GatedStateMachine class with recordGateDecision, pause, resume, cancel, retry, runToGate
  - AI actor blocklist enforcement (GATE_AI_PROHIBITED) at both state-machine and API route layers
  - 3-outcome gate validation (Pass, Conditional Pass, Fail only)
  - PHASE_CONFIG: 10 immutable phase definitions as const
  - buildAgentContext: token-optimized context assembly (compact summaries, never full documents)
  - Redis-backed reference index (queryReferenceIndex, storeReferenceEntry, markIndexInitialized)
  - POST /api/orchestrator/[action] route with 403 AI rejection on gate-decide
  - AgentContext and CompactPhaseSummary TypeScript types
  - 6 passing unit tests (gate enforcement + phase config)
affects: [LC-02, LC-03, LC-04, LC-05, LC-07, TO-01, TO-02, TO-03, TO-04, AV-01, AV-02, 01-03, 01-04, 01-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - GatedStateMachine class: constructor takes projectId, all methods async, DB-backed
    - AI gate enforcement: Set-based blocklist checked before any DB operation
    - Context assembly: inArray(phaseStates.phaseState, ['GatePassed','GateConditional']) for upstream filter
    - Token budget differentiation: 32000 tokens for phases 3,4 (design phases), 16000 for others
    - Redis reference index: tag-based key pattern ref:{phaseTag}:{docId}:{section}
    - vitest path alias: @/* → ./src via resolve.alias in vitest.config.ts

key-files:
  created:
    - src/server/orchestrator/types.ts (GateOutcome, PhaseState, GateState, OrchestratorState, AI_ACTOR_BLOCKLIST)
    - src/server/orchestrator/stateMachine.ts (GatedStateMachine class — 175 lines)
    - src/server/orchestrator/commands.ts (OrchestratorCommand discriminated union)
    - src/shared/constants/phaseConfig.ts (PHASE_CONFIG, PHASE_CONFIG_MAP, TECHNICAL_REVIEW_PHASES)
    - src/server/context/contextAssembly.ts (buildAgentContext function)
    - src/server/context/referenceIndex.ts (Redis-backed reference index)
    - src/shared/types/projectState.ts (AgentContext, CompactPhaseSummary types)
    - src/app/api/orchestrator/[action]/route.ts (POST orchestrator lifecycle API)
    - tests/orchestrator.test.ts (6 unit tests for gate enforcement + phase config)
  modified:
    - vitest.config.ts (added @/* path alias for test imports)
    - src/app/api/project/[projectId]/route.ts (error_code format consistency)

key-decisions:
  - "vitest.config.ts needs resolve.alias @/* → ./src for test imports — tsconfig paths not used by vitest by default"
  - "AI actor check and gate outcome validation both precede DB access — tests pass without a live DB"
  - "params is async in Next.js 15 App Router — used await params destructuring in all route handlers"
  - "GATE_NOT_OPEN check requires DB — tests for this gate are integration tests deferred to verify phase"

patterns-established:
  - "Gate enforcement: blocklist check → outcome validation → DB state check — in that order"
  - "Context assembly: upstream phases filtered to GatePassed|GateConditional AND phaseId < current"
  - "Token budget: TECHNICAL_REVIEW_PHASES set used as guard for checklist items and phase config"
  - "Error codes as prefixes: GATE_AI_PROHIBITED, INVALID_GATE_OUTCOME, GATE_NOT_OPEN, PROJECT_NOT_FOUND"

# Metrics
duration: 4min
completed: 2026-08-16
---

# Phase 1 Plan 02: Foundation Summary

**GatedStateMachine with AI-blocklisted gate enforcement + token-optimized buildAgentContext using compact upstream summaries, backed by Redis reference index and 10-phase immutable PHASE_CONFIG constant**

## Performance

- **Duration:** 4 min
- **Started:** 2026-08-16T16:38:46Z
- **Completed:** 2026-08-16T16:43:03Z
- **Tasks:** 2 completed
- **Files modified:** 11

## Accomplishments

- GatedStateMachine: recordGateDecision rejects AI actors (GATE_AI_PROHIBITED), rejects invalid outcomes (INVALID_GATE_OUTCOME), enforces AwaitingGate state (GATE_NOT_OPEN); pause/resume/cancel/retry/runToGate lifecycle operations
- PHASE_CONFIG: 10 immutable phases as const with 4 technical-review phases (0,1,3,4) and phase 8 as dual-SI intake
- buildAgentContext: reads compact_phase_summary JSONB column for upstream phases — never full prior-phase documents; TECHNICAL_REVIEW_PHASES gate limits checklist items to mapped phases only
- POST /api/orchestrator/[action] route returns HTTP 403 GATE_AI_PROHIBITED when X-Reviewer-Role is absent or in blocklist
- 6 unit tests pass (gate AI rejection, invalid outcome rejection, blocklist membership, phase count, technical review mapping, SI behaviors)

## Task Commits

Each task was committed atomically:

1. **Task 1: Gated state-machine orchestrator** - `9ccd075` (feat)
2. **Task 2: Token-optimized context assembly service and reference index** - `d1757f0` (feat)

**Plan metadata:** (committed after this SUMMARY)

## Files Created/Modified

- `src/server/orchestrator/types.ts` — GateOutcome type, PhaseState/GateState types, AI_ACTOR_BLOCKLIST Set
- `src/server/orchestrator/stateMachine.ts` — GatedStateMachine class with all lifecycle methods
- `src/server/orchestrator/commands.ts` — OrchestratorCommand discriminated union
- `src/shared/constants/phaseConfig.ts` — 10-phase PHASE_CONFIG as const + PHASE_CONFIG_MAP + TECHNICAL_REVIEW_PHASES
- `src/server/context/contextAssembly.ts` — buildAgentContext with compact-summary-only rule
- `src/server/context/referenceIndex.ts` — Redis-backed reference index (queryReferenceIndex, storeReferenceEntry)
- `src/shared/types/projectState.ts` — AgentContext and CompactPhaseSummary TypeScript interfaces
- `src/app/api/orchestrator/[action]/route.ts` — POST /api/orchestrator/[action] with 403 AI gate
- `tests/orchestrator.test.ts` — 6 unit tests (vitest)
- `vitest.config.ts` — added @/* path alias for test imports
- `src/app/api/project/[projectId]/route.ts` — error_code format aligned with orchestrator

## Decisions Made

1. **vitest path aliases**: vitest.config.ts does not inherit tsconfig paths by default. Added `resolve.alias: { '@': path.resolve(__dirname, './src') }` — this was required for unit tests that import `@/server/orchestrator/...` to resolve. [Rule 3 - Blocking]

2. **async params in Next.js 15**: All route handlers use `await params` destructuring. The plan's template used sync `params`, but the existing project's route uses the async pattern — followed the existing pattern for consistency.

3. **AI actor and outcome checks precede DB**: Test strategy relies on this ordering. The `recordGateDecision` method checks AI_ACTOR_BLOCKLIST and validates the outcome value before any DB access. This allows unit tests to exercise these enforcement paths without a live database.

4. **GATE_NOT_OPEN deferred**: Integration-level test for `GATE_NOT_OPEN` requires a running DB. Deferred to verify phase; pure-logic tests for the first two enforcement layers pass in unit test context.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] vitest.config.ts missing path alias for @/* imports**
- **Found during:** Task 1 (running unit tests)
- **Issue:** Tests import `@/server/orchestrator/stateMachine` but vitest.config.ts had no resolve.alias. Tests would fail with "Cannot find module '@/server/...'"
- **Fix:** Added `resolve: { alias: { '@': path.resolve(__dirname, './src') } }` to vitest.config.ts; also added `import path from 'path'`
- **Files modified:** vitest.config.ts
- **Verification:** All 6 tests pass after alias added
- **Committed in:** 9ccd075 (Task 1 commit)

**2. [Rule 1 - Bug] Next.js 15 params is async — route template used sync pattern**
- **Found during:** Task 1 (reviewing route template vs. existing project route)
- **Issue:** The plan's route template used `{ params }: { params: { action: string } }` but Next.js 15 requires `{ params }: { params: Promise<{ action: string }> }` with `await params`
- **Fix:** Used async params pattern consistent with existing `src/app/api/project/[projectId]/route.ts`
- **Files modified:** src/app/api/orchestrator/[action]/route.ts
- **Verification:** Build compiles; no TypeScript errors
- **Committed in:** 9ccd075 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both auto-fixes essential for tests to run and build to succeed. No scope creep.

## Known Stubs

None found — grep scan of all new/modified files returned no TODO/FIXME/placeholder/not-implemented matches.

## Issues Encountered

- `GATE_NOT_OPEN` enforcement requires a live DB to test (the third enforcement layer in `recordGateDecision`). The first two layers (AI_ACTOR_BLOCKLIST, valid outcomes) are fully exercised by unit tests. GATE_NOT_OPEN testing deferred to integration test phase when docker compose is running.

## User Setup Required

None — no external service configuration required. Redis is provided by docker-compose.yml from plan 01-01.

## Next Phase Readiness

- GatedStateMachine available for plans 01-03 through 01-07 (phase agents depend on this)
- buildAgentContext available for AI agent context assembly
- PHASE_CONFIG provides reference for all 10 lifecycle phases
- POST /api/orchestrator/[action] route ready for frontend integration (AV-01/AV-02)
- All contracts provided: GatedStateMachine, buildAgentContext, PHASE_CONFIG exports verified

## Self-Check: PASSED

- All 9 key files found on disk (types.ts, stateMachine.ts, commands.ts, phaseConfig.ts, contextAssembly.ts, referenceIndex.ts, projectState.ts, orchestrator route, orchestrator.test.ts)
- Both commits verified in git log (9ccd075, d1757f0)
- Build check: `npm run build` → Compiled successfully, all routes generated → exit 0
- No blocking stubs found (grep scan clean)

---
*Phase: 01-foundation*
*Completed: 2026-08-16*
