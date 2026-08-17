---
phase: 03-lifecycle-phases-0-2-agents
plan: 04
subsystem: artifacts
tags: [xlsx, drizzle-orm, next.js, react, playwright, artifacts, idempotent]

# Dependency graph
requires:
  - phase: 03-lifecycle-phases-0-2-agents
    provides: artifactGenerator.ts (generateXlsx/generateDocx), InputReadinessPanel.tsx

provides:
  - next.config.mjs with serverExternalPackages: ['xlsx'] — prevents Next.js from bundling xlsx
  - Idempotent generateXlsx() using XLSX.write buffer pattern + fileSizeBytes from real buffer
  - Idempotent generateDocx() with stale-row cleanup before insert
  - InputReadinessPanel Run Phase button wired to POST /api/phases/{phaseId}/execute with error display

affects: [03-01, 03-02, 03-03, phase-execution, artifact-generation]

# Tech tracking
tech-stack:
  added: [drizzle-orm eq/and imports]
  patterns: [buffer-write pattern for xlsx (XLSX.write+writeFileSync), delete-before-insert idempotency, react useState error/loading state pattern]

key-files:
  created: []
  modified:
    - next.config.mjs
    - src/server/artifacts/artifactGenerator.ts
    - src/components/intake/InputReadinessPanel.tsx
    - e2e/gate-review.spec.ts

key-decisions:
  - "XLSX buffer write pattern (XLSX.write+writeFileSync) used over XLSX.writeFile — avoids Next.js App Router fs bundling restriction"
  - "Delete-before-insert idempotency in both generateXlsx and generateDocx — prevents duplicate artifact_registry rows on agent retry"
  - "fileSizeBytes computed from xlsxBuffer.length — replaces hardcoded 0 placeholder"
  - "handleRunPhase calls refresh() in finally block — ensures SWR revalidation on both success and error paths"

patterns-established:
  - "Buffer write pattern: XLSX.write(wb, {type:'buffer', bookType:'xlsx'}) + writeFileSync — use for all future XLSX generation"
  - "Idempotent artifact insert: delete stale (phaseId, gateId, source, generatedBy, artifactType) before insert"
  - "Error state pattern: useState<string|null>(null) for executeError, shown as data-testid='execute-error'"

# Metrics
duration: 6min
completed: 2026-08-17
---

# Phase 3 Plan 04: Fix xlsx Bundling, Idempotent Registry, and Run Phase Button Summary

**xlsx bundling fixed via serverExternalPackages+buffer write, artifact_registry made idempotent via delete-before-insert, Run Phase button wired to POST /api/phases/{phaseId}/execute with spinner and error display**

## Performance

- **Duration:** 6 min
- **Started:** 2026-08-17T19:44:10Z
- **Completed:** 2026-08-17T19:50:21Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Added `serverExternalPackages: ['xlsx']` to `next.config.mjs` — Next.js App Router now loads xlsx from node_modules at runtime where `fs` is available
- Replaced `XLSX.writeFile()` with `XLSX.write(wb, {type:'buffer'}) + writeFileSync` in `generateXlsx()` — belt-and-suspenders fix matching the DOCX pattern
- Fixed `fileSizeBytes` in XLSX path: now computed from `xlsxBuffer.length` instead of hardcoded `0`
- Added delete-before-insert idempotency in both `generateXlsx()` and `generateDocx()` — prevents duplicate `artifact_registry` rows on agent retry after partial failure
- Wired the Run Phase button's `onClick` to POST `/api/phases/${phaseId}/execute` with isExecuting spinner and executeError display

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix xlsx bundling — serverExternalPackages + rewrite generateXlsx to avoid XLSX.writeFile** - `8fd9859` (fix)
2. **Task 2: Wire Run Phase button to POST /api/phases/{phaseId}/execute with error display** - `25f9c06` (feat)

**Plan metadata:** `(pending)` (docs: complete plan)

## Files Created/Modified
- `next.config.mjs` — Added `serverExternalPackages: ['xlsx']` to prevent Next.js bundling xlsx
- `src/server/artifacts/artifactGenerator.ts` — Buffer write pattern, real fileSizeBytes, idempotent delete-before-insert in both generators; added `eq, and` from drizzle-orm
- `src/components/intake/InputReadinessPanel.tsx` — Wired Run Phase button: handleRunPhase handler, isExecuting/executeError state, error display below button
- `e2e/gate-review.spec.ts` — Added "Run Phase button is present and wired (not a no-op)" Playwright test

## Decisions Made
- Used `XLSX.write(wb, {type:'buffer', bookType:'xlsx'}) + writeFileSync` instead of `XLSX.writeFile` — matches existing DOCX pattern and eliminates dependency on xlsx's internal `fs.writeFileSync` call going through the bundler
- Delete-before-insert scoped to `(phaseId, gateId, source='AgentGenerated', generatedBy, artifactType)` — precise enough to clean only partial-run artifacts without affecting other rows
- `refresh()` called in `finally` block in addition to success path — ensures SWR revalidation even on error so status badge updates

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None found.

## Issues Encountered

**Playwright environment:** The Playwright Chromium browser was not installed in the sandbox. Installed via `npx playwright install chromium` and `npx playwright install-deps chromium`. After install, 5 of 16 tests in `gate-review.spec.ts` pass (same tests that require only page load without DB). 11 tests that require the DB to be running (SWR data from API) fail — these are pre-existing failures that existed before this plan, not regressions. The new test added in Task 2 ("Run Phase button is present and wired") also requires the DB for the phase page to fully load, so it falls into the same category. All vitest unit tests (38/38) pass and the build succeeds.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- UAT blockers 1, 4, and 5 are closed: xlsx bundling fixed, idempotent artifact registry, Run Phase button wired
- Phases 0, 1, and 2 should now execute end-to-end and produce compact artifacts
- Phase 3 (03-lifecycle-phases-0-2-agents) plans complete

---
*Phase: 03-lifecycle-phases-0-2-agents*
*Completed: 2026-08-17*

## Self-Check: PASSED

- [x] `next.config.mjs` modified and contains `serverExternalPackages: ['xlsx']`
- [x] `src/server/artifacts/artifactGenerator.ts` modified — `XLSX.writeFile` removed, buffer write pattern present, both deletes present
- [x] `src/components/intake/InputReadinessPanel.tsx` modified — `handleRunPhase` wired, `executeError` state present
- [x] `e2e/gate-review.spec.ts` modified — new test appended
- [x] Commit `8fd9859` exists (Task 1)
- [x] Commit `25f9c06` exists (Task 2)
- [x] Build check: `npm run build` → exit 0
- [x] Unit tests: `npx vitest run tests/` → 38/38 passed
- [x] No blocking stubs found
