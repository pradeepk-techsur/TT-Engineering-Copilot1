# User Stories
## TT Manufacturing and Engineering Copilot

| Field | Value |
|-------|-------|
| **Product Name** | TT Manufacturing and Engineering Copilot |
| **Date** | 2026-08-15 |
| **Related PRD** | PRD-TTCopilot.md |
| **Related FRD** | FRD-TTCopilot.md |
| **Project** | EVINV-POC-001 |
| **Classification** | Internal POC — Synthetic Data Only |

> **Synthetic POC Data. Not TT Electronics Product Data. Not for Design, Fabrication, Certification, Procurement, or Production.**

---

## Story Format

Each story follows: **As a [persona], I want to [action], so that [outcome].**

Acceptance criteria are listed beneath each story. Stories are grouped by epic and prioritised.

**Personas:**
- **Priya Nair** — Program / Project Manager
- **Marcus Webb** — Engineering / Technical Reviewer
- **Claire Ashby** — Commercial / Proposal Reviewer
- **James Okoro** — Quality / Manufacturing Engineer

---

## Epic 0: Lifecycle Orchestration and Gated State Machine (F0)

### US-0.1: Run the Full Lifecycle Through G0–G9
**As a** Priya Nair, **I want to** advance the EV-INV-800 program through all ten phases and gates (G0–G9) using the gated orchestrator, **so that** every lifecycle stage is formally tracked and no phase can proceed without an explicit human gate decision.

**Acceptance Criteria:**
- [ ] All ten phases (Phase 0–9) and gates (Gate 0–9) are implemented in sequential canonical order in the orchestrator
- [ ] Each phase may only transition from `Pending` to `AwaitingInputs` after the preceding gate is in state `Decided` with outcome `Pass` or `Conditional Pass`
- [ ] Attempting to start a phase when the prior gate is not yet decided returns error `INVALID_STATE_TRANSITION`
- [ ] The happy-path gate storyline (G0 Pass → G1 Pass → G2 Pass after clarification → G3 Conditional Pass → G4 Pass → G5 Pass → G6 Pass → G7 Pass → G8 Pass → G9 Pass/Closed) is fully executable end-to-end
- [ ] Project status transitions to `Closed` after Gate 9 `Pass` is recorded

**Priority:** P0 | **Feature Ref:** F0

---

### US-0.2: Use Orchestrator Control Commands
**As a** Priya Nair, **I want to** pause, resume, retry, cancel, and run-to-gate from the orchestrator, **so that** I can control the demonstration flow and recover from errors without restarting the entire project.

**Acceptance Criteria:**
- [ ] `pause` suspends a `Running` phase gracefully after the current tool call completes; phase transitions to `Paused`
- [ ] `resume` is idempotent — if the phase is already `Running` or `Complete`, the command is a no-op and returns current state without error
- [ ] `retry` on a `GateFailed` phase resets it to `AwaitingInputs`; the original Fail decision is preserved in audit history
- [ ] `cancel` requires a confirmation prompt; once executed, transitions phase to `Cancelled`; cannot be undone without a new project instance
- [ ] `run-to-gate(n)` executes all phases from the current phase up to (but not including) gate `n`, then pauses for human decision; halts if any intermediate phase reaches `GateFailed`
- [ ] `targeted-rerun` reruns only the checks, findings, and outputs whose dependency graph traces back to the revised input; unaffected results are preserved

**Priority:** P0 | **Feature Ref:** F0

---

### US-0.3: View Persistent Lifecycle Breadcrumbs on All Views
**As a** Priya Nair, **I want to** see lifecycle breadcrumbs at the top of every application view showing phase, gate, technical review, and current state, **so that** I always know where the program stands without opening a separate tracking tool.

**Acceptance Criteria:**
- [ ] Breadcrumbs are present and accurate on all nine application views (AV-01 through AV-09)
- [ ] Each breadcrumb segment shows: phase number and name, gate number, technical review label (Kickoff for Phase 0, SLR for Phase 1, Schematic/PDR for Phase 3, PCB Layout/CDR for Phase 4), and state indicator
- [ ] Breadcrumb states displayed correctly: `Completed` (green ✅), `Current` (blue ▶), `Awaiting Human Decision` (amber ⏳), `Conditional Pass` (orange 🔶), `Blocked` (red ⛔), `Upcoming` (grey ○), `Closed` (grey 🔒)
- [ ] No technical review label is shown for Phase 2 or Phases 5–9
- [ ] Clicking a `Completed`, `Current`, `Awaiting Human Decision`, or `Conditional Pass` breadcrumb navigates to the Phase Workspace (AV-03) for that phase

**Priority:** P0 | **Feature Ref:** F0

---

### US-0.4: Confirm AI Cannot Approve Any Gate
**As a** Priya Nair, **I want to** be assured that the AI can never autonomously approve any gate in any code path, **so that** all material lifecycle decisions remain exclusively under human authority.

**Acceptance Criteria:**
- [ ] Attempting to submit a gate decision with an AI actor identifier returns HTTP 403 with error code `GATE_AI_PROHIBITED`
- [ ] The `POST /api/gates/{id}/decide` endpoint rejects any call that does not include a human `reviewer_role` field
- [ ] The Gate Review Workspace "Record Decision" button is a client-side human-only control; no server-side auto-trigger logic exists
- [ ] Even in demonstration mode, the presenter must physically click "Record Decision" and confirm the dialog before the gate advances
- [ ] Automated end-to-end test verifies zero autonomous gate approvals across all ten gates

**Priority:** P0 | **Feature Ref:** F0

---

## Epic 1: Artifact-Count Discipline (F1)

### US-1.1: Verify Exactly One External and One Internal Input Per Phase
**As a** Priya Nair, **I want to** have exactly one external input and one internal input registered per phase, **so that** the system maintains structured artifact discipline and no phase accumulates multiple competing input sources.

**Acceptance Criteria:**
- [ ] Attempting to add a second external input to any phase returns HTTP 409 with error code `ARTIFACT_COUNT_VIOLATION` and message "Phase {n} already has an external input"
- [ ] Attempting to add a second internal input to any phase returns HTTP 409 with `ARTIFACT_COUNT_VIOLATION`
- [ ] `GET /api/phases/{id}/artifact-count` returns the current count status for both input types
- [ ] Phase execution (`Running`) is blocked if either input slot is empty at execution time
- [ ] Test cases verify count compliance for all ten phases individually

**Priority:** P0 | **Feature Ref:** F1

---

### US-1.2: Verify One or Two Outputs Per Phase — Never More
**As a** Priya Nair, **I want to** confirm that no phase can register more than two outputs for human approval, **so that** findings, gate-review packages, and audit records are never miscounted as phase deliverables.

**Acceptance Criteria:**
- [ ] Attempting to add a third output to any phase returns HTTP 409 with error code `ARTIFACT_COUNT_VIOLATION`
- [ ] Attempting to register a gate-pack artifact as a phase output returns HTTP 409 with error code `GATE_PACK_PROHIBITED`
- [ ] Findings, actions, compact phase summaries, and audit events are stored in dedicated ProjectState fields — not in `outputs[]`
- [ ] Gate Review Workspace (AV-08) is rendered dynamically from structured state; no artifact is emitted
- [ ] `GET /api/phases/{id}/artifact-count` shows output count for each phase

**Priority:** P0 | **Feature Ref:** F1

---

### US-1.3: Confirm Per-Phase Input/Output Assignments
**As a** Claire Ashby, **I want to** see the correct input and output artifacts for Phase 0 (Customer Opportunity Package → Opportunity Summary + Gap Matrix) and Phase 1 (Customer Requirements Package → Costed Proposal + Schedule), **so that** the commercial phases produce structured, compact deliverables I can review in a single session.

**Acceptance Criteria:**
- [ ] Phase 0 external input is "Customer Opportunity Package" (UP); internal input is "Capability & Opportunity Assessment Package" (SI: Salesforce, Cora, capability library); outputs are Opportunity Summary & Bid/No-Bid Recommendation (DOCX/PDF, 1–2 pp) and Capability-Match & Critical-Gap Matrix (XLSX, ~10 rows)
- [ ] Phase 1 external input is "Customer Requirements, Quantities & Supplier Pricing Package" (UP); internal input is "Preliminary Cost & Resource Package" (SI: Cora, historical proposals, parametric cost model); outputs are Costed Proposal or Business Case (DOCX/PDF, 1–2 pp) and Resource & Milestone Schedule (XLSX, ~10 rows)
- [ ] Phase 8 correctly has two SI inputs (Supplier Lifecycle & Availability Package SI; Production, BOM, Yield & Cost Package SI) — the only phase with both inputs simulated
- [ ] Phase 3 correctly has the external input as SI (Design Rules & Manufacturing Capabilities Package) and the internal input as UP (Preliminary Design Package)
- [ ] Opportunity Summary is displayed as an output of Phase 0, not as an input

**Priority:** P0 | **Feature Ref:** F1

---

## Epic 2: Input Intake Framework (F2)

### US-2.1: Upload a User-Provided File and See Validation Results
**As a** Claire Ashby, **I want to** upload the Customer Opportunity Package for Phase 0 and receive clear validation feedback, **so that** I know exactly what is wrong with my file before phase execution begins.

**Acceptance Criteria:**
- [ ] Phase Workspace (AV-03) displays artifact name, required content description, supported formats, size guidance, optional sample/template download link, and upload prompt before any file is uploaded; status shows `Awaiting User Input`
- [ ] Uploading a file with an unsupported format returns error code `FILE_TYPE_INVALID` with a list of accepted formats
- [ ] Uploading a file with a Project ID field that does not match `EVINV-POC-001` returns error code `PROJECT_ID_MISMATCH`
- [ ] Uploading a file missing a required section returns `REQUIRED_SECTION_MISSING` identifying the specific missing section
- [ ] Uploading a file with XLSX row count > 10 shows `ROW_COUNT_WARNING` (warning, not rejection) and allows the user to proceed
- [ ] After successful validation, status transitions to `User Input Ready`; confirmation message displays "[Artifact Name] received and validated. Version [n] active."
- [ ] Upload control changes to "Upload Revised Version" after successful intake; the label "replacement input" never appears anywhere in the UI

**Priority:** P0 | **Feature Ref:** F2

---

### US-2.2: Block Phase Execution Until Both Inputs Are Ready
**As a** Priya Nair, **I want to** see the Phase Execution Status clearly blocked when one or both inputs are not yet ready, **so that** no phase runs with incomplete or unvalidated data.

**Acceptance Criteria:**
- [ ] Phase Execution Status displays `Waiting for User Input` when a UP input has not yet been uploaded
- [ ] Phase Execution Status displays `Waiting for Synthetic Sample Ingestion` when an SI input has not yet been ingested
- [ ] Phase Execution Status displays `Ready to Run` only when both inputs are validated and in `Ready` status
- [ ] The "Run Phase" button is active only when status is `Ready to Run`
- [ ] Attempting to start phase execution via API before both inputs are ready returns HTTP 409 with error code `INPUTS_NOT_READY`
- [ ] System never silently substitutes synthetic data for a missing user-provided file

**Priority:** P0 | **Feature Ref:** F2

---

### US-2.3: Ingest a Simulated External-System Sample ("Ingest Sample" Action)
**As a** Claire Ashby, **I want to** explicitly click "Ingest Sample" to accept the Capability & Opportunity Assessment Package simulated from Salesforce/Cora, **so that** I can confirm the synthetic data before it enters the intake pipeline — and the system never ingests it automatically without my action.

**Acceptance Criteria:**
- [ ] Phase Workspace displays the preloaded synthetic sample with labels: "Simulated Connector — No live connection", "Preloaded Synthetic Sample", and the synthetic disclaimer
- [ ] "System Represented" label shows the correct enterprise system(s) (e.g., "Salesforce / Cora / capability library")
- [ ] View and Download buttons are available before ingestion; the "Ingest Sample" button is disabled until the user views or downloads
- [ ] Automatic ingestion without user action is prohibited; attempting programmatic auto-ingest returns HTTP 403 with error code `AUTO_INGEST_PROHIBITED`
- [ ] After the user clicks "Ingest Sample", status transitions to `Synthetic System Input Ready`; confirmation shows "[Artifact Name] (Synthetic System Input) ingested from [System Represented]. Version [n] active."
- [ ] The labels "Connected to [SYSTEM]", "Retrieved from [SYSTEM]", or "Live [SYSTEM] Data" never appear anywhere in the UI or API response

**Priority:** P0 | **Feature Ref:** F2

---

### US-2.4: Review the Input Readiness Panel for Both Inputs
**As a** Marcus Webb, **I want to** see a clear input readiness panel for both logical inputs on the Phase Workspace, **so that** I know exactly which inputs are ready, which version is active, and what action I need to take before I can run the phase.

**Acceptance Criteria:**
- [ ] Input Readiness Panel shows for each input: Artifact Name, Intake Behavior label (`User-Provided File` or `Simulated External-System Intake`), System Represented (SI inputs only), Format, Size Guidance, Active Artifact name/ID, Active Version number, Validation Status (Pass/Fail/Pending with error detail), Required User Action, and Ready Indicator (`Ready` green or `Not Ready` amber/red)
- [ ] SI inputs always display the "Simulated Connector — No live connection" label; this label cannot be hidden or removed
- [ ] If the UP input is blocking, Phase Execution Status shows `Waiting for User Input`; if the SI input is blocking, it shows `Waiting for Synthetic Sample Ingestion`
- [ ] All validation issue details are shown inline in the panel — the user does not need to navigate to a separate view to see what failed
- [ ] Every intake action (file upload, sample ingestion, revised upload) produces an immutable audit event in `ProjectState.auditHistory[]`

**Priority:** P0 | **Feature Ref:** F2

---

### US-2.5: View Full Intake Workflow in the Input Intake and Validation Panel (AV-04)
**As a** Priya Nair, **I want to** open the Input Intake and Validation Panel (AV-04) to see detailed validation results, version history, and diff controls for any phase's inputs, **so that** I can audit exactly what was submitted and when without navigating away from the cockpit.

**Acceptance Criteria:**
- [ ] AV-04 provides a phase selector to navigate to any phase's intake detail
- [ ] For each input, AV-04 shows: full intake workflow controls (same as AV-03), per-field validation result table (field, value, rule, pass/fail, issue message), version history table (version number, timestamp, status, validation result, active indicator), diff view button to compare two selected versions, and download button for any version
- [ ] Diff view opens AV-05 (Artifact Viewer) in comparison mode with two selected versions side by side, differences highlighted
- [ ] All intake audit events for a phase are visible in chronological order
- [ ] No write controls appear in AV-09 (Audit View) — it is strictly read-only

**Priority:** P0 | **Feature Ref:** F2

---

## Epic 3: Input Versioning and Dependency-Aware Revision (F3)

### US-3.1: Upload a Revised Version of a User-Provided File
**As a** Marcus Webb, **I want to** upload a revised Released Detailed Design Baseline Package for Phase 4 after correction of seeded design issues, **so that** only the affected checks are rerun and the original (pre-correction) results are preserved for comparison.

**Acceptance Criteria:**
- [ ] After a file is in `User Input Ready` status, the upload control changes to "Upload Revised Version" — never "Replace Input" or any synonym of "replacement input"
- [ ] Uploading a revised file creates a new version record (`version = prior + 1`) and runs all UP validation rules; if validation fails, the prior active version remains unchanged
- [ ] If validation passes, the new version is made active and the prior version is set `active = false` but retained in ProjectState for traceability
- [ ] The orchestrator runs `targeted-rerun` computing only the checks, findings, and outputs whose dependency graph traces back to the revised input
- [ ] Original check results (pre-revision) and revised check results (post-revision) are both stored in `ProjectState.checkResults[]` with distinct `version_ref` values; linked via `superseded_by`
- [ ] Any output where evidence materially changed has `review_required = true` set and a `Review Required` badge shown in the Gate Review Workspace

**Priority:** P0 | **Feature Ref:** F3

---

### US-3.2: Ingest a Revised Synthetic System Sample
**As a** James Okoro, **I want to** ingest the revised Manufacturing Process & Capability Package (revised MES sample) after a Phase 6 Cpk corrective action is approved, **so that** the Cpk check reruns on corrected data and both original and revised results are preserved side by side.

**Acceptance Criteria:**
- [ ] When a revised synthetic sample is available, the Phase Workspace displays notification: "Revised Synthetic System Sample Available — [System Represented]"; status indicator changes to `Revised Sample Available; Ingest Required`
- [ ] The user must explicitly click "Ingest Revised Sample"; automatic ingestion is prohibited
- [ ] After ingestion, the system traverses the dependency graph and invalidates only the Cpk check result and its dependent outputs; other unrelated results remain unchanged
- [ ] Both the original Cpk check result (Cpk = 0.87, Fail) and the revised Cpk check result (Cpk = 1.45, Pass) are stored in `checkResults[]` with version references; neither is deleted
- [ ] Intake event is written to `ProjectState.auditHistory[]` with `user_action = "revised_sample_ingested"`

**Priority:** P0 | **Feature Ref:** F3

---

### US-3.3: View Version History and Compare Artifact Versions
**As a** Marcus Webb, **I want to** view the full version history of the Released Detailed Design Baseline Package in the Artifact Viewer and compare the original and revised versions side by side, **so that** I can verify all four Phase 4 seeded issues are corrected before recording the Gate 4 decision.

**Acceptance Criteria:**
- [ ] Artifact Viewer (AV-05) shows a version selector dropdown listing all versions with timestamps and statuses
- [ ] Comparison mode presents two selected versions side by side with differences highlighted
- [ ] Provenance panel shows: source, intake behavior, system represented (if SI), generation timestamp, and input version references
- [ ] The synthetic disclaimer is always visible at the top of the viewer
- [ ] Download button is available for any selected version in its original format
- [ ] Only one version has `active = true` at any time; attempting to write a second active version returns HTTP 500 with `VERSION_INTEGRITY_VIOLATION`

**Priority:** P0 | **Feature Ref:** F3

---

## Epic 4: Shared ProjectState (F4)

### US-4.1: Access a Single Source of Truth Across All Phases
**As a** Priya Nair, **I want to** rely on a single versioned ProjectState that all application views read from, **so that** there is no discrepancy between what the Phase Workspace shows and what the Gate Review Workspace shows for the same phase.

**Acceptance Criteria:**
- [ ] `GET /api/project/state` returns the full ProjectState including all phases, findings, actions, gate decisions, and audit history
- [ ] All nine application views read from the same ProjectState; no view maintains its own local data copy
- [ ] State versioning uses a monotonically increasing `state_version` field incremented on every write; optimistic concurrency prevents conflicting writes
- [ ] `project_status = Closed` can only be written when `phases[9].gate_state = Decided` and `gateDecisions[9].decision = Pass`; any other write is rejected
- [ ] `synthetic_data_indicator` is always `true`; a write of `false` is rejected at the schema level

**Priority:** P0 | **Feature Ref:** F4

---

### US-4.2: Access the Full Audit History at Any Time
**As a** Priya Nair, **I want to** retrieve the full immutable audit history from the Audit View (AV-09), **so that** I can review every intake event, gate decision, finding, action approval, and phase state change for the entire program without any gaps.

**Acceptance Criteria:**
- [ ] AV-09 displays all audit events in reverse chronological order; columns: Event ID, Event Type, Phase, Description, Actor, Related IDs, Timestamp
- [ ] Full Intake Event Log shows all fields: phase, logical input, intake behavior, user action, system represented, status, source artifact, normalized artifact, version, validation result, timestamp
- [ ] Gate Decision History shows: Decision ID, Gate, AI Recommendation, Human Disposition, Reviewer Role, Decision, Comments, Timestamp, Artifact Versions Reviewed
- [ ] AV-09 is read-only; no edit controls, no delete option; "Immutable Record — Append Only" label is visible
- [ ] `auditHistory[]` records cannot be updated or deleted; attempting to edit an audit record returns HTTP 403 with error code `AUDIT_IMMUTABLE`
- [ ] Export is available for the full or filtered audit log as XLSX or JSON

**Priority:** P0 | **Feature Ref:** F4

---

## Epic 5: Deterministic Engineering Checks (F5)

### US-5.1: View Deterministic Check Results in the Findings Workspace for Phase 4
**As a** Marcus Webb, **I want to** view the four Phase 4 deterministic check results (cross-artifact consistency, HV clearance, component derating, test-point coverage) in the Findings workspace, **so that** I can verify each result against its threshold and formula without recomputing any value manually.

**Acceptance Criteria:**
- [ ] All four Phase 4 deterministic checks run outside the LLM as tool calls; results are always the same for the same inputs
- [ ] Each check result record includes: inputs used, formula/method, threshold, unit, result value, status (Pass/Fail/Warning), source reference (citing EVINV-POC-STD-001 with "Synthetic POC Standard" label), and known limitation
- [ ] Gate 4 review is blocked until all four mandatory checks have completed; attempting gate review before checks run returns HTTP 409 with `REQUIRED_CHECKS_NOT_RUN`
- [ ] Check results are displayed in a summary table in AV-08 (Gate Review Workspace) with check type, result, threshold, unit, and status; link to full check result detail is provided
- [ ] Phase 4 initial run detects: HV clearance failure (VBUS+ to GND_SHIELD: 6.2 mm vs 8.0 mm threshold), derating failure (C_BULK_3: 4.4% vs 50% threshold), test-point coverage failure (DIAG_TEMP_IGBT_CASE has no test point), and cross-artifact mismatch (C_HV_1 footprint 0805 vs 1206)

**Priority:** P0 | **Feature Ref:** F5

---

### US-5.2: Inspect the HV Clearance Check Result Per Net Pair
**As a** Marcus Webb, **I want to** drill into the HV clearance check result and see the measured clearance, threshold, and margin for each net pair, **so that** I can confirm which specific net pair caused the failure and verify the correction in the revised design.

**Acceptance Criteria:**
- [ ] HV clearance check result shows per-item detail: net pair, clearance type (Air/Creepage), measured clearance (mm), threshold (mm), margin (mm), and status (Pass/Fail)
- [ ] Initial run shows `VBUS+ to GND_SHIELD`: measured = 6.2 mm, threshold = 8.0 mm, margin = −1.8 mm, status = Fail
- [ ] Source reference cites "EVINV-POC-STD-001 §3.1 — High-Voltage Clearance and Creepage Requirements (Synthetic POC Standard)"
- [ ] Known limitation displayed: "Clearance values taken from design data provided in the internal package; not extracted directly from CAD files in POC"
- [ ] After revised design is uploaded and rerun, `VBUS+ to GND_SHIELD` shows measured = 9.1 mm, margin = +1.1 mm, status = Pass; both original and revised results are stored

**Priority:** P0 | **Feature Ref:** F5

---

### US-5.3: Inspect the Component Derating and Test-Point Coverage Check Results
**As a** Marcus Webb, **I want to** see the derating margin for each stress-sensitive component and the test-point coverage status for each diagnostic net, **so that** I can confirm C_BULK_3 is adequately derated and DIAG_TEMP_IGBT_CASE has an accessible test point in the revised design.

**Acceptance Criteria:**
- [ ] Derating check result shows per-component: ref designator, component type, stress parameter, rated value, operating value, unit, derating margin (%), threshold (%), status
- [ ] Initial derating run shows `C_BULK_3`: rated 450 V, operating 430 V, derating margin = 4.4%, threshold = 50%, status = Fail
- [ ] Test-point coverage check result shows per-net: net name, test point IDs (empty array if none), accessible (boolean), status
- [ ] Initial test-point run shows `DIAG_TEMP_IGBT_CASE`: test_point_ids = [], accessible = false, status = Fail
- [ ] After revised design rerun: `C_BULK_3` shows 900 V rated, margin = 52.2%, Pass; `DIAG_TEMP_IGBT_CASE` shows test point `TP-IGBT-CASE`, accessible = true, Pass

**Priority:** P0 | **Feature Ref:** F5

---

### US-5.4: Inspect the Phase 6 Cpk Calculation Result
**As a** James Okoro, **I want to** inspect the Cpk calculation result for SOLDER_JOINT_SHEAR_HV_BUS computed outside the LLM, showing the formula, mean, standard deviation, USL, LSL, Cpk value, and pass/fail status, **so that** I can approve the corrective action with confidence in the result's accuracy.

**Acceptance Criteria:**
- [ ] Cpk check result includes: characteristic ID, characteristic name, sample size, mean (μ), standard deviation (σ), USL, LSL, unit, computed Cpk (4 decimal places), threshold (1.33), status
- [ ] Initial run shows `SOLDER_JOINT_SHEAR_HV_BUS`: Cpk = 0.87, threshold = 1.33, status = Fail
- [ ] Cpk formula is documented in the check result: `Cpk = min((USL − μ) / (3σ), (μ − LSL) / (3σ))`
- [ ] Source reference cites "EVINV-POC-STD-001 §5.1 — Process Capability Requirements (Synthetic POC Standard)"
- [ ] After corrective action and revised MES sample ingestion, rerun shows `SOLDER_JOINT_SHEAR_HV_BUS` Cpk = 1.45, Pass; both original and revised results are stored with distinct version_ref values

**Priority:** P0 | **Feature Ref:** F5

---

## Epic 6: Seeded Issues and Correction Cycles (F6)

### US-6.1: Detect the Phase 2 Requirements Testability Issue and Close After Clarification
**As a** Priya Nair, **I want to** see the Phase 2 testability finding (REQ-THERM-004 missing measurable criterion) detected automatically and resolved through a human-approved clarification, **so that** Gate 2 passes only after the requirement is objectively correctable.

**Acceptance Criteria:**
- [ ] Testability check flags `REQ-THERM-004` as untestable (no numeric criterion); finding `F2-001` is raised with severity `Major` and `seeded = true`
- [ ] Human approves corrective action `A2-001` to add measurable criterion (≤ 85°C at rated power, confirmed by thermocouple at TP-CASE-1)
- [ ] User uploads revised Customer & Standards Requirements Package; testability check reruns; `REQ-THERM-004` now passes
- [ ] Finding `F2-001` status transitions to `VerifiedClosed`; original (Fail) and revised (Pass) check results both stored with version references
- [ ] Gate 2: AI recommends Pass after clarification; human selects Pass; gate decision recorded with full provenance

**Priority:** P0 | **Feature Ref:** F6

---

### US-6.2: Review the Phase 3 Conditional Pass and Track the Coolant Connector Action
**As a** Marcus Webb, **I want to** see finding `F3-001` (coolant connector assembly-access concern) trigger Gate 3 Conditional Pass and have action `A3-001` tracked as blocking until it is verified closed in Phase 4, **so that** the conditional action is never silently bypassed before Gate 4.

**Acceptance Criteria:**
- [ ] Phase 3 agent raises finding `F3-001`: "Coolant connector CN-COOL-1 orientation creates assembly-access concern; obstructs access to M4 fasteners J-FAST-7 through J-FAST-10"; severity = `Major`; `seeded = true`
- [ ] AI recommends Conditional Pass; Marcus selects `Conditional Pass`; action `A3-001` is created with `blocking = true`, `due_phase = 4`, `due_gate = 4`
- [ ] `A3-001` is visible in the Findings and Actions Workspace (AV-07) as a blocking action on all views until Phase 4 closure
- [ ] In Phase 4 Gate Review Workspace, `Pass` radio button is disabled while `A3-001` has status ≠ `VerifiedClosed`; message displayed: "Blocking actions must be closed before recording a Pass outcome"
- [ ] After Phase 4 revised design verifies connector orientation corrected, human confirms `A3-001` closure with closure evidence artifact ID; status transitions to `VerifiedClosed`

**Priority:** P0 | **Feature Ref:** F6

---

### US-6.3: Approve Corrective Actions for All Four Phase 4 Design Issues
**As a** Marcus Webb, **I want to** approve the four corrective actions raised by the Phase 4 deterministic checks (clearance, derating, test-point, cross-artifact), upload a revised design package, and confirm all four checks pass on rerun, **so that** Gate 4 can record a Pass with all seeded issues verified closed.

**Acceptance Criteria:**
- [ ] Actions `A4-001` through `A4-004` are all `blocking = true`; human must approve each corrective action in AV-07 before the revised design upload proceeds
- [ ] After revised internal input (v2) is uploaded, targeted rerun executes all four Phase 4 checks; only checks dependent on the revised input are rerun; Phase 3/other-phase results are untouched
- [ ] Revised check results: HV clearance = 9.1 mm (Pass), C_BULK_3 derating = 52.2% (Pass), DIAG_TEMP_IGBT_CASE has TP-IGBT-CASE (Pass), C_HV_1 footprint = 1206 in both BOM and DFM (Pass)
- [ ] Actions `A4-001` through `A4-004` and finding statuses all transition to `VerifiedClosed`; `A3-001` also verified closed in same gate review
- [ ] Gate 4: AI recommends Pass; Marcus selects Pass; gate decision recorded with AI recommendation, human disposition, reviewer role, comments, timestamp, and artifact versions reviewed

**Priority:** P0 | **Feature Ref:** F6

---

### US-6.4: Review Phase 5 Thermal Finding and Approve Correction Before Gate 5
**As a** James Okoro, **I want to** see the Phase 5 thermal exceedance (TP-CASE-1 = 91°C vs ≤ 85°C criterion) flagged automatically in the V&V Matrix, approve the corrective action, and confirm the rerun passes before Gate 5, **so that** the design is thermally verified before manufacturing begins.

**Acceptance Criteria:**
- [ ] Finding `F5-001` is raised automatically: "Thermal measurement at TP-CASE-1 (91°C) exceeds acceptance criterion of 85°C defined in REQ-THERM-004"; severity = `Critical`; `seeded = true`
- [ ] James approves corrective action `A5-001` in the Findings and Actions Workspace; correction cannot be auto-closed without his explicit approval (HTTP 403 `HUMAN_APPROVAL_REQUIRED` if attempted)
- [ ] User uploads revised Validation Evidence Package; targeted rerun updates V&V Matrix row for REQ-THERM-004; revised result = 82°C, criterion met
- [ ] `F5-001` status → `VerifiedClosed`; original (Fail) and revised (Pass) results both preserved with version references
- [ ] Gate 5: AI recommends Pass; James selects Pass; gate decision recorded with full provenance

**Priority:** P0 | **Feature Ref:** F6

---

### US-6.5: Review Phase 8 Obsolescence Finding and Approve Gate 8 Pass to Initiate EOL
**As a** James Okoro, **I want to** see the Phase 8 obsolescence forecast flag IGBT-HV-800-A with a fictional discontinuance notice and approve Gate 8 Pass to initiate Phase 9 EOL, **so that** the program transitions to end-of-life in a governed, human-approved step.

**Acceptance Criteria:**
- [ ] Phase 8 Obsolescence & Supply-Risk Forecast flags `IGBT-HV-800-A` (Q_HV_1) with `ObsolescenceRisk = Critical`; finding `F8-001` raised: fictional discontinuance notice with last-time-buy date; severity = `Critical`; `seeded = true`
- [ ] Yield/Quality/Financial-Anomaly Report confirms remaining demand does not justify redevelopment
- [ ] AI recommends `Pass` to initiate Phase 9 EOL; human selects `Pass`; gate decision recorded
- [ ] After Gate 8 Pass, project transitions to Phase 9 (End of Life); `current_phase` updates to 9
- [ ] Phase 9 Gate 9 Pass sets `project_status = Closed`; breadcrumb for Phase 9 shows `Closed` (🔒 grey)

**Priority:** P0 | **Feature Ref:** F6

---

## Epic 7: Token Optimization and Context Management (F7)

### US-7.1: Confirm Reference Documents Are Indexed Once and Not Re-Transmitted
**As a** Priya Nair, **I want to** confirm that the system indexes reference documents (EVINV-POC-STD-001, Power Supplies checklists) at startup and retrieves only relevant passages per agent invocation, **so that** no full document is repeatedly transmitted and the system stays within token budgets across all 10 phases.

**Acceptance Criteria:**
- [ ] `POST /api/system/initialize-index` builds and caches the reference index at startup; `GET /api/system/index-status` reports initialization status
- [ ] Attempting to invoke a phase agent before the reference index is initialized returns HTTP 503 with error code `REFERENCE_INDEX_NOT_INITIALIZED`
- [ ] Full reference documents (EVINV-POC-STD-001, checklist tabs) are never included in any agent context package; only retrieved passages appear; violation returns HTTP 500 with `FULL_DOC_IN_CONTEXT`
- [ ] Context package includes `token_count` field; if count exceeds the configurable budget (default 8,000 tokens), context assembly trims least-relevant passages before invoking the agent
- [ ] Deterministic checks (clearance, derating, Cpk, testability, traceability) run as tool calls outside LLM; delegating these computations to LLM inference returns HTTP 500 with `DETERMINISTIC_DELEGATION_VIOLATION`

**Priority:** P0 | **Feature Ref:** F7

---

### US-7.2: Use Compact Phase Summaries as Upstream Context
**As a** Priya Nair, **I want to** have approved prior phases represented to downstream agents as compact structured summaries (≤ 400 tokens each), **so that** the system can operate across all 10 phases without context-window overload or re-transmitting full upstream documents.

**Acceptance Criteria:**
- [ ] After each phase gate is decided, a `CompactPhaseSummary` is generated and stored in `ProjectState.phases[n].compactPhaseSummary`
- [ ] Compact summaries contain: gate outcome, ≤ 3 key decisions (≤ 50 tokens each), ≤ 2 output references (≤ 30 tokens each), open action IDs (list only), findings summary (≤ 1 paragraph, ≤ 100 tokens); total ≤ 400 tokens per phase
- [ ] `GET /api/context/phase/{id}/summaries` returns compact summaries for all prior phases in a single call
- [ ] Full prior-phase documents are never re-transmitted to downstream agents; violation is enforced by the context assembly layer
- [ ] Agent context per invocation contains only: active phase input summaries, upstream compact phase summaries, open actions, selected checklist items, selected standard passages, and output schema

**Priority:** P0 | **Feature Ref:** F7

---

## Epic 8: Compact Artifact Standards (F8)

### US-8.1: Generate and Validate Compact XLSX Outputs (≤10 Rows)
**As a** Claire Ashby, **I want to** receive the Capability-Match & Critical-Gap Matrix as a compact XLSX with ≤10 meaningful rows, all required metadata, and a visible synthetic disclaimer, **so that** I can review the entire artifact in a single session without wading through a padded spreadsheet.

**Acceptance Criteria:**
- [ ] Agent-generated XLSX artifacts have ≤10 meaningful rows (header rows excluded from count); exceeding 10 rows for agent output returns HTTP 422 with `ROW_COUNT_VIOLATION`
- [ ] Every XLSX record includes a stable unique identifier, units for any quantitative field, source reference where applicable, and revision level
- [ ] No unused columns (all columns have at least one non-empty value); unused columns in agent output return `UNUSED_COLUMN_VIOLATION`
- [ ] XLSX header area contains all required metadata fields: Project ID (`EVINV-POC-001`), Product Name, Phase, Gate, Artifact Name, Version, Status, Synthetic Data Disclaimer, Generated At
- [ ] Mandatory disclaimer is present in a dedicated `Synthetic Data Disclaimer` metadata field; attempting to register an artifact without the disclaimer returns HTTP 422 with `DISCLAIMER_MISSING`

**Priority:** P0 | **Feature Ref:** F8

---

### US-8.2: Generate and Validate Compact DOCX/PDF Outputs (≤2 Pages)
**As a** Claire Ashby, **I want to** receive the Opportunity Summary & Bid/No-Bid Recommendation as a compact DOCX/PDF of ≤2 pages with all required sections, **so that** I can reach a commercial gate decision in a single reading without navigating a 40-page proposal document.

**Acceptance Criteria:**
- [ ] Agent-generated DOCX/PDF artifacts have ≤2 pages; exceeding 2 pages returns HTTP 422 with `PAGE_COUNT_VIOLATION`
- [ ] Every DOCX/PDF output contains required sections in order: Document Header (Project ID, product, phase, gate, artifact name, version, status, date, disclaimer), Executive Summary (≤100 words), Key Findings or Results (3–7 items), Recommendation, Open Actions (if any), Provenance Statement
- [ ] Mandatory disclaimer appears as bold text immediately after the document title; it cannot be abbreviated, removed, or moved to a footnote
- [ ] No tables with > 10 rows in DOCX/PDF; no appendices or attachments; no repeated boilerplate beyond the required header and disclaimer
- [ ] Every reference to EVINV-POC-STD-001 includes the label "(Synthetic POC Standard, not an approved TT or industry standard)"; omission returns `SYNTHETIC_LABEL_MISSING`

**Priority:** P0 | **Feature Ref:** F8

---

### US-8.3: Download Approved Phase Outputs with Full Provenance
**As a** Claire Ashby, **I want to** download approved Phase 0 and Phase 1 outputs from the Artifact Viewer with full provenance metadata, **so that** I can share compact, properly labeled deliverables with stakeholders without worrying about version confusion.

**Acceptance Criteria:**
- [ ] Artifact Viewer (AV-05) provides a Download button for any selected version in its original format (XLSX, DOCX, or PDF)
- [ ] Every artifact record in the registry includes provenance: artifact ID, artifact name, type, source (UserUploaded/AgentGenerated/SyntheticSample), intake behavior, version, phase ID, gate ID, input version references, timestamp, generated by, and `disclaimer_present = true`
- [ ] `disclaimer_present` field is always `true`; a write of `false` is rejected at the registry level
- [ ] `GET /api/artifacts/{id}` returns artifact with full provenance; `GET /api/artifacts/{id}/versions` lists all versions
- [ ] Artifact generation wrapper validates disclaimer, row/page count, column discipline, and provenance before registering; any violation causes the artifact to be rejected with a specific error code

**Priority:** P0 | **Feature Ref:** F8

---

## Epic 9: Application Views — Nine-View Web Gate Cockpit (F9)

### US-9.1: Navigate the Project Overview and Product Lifecycle View
**As a** Priya Nair, **I want to** open the Project Overview (AV-01) and Product Lifecycle View (AV-02) to see project identity, phase health indicators, and the full lifecycle timeline with gate states, **so that** I can assess program status at a glance without opening any other system.

**Acceptance Criteria:**
- [ ] AV-01 displays: Project ID (EVINV-POC-001), Product Name (EV-INV-800 Demonstration Traction Inverter), Project Type (NPI A / Category 1), Current Phase/Gate, Project Status, and Synthetic Data indicator badge (always visible)
- [ ] AV-01 Phase Summary Table shows 10 rows (one per phase) with columns: Phase, Technical Review, Gate, Status, Gate Outcome, Last Action Date
- [ ] AV-01 Project Health Indicators show: open findings count by severity, open actions count (blocking vs. non-blocking), phases complete (n of 10), last gate decision date and outcome
- [ ] AV-02 shows all 10 phases and 10 gates in sequential order; each phase node shows breadcrumb state indicator, gate outcome badge, and technical review label (where mapped)
- [ ] Clicking any phase node in AV-02 navigates to AV-03 (Phase Workspace) for that phase; clicking a gate node navigates to AV-08 (Gate Review Workspace)

**Priority:** P0 | **Feature Ref:** F9

---

### US-9.2: Work in the Phase Workspace (AV-03) — Input, Output, Decision
**As a** Marcus Webb, **I want to** use the Phase Workspace (AV-03) as my primary per-phase working view with input readiness panels, output approval controls, findings summary, AI recommendation, and human decision control all in one place, **so that** I can complete a full phase review without switching between multiple tools.

**Acceptance Criteria:**
- [ ] AV-03 shows Input Readiness Panel for both inputs (all required fields per F2) and Phase Execution Status indicator in the correct sequential order
- [ ] Output Panel shows each phase output with: output name, artifact type, version, approval status badge, `Review Required` badge (if applicable), and Approve/Request Revision buttons when `AwaitingReview`
- [ ] AI Recommendation Panel displays: recommended outcome, rationale, referenced finding and check IDs, and "Advisory Only — Human Decision Required" label (this label cannot be removed by configuration)
- [ ] Human Decision Control shows radio buttons `Pass` / `Conditional Pass` / `Fail` with no option pre-selected; confirmation dialog is required before the gate decision POST is sent
- [ ] Decision cannot be recorded while phase is `Processing`; the Record Decision button is disabled in that state
- [ ] Findings and Actions section shows findings and actions for the current phase with a link to AV-07 for full cross-phase detail

**Priority:** P0 | **Feature Ref:** F9

---

### US-9.3: Use the Technical Checklist Workspace (AV-06) for Phases With a Mapped Review
**As a** Marcus Webb, **I want to** work through the PCB Layout Review + CDR checklist in AV-06 for Phase 4, attach evidence, and mark items complete, **so that** the technical review is structured and traceable — not managed in a shared Excel file via email.

**Acceptance Criteria:**
- [ ] AV-06 renders checklist content only for Phases 0, 1, 3, and 4; for Phase 2 and Phases 5–9 the view displays "No technical review is mapped to this phase" — no checklist content appears
- [ ] Checklist source label is visible: "Power Supplies Technical Review Checklists — Prelim ([tab name])"
- [ ] Checklist table columns: Item ID, Checklist Item Description (from source wording), Evidence Required, Evidence Status (Complete/Partial/Not Started), Linked Artifact (ID and link), Action Required (if incomplete), Reviewer Notes
- [ ] Summary line shows count of complete / partial / not-started items
- [ ] Requesting checklist content for Phase 2 or Phases 5–9 via API returns HTTP 404 with `NO_CHECKLIST_MAPPED`
- [ ] Export checklist table as XLSX is available

**Priority:** P0 | **Feature Ref:** F9

---

### US-9.4: View All Findings and Blocking Actions in the Findings and Actions Workspace (AV-07)
**As a** Priya Nair, **I want to** see all findings and actions across all phases in AV-07 with blocking actions surfaced prominently, **so that** I can confirm no conditional-pass condition is outstanding before approving a gate.

**Acceptance Criteria:**
- [ ] AV-07 Findings Table shows: Finding ID, Phase, Gate, Detected By, Seeded indicator, Description, Severity, Status, Linked Actions; filterable by phase, severity, status, seeded
- [ ] AV-07 Actions Table shows: Action ID, Source Finding, Phase, Gate, Description, Owner Role, Blocking indicator, Due Phase/Gate, Required Closure Evidence, Status, Human Approver, Closure Evidence Artifact
- [ ] Blocking actions are surfaced in a separate "Blocking Actions" section at the top of the actions table with prominent visual treatment
- [ ] Human approvers can approve corrective actions (records approver role and timestamp) and close actions (requires providing closure evidence artifact link) directly from AV-07
- [ ] Clicking an action row expands full detail and history; clicking "Navigate to source phase" opens AV-03 for the originating phase

**Priority:** P0 | **Feature Ref:** F9

---

### US-9.5: Use the Gate Review Workspace (AV-08) to Make a Gate Decision
**As a** Priya Nair, **I want to** open AV-08 and see all gate review content (inputs, outputs, check results, findings, open actions, AI recommendation) dynamically built from ProjectState, **so that** I can record a structured gate decision without assembling a separate gate-pack document.

**Acceptance Criteria:**
- [ ] AV-08 is built dynamically from ProjectState; no separate gate-pack artifact is created or registered as a phase output
- [ ] Gate Review Workspace displays: Gate Identity header, both inputs with version and validation status, all phase outputs with approval status and review-required indicators, deterministic check results summary table, findings summary, open actions panel (blocking prominently highlighted), AI recommended outcome with "Advisory Only" label
- [ ] Human comments field is available (optional free text)
- [ ] `Pass` radio button is disabled and shows message "Blocking actions must be closed before recording a Pass outcome" when any action has `blocking = true` and `status ≠ VerifiedClosed`
- [ ] When `Conditional Pass` is selected, at least one Conditional Pass Action entry must be completed with all required fields (description, owner role, blocking/parallel, due phase/gate, required closure evidence) before the Record Decision button is enabled
- [ ] Gate Decision History section shows all prior decisions for this gate (if retry occurred), each with AI recommendation, human decision, reviewer role, and timestamp

**Priority:** P0 | **Feature Ref:** F9

---

### US-9.6: Navigate Breadcrumbs Across All Nine Views and View Intake Audit Log
**As a** Priya Nair, **I want to** click any completed or current phase breadcrumb from any of the nine application views and navigate directly to that phase's workspace, and view the intake audit log in AV-09 with all event fields, **so that** I can audit any phase of the program at any time without leaving the cockpit.

**Acceptance Criteria:**
- [ ] Breadcrumbs are present at the top of all nine views (AV-01 through AV-09); they display the correct breadcrumb state for every phase at all times
- [ ] Clicking a `Completed`, `Current`, `Awaiting Human Decision`, or `Conditional Pass` breadcrumb from any view navigates to AV-03 for that phase
- [ ] Clicking `Upcoming` or `Blocked` breadcrumbs does not navigate (non-interactive or shows disabled state)
- [ ] AV-09 Intake Event Log shows all events with all fields: Event ID, Phase, Logical Input, Intake Behavior, User Action, System Represented, Status, Source Artifact, Normalized Artifact, Version, Validation Result, Timestamp
- [ ] AV-09 Gate Decision History shows all gate decisions with: Decision ID, Gate, AI Recommendation, Human Disposition, Reviewer Role, Decision, Comments, Timestamp, Artifact Versions Reviewed
- [ ] Filters available in AV-09 by event type, phase, and date range; export as XLSX or JSON

**Priority:** P0 | **Feature Ref:** F9

---

## Epic 10: Gate Review Model (F10)

### US-10.1: Select Gate Outcome (Pass / Conditional Pass / Fail) at Any Gate
**As a** Priya Nair, **I want to** select exactly one of three gate outcomes (Pass, Conditional Pass, or Fail) at any gate and have my decision permanently recorded with full provenance, **so that** every gate in the program has an authoritative, human-owned decision record.

**Acceptance Criteria:**
- [ ] Gate outcome must be exactly one of `Pass`, `Conditional Pass`, or `Fail`; submitting any other value returns HTTP 400 with `GATE_OUTCOME_INVALID`
- [ ] No outcome is pre-selected in the UI; human must make an affirmative radio button selection before "Record Decision" is enabled
- [ ] Confirmation dialog is required before the POST is sent: "You are recording [outcome] for Gate [n]. This action cannot be undone. Confirm?"
- [ ] Gate decision record is written as immutable (`is_final = true`) immediately after confirmation; subsequent update or delete attempts return HTTP 409 with `GATE_ALREADY_DECIDED`
- [ ] Gate decision provenance record includes: decision ID, gate number, AI recommendation, human disposition, reviewer role, decision, comments, timestamp, artifact versions reviewed, open conditions, and `is_final = true`

**Priority:** P0 | **Feature Ref:** F10

---

### US-10.2: Record a Conditional Pass and Track Its Actions
**As a** Marcus Webb, **I want to** record a Conditional Pass at Gate 3 and create action `A3-001` with blocking status, due phase, and required closure evidence, **so that** the coolant connector issue is formally tracked and cannot be silently bypassed before Gate 4.

**Acceptance Criteria:**
- [ ] Selecting `Conditional Pass` in AV-08 shows the Conditional Pass Action Form requiring at least one action; attempting to record Conditional Pass with no actions returns HTTP 400 with `CONDITIONAL_ACTIONS_REQUIRED`
- [ ] Each conditional action requires: description, owner role, blocking/parallel indicator, due phase/gate, and required closure evidence; system assigns action ID `A{gate}-{seq}` (e.g., `A3-001`)
- [ ] After recording, `A3-001` is created in `ProjectState.actions[]` with `blocking = true`, `status = Open`, `due_phase = 4`, `due_gate = 4`
- [ ] The action is immediately visible in AV-07 (Findings and Actions Workspace) in the Blocking Actions section; it is visible across all nine views via the breadcrumb Conditional Pass state
- [ ] Next phase (Phase 4) is allowed to proceed to `AwaitingInputs` while `A3-001` is open; however, Gate 4 `Pass` is blocked until `A3-001.status = VerifiedClosed`

**Priority:** P0 | **Feature Ref:** F10

---

### US-10.3: View Conditional Pass Action Tracking Across All Views
**As a** Priya Nair, **I want to** see the Gate 3 Conditional Pass action (`A3-001`) surfaced prominently on all views until it is verified closed in Phase 4, **so that** I never lose track of outstanding conditions regardless of which view I am currently using.

**Acceptance Criteria:**
- [ ] Phase 3 breadcrumb shows `Conditional Pass` state (🔶 orange) on all nine views until `A3-001` is verified closed
- [ ] AV-01 Project Health Indicators shows open blocking action count ≥ 1 while `A3-001` is open
- [ ] AV-07 Blocking Actions section lists `A3-001` at the top with: Action ID, Description, Owner Role, Blocking = true, Due Gate 4, Required Closure Evidence, Status = Open
- [ ] AV-08 for Gate 4 shows `A3-001` in the Open Actions Panel with blocking highlighted; `Pass` radio button is disabled until `A3-001.status = VerifiedClosed`
- [ ] After Marcus confirms `A3-001` closure in Phase 4 Gate Review Workspace (providing closure evidence artifact ID), `A3-001.status` transitions to `VerifiedClosed` and `Pass` becomes selectable

**Priority:** P0 | **Feature Ref:** F10

---

### US-10.4: Review the AI Recommendation Before Making a Gate Decision
**As a** Claire Ashby, **I want to** see the AI recommended gate outcome and its rationale in AV-08 before I record my own decision, **so that** I can weigh the AI's analysis without being bound by it.

**Acceptance Criteria:**
- [ ] AI Recommended Outcome panel in AV-08 shows: recommended outcome (Pass/Conditional Pass/Fail), rationale text, finding IDs cited, check result IDs cited
- [ ] "Advisory Only — Human Decision Required" label is always visible in the AI Recommendation panel; it cannot be hidden or suppressed by configuration
- [ ] AI recommendation is stored in `ProjectState.phases[n].aiRecommendation` and in the gate decision provenance record; it does not overwrite or pre-select the human decision radio buttons
- [ ] Gate decision provenance record captures both `ai_recommendation` (full AI record) and `human_disposition` (human reviewer's characterization of the AI recommendation)
- [ ] AI cannot submit a gate decision; any attempt returns HTTP 403 with `GATE_AI_PROHIBITED`

**Priority:** P0 | **Feature Ref:** F10

---

### US-10.5: Retry a Failed Gate After Correction
**As a** Priya Nair, **I want to** retry Gate 4 after Phase 4 initial failure (four simultaneous issues), so that the program can proceed once all corrections are verified — and the original Fail decision is preserved in the audit history alongside the new Pass decision.

**Acceptance Criteria:**
- [ ] After recording Gate 4 `Fail`, phase state transitions to `GateFailed`; project status = `Blocked`
- [ ] Human initiates retry via `POST /api/orchestrator/phase/4/retry`; phase resets to `AwaitingInputs`; gate resets to `Locked` then `Open` after re-execution
- [ ] Original Fail gate decision record (`is_final = true`) is preserved in `ProjectState.gateDecisions[]`; it is not deleted or overwritten
- [ ] New gate decision after correction is written as a separate record with `supersedes = prior_decision_id`; both records are visible in AV-08 Gate Decision History and AV-09 Audit View
- [ ] Full correction cycle (four actions verified closed, A3-001 verified closed, all checks passing) must be complete before `Pass` is selectable at the retried gate

**Priority:** P0 | **Feature Ref:** F10

---

## Summary Table

| Epic | Feature | Stories | P0 |
|------|---------|---------|-----|
| Epic 0: Lifecycle Orchestration and Gated State Machine | F0 | 4 | 4 |
| Epic 1: Artifact-Count Discipline | F1 | 3 | 3 |
| Epic 2: Input Intake Framework | F2 | 5 | 5 |
| Epic 3: Input Versioning and Dependency-Aware Revision | F3 | 3 | 3 |
| Epic 4: Shared ProjectState | F4 | 2 | 2 |
| Epic 5: Deterministic Engineering Checks | F5 | 4 | 4 |
| Epic 6: Seeded Issues and Correction Cycles | F6 | 5 | 5 |
| Epic 7: Token Optimization and Context Management | F7 | 2 | 2 |
| Epic 8: Compact Artifact Standards | F8 | 3 | 3 |
| Epic 9: Application Views — Nine-View Web Gate Cockpit | F9 | 6 | 6 |
| Epic 10: Gate Review Model | F10 | 5 | 5 |
| **Total** | **F0–F10** | **42** | **42** |

All 42 stories are P0 (Critical — MVP requirement). The POC has a single demonstration scenario and all features are required to execute the full happy-path gate storyline end-to-end.

---

## Priority Definitions

| Priority | Definition |
|----------|------------|
| **P0** | Critical — Must have for MVP; POC cannot demonstrate without this story |
| **P1** | High — Important for a polished release but not blocking the core demonstration |
| **P2** | Medium — Nice to have; enhances experience but non-blocking |
| **P3** | Low — Future consideration; out of scope for POC v1 |

---

## Story Index

| Story ID | Title | Persona | Epic | Feature Ref |
|----------|-------|---------|------|-------------|
| US-0.1 | Run the Full Lifecycle Through G0–G9 | Priya Nair | Lifecycle Orchestration | F0 |
| US-0.2 | Use Orchestrator Control Commands | Priya Nair | Lifecycle Orchestration | F0 |
| US-0.3 | View Persistent Lifecycle Breadcrumbs on All Views | Priya Nair | Lifecycle Orchestration | F0 |
| US-0.4 | Confirm AI Cannot Approve Any Gate | Priya Nair | Lifecycle Orchestration | F0 |
| US-1.1 | Verify Exactly One External and One Internal Input Per Phase | Priya Nair | Artifact-Count Discipline | F1 |
| US-1.2 | Verify One or Two Outputs Per Phase — Never More | Priya Nair | Artifact-Count Discipline | F1 |
| US-1.3 | Confirm Per-Phase Input/Output Assignments | Claire Ashby | Artifact-Count Discipline | F1 |
| US-2.1 | Upload a User-Provided File and See Validation Results | Claire Ashby | Input Intake Framework | F2 |
| US-2.2 | Block Phase Execution Until Both Inputs Are Ready | Priya Nair | Input Intake Framework | F2 |
| US-2.3 | Ingest a Simulated External-System Sample | Claire Ashby | Input Intake Framework | F2 |
| US-2.4 | Review the Input Readiness Panel for Both Inputs | Marcus Webb | Input Intake Framework | F2 |
| US-2.5 | View Full Intake Workflow in the Input Intake and Validation Panel | Priya Nair | Input Intake Framework | F2 |
| US-3.1 | Upload a Revised Version of a User-Provided File | Marcus Webb | Input Versioning | F3 |
| US-3.2 | Ingest a Revised Synthetic System Sample | James Okoro | Input Versioning | F3 |
| US-3.3 | View Version History and Compare Artifact Versions | Marcus Webb | Input Versioning | F3 |
| US-4.1 | Access a Single Source of Truth Across All Phases | Priya Nair | Shared ProjectState | F4 |
| US-4.2 | Access the Full Audit History at Any Time | Priya Nair | Shared ProjectState | F4 |
| US-5.1 | View Deterministic Check Results in the Findings Workspace for Phase 4 | Marcus Webb | Deterministic Checks | F5 |
| US-5.2 | Inspect the HV Clearance Check Result Per Net Pair | Marcus Webb | Deterministic Checks | F5 |
| US-5.3 | Inspect the Component Derating and Test-Point Coverage Check Results | Marcus Webb | Deterministic Checks | F5 |
| US-5.4 | Inspect the Phase 6 Cpk Calculation Result | James Okoro | Deterministic Checks | F5 |
| US-6.1 | Detect the Phase 2 Requirements Testability Issue | Priya Nair | Seeded Issues | F6 |
| US-6.2 | Review Phase 3 Conditional Pass and Track Coolant Connector Action | Marcus Webb | Seeded Issues | F6 |
| US-6.3 | Approve Corrective Actions for All Four Phase 4 Design Issues | Marcus Webb | Seeded Issues | F6 |
| US-6.4 | Review Phase 5 Thermal Finding and Approve Correction | James Okoro | Seeded Issues | F6 |
| US-6.5 | Review Phase 8 Obsolescence Finding and Approve Gate 8 Pass | James Okoro | Seeded Issues | F6 |
| US-7.1 | Confirm Reference Documents Are Indexed Once and Not Re-Transmitted | Priya Nair | Token Optimization | F7 |
| US-7.2 | Use Compact Phase Summaries as Upstream Context | Priya Nair | Token Optimization | F7 |
| US-8.1 | Generate and Validate Compact XLSX Outputs | Claire Ashby | Compact Artifact Standards | F8 |
| US-8.2 | Generate and Validate Compact DOCX/PDF Outputs | Claire Ashby | Compact Artifact Standards | F8 |
| US-8.3 | Download Approved Phase Outputs with Full Provenance | Claire Ashby | Compact Artifact Standards | F8 |
| US-9.1 | Navigate the Project Overview and Product Lifecycle View | Priya Nair | Application Views | F9 |
| US-9.2 | Work in the Phase Workspace (AV-03) | Marcus Webb | Application Views | F9 |
| US-9.3 | Use the Technical Checklist Workspace (AV-06) | Marcus Webb | Application Views | F9 |
| US-9.4 | View All Findings and Blocking Actions in AV-07 | Priya Nair | Application Views | F9 |
| US-9.5 | Use the Gate Review Workspace (AV-08) to Make a Gate Decision | Priya Nair | Application Views | F9 |
| US-9.6 | Navigate Breadcrumbs and View Intake Audit Log | Priya Nair | Application Views | F9 |
| US-10.1 | Select Gate Outcome (Pass / Conditional Pass / Fail) | Priya Nair | Gate Review Model | F10 |
| US-10.2 | Record a Conditional Pass and Track Its Actions | Marcus Webb | Gate Review Model | F10 |
| US-10.3 | View Conditional Pass Action Tracking Across All Views | Priya Nair | Gate Review Model | F10 |
| US-10.4 | Review the AI Recommendation Before Making a Gate Decision | Claire Ashby | Gate Review Model | F10 |
| US-10.5 | Retry a Failed Gate After Correction | Priya Nair | Gate Review Model | F10 |

---

*Document generated by Pivota Spec Framework*
*Last updated: 2026-08-15*
*Project: EVINV-POC-001 | PRD: PRD-TTCopilot-v1.0 | FRD: FRD-TTCopilot-v1.0 | Synthetic POC Data. Not TT Electronics Product Data. Not for Design, Fabrication, Certification, Procurement, or Production.*
