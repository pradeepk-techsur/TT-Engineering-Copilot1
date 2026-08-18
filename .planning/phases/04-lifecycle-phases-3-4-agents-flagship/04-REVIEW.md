---
phase: 4
status: issues_found
blockers: 0
warnings: 2
files_reviewed: 5
files_reviewed_list:
  - src/db/seed.ts
  - src/app/phase/[id]/page.tsx
  - src/components/intake/InputReadinessPanel.tsx
  - src/components/gate/GateReviewWorkspace.tsx
  - e2e/flagship-phase4.spec.ts
reviewed_at: 2026-08-18T14:33:10Z
iteration: 1
---

# Phase 4 Code Review

## BLOCKERs

_None._

## WARNINGs

### W1: `check.checkResultId` is the wrong field name — always `undefined`, React key always falls to array index

- **File:** `src/components/gate/GateReviewWorkspace.tsx:86`
- **Category:** bug (integration — schema field name mismatch)
- **Evidence:**
  The `checkResults` table defines its primary key as:
  ```ts
  // schema.ts line 133
  checkId: uuid('check_id').primaryKey().defaultRandom(),
  ```
  Drizzle serializes this column as the JS camelCase name `checkId` in `db.select()` results.
  The gate-review route returns the raw Drizzle rows unchanged:
  ```ts
  // gates/4/review/route.ts lines 33-34, 51
  const deterministicChecks = await db.select().from(checkResults)
    .where(eq(checkResults.phaseId, GATE as any));
  // ...
  deterministicChecks,   // objects have .checkId, NOT .checkResultId
  ```
  GateReviewWorkspace then maps over these rows:
  ```tsx
  // GateReviewWorkspace.tsx line 86
  key={check.checkResultId ?? idx}
  ```
  `check.checkResultId` is **always `undefined`** (no such field exists); every row silently falls back to `idx` (0, 1, 2, 3…). React will emit a dev-mode key warning on every render of this card, and will reconcile using array indices rather than stable row UUIDs. In the current read-only, append-only display this doesn't cause a visible rendering defect, but if check results are ever sorted or filtered, components may be recycled against wrong rows.
- **Fix direction:** Change `check.checkResultId` to `check.checkId` to use the actual Drizzle-mapped primary-key field. No other change required.

---

### W2: Stale inline comment in `page.tsx` says route handlers exist for "phases 0–2" after the guard was widened to `phaseId <= 4`

- **File:** `src/app/phase/[id]/page.tsx:72-73`
- **Category:** bug (misleading documentation — no runtime impact)
- **Evidence:**
  ```tsx
  {/* Outputs panel — live from /api/phases/{phaseId}/outputs via SWR.
      Route handlers exist for phases 0–2; for later phases show config outputs list. */}
  ```
  After the guard change on line 79 (`phaseId <= 4`), the `OutputsPanel` SWR component is now used for phases 0–4, not 0–2. `/api/phases/3/outputs` and `/api/phases/4/outputs` both exist and are confirmed functional. The comment now contradicts the code: phases 3 and 4 use `OutputsPanel`, while the comment still states "for later phases show config outputs list". The `else` branch (static bullet list) now covers phases 5–9 only. This is a documentation-only defect with zero runtime impact; however, it will mislead the next developer who reads the comment.
- **Fix direction:** Update the comment to read "Route handlers exist for phases 0–4; for phases 5–9 show config outputs list."

---

## Cross-file seams checked

| Seam | Status |
|------|--------|
| `seed.ts` Phase 3 `readinessStatus` values → `phases/3/execute/route.ts` readiness guard (`'Synthetic System Input Ready'` / `'User Input Ready'`) | OK — exact string match |
| `seed.ts` phaseInputs fields → `schema.ts` `phaseInputs` table definition (all NOT NULL columns without defaults provided) | OK — all required fields present; `validationIssues: []` satisfies `jsonb NOT NULL default '[]'` |
| `seed.ts` `onConflictDoNothing()` (no target) → Postgres `ON CONFLICT DO NOTHING` semantics | OK — targets any unique violation; correctly handles `phase_inputs_unique` index on `(projectId, phaseId, inputRole)` |
| `InputReadinessPanel.tsx` `readiness?.internal?.activeVersion` → `/api/phases/[id]/inputs/route.ts` response shape | OK — API returns `{ internal: { activeVersion: versionNumber \| null, ... } }` (line 45); component reads same field |
| `InputReadinessPanel.tsx` POST body `{ isRevised }` → `phases/4/execute/route.ts` `body.isRevised === true` | OK — strict boolean equality check in route; any non-boolean (including undefined from missing body) coerces to `false` safely |
| `GateReviewWorkspace.tsx` `data.deterministicChecks` → `/api/gates/4/review/route.ts` JSON response field `deterministicChecks` | OK — field name matches; raw Drizzle rows returned |
| `GateReviewWorkspace.tsx` `check.checkResultId` → `checkResults` schema primary key `checkId` | **MISMATCH** — see W1; always `undefined`, falls to `idx` |
| `GateReviewWorkspace.tsx` `check.status === 'Pass'` → `checkResults.status` schema values | OK — schema comment shows `'Pass'\|'Fail'\|'Warning'`; badge correctly handles non-Pass with red styling |
| `page.tsx` `phaseId <= 4` guard → `OutputsPanel` → `/api/phases/3/outputs` and `/api/phases/4/outputs` existence | OK — both routes exist and return the expected `{ outputs, phaseId, phaseState, gateState, aiRecommendation }` shape |
| `e2e` `getByTestId('outputs-panel')` → `OutputsPanel.tsx` `data-testid="outputs-panel"` | OK — testid present on all three render branches (error, loading, data) |
| `e2e` POST `/api/phases/3/execute` not-409 assertion → Phase 3 execute route readiness guard + seed rows | OK — seed provides `readinessStatus` matching guard strings; CI without LLM key returns 503 (≠ 409) |
| `e2e` `getByRole('heading', { name: /Gate 4\|CDR/i })` → `/gate/4/review` page | OK — page renders `<h1>Gate 4 Review Workspace</h1>` (static SSR, always visible before SWR loads) |
| `e2e` `getByTestId('check-result-row-0')` → `GateReviewWorkspace.tsx` `data-testid={\`check-result-row-${idx}\`}` | OK — testid format matches; conditional block correctly only asserted when `cardVisible` is true |
