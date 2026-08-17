---
phase: 01-foundation
plan: 04
subsystem: database, ui
tags: [nextjs15, playwright, drizzle, postgresql, app-shell, breadcrumb, stub-pages, security, revoke]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: AppShell component with phaseId/gateId props from plan 01-03
  - phase: 01-foundation
    provides: PHASE_CONFIG_MAP constants from plan 01-02
  - phase: 01-foundation
    provides: seed.ts with app_role creation DO block from plan 01-01
provides:
  - REVOKE UPDATE, DELETE ON audit_history FROM app_role in seed.ts (PS-03 audit immutability enforced at DB layer)
  - Stub page /findings-actions wrapped in AppShell (AV-10 breadcrumb compliance)
  - Stub page /audit wrapped in AppShell (AV-10 breadcrumb compliance)
  - Dynamic route /phase/[id] pages 0-9 wrapped in AppShell with phaseId prop (LC-05 breadcrumb on all primary views)
  - 2 new Playwright e2e tests for stub page AppShell rendering (12 total, all passing)
affects: [AV-03, AV-04, AV-05, AV-06, AV-07, AV-08, AV-09, 01-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Next.js 15 async params pattern (await params) used for /phase/[id] dynamic route
    - generateStaticParams prebuilds all 10 phase routes at build time (SSG)
    - REVOKE placed immediately after app_role creation DO block — idempotent on every container boot
    - PostgreSQL REVOKE on never-granted privilege is no-op (does not error, issues NOTICE)

key-files:
  created:
    - src/app/findings-actions/page.tsx (placeholder Findings & Actions wrapped in AppShell)
    - src/app/audit/page.tsx (placeholder Audit Log wrapped in AppShell)
    - src/app/phase/[id]/page.tsx (dynamic Phase Workspace 0-9 with phaseId prop to AppShell)
  modified:
    - src/db/seed.ts (added REVOKE UPDATE, DELETE ON audit_history FROM app_role)
    - e2e/foundation-views.spec.ts (added 2 stub-page tests)

key-decisions:
  - "REVOKE placed after app_role DO block in seed.ts — revoking never-granted privilege is no-op in PostgreSQL, making it idempotent on every container boot"
  - "generateStaticParams for /phase/[id] prebuilds all 10 phase routes — consistent with Next.js SSG pattern for known finite route set"
  - "Stub pages intentionally show 'available in Phase N' placeholder — cosmetic, not blocking; scaffold for future plan content"

patterns-established:
  - "Dynamic routes use Next.js 15 async params: const { id } = await params"
  - "generateStaticParams lists all known IDs for finite dynamic routes"
  - "REVOKE statements in seed.ts follow CREATE ROLE block to enforce DB-layer permissions"

# Metrics
duration: 7min
completed: 2026-08-16
---

# Phase 1 Plan 04: Gap Closure Summary

**Audit immutability enforced at DB layer via REVOKE in seed.ts, and three stub pages (/findings-actions, /audit, /phase/[id]) added to eliminate sidebar 404s — all 12 Playwright e2e tests passing**

## Performance

- **Duration:** 7 min
- **Started:** 2026-08-16T21:38:19Z
- **Completed:** 2026-08-16T21:44:57Z
- **Tasks:** 2 completed
- **Files modified:** 5

## Accomplishments

- `src/db/seed.ts`: Added `REVOKE UPDATE, DELETE ON audit_history FROM app_role` after the `CREATE ROLE app_role` DO block — enforces append-only constraint at PostgreSQL permission layer (PS-03)
- Three stub pages created: `/findings-actions`, `/audit`, `/phase/[id]` — each wrapped in AppShell so sidebar navigation links never render Next.js 404 (AV-10, LC-05)
- `/phase/[id]` dynamic route: reads `params.id` with Next.js 15 async pattern, looks up phase name from PHASE_CONFIG_MAP, passes `phaseId` to AppShell so Breadcrumb renders `EV-INV-800 > Phase N: [Name]`
- `generateStaticParams` prebuilds all 10 phase routes at build time (SSG)
- 2 new Playwright e2e tests added — 12/12 pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Add REVOKE UPDATE, DELETE on audit_history from app_role to seed** - `385a7cd` (feat)
2. **Task 2: Stub pages for /findings-actions, /audit, /phase/[id] + e2e tests** - `1693a00` (feat)

**Plan metadata:** (committed after this SUMMARY)

## Files Created/Modified

- `src/db/seed.ts` — added REVOKE UPDATE, DELETE ON audit_history FROM app_role after app_role creation block
- `src/app/findings-actions/page.tsx` — placeholder Findings & Actions page wrapped in AppShell
- `src/app/audit/page.tsx` — placeholder Audit Log page wrapped in AppShell
- `src/app/phase/[id]/page.tsx` — dynamic Phase Workspace for phases 0-9 with phaseId prop, generateStaticParams, PHASE_CONFIG_MAP lookup
- `e2e/foundation-views.spec.ts` — 2 new tests: sidebar stub page AppShell rendering + /phase/0 breadcrumb segment

## Decisions Made

1. **REVOKE idempotency**: PostgreSQL REVOKE on a privilege never granted issues a NOTICE but does NOT throw an error — safe to execute on every container boot without `IF EXISTS` guards.

2. **generateStaticParams for /phase/[id]**: All 10 phase IDs (0–9) are a finite known set. SSG prebuilds all paths at build time, producing `/phase/0` through `/phase/9` as static HTML — aligns with Next.js best practice for known dynamic routes.

3. **Playwright tests needed docker DB running**: Playwright webServer starts the Next.js dev server, which calls `/api/lifecycle` — requires live PostgreSQL. DB must be started with `docker compose up -d db` and seeded before running e2e tests. This was the pre-existing constraint from plan 01-03.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Playwright chromium not installed (fresh node_modules)**
- **Found during:** Task 2 (first Playwright run after npm install)
- **Issue:** node_modules/ was absent (fresh environment); after `npm install`, chromium binary was also absent at the expected cache path
- **Fix:** Ran `npx playwright install chromium` and `npx playwright install-deps chromium` to install browser binary and system dependencies
- **Files modified:** system-level only (no tracked files)
- **Verification:** 12/12 Playwright tests pass
- **Committed in:** N/A (system-level fix)

**2. [Rule 3 - Blocking] DB not running for Playwright e2e tests**
- **Found during:** Task 2 (first Playwright run — 4 of 12 tests failing with ECONNREFUSED)
- **Issue:** PostgreSQL container not running; `/api/lifecycle` DB calls returned ECONNREFUSED; lifecycle page rendered no phase cards
- **Fix:** `docker compose up -d db` + `npx tsx --env-file .env.local src/db/seed.ts` to start DB and seed data
- **Files modified:** N/A (infrastructure operation, no tracked files)
- **Verification:** 12/12 Playwright tests pass after DB started and seeded
- **Committed in:** N/A (runtime fix, no file changes)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both auto-fixes were infrastructure/environment setup — not code defects. Plan objective fully achieved.

## Known Stubs

None found — grep scan of all new/modified files returned no TODO/FIXME/placeholder/not-implemented matches. The "available in Phase N" placeholder text in stub pages is intentional cosmetic content per plan specification (not blocking — the pages ARE the full deliverable for this plan).

## Issues Encountered

None — all 12 Playwright tests pass. Build compiles successfully with all new routes.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All must_have truths from plan 01-04 fulfilled:
  - `audit_history` UPDATE/DELETE revoked from `app_role` at DB layer (PS-03)
  - `/findings-actions`, `/audit`, `/phase/0`–`/phase/9` all render AppShell with breadcrumb (AV-10, LC-05)
- All 9 sidebar view stubs now exist (AV-01 homepage, AV-02 /lifecycle, AV-10 /findings-actions, /audit, /phase/0-9)
- Ready for Plan 01-05 and subsequent content plans (AV-03–AV-09)

## Self-Check: PASSED

- All key files found on disk: seed.ts, findings-actions/page.tsx, audit/page.tsx, phase/[id]/page.tsx, foundation-views.spec.ts, 01-04-SUMMARY.md
- Both commits verified in git log (385a7cd, 1693a00)
- Build check: `npm run build` → Compiled successfully → exit 0
- Playwright check: `npx playwright test e2e/foundation-views.spec.ts` → 12 passed (10.2s)
- No blocking stubs found (grep scan clean)

---
*Phase: 01-foundation*
*Completed: 2026-08-16*
