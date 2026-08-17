---
phase: 01-foundation
plan: 01
subsystem: database
tags: [nextjs15, react19, drizzle-orm, postgresql, redis, docker-compose, typescript, tailwind-v4]

# Dependency graph
requires: []
provides:
  - Next.js 15 App Router project scaffolded with full dependency set
  - PostgreSQL 15 + Redis 7 via Docker Compose with healthchecks and depends_on service_healthy
  - All 11 Drizzle ORM table definitions matching TechArch §3.3 DDL
  - Partial unique index on input_versions WHERE active = true (single-active-version enforcement)
  - Idempotent migrate + seed: EVINV-POC-001 project row + 10 phase_states rows
  - /api/project/[projectId] GET endpoint
  - Playwright e2e smoke test
affects: [LC-02, LC-03, LC-04, LC-05, AV-01, AV-02, 01-02, 01-03, 01-04, 01-05]

# Tech tracking
tech-stack:
  added:
    - next@15.5.23 (App Router)
    - react@19
    - drizzle-orm@0.38 + drizzle-kit@0.29
    - pg@8.13 (PostgreSQL client)
    - ioredis@5.4.1
    - tailwindcss@4 + @tailwindcss/postcss
    - tsx@4.23.12 (TypeScript execution for migrate/seed in Docker)
    - playwright@1.49 + @playwright/test
    - vitest@2.1.8
  patterns:
    - Docker Compose: db(healthcheck) + redis(healthcheck) + app(depends_on service_healthy) + migrate→seed→serve
    - Drizzle ORM pgTable with typed column definitions
    - Partial unique index via .where(sql`active = true`) for single-active-version enforcement
    - onConflictDoNothing() for idempotent seed upserts
    - timestamptz as helper using timestamp({ withTimezone: true, mode: 'string' })

key-files:
  created:
    - src/db/schema.ts (11 Drizzle pgTable definitions)
    - src/db/index.ts (pg Pool + drizzle connection)
    - src/db/migrate.ts (idempotent migration runner)
    - src/db/seed.ts (EVINV-POC-001 project + 10 phase_states)
    - drizzle/0000_low_miracleman.sql (migration SQL with partial unique index)
    - e2e/app-boots.spec.ts (Playwright smoke test)
    - src/app/api/project/[projectId]/route.ts (GET project by ID)
    - docker-compose.yml (postgres:15-alpine + redis:7-alpine + app)
    - Dockerfile (node:20-alpine)
    - next.config.mjs (ESM, no X-Frame-Options)
    - tailwind.config.ts (TechArch color tokens)
    - .env.local.example
    - drizzle.config.ts
  modified: []

key-decisions:
  - "Used tsx instead of ts-node for Docker migrate/seed execution — ts-node incompatible with esnext tsconfig module setting"
  - "Tailwind v4 requires @tailwindcss/postcss plugin and @import syntax in globals.css (v3 direct plugin removed)"
  - "timestamptz helper wraps timestamp({ withTimezone: true }) — timestamptz not exported from drizzle-orm/pg-core v0.38"
  - "border color renamed tt-border in tailwind config to avoid collision with Tailwind built-in border utilities"

patterns-established:
  - "Docker Compose: all DB-backed services use healthcheck + depends_on service_healthy"
  - "migrate → seed → serve ordering in app container command"
  - "onConflictDoNothing for all seed inserts"
  - "Drizzle schema: all table exports named in camelCase (projectState, phaseStates, etc.)"

# Metrics
duration: 10min
completed: 2026-08-16
---

# Phase 1 Plan 01: Foundation Summary

**Next.js 15 App Router + PostgreSQL 15 + Redis 7 via Docker Compose, with full 11-table Drizzle ORM schema matching TechArch DDL, partial unique index for single-active-version enforcement, and idempotent EVINV-POC-001 seed**

## Performance

- **Duration:** 10 min
- **Started:** 2026-08-16T16:24:01Z
- **Completed:** 2026-08-16T16:34:09Z
- **Tasks:** 2 completed
- **Files modified:** 20+

## Accomplishments

- Full dependency set installed (Next.js 15, React 19, Drizzle ORM, pg, ioredis, Playwright, Vitest)
- Docker Compose with PostgreSQL 15 + Redis 7 + app container (healthchecks, service_healthy depends_on)
- All 11 Drizzle table definitions matching TechArch §3.3 DDL (projectState, phaseStates, phaseInputs, inputVersions, artifactRegistry, phaseOutputs, checkResults, findings, actions, gateDecisions, auditHistory)
- Partial unique index `idx_input_versions_single_active` WHERE active = true enforces single-active-version at DB level
- Migration SQL generated; idempotent seed inserts EVINV-POC-001 project row + 10 phase_states rows
- `/api/project/[projectId]` endpoint returns correct project data (verified: HTTP 200 + correct JSON)

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js 15 project with Docker Compose** - `1165991` (feat)
2. **Task 2: Drizzle ORM schema, migration, seed, e2e test** - `fb1562a` (feat)

## Files Created/Modified

- `src/db/schema.ts` — 11 Drizzle pgTable definitions with partial unique index
- `src/db/index.ts` — pg Pool + drizzle connection export
- `src/db/migrate.ts` — drizzle-orm/node-postgres migrator
- `src/db/seed.ts` — idempotent EVINV-POC-001 seed with onConflictDoNothing
- `drizzle/0000_low_miracleman.sql` — generated migration SQL
- `e2e/app-boots.spec.ts` — Playwright smoke test for HTTP 200 + project API
- `src/app/api/project/[projectId]/route.ts` — GET project endpoint
- `docker-compose.yml` — postgres:15-alpine + redis:7-alpine + app, migrate→seed→serve
- `Dockerfile` — node:20-alpine
- `next.config.mjs` — ESM config, no X-Frame-Options
- `tailwind.config.ts` — TechArch color tokens
- `postcss.config.mjs` — @tailwindcss/postcss for v4
- `src/app/globals.css` — @import "tailwindcss" v4 syntax + CSS custom properties
- `package.json` — full dependency set
- `.env.local.example` — DATABASE_URL, REDIS_URL, ANTHROPIC_API_KEY, NODE_ENV
- `drizzle.config.ts` — drizzle-kit config pointing at src/db/schema.ts

## Decisions Made

1. **tsx over ts-node**: The tsconfig uses `"module": "esnext"` for Next.js compatibility. ts-node fails with ERR_UNKNOWN_FILE_EXTENSION on this config. `tsx` handles ESM TypeScript seamlessly.

2. **Tailwind v4 migration**: The plan specified Tailwind CSS v4 but used v3-style PostCSS config. v4 requires `@tailwindcss/postcss` plugin and `@import "tailwindcss"` in CSS. Updated both files.

3. **timestamptz helper**: `timestamptz` is not exported from `drizzle-orm/pg-core` v0.38. Created a local helper: `const timestamptz = (name) => timestamp(name, { withTimezone: true, mode: 'string' })`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Docker app container command failed: node src/db/migrate.js not found**
- **Found during:** Plan-level verification (docker compose up)
- **Issue:** Compose command was `node src/db/migrate.js` but files are TypeScript (.ts). No compiled JS exists.
- **Fix:** Changed compose command to `npx tsx src/db/migrate.ts && npx tsx src/db/seed.ts && npm run dev`; added `tsx` devDependency
- **Files modified:** docker-compose.yml, package.json
- **Verification:** docker compose up → migrations complete → seed complete → Next.js ready
- **Committed in:** fb1562a (Task 2 commit)

**2. [Rule 1 - Bug] Tailwind v4 PostCSS plugin renamed — app returned HTTP 500**
- **Found during:** Plan-level verification (curl localhost:3000)
- **Issue:** Tailwind CSS v4 removed `tailwindcss` as a direct PostCSS plugin; requires `@tailwindcss/postcss`. App was returning 500 with CSS compile error.
- **Fix:** Installed `@tailwindcss/postcss`; updated postcss.config.mjs; updated globals.css to use `@import "tailwindcss"` v4 syntax
- **Files modified:** postcss.config.mjs, src/app/globals.css, package.json
- **Verification:** curl http://localhost:3000 → HTTP 200
- **Committed in:** fb1562a (Task 2 commit)

**3. [Rule 1 - Bug] timestamptz not exported from drizzle-orm/pg-core v0.38**
- **Found during:** Task 2 (npx drizzle-kit generate)
- **Issue:** The plan specified `timestamptz` import from `drizzle-orm/pg-core` but it is not exported in v0.38; error: `timestamptz is not a function`
- **Fix:** Added a local helper `const timestamptz = (name) => timestamp(name, { withTimezone: true, mode: 'string' })`. Generated SQL still creates `TIMESTAMP WITH TIME ZONE` columns correctly.
- **Files modified:** src/db/schema.ts
- **Verification:** npx drizzle-kit generate succeeds; migration SQL shows `TIMESTAMP WITH TIME ZONE` columns
- **Committed in:** fb1562a (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (2 blocking, 1 bug)
**Impact on plan:** All auto-fixes essential for correctness and runtime. Plan objective fully achieved.

## Known Stubs

None found — all implementations are complete for this foundation plan.

## Issues Encountered

- Playwright e2e smoke test (e2e/app-boots.spec.ts) was written and committed but not executed — Playwright browsers are not installed in the sandbox. The HTTP 200 and project API endpoint were verified directly via curl. Playwright browser test should be run as part of phase verification.

## User Setup Required

None — no external service configuration required. All services run via Docker Compose with local credentials.

## Next Phase Readiness

- Database schema foundation complete; all 11 tables ready for subsequent plans
- EVINV-POC-001 project row seeded; phase_states rows for phases 0–9 initialized
- `/api/project/[projectId]` endpoint available for Project Overview view (AV-01)
- Ready for Plan 01-02: Phase state machine and lifecycle views

## Self-Check: PASSED

- All key files found on disk (schema.ts, index.ts, migrate.ts, seed.ts, migration SQL, e2e test, docker-compose.yml, next.config.mjs, SUMMARY.md)
- Both commits verified in git log (1165991, fb1562a)
- Build check: `docker compose up -d` → all 3 services healthy → HTTP 200 at localhost:3000 → exit 0
- No blocking stubs found (grep scan clean)

---
*Phase: 01-foundation*
*Completed: 2026-08-16*
