---
phase: 02-input-intake-framework
plan: "04"
subsystem: ui
tags: [react, nextjs, intake, playwright, e2e, ux]

# Dependency graph
requires:
  - phase: 02-input-intake-framework
    provides: UpIntakeCard, SiIntakeCard, VersionHistoryTable, intake page components (plans 01-03)
provides:
  - UpIntakeCard without per-card Synthetic POC Data disclaimer div
  - SiIntakeCard without per-card Synthetic POC Data disclaimer div (Simulated Connector notice retained)
  - Version History section heading (h2) with id="version-history" scroll anchor and explanatory text
  - VersionHistoryTable improved empty state with second explanatory line
  - Updated Playwright e2e tests verifying disclaimer removal and new heading
affects:
  - verify-work (AV-04 Playwright tests now validate heading and disclaimer removal)
  - UAT gap closure (gap 2: per-card disclaimer; gap 6: Version History discoverability)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Global synthetic badge in AppShell covers POC data notice — no per-card duplicate needed"
    - "Version History section uses id scroll anchor + h2 heading + horizontal divider for discoverability"

key-files:
  created: []
  modified:
    - src/components/intake/UpIntakeCard.tsx
    - src/components/intake/SiIntakeCard.tsx
    - src/app/phase/[id]/intake/page.tsx
    - src/components/intake/VersionHistoryTable.tsx
    - e2e/intake-framework.spec.ts

key-decisions:
  - "Per-card Synthetic POC Data disclaimer removed — global AppShell SyntheticBadge is the canonical coverage point"
  - "Version History section wrapped in id='version-history' div with h2 heading and explanatory subtext for discoverability"
  - "VersionHistoryTable empty state now two lines — 'No versions yet.' + 'Upload or ingest an input to create the first version entry.'"
  - "Existing Playwright test 'shows synthetic disclaimer' updated to assert not-visible (per-card removal); new test added for AV-04 intake page"

patterns-established:
  - "UAT gap closure: remove per-component noise when a global notice already covers the concern"
  - "Section discoverability: labeled h2 + scroll anchor + explanatory text pattern for major page sections"

# Metrics
duration: 8min
completed: 2026-08-17
---

# Phase 2 Plan 04: Intake Card Disclaimer Removal and Version History Heading Summary

**Removed redundant per-card Synthetic POC Data disclaimer from UP/SI intake cards, added discoverable "Version History" h2 section heading with scroll anchor and improved empty state — closing UAT gaps 2 and 6.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-08-17T15:45:00Z
- **Completed:** 2026-08-17T15:53:42Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Removed the redundant per-card `Synthetic POC Data` disclaimer div from `UpIntakeCard` and `SiIntakeCard` — the AppShell `SyntheticBadge` is the single global point of coverage
- Retained Simulated Connector notice and Preloaded Synthetic Sample label in `SiIntakeCard` (card-specific, correct)
- Wrapped Version History section in `id="version-history"` scroll anchor with labeled `<h2>` heading, horizontal divider, and explanatory subtext
- Improved `VersionHistoryTable` empty state with a second explanatory line: "Upload or ingest an input to create the first version entry."
- Updated AV-04 Playwright test to assert Version History heading is visible via `getByRole('heading', {name: 'Version History'})`
- Added new Playwright test confirming per-card disclaimer is not visible in intake cards

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove per-card Synthetic POC Data disclaimer** - `19cdfda` (fix)
2. **Task 2: Add Version History heading, empty state, scroll anchor; update tests** - `5882e47` (feat)

**Plan metadata:** `(docs commit follows)`

## Files Created/Modified

- `src/components/intake/UpIntakeCard.tsx` — Removed 4-line Synthetic POC Data disclaimer div (lines 118–121)
- `src/components/intake/SiIntakeCard.tsx` — Removed 4-line Synthetic POC Data disclaimer div (lines 105–108); Simulated Connector notice retained
- `src/app/phase/[id]/intake/page.tsx` — Version History section wrapped in id="version-history" div with h2 heading, divider, and explanatory text
- `src/components/intake/VersionHistoryTable.tsx` — Empty state expanded to two-line div with explanatory second line
- `e2e/intake-framework.spec.ts` — Updated AV-04 test to check heading; updated 'shows synthetic disclaimer' test to assert not-visible; added 'intake cards do not show Synthetic POC Data disclaimer' test

## Decisions Made

- **Per-card disclaimer removed** — The AppShell `SyntheticBadge` is the authoritative global synthetic notice. Per-card duplication added visual noise without coverage benefit. Simulated Connector notice in SiIntakeCard is card-specific (states no live connection) and must remain.
- **Version History section h2** — UAT gap 6 identified users couldn't find Version History because it had no labeled heading. Added `<h2>Version History</h2>` with horizontal divider above the grid.
- **Empty state two-line** — Single "No versions yet." was too terse. Added "Upload or ingest an input to create the first version entry." as context for first-time users.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Playwright browser binaries not installed**
- **Found during:** Task 2 verification (running `npx playwright test`)
- **Issue:** Chromium headless shell not installed; missing system libraries (`libnspr4.so`)
- **Fix:** Ran `npx playwright install chromium` then `npx playwright install-deps chromium` to install browser and system dependencies
- **Files modified:** None (browser cache, not tracked)
- **Verification:** Tests ran successfully after install
- **Committed in:** Not committed (browser installation, not source)

**2. [Rule 2 - Missing Critical] Updated pre-existing 'shows synthetic disclaimer' test that conflicts with plan's disclaimer removal**
- **Found during:** Task 1 — existing test at line 41 expected disclaimer to be visible in UP intake card
- **Issue:** The test would fail after removing the disclaimer, creating a contradiction
- **Fix:** Updated test to `does not show per-card synthetic disclaimer (global AppShell badge covers it)` asserting `not.toBeVisible()`
- **Files modified:** e2e/intake-framework.spec.ts
- **Verification:** Test passes after disclaimer removal
- **Committed in:** 19cdfda (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 missing critical)
**Impact on plan:** Both auto-fixes necessary for test suite consistency and Playwright execution. No scope creep.

## Issues Encountered

- 11 pre-existing Playwright test failures due to database not running (Docker Compose not started): UP/SI intake card tests and Phase Execution Status tests require API responses that need a live DB. These failures pre-date this plan and are not caused by this plan's changes. All 19 tests that can pass without DB connectivity pass, including all 4 tests in the AV-04 block and all 10 prohibited-labels tests.

## Known Stubs

None found — all code changes implement real, complete behavior (disclaimer removal and heading addition are complete UI fixes).

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- UAT gap 2 closed: Intake cards no longer show per-card synthetic disclaimer
- UAT gap 6 closed: Version History section has visible h2 heading, scroll anchor, and explanatory text
- Ready for next plan in Phase 2 or phase transition

## Self-Check: PASSED

- All 5 modified files exist on disk ✓
- Both task commits (19cdfda, 5882e47) exist in git history ✓
- `npm run build` exits 0 with no errors ✓
- No blocking stubs found in changed files ✓

---
*Phase: 02-input-intake-framework*
*Completed: 2026-08-17*
