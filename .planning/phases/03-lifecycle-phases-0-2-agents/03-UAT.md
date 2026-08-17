---
status: complete
phase: 03-lifecycle-phases-0-2-agents
source: 03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md
started: 2026-08-17T19:03:46Z
updated: 2026-08-17T19:28:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Phase 0 Workspace — execute agent and view outputs
expected: Navigate to /phase/0. The Phase Workspace shows Phase 0 (Commercial Assessment) with its two required inputs. Inputs show "Awaiting User Input" / "Not Ingested" status. Clicking "Execute Phase" is blocked until inputs are ready (or returns an input-readiness error). After execution succeeds, two compact artifacts appear: "Opportunity Summary" (DOCX) and "Capability-Match and Critical-Gap Matrix" (XLSX), each carrying the SYNTHETIC_DISCLAIMER.
result: issue
reported: "I uploaded the Customer opportunity package and ingested the Capability Opportunity Assessment. The 'Run Phase' button looks active but no action happens after clicking on it."
severity: blocker

### 2. Gate 0 Review — advisory label always visible
expected: Navigate to /gate/0/review (or from the Lifecycle view Gate 0 link). The Gate Review Workspace shows the AI Recommendation panel with the "Advisory Only — Human Decision Required" badge prominently displayed. The recommendation text is present. No gate-pack artifact link exists — all data comes from ProjectState.
result: pass

### 3. Gate 0 — AI actor prohibition (Record Decision blocked for humans without filling the form)
expected: On the Gate 0 Review page, the "Record Decision" button is disabled by default (no radio pre-selected). Selecting a radio (Pass/Conditional Pass/Fail) and entering a reviewer role enables the button. Clicking it shows a confirmation AlertDialog. Clicking Cancel closes the dialog without submitting. The AI actor prohibition means an "ai-agent" role would be rejected 403 — verified by self-check.
result: pass

### 4. Phase 1 Workspace — outputs present after execution
expected: Navigate to /phase/1. The Phase Workspace shows Phase 1 (Proposal & Quoting). After execution, two outputs appear: "Costed Proposal" (DOCX) and "Resource and Milestone Schedule" (XLSX). Both carry the SYNTHETIC_DISCLAIMER. The Gate 1 Review is accessible.
result: issue
reported: "Run phase button doesn't execute the phase so I can't test if outputs are being generated."
severity: blocker

### 5. Phase 2 — seeded testability issue (SI-01) visible in findings
expected: Navigate to /phase/2. Execute Phase 2 (initial run, not revised). The Gate 2 Review at /gate/2/review shows the seeded finding F2-001: "REQ-THERM-004 — non-testable criterion (TBD)" with severity Major and the Seeded badge. The deterministicChecks section shows the testability check result. The Gate 2 Review shows this issue prominently.
result: issue
reported: "Click on Run phase button doesn't execute phase."
severity: blocker

### 6. Phase 2 — correction cycle resolves the seeded issue
expected: After the initial Phase 2 run surfaces the F2-001 issue, executing Phase 2 with the revised flag (isRevised=true) reruns the testability check against the updated requirement criterion. F2-001 is marked VerifiedClosed. The Gate 2 Review shows the finding as resolved. Gate 2 can then record a Pass.
result: skipped
reason: Blocked — phase execution not completing due to XLSX blocker (same root cause as Tests 1, 4, 5). Unit tests confirm isRevised mechanism works; E2E flow cannot be verified until XLSX is fixed.

### 7. Gate Review Workspace — no gate-pack artifact, dynamic from ProjectState
expected: On any Gate Review page (/gate/0/review, /gate/1/review, /gate/2/review), the workspace renders dynamically from the API — no separate "gate pack document" link appears. The inputs, outputs, findings, AI recommendation, and decision history sections are present and populated from live state. Navigation from the Lifecycle view Gate links works correctly.
result: pass

## Summary

total: 7
passed: 3
issues: 3
pending: 0
skipped: 1

## Self-Check

boot: 200
preview_path: 200
routes_probed: 7 ok / 0 failed
compose_health: db=healthy, redis=healthy
e2e: pass (15/15 gate-review.spec.ts passing)
cookie: n/a (no auth in phase 3)
per_test:
  - test: 1
    verdict: advisory
    note: "🤖 Auto-check: /phase/0 → 200. POST /api/phases/0/execute → 409 (INPUTS_NOT_READY — inputs not yet ingested, expected behavior). GET /api/phases/0/outputs → returns phaseState: AwaitingInputs. Routes healthy; execution gate working correctly."
  - test: 2
    verdict: pass
    note: "🤖 Auto-check: GET /api/gates/0/review → 200. aiRecommendation.advisoryLabel = 'Advisory Only — Human Decision Required' present. /gate/0/review page → 200. Gate Review Workspace rendering confirmed by Playwright (15/15 tests pass including advisory-label test)."
  - test: 3
    verdict: pass
    note: "🤖 Auto-check: POST /api/gates/0/decide with X-Reviewer-Role: claude → 403 GATE_AI_PROHIBITED (AI actor rejection confirmed). Playwright tests confirm: radio no pre-selection, button disabled, enabled after radio+role, AlertDialog appears, Cancel closes. 15/15 tests pass."
  - test: 4
    verdict: advisory
    note: "🤖 Auto-check: /phase/1 → 200. /api/phases/1/outputs → 200 (outputs pending execution). Routes healthy. Output content requires execution to verify."
  - test: 5
    verdict: advisory
    note: "🤖 Auto-check: /gate/2/review → 200. seededFindings: 0, deterministicChecks: 0 (Phase 2 not yet executed — expected). FindingsSummaryTable renders with data-testid confirmed by Playwright gate-2-findings test."
  - test: 6
    verdict: skipped (needs human)
    note: "Correction cycle (isRevised=true) requires executing Phase 2 twice — needs human interaction with the phase workspace."
  - test: 7
    verdict: pass
    note: "🤖 Auto-check: /gate/0/review, /gate/1/review, /gate/2/review all → 200. Gate Review links present in Lifecycle view HTML (href=/gate/0/review through /gate/9/review). Phase workspace links to /gate/0/review confirmed. No gate-pack artifact link in API response (only: gateNumber, phaseName, gateState, inputs, outputs, findings, seededFindings, deterministicChecks, openActions, aiRecommendation, decisionHistory). E2E confirms navigation from lifecycle and phase workspace."

## Gaps

- truth: "After uploading inputs and clicking Execute Phase, two compact artifacts appear (Opportunity Summary DOCX + Capability Gap Matrix XLSX)"
  status: failed
  reason: "User reported: 'Run Phase' button looks active but no action happens after clicking on it."
  severity: blocker
  test: 1
  source: self_check
  root_cause: "xlsx 0.18.5 XLSX.writeFile() fails inside Next.js App Router server context — Next.js bundles xlsx without fs access; DOCX (writeFileSync) succeeds but XLSX.writeFile throws 'cannot save file'. The artifact generator needs xlsx added to serverExternalPackages in next.config.mjs so Next.js does not bundle it. Evidence: POST /api/phases/0/execute → 500 {error_code: AGENT_FAILED, message: 'cannot save file .../phase0-capability-gap-matrix.xlsx'} after 65s LLM call (confirming LLM succeeded; opportunity-summary.txt written; XLSX step fails)."
  artifacts:
    - path: "src/server/artifacts/artifactGenerator.ts"
      issue: "XLSX.writeFile fails in Next.js server bundle — xlsx not in serverExternalPackages"
    - path: "next.config.mjs"
      issue: "Missing serverExternalPackages: ['xlsx']"
  missing:
    - "Add serverExternalPackages: ['xlsx'] to next.config.mjs"
    - "Clean duplicate artifact_registry rows from partial successful runs"
  debug_session: ""

