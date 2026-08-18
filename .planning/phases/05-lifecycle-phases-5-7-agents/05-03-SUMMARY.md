---
phase: 05-lifecycle-phases-5-7-agents
plan: 03
subsystem: agents
tags: [phase7, lessons-learned, transfer, gate7, playwright, e2e, si-07, seeded-finding, typescript]

# Dependency graph
requires:
  - phase: 05-01
    provides: VVAgent, Gate 5 routes, cpkCalculation
  - phase: 05-02
    provides: MRLPPAPAgent, Gate 6 routes
  - phase: 03-01
    provides: BaseAgent, generateXlsx, generateDocx, SYNTHETIC_DISCLAIMER
provides:
  - LessonsLearnedAgent — Phase 7 agent; raises F7-001 seeded=true (SI-07: MOP-012 torque variation)
  - Phase 7 output generators (Lessons-Learned Register XLSX 5 rows, Transfer Report DOCX)
  - POST /api/phases/7/execute — triggers LessonsLearnedAgent (no correction cycle)
  - GET /api/phases/7/outputs — Phase 7 outputs with AC-03 enforcement
  - GET /api/gates/7/review — Gate 7 Review with seededFindings (F7-001)
  - POST /api/gates/7/decide — human-only gate decision (403 for AI actors, T-05-09 mitigation)
  - e2e/phases-5-7.spec.ts — 25 Playwright tests covering Phase 5/6/7 workspaces
affects: [LC-08, gate-7, phase-8, playwright-suite]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "LessonsLearnedAgent: simple LLM-only pattern (no deterministic check); Phase 7 has no correction cycle"
    - "Phase 7 F7-001 seeded=true via onConflictDoNothing — Observation severity (non-blocking)"
    - "Playwright tests use getByRole('heading') to avoid strict mode violations with breadcrumb links"
    - "Playwright tests use textContent() check for multi-element matches (SI card MES text)"

key-files:
  created:
    - src/server/agents/phase7/outputGenerators.ts (generateLessonsLearnedRegister XLSX, generateTransferReport DOCX)
    - src/server/agents/phase7/lessonsLearnedAgent.ts (LessonsLearnedAgent, F7-001 seeded, 5 lessons)
    - src/app/api/phases/7/execute/route.ts (POST with external=UP, internal=SI; no isRevised)
    - src/app/api/phases/7/outputs/route.ts (GET with AC-03 max 2 enforcement)
    - src/app/api/gates/7/review/route.ts (seededFindings, empty deterministicChecks)
    - src/app/api/gates/7/decide/route.ts (GATE_AI_PROHIBITED 403; compact phase summary)
    - e2e/phases-5-7.spec.ts (25 Playwright tests: Phase 5/6/7 workspaces + Gate reviews)
  modified: []

key-decisions:
  - "LessonsLearnedAgent uses LLM-only pattern (no deterministic check) — Phase 7 is lessons capture, not process validation"
  - "Phase 7 has no correction cycle — isRevised not supported; single run to AwaitingGate"
  - "Docker compose rebuild required for new routes to be live — reuseExistingServer in playwright hits the running container"
  - "Playwright strict mode violations fixed with getByRole/textContent() rather than getByText() for elements appearing in multiple contexts"
  - "Playwright chromium binary + system deps installed in sandbox for test execution"

patterns-established:
  - "Gate 7 decide enforces AI_ACTOR_BLOCKLIST (T-05-09) same as Gates 5/6 — consistent GR-02 enforcement"
  - "Phase 7 happy path: Pass at Gate 7, no correction cycle (LC-08)"

# Metrics
duration: 15min
completed: 2026-08-18
---

# Phase 05 Plan 03: Phase 7 Lessons-Learned Agent and Playwright Test Suite Summary

**LessonsLearnedAgent with F7-001 seeded=true (SI-07: MOP-012 torque variation 2.1–4.8 N·m), Gate 7 human-only decision (T-05-09), and 25-test Playwright suite covering Phase 5/6/7 workspaces with intake card verification**

## Performance

- **Duration:** 15 min
- **Started:** 2026-08-18T20:31:43Z
- **Completed:** 2026-08-18T20:47:04Z
- **Tasks:** 2 completed
- **Files modified:** 7 created

## Accomplishments

- `LessonsLearnedAgent` raises F7-001 with `seeded=true` (SI-07: MOP-012 torque variation 2.1–4.8 N·m vs spec 3.5±0.5 N·m); severity Observation; non-blocking; `onConflictDoNothing()` prevents re-insert
- Lessons-Learned Register XLSX with 5 rows (LL-001 torque variation through LL-005 supply chain EOL); Transfer-Completeness Report DOCX with FPY metrics (91.4%→94.8% after corrective actions)
- Gate 7 decide enforces `GATE_AI_PROHIBITED` HTTP 403 for AI actors (T-05-09 mitigation); compact phase summary written on decision (LC-08 happy path)
- 25/25 Playwright tests pass covering Phase 5 (SI ext/UP int), Phase 6 (UP ext/SI int), Phase 7 (UP ext/SI int) intake cards; no technical review badges; no prohibited labels; gate review workspace loads with decision selector disabled

## Task Commits

Each task was committed atomically:

1. **Task 1: Phase 7 LessonsLearnedAgent (SI-07) and Gate 7 routes** - `93f90ec` (feat)
2. **Task 2: Playwright tests for Phases 5–7 workspaces and Phase 6 Cpk distinction** - `167907c` (feat)

**Plan metadata:** _(this commit)_ (docs: complete plan)

## Files Created/Modified

- `src/server/agents/phase7/outputGenerators.ts` — generateLessonsLearnedRegister() XLSX + generateTransferReport() DOCX
- `src/server/agents/phase7/lessonsLearnedAgent.ts` — LessonsLearnedAgent; SI-07 F7-001 seeded=true; 5 lessons (LL-001 torque through LL-005 EOL); LLM narrative with transfer metrics
- `src/app/api/phases/7/execute/route.ts` — POST; external=UP (customer field feedback), internal=SI (Cora/MES); no correction cycle
- `src/app/api/phases/7/outputs/route.ts` — GET; AC-03 max 2 outputs enforced
- `src/app/api/gates/7/review/route.ts` — GET; seededFindings (F7-001 surfaced), empty deterministicChecks
- `src/app/api/gates/7/decide/route.ts` — POST; GATE_AI_PROHIBITED 403; compact phaseSummary on decision
- `e2e/phases-5-7.spec.ts` — 25 Playwright tests; all passing (0 failing, 0 skipped)

## Decisions Made

1. **LessonsLearnedAgent uses LLM-only pattern**: Phase 7 is lessons capture, not process validation — no deterministic check needed. Consistent with Phase 7 not having a correction cycle.

2. **No correction cycle for Phase 7**: `isRevised` not accepted; single run moves phase to AwaitingGate directly. The happy path assumption per plan spec.

3. **Docker compose rebuild required**: `reuseExistingServer: true` in playwright.config.ts means tests hit the live Docker container. New routes added after container startup are 404 until rebuild. Fixed with `docker compose build && up -d app`.

4. **Playwright locator strategy**: `getByText()` causes strict mode violations when text appears in both breadcrumb links and h1/h2 headings. Fixed with `getByRole('heading', { name: ... })`. For SI card multi-occurrence text, used `textContent()` assertion.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Playwright chromium binary not installed**
- **Found during:** Task 2 (first `npx playwright test` run)
- **Issue:** `chrome-headless-shell: command not found` — Playwright chromium binary not present in sandbox
- **Fix:** Ran `npx playwright install chromium` (114 MB download) + `npx playwright install-deps chromium` for system libraries (`libnspr4.so` dependency)
- **Files modified:** None (system installation)
- **Verification:** Chromium launched, tests ran and produced test results
- **Committed in:** N/A (system-level fix)

**2. [Rule 3 - Blocking] Docker container rebuild required for new routes**
- **Found during:** Task 2 (gates 5/6/7 returning 404 despite files existing on host)
- **Issue:** App runs in Docker container (Dockerfile COPY pattern, not volume mount). New route files created on host were not visible inside the running container. `reuseExistingServer: true` means playwright hits the existing container at port 3000.
- **Fix:** Rebuilt Docker image with `docker compose build app` (includes new Phase 7 files), then `docker compose up -d app` to restart with new image
- **Files modified:** None (infrastructure rebuild)
- **Verification:** `curl http://localhost:3000/api/gates/7/review` returned `gateState: Locked` (JSON, not 404)
- **Committed in:** N/A (runtime fix)

**3. [Rule 1 - Bug] Playwright strict mode violations from getByText() matching breadcrumb links AND headings**
- **Found during:** Task 2 (first passing test run showed 9 failures)
- **Issue:** `page.getByText('Phase 5: Verification & Validation')` resolved to 2 elements: breadcrumb link + h1. `page.getByText('EV-INV-800')` also resolved to 2 elements. `siCard.getByText(/MES/)` resolved to 2 elements within the SI card.
- **Fix:** Used `getByRole('heading', { name: '...' })` for phase/gate headings; `.first()` or `textContent()` for multi-match cases
- **Files modified:** `e2e/phases-5-7.spec.ts`
- **Verification:** All 25 tests pass
- **Committed in:** 167907c (Task 2 commit)

**4. [Rule 2 - Missing Critical] Guard against duplicate phaseOutputs inserts on LessonsLearnedAgent retry**
- **Found during:** Task 1 (code review of agent pattern vs Phase 6 agent)
- **Issue:** Direct `db.insert(phaseOutputs)` without `existingOutputs.length === 0` guard — consistent with Phase 6 pattern which guards against retry duplicates
- **Fix:** Added `existingOutputs` check: only insert if no outputs exist for phase 7 yet
- **Files modified:** `src/server/agents/phase7/lessonsLearnedAgent.ts`
- **Verification:** TypeScript check passed, consistent with Phase 6 pattern
- **Committed in:** 93f90ec (Task 1 commit)

---

**Total deviations:** 4 (2 blocking-resolved, 1 bug fix, 1 missing critical)
**Impact on plan:** All deviations necessary for correct operation. The Docker rebuild and Playwright install are environment setup items, not code issues. No scope creep.

## Known Stubs

None found — all implementations are real logic with seeded data arrays, DB writes, finding inserts, and gate enforcement.

## Issues Encountered

None beyond the auto-fixed deviations above. All plan verification checks pass:
1. `grep -n 'class LessonsLearnedAgent\|F7-001\|seeded.*true\|torque\|SI-07'` → PHASE 7 AGENT WITH SI-07 SEEDED ISSUE ✓
2. `grep -n 'GATE_AI_PROHIBITED\|AI_ACTOR_BLOCKLIST'` → GATE 7 AI PROHIBITION PRESENT ✓
3. `grep -n 'LL-001.*torque\|torque.*MOP-012'` → TORQUE VARIATION IN LESSONS REGISTER ✓
4. `grep -n 'si-intake-external\|up-intake-internal'` → INTAKE CONFIG TESTS PRESENT ✓
5. `grep -c 'Phase 5\|Phase 6\|Phase 7'` → 25 → ALL THREE PHASES COVERED ✓
6. `npx playwright test e2e/phases-5-7.spec.ts` → 25 passed (0 failing, 0 skipped) ✓
7. `npm run build` → Build passes ✓

## User Setup Required

None - no external service configuration required. ANTHROPIC_API_KEY must be set for LLM narrative calls in LessonsLearnedAgent at runtime.

## Next Phase Readiness

- Phase 7 Transfer & Lessons Learned agent complete: execute → LessonsLearnedAgent → Lessons-Learned Register XLSX + Transfer Report DOCX → Gate 7 review workspace populated → human records Pass
- F7-001 seeded=true (SI-07: MOP-012 torque variation, Observation, non-blocking) captured in lessons-learned
- Gate 7 decide enforces AI actor prohibition; compact phase summary written for downstream context
- Phase 5/6/7 lifecycle agents complete — full happy path from Phase 5 V&V through Phase 7 Transfer possible
- Playwright test suite covers all three phases: 25 tests, all passing

---
*Phase: 05-lifecycle-phases-5-7-agents*
*Completed: 2026-08-18*

## Self-Check: PASSED

- [x] `src/server/agents/phase7/lessonsLearnedAgent.ts` — FOUND
- [x] `src/server/agents/phase7/outputGenerators.ts` — FOUND
- [x] `src/app/api/phases/7/execute/route.ts` — FOUND
- [x] `src/app/api/phases/7/outputs/route.ts` — FOUND
- [x] `src/app/api/gates/7/review/route.ts` — FOUND
- [x] `src/app/api/gates/7/decide/route.ts` — FOUND
- [x] `e2e/phases-5-7.spec.ts` — FOUND
- [x] `.planning/phases/05-lifecycle-phases-5-7-agents/05-03-SUMMARY.md` — FOUND
- [x] Commits 93f90ec, 167907c — both present in git log
- [x] Build check: `npm run build` → Compiled successfully (exit 0)
- [x] Playwright tests: 25/25 passed (0 failing, 0 skipped)
- [x] TypeScript: `npx tsc --noEmit` → 0 errors
- [x] No blocking stubs found
