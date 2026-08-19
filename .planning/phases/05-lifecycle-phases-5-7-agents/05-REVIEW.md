---
phase: 5
status: issues_found
blockers: 0
warnings: 2
files_reviewed: 6
files_reviewed_list:
  - src/components/intake/SiIntakeCard.tsx
  - src/components/intake/InputReadinessPanel.tsx
  - e2e/phases-5-7.spec.ts
  - e2e/intake-framework.spec.ts
  - src/app/api/phases/[id]/inputs/[type]/ingest-revised/route.ts
  - src/components/phase/OutputsPanel.tsx
reviewed_at: 2026-08-19T02:17:34Z
iteration: 1
---

# Phase 5 Code Review (Plan 05-05)

## BLOCKERs

None.

## WARNINGs

### W1: `handleIngestRevised` calls `res.json()` unconditionally before checking `res.ok` — non-JSON error responses silently downgrade to a generic toast

- **File:** `src/components/intake/SiIntakeCard.tsx:72–74`
- **Category:** bug (degraded UX on error path)
- **Evidence:**

  ```tsx
  const data = await res.json();          // throws on HTML/plain-text error body
  if (!res.ok) {
    toast.error(data.message ?? 'Revised ingestion failed.');
  }
  ```

  If the `ingest-revised` route returns a non-JSON body (e.g. Next.js HTML error page, reverse-proxy timeout), `res.json()` throws, the specific server error message is lost, and the user sees only the generic catch-block toast `'Revised ingestion failed. Please try again.'` rather than the structured API error. `handleRunPhase` in the same component tree (`InputReadinessPanel.tsx` lines 49–53) guards explicitly with a content-type check before calling `.json()`. `handleIngest` in the same file has the same unchecked pattern, so this is a pre-existing issue on both paths — but was just re-introduced in `handleIngestRevised` rather than being fixed.

  **Concrete failure:** Server returns `502` with an HTML body → `res.json()` throws a SyntaxError → `data.message` is never reached → generic toast only; user cannot diagnose the actual error.

- **Fix direction:** Mirror the guard in `handleRunPhase`: check `res.headers.get('content-type')?.includes('application/json')` before calling `res.json()`, and set a specific error message for non-JSON responses.

---

### W2: `ingest-revised` route omits `phaseId` range validation present in the sibling initial-ingest routes

- **File:** `src/app/api/phases/[id]/inputs/[type]/ingest-revised/route.ts:13`
- **Category:** bug (incorrect HTTP status on invalid input)
- **Evidence:**

  ```ts
  const phaseId = parseInt(id);   // NaN if `id` is non-numeric — no guard follows
  // contrast: initial ingest routes (external/ingest/route.ts:10, internal/ingest/route.ts:10)
  // if (isNaN(phaseId) || phaseId < 0 || phaseId > 9) return 400
  ```

  With a crafted URL such as `POST /api/phases/abc/inputs/internal/ingest-revised`, `parseInt('abc')` returns `NaN`. `handleSampleIngest(NaN, …)` looks up `PHASE_CONFIG_MAP[NaN]` → `undefined` → throws `Unknown phaseId: NaN`. The route's `catch` block returns this as a **500**, whereas a 400 Bad Request would be semantically correct. No DB corruption occurs because the error is thrown before any DB write. The sibling routes both return 400 for this case.

  **Concrete failure:** `POST /api/phases/abc/inputs/internal/ingest-revised` → 500 instead of 400. The `inputRole` cast (`type as 'external' | 'internal'`) is also unchecked at runtime; a value like `'foo'` would pass to `handleSampleIngest`, which then throws `INTAKE_BEHAVIOR_MISMATCH` (500) rather than a 400.

- **Fix direction:** Add `if (isNaN(phaseId) || phaseId < 0 || phaseId > 9) return NextResponse.json({ error_code: 'INVALID_PHASE' }, { status: 400 });` immediately after `parseInt`, matching the existing ingest route pattern.

---

## Cross-file seams checked

- **`SiIntakeCard` `allowRevise` prop ↔ `InputReadinessPanel`:** OK — prop is optional (`allowRevise?: boolean`), wired as `readiness.{role}?.isReady === true` for both SI card branches. `UpIntakeCard` branches do not receive `allowRevise` (correct — `UpIntakeCard` has no such prop).
- **`SiIntakeCard.handleIngestRevised` URL ↔ backend route path:** OK — client calls `/api/phases/${phaseId}/inputs/${inputRole}/ingest-revised` where `inputRole ∈ {'external','internal'}`; backend route is at `[id]/inputs/[type]/ingest-revised/`. Next.js 15 static-segment priority for `external/` and `internal/` does not shadow `[type]/ingest-revised` because those static folders contain only `ingest/` and `upload/` sub-routes — not `ingest-revised`. The `[type]` segment resolves correctly for both roles.
- **`SiIntakeCard` POST body shape ↔ `ingest-revised` route body parsing:** OK — client sends `{ confirm_viewed: true }`, route reads `body.confirm_viewed === true` (strict equality). Shapes match.
- **`OutputsPanel` `data-testid="outputs-pending"` ↔ E2E `getByTestId('outputs-pending')`:** OK — `outputs-pending` testid is rendered inside `outputs-panel` only when `outputs.length === 0` (loaded state, empty array). E2E tests assert both testids visible. The loading state uses `outputs-loading` (a distinct testid), so the test cannot accidentally pass while the panel is still fetching.
- **`handleIngestRevised` → `onSuccess()` ↔ SWR revalidation:** OK — `onSuccess` is bound to `refresh` in `InputReadinessPanel`, which calls both `mutateReadiness()` and `mutateStatus()`, triggering re-fetch of input readiness data after revision.
- **`ingest-revised` route response shape ↔ client consumption:** OK — client checks only `res.ok` and `data.message` on error; does not consume `affectedScope` or `label` from the success body. No shape mismatch.
