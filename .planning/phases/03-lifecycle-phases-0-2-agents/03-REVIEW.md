---
phase: 3
status: issues_found
blockers: 1
warnings: 2
files_reviewed: 3
files_reviewed_list:
  - src/components/phase/OutputsPanel.tsx
  - src/app/phase/[id]/page.tsx
  - e2e/gate-review.spec.ts
reviewed_at: 2026-08-18T03:10:18Z
iteration: 1
---

# Phase 3 Code Review — Gap Closure Wave 03-06

> **Scope:** Three files produced by plan 03-06 only. Prior-iteration findings (W1/W2/W3 against
> `InputReadinessPanel.tsx` and `artifactGenerator.ts`) are out of scope for this iteration.

---

## BLOCKERs

### B1: Download link points to `/api/artifacts/{id}/download` — route does not exist; clicking it returns 404

- **File:** `src/components/phase/OutputsPanel.tsx` line 77
- **Category:** integration
- **Evidence:**
  ```tsx
  <a href={`/api/artifacts/${output.artifactId}/download`} …>
    Download
  </a>
  ```
  A full scan of `src/app/api/` shows no route anywhere under `artifacts/`. The directory
  `src/app/api/artifacts/` does not exist. The artifact files are stored at paths recorded in
  `artifact_registry.storage_uri` (local filesystem paths such as
  `public/artifacts/phase0-…xlsx`), and the schema's `storageUri` column is never surfaced
  through the `/api/phases/{id}/outputs` response — the outputs route only returns
  `PhaseOutput` rows which do not carry `storageUri`. A user who sees a completed output and
  clicks "Download" will hit a Next.js 404. This is the core deliverable of the plan (artifact
  download access for human approval) so it is a BLOCKER: the happy path for `phaseState ===
  'AwaitingGate'` is broken for every user.

  **Concrete failing scenario:** Phase 0 runs successfully. `output.artifactId` is a valid UUID
  (`bidNoBidAgent.ts` inserts a real `artifact_id` into `phase_outputs`). The component renders
  `<a href="/api/artifacts/abc-123/download">Download</a>`. Browser follows the link → Next.js
  finds no matching route → 404.

- **Fix direction:** Either (a) create `src/app/api/artifacts/[artifactId]/download/route.ts`
  that looks up `storageUri` from `artifact_registry` and streams the file, or (b) expose
  `storageUri` through the outputs API and build a direct `/public/…` href. Option (a) is more
  correct for access-control reasons; option (b) is a one-line API + component change.

**Resolution:** fixed (75a57a7) — created `src/app/api/artifacts/[artifactId]/download/route.ts`; looks up `storageUri` from `artifact_registry` via drizzle, validates UUID format + path-traversal guard (`resolved.startsWith(cwd+sep)`), streams file with correct `Content-Type`/`Content-Disposition` headers. `tsc --noEmit` clean.

---

## WARNINGs

### W1: SWR error state silently ignored — network/API failures render as stuck "Loading outputs…"

- **File:** `src/components/phase/OutputsPanel.tsx` lines 34–48
- **Category:** bug
- **Evidence:**
  ```tsx
  const { data } = useSWR<OutputsApiResponse>(
    `/api/phases/${phaseId}/outputs`,
    fetcher,
    { refreshInterval: 3000 }
  );

  if (!data) {
    return (
      <div data-testid="outputs-panel">
        <div data-testid="outputs-loading">Loading outputs…</div>
      </div>
    );
  }
  ```
  `useSWR` returns `{ data, error }`. The component only destructures `data` and treats
  `!data` as the loading state. When the fetch fails (DB down, API 500, network error), SWR
  sets `error` to the thrown value and `data` remains `undefined`. The component will forever
  display "Loading outputs…" with no error message — the user has no indication that anything
  is wrong and cannot distinguish a loading state from a broken state. Compare with the mature
  `InputReadinessPanel` which also swallows errors (W1 from the prior review), but at least
  has SWR interval retries; here the polling continues silently. For phases 3–9, where the
  `/api/phases/{id}/outputs` route returns a Next.js 404 (no route exists — see B1 context),
  every phase workspace above phase 2 will be permanently stuck in "Loading outputs…".

- **Fix direction:** Destructure `error` from `useSWR` and render a distinct error state
  (`data-testid="outputs-error"`) when `!data && error`. A minimal message ("Could not load
  outputs") is sufficient.

**Resolution:** fixed (cbef4c0) — destructured `error` from `useSWR`; added `if (!data && error)` branch that renders `data-testid="outputs-error"` with "Could not load outputs" message before the loading branch. `tsc --noEmit` clean.

### W2: `OutputsPanel` mounted for phases 3–9, but `/api/phases/{id}/outputs` routes only exist for phases 0–2; all other phases silently hang in loading state

- **File:** `src/app/phase/[id]/page.tsx` line 78; `src/components/phase/OutputsPanel.tsx` line 35
- **Category:** integration
- **Evidence:**
  `generateStaticParams()` (page.tsx line 87) emits phase IDs 0–9. `dynamicParams = false` is
  set, so all ten routes are pre-rendered. The `OutputsPanel` is unconditionally rendered for
  all of them (page.tsx line 78). However, the SWR fetch target
  `/api/phases/${phaseId}/outputs` only has concrete route handlers at
  `src/app/api/phases/0/outputs/route.ts`, `…/1/outputs/…`, and `…/2/outputs/…` (confirmed by
  directory listing — `src/app/api/phases/` contains only `0`, `1`, `2`, and `[id]`; the `[id]`
  dynamic segment has no `outputs` sub-route). Navigating to `/phase/3` through `/phase/9` will
  cause the `OutputsPanel` to fetch `/api/phases/3/outputs` … `/api/phases/9/outputs`, all of
  which return 404. Per W1, the 404 is silently swallowed and the panel shows "Loading
  outputs…" indefinitely. While phases 3–9 are intentionally not part of this wave's execution
  scope, the page currently renders them as broken rather than gracefully absent.

  The 03-06-SUMMARY.md acknowledges routes exist only for phases 0–2 (comment in E2E spec line
  184–186), but the component itself has no guard.

- **Fix direction:** Either (a) add a guard in `OutputsPanel` that renders "Not yet available
  for this phase" when `phaseId > 2` (or when the fetched URL returns 404), or (b) wrap the
  `<OutputsPanel>` in `page.tsx` with a conditional `{phaseId <= 2 && <OutputsPanel … />}`.
  The E2E tests for phases 1 and 2 (spec lines 209–217) pass only because those routes exist;
  no test covers phases 3–9.

**Resolution:** fixed (9ae5eb5) — wrapped `<OutputsPanel>` in `page.tsx` with `{phaseId <= 2 ? <OutputsPanel … /> : <p>Output tracking not yet available for this phase.</p>}`; phases 0–2 behaviour unchanged, phases 3–9 render graceful message. `tsc --noEmit` clean.

---

## Cross-file seams checked

| Seam | Status |
|---|---|
| `OutputsPanel` import in `page.tsx` → `src/components/phase/OutputsPanel.tsx` export | OK — named export `OutputsPanel` matches import; TypeScript resolves cleanly (`tsc --noEmit` exits 0) |
| `OutputsPanel` prop `phaseId: number` ↔ caller `phaseId={phaseId}` (page.tsx line 78) | OK — both are `number`; `parseInt(id, 10)` in page.tsx is correctly typed |
| `OutputsApiResponse.outputs` shape ↔ `/api/phases/{id}/outputs` route response | OK — routes return `{ phaseId, phaseState, gateState, aiRecommendation, outputs: PhaseOutput[] }`; `PhaseOutput` interface matches `phase_outputs` schema columns exactly |
| `output.artifactId` (`string \| null`) used as download URL segment | FINDING B1 — no download route exists |
| SWR poll URL `/api/phases/${phaseId}/outputs` ↔ existing routes | FINDING W2 — only phases 0/1/2 have routes; phases 3–9 return 404 |
| `data-testid="outputs-panel"` in both loading and loaded states | OK — both branches of `OutputsPanel` render `data-testid="outputs-panel"` so E2E `getByTestId('outputs-panel')` resolves regardless of state |
| `data-testid="outputs-pending"` ↔ E2E assertion `[data-testid="outputs-pending"]` | OK — testid present on span at line 56; E2E locator at spec lines 159, 169 matches |
| `data-testid="output-row"` ↔ E2E `page.getByTestId('output-row')` | OK — testid on div at line 64; spec line 206 matches |
| `data-testid="outputs-loading"` ↔ E2E locator `[data-testid="outputs-loading"]` | OK — testid at line 43; spec line 159 includes it in OR locator |
| E2E `test.skip(true, reason)` inside test body | OK — `testInfo.skip(condition, description)` overload is valid in Playwright 1.62; condition `true` hard-skips immediately |
| E2E test navigates `/phase/1` and `/phase/2` (spec lines 209–217) — routes exist | OK — `generateStaticParams` emits all 0–9; `src/app/api/phases/1/outputs` and `…/2/outputs` routes exist |
| `/api/artifacts/{artifactId}/download` referenced in `OutputsPanel` | FINDING B1 — route missing from `src/app/api/` |
