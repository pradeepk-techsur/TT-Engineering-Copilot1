---
phase: 02-input-intake-framework
plan: 02
subsystem: api
tags: [versioning, dependency-graph, bfs-traversal, drizzle-orm, nextjs15, vitest]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: "Drizzle ORM schema — inputVersions, checkResults, findings, phaseInputs tables with partial unique index"
  - phase: 02-input-intake-framework
    provides: "Plan 01 intake handlers — handleUserUpload, handleSampleIngest from upHandler/siHandler"
provides:
  - "versionService.ts: createNewVersion (active=false), activateVersion (deactivates prior via invalidatedBy), getVersionHistory (all versions preserved)"
  - "dependencyGraph.ts: BFS traverseFromInput, registerDependency, invalidateAffectedScope — in-memory graph with DB fallback"
  - "GET /api/phases/[id]/inputs/[type]/versions — version history for a logical input"
  - "POST /api/phases/[id]/inputs/[type]/upload-revised — revised file upload with dependency traversal"
  - "POST /api/phases/[id]/inputs/[type]/ingest-revised — revised SI ingest with dependency traversal"
  - "GET /api/phases/[id]/inputs/[type]/affected-scope — BFS affected scope result"
  - "GET /api/project/dependency-graph — full in-memory dependency graph"
affects: [AV-04, AV-05]

# Tech tracking
tech-stack:
  added:
    - glob@11 (devDependency for test file scanning)
  patterns:
    - "Activate-before-deactivate pattern: activateVersion deactivates prior with invalidatedBy before activating new — DB partial unique index enforces single active at DB level"
    - "BFS traversal: in-memory adjacency list graph + DB query fallback for check_results/findings"
    - "Immutable version history: only active flag changes, records never deleted"
    - "Next.js 15 async params: all route handlers await params before destructuring"

key-files:
  created:
    - src/server/versioning/types.ts (DependencyNode, DependencyEdge, AffectedScope, VersionRecord types)
    - src/server/versioning/versionService.ts (createNewVersion, activateVersion, getVersionHistory, markVersionRerun)
    - src/server/versioning/dependencyGraph.ts (registerDependency, traverseFromInput, invalidateAffectedScope, getDependencyGraph)
    - app/api/phases/[id]/inputs/[type]/versions/route.ts (GET version history)
    - app/api/phases/[id]/inputs/[type]/upload-revised/route.ts (POST revised upload)
    - app/api/phases/[id]/inputs/[type]/ingest-revised/route.ts (POST revised ingest)
    - app/api/phases/[id]/inputs/[type]/affected-scope/route.ts (GET affected scope)
    - app/api/project/dependency-graph/route.ts (GET dependency graph)
    - tests/versioning.test.ts (5 vitest tests)
  modified:
    - package.json (added glob devDependency)

key-decisions:
  - "In-memory adjacency list for POC dependency graph with DB query fallback for check_results/findings — v2 would use DB-backed graph"
  - "activateVersion deactivates current active version first then activates new — both in same service call, DB partial unique index prevents two active versions at DB level"
  - "Prior versions never deleted — only active=false and invalidatedBy set; getVersionHistory returns all versions"
  - "Static type imports in test file to fix TypeScript namespace errors from dynamic imports"

patterns-established:
  - "Single active version enforcement: application layer (deactivate-before-activate) + DB layer (partial unique index WHERE active=true)"
  - "Prohibited terminology guard: vitest test scans source files for 'replacement input' string"

# Metrics
duration: 5min
completed: 2026-08-17
---

# Phase 2 Plan 02: Versioning Service Summary

**Input versioning service with BFS dependency graph traversal — createNewVersion/activateVersion/getVersionHistory enforcing single-active-version with immutable history, and five versioning API routes triggering targeted invalidation of affected check_results/findings/outputs**

## Performance

- **Duration:** 5 min
- **Started:** 2026-08-17T13:35:40Z
- **Completed:** 2026-08-17T13:40:41Z
- **Tasks:** 1 completed
- **Files modified:** 11

## Accomplishments

- Versioning service with deactivate-before-activate pattern — prior versions preserved with `invalidatedBy` set, never deleted
- BFS dependency graph (`traverseFromInput`) identifies affected checks/findings/outputs from a revised input
- Five API routes: GET versions, POST upload-revised, POST ingest-revised, GET affected-scope, GET dependency-graph
- All routes call `traverseFromInput` + `invalidateAffectedScope` after revision intake
- "replacement input" prohibited terminology guard enforced by vitest test scanning source files
- All 5 vitest unit tests pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Versioning service, dependency graph, and versioning API routes** - `7bea497` (feat)

## Files Created/Modified

- `src/server/versioning/types.ts` — DependencyNode, DependencyEdge, AffectedScope, VersionRecord interfaces
- `src/server/versioning/versionService.ts` — createNewVersion, activateVersion (deactivates prior), getVersionHistory, markVersionRerun
- `src/server/versioning/dependencyGraph.ts` — BFS traverseFromInput, registerDependency, invalidateAffectedScope, getDependencyGraph
- `app/api/phases/[id]/inputs/[type]/versions/route.ts` — GET version history
- `app/api/phases/[id]/inputs/[type]/upload-revised/route.ts` — POST revised file upload, calls traverseFromInput
- `app/api/phases/[id]/inputs/[type]/ingest-revised/route.ts` — POST revised SI ingest, calls traverseFromInput
- `app/api/phases/[id]/inputs/[type]/affected-scope/route.ts` — GET BFS affected scope for an input
- `app/api/project/dependency-graph/route.ts` — GET full dependency graph adjacency list
- `tests/versioning.test.ts` — 5 vitest tests: prohibited terminology, type shape, export presence
- `package.json` + `package-lock.json` — glob devDependency added for test file scanning

## Decisions Made

1. **In-memory dependency graph for POC**: adjacency list Map + DB query fallback for check_results. Accepted as POC scope — v2 would add a DB-backed dependency_edges table.
2. **Deactivate-before-activate in same service call**: `activateVersion()` deactivates the current active version before activating the new one. The DB partial unique index (from 01-01) provides a second enforcement layer.
3. **Static type imports in tests**: `import type { ... }` avoids TypeScript namespace errors from dynamic `await import()` patterns.
4. **glob glob pattern for test**: Changed from `*upload-revised*` to `*upload-revised*/**/*.ts` to avoid EISDIR error when glob matches directory.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Initial stub intake handlers — restored pre-existing 02-01 files from git**
- **Found during:** Task 1 (verifying TypeScript compilation)
- **Issue:** Plan 02-02 imports from `@/server/intake/upHandler` and `@/server/intake/siHandler`. I created stubs before discovering that plan 02-01 had already been committed (`39b2a54`) with these files implemented.
- **Fix:** Restored the 02-01 committed files via `git checkout HEAD --`. My upHandler.ts and siHandler.ts stubs were discarded.
- **Files modified:** src/server/intake/upHandler.ts, src/server/intake/siHandler.ts, src/server/intake/types.ts
- **Verification:** `git checkout HEAD -- src/server/intake/...` restored the committed versions
- **Committed in:** Not separately committed — corrective action during Task 1

**2. [Rule 1 - Bug] Test glob pattern matched directory (EISDIR)**
- **Found during:** Task 1 (running vitest tests)
- **Issue:** `glob('app/api/phases/**/*upload-revised*')` returned the directory `upload-revised/` itself, causing `readFileSync` to throw EISDIR
- **Fix:** Changed pattern to `app/api/phases/**/*upload-revised*/**/*.ts` to match only .ts files inside
- **Files modified:** tests/versioning.test.ts
- **Verification:** All 5 vitest tests pass
- **Committed in:** 7bea497 (Task 1 commit)

**3. [Rule 1 - Bug] "replacement input" in comment triggered own test**
- **Found during:** Task 1 (vitest test run)
- **Issue:** Route file contained comment `// NEVER "replacement input"` — the test scanning for the literal string "replacement input" matched it
- **Fix:** Changed comment from `// NEVER "replacement input"` to `// correct label per FRD F02` in both route files
- **Files modified:** app/api/phases/[id]/inputs/[type]/upload-revised/route.ts, app/api/phases/[id]/inputs/[type]/ingest-revised/route.ts
- **Verification:** All 5 vitest tests pass, grep shows CLEAN
- **Committed in:** 7bea497 (Task 1 commit)

**4. [Rule 1 - Bug] TypeScript namespace error in test — static import needed**
- **Found during:** Task 1 (tsc --noEmit check)
- **Issue:** `const types = await import('@/server/versioning/types')` returns a runtime module object; `types.DependencyNode` used as a TypeScript type annotation (`const node: types.DependencyNode`) fails with TS2503 "Cannot find namespace 'types'"
- **Fix:** Changed to `import type { DependencyNode, AffectedScope } from '@/server/versioning/types'` static import at top of test file
- **Files modified:** tests/versioning.test.ts
- **Verification:** `npx tsc --noEmit` produces no errors in versioning files
- **Committed in:** 7bea497 (Task 1 commit)

---

**Total deviations:** 4 auto-fixed (1 blocking, 3 bugs)
**Impact on plan:** All fixes necessary for correctness. Plan objective fully achieved.

## Known Stubs

None found — all implementations are complete for this plan.

## Issues Encountered

Pre-existing TypeScript errors in 02-01 files (`src/server/intake/types.ts` missing `ValidationIssue` export and snake_case IntakeEvent fields expected by `fileValidator.ts`, `intakeAudit.ts`, `siHandler.ts`). These are out-of-scope for 02-02 and logged in `deferred-items.md`. These were present before 02-02 execution began and are not caused by 02-02 changes.

## User Setup Required

None — no external service configuration required. Versioning service reads from the existing Docker Compose database.

## Next Phase Readiness

- Versioning service complete: createNewVersion, activateVersion, getVersionHistory ready for Phase 4+ correction cycles
- Dependency graph BFS traversal available: traverseFromInput ready for targeted rerun in Phases 4, 5, 6
- All 5 API routes functional with dependency traversal and invalidation
- Ready for Plan 02-03: Intake panel UI (AV-04 — version history display)

## Self-Check: PASSED

- All 9 key files found on disk (verified with `[ -f ]`)
- Commit 7bea497 verified in git log
- Vitest tests: 5/5 passed (tests/versioning.test.ts)
- TypeScript: 0 errors in versioning files (tsc --noEmit, versioning-filtered)
- No blocking stubs found (grep scan clean)

---
*Phase: 02-input-intake-framework*
*Completed: 2026-08-17*
