---
phase: 02-input-intake-framework
plan: 03
subsystem: ui
tags: [react, nextjs, shadcn, playwright, react-dropzone, swr, intake-ui, phase-workspace, e2e-tests]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: "AppShell, Sidebar, PHASE_CONFIG_MAP, layout.tsx"
  - phase: 02-input-intake-framework
    provides: "Plan 01 — intake API routes, 11 XLSX samples; Plan 02 — versioning API routes"
provides:
  - "UpIntakeCard: react-dropzone upload card with validation error display, 'Upload Revised Version' label, synthetic disclaimer"
  - "SiIntakeCard: 'Simulated Connector' badge, 'Preloaded Synthetic Sample' label, 'No live connection' notice, AlertDialog confirmation for Ingest Sample"
  - "InputReadinessPanel: SWR polling readiness + execution-status, 'Run Phase' button disabled until bothReady"
  - "PhaseExecutionStatusBadge: semantic status colors for all lifecycle states"
  - "VersionHistoryTable: Active/Historical version display with SWR fetch"
  - "Phase Workspace (AV-03): /phase/[id] — full Phase Workspace with input readiness and outputs panel for all 10 phases"
  - "Input Intake Panel (AV-04): /phase/[id]/intake — intake + validation + version history for all 10 phases"
  - "e2e/intake-framework.spec.ts: 29 Playwright tests — UP card, SI card, execution status, AV-04, prohibited labels for all 10 phases"
affects: [AV-03, AV-04, AV-05, 03-phase-agents]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "SWR polling every 3s for readiness + execution-status in InputReadinessPanel"
    - "AlertDialog confirmation before SI ingest — requires explicit user action, sends confirm_viewed: true"
    - "react-dropzone onDrop → fetch POST to /api/phases/[id]/inputs/[role]/upload"
    - "Playwright strict mode fix: use getByRole/getByText({exact:true})/getByRole('alertdialog') to avoid multiple match errors"
    - "Next.js 15 async params: await params before destructuring in all page components"

key-files:
  created:
    - src/components/intake/UpIntakeCard.tsx
    - src/components/intake/SiIntakeCard.tsx
    - src/components/intake/InputReadinessPanel.tsx
    - src/components/intake/PhaseExecutionStatusBadge.tsx
    - src/components/intake/VersionHistoryTable.tsx
    - src/app/phase/[id]/intake/page.tsx
    - e2e/intake-framework.spec.ts
  modified:
    - src/app/phase/[id]/page.tsx (replaced stub with full Phase Workspace)
    - src/app/api/phases/ (moved from root app/ — fixes routing)
    - src/app/api/project/dependency-graph/ (moved from root app/ — fixes routing)

key-decisions:
  - "Moved 11 API route files from root app/api/ to src/app/api/ — root-level app/ directory shadows src/app/ in Next.js, breaking all UI pages"
  - "AlertDialogTrigger rendered as styled button directly (no asChild) — @base-ui/react Button does not support asChild prop"
  - "Download button rendered as styled <a> tag instead of Button asChild — @base-ui/react Button has no asChild support"
  - "Playwright locators use getByRole/{ exact: true } to avoid strict mode violations from duplicate text elements"

patterns-established:
  - "All SWR polling components use 3s refresh interval for readiness/status updates"
  - "Both UpIntakeCard and SiIntakeCard show Synthetic POC Data disclaimer unconditionally"
  - "Prohibited label check: grep -rn 'Connected to|Retrieved from|replacement input' on intake components"

# Metrics
duration: 17min
completed: 2026-08-17
---

# Phase 2 Plan 03: Phase Workspace UI and Intake Panel Summary

**Phase Workspace (AV-03) and Input Intake Panel (AV-04) with UpIntakeCard/SiIntakeCard/InputReadinessPanel components, 29/29 Playwright tests, and root app/ → src/app/api/ migration restoring all UI routes in Next.js build**

## Performance

- **Duration:** 17 min
- **Started:** 2026-08-17T13:48:57Z
- **Completed:** 2026-08-17T14:06:29Z
- **Tasks:** 2
- **Files modified:** 19 (7 created, 3 modified, 11 moved)

## Accomplishments

- Complete intake UI component library: UpIntakeCard, SiIntakeCard, InputReadinessPanel, PhaseExecutionStatusBadge, VersionHistoryTable
- Phase Workspace (AV-03) at /phase/[id] rendering all 10 phases with correct phase names, inputs, and outputs
- Input Intake Panel (AV-04) at /phase/[id]/intake with version history tables for both external and internal inputs  
- 29/29 Playwright tests passing — all 10 phases verified for prohibited label absence
- Fixed structural bug: root-level `app/` directory was shadowing `src/app/` in Next.js routing, causing all UI pages (lifecycle, audit, findings-actions, phase workspace) to be excluded from builds

## Task Commits

Each task was committed atomically:

1. **Task 1: Intake UI components** - `49f3900` (feat) — UpIntakeCard, SiIntakeCard, InputReadinessPanel, PhaseExecutionStatusBadge, VersionHistoryTable
2. **Task 2: Phase Workspace, Intake Panel, Playwright tests** - `2d5eff6` (feat) — page.tsx, intake/page.tsx, e2e spec, API route migration

## Files Created/Modified

- `src/components/intake/UpIntakeCard.tsx` — react-dropzone upload with validation errors, synthetic disclaimer, "Upload Revised Version" label
- `src/components/intake/SiIntakeCard.tsx` — "Simulated Connector" badge, "Preloaded Synthetic Sample", "No live connection", AlertDialog confirmation
- `src/components/intake/InputReadinessPanel.tsx` — SWR polling 3s, UP/SI card switching by config, "Run Phase" disabled until bothReady
- `src/components/intake/PhaseExecutionStatusBadge.tsx` — semantic color mapping for all status values
- `src/components/intake/VersionHistoryTable.tsx` — Active/Historical badge display
- `src/app/phase/[id]/page.tsx` — Phase Workspace with InputReadinessPanel + outputs panel (was stub)
- `src/app/phase/[id]/intake/page.tsx` — Input Intake and Validation Panel with version history
- `e2e/intake-framework.spec.ts` — 29 Playwright tests: Phase Workspace, UP/SI card, execution status, AV-04, prohibited labels × 10 phases
- `src/app/api/phases/` — moved from root `app/api/phases/` (11 route files)
- `src/app/api/project/dependency-graph/` — moved from root `app/api/project/`

## Decisions Made

1. **Moved API routes from root app/ to src/app/api/**: Root-level `app/` directory (created by plans 02-01/02-02) was hijacking Next.js routing, causing all `src/app/` pages to be excluded from builds. Moving the 11 API route files to `src/app/api/` restores correct Next.js app router behavior.
2. **AlertDialogTrigger without asChild**: `@base-ui/react` Button component does not support `asChild` prop. Used styled AlertDialogTrigger directly with Tailwind classes.
3. **Download button as styled anchor**: Button from `@base-ui/react` has no `asChild` support. Used `<a>` tag with matching Tailwind button styles.
4. **Playwright strict mode fixes**: Multiple matching elements (sidebar + h1 for phase name, badge + notice for "Simulated Connector") required `getByRole('heading')`, `{ exact: true }`, and `getByRole('alertdialog')` to avoid strict mode violations.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Root app/ directory shadowing src/app/ in Next.js routing**
- **Found during:** Task 2 (build check showed 0/29 UI routes including phase pages)
- **Issue:** Plans 02-01 and 02-02 created API routes in the root-level `app/api/` directory. Next.js treats the first found app directory as the app router root. Since `app/` exists at root (before `src/app/`), all pages in `src/app/` (layout, lifecycle, audit, findings-actions, phase workspace) were excluded from the build. The `npm run build` output showed only 11 API routes with no UI pages.
- **Fix:** Moved all 11 API route files from `app/api/` to `src/app/api/`. Removed the root `app/` directory.
- **Files modified:** 11 route files renamed (R in git status), root app/ directory deleted
- **Verification:** `npm run build` now shows 29 routes including `/phase/[id]` (10 paths) and `/phase/[id]/intake` (10 paths)
- **Committed in:** 2d5eff6 (Task 2 commit)

**2. [Rule 1 - Bug] asChild prop not supported by @base-ui/react Button**
- **Found during:** Task 1 (tsc --noEmit showed TS2322 errors)
- **Issue:** Plan's SiIntakeCard code used `<Button asChild>` and `<AlertDialogTrigger asChild>` — @base-ui/react Button uses `render` prop not `asChild`
- **Fix:** AlertDialogTrigger rendered as styled button with Tailwind classes directly; Download button as styled `<a>` tag
- **Files modified:** src/components/intake/SiIntakeCard.tsx
- **Verification:** `tsc --noEmit` produces no errors
- **Committed in:** 49f3900 (Task 1 commit)

**3. [Rule 1 - Bug] Playwright strict mode violations from duplicate text**
- **Found during:** Task 2 (Playwright test run — 17 tests failing with strict mode errors)
- **Issue:** "Phase 0: Commercial Assessment" appears in sidebar + h1; "Simulated Connector" appears in badge + notice div; "No live connection to" appears in notice + dialog description
- **Fix:** Changed locators to `getByRole('heading')`, `getByText({ exact: true })`, `getByRole('alertdialog')`
- **Files modified:** e2e/intake-framework.spec.ts
- **Verification:** 29/29 Playwright tests pass
- **Committed in:** 2d5eff6 (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (3 bugs)
**Impact on plan:** All auto-fixes necessary for correctness. The root app/ fix restores the full build — all UI pages now appear correctly. No scope creep.

## Known Stubs

- `src/app/phase/[id]/page.tsx:71` — Outputs panel comment: "placeholder — populated by phase agents in later plans". The panel renders all output names from PHASE_CONFIG_MAP but shows "Pending phase execution" status. **Cosmetic** — the plan itself specifies this as a placeholder for later plans.

## Issues Encountered

- Playwright Chromium browser required `npx playwright install-deps chromium` to install missing system libraries (libnspr4.so etc.) on the sandbox. One-time setup.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase Workspace (AV-03) fully functional for all 10 phases — navigable from sidebar phase shortcuts
- Input Intake Panel (AV-04) with version history ready for use
- All 29 Playwright E2E tests pass, verifying prohibited label compliance across all 10 phases
- Build restored: all UI pages (lifecycle, audit, findings-actions, phase workspaces) now appear in Next.js build output
- Ready for Phase 2 remaining plans (phase agents, gate review, etc.)

## Self-Check: PASSED

- [x] src/components/intake/UpIntakeCard.tsx exists (164 lines)
- [x] src/components/intake/SiIntakeCard.tsx exists (192 lines)
- [x] src/components/intake/InputReadinessPanel.tsx exists (120 lines)
- [x] src/components/intake/PhaseExecutionStatusBadge.tsx exists (20 lines)
- [x] src/components/intake/VersionHistoryTable.tsx exists (44 lines)
- [x] src/app/phase/[id]/page.tsx exists (full Phase Workspace)
- [x] src/app/phase/[id]/intake/page.tsx exists (AV-04 Intake Panel)
- [x] e2e/intake-framework.spec.ts exists (29 tests)
- [x] Commits: 49f3900, 2d5eff6
- [x] Build: `npm run build` → exit 0, 29 routes including /phase/[id] × 10 + /phase/[id]/intake × 10
- [x] Playwright: 29/29 tests pass
- [x] No blocking stubs (outputs panel placeholder is cosmetic per plan spec)

---
*Phase: 02-input-intake-framework*
*Completed: 2026-08-17*
