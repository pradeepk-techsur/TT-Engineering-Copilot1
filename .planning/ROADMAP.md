# Roadmap: TT Manufacturing and Engineering Copilot

## Overview

A proof-of-concept multi-agent, human-in-the-loop AI copilot that walks a fictional EV traction inverter (EV-INV-800, EVINV-POC-001) through TT Electronics' full Product Lifecycle Process — Phase 0 through Phase 9, Gate 0 through Gate 9. The build proceeds in seven software-development phases: first the shared foundation and orchestration layer, then the input intake framework, then batched lifecycle phase agents (Phases 0–2, 3–4 with deterministic tool layer, 5–7, 8–9), and finally the cross-cutting UI views (Gate Review, Checklist, Audit, Artifact Viewer) with a demo-ready polish pass.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - ProjectState, gated orchestrator state machine, shared data model, lifecycle breadcrumbs, and Project/Lifecycle views
- [x] **Phase 2: Input Intake Framework** - User-upload workflow, simulated-system intake workflow, validation, readiness controls, versioning, and intake audit log
- [ ] **Phase 3: Lifecycle Phases 0–2 Agents** - Phase Workspaces for Gates 0–2; synthetic samples and seeded issues; Opportunity Summary, Gap Matrix, Costed Proposal, Schedule, RTM, and Testability Report outputs
- [x] **Phase 4: Lifecycle Phases 3–4 Agents (Flagship)** - Phase Workspaces for Gates 3–4; deterministic tool layer (clearance, derating, test-point coverage, cross-artifact consistency); EVINV-POC-STD-001; Conditional Pass for Gate 3; multi-issue correction cycle for Gate 4
- [ ] **Phase 5: Lifecycle Phases 5–7 Agents** - Phase Workspaces for Gates 5–7; Cpk check; seeded issues and correction cycles; V&V Matrix, Gate 5 Summary, MRL Scorecard, PPAP/FAI Index, Lessons-Learned Register, Transfer Report
- [ ] **Phase 6: Lifecycle Phases 8–9 Agents** - Phase Workspaces for Gates 8–9; EOL storyline triggered by fictional discontinuance notice; institutional memory output; project closure
- [ ] **Phase 7: Cross-Cutting Views and Demo Polish** - Gate Review Workspace (dynamic from state), Technical Checklist Workspace, Audit View, Artifact Viewer with version history; full happy-path demo script and final polish pass

## Phase Details

---

### Phase 1: Foundation

**Status**: Complete
**Completed**: 2026-08-16
**Goal**: The application has a running, navigable skeleton — a versioned ProjectState, a gated orchestrator state machine that enforces human-only gate decisions, a shared data model covering all ten lifecycle phases, persistent lifecycle breadcrumbs on every view, and the Project Overview and Product Lifecycle views — so every subsequent phase has a deterministic execution substrate to build on.

**Depends on**: Nothing (first phase)

**Requirements**: LC-01, LC-02, LC-03, LC-04, LC-05, LC-06, LC-07, LC-08, PS-01, PS-02, PS-03, PS-04, AV-01, AV-02, AV-10, TO-01, TO-02, TO-03, TO-04

**Success Criteria** (what must be TRUE):
  1. The Product Lifecycle View displays all ten phases (0–9) and ten gates (0–9) with correct lifecycle states (Upcoming, Current, Completed, etc.); breadcrumbs appear on every view and are selectable; technical reviews appear exactly where mapped (Kickoff→Phase 0, SRR→Phase 1, Schematic→Phase 3, CDR/PCB Layout→Phase 4) and nowhere else.
  2. The orchestrator state machine enforces that no phase may advance to the next without a recorded human gate decision; attempting to call an auto-approve code path is blocked at the framework level — the AI recommendation field is advisory only.
  3. Gate outcomes are exactly three (Pass, Conditional Pass, Fail); the orchestrator supports pause, resume, retry, cancel, run-to-gate, idempotent resume, and targeted rerun; triggering any of these operations from the UI produces the correct state transition without corrupting ProjectState.
  4. One versioned ProjectState instance covers all ten phases, holding the artifact registry, provenance, dependencies, findings, actions, gate decisions, and audit history; a developer can inspect the state object and see the correct phase-scoped structure with version tracking.
  5. Agent context construction retrieves only the active phase inputs, relevant approved upstream compact summaries, open actions, and selected checklist/rules — not full prior-phase documents; this is verifiable by inspecting prompt payloads during a test run.

**Plans:** 4 plans

Plans:
- [ ] 01-01-PLAN.md — Project scaffold, Docker Compose, PostgreSQL schema (all 11 tables), migrations, seed
- [ ] 01-02-PLAN.md — Gated orchestrator state machine, gate enforcement, context assembly service
- [ ] 01-03-PLAN.md — App shell, dark theme, shadcn/ui, breadcrumb, Project Overview (AV-01), Product Lifecycle View (AV-02)
- [ ] 01-04-PLAN.md — Gap closure: audit_history REVOKE enforcement + stub pages for /findings-actions, /audit, /phase/[id]

---

### Phase 2: Input Intake Framework

**Status**: completed (2026-08-17)
**Last Updated**: 2026-08-17T18:07:41Z
**Completed**: 2026-08-17
**Goal**: Both intake workflows — USER-PROVIDED FILE and SIMULATED EXTERNAL-SYSTEM INTAKE — are fully implemented as reusable framework components so that any phase can declare its intake configuration and receive correct intake behavior without additional per-phase intake code.

**Depends on**: Phase 1

**Requirements**: II-01, UP-01, UP-02, UP-03, UP-04, UP-05, SE-01, SE-02, SE-03, SE-04, SE-05, IR-01, IR-02, IR-03, IV-01, IV-02, IV-03, IV-04, CA-04, CA-05, AV-04

**Success Criteria** (what must be TRUE):
  1. For a USER-PROVIDED FILE input, the Phase Workspace shows the artifact name, required content description, supported formats, size guidance, upload prompt, and "Awaiting User Input" status before any file is uploaded; uploading a file with a missing required field displays the specific validation error and blocks phase execution; uploading a corrected file advances status to "User Input Ready" — the system never silently substitutes synthetic data.
  2. For a SIMULATED EXTERNAL-SYSTEM INTAKE input, the Phase Workspace identifies the represented system, displays the preloaded synthetic sample labelled as synthetic, states no live connection exists, and requires an explicit "Ingest Sample" action before ingestion proceeds; automatic ingestion without user action is prohibited and verifiable.
  3. The Input Readiness Panel for every phase shows both inputs with their artifact name, intake behavior, active version, validation status, and a Ready / Not Ready indicator; phase execution is disabled until both inputs are active, validated, and ready; the Phase Execution Status field cycles through the correct states (Waiting for User Input → Ready to Run → Processing → Awaiting Human Decision → Complete).
  4. When a revised version of a user-provided input is uploaded, a new version is created, the prior version is preserved and accessible for comparison, only affected checks are invalidated and rerun, original and revised results remain traceable, and the term "replacement input" does not appear anywhere in the UI or audit log.
  5. Every intake event is recorded with phase, logical input, intake behavior, user action, system represented, status, source artifact, normalized artifact, version, validation result, and timestamp; the full log is queryable from the Audit View; labels "Connected to [SYSTEM]" and "Live [SYSTEM] Data" never appear.

**Plans:** 5 plans

Plans:
- [x] 02-01-PLAN.md — Intake service layer: UP/SI handlers, file validator (9 rules), audit event writer, 11 XLSX samples
- [x] 02-02-PLAN.md — Versioning API: upload-revised, version history endpoint, dependency graph BFS invalidation
- [x] 02-03-PLAN.md — Phase Workspace (AV-03) + Input Intake Panel (AV-04) UI components + 29 Playwright tests
- [x] 02-04-PLAN.md — Gap closure: remove per-card Synthetic POC Data disclaimer; Version History section heading + improved empty state
- [x] 02-05-PLAN.md — Gap closure: fix fileValidator Rules 3+4 false MISMATCH errors (findMetadataValue helper, config.productName)

---

### Phase 3: Lifecycle Phases 0–2 Agents

**Status**: completed (2026-08-18)
**Last Updated**: 2026-08-18T04:07:17Z
**Goal**: Users can execute the first three lifecycle phases (Phase 0 – Opportunity Assessment, Phase 1 – Proposal/Quoting, Phase 2 – Requirements Definition) end-to-end through their Phase Workspaces, with correct synthetic inputs pre-loaded, correct outputs generated, the seeded Phase 2 issue surfaced, and human gate decisions recorded — demonstrating G0 Pass, G1 Pass, and G2 Pass-after-clarification on the happy path.

**Depends on**: Phase 2

**Requirements**: II-02, II-03, II-04, II-05, II-06, II-07, OP-01, OP-02, OP-03, SI-01, CA-01, CA-02, CA-03, GR-01, GR-02, GR-03, GR-04, GR-05, GR-06

**Success Criteria** (what must be TRUE):
  1. Phase 0 Phase Workspace accepts the Customer Opportunity Package (user file) and ingests the Capability and Opportunity Assessment Package (simulated: Salesforce/Cora) via the Ingest Sample workflow; the AI generates an Opportunity Summary (DOCX/PDF, ~1–2 pages) and a Capability-Match and Critical-Gap Matrix (XLSX, ~10 rows), both carrying the synthetic disclaimer; the human can Pass, Conditional Pass, or Fail Gate 0 — the AI recommendation is visible but non-binding.
  2. Phase 1 Phase Workspace similarly produces a Costed Proposal (DOCX/PDF) and a Resource and Milestone Schedule (XLSX); Gate 1 records a Pass; both outputs conform to compact artifact standards (≤10 rows, 6–10 fields, stable IDs, units, source refs, provenance).
  3. Phase 2 Phase Workspace produces an RTM (XLSX) and a Requirements Quality and Testability Report (DOCX/PDF); the seeded issue (one efficiency/thermal requirement without a measurable acceptance criterion) is objectively flagged by the testability deterministic check, visible in findings; after human-approved clarification and rerun, the issue is resolved and Gate 2 records a Pass.
  4. Gate Review Workspace for Gates 0, 1, and 2 is rendered dynamically from structured state (active inputs, outputs, findings, open actions, AI recommendation, human comments, human decision) — no separate gate-pack artifact is generated; gate decisions are persisted with reviewer role, rationale, timestamp, and artifact versions reviewed.
  5. All six outputs (two per phase) are within compact artifact size limits; XLSX artifacts have ≤10 meaningful rows and 6–10 fields; DOCX/PDF artifacts are ≤2 pages; every artifact carries the synthetic disclaimer and provenance fields.

**Plans:** 6 plans

Plans:
- [x] 03-01-PLAN.md — BaseAgent LLM wrapper, artifact generator (disclaimer injection, compact standards), Phase 0 Bid/No-Bid agent, Gate 0 review/decide API
- [x] 03-02-PLAN.md — Phase 1 Proposal & Cost agent; Phase 2 Requirements agent + RequirementTestability deterministic check (SI-01: REQ-THERM-004 seeded issue + correction cycle); Gate 1 and Gate 2 routes
- [x] 03-03-PLAN.md — Gate Review Workspace (AV-08): AIRecommendationPanel with advisory label, GateDecisionSelector with no pre-selection + AlertDialog, dynamic rendering from ProjectState; Playwright tests for G0–G2
- [x] 03-04-PLAN.md — Gap closure: xlsx bundling fix (serverExternalPackages), idempotent artifact registry (delete-before-insert), Run Phase button wired to POST /api/phases/{id}/execute
- [x] 03-05-PLAN.md — LLM API Key Configuration UI: encrypted key storage (AES-256-GCM) in DB, /settings page with password-style input, masked status badge in AppShell header, BaseAgent patched to read key from DB at call time; key never returned to browser or logged in plaintext
- [x] 03-06-PLAN.md — Gap closure: OutputsPanel client component with SWR polling of /api/phases/{id}/outputs; replaces static phaseConfig placeholder in page.tsx; closes UAT Tests 1, 4, 5

---

### Phase 4: Lifecycle Phases 3–4 Agents (Flagship)

**Status**: completed (2026-08-18)
**Last Updated**: 2026-08-18T20:07:23Z
**Completed**: 2026-08-18
**Goal**: Users can execute Phase 3 (Preliminary Design Review) and Phase 4 (Detailed Design / CDR) end-to-end, with the full deterministic tool layer operational — clearance comparison, derating calculation, test-point coverage check, and cross-artifact consistency check running outside the LLM against EVINV-POC-STD-001 — demonstrating G3 Conditional Pass (coolant-connector action tracked), the multi-issue correction cycle for G4 (four seeded defects found in the initial design, then verified corrected in the revised design including closure of the G3 action), and G4 Pass after correction.

**Depends on**: Phase 3

**Requirements**: II-08, II-09, II-10, II-11, OP-04, OP-05, SI-02, SI-03, SI-04, SS-01, DP-01, DP-02, DP-03, DP-04, DP-05, DP-07, CA-01, CA-02, CA-03, AV-03, AV-05, AV-06, AV-07

**Success Criteria** (what must be TRUE):
  1. Phase 3 Phase Workspace produces a PDR Readiness Summary (DOCX/PDF) and an Early DFM/DFA Findings and Risk Register (XLSX); the seeded coolant-connector orientation assembly-access concern is present in the findings register; Gate 3 records a Conditional Pass with the action tracked (Action ID, description, owner role, blocking status, due phase/gate, required closure evidence); the action remains visible in all subsequent views until closed.
  2. Phase 4 initial-run Phase Workspace produces a DFM and Standards Audit (XLSX, ~10 findings) and a BOM Health and Manufacturability Report (DOCX/PDF); the four seeded defects are present: one clearance below EVINV-POC-STD-001 threshold, one capacitor below POC derating margin, one diagnostic net without accessible test point, and one BOM/design footprint mismatch — each identified by its respective deterministic check, not by LLM inference alone.
  3. Each of the four deterministic checks (cross-artifact consistency, HV clearance, derating, test-point coverage) produces a structured result record containing: inputs used, formula/method, threshold, unit, result, status (Pass/Fail), source reference, and limitation statement; these records are accessible in the Findings and Actions Workspace and in the audit log.
  4. Synthetic standard EVINV-POC-STD-001 ("EV Traction Inverter Design and Manufacturing Standard, POC Demonstration Edition", Version 1.0) is defined in the system, carries the label "Synthetic POC Standard, not an approved TT or industry standard", and its thresholds are referenced by the clearance and derating deterministic checks — the check results cite EVINV-POC-STD-001 as their source.
  5. After the user uploads a revised design baseline, Phase 4 reruns only the affected checks; the revised run shows all four defects corrected and the Gate 3 coolant-connector action verified closed; original and revised results are both preserved and comparably accessible via the Artifact Viewer with version history; Gate 4 records a Pass after correction.

**Plans:** 4 plans

Plans:
- [ ] 04-01-PLAN.md — Four deterministic check tools (zero LLM): HVClearance, ComponentDerating, TestPointCoverage, CrossArtifactConsistency; EVINV-POC-STD-001 synthetic standard definition; check runner API
- [ ] 04-02-PLAN.md — Phase 3 PDR agent (SI-02 coolant connector, Conditional Pass, A3-001 creation); Phase 4 DFM flagship agent (runs 4 checks before LLM, SI-03a–d, A3-001 closure on revised run); Gate 3 and Gate 4 routes
- [ ] 04-03-PLAN.md — Artifact Viewer (AV-05), Findings & Actions Workspace (AV-07) with blocking action banner, Technical Checklist (AV-06) gated to phases 0/1/3/4; Playwright tests for all three views
- [ ] 04-04-PLAN.md — Gap closure: Phase 3 phaseInputs seed rows, OutputsPanel guard (phases 3–4), isRevised POST body + button label, deterministic check results card in Gate 4 Review

---

### Phase 5: Lifecycle Phases 5–7 Agents

**Status**: In Progress
**Goal**: Users can execute Phase 5 (Validation), Phase 6 (Manufacturing Readiness), and Phase 7 (Transfer and Lessons Learned) end-to-end, with the Cpk deterministic check operational for Phase 6, seeded issues surfaced and resolved with correction cycles in Phases 5 and 6, and Gate 5 Pass-after-correction, Gate 6 Pass-after-correction, and Gate 7 Pass recorded on the happy path.

**Depends on**: Phase 4

**Requirements**: II-12, II-13, II-14, II-15, II-16, II-17, OP-06, OP-07, OP-08, SI-05, SI-06, SI-07, DP-06, CA-01, CA-02, CA-03

**Success Criteria** (what must be TRUE):
  1. Phase 5 Phase Workspace produces a V&V Matrix (XLSX) and Gate 5 Summary (DOCX/PDF); the seeded thermal result that exceeds the synthetic acceptance criterion is flagged in findings; after human approval of corrective action and upload of a revised Validation Evidence Package, only the affected test results are rerun; Gate 5 records a Pass after correction; original and revised V&V results are both accessible.
  2. Phase 6 Phase Workspace produces an MRL Scorecard (XLSX) and a PPAP/FAI Readiness Index and Action List (XLSX); the Cpk deterministic check runs outside the LLM for the critical assembly characteristic, produces a structured result record (inputs, formula, synthetic threshold, result, status, source), and the seeded below-threshold Cpk value is identified; after human approval and ingestion of a revised synthetic manufacturing sample, affected results rerun; Gate 6 records a Pass after correction.
  3. Phase 7 Phase Workspace produces a Structured Lessons-Learned Register (XLSX) and a Transfer-Completeness and Improvement-Action Report (DOCX/PDF); the seeded torque variation in one mounting operation is captured in the lessons-learned register with a finding ID; Gate 7 records a Pass.
  4. All six outputs (two per phase) conform to compact artifact standards; the Cpk check result does not rely on LLM computation — it runs as a deterministic tool and its structured result is distinguishable from AI-generated narrative in the UI.
  5. The Cpk check result is accessible even if Phase 6 completes and the user later navigates back — version history and provenance are preserved in the Artifact Viewer; the "below-threshold" finding from the initial run is retained alongside the corrected-run result so that no long-running result is silently lost.

**Plans:** 3 plans

Plans:
- [ ] 05-01-PLAN.md — CpkCalculation deterministic check (zero LLM, formula: min((USL-μ)/(3σ), (μ-LSL)/(3σ))); Phase 5 V&V agent (SI-05: TP-CASE-1 91°C > 85°C, correction cycle, original result preserved); Gate 5 routes
- [ ] 05-02-PLAN.md — Phase 6 MRL/PPAP agent (Cpk check before LLM; SI-06: SOLDER_JOINT_SHEAR_HV_BUS Cpk 0.87 < 1.33; revised synthetic sample; Gate 6 routes)
- [ ] 05-03-PLAN.md — Phase 7 Lessons-Learned agent (SI-07: MOP-012 torque variation, F7-001 seeded=true; Gate 7 routes); Playwright tests for Phases 5–7 intake configurations and prohibited labels

---

### Phase 6: Lifecycle Phases 8–9 Agents

**Goal**: Users can execute Phase 8 (Product Health Monitoring) and Phase 9 (End of Life) end-to-end, with the fictional discontinuance notice triggering the EOL storyline, Gate 8 Pass initiating Phase 9, the EOL decision and project closure recorded, and project status set to Closed after Gate 9 Pass — completing the full happy-path gate storyline.

**Depends on**: Phase 5

**Requirements**: II-18, II-19, II-20, II-21, OP-09, OP-10, SI-08, CA-01, CA-02, CA-03

**Success Criteria** (what must be TRUE):
  1. Phase 8 Phase Workspace ingests two simulated inputs (Supplier Lifecycle/Availability Package and Production/BOM/Yield/Cost Package); the fictional discontinuance notice for the primary power semiconductor is present in the supplier feed and surfaces in the Obsolescence and Supply-Risk Forecast (XLSX); the Yield, Quality, and Financial-Anomaly Report (DOCX/PDF) includes the Gate 8 EOL recommendation; Gate 8 records a Pass that explicitly initiates Phase 9.
  2. Phase 9 Phase Workspace accepts the Customer EOL/Last-Time-Buy/Retention Package (user file) and ingests the Final Product/Demand/Asset/Archive Package (simulated: ERP/Cora/archive); the AI generates an EOL and Last-Time-Buy Decision Pack (DOCX/PDF) and a Project Closure and Institutional-Memory Record (XLSX or DOCX); Gate 9 records a Pass and project status becomes "Closed" in ProjectState.
  3. After Gate 9, the Product Lifecycle View displays all ten phases as Completed and all ten gates as Passed (with Gate 3 showing Conditional Pass closure evidence and Gates 5 and 6 showing correction cycle resolution); the happy-path gate storyline (G0 Pass → G1 Pass → G2 Pass-after-clarification → G3 Conditional Pass → G4 Pass-after-correction → G5 Pass-after-correction → G6 Pass-after-correction → G7 Pass → G8 Pass → G9 Pass and Closed) is fully represented in ProjectState and visible in the UI.
  4. Both Phase 8 and Phase 9 outputs carry the synthetic disclaimer and provenance fields; the institutional-memory output in Phase 9 is within compact artifact limits; project Closed status does not revert on page reload — it is persisted in ProjectState.

**Plans**: TBD

---

### Phase 7: Cross-Cutting Views and Demo Polish

**Goal**: The Gate Review Workspace, Technical Checklist Workspace, Audit View, and Artifact Viewer with version history are complete and demo-ready; all nine application views function correctly with breadcrumbs; the full happy-path demo can be walked from Gate 0 to Gate 9 without encountering broken states, missing data, or terminology violations.

**Depends on**: Phase 6

**Requirements**: AV-03, AV-05, AV-06, AV-07, AV-08, AV-09, GR-01, GR-02, GR-03, GR-04, GR-05, GR-06, LC-08

**Success Criteria** (what must be TRUE):
  1. The Gate Review Workspace for every gate renders dynamically from ProjectState (active inputs, outputs, findings, open actions, AI recommendation, human comments, human decision) — a developer can inspect network traffic and confirm no separate gate-pack artifact is fetched; gate decisions require an explicit human action (even in demo mode, the presenter must confirm); silent gate approval is impossible.
  2. The Technical Checklist Workspace displays selected checklist items sourced from the Power Supplies reference checklists for Phases 0, 1, 3, and 4 (Kickoff, SRR, Schematic, PCB Layout/CDR); each item shows evidence, status, and action fields; no checklist items are invented for Phase 2 or Phases 5–9.
  3. The Audit View shows the full intake event log with all nine fields (phase, logical input, intake behavior, user action, system represented, status, source artifact, version, validation result, timestamp) for every intake event across all ten phases; the log is filterable and all events from correction cycles and revised-version workflows are present.
  4. The Artifact Viewer shows version history and provenance for any artifact; selecting a prior version displays the original content alongside the revised content; corrected Phase 4 inputs, revised Phase 5 validation evidence, and revised Phase 6 manufacturing data are all navigable with their version histories intact.
  5. All nine application views are accessible from breadcrumbs; TT Electronics Product Lifecycle Process terminology is used throughout (no generic chatbot language); the terms "replacement input," "Connected to [SYSTEM]," and "Live [SYSTEM] Data" do not appear in any view, label, log entry, or tooltip; a complete walk of the happy-path demo from Gate 0 to Gate 9 completes without errors.

**Plans**: TBD

---

## Progress

**Execution Order:** 1 → 2 → 3 → 4 → 5 → 6 → 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 4/4 | Complete | 2026-08-16 |
| 2. Input Intake Framework | 5/5 | Complete | 2026-08-17 |
| 3. Lifecycle Phases 0–2 Agents | 6/6 | Complete | 2026-08-18 |
| 4. Lifecycle Phases 3–4 Agents (Flagship) | 4/4 | Complete | 2026-08-18 |
| 5. Lifecycle Phases 5–7 Agents | 0/TBD | Not started | - |
| 6. Lifecycle Phases 8–9 Agents | 0/TBD | Not started | - |
| 7. Cross-Cutting Views and Demo Polish | 0/TBD | Not started | - |