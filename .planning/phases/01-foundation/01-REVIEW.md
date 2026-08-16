---
phase: 1
status: issues_found
blockers: 1
warnings: 1
files_reviewed: 5
files_reviewed_list:
  - src/db/seed.ts
  - src/app/findings-actions/page.tsx
  - src/app/audit/page.tsx
  - src/app/phase/[id]/page.tsx
  - e2e/foundation-views.spec.ts
reviewed_at: 2026-08-16T21:51:19Z
iteration: 1
---

# Phase 1 Code Review

## BLOCKERs

### B1: `seed.ts` REVOKE executes under application user (`tt_copilot`), not a dedicated superuser — security guarantee is semantically vacuous because `app_role` is never used for runtime DB connections

- **File:** `src/db/seed.ts:44–59`
- **Category:** security
- **Evidence:**
  The seed creates `app_role` (line 48–51) then immediately revokes `UPDATE, DELETE ON audit_history FROM app_role` (line 58). However, two independent problems undermine the security claim:

  1. **`app_role` is never assigned to any runtime connection.** The application's `DATABASE_URL` always connects as `tt_copilot` (docker-compose lines 7 & 36; `.env.local` line 1). There is no `SET ROLE app_role` anywhere in the codebase (`grep` confirms zero hits). Because no session ever runs as `app_role`, revoking privileges from it has zero effect on the actual runtime access model. The append-only guarantee claimed for `audit_history` is NOT enforced at the database-permission layer for the user that actually touches the table.

  2. **REVOKE on a privilege that was never granted is a silent no-op.** PostgreSQL issues a `WARNING: no privileges were granted for "audit_history"` (not an error) — the seed continues, no exception is raised — but the statement achieves nothing. `audit_history` has no explicit GRANTs in the migration (`drizzle/0000_low_miracleman.sql` contains zero `GRANT`/`REVOKE` statements), and PostgreSQL's default is that non-owner roles have no table privileges. Revoking a non-existent privilege is a documentation artifact, not an enforcement action.

  **Concrete failure scenario:** A future developer adds a direct `db.execute(sql\`DELETE FROM audit_history …\`)` using the existing pool (which runs as `tt_copilot` — the table *owner* — not `app_role`). The REVOKE does not block this at all. The plan's must-have truth "audit_history UPDATE/DELETE permissions are revoked from app role" is satisfied *textually* but not *operationally*.

- **Fix direction:** Either (a) switch the runtime application's DB connection to `app_role` (grant it only `SELECT, INSERT` on `audit_history`, then revoke `UPDATE, DELETE`), so the restriction actually applies to the queries the app issues; or (b) enforce append-only via a `BEFORE UPDATE OR DELETE` trigger on `audit_history` that raises an exception regardless of the caller's role — this makes the protection role-agnostic. The current REVOKE-only approach should be supplemented with at least a trigger or a runtime role assignment to be meaningful.

**Resolution:** fixed (94bbb6c) — Added `CREATE OR REPLACE FUNCTION audit_history_immutable()` (SQLSTATE `45000`) and `BEFORE UPDATE OR DELETE` trigger `trg_audit_history_immutable` on `audit_history` in `src/db/seed.ts`. The original REVOKE is retained. The trigger is role-agnostic and fires regardless of connection user, closing the gap for the `tt_copilot` owner-role attack surface. `tsc --noEmit` clean; `npm run build` exits 0; `npm test -- --run` 6/6.

---

## WARNINGs

### W1: Non-numeric `/phase/[id]` URL renders "Phase NaN: Phase NaN" in both `<h1>` and Breadcrumb, and emits a `/phase/NaN` href link — `dynamicParams` is not restricted to the pre-generated 0–9 range

- **File:** `src/app/phase/[id]/page.tsx:10–15`
- **Category:** bug
- **Evidence:**
  `parseInt(id, 10)` returns `NaN` for any non-numeric `id` (e.g., `/phase/abc`). Because `dynamicParams` is not explicitly exported as `false`, Next.js 15 defaults to `dynamicParams = true`, so any path matching `/phase/[id]` — including `/phase/abc` or `/phase/999` — is server-rendered at runtime rather than returning a 404.

  The `NaN` value then propagates through the entire render tree:
  - `PHASE_CONFIG_MAP[NaN]` → `undefined` → `phaseName = "Phase NaN"` (fallback)
  - `<h1>Phase NaN: Phase NaN</h1>` renders in the page body
  - `<AppShell phaseId={NaN}>` → `Breadcrumb phaseId={NaN}` → `phaseId !== undefined` is **true** (because `NaN !== undefined`) → breadcrumb segment `{ label: 'Phase NaN: Phase NaN', href: '/phase/NaN' }` is rendered as a clickable link pointing to `/phase/NaN`

  The plan's threat model T-01-13 documents and accepts this behavior, but it misstates the result as "gracefully falls back to `Phase NaN` label" without noting the `/phase/NaN` orphan link emitted in the breadcrumb. No crash occurs; the issue is a degraded-UI path that is unreachable through the sidebar (which only links `/phase/0`–`/phase/9`) but reachable by direct URL entry.

  **Simplest fix:** Add `export const dynamicParams = false;` to `src/app/phase/[id]/page.tsx`. Next.js will then return a 404 for any `id` not produced by `generateStaticParams`, eliminating the NaN render path entirely with no additional logic required.

**Resolution:** fixed (625d125) — Added `export const dynamicParams = false;` at line 4 of `src/app/phase/[id]/page.tsx`. Build confirms route changed from `ƒ` (Dynamic) to `●` (SSG), meaning only pre-generated paths `/phase/0`–`/phase/9` are served; all others return 404. `tsc --noEmit` clean; `npm run build` exits 0; `npm test -- --run` 6/6.

---

## Cross-file seams checked

| Seam | Result |
|---|---|
| `AppShell` named export in `AppShell.tsx` ↔ `import { AppShell }` in all three stub pages | OK — export exists, named correctly |
| `AppShell` `phaseId?: number` prop ↔ `phaseId={phaseId}` call in `phase/[id]/page.tsx` | OK — type matches |
| `PHASE_CONFIG_MAP` named export in `phaseConfig.ts` ↔ `import { PHASE_CONFIG_MAP }` in `phase/[id]/page.tsx` | OK — export exists, shape matches usage |
| `Breadcrumb` `aria-label="Breadcrumb"` ↔ e2e `getByRole('navigation', { name: 'Breadcrumb' })` | OK — exact match |
| AppShell header text `"TT Engineering Copilot"` ↔ e2e `getByText('TT Engineering Copilot')` | OK — exact match |
| `SyntheticBadge` renders `"SYNTHETIC POC"` text ↔ e2e `getByText('SYNTHETIC POC')` | OK — exact match |
| `audit_history` table defined in migration SQL ↔ `REVOKE … ON audit_history` in seed.ts | OK — table exists in migration; REVOKE references correct name |
| `seed.ts` DB connection role (`tt_copilot` = `POSTGRES_USER`) ↔ plan claim "run as superuser" | OK for current Docker setup (`POSTGRES_USER` is superuser in PostgreSQL Docker image) — see B1 for semantic limitation |
| `generateStaticParams` returns ids `"0"`–`"9"` ↔ sidebar `PHASE_SHORTCUTS` links `/phase/0`–`/phase/9` | OK — ranges match; `dynamicParams` gap noted in W1 |
| e2e `sidebar links render app shell` test paths `['/findings-actions', '/audit', '/phase/0']` ↔ pages created in this diff | OK — all three routes exist |
| e2e `/phase/0 breadcrumb shows Phase 0 segment` ↔ `Breadcrumb` label `Phase 0: Commercial Assessment` matching `/Phase 0/i` | OK — regex matches label |
