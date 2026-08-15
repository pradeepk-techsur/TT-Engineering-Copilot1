# User Story Map
## TT Manufacturing and Engineering Copilot

| Field | Value |
|-------|-------|
| **Product Name** | TT Manufacturing and Engineering Copilot |
| **Date** | 2026-08-15 |
| **Related Personas** | PERSONAS-TTCopilot.md |
| **Related Journeys** | JOURNEYS-TTCopilot.md |
| **Related JTBD** | JTBD-TTCopilot.md |
| **Related User Stories** | UserStories-TTCopilot.md |
| **Related PRD** | PRD-TTCopilot.md |
| **Project** | EVINV-POC-001 |
| **Classification** | Internal POC — Synthetic Data Only |

> **Synthetic POC Data. Not TT Electronics Product Data. Not for Design, Fabrication, Certification, Procurement, or Production.**

---

## Overview

This story map organises all 42 user stories (US-0.1 through US-10.5) along the **horizontal axis** of the four primary journey stages drawn from JOURNEYS-TTCopilot.md, and the **vertical axis** of the seven build-phase releases. Each row records the journey-stage activity, the persona primarily served, the epic, the story reference, a **Natural Acceptance Criterion (NaC)** derived from the JTBD outcome most relevant to that stage, and the release assignment.

### NaC Concept
A NaC is not invented — it is the intersection of:
1. A **JTBD outcome** (what matters to the persona)
2. The **journey stage** (when/where that outcome is needed)
3. The **user story** (what is built)

The result is a testable criterion stated in the persona's own terms. NaC derivation chains appear in the NaC Derivation Table below, and alignment with UserStories acceptance criteria is verified in the NaC-to-Acceptance Criteria Mapping section.

### Build Phase → Release Mapping

| Release | Build Phase | Theme |
|---------|-------------|-------|
| R1 | Build Phase 1 | Foundation — ProjectState, orchestrator, breadcrumbs, Lifecycle/Project views |
| R2 | Build Phase 2 | Input Intake Framework — upload workflow, simulated intake, validation, versioning, audit log |
| R3 | Build Phase 3 | Lifecycle Agents 0–2 — Phase Workspaces for G0, G1, G2 |
| R4 | Build Phase 4 | Lifecycle Agents 3–4 (Flagship) — G3, G4, deterministic tools, correction cycle |
| R5 | Build Phase 5 | Lifecycle Agents 5–7 — G5, G6, G7, Cpk check |
| R6 | Build Phase 6 | Lifecycle Agents 8–9 — G8, G9, EOL storyline, project closure |
| R7 | Build Phase 7 | Cross-cutting Views + Demo Polish — Gate Review, Checklist, Audit, Artifact Viewer |

---

## Story Map Matrix

### PER-01: Marcus Webb — Engineering / Technical Reviewer
**Journey:** JRN-01.1 — Phase 4 Flagship: Design Review, Deterministic Check Findings, and Gate 4 Pass

| Activity | Persona | Epic | Stories | NaC | Release |
|----------|---------|------|---------|-----|---------|
| Upload Input — open Phase Workspace, upload Released Detailed Design Baseline Package, validate | PER-01 | Epic 2 (F2) | US-2.4: Review Input Readiness Panel | JTBD-01.1: Input readiness panel shows both inputs' validation status inline so Marcus can confirm design baseline is Ready without navigating away | R2 |
| Upload Input — upload revised version after correction cycle | PER-01 | Epic 3 (F3) | US-3.1: Upload a Revised Version of a User-Provided File | JTBD-01.1: Uploading revised design triggers targeted rerun of only the four affected checks; original results preserved | R2 |
| Trigger Execution — confirm both inputs Ready, click Run Phase 4 | PER-01 | Epic 2 (F2) | US-2.2: Block Phase Execution Until Both Inputs Are Ready | JTBD-01.1: "Run Phase" is active only when both inputs show Ready so Marcus cannot launch a run on stale data | R2 |
| Review AI Outputs — open DFM & Standards Audit, BOM Health Report | PER-01 | Epic 8 (F8) | US-8.2: Generate and Validate Compact DOCX/PDF Outputs | JTBD-01.1: BOM Health Report is ≤2 pages with a Pass/Fail summary banner so Marcus can triage all four check outcomes at a glance | R4 |
| Review AI Outputs — open Phase Workspace output panel | PER-01 | Epic 9 (F9) | US-9.2: Work in the Phase Workspace (AV-03) | JTBD-01.1: Phase Workspace output panel shows each output with approval status and Review Required badge so Marcus knows what needs action | R4 |
| Inspect Deterministic Checks — view all four check results | PER-01 | Epic 5 (F5) | US-5.1: View Deterministic Check Results for Phase 4 | JTBD-01.1: All four Phase 4 deterministic check results are displayed with formula, threshold, unit, result, and Pass/Fail status — no external spreadsheet required | R4 |
| Inspect Deterministic Checks — drill into HV clearance per net pair | PER-01 | Epic 5 (F5) | US-5.2: Inspect HV Clearance Check Result Per Net Pair | JTBD-01.1: HV clearance check shows per-net-pair detail (measured vs threshold vs margin) so Marcus can confirm exactly which net pair failed | R4 |
| Inspect Deterministic Checks — view derating and test-point results | PER-01 | Epic 5 (F5) | US-5.3: Inspect Derating and Test-Point Coverage Check Results | JTBD-01.1: Derating and test-point checks show per-component/per-net detail so Marcus can verify C_BULK_3 and DIAG_TEMP_IGBT_CASE without recomputing | R4 |
| Approve Corrective Actions — review and approve four Phase 4 actions | PER-01 | Epic 6 (F6) | US-6.3: Approve Corrective Actions for All Four Phase 4 Design Issues | JTBD-01.2: Each corrective action record includes description, blocking status, and rationale field so Marcus's approval is distinguishable per action in the audit trail | R4 |
| Approve Corrective Actions — review Phase 3 Conditional Pass, track A3-001 | PER-01 | Epic 6 (F6) | US-6.2: Review Phase 3 Conditional Pass and Track Coolant Connector Action | JTBD-01.2: A3-001 is visible in AV-07 as Blocking and the Gate 4 Pass radio button is disabled while A3-001 is Open | R4 |
| Review Revised Design — compare original vs revised side by side | PER-01 | Epic 3 (F3) | US-3.3: View Version History and Compare Artifact Versions | JTBD-01.1: Artifact Viewer comparison mode shows two versions side by side with differences highlighted so Marcus can confirm all four seeded issues are corrected | R7 |
| Review Revised Design — confirm Phase 3 action closure | PER-01 | Epic 10 (F10) | US-10.3: View Conditional Pass Action Tracking Across All Views | JTBD-01.2: Phase 3 breadcrumb transitions from Conditional Pass to Completed once A3-001 is VerifiedClosed — visible on all nine views without navigation | R7 |
| Record Gate 4 Decision — record Conditional Pass at Gate 3 | PER-01 | Epic 10 (F10) | US-10.2: Record a Conditional Pass and Track Its Actions | JTBD-01.2: Gate 3 Conditional Pass creates A3-001 with blocking = true and due_gate = 4 so the condition cannot be silently bypassed | R4 |
| Record Gate 4 Decision — record Gate 4 Pass | PER-01 | Epic 10 (F10) | US-10.1: Select Gate Outcome at Any Gate | JTBD-01.2: Gate 4 Pass is only selectable after all four A4-001…A4-004 actions and A3-001 are VerifiedClosed; decision record captures AI recommendation, role, comments, and artifact versions | R7 |
| Review Technical Checklist — work through PCB Layout/CDR checklist | PER-01 | Epic 9 (F9) | US-9.3: Use the Technical Checklist Workspace (AV-06) | JTBD-01.3: Technical Checklist Workspace renders Phase 4 PCB Layout/CDR items with evidence and status fields; no invented checklist items appear for Phase 2 or Phases 5–9 | R7 |
| Review AI Recommendation — see advisory recommendation before deciding | PER-01 | Epic 10 (F10) | US-10.4: Review AI Recommendation Before Making Gate Decision | JTBD-01.2: AI Recommendation panel shows recommended outcome, rationale, and "Advisory Only" label; human radio buttons are not pre-selected | R7 |

---

### PER-02: Priya Nair — Program / Project Manager
**Journey:** JRN-02.1 — Gate 2 Decision Moment: Requirements Testability Finding, Rerun, and Gate 2 Pass

| Activity | Persona | Epic | Stories | NaC | Release |
|----------|---------|------|---------|-----|---------|
| Monitor Lifecycle — open Product Lifecycle View, scan breadcrumb states | PER-02 | Epic 0 (F0) | US-0.3: View Persistent Lifecycle Breadcrumbs on All Views | JTBD-02.2: Breadcrumbs on all nine views show accurate phase/gate states at all times so Priya does not need to ask engineers for program status | R1 |
| Monitor Lifecycle — open Project Overview, review phase health | PER-02 | Epic 9 (F9) | US-9.1: Navigate Project Overview and Product Lifecycle View | JTBD-02.2: AV-02 shows all 10 phases with breadcrumb state indicators so Priya can identify Phase 2 "Awaiting Human Decision" without opening any other system | R1 |
| Monitor Lifecycle — view all blocking actions in one workspace | PER-02 | Epic 9 (F9) | US-9.4: View All Findings and Blocking Actions in AV-07 | JTBD-02.2: Findings and Actions Workspace lists all blocking actions prominently at top so Priya can identify what is holding up progression within 2 minutes | R7 |
| Run lifecycle through all gates — orchestrator control | PER-02 | Epic 0 (F0) | US-0.1: Run the Full Lifecycle Through G0–G9 | JTBD-02.1: All 10 phases and gates are in sequential order; no phase advances without an explicit human gate decision | R1 |
| Run lifecycle through all gates — orchestrator commands | PER-02 | Epic 0 (F0) | US-0.2: Use Orchestrator Control Commands | JTBD-02.1: pause, resume, retry, cancel, run-to-gate, and targeted-rerun commands enable Priya to control demo flow and recover from errors without restarting | R1 |
| Run lifecycle through all gates — confirm AI cannot approve | PER-02 | Epic 0 (F0) | US-0.4: Confirm AI Cannot Approve Any Gate | JTBD-02.1: Any attempt to submit a gate decision without a human reviewer_role returns HTTP 403 so Priya can assure stakeholders that AI has zero gate authority | R1 |
| Enforce artifact count across all phases | PER-02 | Epic 1 (F1) | US-1.1: Verify Exactly One External and One Internal Input Per Phase | JTBD-02.1: System rejects a second input of either type per phase so every gate package reflects a clean, controlled artifact count | R2 |
| Enforce output count across all phases | PER-02 | Epic 1 (F1) | US-1.2: Verify One or Two Outputs Per Phase | JTBD-02.1: System rejects a third output or a gate-pack artifact as a phase output so AV-08 is always built from structured state | R2 |
| Maintain single source of truth | PER-02 | Epic 4 (F4) | US-4.1: Access a Single Source of Truth Across All Phases | JTBD-02.1: All nine views read from the same ProjectState so there is never a discrepancy between what Phase Workspace shows and what Gate Review Workspace shows | R1 |
| Access full audit history | PER-02 | Epic 4 (F4) | US-4.2: Access the Full Audit History at Any Time | JTBD-02.3: AV-09 shows all intake events and gate decisions immutably so Priya can satisfy an audit inquiry without consulting any engineer | R2 |
| Block phase execution until inputs are ready | PER-02 | Epic 2 (F2) | US-2.2: Block Phase Execution Until Both Inputs Are Ready | JTBD-02.1: Phase Execution Status shows "Waiting for User Input" or "Waiting for Synthetic Sample Ingestion" so Priya can see exactly what is blocking a run | R2 |
| View full intake workflow in AV-04 | PER-02 | Epic 2 (F2) | US-2.5: View Full Intake Workflow in AV-04 | JTBD-02.3: AV-04 shows per-field validation results, version history, and diff controls for any phase so Priya can audit exactly what was submitted and when | R2 |
| Review Gate Workspace — open Gate 2 workspace, review AI rec | PER-02 | Epic 9 (F9) | US-9.5: Use the Gate Review Workspace (AV-08) | JTBD-02.1: AV-08 is built dynamically from ProjectState showing inputs, outputs, check results, findings, open actions, and AI recommendation so no pre-meeting gate pack is required | R7 |
| Inspect Finding — detect Phase 2 testability issue | PER-02 | Epic 6 (F6) | US-6.1: Detect Phase 2 Requirements Testability Issue | JTBD-02.2: Finding F2-001 is raised automatically for REQ-THERM-004 with severity Major and blocking status so Priya does not need to ask the engineering team for status | R3 |
| Approve Clarification Action — approve blocking corrective action | PER-02 | Epic 10 (F10) | US-10.1: Select Gate Outcome at Any Gate | JTBD-02.1: Gate Conditional Pass at Gate 2 creates a tracked action with blocking = true; Pass is not selectable until action is VerifiedClosed | R7 |
| Confirm Rerun — validate correction cycle scope in Audit View | PER-02 | Epic 4 (F4) | US-4.2: Access the Full Audit History at Any Time | JTBD-02.3: Audit View records the rerun event with input version, invalidated checks, rerun checks, and timestamp in one panel — no email reconstruction required | R2 |
| Navigate breadcrumbs across all views | PER-02 | Epic 9 (F9) | US-9.6: Navigate Breadcrumbs Across All Nine Views | JTBD-02.2: Clicking a Completed or Current breadcrumb from any view navigates directly to that phase's workspace so Priya can audit any phase without leaving the cockpit | R1 |
| Confirm token optimisation | PER-02 | Epic 7 (F7) | US-7.1: Confirm Reference Documents Are Indexed Once | JTBD-02.1: Reference documents are never included in full in any agent context so the system stays within token budgets across all 10 phases | R1 |
| Use compact phase summaries as upstream context | PER-02 | Epic 7 (F7) | US-7.2: Use Compact Phase Summaries as Upstream Context | JTBD-02.1: Approved prior phases are represented as ≤400-token summaries so downstream agents never receive full prior-phase documents | R1 |
| Retry a failed gate | PER-02 | Epic 10 (F10) | US-10.5: Retry a Failed Gate After Correction | JTBD-02.1: Retrying a GateFailed phase preserves the original Fail decision record and requires full correction cycle before Pass is selectable | R7 |

---

### PER-03: Claire Ashby — Commercial / Proposal Reviewer
**Journey:** JRN-03.1 — Phase 0 Commercial Assessment: Opportunity Package Upload, Simulated Intake, Gap Matrix Review, Gate 0 Pass

| Activity | Persona | Epic | Stories | NaC | Release |
|----------|---------|------|---------|-----|---------|
| Open Phase 0 Workspace — see two input slots with correct labels | PER-03 | Epic 1 (F1) | US-1.3: Confirm Per-Phase Input/Output Assignments | JTBD-03.1: Phase 0 shows exactly one User-Provided slot and one Simulated Connector slot — labeled "Preloaded Synthetic Sample — No live Salesforce connection" — so stakeholders are never misled | R3 |
| Upload Customer Package — upload file, see validation feedback | PER-03 | Epic 2 (F2) | US-2.1: Upload a User-Provided File and See Validation Results | JTBD-03.1: Validation errors identify the specific field that failed with plain-language description so Claire can self-serve the correction without calling an engineer | R2 |
| Upload Customer Package — validate compact artifact standards | PER-03 | Epic 8 (F8) | US-8.1: Generate and Validate Compact XLSX Outputs | JTBD-03.1: Gap Matrix is ≤10 rows with stable IDs and a synthetic disclaimer visible at the top so Claire can review it in a single session | R3 |
| Upload Customer Package — validate compact DOCX outputs | PER-03 | Epic 8 (F8) | US-8.2: Generate and Validate Compact DOCX/PDF Outputs | JTBD-03.1: Opportunity Summary is ≤2 pages with required sections and synthetic disclaimer so Claire can reach a commercial gate decision in a single reading | R3 |
| Ingest Simulated Sample — confirm "Ingest Sample" action | PER-03 | Epic 2 (F2) | US-2.3: Ingest a Simulated External-System Sample | JTBD-03.1: "Ingest Sample" button requires explicit user action and shows a confirmation dialog; auto-ingestion is prohibited so Claire controls exactly when Phase 0 starts | R2 |
| Trigger Phase 0 Execution — confirm both inputs Ready | PER-03 | Epic 2 (F2) | US-2.2: Block Phase Execution Until Both Inputs Are Ready | JTBD-03.1: "Run Phase 0" is active only when both inputs are in Ready status so Claire cannot start a run without confirming the simulated sample is ingested | R2 |
| Review Opportunity Summary and Gap Matrix — open in Artifact Viewer | PER-03 | Epic 9 (F9) | US-9.2: Work in the Phase Workspace (AV-03) | JTBD-03.1: Phase Workspace output panel lists Opportunity Summary and Gap Matrix with version and approval status so Claire knows which outputs to open for review | R4 |
| Review Opportunity Summary and Gap Matrix — download approved outputs | PER-03 | Epic 8 (F8) | US-8.3: Download Approved Phase Outputs with Full Provenance | JTBD-03.1: Artifact Viewer Download button provides any approved Phase 0/1 output with provenance metadata so Claire can share correctly labeled deliverables with stakeholders | R7 |
| Review AI Recommendation — see advisory recommendation | PER-03 | Epic 10 (F10) | US-10.4: Review AI Recommendation Before Making Gate Decision | JTBD-03.3: AI Recommendation panel in Gate 0 workspace shows recommended outcome, rationale, and "Advisory Only" label so Claire can weigh the AI analysis without being bound by it | R7 |
| Record Gate 0 Pass — select Pass, enter commercial rationale | PER-03 | Epic 10 (F10) | US-10.1: Select Gate Outcome at Any Gate | JTBD-03.3: Gate 0 decision record stores AI recommendation, human disposition, Claire's comments, timestamp, and artifact versions so the commercial baseline is formally documented without email | R7 |
| Review and approve Phase 1 Costed Proposal | PER-03 | Epic 1 (F1) | US-1.3: Confirm Per-Phase Input/Output Assignments | JTBD-03.2: Phase 1 outputs are Costed Proposal (≤2 pp) and Resource Schedule (≤10 rows), both with synthetic disclaimer, so Claire can approve the commercial baseline in a single session | R3 |

---

### PER-04: James Okoro — Quality / Manufacturing Engineer
**Journey:** JRN-04.1 — Phase 6 Manufacturing Readiness: Cpk Failure, Corrective Action, Revised MES Sample, Gate 6 Pass

| Activity | Persona | Epic | Stories | NaC | Release |
|----------|---------|------|---------|-----|---------|
| Open Phase 6 Workspace — confirm both inputs Ready | PER-04 | Epic 2 (F2) | US-2.2: Block Phase Execution Until Both Inputs Are Ready | JTBD-04.2: Phase Workspace shows color-coded intake status badges distinguishing simulated from user-provided input so James can confirm both inputs at a glance | R2 |
| Open Phase 6 Workspace — trigger execution | PER-04 | Epic 2 (F2) | US-2.4: Review Input Readiness Panel for Both Inputs | JTBD-04.2: Input Readiness Panel shows the Manufacturing Process & Capability Package as "Synthetic System Input Ready" and Customer Production-Readiness Package as "User Input Ready" so James knows both sources are confirmed | R2 |
| Inspect Cpk Deterministic Check — view formula, result, threshold | PER-04 | Epic 5 (F5) | US-5.4: Inspect the Phase 6 Cpk Calculation Result | JTBD-04.2: Cpk check result shows formula, μ, σ, USL, LSL, unit, computed Cpk (4 d.p.), threshold 1.33, and Pass/Fail status — computed outside LLM — so James can verify the formula without parsing raw JSON | R5 |
| Review MRL Scorecard and PPAP/FAI Index | PER-04 | Epic 8 (F8) | US-8.1: Generate and Validate Compact XLSX Outputs | JTBD-04.2: MRL Scorecard and PPAP/FAI Readiness Index are both ≤10 rows with stable IDs and source references so James can confirm Cpk is the only blocking item | R5 |
| Approve Corrective Action — approve Cpk corrective action | PER-04 | Epic 6 (F6) | US-6.3: Approve Corrective Actions (Pattern) | JTBD-04.2: Corrective action approval form includes a required rationale field so James's specific expectations for the revised MES sample are recorded in ProjectState — not left in email | R5 |
| Ingest Revised MES Sample — confirm revised sample, monitor rerun | PER-04 | Epic 3 (F3) | US-3.2: Ingest a Revised Synthetic System Sample | JTBD-04.2: "Ingest Revised Sample" requires explicit user action; only the Cpk check reruns; MRL and PPAP outputs are unaffected; Audit View records the full rerun scope | R5 |
| Compare Original and Revised Cpk Results — side by side | PER-04 | Epic 3 (F3) | US-3.3: View Version History and Compare Artifact Versions | JTBD-04.2: Artifact Viewer shows original Cpk Fail (0.87) alongside revised Cpk Pass (1.45) in a fixed-column layout with both input versions labeled so James can confirm the correction for QA | R7 |
| Review Phase 5 V&V Matrix — thermal exceedance surfaced automatically | PER-04 | Epic 6 (F6) | US-6.4: Review Phase 5 Thermal Finding and Approve Correction | JTBD-04.1: V&V Matrix flags TP-CASE-1 = 91°C vs ≤85°C criterion automatically as F5-001 Critical so James does not need to manually cross-reference any external test data file | R5 |
| Capture Phase 7 lessons learned | PER-04 | Epic 6 (F6) | US-6.5 (Pattern) | JTBD-04.3: Lessons-Learned Register is a structured XLSX (≤10 rows) with stable IDs and retrievable from Artifact Viewer with full provenance — not a Word document distributed by email | R5 |
| Record Gate 6 Pass — review AI recommendation, select Pass | PER-04 | Epic 10 (F10) | US-10.1: Select Gate Outcome at Any Gate | JTBD-04.2: Gate 6 Pass is only selectable after the revised Cpk check passes (1.45 ≥ 1.33); decision record includes Cpk result version, corrective action reference, James's comments, and timestamp | R7 |
| Monitor Phase 8 obsolescence finding | PER-04 | Epic 6 (F6) | US-6.5: Review Phase 8 Obsolescence Finding and Approve Gate 8 Pass | JTBD-04.1: F8-001 flags IGBT-HV-800-A with ObsolescenceRisk = Critical automatically from the simulated supply-risk forecast so James can approve Gate 8 Pass to initiate EOL | R6 |

---

## NaC Derivation Table

| JTBD ID | Outcome | Journey Stage | NaC | Story |
|---------|---------|---------------|-----|-------|
| JTBD-01.1 | Verify all four Phase 4 deterministic check results without manual recomputation | JRN-01.1: Inspect Deterministic Checks | All four check results (clearance, derating, test-point, cross-artifact) displayed with formula, threshold, unit, result, and Pass/Fail — no external spreadsheet required to interpret any result | US-5.1, US-5.2, US-5.3 |
| JTBD-01.1 | Phase 4 check workspace loads in under 10 seconds | JRN-01.1: Inspect Deterministic Checks | Phase 4 deterministic check panel displays all four check results in under 10 seconds after AI draft completes | US-5.1 |
| JTBD-01.1 | Original and revised results preserved side by side | JRN-01.1: Review Revised Design | Artifact Viewer comparison mode shows original (four Fail) and revised (four Pass) check results side by side with version labels — differences highlighted | US-3.3 |
| JTBD-01.2 | Phase 3 conditional-pass action closure confirmed in Gate 4 workspace | JRN-01.1: Record Gate 4 Decision | When Marcus opens the Gate 4 Gate Review Workspace, A3-001 is shown with status "Closed", the artifact version that confirmed closure, and the human approver — Pass is no longer blocked | US-6.2, US-10.2, US-10.3 |
| JTBD-01.2 | Gate 4 Pass blocked while A3-001 is Open | JRN-01.1: Approve Corrective Actions | Pass radio button is disabled with message "Blocking actions must be closed before recording a Pass outcome" while A3-001.status ≠ VerifiedClosed | US-6.2 |
| JTBD-01.3 | Technical checklist completed in structured workspace | JRN-01.1: Review Technical Checklist | Phase 4 PCB Layout/CDR checklist items are displayed with evidence, status, and action fields in AV-06; no checklist content appears for Phase 2 or Phases 5–9 | US-9.3 |
| JTBD-02.1 | Gate decision reached in one session without email assembly | JRN-02.1: Review Gate Workspace | AV-08 surfaces AI recommendation, open findings, blocking actions, and artifact versions reviewed — and records Pass/Conditional Pass/Fail with comments — without navigating to any external system | US-9.5, US-10.1 |
| JTBD-02.1 | AI cannot autonomously approve any gate | JRN-02.1: Record Gate 2 Pass | Any attempt to submit a gate decision without a human reviewer_role returns HTTP 403 with GATE_AI_PROHIBITED | US-0.4, US-10.4 |
| JTBD-02.2 | All conditional-pass actions visible in one workspace | JRN-02.1: Inspect Finding | All open actions are listed in AV-07 with action ID, source phase/gate, blocking/parallel status, due phase, and required closure evidence — blocking actions visually distinguished | US-9.4, US-10.3 |
| JTBD-02.2 | Breadcrumb states accurate across all views at all times | JRN-02.1: Monitor Lifecycle | Breadcrumbs on all nine views show correct state (Completed, Current, Awaiting Human Decision, Conditional Pass, Blocked, Upcoming, Closed) without manual refresh | US-0.3, US-9.6 |
| JTBD-02.3 | Correction cycle reconstructable from Audit View | JRN-02.1: Confirm Rerun | Every rerun event in AV-09 records input version that triggered rerun, checks invalidated, checks rerun, and timestamp — Artifact Viewer shows original and revised results side by side | US-4.2, US-3.3 |
| JTBD-03.1 | Bid/no-bid assessment completed in one session | JRN-03.1: Review Opportunity Summary and Gap Matrix | Claire can review Opportunity Summary (≤2 pages) and Gap Matrix (≤10 rows) — both labeled "Synthetic POC Data" — within the same session with no email coordination required | US-8.1, US-8.2 |
| JTBD-03.1 | Simulated intake labeled clearly at all times | JRN-03.1: Ingest Simulated Sample | "Simulated Connector — No live connection" label is always visible on the SI input slot; "Ingest Sample" requires explicit confirmation; auto-ingestion returns HTTP 403 AUTO_INGEST_PROHIBITED | US-2.3 |
| JTBD-03.2 | Costed Proposal formally approved before Gate 1 | JRN-03.1: Review Phase 1 outputs | Gate 1 decision record stores AI recommendation, Claire's comments, approval timestamp, and exact artifact versions approved — no separate email needed | US-1.3, US-10.1 |
| JTBD-03.3 | Commercial gate decision formally recorded | JRN-03.1: Record Gate 0 Pass | Gate 0 decision stored in ProjectState with all required fields and immediately visible to Priya in the Audit View — no email follow-up needed | US-10.1, US-4.2 |
| JTBD-04.1 | Thermal exceedance surfaced automatically | JRN-04.1: Review Phase 5 V&V Matrix | V&V Matrix flags TP-CASE-1 (91°C vs ≤85°C) as F5-001 Critical automatically when Phase 5 processes; James does not manually cross-reference any external test data file | US-6.4 |
| JTBD-04.2 | Cpk evidence visible in Gate 6 workspace | JRN-04.1: Inspect Cpk Deterministic Check | Cpk check result displays formula, threshold, unit, result (0.87 Fail initially), and Pass/Fail status — computed outside LLM — alongside MRL Scorecard and PPAP/FAI Readiness Index | US-5.4, US-8.1 |
| JTBD-04.2 | Only Cpk check reruns after revised MES sample | JRN-04.1: Ingest Revised MES Sample | After "Ingest Revised Sample" action, dependency graph invalidates only the Cpk check; MRL and PPAP outputs are unaffected; Audit View records full rerun scope | US-3.2 |
| JTBD-04.3 | Lessons-Learned Register retrievable from Artifact Viewer | JRN-04.1: Capture Phase 7 findings | Phase 7 Lessons-Learned Register (structured XLSX, ≤10 rows) is available in Artifact Viewer with full provenance metadata and is directly downloadable — not a Word document | US-8.1, US-8.3 |

---

## Release Planning

### Release R1 — Foundation
**Theme:** ProjectState, gated orchestrator, breadcrumbs, Lifecycle/Project views, token optimisation

**Stories:** US-0.1, US-0.2, US-0.3, US-0.4, US-4.1, US-7.1, US-7.2, US-9.1, US-9.6

**Personas Served:** PER-02 (primary — lifecycle oversight and breadcrumb navigation)
**JTBD Addressed:** JTBD-02.1 (gate decision reach), JTBD-02.2 (lifecycle breadcrumb accuracy)

**Acceptance Gate:**
- [ ] All 10 phases and 10 gates are in the orchestrator; happy-path storyline is runnable end-to-end (US-0.1)
- [ ] Breadcrumbs are present and accurate on all nine views with correct state labels (US-0.3)
- [ ] AI cannot approve any gate in any code path — verified by automated end-to-end test (US-0.4)
- [ ] AV-01 and AV-02 load from ProjectState with correct phase and gate state (US-9.1)
- [ ] Reference document index initialized at startup; full docs never in agent context (US-7.1)
- [ ] Compact phase summaries (≤400 tokens) generated after each gate decision (US-7.2)

---

### Release R2 — Input Intake Framework
**Theme:** Upload workflow, simulated intake, validation, versioning, audit log

**Stories:** US-1.1, US-1.2, US-2.1, US-2.2, US-2.3, US-2.4, US-2.5, US-3.1, US-3.2, US-4.2

**Personas Served:** PER-01 (upload and versioning), PER-02 (execution control, audit), PER-03 (upload, simulated intake)
**JTBD Addressed:** JTBD-01.1 (input readiness), JTBD-02.1 (execution gating), JTBD-02.3 (audit trail), JTBD-03.1 (intake clarity)

**Acceptance Gate:**
- [ ] User-provided file upload validates all required fields with field-specific error messages (US-2.1)
- [ ] Phase execution is blocked until both inputs are in Ready status (US-2.2)
- [ ] "Ingest Sample" action is explicit; auto-ingestion returns HTTP 403 (US-2.3)
- [ ] Revised file upload creates a new version; prior version is preserved; targeted rerun executes (US-3.1)
- [ ] Revised synthetic sample ingestion reruns only affected checks (US-3.2)
- [ ] AV-09 Audit View is immutable; all intake events are visible with full provenance (US-4.2)
- [ ] Artifact count enforcement rejects second input of either type (US-1.1, US-1.2)

---

### Release R3 — Lifecycle Agents 0–2
**Theme:** Phase Workspaces for G0 (Commercial), G1 (Proposal), G2 (Requirements)

**Stories:** US-1.3, US-6.1, US-8.1 (partial), US-8.2 (partial)

**Personas Served:** PER-03 (G0, G1 commercial assessment), PER-02 (G2 requirements testability)
**JTBD Addressed:** JTBD-03.1 (bid/no-bid in one session), JTBD-03.2 (costed proposal approval), JTBD-02.2 (testability finding detection)

**Acceptance Gate:**
- [ ] Phase 0 input/output configuration matches specification: Customer Opportunity Package (UP) + Capability Assessment (SI) → Opportunity Summary + Gap Matrix (US-1.3)
- [ ] Phase 1 outputs are Costed Proposal (≤2 pp) and Resource Schedule (≤10 rows) with synthetic disclaimer (US-1.3)
- [ ] Phase 2 testability check flags REQ-THERM-004 automatically as F2-001 Major; Gate 2 advances after human-approved clarification (US-6.1)
- [ ] At least one complete journey (Claire: Phase 0 → Gate 0 Pass) is executable end-to-end (JRN-03.1)

---

### Release R4 — Lifecycle Agents 3–4 (Flagship)
**Theme:** G3 Schematic Review / PDR, G4 PCB Layout Review + CDR, four deterministic checks, correction cycle

**Stories:** US-5.1, US-5.2, US-5.3, US-6.2, US-6.3, US-9.2, US-8.2 (Phase 4 outputs)

**Personas Served:** PER-01 (design review, deterministic checks, correction cycle — flagship persona)
**JTBD Addressed:** JTBD-01.1 (deterministic checks), JTBD-01.2 (Phase 3 action closure)

**Acceptance Gate:**
- [ ] All four Phase 4 deterministic checks run outside LLM and produce structured results with formula, threshold, unit, result, Pass/Fail (US-5.1)
- [ ] HV clearance check shows per-net-pair detail; VBUS+ to GND_SHIELD: 6.2 mm vs 8.0 mm = Fail on initial run (US-5.2)
- [ ] Derating and test-point checks show per-component/per-net detail (US-5.3)
- [ ] A3-001 is created as Blocking at Gate 3 Conditional Pass and blocks Gate 4 Pass until VerifiedClosed (US-6.2)
- [ ] All four A4-001…A4-004 actions are approved; targeted rerun verifies all checks Pass on revised design (US-6.3)
- [ ] Marcus's flagship journey (JRN-01.1) is fully executable from upload through Gate 4 Pass (JTBD-01.1 success measure: ≤5 min to confirm all four check results)

---

### Release R5 — Lifecycle Agents 5–7
**Theme:** G5 V&V, G6 Manufacturing Readiness + Cpk, G7 Production Transfer

**Stories:** US-5.4, US-6.4, US-3.2 (Phase 6 rerun), US-8.1 (MRL/PPAP/V&V outputs)

**Personas Served:** PER-04 (V&V review, Cpk check, lessons learned — James's flagship journey)
**JTBD Addressed:** JTBD-04.1 (thermal exceedance auto-detection), JTBD-04.2 (Cpk evidence), JTBD-04.3 (Lessons-Learned Register)

**Acceptance Gate:**
- [ ] Phase 5 V&V Matrix automatically flags TP-CASE-1 = 91°C vs ≤85°C as F5-001 Critical (US-6.4)
- [ ] Phase 6 Cpk check shows SOLDER_JOINT_SHEAR_HV_BUS: Cpk = 0.87 Fail; formula, inputs, threshold all displayed (US-5.4)
- [ ] Revised MES sample ingestion reruns only Cpk check; Audit View records full rerun scope (US-3.2)
- [ ] Revised Cpk = 1.45 Pass; original and revised results preserved with distinct version_ref values (US-5.4)
- [ ] Phase 7 Lessons-Learned Register is structured XLSX (≤10 rows) retrievable from Artifact Viewer (JTBD-04.3)
- [ ] James's flagship journey (JRN-04.1) is fully executable from Phase 6 open through Gate 6 Pass (JTBD-04.2 success measure: complete Gate 6 within one session)

---

### Release R6 — Lifecycle Agents 8–9
**Theme:** G8 Obsolescence / EOL recommendation, G9 Project closure

**Stories:** US-6.5

**Personas Served:** PER-04 (obsolescence finding review), PER-02 (project closure oversight)
**JTBD Addressed:** JTBD-04.1 (obsolescence finding auto-detection)

**Acceptance Gate:**
- [ ] Phase 8 Obsolescence Forecast flags IGBT-HV-800-A with ObsolescenceRisk = Critical automatically as F8-001 (US-6.5)
- [ ] Gate 8 Pass transitions project to Phase 9; Gate 9 Pass sets project_status = Closed (US-6.5)
- [ ] Phase 9 breadcrumb shows Closed (🔒 grey) across all views (US-0.3)
- [ ] Happy-path gate storyline (G0–G9) is fully executable end-to-end (US-0.1)

---

### Release R7 — Cross-cutting Views + Demo Polish
**Theme:** Gate Review Workspace, Technical Checklist, Artifact Viewer (comparison mode), Findings & Actions, demo integration

**Stories:** US-3.3, US-9.3, US-9.4, US-9.5, US-10.1, US-10.2, US-10.3, US-10.4, US-10.5, US-8.3

**Personas Served:** PER-01, PER-02, PER-03, PER-04 (all personas — gate decision and cross-view workflows)
**JTBD Addressed:** JTBD-01.2 (gate decision), JTBD-01.3 (checklist), JTBD-02.1 (gate workspace), JTBD-02.3 (audit/comparison), JTBD-03.3 (commercial gate record), JTBD-04.2 (Gate 6 decision record)

**Acceptance Gate:**
- [ ] AV-08 built dynamically from ProjectState; no separate gate-pack artifact created (US-9.5)
- [ ] Pass radio button disabled while any blocking action is Open; Conditional Pass requires at least one tracked action (US-10.1, US-10.2)
- [ ] AV-06 renders checklist only for Phases 0, 1, 3, 4; "No technical review mapped" shown for Phase 2 and Phases 5–9 (US-9.3)
- [ ] AV-05 comparison mode shows two versions side by side with differences highlighted (US-3.3)
- [ ] AV-07 Blocking Actions section surfaces all open blocking actions prominently at top (US-9.4)
- [ ] AI Recommendation panel always shows "Advisory Only — Human Decision Required" label (US-10.4)
- [ ] All four persona flagship journeys (JRN-01.1, JRN-02.1, JRN-03.1, JRN-04.1) are demo-ready end-to-end
- [ ] Artifact Viewer Download provides approved outputs with full provenance metadata (US-8.3)

---

## Coverage Analysis

### Persona Coverage by Release

| Persona | R1 | R2 | R3 | R4 | R5 | R6 | R7 |
|---------|----|----|----|----|----|----|-----|
| PER-01 Marcus (Engineering) | — | US-2.4, US-3.1 | — | US-5.1–5.3, US-6.2–6.3, US-9.2 | — | — | US-3.3, US-9.3, US-10.2, US-10.4 |
| PER-02 Priya (PM) | US-0.1–0.4, US-4.1, US-7.1, US-7.2, US-9.1, US-9.6 | US-1.1, US-1.2, US-2.2, US-2.5, US-4.2 | US-6.1 | — | — | US-6.5 | US-9.4, US-9.5, US-10.1, US-10.3, US-10.5 |
| PER-03 Claire (Commercial) | — | US-2.1, US-2.3 | US-1.3, US-8.1, US-8.2 | US-9.2 | — | — | US-10.1, US-10.4, US-8.3 |
| PER-04 James (Quality/Mfg) | — | US-2.2, US-2.4 | — | — | US-5.4, US-6.4, US-3.2, US-8.1 | US-6.5 | US-3.3, US-10.1 |

### JTBD Coverage by Release

| JTBD ID | Priority | Release | Stories | NaC Count |
|---------|----------|---------|---------|-----------|
| JTBD-01.1 | P0 | R4 (check panel), R2 (input readiness) | US-5.1, US-5.2, US-5.3, US-2.4, US-3.1, US-3.3 | 3 |
| JTBD-01.2 | P0 | R4 (tracking), R7 (gate decision) | US-6.2, US-6.3, US-10.2, US-10.3, US-10.1 | 2 |
| JTBD-01.3 | P1 | R7 | US-9.3 | 1 |
| JTBD-02.1 | P0 | R1 (orchestrator), R2 (execution), R7 (gate workspace) | US-0.1–0.4, US-1.1, US-1.2, US-7.1, US-7.2, US-9.5, US-10.1 | 3 |
| JTBD-02.2 | P0 | R1 (breadcrumbs), R3 (finding), R7 (AV-07) | US-0.3, US-9.1, US-9.4, US-9.6, US-6.1 | 2 |
| JTBD-02.3 | P1 | R2 (audit log), R7 (comparison) | US-4.2, US-3.3 | 2 |
| JTBD-03.1 | P0 | R2 (intake), R3 (Phase 0 workspace) | US-2.1, US-2.3, US-1.3, US-8.1, US-8.2 | 2 |
| JTBD-03.2 | P0 | R3 (Phase 1 workspace) | US-1.3 | 1 |
| JTBD-03.3 | P1 | R7 | US-10.1, US-10.4, US-4.2 | 2 |
| JTBD-04.1 | P0 | R5 (Phase 5 V&V), R6 (Phase 8 obsolescence) | US-6.4, US-6.5 | 2 |
| JTBD-04.2 | P0 | R5 (Cpk check) | US-5.4, US-3.2, US-8.1 | 3 |
| JTBD-04.3 | P1 | R5 (Phase 7 register) | US-8.1, US-8.3 | 1 |

### Gap Analysis

**Journey stages with no mapped stories:**
- Phase 9 EOL workspace (Claire / Priya): US-6.5 covers the gate decision but no dedicated upload story exists for the Customer EOL Package — covered by the general US-2.1 upload pattern; not a gap in demonstrated scenarios.

**JTBD outcomes with no dedicated NaC:**
- JTBD-01.3 (Technical checklist) is P1 and deferred to R7; no R1–R6 gap because the core demonstration does not require checklist completion for stakeholder validation.
- JTBD-03.2 (Costed Proposal approval) is addressed via the US-1.3 per-phase assignment story; no dedicated Phase 1 agent story exists beyond the intake pattern — acceptable for POC scope.

**Orphan stories (not mapped to any journey stage):**
- US-7.1 (Reference document indexing) — infrastructure; serves JTBD-02.1 operationally but has no direct user-facing journey stage touchpoint. Correctly classified as a platform story with no journey mapping.
- US-7.2 (Compact phase summaries) — same as US-7.1: infrastructure story without a user-facing journey touchpoint. Not an orphan in the functional sense; it enables all journey stages without appearing in any one stage.

> Both US-7.1 and US-7.2 are flagged as **platform infrastructure stories** rather than orphans. They are required for all journeys to function but do not appear in any persona's step-by-step journey narrative.

**Personas without journey coverage in a release:**
- PER-01 has no journey coverage in R3, R5, R6 — correct, as Marcus is an engineering reviewer for Phases 3–4 only (primary) and those phases are in R4/R7.
- PER-03 has no journey coverage in R1, R5, R6 — correct, as Claire's scope is Phases 0–1 (R2/R3) and gate decisions (R7).
- PER-04 has no journey coverage in R1, R3, R4 — correct, as James's scope is Phases 5–8 (R5/R6) and gate decisions (R7).

All gaps are by design and reflect the phase-segmented nature of the lifecycle. No persona is left without journey coverage across the full roadmap.

---

## NaC-to-Acceptance Criteria Mapping

| NaC | Story | AC from UserStories | Aligned? |
|-----|-------|---------------------|---------|
| All four Phase 4 check results displayed with formula, threshold, unit, result, Pass/Fail — no external spreadsheet required | US-5.1 | "Each check result record includes: inputs used, formula/method, threshold, unit, result value, status, source reference, and known limitation" | Yes |
| HV clearance per-net-pair detail; VBUS+ to GND_SHIELD: measured = 6.2 mm, threshold = 8.0 mm, margin = −1.8 mm, Fail | US-5.2 | "Initial run shows VBUS+ to GND_SHIELD: measured = 6.2 mm, threshold = 8.0 mm, margin = −1.8 mm, status = Fail" | Yes |
| Gate 4 Pass blocked while A3-001 is Open | US-6.2 | "Pass radio button is disabled while A3-001 has status ≠ VerifiedClosed; message displayed: 'Blocking actions must be closed before recording a Pass outcome'" | Yes |
| A3-001 visible on all views as Blocking until VerifiedClosed | US-10.3 | "Phase 3 breadcrumb shows Conditional Pass state (🔶 orange) on all nine views until A3-001 is verified closed" | Yes |
| Artifact Viewer comparison shows original and revised side by side with differences highlighted | US-3.3 | "Comparison mode presents two selected versions side by side with differences highlighted" | Yes |
| Revised file upload triggers targeted rerun; only affected checks rerun; original results preserved | US-3.1 | "The orchestrator runs targeted-rerun computing only the checks whose dependency graph traces back to the revised input; original and revised results both stored with distinct version_ref values" | Yes |
| Breadcrumbs accurate on all nine views without manual refresh | US-0.3 | "Breadcrumbs are present and accurate on all nine application views (AV-01 through AV-09)" | Yes |
| AV-09 Audit View shows rerun event with input version, invalidated checks, rerun checks, timestamp | US-4.2 | "Full Intake Event Log shows all fields: phase, logical input, intake behavior, user action, system represented, status, source artifact, normalized artifact, version, validation result, timestamp" | Yes |
| "Ingest Sample" requires explicit confirmation; auto-ingestion returns HTTP 403 AUTO_INGEST_PROHIBITED | US-2.3 | "Automatic ingestion without user action is prohibited; attempting programmatic auto-ingest returns HTTP 403 with error code AUTO_INGEST_PROHIBITED" | Yes |
| Opportunity Summary ≤2 pages and Gap Matrix ≤10 rows; both labeled "Synthetic POC Data" | US-8.1, US-8.2 | "Agent-generated XLSX artifacts have ≤10 meaningful rows…"; "Agent-generated DOCX/PDF artifacts have ≤2 pages…"; "Mandatory disclaimer is present in a dedicated Synthetic Data Disclaimer metadata field" | Yes |
| Cpk check shows formula, μ, σ, USL, LSL, computed Cpk (4 d.p.), threshold 1.33, Pass/Fail — computed outside LLM | US-5.4 | "Cpk check result includes: characteristic ID, characteristic name, sample size, mean, std deviation, USL, LSL, unit, computed Cpk (4 decimal places), threshold (1.33), status" | Yes |
| V&V Matrix flags TP-CASE-1 = 91°C vs ≤85°C as F5-001 Critical automatically | US-6.4 | "Finding F5-001 is raised automatically: 'Thermal measurement at TP-CASE-1 (91°C) exceeds acceptance criterion of 85°C defined in REQ-THERM-004'; severity = Critical; seeded = true" | Yes |
| Gate decision record stores AI recommendation, human disposition, reviewer role, comments, timestamp, artifact versions | US-10.1 | "Gate decision provenance record includes: decision ID, gate number, AI recommendation, human disposition, reviewer role, decision, comments, timestamp, artifact versions reviewed, open conditions, and is_final = true" | Yes |
| AI Recommendation panel shows "Advisory Only — Human Decision Required" label; cannot be hidden | US-10.4 | "'Advisory Only — Human Decision Required' label is always visible in the AI Recommendation panel; it cannot be hidden or suppressed by configuration" | Yes |

All NaC are directly traceable to specific UserStories acceptance criteria. No NaC-to-AC misalignment identified.

---

*Document generated by Pivota Spec Framework*
*Last updated: 2026-08-15*
*Project: EVINV-POC-001 | PRD: PRD-TTCopilot-v1.0 | Synthetic POC Data. Not TT Electronics Product Data. Not for Design, Fabrication, Certification, Procurement, or Production.*
