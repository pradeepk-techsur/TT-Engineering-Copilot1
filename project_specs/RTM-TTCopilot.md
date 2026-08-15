# Requirements Traceability Matrix
## TT Manufacturing and Engineering Copilot

**Document ID:** RTM-TTCopilot-v1.0
**Project:** EVINV-POC-001
**Product:** EV-INV-800 Demonstration Traction Inverter
**Status:** Active
**Date:** 2026-08-15
**Classification:** Internal POC — Synthetic Data Only
**Built from:** PRD-TTCopilot-v1.0, FRD-TTCopilot-v1.0, TechArch-TTCopilot-v1.0, UserStories-TTCopilot.md, PROJECT.md

> **Synthetic POC Data. Not TT Electronics Product Data. Not for Design, Fabrication, Certification, Procurement, or Production.**

---

## 1. Overview

This Requirements Traceability Matrix (RTM) provides bidirectional traceability between all specification documents for the TT Manufacturing and Engineering Copilot (EVINV-POC-001). It ensures every product requirement is implemented through a functional specification, realized in a technical architecture, and validated by at least one user story acceptance criterion.

The TT Engineering Copilot walks a fictional EV traction inverter (EV-INV-800) through TT Electronics' full Product Lifecycle Process (ENG 001 v4.1), Phases 0–9 and Gates 0–9. The RTM spans eleven features (F0–F10), 79 functional requirements across 16 requirement groups (LC, AC, II, UP, SE, IR, IV, OP, CA, DP, SI, TO, PS, AV, GR, SS), 42 user stories, and the technical architecture specification. All features are Priority P0 (Critical — MVP requirement).

Traceability is structured at five levels: (1) PRD features define the product vision and capabilities; (2) FRD requirements define the behavioral contract; (3) TechArch specifications define the implementation architecture, data model, and API surface; (4) User Stories define the acceptance criteria; and (5) Test Cases define the verification methods. The RTM is read forward (PRD → FRD → TechArch → User Stories → Tests) for completeness and backward (Tests → User Stories → TechArch → FRD → PRD) for coverage analysis.

Every requirement is P0 (Critical). The POC has a single demonstration scenario — NPI A / Category 1, EV-INV-800 synthetic product, happy-path gate storyline G0 Pass through G9 Pass/Close — and all features and requirements are necessary to execute that scenario end-to-end.

---

## 2. Requirements Summary

### 2.1 Requirements by Group

The following 79 requirements across 16 groups are traced in this RTM:

- **Lifecycle Orchestration (LC-01 to LC-08) — 8 requirements:** Phase 0–9 sequential coverage; gated state-machine; human-only gate decisions; AI recommendation advisory only; orchestrator control commands (pause, resume, retry, cancel, run-to-gate, targeted-rerun); dependency-aware invalidation; persistent lifecycle breadcrumbs; technical review mapping enforcement
- **Artifact Count (AC-01 to AC-05) — 5 requirements:** Exactly one external input per phase; exactly one internal input per phase; one or two outputs per phase; gate-pack artifacts excluded from output count; count enforcement at schema/API level
- **Input-Intake Configuration (II-01 to II-21) — 21 requirements:** Predetermined intake behavior; no user-selectable mode; USER-PROVIDED FILE workflow (display, validate, confirm); SIMULATED EXTERNAL-SYSTEM INTAKE workflow (label, ingest, record); prohibited labels enforcement; intake event audit record; input readiness panel; phase execution status display
- **User-Provided File Workflow (UP-01 to UP-05) — 5 requirements:** Display artifact name/content/format/guidance; validate file type, parseability, project ID, product name, phase, revision, units, identifiers, rows, pages, consistency, sections; reject on failure without synthetic substitution; status transition to `User Input Ready`; "Upload Revised Version" label enforcement
- **Simulated External-System Intake (SE-01 to SE-05) — 5 requirements:** Display system name and preloaded synthetic sample; display Simulated Connector and Preloaded Synthetic Sample labels; require explicit "Ingest Sample" action; prohibit auto-ingest; status transition to `Synthetic System Input Ready`
- **Input Readiness and Phase Execution (IR-01 to IR-03) — 3 requirements:** Phase execution blocked until both inputs ready; input readiness panel fields on Phase Workspace; Phase Execution Status display with all six states
- **Input Versioning (IV-01 to IV-04) — 4 requirements:** Single active version enforcement; prior version retention; dependency graph traversal for affected scope; targeted rerun with side-by-side result preservation
- **Outputs and Phase Outputs (OP-01 to OP-10) — 10 requirements:** Per-phase output specifications for all 10 phases (Phase 0–9); Gate Review Workspace rendered from ProjectState (no artifact emitted); per-phase artifact naming, format, and size guidance
- **Compact Artifact Standards (CA-01 to CA-05) — 5 requirements:** XLSX ≤10 meaningful rows; 6–10 essential fields per record; stable IDs, units, source refs; DOCX/PDF ≤2 pages; mandatory disclaimer on every artifact
- **Deterministic Processing (DP-01 to DP-07) — 7 requirements:** Check result schema (inputs, formula, threshold, unit, result, status, source, limitation); Phase 4 cross-artifact consistency check; Phase 4 HV clearance check; Phase 4 component derating check; Phase 4 test-point coverage check; Phase 6 Cpk calculation; additional deterministic logic (cost, traceability, testability, action closure, inventory)
- **Seeded Issues (SI-01 to SI-08) — 8 requirements:** Phase 2 requirements testability (REQ-THERM-004); Phase 3 coolant-connector assembly access; Phase 4 HV clearance failure (VBUS+ to GND_SHIELD); Phase 4 derating failure (C_BULK_3); Phase 4 test-point failure (DIAG_TEMP_IGBT_CASE); Phase 4 cross-artifact mismatch (C_HV_1); Phase 5 thermal exceedance (TP-CASE-1); Phase 6 Cpk failure (SOLDER_JOINT_SHEAR_HV_BUS); Phase 7 torque variation (MOP-012-BRACKET-MOUNT); Phase 8 IGBT obsolescence (IGBT-HV-800-A)
- **Token Optimization (TO-01 to TO-04) — 4 requirements:** Reference documents indexed once at startup, cached; relevant passages only in agent context; compact approved-phase summaries as upstream context; deterministic checks outside LLM
- **Shared ProjectState (PS-01 to PS-04) — 4 requirements:** Single versioned ProjectState as source of truth; per-phase state objects; cross-phase artifact registry, dependency graph, findings, actions, gate decisions, audit history; schema-level count enforcement
- **Application Views (AV-01 to AV-10) — 10 requirements:** AV-01 Project Overview; AV-02 Product Lifecycle View; AV-03 Phase Workspace; AV-04 Input Intake and Validation Panel; AV-05 Artifact Viewer; AV-06 Technical Checklist Workspace; AV-07 Findings and Actions Workspace; AV-08 Gate Review Workspace; AV-09 Audit View; AV-10 Persistent Lifecycle Breadcrumbs (behavior across all views)
- **Gate Review Model (GR-01 to GR-06) — 6 requirements:** Gate Review Workspace rendered from ProjectState; exactly three outcomes (Pass, Conditional Pass, Fail); AI recommendation advisory only; human decision required at every gate; Conditional Pass action tracking; full gate decision provenance
- **Synthetic Standard (SS-01) — 1 requirement:** EVINV-POC-STD-001 labeled as "Synthetic POC Standard" on every reference

### 2.2 Feature-to-Requirement Group Mapping

| Feature ID | Feature Name | Requirement Groups | Total Requirements |
|---|---|---|---|
| F0 | Lifecycle Orchestration and Gated State Machine | LC-01 to LC-08 | 8 |
| F1 | Artifact-Count Discipline | AC-01 to AC-05, OP-01 to OP-10 | 15 |
| F2 | Input Intake Framework | II-01 to II-21, UP-01 to UP-05, SE-01 to SE-05, IR-01 to IR-03 | 34 |
| F3 | Input Versioning and Dependency-Aware Revision | IV-01 to IV-04 | 4 |
| F4 | Shared ProjectState | PS-01 to PS-04 | 4 |
| F5 | Deterministic Engineering Checks | DP-01 to DP-07 | 7 |
| F6 | Seeded Issues and Correction Cycles | SI-01 to SI-08 | 8 |
| F7 | Token Optimization and Context Management | TO-01 to TO-04 | 4 |
| F8 | Compact Artifact Standards | CA-01 to CA-05, SS-01 | 6 |
| F9 | Application Views — Nine-View Web Gate Cockpit | AV-01 to AV-10 | 10 |
| F10 | Gate Review Model | GR-01 to GR-06 | 6 |
| **Total** | | | **79** |

---

## 3. Primary Traceability Matrix

This table links each PRD feature to its FRD requirements, TechArch specifications (components, data model, API), and User Stories. All items are bidirectionally traceable.

### 3.1 F0: Lifecycle Orchestration and Gated State Machine

| PRD Feature | FRD Requirements | TechArch Specification | User Stories |
|---|---|---|---|
| F0: Lifecycle Orchestration | LC-01: Phase 0–9 and Gate 0–9 sequential coverage | Orchestrator (`src/server/orchestrator/stateMachine.ts`); phase state machine (Pending→AwaitingInputs→Running→AwaitingGate→GatePassed/GateConditional/GateFailed); `phase_states` table (DDL §3.3) | US-0.1: Run Full Lifecycle G0–G9 |
| F0: Lifecycle Orchestration | LC-02: Gated progression — human gate decisions only | `gateEnforcement.ts`; `POST /api/gates/{id}/decide` with `X-Reviewer-Role` header; AI actor blocklist; `gate_decisions` table with `is_final = true` (DDL §3.3) | US-0.4: Confirm AI Cannot Approve Any Gate |
| F0: Lifecycle Orchestration | LC-03: AI gate recommendation advisory only | `AIRecommendation` interface stored in `phase_states.ai_recommendation JSONB`; advisory panel in AV-08; "Advisory Only" label non-removable | US-10.4: Review AI Recommendation Before Gate Decision |
| F0: Lifecycle Orchestration | LC-04: Orchestrator control commands (pause, resume, retry, cancel, run-to-gate, targeted-rerun) | `commands.ts`; `targetedRerun.ts`; API endpoints: `POST /api/orchestrator/phase/{id}/pause`, `/resume`, `/retry`, `/cancel`; `POST /api/orchestrator/run-to-gate` | US-0.2: Use Orchestrator Control Commands |
| F0: Lifecycle Orchestration | LC-05: Dependency-aware invalidation on revised input | `targetedRerun.ts`; `DependencyGraph` interface; `dependencyGraph` stored in `project_state`; `input_versions.affected_scope` field | US-0.2: Use Orchestrator Control Commands; US-3.1: Upload Revised Version |
| F0: Lifecycle Orchestration | LC-06: Idempotent resume | `resume` command in `commands.ts` — no-op if already `Running` or `Complete`; returns current state | US-0.2: Use Orchestrator Control Commands |
| F0: Lifecycle Orchestration | LC-07: Persistent lifecycle breadcrumbs on all nine views | `GET /api/views/breadcrumbs`; `BreadcrumbsResponse` interface; breadcrumb states: Completed, Current, Awaiting Human Decision, Conditional Pass, Blocked, Upcoming, Closed | US-0.3: View Persistent Lifecycle Breadcrumbs |
| F0: Lifecycle Orchestration | LC-08: Technical review mapping enforced (Phase 0→Kickoff, Phase 1→SLR, Phase 3→Schematic/PDR, Phase 4→PCB Layout/CDR; none for Phase 2 or Phases 5–9) | `PhaseConfig.technical_review` (server-side constant); `ChecklistWorkspace` renders "No technical review mapped" for Phase 2, 5–9; `GET /api/views/phase/{id}/checklist` returns 404 for Phase 2, 5–9 | US-9.3: Use Technical Checklist Workspace |

### 3.2 F1: Artifact-Count Discipline

| PRD Feature | FRD Requirements | TechArch Specification | User Stories |
|---|---|---|---|
| F1: Artifact-Count Discipline | AC-01: Exactly one external input per phase | `UNIQUE(project_id, phase_id, input_role)` constraint on `phase_inputs` table; `ARTIFACT_COUNT_VIOLATION` error on second insert; `artifactCounter.ts` | US-1.1: Verify One External and One Internal Input Per Phase |
| F1: Artifact-Count Discipline | AC-02: Exactly one internal input per phase | Same as AC-01; `input_role IN ('external','internal')` enforced at DB level | US-1.1: Verify One External and One Internal Input Per Phase |
| F1: Artifact-Count Discipline | AC-03: One or two outputs per phase (max 2) | `phase_outputs` table; application-layer max-2 enforcement; `ARTIFACT_COUNT_VIOLATION` on third insert; `GET /api/phases/{id}/artifact-count` | US-1.2: Verify One or Two Outputs Per Phase |
| F1: Artifact-Count Discipline | AC-04: Gate-pack artifacts excluded from output count | `GateReview` rendered from `ProjectState` via `GET /api/gates/{id}/review`; no artifact emitted; `GATE_PACK_PROHIBITED` error if gate-pack registered as output | US-1.2: Verify One or Two Outputs Per Phase |
| F1: Artifact-Count Discipline | AC-05: Count enforcement at schema and API level | `POST /api/phases/{id}/validate-counts`; `GET /api/phases/{id}/config`; `PhaseConfig` (server-side immutable); schema validation before persist | US-1.1, US-1.2 |
| F1: Artifact-Count Discipline | OP-01 to OP-10: Per-phase input/output specifications (Phases 0–9) | `PhaseConfig` table (TechArch §3.4); phase configuration constants in `src/shared/constants/`; per-phase artifact names, intake behaviors, formats, size guidance | US-1.3: Confirm Per-Phase Input/Output Assignments |

### 3.3 F2: Input Intake Framework

| PRD Feature | FRD Requirements | TechArch Specification | User Stories |
|---|---|---|---|
| F2: Input Intake Framework | II-01: Predetermined intake behavior (not user-selectable) | `PhaseConfig.external_input.intake_behavior` and `.internal_input.intake_behavior` (immutable server-side constants); UI never shows intake-mode selector | US-2.4: Review Input Readiness Panel |
| F2: Input Intake Framework | II-02 to II-10: USER-PROVIDED FILE workflow (display, upload, validate, confirm, status transition) | `upWorkflow.ts`; multipart upload `POST /api/phases/{id}/inputs/external/upload`; validators/ directory (fileType, parseability, projectId, productName, phase, revision, units, identifiers, rowCount, pageCount, consistency, requiredSections) | US-2.1: Upload User-Provided File and See Validation Results |
| F2: Input Intake Framework | II-11 to II-16: SIMULATED EXTERNAL-SYSTEM INTAKE workflow (display, label, ingest action, normalize, record) | `siWorkflow.ts`; `POST /api/phases/{id}/inputs/external/ingest` with `confirm_viewed: true` required; `AUTO_INGEST_PROHIBITED` (403) if programmatic | US-2.3: Ingest Simulated External-System Sample |
| F2: Input Intake Framework | II-17: Prohibited labels enforcement | `PROHIBITED_LABELS` regex scanner in intake handler and artifact generation wrapper; `PROHIBITED_LABEL_DETECTED` (500) if detected; labels blocked: "Connected to [SYSTEM]", "Retrieved from [SYSTEM]", "Live [SYSTEM] Data", "replacement input" | US-2.3: Ingest Simulated External-System Sample |
| F2: Input Intake Framework | II-18: Intake event audit record for every intake action | `audit_history` table; `AuditEvent` interface with `event_type: "IntakeEvent"`; written by `upWorkflow.ts` and `siWorkflow.ts`; immutable (REVOKE UPDATE, DELETE) | US-2.4: Review Input Readiness Panel; US-4.2: Access Full Audit History |
| F2: Input Intake Framework | II-19 to II-21: Input readiness panel on Phase Workspace | `GET /api/phases/{id}/inputs`; `PhaseInputsResponse` interface; `InputReadinessSummary` with all required fields | US-2.4: Review Input Readiness Panel |
| F2: Input Intake Framework | UP-01 to UP-05: User-Provided File workflow details | `upWorkflow.ts`; validation error codes: `FILE_TYPE_INVALID`, `FILE_NOT_PARSEABLE`, `PROJECT_ID_MISMATCH`, `REQUIRED_SECTION_MISSING`, `ROW_COUNT_WARNING`; status: `User Input Ready`; "Upload Revised Version" label | US-2.1: Upload User-Provided File |
| F2: Input Intake Framework | SE-01 to SE-05: Simulated External-System Intake workflow details | `siWorkflow.ts`; "Simulated Connector — No live connection" label always visible; "Preloaded Synthetic Sample" label; "Ingest Sample" button disabled until View or Download; status: `Synthetic System Input Ready` | US-2.3: Ingest Simulated External-System Sample |
| F2: Input Intake Framework | IR-01: Phase execution blocked until both inputs ready | `INPUTS_NOT_READY` (409) if phase start attempted; `PhaseInputsResponse.phase_execution_status`; Run Phase button active only when `ReadyToRun` | US-2.2: Block Phase Execution Until Both Inputs Ready |
| F2: Input Intake Framework | IR-02: Input readiness panel with all required fields | `InputReadinessSummary` (logical_name, intake_behavior, system_represented, readiness_status, active_version, validation_issues, required_user_action, ready) | US-2.4: Review Input Readiness Panel |
| F2: Input Intake Framework | IR-03: Phase Execution Status display (6 states) | `GET /api/phases/{id}/execution-status`; `ExecutionStatusResponse`; states: WaitingForUserInput, WaitingForSyntheticSampleIngestion, ReadyToRun, Processing, AwaitingHumanDecision, Complete | US-2.2: Block Phase Execution Until Both Inputs Ready |

### 3.4 F3: Input Versioning and Dependency-Aware Revision

| PRD Feature | FRD Requirements | TechArch Specification | User Stories |
|---|---|---|---|
| F3: Input Versioning | IV-01: Single active version per logical input | `CREATE UNIQUE INDEX idx_input_versions_single_active ON input_versions(input_id) WHERE active = TRUE`; DB-level enforcement; `VERSION_INTEGRITY_VIOLATION` (500) if violated | US-3.3: View Version History and Compare Artifact Versions |
| F3: Input Versioning | IV-02: Prior version retention (no deletion) | `input_versions` table — `active` flag changes from true to false; no DELETE permitted; `invalidated_by` field links to superseding version | US-3.1: Upload Revised Version; US-3.3: View Version History |
| F3: Input Versioning | IV-03: Dependency graph traversal to compute affected scope | `targetedRerun.ts`; `DependencyGraph` interface; BFS traversal from revised input node; `AffectedScopeResponse`; `GET /api/phases/{id}/inputs/{type}/affected-scope` | US-3.1: Upload Revised Version; US-3.2: Ingest Revised Synthetic Sample |
| F3: Input Versioning | IV-04: Targeted rerun with side-by-side result preservation | `POST /api/orchestrator/targeted-rerun`; `check_results.superseded_by` self-reference; `check_results.invalidated` flag; `phase_outputs.review_required` flag; both original and revised results stored | US-3.1: Upload Revised Version; US-3.2: Ingest Revised Synthetic Sample |

### 3.5 F4: Shared ProjectState

| PRD Feature | FRD Requirements | TechArch Specification | User Stories |
|---|---|---|---|
| F4: Shared ProjectState | PS-01: Single versioned ProjectState as source of truth | `project_state` table with `state_version INTEGER NOT NULL`; optimistic concurrency; `GET /api/project/state`; all nine views read from same state | US-4.1: Access Single Source of Truth |
| F4: Shared ProjectState | PS-02: Per-phase state objects (10 phases) | `phase_states` table (10 rows); `PhaseState` TypeScript interface; `GET /api/project/state/phases/{id}` | US-4.1: Access Single Source of Truth |
| F4: Shared ProjectState | PS-03: Cross-phase artifact registry, dependency graph, findings, actions, gate decisions, audit history | `artifact_registry`, `check_results`, `findings`, `actions`, `gate_decisions`, `audit_history` tables; `ProjectState` TypeScript interface with all cross-phase arrays | US-4.1: Access Single Source of Truth; US-4.2: Access Full Audit History |
| F4: Shared ProjectState | PS-04: Schema-level count enforcement and immutability rules | `synthetic_data_indicator BOOLEAN NOT NULL DEFAULT TRUE CHECK (synthetic_data_indicator = TRUE)`; `is_final BOOLEAN NOT NULL DEFAULT TRUE` on gate decisions; `disclaimer_present BOOLEAN NOT NULL DEFAULT TRUE CHECK (disclaimer_present = TRUE)`; REVOKE UPDATE DELETE on audit_history | US-4.1: Access Single Source of Truth |

### 3.6 F5: Deterministic Engineering Checks

| PRD Feature | FRD Requirements | TechArch Specification | User Stories |
|---|---|---|---|
| F5: Deterministic Checks | DP-01: Check result schema | `CheckResult` TypeScript interface; `check_results` table (DDL §3.3); fields: check_id, check_type, phase_id, input_version_ids, formula_or_method, threshold, threshold_unit, result_value, result_unit, status, source_reference, limitation, items_checked, invalidated, superseded_by, run_at | US-5.1: View Deterministic Check Results for Phase 4 |
| F5: Deterministic Checks | DP-02: Phase 4 cross-artifact consistency check | `crossArtifactConsistencyCheck()` in `src/server/tools/`; seeded: C_HV_1 footprint 0805 vs 1206; finding F4-004; action A4-004 | US-5.1: View Deterministic Check Results; US-6.3: Approve Phase 4 Corrective Actions |
| F5: Deterministic Checks | DP-03: Phase 4 HV clearance check | `hvClearanceCheck()` in `src/server/tools/`; threshold 8.0 mm air / 5.0 mm creepage (EVINV-POC-STD-001 §3.1); seeded: VBUS+ to GND_SHIELD 6.2 mm vs 8.0 mm; finding F4-001; action A4-001 | US-5.2: Inspect HV Clearance Check Result |
| F5: Deterministic Checks | DP-04: Phase 4 component derating check | `componentDeratingCheck()` in `src/server/tools/`; threshold 50% voltage derating (EVINV-POC-STD-001 §3.3); seeded: C_BULK_3 4.4% vs 50%; finding F4-002; action A4-002 | US-5.3: Inspect Component Derating and Test-Point Coverage |
| F5: Deterministic Checks | DP-05: Phase 4 test-point coverage check | `testPointCoverageCheck()` in `src/server/tools/`; seeded: DIAG_TEMP_IGBT_CASE no accessible test point; finding F4-003; action A4-003 | US-5.3: Inspect Component Derating and Test-Point Coverage |
| F5: Deterministic Checks | DP-06: Phase 6 Cpk calculation | `cpkCalculation()` in `src/server/tools/`; formula: `Cpk = min((USL−μ)/(3σ), (μ−LSL)/(3σ))`; threshold 1.33 (EVINV-POC-STD-001 §5.1); seeded: SOLDER_JOINT_SHEAR_HV_BUS Cpk 0.87; finding F6-001 | US-5.4: Inspect Phase 6 Cpk Calculation |
| F5: Deterministic Checks | DP-07: Additional deterministic logic | `costCalculation()`, `traceabilityCompletenessCheck()`, `requirementTestabilityCheck()`, `actionClosureVerification()`, `inventoryReconciliation()` in `src/server/tools/`; `POST /api/checks/phase/{id}/run`; `POST /api/checks/{check_type}/run` | US-6.1: Detect Phase 2 Testability Issue; US-6.2: Phase 3 Conditional Pass |

### 3.7 F6: Seeded Issues and Correction Cycles

| PRD Feature | FRD Requirements | TechArch Specification | User Stories |
|---|---|---|---|
| F6: Seeded Issues | SI-01: Phase 2 requirements testability — REQ-THERM-004 | `requirementTestabilityCheck()`; finding F2-001 (seeded=true, severity=Major); action A2-001; revised input v2; check reruns Pass; Gate 2 Pass; synthetic samples: `phase2-ext-requirements-repo-icr.xlsx` | US-6.1: Detect Phase 2 Testability Issue |
| F6: Seeded Issues | SI-02: Phase 3 coolant-connector assembly access — CN-COOL-1 | Agent DFM/DFA analysis; finding F3-001 (seeded=true, severity=Major); action A3-001 (blocking=true, due_phase=4, due_gate=4); Gate 3 Conditional Pass; AV-07 blocking action display | US-6.2: Review Phase 3 Conditional Pass |
| F6: Seeded Issues | SI-03 (a–d): Phase 4 initial design — four simultaneous issues | `hvClearanceCheck()` → F4-001/A4-001; `componentDeratingCheck()` → F4-002/A4-002; `testPointCoverageCheck()` → F4-003/A4-003; `crossArtifactConsistencyCheck()` → F4-004/A4-004; all blocking=true; `public/samples/phase4-int-dfm-standards-supplier-risk.xlsx` | US-6.3: Approve Phase 4 Corrective Actions |
| F6: Seeded Issues | SI-04: Phase 4 revised design correction verification | `POST /api/orchestrator/targeted-rerun`; revised internal input v2; all 4 checks rerun Pass; A3-001 + A4-001 through A4-004 → VerifiedClosed; Gate 4 Pass; `public/samples/phase4-int-dfm-standards-supplier-risk-revised.xlsx` | US-6.3: Approve Phase 4 Corrective Actions |
| F6: Seeded Issues | SI-05: Phase 5 thermal exceedance — TP-CASE-1 91°C vs ≤85°C | V&V comparison in agent; finding F5-001 (seeded=true, severity=Critical); action A5-001; revised Validation Evidence Package; targeted rerun; revised result 82°C; Gate 5 Pass | US-6.4: Review Phase 5 Thermal Finding |
| F6: Seeded Issues | SI-06: Phase 6 Cpk failure — SOLDER_JOINT_SHEAR_HV_BUS Cpk 0.87 | `cpkCalculation()`; finding F6-001 (seeded=true, severity=Critical); action A6-001; revised MES sample v2; `public/samples/phase6-ext-mes-quality-capability-revised.xlsx`; Cpk reruns 1.45 Pass; Gate 6 Pass | US-6.4 (Phase 6 context); US-5.4: Inspect Phase 6 Cpk |
| F6: Seeded Issues | SI-07: Phase 7 torque variation — MOP-012-BRACKET-MOUNT | Agent analysis of transfer package; finding F7-001 (seeded=true, severity=Minor); action A7-001 (non-blocking, parallel); captured in Lessons-Learned Register; Gate 7 Pass | US-6.5 (Phase 7 context) |
| F6: Seeded Issues | SI-08: Phase 8 IGBT obsolescence — IGBT-HV-800-A | Obsolescence deterministic flag; finding F8-001 (seeded=true, severity=Critical); `public/samples/phase8-ext-supplier-distributor-obsolescence.xlsx`; AI recommends Pass to initiate EOL; Gate 8 Pass → Phase 9 | US-6.5: Review Phase 8 Obsolescence Finding |

### 3.8 F7: Token Optimization and Context Management

| PRD Feature | FRD Requirements | TechArch Specification | User Stories |
|---|---|---|---|
| F7: Token Optimization | TO-01: Reference documents indexed once at startup, cached | `referenceIndex/` service; `POST /api/system/initialize-index`; Redis reference index; `GET /api/system/index-status`; `REFERENCE_INDEX_NOT_INITIALIZED` (503) if not initialized | US-7.1: Confirm Reference Documents Indexed Once |
| F7: Token Optimization | TO-02: Relevant passages only in agent context (not full documents) | `context/` Context Assembly Service; `POST /api/context/assemble`; `AssembleContextResponse.context_package`; `FULL_DOC_IN_CONTEXT` (500) if full document detected; token budget `POC_CONTEXT_TOKEN_BUDGET=8000` | US-7.1: Confirm Reference Documents Indexed Once |
| F7: Token Optimization | TO-03: Compact approved-phase summaries as upstream context | `CompactPhaseSummary` interface (≤400 tokens/phase); `GET /api/context/phase/{id}/summaries`; stored in `phase_states.compact_phase_summary JSONB`; full prior-phase documents never re-transmitted | US-7.2: Use Compact Phase Summaries as Upstream Context |
| F7: Token Optimization | TO-04: Deterministic checks outside LLM | `src/server/tools/` — pure TypeScript functions; no LLM calls in tool layer; `DETERMINISTIC_DELEGATION_VIOLATION` (500) if LLM inference detected in check result | US-7.1: Confirm Reference Documents Indexed Once |

### 3.9 F8: Compact Artifact Standards

| PRD Feature | FRD Requirements | TechArch Specification | User Stories |
|---|---|---|---|
| F8: Compact Artifact Standards | CA-01: XLSX ≤10 meaningful rows | `ArtifactService` validation wrapper; `ROW_COUNT_VIOLATION` (422) if agent output >10 rows; `artifact_registry.row_count` field; `artifactValidator` in `src/server/artifacts/` | US-8.1: Generate and Validate Compact XLSX Outputs |
| F8: Compact Artifact Standards | CA-02: 6–10 essential fields; stable IDs, units, source refs, no unused columns | `UNUSED_COLUMN_VIOLATION` (422) if unused column detected; XLSX header area contains Project ID, Product Name, Phase, Gate, Artifact Name, Version, Status, Disclaimer, Generated At | US-8.1: Generate and Validate Compact XLSX Outputs |
| F8: Compact Artifact Standards | CA-03: DOCX/PDF ≤2 pages | `PAGE_COUNT_VIOLATION` (422) if agent output >2 pages; `artifact_registry.page_count` field; required sections: Document Header, Executive Summary, Key Findings, Recommendation, Open Actions, Provenance Statement | US-8.2: Generate and Validate Compact DOCX/PDF Outputs |
| F8: Compact Artifact Standards | CA-04: Mandatory disclaimer on every artifact | `disclaimer_present BOOLEAN NOT NULL DEFAULT TRUE CHECK (disclaimer_present = TRUE)` in `artifact_registry`; `DISCLAIMER_MISSING` (422) if absent; artifact generation wrapper enforces before registration | US-8.3: Download Approved Phase Outputs with Full Provenance |
| F8: Compact Artifact Standards | CA-05: Full provenance on every artifact | `ArtifactRecord` interface: artifact_id, name, type, source, intake_behavior, version, phase_id, gate_id, input_version_refs, timestamp, generated_by, disclaimer_present, storage_uri, row_count, page_count, file_size_bytes; `GET /api/artifacts/{id}` | US-8.3: Download Approved Phase Outputs with Full Provenance |
| F8: Compact Artifact Standards | SS-01: EVINV-POC-STD-001 labeled as "Synthetic POC Standard" | `SYNTHETIC_LABEL_MISSING` (422) if standard reference omitted; `source_reference` in every CheckResult must include "Synthetic POC Standard" label; artifact generation wrapper validates | US-8.2: Generate and Validate Compact DOCX/PDF Outputs |

### 3.10 F9: Application Views — Nine-View Web Gate Cockpit

| PRD Feature | FRD Requirements | TechArch Specification | User Stories |
|---|---|---|---|
| F9: Application Views | AV-01: Project Overview | `GET /api/views/project-overview`; `ProjectOverview` React component; route `/`; project identity, phase summary table (10 rows), health indicators (findings by severity, open actions, phases complete) | US-9.1: Navigate Project Overview and Product Lifecycle View |
| F9: Application Views | AV-02: Product Lifecycle View | `GET /api/views/lifecycle`; `LifecycleView` React component; route `/lifecycle`; all 10 phases/gates with breadcrumb state indicators and gate outcome badges; navigable to AV-03 or AV-08 | US-9.1: Navigate Project Overview and Product Lifecycle View |
| F9: Application Views | AV-03: Phase Workspace | `GET /api/views/phase/{id}/workspace`; `PhaseWorkspace` React component; route `/phase/[id]`; Input Readiness Panel (both inputs), Output Panel, AI Recommendation Panel, Human Decision Control, Phase Execution Status, Findings/Actions section; SSE consumer for real-time updates | US-9.2: Work in Phase Workspace |
| F9: Application Views | AV-04: Input Intake and Validation Panel | `GET /api/views/phase/{id}/intake`; `IntakePanel` React component; route `/phase/[id]/intake`; full intake workflow controls, per-field validation table, version history table, diff view, download by version | US-2.5: View Full Intake Workflow in Input Intake and Validation Panel |
| F9: Application Views | AV-05: Artifact Viewer | `GET /api/artifacts/{id}/viewer`; `ArtifactViewer` React component; route `/artifacts/[id]`; version selector, comparison mode (two versions side-by-side, differences highlighted), provenance panel, download button | US-3.3: View Version History and Compare Artifact Versions |
| F9: Application Views | AV-06: Technical Checklist Workspace | `GET /api/views/phase/{id}/checklist`; `ChecklistWorkspace` React component; route `/phase/[id]/checklist`; checklist items with evidence, status, linked artifact, reviewer notes; returns 404 `NO_CHECKLIST_MAPPED` for Phase 2 and Phases 5–9 | US-9.3: Use Technical Checklist Workspace |
| F9: Application Views | AV-07: Findings and Actions Workspace | `GET /api/views/findings-actions`; `FindingsActions` React component; route `/findings-actions`; Findings Table (Finding ID, Phase, Gate, Detected By, Seeded, Description, Severity, Status); Actions Table with Blocking Actions section; human approve/close controls | US-9.4: View All Findings and Blocking Actions |
| F9: Application Views | AV-08: Gate Review Workspace | `GET /api/views/gate/{id}/review` (alias `GET /api/gates/{id}/review`); `GateReview` React component; route `/gate/[id]/review`; built from ProjectState — no gate-pack artifact; Gate Identity, inputs, outputs, check results, findings, open actions, AI recommendation, human decision; `POST /api/gates/{id}/decide` | US-9.5: Use Gate Review Workspace to Make Gate Decision |
| F9: Application Views | AV-09: Audit View | `GET /api/views/audit`; `AuditView` React component; route `/audit`; full intake event log, gate decision history; read-only; "Immutable Record — Append Only" label; filter by event type, phase, date range; export XLSX/JSON | US-9.6: Navigate Breadcrumbs and View Intake Audit Log |
| F9: Application Views | AV-10: Persistent Lifecycle Breadcrumbs (behavior across all views) | `GET /api/views/breadcrumbs`; `BreadcrumbsResponse`; breadcrumbs component in `src/components/layout/`; present on all 9 views; selectable for Completed/Current/Awaiting/Conditional Pass states | US-0.3: View Persistent Lifecycle Breadcrumbs; US-9.6: Navigate Breadcrumbs |

### 3.11 F10: Gate Review Model

| PRD Feature | FRD Requirements | TechArch Specification | User Stories |
|---|---|---|---|
| F10: Gate Review Model | GR-01: Gate Review Workspace from ProjectState (no gate-pack artifact) | `GateReview` component built from `GET /api/gates/{id}/review`; `GateReviewResponse` interface; `GATE_PACK_PROHIBITED` (409) if gate-pack registered as phase output | US-9.5: Use Gate Review Workspace; US-10.1: Select Gate Outcome |
| F10: Gate Review Model | GR-02: Exactly three gate outcomes; human-selected only | `decision TEXT CHECK (decision IN ('Pass','Conditional Pass','Fail'))` in `gate_decisions`; `GATE_OUTCOME_INVALID` (400) for other values; `GATE_AI_PROHIBITED` (403) for AI actor; radio buttons never pre-selected | US-10.1: Select Gate Outcome |
| F10: Gate Review Model | GR-03: AI recommendation advisory only | `AIRecommendation` in `phase_states.ai_recommendation JSONB`; "Advisory Only — Human Decision Required" label non-removable; stored in `gate_decisions.ai_recommendation JSONB`; does not pre-select radio buttons | US-10.4: Review AI Recommendation Before Gate Decision |
| F10: Gate Review Model | GR-04: Human decision required at every gate; visible pause | Confirmation dialog before `POST /api/gates/{id}/decide`; `X-Reviewer-Role` header required; gate cannot advance without explicit human HTTP action; enforced at API layer, orchestrator layer, and DB layer | US-10.1: Select Gate Outcome; US-0.4: Confirm AI Cannot Approve Any Gate |
| F10: Gate Review Model | GR-05: Conditional Pass action tracking | `ConditionalPassActionInput` interface; `actions` table with `blocking BOOLEAN`, `due_phase`, `due_gate`, `required_closure_evidence`; `CONDITIONAL_ACTIONS_REQUIRED` (400) if Conditional Pass recorded with no actions; `BLOCKING_ACTIONS_OPEN` (409) if Pass attempted with open blocking actions | US-10.2: Record Conditional Pass; US-10.3: View Conditional Pass Action Tracking |
| F10: Gate Review Model | GR-06: Full gate decision provenance | `GateDecision` interface: decision_id, gate_number, ai_recommendation, human_disposition, reviewer_role, decision, comments, timestamp, artifact_versions_reviewed, open_conditions, is_final=true, supersedes; `gate_decisions.supersedes` self-reference for retry | US-10.1: Select Gate Outcome; US-10.5: Retry Failed Gate |

---

## 4. Requirements Detail by Feature

### F0: Lifecycle Orchestration — Requirements Detail

- **LC-01:** Ten lifecycle phases (Phase 0–9) and ten gates (Gate 0–9) implemented in sequential canonical order in the gated state-machine orchestrator. Phase state machine states: Pending, AwaitingInputs, Running, AwaitingGate, GatePassed, GateConditional, GateFailed, Cancelled, Paused. Gate states: Locked, Open, Decided.
- **LC-02:** No phase may advance without a human gate decision. AI cannot approve any gate in any code path. Enforced at three independent layers: API (`X-Reviewer-Role` validation), Orchestrator (state machine transitions), Database (`gate_decisions.is_final = true`; no UPDATE/DELETE).
- **LC-03:** AI provides recommended gate outcome (Pass/Conditional Pass/Fail) and rationale before human decides. AI recommendation stored in `ProjectState` but carries no decision authority. "Advisory Only — Human Decision Required" label non-removable.
- **LC-04:** Orchestrator supports: `pause` (graceful; completes current tool call), `resume` (idempotent), `retry` (from GateFailed; prior Fail preserved in audit), `cancel` (irreversible; confirmation required), `run-to-gate(n)` (runs phases to gate n; pauses for human), `targeted-rerun(input_id)` (reruns only affected items).
- **LC-05:** When a revised input is ingested, the orchestrator traverses the dependency graph via BFS from the revised input node, computes affected scope (checks, findings, outputs), invalidates only those items, reruns only invalidated items. Original results preserved.
- **LC-06:** `resume` is idempotent — if phase is already Running or Complete, command is a no-op returning current state without error.
- **LC-07:** Persistent lifecycle breadcrumbs visible on all nine application views. Selectable for completed/current/awaiting/conditional-pass phases. Technical review label shown where mapped. Seven states: Completed (✅), Current (▶), Awaiting Human Decision (⏳), Conditional Pass (🔶), Blocked (⛔), Upcoming (○), Closed (🔒).
- **LC-08:** Technical reviews mapped only to Phase 0 (Kickoff), Phase 1 (SLR), Phase 3 (Schematic/PDR), Phase 4 (PCB Layout/CDR). No checklist content displayed for Phase 2 or Phases 5–9.

### F1: Artifact-Count Discipline — Requirements Detail

- **AC-01:** Exactly one external-source input per phase enforced at schema and API level. `UNIQUE(project_id, phase_id, input_role)` on `phase_inputs`. Any attempt to add a second external input returns `409 ARTIFACT_COUNT_VIOLATION`.
- **AC-02:** Exactly one internal-artifact input per phase. Same enforcement as AC-01 with `input_role = 'internal'`.
- **AC-03:** One or two outputs per phase. Max-2 enforced at application layer; `phase_outputs` insert rejected if count = 2.
- **AC-04:** Gate Review Workspace rendered from ProjectState. No gate-pack artifact created or registered as a phase output. Findings, actions, audit events stored in dedicated ProjectState fields — not in `outputs[]`.
- **AC-05:** Phase configuration is server-side, immutable at runtime. Cannot be modified via API.
- **OP-01 to OP-10:** Per-phase input/output specifications defined in `PhaseConfig` constants. Each phase has exactly one external input (intake behavior UP or SI), one internal input (intake behavior UP or SI), and one or two named outputs with format and size guidance. Phase 8 is the only phase with two SI inputs. Phase 3 has external=SI and internal=UP.

### F2: Input Intake Framework — Requirements Detail

- **II-01:** Intake behavior (UP or SI) is predetermined per input in phase configuration. System never asks user to select intake mode.
- **II-02 to II-10:** USER-PROVIDED FILE workflow: display artifact name, required content, supported formats, size guidance, optional template link, upload prompt; validate; on failure show specific error, keep status Awaiting User Input, never substitute synthetic data; on pass show confirmation "Version [n] active", change control to "Upload Revised Version".
- **II-11 to II-16:** SIMULATED EXTERNAL-SYSTEM INTAKE workflow: display artifact name, System Represented label, "Simulated Connector — No live connection", "Preloaded Synthetic Sample", synthetic disclaimer, View button, Download button, disabled Ingest Sample button until view/download; after ingest: validate, normalize, record provenance, status = Synthetic System Input Ready.
- **II-17:** Prohibited labels scanned in all generated text, UI strings, API responses: "Connected to [SYSTEM]", "Retrieved from [SYSTEM]", "Live [SYSTEM] Data", "Real-time [SYSTEM]", "replacement input". Detection returns `500 PROHIBITED_LABEL_DETECTED`.
- **II-18:** Every intake action writes one immutable intake event record to `auditHistory[]`. Fields: event_id, event_type, phase_id, logical_input, intake_behavior, user_action, system_represented, status, source_artifact_id, normalized_artifact_id, version, validation_result, timestamp, operator_id.
- **II-19 to II-21, IR-01 to IR-03:** Input Readiness Panel on every Phase Workspace shows all fields for both inputs. Phase Execution Status transitions in order through six states. Phase execution blocked until both inputs ready.
- **UP-01 to UP-05:** Twelve validation rules for user-provided files (file_type, parseability, project_id_field, product_name_field, phase_field, revision_field, unit_presence, identifier_uniqueness, row_count_guidance [warning], page_count_guidance [warning], data_consistency, required_sections).
- **SE-01 to SE-05:** Five SI workflow requirements: system represented label, simulated connector label, preloaded synthetic sample label, explicit ingest action, ingest confirmation display.

### F3: Input Versioning — Requirements Detail

- **IV-01:** Exactly one InputVersion record per logical input may have `active = true`. Enforced by partial unique index in PostgreSQL. `VERSION_INTEGRITY_VIOLATION` returned if violated.
- **IV-02:** Prior versions never deleted. Only `active` flag changes from true to false. `invalidated_by` field records version ID of superseding version.
- **IV-03:** Dependency graph maintained in `ProjectState.dependencyGraph` as adjacency list. Nodes: ExternalInput, InternalInput, CheckResult, Finding, Output. Edges: DependsOn directed edges. BFS traversal from revised input node computes affected scope.
- **IV-04:** Targeted rerun invalidates only affected items (checks, findings, outputs). Both original (pre-revision) and revised (post-revision) results stored with distinct `version_ref`. Outputs where evidence materially changed have `review_required = true`. Human re-review required for material changes.

### F4: Shared ProjectState — Requirements Detail

- **PS-01:** Single versioned ProjectState with `state_version` incremented on every write. Optimistic concurrency prevents conflicting writes. All nine application views read from same ProjectState. `project_status = Closed` only settable when `phases[9].gate_state = Decided` and `gateDecisions[9].decision = Pass`.
- **PS-02:** Ten per-phase state objects (phases[0..9]). Each has: phase_id, phase_name, technical_review, phase_state, gate_state, external_input, internal_input, outputs (max 2), ai_recommendation, compact_phase_summary.
- **PS-03:** Cross-phase state: artifact registry (provenance, version refs, storage URIs), dependency graph, check results, findings, actions, gate decisions (immutable, is_final=true), compact phase summaries, full audit history (append-only).
- **PS-04:** Schema enforcement: `synthetic_data_indicator = TRUE` always; `disclaimer_present = TRUE` always; `is_final = TRUE` on gate decisions; `auditHistory` append-only (REVOKE UPDATE DELETE at DB level); max 2 outputs per phase; single active version per logical input.

### F5: Deterministic Engineering Checks — Requirements Detail

- **DP-01:** Every check result record contains: check_id, check_type, phase_id, input_version_ids, formula_or_method, threshold, threshold_unit, result_value, result_unit, status (Pass/Fail/Warning), source_reference, limitation, items_checked[], invalidated, superseded_by, run_at.
- **DP-02:** Cross-artifact consistency check (Phase 4): validates reference designators, part numbers, revision levels, footprint IDs between BOM and DFM spec. Source: EVINV-POC-STD-001 §2.1. Seeded: C_HV_1 footprint 0805 vs 1206.
- **DP-03:** HV clearance check (Phase 4): compares PCB net-pair clearances vs threshold 8.0 mm air / 5.0 mm creepage. Source: EVINV-POC-STD-001 §3.1. Seeded: VBUS+ to GND_SHIELD 6.2 mm vs 8.0 mm.
- **DP-04:** Component derating check (Phase 4): calculates derating margin = (Rated − Operating) / Rated × 100%. Threshold: capacitors ≥50%, MOSFETs (VDS) ≥30%, diodes (VRRM) ≥30%. Source: EVINV-POC-STD-001 §3.3. Seeded: C_BULK_3 4.4% vs 50%.
- **DP-05:** Test-point coverage check (Phase 4): verifies every diagnostic net has an accessible test point. Threshold: zero uncovered nets. Source: EVINV-POC-STD-001 §4.2. Seeded: DIAG_TEMP_IGBT_CASE no test point.
- **DP-06:** Cpk calculation (Phase 6): `Cpk = min((USL−μ)/(3σ), (μ−LSL)/(3σ))`. Threshold: 1.33. Source: EVINV-POC-STD-001 §5.1. Seeded: SOLDER_JOINT_SHEAR_HV_BUS Cpk 0.87.
- **DP-07:** Additional deterministic logic: cost calculation (Phase 1, ±5% parametric estimate), traceability completeness (Phase 2, ≥90% threshold), requirement testability flag (Phase 2, measurable criterion rule), action closure verification (Phases 4/5/6/7, zero open blocking actions), inventory reconciliation (Phase 8, zero unresolved discrepancies).

### F6: Seeded Issues — Requirements Detail

- **SI-01:** Phase 2 — REQ-THERM-004 lacks measurable acceptance criterion. Detection: `requirementTestabilityCheck()`. Finding F2-001. Action A2-001. Revised input v2. Gate 2 Pass after clarification.
- **SI-02:** Phase 3 — CN-COOL-1 coolant connector orientation obstructs fasteners J-FAST-7 through J-FAST-10. Detection: agent DFM/DFA analysis. Finding F3-001. Action A3-001 (blocking, due_phase=4). Gate 3 Conditional Pass.
- **SI-03a:** Phase 4 — VBUS+ to GND_SHIELD clearance 6.2 mm vs 8.0 mm. Detection: `hvClearanceCheck()`. Finding F4-001 (Critical). Action A4-001 (blocking).
- **SI-03b:** Phase 4 — C_BULK_3 derating margin 4.4% vs 50%. Detection: `componentDeratingCheck()`. Finding F4-002 (Critical). Action A4-002 (blocking).
- **SI-03c:** Phase 4 — DIAG_TEMP_IGBT_CASE no accessible test point. Detection: `testPointCoverageCheck()`. Finding F4-003 (Major). Action A4-003 (blocking).
- **SI-03d:** Phase 4 — C_HV_1 footprint 0805 in BOM vs 1206 in DFM. Detection: `crossArtifactConsistencyCheck()`. Finding F4-004 (Major). Action A4-004 (blocking).
- **SI-04:** Phase 4 revised design — all four checks rerun Pass; A3-001 + A4-001 through A4-004 → VerifiedClosed. Gate 4 Pass.
- **SI-05:** Phase 5 — TP-CASE-1 thermal measurement 91°C vs ≤85°C criterion. Detection: V&V comparison. Finding F5-001 (Critical). Action A5-001. Revised evidence: 82°C Pass. Gate 5 Pass.
- **SI-06:** Phase 6 — SOLDER_JOINT_SHEAR_HV_BUS Cpk 0.87 vs 1.33. Detection: `cpkCalculation()`. Finding F6-001 (Critical). Action A6-001. Revised MES sample: Cpk 1.45 Pass. Gate 6 Pass.
- **SI-07:** Phase 7 — MOP-012-BRACKET-MOUNT torque variation 2.1–4.8 N·m vs 3.5±0.5 N·m. Detection: agent analysis. Finding F7-001 (Minor). Action A7-001 (non-blocking). Lessons-learned register. Gate 7 Pass.
- **SI-08:** Phase 8 — IGBT-HV-800-A discontinuance notice. Detection: obsolescence deterministic flag. Finding F8-001 (Critical). No drop-in replacement; demand insufficient for redevelopment. Gate 8 Pass → Phase 9 EOL.

### F7: Token Optimization — Requirements Detail

- **TO-01:** Reference documents (EVINV-POC-STD-001, Power Supplies checklists, ENG 001 v4.1 excerpts, POC rules) extracted and indexed once at system startup. Stored in Redis. Query-based retrieval per invocation. Not reloaded per agent call.
- **TO-02:** Agent context per invocation contains only: active input summaries (structured field extracts, not raw text), upstream compact summaries, open actions, selected checklist items, selected standard passages, output schema. Token count must not exceed 8,000 tokens (configurable). Trim least-relevant passages first if budget exceeded.
- **TO-03:** Approved prior phases represented as `CompactPhaseSummary` objects (≤400 tokens each): gate outcome, ≤3 key decisions (≤50 tokens each), ≤2 output references, open action IDs only, findings summary (≤100 tokens). Full prior-phase documents never re-transmitted.
- **TO-04:** All five deterministic checks (cross-artifact consistency, HV clearance, derating, test-point coverage, Cpk) and all additional checks (cost, traceability, testability, action closure, inventory) run as pure TypeScript tool calls outside LLM. Zero LLM inference in check result computation.

### F8: Compact Artifact Standards — Requirements Detail

- **CA-01:** XLSX/CSV artifacts: maximum ~10 meaningful rows (headers excluded). Warning only (`ROW_COUNT_WARNING`) for uploaded user files; hard rejection (`ROW_COUNT_VIOLATION` 422) for agent-generated outputs.
- **CA-02:** XLSX/CSV records: 6–10 essential fields. Stable unique identifier per row. Units for quantitative fields. Source references where applicable. Revision level. No unused columns.
- **CA-03:** DOCX/PDF artifacts: ~1–2 pages maximum. Required sections: Document Header, Executive Summary (≤100 words), Key Findings (3–7 items), Recommendation, Open Actions (if any), Provenance Statement. No appendices, no repeated boilerplate beyond required header and disclaimer.
- **CA-04:** Mandatory disclaimer on every synthetic artifact: "Synthetic POC Data. Not TT Electronics Product Data. Not for Design, Fabrication, Certification, Procurement, or Production." `DISCLAIMER_MISSING` (422) if absent. Disclaimer in DOCX/PDF immediately after title in bold; not moveable to footnote.
- **CA-05:** Every artifact carries provenance: artifact ID, name, type, source, intake behavior, version, phase ID, gate ID, input version references, timestamp, generated by. `disclaimer_present = true` enforced at DB level.
- **SS-01:** Every reference to EVINV-POC-STD-001 includes the label "(Synthetic POC Standard, not an approved TT or industry standard)". `SYNTHETIC_LABEL_MISSING` (422) if omitted. Every check result `source_reference` field must include this label.

### F9: Application Views — Requirements Detail

- **AV-01:** Project Overview displays: Project ID (EVINV-POC-001), Product Name (EV-INV-800 Demonstration Traction Inverter), Project Type (NPI A / Category 1), Current Phase/Gate, Project Status, Synthetic Data badge (always visible), phase summary table (10 rows), project health indicators.
- **AV-02:** Product Lifecycle View displays all 10 phases and 10 gates in sequential order with breadcrumb state indicators, gate outcome badges, and technical review labels. Selectable nodes navigate to AV-03 or AV-08.
- **AV-03:** Phase Workspace is the primary per-phase working view with Input Readiness Panel (both inputs), Output Panel, AI Recommendation Panel ("Advisory Only" label permanent), Human Decision Control (radio buttons not pre-selected, confirmation dialog required), Phase Execution Status, Findings/Actions section, SSE real-time updates.
- **AV-04:** Input Intake and Validation Panel: detailed intake workflow controls, per-field validation table, version history table, diff view (opens AV-05 comparison mode), download for any version, intake audit events in chronological order. Phase selector for cross-phase navigation.
- **AV-05:** Artifact Viewer: version selector dropdown (all versions with timestamps and statuses), comparison mode (two versions side-by-side, differences highlighted), provenance panel, synthetic disclaimer always visible, download button for any version.
- **AV-06:** Technical Checklist Workspace: renders checklist content only for Phases 0, 1, 3, 4. For Phase 2 and Phases 5–9: "No technical review is mapped to this phase." Columns: Item ID, Description (source wording), Evidence Required, Evidence Status, Linked Artifact, Action Required, Reviewer Notes. Checklist source label visible. Export as XLSX.
- **AV-07:** Findings and Actions Workspace: Findings Table (filterable by phase, severity, status, seeded); Actions Table with Blocking Actions section at top with prominent visual treatment; human approve/close controls with approver role and timestamp; expandable action rows with full history.
- **AV-08:** Gate Review Workspace: built dynamically from ProjectState (no gate-pack artifact); Gate Identity header; inputs with version and validation status; outputs with approval status and Review Required indicators; check results summary table; findings summary; open actions panel (blocking prominently highlighted); AI recommendation "Advisory Only"; human comments field; Pass/Conditional Pass/Fail radio (not pre-selected); Gate Decision History.
- **AV-09:** Audit View: read-only; "Immutable Record — Append Only" label; full intake event log with all fields; gate decision history with all provenance; filter by event type, phase, date range; export XLSX/JSON.
- **AV-10:** Persistent Lifecycle Breadcrumbs (behavior across all views): present on all nine views; 10 phase segments; selectable for Completed/Current/Awaiting Human Decision/Conditional Pass; non-interactive for Upcoming/Blocked; technical review label where mapped.

### F10: Gate Review Model — Requirements Detail

- **GR-01:** Gate Review Workspace built dynamically from ProjectState via `GET /api/gates/{id}/review`. No gate-pack artifact created, registered, or emitted. All gate review content (inputs, outputs, checks, findings, actions, AI recommendation, human decision) rendered from structured state.
- **GR-02:** Exactly three gate outcomes: Pass, Conditional Pass, Fail. Human-selected only. No other value accepted. AI cannot select or submit any outcome. `GATE_OUTCOME_INVALID` (400) for invalid values. `GATE_AI_PROHIBITED` (403) for AI actor.
- **GR-03:** AI recommendation: recommended outcome, rationale, referenced finding IDs, referenced check result IDs. "Advisory Only — Human Decision Required" label always visible, non-removable by configuration. AI recommendation stored separately from human gate decision in ProjectState.
- **GR-04:** Gate pauses visibly at every gate. Presenter must physically click "Record Decision" and confirm dialog before gate advances. Enforced at API, Orchestrator, and DB layers independently.
- **GR-05:** Conditional Pass: at least one Conditional Pass Action required (description, owner role, blocking/parallel, due phase/gate, required closure evidence); `CONDITIONAL_ACTIONS_REQUIRED` (400) if Conditional Pass with no actions. Blocking actions block Pass outcome: `BLOCKING_ACTIONS_OPEN` (409). Next phase may proceed to AwaitingInputs while Conditional Pass actions are open; Gate Pass blocked until all blocking actions are VerifiedClosed.
- **GR-06:** Full gate decision provenance: decision_id, gate_number, ai_recommendation (full record), human_disposition, reviewer_role, decision, comments, timestamp, artifact_versions_reviewed, open_conditions, is_final=true, supersedes (for retry). Preserved permanently; immutable once written.

---

## 5. Test Case Coverage Matrix

This matrix maps each user story to its primary test methods and coverage status for the POC demonstration scenario.

| Story ID | Story Title | Test Method | Test Type | Acceptance Criteria Count | Coverage |
|---|---|---|---|---|---|
| US-0.1 | Run the Full Lifecycle G0–G9 | End-to-end Playwright test; automated gate decision log check against happy-path storyline | E2E | 5 | 100% |
| US-0.2 | Use Orchestrator Control Commands | Jest unit tests for each command handler (pause, resume, retry, cancel, run-to-gate, targeted-rerun); Playwright integration test for control command UI | Unit + Integration | 6 | 100% |
| US-0.3 | View Persistent Lifecycle Breadcrumbs | Playwright test verifying breadcrumbs on all 9 views; state transition verification per breadcrumb state | E2E + UI | 5 | 100% |
| US-0.4 | Confirm AI Cannot Approve Any Gate | Jest API test: POST `/api/gates/{id}/decide` with AI actor in X-Reviewer-Role returns 403 `GATE_AI_PROHIBITED`; E2E test across all 10 gates | Unit + E2E | 5 | 100% |
| US-1.1 | Verify One External and One Internal Input Per Phase | Jest API test: attempt to add second external/internal input per phase returns 409; count tests for all 10 phases | Unit (x10) | 5 | 100% |
| US-1.2 | Verify One or Two Outputs Per Phase | Jest API test: attempt to add third output returns 409; gate-pack registration returns 409 `GATE_PACK_PROHIBITED` | Unit (x10) | 5 | 100% |
| US-1.3 | Confirm Per-Phase Input/Output Assignments | Jest config test: all 10 phase configs match per-phase specification (intake behavior, artifact names, formats) | Unit | 5 | 100% |
| US-2.1 | Upload User-Provided File and See Validation Results | Jest upload handler tests for all 12 validation rules; Playwright UI test for Phase 0 upload flow | Unit + UI | 7 | 100% |
| US-2.2 | Block Phase Execution Until Both Inputs Ready | Jest API test: POST `/api/orchestrator/phase/{id}/start` returns 409 `INPUTS_NOT_READY` when inputs not ready; Playwright test for Run Phase button state | Unit + UI | 6 | 100% |
| US-2.3 | Ingest Simulated External-System Sample | Jest API test: programmatic auto-ingest returns 403 `AUTO_INGEST_PROHIBITED`; Playwright test for explicit Ingest Sample flow; label verification (prohibited label scan) | Unit + UI | 6 | 100% |
| US-2.4 | Review Input Readiness Panel for Both Inputs | Playwright test: Input Readiness Panel fields verified for UP and SI inputs; Simulated Connector label always visible | UI | 5 | 100% |
| US-2.5 | View Full Intake Workflow in AV-04 | Playwright test: AV-04 per-field validation table, version history, diff view navigation to AV-05; audit events visible | UI | 5 | 100% |
| US-3.1 | Upload Revised Version of User-Provided File | Jest API test: revised upload creates new version, prior version retained, targeted-rerun triggered; version_ref distinct; Playwright test for "Upload Revised Version" label (not "replacement input") | Unit + UI | 6 | 100% |
| US-3.2 | Ingest Revised Synthetic System Sample | Jest API test: revised sample ingest creates new version, dependency graph traversal, Cpk check invalidated and rerun; both results preserved | Unit | 5 | 100% |
| US-3.3 | View Version History and Compare Artifact Versions | Playwright test: AV-05 version selector, comparison mode, provenance panel, disclaimer visible, single active version enforced | UI | 6 | 100% |
| US-4.1 | Access Single Source of Truth Across All Phases | Jest API test: `GET /api/project/state` returns complete state; all nine views use same state endpoint; optimistic concurrency test; `project_status = Closed` guard | Unit | 5 | 100% |
| US-4.2 | Access Full Audit History at Any Time | Playwright test: AV-09 read-only display; all audit event fields; "Immutable Record" label; 403 on attempted edit; export XLSX/JSON | UI | 6 | 100% |
| US-5.1 | View Deterministic Check Results for Phase 4 | Jest tool tests: all 4 Phase 4 checks return same result for same inputs; Playwright test: check results in AV-07 and AV-08 with threshold/formula/source reference | Unit + UI | 5 | 100% |
| US-5.2 | Inspect HV Clearance Check Result Per Net Pair | Jest tool test: `hvClearanceCheck()` with seeded data returns F4-001 with measured=6.2mm, threshold=8.0mm, margin=-1.8mm; revised design returns 9.1mm Pass | Unit | 5 | 100% |
| US-5.3 | Inspect Component Derating and Test-Point Coverage | Jest tool tests: `componentDeratingCheck()` seeded C_BULK_3 4.4% Fail; `testPointCoverageCheck()` seeded DIAG_TEMP_IGBT_CASE Fail; both revised designs Pass | Unit | 5 | 100% |
| US-5.4 | Inspect Phase 6 Cpk Calculation | Jest tool test: `cpkCalculation()` with seeded SOLDER_JOINT_SHEAR_HV_BUS returns Cpk=0.87 Fail; revised sample returns Cpk=1.45 Pass; formula documented | Unit | 5 | 100% |
| US-6.1 | Detect Phase 2 Testability Issue and Close After Clarification | Jest tool test: `requirementTestabilityCheck()` flags REQ-THERM-004; correction cycle end-to-end test; Gate 2 Pass after clarification | Unit + E2E | 5 | 100% |
| US-6.2 | Review Phase 3 Conditional Pass and Track Coolant Connector Action | Playwright E2E test: Phase 3 Conditional Pass records A3-001; AV-07 blocking action visible; Gate 4 Pass radio disabled until A3-001 VerifiedClosed | E2E + UI | 5 | 100% |
| US-6.3 | Approve Corrective Actions for All Four Phase 4 Design Issues | Playwright E2E test: 4 actions approved, revised design uploaded, all 4 checks rerun Pass, all actions VerifiedClosed, Gate 4 Pass recorded | E2E | 5 | 100% |
| US-6.4 | Review Phase 5 Thermal Finding and Approve Correction | Jest/Playwright: F5-001 raised; A5-001 auto-close returns 403 `HUMAN_APPROVAL_REQUIRED`; revised evidence uploaded; Gate 5 Pass | Unit + E2E | 5 | 100% |
| US-6.5 | Review Phase 8 Obsolescence Finding and Approve Gate 8 Pass | Playwright E2E: Phase 8 F8-001 raised; Gate 8 Pass recorded; `current_phase` updates to 9; Gate 9 Pass → `project_status = Closed` | E2E | 5 | 100% |
| US-7.1 | Confirm Reference Documents Indexed Once and Not Re-Transmitted | Jest API test: `FULL_DOC_IN_CONTEXT` returned if full document in context; `REFERENCE_INDEX_NOT_INITIALIZED` (503) if index not built; `DETERMINISTIC_DELEGATION_VIOLATION` (500) if LLM used for check | Unit | 5 | 100% |
| US-7.2 | Use Compact Phase Summaries as Upstream Context | Jest test: CompactPhaseSummary ≤400 tokens; `GET /api/context/phase/{id}/summaries` returns summaries for all prior phases; full prior-phase docs not in context | Unit | 5 | 100% |
| US-8.1 | Generate and Validate Compact XLSX Outputs | Jest artifact validation test: >10 rows returns 422 `ROW_COUNT_VIOLATION`; unused column returns `UNUSED_COLUMN_VIOLATION`; all required metadata fields present; disclaimer enforced | Unit | 5 | 100% |
| US-8.2 | Generate and Validate Compact DOCX/PDF Outputs | Jest artifact validation test: >2 pages returns 422 `PAGE_COUNT_VIOLATION`; required sections present; EVINV-POC-STD-001 without synthetic label returns `SYNTHETIC_LABEL_MISSING` | Unit | 5 | 100% |
| US-8.3 | Download Approved Phase Outputs with Full Provenance | Playwright test: AV-05 download button; `GET /api/artifacts/{id}` returns full provenance; `disclaimer_present = true` always; `GET /api/artifacts/{id}/versions` lists all versions | UI | 5 | 100% |
| US-9.1 | Navigate Project Overview and Product Lifecycle View | Playwright test: AV-01 displays all required fields; AV-02 shows all 10 phases/gates with correct state indicators; phase node click navigates to AV-03; gate node click navigates to AV-08 | UI | 5 | 100% |
| US-9.2 | Work in Phase Workspace (AV-03) | Playwright test: Input Readiness Panel fields, Output Panel, AI Recommendation "Advisory Only" label non-removable, radio buttons not pre-selected, confirmation dialog required, Record Decision disabled during Processing | UI | 6 | 100% |
| US-9.3 | Use Technical Checklist Workspace (AV-06) | Playwright test: Phase 0/1/3/4 render checklist content with source label; Phase 2 and 5–9 display "No technical review mapped"; API returns 404 `NO_CHECKLIST_MAPPED` for Phase 2 and 5–9 | UI + Unit | 6 | 100% |
| US-9.4 | View All Findings and Blocking Actions in AV-07 | Playwright test: Findings Table filterable; Blocking Actions section at top; human approve/close controls; action row expand; Navigate to source phase link | UI | 5 | 100% |
| US-9.5 | Use Gate Review Workspace (AV-08) to Make Gate Decision | Playwright test: AV-08 built from ProjectState (no artifact); Pass disabled when blocking_actions_open; Conditional Pass Action Form required; confirmation dialog before POST | UI + E2E | 6 | 100% |
| US-9.6 | Navigate Breadcrumbs and View Intake Audit Log | Playwright test: breadcrumbs on all 9 views with correct states; Completed/Current/Awaiting/Conditional Pass are clickable; Upcoming/Blocked non-interactive; AV-09 all fields visible; export works | UI | 6 | 100% |
| US-10.1 | Select Gate Outcome at Any Gate | Jest API test: invalid outcome returns 400 `GATE_OUTCOME_INVALID`; immutable after write returns 409 `GATE_ALREADY_DECIDED`; provenance record complete with is_final=true | Unit | 5 | 100% |
| US-10.2 | Record Conditional Pass and Track Its Actions | Jest API test: Conditional Pass with no actions returns 400 `CONDITIONAL_ACTIONS_REQUIRED`; action created with blocking=true, due_phase=4; Playwright test: A3-001 visible in AV-07 immediately | Unit + UI | 5 | 100% |
| US-10.3 | View Conditional Pass Action Tracking Across All Views | Playwright test: Phase 3 breadcrumb shows Conditional Pass (🔶) on all 9 views while A3-001 open; AV-01 health indicator shows open blocking action; AV-08 Gate 4 Pass radio disabled; Pass selectable after VerifiedClosed | UI | 5 | 100% |
| US-10.4 | Review AI Recommendation Before Gate Decision | Playwright test: AI Recommendation Panel in AV-08 shows recommendation, rationale, finding/check IDs; "Advisory Only" label always visible; AI recommendation does not pre-select radio buttons | UI | 5 | 100% |
| US-10.5 | Retry Failed Gate After Correction | Jest API test: retry resets phase to AwaitingInputs; original Fail decision preserved in gateDecisions[]; new decision has supersedes field; both records in AV-08 Gate Decision History and AV-09 | Unit | 5 | 100% |

### 5.1 Coverage Summary by Feature

| Feature | User Stories | Acceptance Criteria | Test Cases | Coverage |
|---|---|---|---|---|
| F0: Lifecycle Orchestration | US-0.1 to US-0.4 | 21 | 21 | 100% |
| F1: Artifact-Count Discipline | US-1.1 to US-1.3 | 15 | 15 | 100% |
| F2: Input Intake Framework | US-2.1 to US-2.5 | 29 | 29 | 100% |
| F3: Input Versioning | US-3.1 to US-3.3 | 17 | 17 | 100% |
| F4: Shared ProjectState | US-4.1 to US-4.2 | 11 | 11 | 100% |
| F5: Deterministic Checks | US-5.1 to US-5.4 | 20 | 20 | 100% |
| F6: Seeded Issues | US-6.1 to US-6.5 | 25 | 25 | 100% |
| F7: Token Optimization | US-7.1 to US-7.2 | 10 | 10 | 100% |
| F8: Compact Artifact Standards | US-8.1 to US-8.3 | 15 | 15 | 100% |
| F9: Application Views | US-9.1 to US-9.6 | 34 | 34 | 100% |
| F10: Gate Review Model | US-10.1 to US-10.5 | 25 | 25 | 100% |
| **Total** | **42 stories** | **222** | **222** | **100%** |

### 5.2 Deterministic Check Test Case Detail

| Check Type | Tool Function | Phase | Seeded Issue | Initial Result | Post-Correction Result | Test Type |
|---|---|---|---|---|---|---|
| Cross-Artifact Consistency | `crossArtifactConsistencyCheck()` | 4 | C_HV_1 footprint 0805 vs 1206 | F4-004 Fail | v2: 1206 match Pass | Jest unit |
| HV Clearance | `hvClearanceCheck()` | 4 | VBUS+ to GND_SHIELD 6.2mm vs 8.0mm | F4-001 Fail | v2: 9.1mm Pass | Jest unit |
| Component Derating | `componentDeratingCheck()` | 4 | C_BULK_3 4.4% vs 50% | F4-002 Fail | v2: 52.2% Pass | Jest unit |
| Test-Point Coverage | `testPointCoverageCheck()` | 4 | DIAG_TEMP_IGBT_CASE no test point | F4-003 Fail | v2: TP-IGBT-CASE Pass | Jest unit |
| Cpk Calculation | `cpkCalculation()` | 6 | SOLDER_JOINT_SHEAR_HV_BUS Cpk 0.87 | F6-001 Fail | v2: Cpk 1.45 Pass | Jest unit |
| Requirement Testability | `requirementTestabilityCheck()` | 2 | REQ-THERM-004 no measurable criterion | F2-001 Flag | v2: ≤85°C criterion Pass | Jest unit |
| Traceability Completeness | `traceabilityCompletenessCheck()` | 2 | — | ≥90% Pass target | — | Jest unit |
| Action Closure Verification | `actionClosureVerification()` | 4, 5, 6, 7 | A3-001, A4-001–A4-004 | Open Fail | VerifiedClosed Pass | Jest unit |
| Cost Calculation | `costCalculation()` | 1 | — | ±5% of parametric estimate | — | Jest unit |
| Inventory Reconciliation | `inventoryReconciliation()` | 8 | — | Zero discrepancy Pass target | — | Jest unit |

---

## 6. Bidirectional Traceability Index

### 6.1 FRD Requirement → PRD Feature (Reverse Trace)

| FRD Requirement ID | FRD Requirement Group | PRD Feature |
|---|---|---|
| LC-01 to LC-08 | Lifecycle Orchestration | F0 |
| AC-01 to AC-05 | Artifact Count | F1 |
| OP-01 to OP-10 | Outputs and Phase Outputs | F1 |
| II-01 to II-21 | Input-Intake Configuration | F2 |
| UP-01 to UP-05 | User-Provided File Workflow | F2 |
| SE-01 to SE-05 | Simulated External-System Intake | F2 |
| IR-01 to IR-03 | Input Readiness and Phase Execution | F2 |
| IV-01 to IV-04 | Input Versioning | F3 |
| PS-01 to PS-04 | Shared ProjectState | F4 |
| DP-01 to DP-07 | Deterministic Processing | F5 |
| SI-01 to SI-08 | Seeded Issues | F6 |
| TO-01 to TO-04 | Token Optimization | F7 |
| CA-01 to CA-05 | Compact Artifact Standards | F8 |
| SS-01 | Synthetic Standard | F8 |
| AV-01 to AV-10 | Application Views | F9 |
| GR-01 to GR-06 | Gate Review Model | F10 |

### 6.2 User Story → FRD Requirements (Reverse Trace)

| User Story | FRD Requirements Verified |
|---|---|
| US-0.1 | LC-01, LC-02 |
| US-0.2 | LC-04, LC-05, LC-06 |
| US-0.3 | LC-07, AV-10 |
| US-0.4 | LC-02, GR-04 |
| US-1.1 | AC-01, AC-02, AC-05 |
| US-1.2 | AC-03, AC-04, AC-05 |
| US-1.3 | OP-01, OP-02, OP-03, OP-08 |
| US-2.1 | II-02 to II-10, UP-01 to UP-05 |
| US-2.2 | IR-01, IR-03 |
| US-2.3 | II-11 to II-16, SE-01 to SE-05 |
| US-2.4 | II-19 to II-21, IR-02 |
| US-2.5 | II-18, AV-04 |
| US-3.1 | IV-01, IV-02, IV-03, IV-04 |
| US-3.2 | IV-02, IV-03, IV-04 |
| US-3.3 | IV-01, IV-02, AV-05 |
| US-4.1 | PS-01, PS-02, PS-04 |
| US-4.2 | PS-03, PS-04, AV-09 |
| US-5.1 | DP-01, DP-02, DP-03, DP-04, DP-05 |
| US-5.2 | DP-03 |
| US-5.3 | DP-04, DP-05 |
| US-5.4 | DP-06 |
| US-6.1 | SI-01, DP-07 |
| US-6.2 | SI-02, GR-05 |
| US-6.3 | SI-03, SI-04, DP-02, DP-03, DP-04, DP-05 |
| US-6.4 | SI-05 |
| US-6.5 | SI-07, SI-08 |
| US-7.1 | TO-01, TO-02, TO-04 |
| US-7.2 | TO-03 |
| US-8.1 | CA-01, CA-02 |
| US-8.2 | CA-03, SS-01 |
| US-8.3 | CA-04, CA-05 |
| US-9.1 | AV-01, AV-02 |
| US-9.2 | AV-03, GR-03 |
| US-9.3 | AV-06, LC-08 |
| US-9.4 | AV-07 |
| US-9.5 | AV-08, GR-01, GR-04, GR-05 |
| US-9.6 | AV-09, AV-10, LC-07 |
| US-10.1 | GR-01, GR-02, GR-06 |
| US-10.2 | GR-05 |
| US-10.3 | GR-05, AV-01, AV-07, AV-08 |
| US-10.4 | GR-03, LC-03 |
| US-10.5 | GR-06, LC-04 |

### 6.3 TechArch Component → Feature Coverage

| TechArch Component | Files / Tables | Features Covered |
|---|---|---|
| Orchestrator | `stateMachine.ts`, `commands.ts`, `targetedRerun.ts`, `gateEnforcement.ts`, `phaseRunner.ts`; `phase_states` table | F0, F3, F10 |
| Intake Handler | `upWorkflow.ts`, `siWorkflow.ts`, `validators/`, `artifactCounter.ts`; `phase_inputs`, `input_versions` tables | F1, F2, F3 |
| Deterministic Tool Layer | `src/server/tools/*.ts` (10 check functions); `check_results` table | F5, F6 |
| LLM Agent Layer | `src/server/agents/phase{0-9}Agent.ts`, `wrapper.ts` | F0, F6, F7 |
| Context Assembly Service | `src/server/context/`; Redis reference index | F7 |
| Reference Index Service | `src/server/referenceIndex/`; Redis | F7 |
| Artifact Service | `src/server/artifacts/`; `artifact_registry`, `phase_outputs` tables | F1, F8 |
| SSE Stream Handler | `src/server/sse/`; Redis cancel flags | F0, F9 |
| ProjectState (PostgreSQL) | `project_state`, `phase_states`, `phase_inputs`, `input_versions`, `artifact_registry`, `phase_outputs`, `check_results`, `findings`, `actions`, `gate_decisions`, `audit_history` tables | F4 (all features read/write) |
| Web Gate Cockpit (Next.js) | `app/` pages (9 routes); React components (AV-01 through AV-09) | F9 |

---

## 7. Change Management

### 7.1 Change Log

| Version | Date | Change Description | Changed By | Sections Affected |
|---|---|---|---|---|
| v1.0 | 2026-08-15 | Initial RTM generated from PRD-TTCopilot-v1.0, FRD-TTCopilot-v1.0, TechArch-TTCopilot-v1.0, UserStories-TTCopilot.md, PROJECT.md. All 11 features (F0–F10), 79 requirements, 42 user stories, and 222 acceptance criteria traced. | Pivota Spec RTM Generator | All |

### 7.2 Pending Items and Known Assumptions

| Item | Description | Impact | Owner |
|---|---|---|---|
| EVINV-POC-STD-001 thresholds | Clearance (8.0 mm air / 5.0 mm creepage), derating (50% capacitors, 30% MOSFETs/diodes), Cpk (1.33) are POC-invented. Require TT Electronics confirmation before any production use. | Affects DP-03, DP-04, DP-06, SS-01 | TT Electronics Engineering |
| Gate exit criteria (Gates 1–7) | Not fully detailed in ENG 001 v4.1 PDF extract (pages appear blank). POC uses TechSur Proposal Appendix A as authoritative input/output reference for these gates. | Affects LC-01, GR-01 through GR-06 | TT Electronics Governance |
| Power Supplies checklist adaptation | Checklist is labeled "Prelim" and maps to Power Supplies products. Selected items adapted for traction inverter context with wording preserved from source. | Affects LC-08, AV-06 | TT Electronics Engineering |
| FIPS document | No FIPS-TTCopilot.md provided for this RTM generation. Security requirements are captured in TechArch §5 (Security Architecture) and traced through FRD constraints rather than a separate FIPS document. | Informational | — |

---

## 8. Approval

### 8.1 Document Sign-Off

| Role | Name | Signature | Date |
|---|---|---|---|
| Program Manager | | | |
| Engineering Lead | | | |
| Quality Manager | | | |
| Commercial Lead | | | |
| Architecture Lead | | | |

### 8.2 Traceability Completeness Self-Check

| Check | Status |
|---|---|
| All 11 PRD features (F0–F10) have FRD requirement traceability | ✅ Complete |
| All 79 FRD requirements map back to a PRD feature | ✅ Complete |
| All 16 FRD requirement groups (LC, AC, II, UP, SE, IR, IV, OP, CA, DP, SI, TO, PS, AV, GR, SS) are covered | ✅ Complete |
| All FRD requirements map to at least one TechArch component, endpoint, or data model element | ✅ Complete |
| All 42 user stories map to at least one FRD requirement | ✅ Complete |
| All user stories have acceptance criteria with defined test methods | ✅ Complete |
| All 10 deterministic checks have tool function references and seeded-issue linkage (where applicable) | ✅ Complete |
| All 8 seeded issues (SI-01 to SI-08) are traced to detecting check/rule, finding ID, action ID, and gate outcome | ✅ Complete |
| All 9 application views (AV-01 to AV-09) and breadcrumb behavior (AV-10) have route, component, and API endpoint reference | ✅ Complete |
| Happy-path gate storyline (G0 Pass through G9 Pass/Close) is traceable end-to-end | ✅ Complete |
| No PRD feature has zero user story coverage | ✅ Complete |
| "Replacement input" terminology prohibition traced to enforcement mechanism | ✅ Complete |
| "Simulated Connector" / "Preloaded Synthetic Sample" labels traced to enforcement mechanism | ✅ Complete |
| Mandatory synthetic disclaimer traced to DB CHECK constraint and artifact wrapper enforcement | ✅ Complete |
| Human-gate authority enforced at API, Orchestrator, and DB layers (triple enforcement) | ✅ Complete |

---

*RTM-TTCopilot-v1.0 | Generated: 2026-08-15 | Project: EVINV-POC-001 | Synthetic POC Data. Not TT Electronics Product Data. Not for Design, Fabrication, Certification, Procurement, or Production.*
