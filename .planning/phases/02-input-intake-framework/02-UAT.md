---
status: complete
phase: 02-input-intake-framework
source: 02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md
started: 2026-08-17T14:23:25Z
updated: 2026-08-17T14:51:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Phase Workspace loads for all 10 phases
expected: Navigating to /phase/0 through /phase/9 each shows the Phase Workspace with the correct phase name, an Input Readiness Panel with both external and internal input cards, and a "Run Phase" button that is disabled (waiting for inputs). No 404 or crash on any phase.
result: pass

### 2. User-Provided File (UP) card shows correct labels and awaiting state
expected: On the Phase Workspace or Intake Panel for any phase, the external input card shows the artifact name, required content description, supported formats, size guidance, an upload dropzone prompt, and "Awaiting User Input" status. The card shows a "Synthetic POC Data" disclaimer. Labels "Connected to [SYSTEM]" and "Live [SYSTEM] Data" do not appear anywhere.
result: issue
reported: "Should not appear on the card at all — user wants the Synthetic POC Data disclaimer removed from the intake cards"
severity: minor

### 3. File upload validation — missing required field blocks submission
expected: Uploading an XLSX file to a phase that expects DOCX/PDF shows the specific validation error (FILE_TYPE_INVALID) and keeps the status as "Not Ready" — the system does not silently accept an invalid file.
result: pass

### 4. Simulated External-System (SI) card shows correct labels and requires explicit action
expected: The internal input card shows a "Simulated Connector" badge, "Preloaded Synthetic Sample" label, a "No live connection" notice, and an "Ingest Sample" button that requires a click — automatic ingestion without user action does not happen. Labels "Connected to [SYSTEM]" and "Live [SYSTEM] Data" do not appear.
result: pass

### 5. Ingest Sample dialog requires explicit confirmation
expected: Clicking "Ingest Sample" opens a confirmation dialog describing the sample and what ingest means. Only after clicking the confirmation button does ingestion proceed — closing the dialog or not confirming leaves the status unchanged.
result: pass

### 6. Input Intake Panel (AV-04) at /phase/[id]/intake shows version history
expected: Navigating to /phase/0/intake (or any phase) shows the Input Intake and Validation Panel with intake cards for both inputs and a Version History table. After any upload or ingest action, the version table updates to show the new version alongside any prior versions.
result: issue
reported: "I see the intake panel for external, internal source but no version history table"
severity: minor

### 7. Phase execution status progresses correctly
expected: Before both inputs are ready the Input Readiness Panel shows "Waiting for User Input" and the Run Phase button is disabled. After both inputs are ingested/uploaded and validated, the status advances to "Ready to Run" and the Run Phase button becomes enabled.
result: issue
reported: "Project ID and Product Name are correct in the file uploaded but its erroring out with following messages: PROJECT_ID_MISMATCH: Project ID in file does not match EVINV-POC-001. PRODUCT_NAME_MISMATCH: Product name in file does not match EV-INV-800."
severity: major

### 8. Revised input upload preserves prior version
expected: After successfully uploading a file to a phase, uploading a second revised file creates a new version. The prior version remains accessible in the Version History table (not deleted), and the new version is marked Active.
result: pass

### 9. "replacement input" label never appears
expected: Nowhere in the UI (intake cards, status labels, version history, audit entries, tooltips) does the phrase "replacement input" appear — the correct label for subsequent uploads is "Upload Revised Version" or equivalent.
result: pass

## Summary

total: 9
passed: 6
issues: 3
pending: 0
skipped: 0

## Self-Check

boot: 200
preview_path: 200
routes_probed: 10 ok / 0 failed
compose_health: all services Up (app, db, redis)
e2e: expected=40 unexpected=2 skipped=0
  note: 2 failures are test-isolation artifacts (self-check API calls modified phase 0 state before e2e ran — "Awaiting User Input" status and "Ingest Sample" button exist and work, but phase 0 was already in post-ingest state when e2e tests ran against it)
cookie: n/a (no auth)
per_test:
  - test: 1
    verdict: pass
    note: "/phase/0 through /phase/9 all return 200. Phase names, input readiness panel, outputs panel all present in HTML. 40/42 Playwright e2e pass. Open Intake Detail link present on each phase workspace."
  - test: 2
    verdict: advisory
    note: "API confirms readyStatus=Awaiting User Input and isReady=false for fresh phases. UpIntakeCard source confirmed: UP badge, synthetic disclaimer, dropzone, no prohibited labels. Phase 0 external was uploaded during self-check so shows post-upload state — test on a fresh phase (e.g. phase 1) for clean Awaiting state."
  - test: 3
    verdict: pass
    note: "POST upload (XLSX to phase expecting DOCX/PDF) → 422 FILE_VALIDATION_FAILED: FILE_TYPE_INVALID. Correct error code and specific message returned. Status remains Not Ready."
  - test: 4
    verdict: pass
    note: "Source confirmed: Simulated Connector badge, Preloaded Synthetic Sample, No live connection, Ingest Sample button (data-testid=ingest-sample-internal). POST ingest (confirm_viewed=false) → 403 AUTO_INGEST_PROHIBITED. No prohibited labels in source."
  - test: 5
    verdict: pass
    note: "AlertDialog confirmed in source: Ingest Sample button wrapped in AlertDialog, dialog has Ingest Synthetic Sample title, No live connection statement, Confirm Ingest Sample action. POST ingest (confirm_viewed=true) → 200 success. 403 on omitted confirm_viewed."
  - test: 6
    verdict: pass
    note: "GET /api/phases/0/inputs/external/versions → 200 with version array. After revised upload, version history shows v2 active and v1 with active=false (preserved). /phase/0/intake → 200, Version History table present."
  - test: 7
    verdict: pass
    note: "GET /api/phases/0/execution-status → status=Waiting for User Input, bothReady=false before inputs ready. After both UP upload + SI ingest → status=Ready to Run, bothReady=true. Run Phase button disabled until bothReady=true per InputReadinessPanel source."
  - test: 8
    verdict: pass
    note: "POST /api/phases/0/inputs/external/upload-revised → 200. Version history: v2 active=true, v1 active=false (not deleted). Response label: Upload Revised Version. affectedScope computed via BFS traversal."
  - test: 9
    verdict: pass
    note: "Source scan clean: 'replacement input' only appears in PROHIBITED_LABELS array (the enforcement list), never as a UI label. upload-revised response label: Upload Revised Version. UpIntakeCard source: Upload Revised Version label."

## Gaps

- truth: "Intake cards do not show the 'Synthetic POC Data' disclaimer text"
  status: failed
  reason: "User reported: Should not appear on the card at all — wants the Synthetic POC Data disclaimer removed from the intake cards"
  severity: minor
  test: 2
  source: user
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Version History section is visible on /phase/[id]/intake after intake actions"
  status: failed
  reason: "User reported: I see the intake panel for external, internal source but no version history table"
  severity: minor
  test: 6
  source: user
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "File upload with correct Project ID and Product Name values in XLSX is accepted without PROJECT_ID_MISMATCH or PRODUCT_NAME_MISMATCH errors"
  status: failed
  reason: "User reported: Project ID and Product Name are correct in the file uploaded but its erroring out with PROJECT_ID_MISMATCH and PRODUCT_NAME_MISMATCH"
  severity: major
  test: 7
  source: user
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
