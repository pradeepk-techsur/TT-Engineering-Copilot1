---
phase: 3
status: clean
blockers: 0
warnings: 0
files_reviewed: 4
files_reviewed_list:
  - src/components/phase/OutputsPanel.tsx
  - src/app/phase/[id]/page.tsx
  - src/app/api/artifacts/[artifactId]/download/route.ts
  - e2e/gate-review.spec.ts
reviewed_at: 2026-08-18T04:45:00Z
iteration: 2
---

# Phase 3 Code Review — Iteration 2 (Re-review after fixer commits)

> **Scope:** Four files: the three files from iteration 1 plus the newly created
> `src/app/api/artifacts/[artifactId]/download/route.ts` (B1 fix). Verified that
> all three iteration-1 findings (B1, W1, W2) are correctly resolved and that no
> regressions were introduced by the fixes.

---

## Previous findings resolution

### B1: Download route missing → `GET /api/artifacts/[artifactId]/download` returning 404
**Commit:** `75a57a7`  
**Status: FIXED ✓**

The route was created at `src/app/api/artifacts/[artifactId]/download/route.ts`. Full verification:

- **UUID format guard** (`/^[0-9a-f-]{36}$/i`): correct — 36-character constraint blocks path separators and oversized inputs; non-UUID hex strings (e.g. 36 dashes) pass the regex but are rejected by Postgres's UUID type at the `eq()` query, returning 404. Not a security gap.
- **DB lookup**: uses `eq(artifactRegistry.artifactId, artifactId)` with Drizzle — correct column name matching schema (`artifact_id` PK mapped to `artifactId`). Destructures `storageUri`, `artifactName`, `artifactType` — all three columns exist and are `notNull` in schema.
- **Path traversal guard**: `resolved.startsWith(cwd + path.sep)` — tested with injected paths; `path.resolve()` canonicalises symlink-lookalike strings before the check. Guard is sound. `storageUri` is written by `artifactGenerator.ts` as `path.join(process.cwd(), 'outputs', projectId, 'phaseN', fileName)` — always starts inside cwd, so legitimate artifacts pass the guard correctly.
- **`existsSync` check**: prevents streaming non-existent files; returns 404.
- **`statSync` for `Content-Length`**: called after `existsSync`, same path — consistent.
- **`Readable.toWeb()`**: available in Node 20 (project uses v20.20.2) ✓.
- **MIME resolution**: falls back from file extension → artifact type → `application/octet-stream`. Handles `.txt` POC stand-ins for DOCX correctly.
- **`Content-Disposition`**: `attachment; filename="${dlName}"` — `artifactName` is authored by `artifactGenerator.ts` (hardcoded strings like `'phase0-capability-gap-matrix'`), not user-supplied, so CRLF header injection is not a realistic threat.
- **`Cache-Control: no-store`**: appropriate for sensitive generated artifacts.
- **No auth**: consistent with the rest of the codebase — no route in `src/app/api/` uses session, cookie, or middleware auth. No new security regression introduced by this route.
- **Next.js 15 params-as-Promise API**: `{ params }: { params: Promise<{ artifactId: string }> }` with `await params` — correct for Next.js 15.
- **`tsc --noEmit`**: exits clean (0 errors).

---

### W1: SWR error state silently ignored → stuck "Loading outputs…"
**Commit:** `cbef4c0`  
**Status: FIXED ✓**

`error` is now destructured from `useSWR` (line 34). The new branch at line 40:

```tsx
if (!data && error) {
  return (
    <div data-testid="outputs-panel">
      <div data-testid="outputs-error" className="text-sm text-red-400 py-2">
        Could not load outputs. Please try again later.
      </div>
    </div>
  );
}
```

- Condition `!data && error` is correct: fires only when fetch has failed and no data is available. Does not interfere with SWR's stale-while-revalidate scenario (where both `data` and `error` co-exist — that case renders the last-good data, which is correct).
- The subsequent `if (!data)` loading branch is unreachable when error is set, maintaining correct loading-vs-error distinction.
- `data-testid="outputs-error"` present for E2E targeting if needed.
- The `fetcher` (`fetch(url).then(r => r.json())`) does not throw on non-2xx responses — it parses the JSON body and sets `data` to the error payload. However, for phases 0–2 (the only phases where `OutputsPanel` is now mounted after the W2 fix), the routes always return 200 + valid JSON; this non-throwing-fetcher pattern is therefore safe within the guarded scope.

---

### W2: `OutputsPanel` mounted unconditionally for phases 3–9, causing infinite 404 loading state
**Commit:** `9ae5eb5`  
**Status: FIXED ✓**

`page.tsx` (lines 80–86) now guards `OutputsPanel` behind `phaseId <= 2`:

```tsx
{phaseId <= 2 ? (
  <OutputsPanel phaseId={phaseId} />
) : (
  <p className="text-sm text-[var(--color-text-muted)] py-2">
    Output tracking not yet available for this phase.
  </p>
)}
```

- `phaseId` is `parseInt(id, 10)` where `id` comes from `generateStaticParams()` emitting `'0'`–`'9'` — correctly typed `number`, comparison is exact.
- Phases 0, 1, 2: `OutputsPanel` mounted and SWR polls the existing routes.
- Phases 3–9: graceful static message rendered; no SWR poll, no 404 hang.
- E2E tests at lines 209–217 (`/phase/1`, `/phase/2`) still see `outputs-panel` testid ✓.
- No regressions to any other test.

---

## BLOCKERs

*(none)*

---

## WARNINGs

*(none)*

---

## Cross-file seams checked (iteration 2)

| Seam | Status |
|---|---|
| `OutputsPanel` download link `href=/api/artifacts/${output.artifactId}/download` ↔ new route `src/app/api/artifacts/[artifactId]/download/route.ts` | **OK** — route now exists; URL segments match Next.js dynamic segment `[artifactId]` |
| `artifactRegistry.artifactId` column queried in download route ↔ schema `artifact_id` PK | **OK** — Drizzle mapping confirmed in `src/db/schema.ts` line 92 |
| `artifactRegistry.storageUri` ↔ `storageUri: text('storage_uri').notNull()` | **OK** — column exists, notNull, correct name |
| `storageUri` format from `artifactGenerator.ts` ↔ path traversal guard in download route | **OK** — generator always writes `path.join(cwd, 'outputs', ...)` which passes the `startsWith(cwd + sep)` check |
| `phaseId <= 2` guard in `page.tsx` ↔ existing routes at `src/app/api/phases/0/`, `/1/`, `/2/` | **OK** — guard exactly matches the set of phases with route handlers |
| `useSWR` `{ data, error }` destructuring ↔ SWR v2 API | **OK** — SWR v2 returns `{ data, error, isLoading, … }`; both fields are valid |
| E2E spec `data-testid="outputs-panel"` locator ↔ `OutputsPanel` renders the testid in all branches (error, loading, data) | **OK** — all three return branches wrap content in `<div data-testid="outputs-panel">` |
| `Readable.toWeb()` ↔ Node.js v20.20.2 | **OK** — API available since Node 17; project runs Node 20 |
| `params: Promise<{ artifactId: string }>` ↔ Next.js 15 route handler API | **OK** — Next.js 15 uses async params; `await params` pattern is correct |
| `tsc --noEmit` across all four files | **OK** — exits 0, no type errors |
