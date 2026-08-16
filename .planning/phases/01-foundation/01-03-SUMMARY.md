---
phase: 01-foundation
plan: 03
subsystem: ui
tags: [nextjs15, react19, shadcn-ui, tailwind-v4, playwright, breadcrumb, app-shell, dark-theme]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: 11-table Drizzle schema (projectState, phaseStates) from plan 01-01
  - phase: 01-foundation
    provides: PHASE_CONFIG, PHASE_CONFIG_MAP, TECHNICAL_REVIEW_PHASES constants from plan 01-02
provides:
  - AppShell component (top bar + sidebar + breadcrumb + content area) wrapping all pages
  - Breadcrumb component with TECHNICAL_REVIEW_PHASES gating (phases 0,1,3,4 only)
  - Sidebar with links to all 9 views + P0–P9 phase shortcuts
  - SyntheticBadge (violet, always visible in top bar)
  - Dark-first CSS custom properties (--color-surface, --color-border, --color-text-primary, etc.)
  - shadcn/ui components (button, badge, card, table, dialog, alert-dialog, progress, tabs, select, radio-group, separator, tooltip)
  - Project Overview page (AV-01) with EVINV-POC-001 identity card + 10-row phase summary table
  - Product Lifecycle View (AV-02) with 10 phase cards + technical-review badges
  - /api/lifecycle GET endpoint returning project + 10 phase states from DB
  - 10 Playwright e2e tests — all passing
affects: [AV-03, AV-04, AV-05, AV-06, AV-07, AV-08, AV-09, 01-04, 01-05]

# Tech tracking
tech-stack:
  added:
    - shadcn/ui (badge, button, card, table, dialog, alert-dialog, progress, tabs, select, radio-group, separator, tooltip)
    - playwright.config.ts with webServer auto-start
  patterns:
    - AppShell wraps all pages — breadcrumb + SyntheticBadge cannot be suppressed by page code
    - CSS custom properties for dark-first theme (--color-background, --color-surface, --color-border, --color-text-primary/muted, status colors)
    - Technical review gating: TECHNICAL_REVIEW_PHASES.has(phaseId) guards both Breadcrumb.tsx and lifecycle/page.tsx
    - fetch /api/lifecycle with cache: 'no-store' for live phase state data in server components
    - Playwright locators scoped to ARIA landmarks (complementary, navigation) to avoid strict-mode violations

key-files:
  created:
    - src/components/layout/AppShell.tsx (shell wrapper: top bar + sidebar + breadcrumb + content)
    - src/components/layout/Sidebar.tsx (nav links + phase shortcuts, usePathname active state)
    - src/components/layout/Breadcrumb.tsx (TECHNICAL_REVIEW_PHASES gating, clickable segments)
    - src/components/layout/SyntheticBadge.tsx (violet badge with aria-label)
    - src/lib/utils.ts (cn() tailwind-merge helper from shadcn)
    - src/components/ui/ (11 shadcn/ui components)
    - src/app/api/lifecycle/route.ts (GET /api/lifecycle)
    - src/app/lifecycle/page.tsx (AV-02 with data-testid phase cards)
    - e2e/foundation-views.spec.ts (10 Playwright tests)
    - playwright.config.ts (webServer auto-start, chromium)
    - .env.local (DATABASE_URL + REDIS_URL for local dev)
    - components.json (shadcn config)
  modified:
    - src/app/globals.css (dark-first CSS tokens + shadcn theme variables)
    - src/app/layout.tsx (Inter + JetBrains Mono fonts)
    - src/app/page.tsx (Project Overview AV-01 replacing placeholder)

key-decisions:
  - "shadcn @layer base replaced @apply border-border with direct CSS property (border-color: var(--color-border)) — Tailwind v4 @apply fails on shadcn utility classes when theme variables are redefined"
  - "Playwright locators use ARIA landmark scoping (getByRole complementary, navigation) to avoid strict-mode violations from multiple EV-INV-800/Lifecycle occurrences on page"
  - "webServer in playwright.config.ts auto-starts Next.js dev server for e2e tests — no manual server startup required"
  - ".env.local points DB/Redis at localhost ports exposed by docker compose (port forwarding)"

patterns-established:
  - "AppShell is the gate for SyntheticBadge — renders in top bar, impossible to suppress per-page"
  - "TECHNICAL_REVIEW_PHASES set guards both Breadcrumb (segment visibility) and lifecycle page (badge rendering)"
  - "Server components fetch /api/lifecycle with cache: 'no-store' for live phase data"
  - "Playwright tests scope to ARIA landmarks rather than text content to avoid strict-mode violations"

# Metrics
duration: 14min
completed: 2026-08-16
---

# Phase 1 Plan 03: Foundation Summary

**App shell with dark-first theme, shadcn/ui, persistent SyntheticBadge, and two foundation views (Project Overview AV-01 + Product Lifecycle View AV-02) backed by /api/lifecycle — all 10 Playwright e2e tests passing**

## Performance

- **Duration:** 14 min
- **Started:** 2026-08-16T16:46:01Z
- **Completed:** 2026-08-16T17:00:34Z
- **Tasks:** 2 completed
- **Files modified:** 25+

## Accomplishments

- Dark-first theme: 9 CSS custom property tokens (--color-surface, --color-background, --color-border, --color-text-primary/muted, pass/conditional/fail/awaiting/upcoming/synthetic/advisory/blocked)
- AppShell: top bar with TT Engineering Copilot branding + SyntheticBadge, Sidebar with 9-view nav + P0–P9 shortcuts, Breadcrumb with TECHNICAL_REVIEW_PHASES gating
- shadcn/ui initialized with 11 components (button, badge, card, table, dialog, alert-dialog, progress, tabs, select, radio-group, separator, tooltip)
- Project Overview (AV-01): EVINV-POC-001 identity card + 10-row phase summary table linked to phase workspaces
- Product Lifecycle View (AV-02): 10 phase cards with technical review badges ONLY on phases 0 (Kickoff), 1 (SLR), 3 (Schematic/PDR), 4 (PCB Layout/CDR); none on phases 2, 5, 6, 7, 8, 9
- /api/lifecycle: returns project + 10 phase states from PostgreSQL DB
- 10 Playwright e2e tests — all pass (foundation-views.spec.ts)
- npm run build succeeds (Compiled successfully)

## Task Commits

Each task was committed atomically:

1. **Task 1: App shell, dark-first theme, shadcn/ui** - `d8cc473` (feat)
2. **Task 2: Breadcrumb, AV-01, AV-02, Playwright tests** - `62e2570` (feat)

**Plan metadata:** (committed after this SUMMARY)

## Files Created/Modified

- `src/app/globals.css` — dark-first CSS tokens + shadcn theme variables (oklch-based dark defaults)
- `src/app/layout.tsx` — Inter + JetBrains Mono fonts via next/font
- `src/app/page.tsx` — Project Overview (AV-01): identity card + phase summary table
- `src/app/lifecycle/page.tsx` — Product Lifecycle View (AV-02): 10 phase cards with data-testid
- `src/app/api/lifecycle/route.ts` — GET /api/lifecycle: project + phaseStates from DB
- `src/components/layout/AppShell.tsx` — shell wrapper with top bar + SyntheticBadge + sidebar + breadcrumb
- `src/components/layout/Sidebar.tsx` — nav: 4 view links + P0–P9 shortcuts, usePathname active state
- `src/components/layout/Breadcrumb.tsx` — TECHNICAL_REVIEW_PHASES gating, clickable segments
- `src/components/layout/SyntheticBadge.tsx` — violet badge with aria-label
- `src/lib/utils.ts` — cn() tailwind-merge helper
- `src/components/ui/` — 11 shadcn/ui components
- `e2e/foundation-views.spec.ts` — 10 Playwright e2e tests
- `playwright.config.ts` — Playwright config with webServer auto-start
- `components.json` — shadcn initialization config
- `.env.local` — local DATABASE_URL/REDIS_URL pointing to dockerized services

## Decisions Made

1. **CSS @apply replaced with direct properties**: Tailwind v4 `@apply border-border` in `@layer base` fails when shadcn's theme variables are redefined alongside custom tokens. Fixed by using `border-color: var(--color-border)` directly — produces identical output without the @apply compilation path.

2. **Playwright ARIA landmark scoping**: `getByText('EV-INV-800')` and `getByText('EVINV-POC-001')` match multiple elements (top bar, breadcrumb, card title). Fixed by scoping to ARIA landmarks: `getByRole('complementary', { name: 'Main navigation' })` for sidebar, `getByRole('navigation', { name: 'Breadcrumb' })` for breadcrumb.

3. **webServer in playwright.config.ts**: Added `webServer` config block so `npx playwright test` auto-starts the dev server. Avoids manual setup and works in CI.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Tailwind v4 @apply border-border fails when globals.css redefines @theme inline variables**
- **Found during:** Task 1/2 (first dev server start)
- **Issue:** shadcn's `@layer base { * { @apply border-border ... } }` failed with "Cannot apply unknown utility class `border-border`" when the `@theme inline` block's `--color-border` was mapped to a custom property instead of the shadcn `--border` variable
- **Fix:** Replaced `@apply border-border outline-ring/50` with direct CSS properties: `border-color: var(--color-border)` and `outline-color: oklch(from var(--ring) l c h / 50%)`
- **Files modified:** src/app/globals.css
- **Verification:** `npm run dev` → HTTP 200; `npm run build` → Compiled successfully
- **Committed in:** 62e2570 (Task 2 commit)

**2. [Rule 1 - Bug] Playwright tests used strict-mode-violating locators (multiple element matches)**
- **Found during:** Task 2 (first Playwright run)
- **Issue:** `getByText('EVINV-POC-001')` matched 2 elements; `getByText('EV-INV-800')` matched 3 elements; `getByRole('link', { name: 'Lifecycle' })` matched 2 elements — all Playwright strict-mode violations
- **Fix:** Used `.first()` for EVINV-POC-001, scoped EV-INV-800 to Breadcrumb landmark, scoped Lifecycle link to sidebar complementary landmark with `exact: true`
- **Files modified:** e2e/foundation-views.spec.ts
- **Verification:** 10/10 tests pass
- **Committed in:** 62e2570 (Task 2 commit)

**3. [Rule 3 - Blocking] Playwright chromium missing system library libnspr4.so**
- **Found during:** Task 2 (first Playwright run)
- **Issue:** chromium-headless-shell crashed with `error while loading shared libraries: libnspr4.so: cannot open shared object file`
- **Fix:** Ran `npx playwright install-deps chromium` to install OS-level library dependencies
- **Files modified:** system packages only
- **Verification:** 10/10 tests pass
- **Committed in:** N/A (system-level fix, no file changes)

---

**Total deviations:** 3 auto-fixed (2 bug, 1 blocking)
**Impact on plan:** All auto-fixes essential for the app to serve correctly and tests to pass. Plan objective fully achieved.

## Known Stubs

None found — grep scan of all new/modified files returned no TODO/FIXME/placeholder/not-implemented matches.

## Issues Encountered

None — all Playwright tests pass (10/10). Build compiles successfully.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- AppShell available for all subsequent views (AV-03–AV-09)
- Breadcrumb with TECHNICAL_REVIEW_PHASES gating ready for phase workspaces
- /api/lifecycle endpoint available for any view needing lifecycle state
- shadcn/ui components installed for all subsequent UI work
- Playwright test infrastructure established (webServer config, chromium installed)
- Ready for Plan 01-04 and beyond

## Self-Check: PASSED

- All key files found on disk: AppShell.tsx, Sidebar.tsx, Breadcrumb.tsx, SyntheticBadge.tsx, api/lifecycle/route.ts, lifecycle/page.tsx, page.tsx, globals.css, e2e/foundation-views.spec.ts, playwright.config.ts
- Both commits verified in git log (d8cc473, 62e2570)
- Build check: `npm run build` → Compiled successfully, 6 routes generated → exit 0
- Playwright check: `npx playwright test e2e/foundation-views.spec.ts` → 10 passed (8.3s)
- No blocking stubs found (grep scan clean)

---
*Phase: 01-foundation*
*Completed: 2026-08-16*
