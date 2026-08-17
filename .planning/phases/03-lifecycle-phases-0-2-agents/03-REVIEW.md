---
phase: 3
status: issues_found
blockers: 0
warnings: 3
files_reviewed: 4
files_reviewed_list:
  - next.config.mjs
  - src/server/artifacts/artifactGenerator.ts
  - src/components/intake/InputReadinessPanel.tsx
  - e2e/gate-review.spec.ts
reviewed_at: 2026-08-17T20:00:24Z
iteration: 1
---

# Phase 3 Code Review (Plan 03-04)

## BLOCKERs

_None._

---

## WARNINGs

### W1: Double `refresh()` on success path — redundant SWR revalidation pair

- **File:** `src/components/intake/InputReadinessPanel.tsx` lines 43–50
- **Category:** bug (logic error — not a crash, but unintended duplicate call)
- **Evidence:**
  ```ts
  } else {
    // Revalidate readiness and status after successful execution
    refresh();          // ← call #1 (success branch)
  }
  } catch (err: any) { … }
  } finally {
    setIsExecuting(false);
    refresh();          // ← call #2 (always runs, including after success)
  }
  ```
  On a successful POST, both the `else` branch and the `finally` block call `refresh()`, which calls `mutateReadiness()` + `mutateStatus()` — resulting in four SWR `mutate()` calls where two are intended. SWR deduplicates concurrent mutations per key (the second mutate while the first fetch is in-flight is a no-op), so the functional impact is a single wasted pair of GET requests per successful execution. The intent was clearly to call `refresh()` on both success and error paths via `finally` alone, making the `else` branch call redundant. The fix is to remove `refresh()` from the `else` branch and rely solely on the `finally` call.

### W2: File overwrite precedes DB delete — stale registry window on delete-failure

- **File:** `src/server/artifacts/artifactGenerator.ts` lines 48–59 (`generateXlsx`), lines 102–112 (`generateDocx`)
- **Category:** bug (ordering issue on failure path)
- **Evidence:**
  ```ts
  writeFileSync(storagePath, xlsxBuffer);   // ← disk overwritten
  await db.delete(artifactRegistry)         // ← if this throws...
    .where(and(…));
  await db.insert(artifactRegistry)…        // ← never reached
  ```
  If the `db.delete()` throws (transient DB error), the file on disk has already been silently replaced with new content, but the **old** `artifact_registry` row still exists and its `fileSizeBytes` / `rowCount` metadata now describes the previous run's data rather than what is on disk. Any reader of the artifact between this failure and the next successful run would observe metadata inconsistency. The safer ordering is: (1) delete stale DB rows, (2) write file, (3) insert new DB row — so a delete failure leaves the filesystem untouched and retrying is clean.

### W3: `intakeBehavior` hardcoded as `'UP'` in `artifactRegistry` insert for agent-generated artifacts

- **File:** `src/server/artifacts/artifactGenerator.ts` lines 67, 120
- **Category:** bug (incorrect data stored in DB)
- **Evidence:**
  ```ts
  // generateXlsx, line 67:
  intakeBehavior: 'UP',
  // generateDocx, line 120:
  intakeBehavior: 'UP',
  ```
  The `artifact_registry.intake_behavior` column documents what intake channel produced the artifact. For all three phases in scope (0, 1, 2), the internal input is `SI` (Synthetic Ingestion), not `UP` (User Upload). Agent-generated output artifacts are not tied to a single intake behavior, and hardcoding `'UP'` is inaccurate. The column is currently not filtered on by any API route that reads `AgentGenerated` rows (confirmed: the gate review routes only read `intakeBehavior` from `phase_inputs`, not `artifact_registry`), so there is no functional regression today. However, if a future query filters `artifact_registry` by `intakeBehavior = 'UP'` expecting only user-uploaded artifacts, agent-generated rows would be incorrectly included. The correct value for agent-generated artifacts is either `'AgentGenerated'` (distinct enum value) or the function should accept `intakeBehavior` as a parameter.

---

## Cross-file seams checked

| Seam | Status |
|---|---|
| `InputReadinessPanel.tsx` → `POST /api/phases/{phaseId}/execute` | OK — phaseId is `number` (typed prop, validated in page), URL template produces `/api/phases/0/execute` etc; `dynamicParams=false` + `generateStaticParams` means only 0–9 reach the component |
| `phaseId` injection vector from browser to API | OK — phaseId is `number` from `parseInt` in SSR page; no user-controlled string is interpolated into the URL |
| Phase 0/1/2 execute routes → `generateXlsx` / `generateDocx` signatures | OK — callers pass correct `(rows, fileName, phaseId, gateId, generatedBy)` |
| `artifactRegistry` schema `phaseId`/`gateId` columns (`smallint`) vs `number` literal casts | OK — `as any` casts are present throughout; TypeScript checks pass (`npx tsc --noEmit` exits 0) |
| `serverExternalPackages: ['xlsx']` syntax in `next.config.mjs` | OK — correct Next.js 14/15 App Router key; `fileValidator.ts` also imports xlsx and runs server-side only, so the single entry covers all usages |
| `XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })` return type | OK — verified at runtime returns a real `Buffer`; `writeFileSync` accepts `Buffer` natively |
| `fileSizeBytes` is now `xlsxBuffer.length` (bytes) | OK — schema column is `bigint(mode:'number')` which accepts a JS number; Buffer.length returns byte count |
| `generateDocx` `fileSizeBytes: Buffer.byteLength(fullContent)` | OK — unchanged from pre-diff; correct UTF-8 byte length |
| `e2e/gate-review.spec.ts` new test navigates `/phase/0` | OK — page exists at `src/app/phase/[id]/page.tsx` with static params; `run-phase-button` testid is present in component |
| Idempotent delete WHERE clause columns vs schema | OK — `phaseId`, `gateId`, `source`, `generatedBy`, `artifactType` all exist in `artifact_registry` schema (lines 94–110 of schema.ts) |
| `rows` truncation vs `rowCount` stored in DB | OK — `rows` is reassigned with `slice(0,10)` before use; `rows.length` at insert time reflects post-truncation count |
| `executeError` fallback chain `data.message ?? data.error_code ?? 'Execution failed'` | OK — Phase 2 route's 409 only returns `error_code` (no `message`); fallback chain handles it correctly |
