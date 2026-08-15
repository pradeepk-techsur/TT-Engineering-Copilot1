# Functional Requirements Document
## TT Manufacturing and Engineering Copilot

**Document ID:** FRD-TTCopilot-v1.0
**Project:** EVINV-POC-001
**Product:** EV-INV-800 Demonstration Traction Inverter
**Status:** Active
**Date:** 2026-08-15
**Classification:** Internal POC — Synthetic Data Only
**Built from:** PRD-TTCopilot-v1.0, PROJECT.md, REQUIREMENTS.md

> **Synthetic POC Data. Not TT Electronics Product Data. Not for Design, Fabrication, Certification, Procurement, or Production.**

---

## Scope

This document specifies the functional behavior of every feature in the TT Manufacturing and Engineering Copilot POC (EVINV-POC-001). It covers Features F0–F10, including inputs, outputs, validation rules, process steps, error states, API surface, and state schema. It is the authoritative implementation reference for all developers building the Web Gate Cockpit and backend orchestration. PRD-TTCopilot-v1.0 contains the product vision; this FRD contains the behavioral contract.

---

## Table of Contents

| Chunk File | Feature | Title |
|---|---|---|
| F00-orchestration.md | F0 | Lifecycle Orchestration and Gated State Machine |
| F01-artifact-count.md | F1 | Artifact-Count Discipline |
| F02-input-intake.md | F2 | Input Intake Framework |
| F03-input-versioning.md | F3 | Input Versioning and Dependency-Aware Revision |
| F04-project-state.md | F4 | Shared ProjectState |
| F05-deterministic-checks.md | F5 | Deterministic Engineering Checks |
| F06-seeded-issues.md | F6 | Seeded Issues and Correction Cycles |
| F07-token-optimization.md | F7 | Token Optimization and Context Management |
| F08-compact-artifacts.md | F8 | Compact Artifact Standards |
| F09-application-views.md | F9 | Application Views — Nine-View Web Gate Cockpit |
| F10-gate-review.md | F10 | Gate Review Model |
| Y0-schema.md | — | Database / State Schema (DDL) |
| Y1-api.md | — | REST API Endpoint Catalog |
| Y2-errors.md | — | Cross-Feature Error Catalog |
| Y3-integrations.md | — | External Integration Points |

---

## Document Conventions

- **Feature IDs:** F0–F10 correspond to PRD feature numbers.
- **Requirement IDs:** LC-nn, AC-nn, II-nn, UP-nn, SE-nn, IR-nn, IV-nn, OP-nn, CA-nn, DP-nn, SI-nn, TO-nn, PS-nn, AV-nn, GR-nn, SS-nn trace back to REQUIREMENTS.md.
- **Phase numbers (TT lifecycle):** Phase 0–9 = TT Electronics ENG 001 v4.1 lifecycle phases.
- **Phase numbers (dev roadmap):** Software development phases referenced in REQUIREMENTS.md Traceability section — these are distinct from TT lifecycle phases.
- **Gate numbers:** Gate 0–9 correspond 1:1 to lifecycle phases (Gate N exits Phase N).
- **Intake behavior codes:** `UP` = User-Provided File; `SI` = Simulated External-System Intake.
- **Status states:** `Awaiting User Input`, `User Input Ready`, `Synthetic System Input Ready`, `Waiting for Synthetic Sample Ingestion`, `Ready to Run`, `Processing`, `Awaiting Human Decision`, `Complete`.
- **Gate outcomes:** `Pass`, `Conditional Pass`, `Fail` — exactly three, human-selected only.
- **Breadcrumb states:** `Completed`, `Current`, `Awaiting Human Decision`, `Conditional Pass`, `Blocked`, `Upcoming`, `Closed`.
- **Terminology enforcement:** The term "replacement input" is prohibited everywhere. Use "revised version". The labels "Connected to [SYSTEM]", "Retrieved from [SYSTEM]", "Live [SYSTEM] Data" are prohibited. Use "Simulated Connector", "Preloaded Synthetic Sample", "Synthetic System Input".
- **Disclaimer (mandatory on every synthetic artifact):** "Synthetic POC Data. Not TT Electronics Product Data. Not for Design, Fabrication, Certification, Procurement, or Production."
- **EVINV-POC-STD-001:** Synthetic POC standard, not an approved TT or industry standard. Label every use accordingly.

---

## Cross-Cutting Terminology

| Term | Definition |
|---|---|
| **EV-INV-800** | Fictional EV traction inverter product used as the demonstration subject |
| **EVINV-POC-001** | Project ID for the EV-INV-800 demonstration |
| **ENG 001 v4.1** | TT Electronics Product Lifecycle Process; defines Phase 0–9 and Gate 0–9 |
| **EVINV-POC-STD-001** | Synthetic engineering standard defining POC thresholds (clearance, derating, Cpk); not a real standard |
| **ProjectState** | Single versioned object that is the source of truth across all phases |
| **Orchestrator** | Gated state-machine controller that manages phase progression and enforces human gate authority |
| **Phase Workspace** | Per-phase UI view (AV-03) containing input readiness panel, output panel, findings, AI recommendation, human decision |
| **Gate Review Workspace** | AV-08 view built dynamically from ProjectState; no separate artifact emitted |
| **Web Gate Cockpit** | The primary human-in-the-loop web application with nine structured views |
| **Intake Behavior** | Predetermined mode for each input: USER-PROVIDED FILE (UP) or SIMULATED EXTERNAL-SYSTEM INTAKE (SI) |
| **Simulated Connector** | Label indicating a simulated (not live) connection to an enterprise system |
| **Revised Version** | A new version of an existing input; prior versions preserved; term "replacement input" prohibited |
| **Dependency Graph** | Directed graph in ProjectState tracking which outputs depend on which inputs and check results |
| **Compact Phase Summary** | Structured summary of an approved phase stored in ProjectState for use as upstream context by downstream agents |
| **NPI A / Cat 1** | New Product Introduction Type A, Category 1 — the product type for this POC; all gates mandatory |
| **Seeded Issue** | An intentionally embedded engineering problem in synthetic POC data, detectable by a deterministic check or rule |
| **Correction Cycle** | The workflow: issue detected → finding raised → human approves corrective action → revised input → rerun → result preserved |
| **Happy-Path Storyline** | The canonical gate sequence: G0 Pass → G1 Pass → G2 Pass (after clarification) → G3 Conditional Pass → G4 Pass (after correction) → G5 Pass (after correction) → G6 Pass (after correction) → G7 Pass → G8 Pass (to initiate EOL) → G9 Pass (project closed) |
| **Technical Review** | Formal review meeting mapped to specific phases: Kickoff (P0), SLR (P1), Schematic/PDR (P3), PCB Layout/CDR (P4) |
| **Deterministic Check** | An engineering calculation or consistency check that runs outside the LLM, producing reproducible results |
| **Artifact Registry** | Table in ProjectState listing every artifact with its provenance, version, phase, and status |
| **Finding** | A structured record of a detected engineering issue; not counted as a phase output |
| **Action** | A structured corrective or parallel task linked to a finding; tracked to closure; not counted as a phase output |
| **Blocking Action** | An action that must be closed before the associated gate can be approved |

---

*FRD-TTCopilot-v1.0 | Generated: 2026-08-15 | Synthetic POC Data Only*
---

## F00: Lifecycle Orchestration and Gated State Machine

**Requirements:** LC-01 to LC-08 | **Priority:** P0

**Description:** The orchestrator is a gated state machine that controls forward progression through all ten TT Electronics ENG 001 v4.1 lifecycle phases (Phase 0–9) and their corresponding gates (Gate 0–9). No phase advances without an explicit human gate decision. The orchestrator enforces the constraint that AI may never autonomously approve any gate in any code path. It also supports operational control commands (pause, resume, retry, cancel, run-to-gate, targeted rerun) for demonstration and recovery scenarios.

---

### Terminology

- **Phase State:** The current operational state of a lifecycle phase within the orchestrator (e.g., `Pending`, `Running`, `Awaiting Gate`, `Gate Passed`, `Gate Conditional`, `Gate Failed`, `Cancelled`).
- **Gate State:** The state of the gate at the boundary of a phase (`Locked`, `Open`, `Decided`).
- **Run-to-Gate:** Orchestrator command that runs all phases up to but not including a specified gate, then pauses for human decision.
- **Targeted Rerun:** Orchestrator command that reruns only the checks, findings, and outputs affected by a specific revised input, without rerunning the entire phase.
- **Idempotent Resume:** Resume command is safe to call multiple times; if the phase is already running or complete, it is a no-op.
- **Happy-Path Storyline:** G0 Pass → G1 Pass → G2 Pass (after clarification) → G3 Conditional Pass → G4 Pass (after correction) → G5 Pass (after correction) → G6 Pass (after correction) → G7 Pass → G8 Pass (initiate EOL) → G9 Pass (project closed).

---

### Sub-features

- Phase 0–9 and Gate 0–9 fully implemented in sequential canonical order
- Gated progression: each phase may only start after the preceding gate has been decided `Pass` or `Conditional Pass` by a human
- Human-only gate decisions: exactly three outcomes (`Pass`, `Conditional Pass`, `Fail`); AI recommendation is advisory only
- AI gate recommendation: AI provides recommended outcome and rationale before human decides; recommendation stored in ProjectState but carries no decision authority
- Orchestrator control commands: `pause`, `resume`, `retry`, `cancel`, `run-to-gate`, `idempotent-resume`, `targeted-rerun`
- Dependency-aware invalidation: when a revised input is ingested, only affected checks, findings, and outputs are invalidated and rerun
- Persistent lifecycle breadcrumbs on all nine views showing phase + gate + technical review (where mapped) + breadcrumb state
- Technical review mapping enforced: Kickoff→Phase 0, SLR→Phase 1, Schematic/PDR→Phase 3, PCB Layout/CDR→Phase 4; no reviews invented for Phase 2 or Phases 5–9

---

### Phase State Machine

#### Phase States

| State | Description |
|---|---|
| `Pending` | Phase has not started; prerequisites not yet met |
| `AwaitingInputs` | Both inputs must be validated and ready before execution |
| `Running` | Phase agent is executing; checks running |
| `AwaitingGate` | Phase work complete; waiting for human gate decision |
| `GatePassed` | Gate outcome = Pass; phase complete |
| `GateConditional` | Gate outcome = Conditional Pass; conditional actions tracked |
| `GateFailed` | Gate outcome = Fail; project blocked |
| `Cancelled` | Phase cancelled by operator command |
| `Paused` | Phase execution suspended by operator |

#### Gate States

| State | Description |
|---|---|
| `Locked` | Gate cannot yet be reviewed (phase not yet in `AwaitingGate`) |
| `Open` | Gate is ready for human decision |
| `Decided` | Human has recorded outcome; gate closed |

#### Valid State Transitions

```
Pending → AwaitingInputs (when prior gate is Decided Pass or Conditional Pass)
AwaitingInputs → Running (when both inputs are validated and ready)
Running → AwaitingGate (when phase execution completes)
Running → Paused (on pause command)
Paused → Running (on resume command)
AwaitingGate → GatePassed (human selects Pass)
AwaitingGate → GateConditional (human selects Conditional Pass)
AwaitingGate → GateFailed (human selects Fail)
GateFailed → AwaitingInputs (on retry, after corrective action)
Any → Cancelled (on cancel command)
```

---

### Process: Normal Phase Execution

1. Orchestrator verifies preceding gate is in state `Decided` with outcome `Pass` or `Conditional Pass`.
2. Orchestrator transitions target phase from `Pending` to `AwaitingInputs`.
3. Phase Workspace (AV-03) displays input readiness panel; status = `Waiting for User Input` or `Waiting for Synthetic Sample Ingestion` per input.
4. Both inputs must reach status `User Input Ready` or `Synthetic System Input Ready` before execution.
5. Once both inputs are ready, Phase Execution Status transitions to `Ready to Run`; human may initiate execution.
6. Orchestrator transitions phase to `Running`; spawns phase agent with context-optimized prompt (see F7).
7. Agent executes: drafts outputs, invokes deterministic check tools, raises findings.
8. All check results and agent outputs written to ProjectState with provenance.
9. Phase transitions to `AwaitingGate`; Gate Review Workspace (AV-08) becomes available.
10. AI recommendation (outcome + rationale) written to ProjectState; displayed in AV-08 as advisory.
11. Human reviewer selects gate outcome (`Pass`, `Conditional Pass`, or `Fail`) and optionally adds comments.
12. Gate outcome recorded in ProjectState with full provenance (AI recommendation, human decision, reviewer role, timestamp, artifact versions reviewed).
13. If `Pass`: next phase transitions to `Pending → AwaitingInputs`. If `Conditional Pass`: conditional actions created; next phase may proceed. If `Fail`: phase blocked; project status = `Blocked`.
14. Breadcrumbs on all nine views update to reflect new state.

---

### Process: Orchestrator Control Commands

#### pause
- Applicable when phase is in state `Running`.
- Suspends agent execution after current tool call completes (graceful).
- Phase transitions to `Paused`; ProjectState records pause event with timestamp.
- Phase Execution Status displays `Paused`.

#### resume
- Applicable when phase is in state `Paused` or `AwaitingInputs`.
- Idempotent: if phase is already `Running` or `Complete`, command is a no-op.
- Resumes from last checkpoint; does not restart phase from beginning.
- Phase transitions back to `Running`.

#### retry
- Applicable when phase is in state `GateFailed`.
- Resets phase to `AwaitingInputs` after human corrective action.
- Prior gate decision (Fail) preserved in audit history; new gate decision recorded separately.
- Does not invalidate results from other phases.

#### cancel
- Applicable from any non-terminal state.
- Transitions phase to `Cancelled`; project status = `Cancelled` if no active phases remain.
- Cancel is recorded in audit history with operator identity and timestamp.
- Cannot be undone; a new project instance must be created to restart.

#### run-to-gate(target_gate: int)
- Runs all phases starting from current phase up to and including the phase that precedes `target_gate`.
- Pauses at `target_gate` in `AwaitingGate` state; requires human decision before proceeding.
- Each phase in the sequence must complete successfully before the next begins.
- If any phase reaches `GateFailed`, execution halts and run-to-gate terminates.

#### targeted-rerun(input_id: string)
- Triggered when a revised version of a specific logical input is ingested.
- Orchestrator computes affected scope by traversing the dependency graph in ProjectState.
- Only checks, findings, and outputs that depend (directly or transitively) on the revised input are invalidated.
- Reruns only the invalidated items; unaffected results are preserved.
- Original results (pre-revision) retained in ProjectState for comparison and audit.
- After rerun, affected outputs require human re-review where evidence materially changed.

---

### Technical Review Mapping

| TT Lifecycle Phase | Technical Review | Checklist Source |
|---|---|---|
| Phase 0 | Kickoff Checklist | Power Supplies Checklists — Prelim (Kickoff tab) |
| Phase 1 | System Level Review (SLR) | Power Supplies Checklists — Prelim (SLR tab) |
| Phase 2 | **None** | — |
| Phase 3 | Schematic Review / PDR | Power Supplies Checklists — Prelim (Schematic Review tab) |
| Phase 4 | PCB Layout Review + CDR | Power Supplies Checklists — Prelim (PCB Layout tab); selected Mechanical Review and TRR items |
| Phase 5–9 | **None** | — |

**Enforcement:** The Technical Checklist Workspace (AV-06) renders checklist content only for Phases 0, 1, 3, 4. For Phase 2 and Phases 5–9 the checklist panel is hidden and no checklist content is displayed.

---

### Breadcrumb States

| Breadcrumb State | Condition |
|---|---|
| `Completed` | Gate outcome = Pass; phase and gate both fully decided |
| `Current` | Phase is `Running` or `AwaitingGate` |
| `Awaiting Human Decision` | Phase is `AwaitingGate`; gate is `Open` |
| `Conditional Pass` | Gate outcome = Conditional Pass; conditional actions outstanding |
| `Blocked` | Gate outcome = Fail; phase blocked |
| `Upcoming` | Phase is `Pending`; not yet started |
| `Closed` | Phase 9 gate = Decided Pass; project status = Closed |

---

### Inputs

- `phase_id` (integer 0–9, required): target lifecycle phase
- `gate_outcome` (enum: `Pass` | `Conditional Pass` | `Fail`, required for gate decisions): human-selected outcome
- `reviewer_role` (string, required for gate decisions): role of human reviewer
- `reviewer_comments` (string, optional): free-text human comments recorded with gate decision
- `command` (enum: `pause` | `resume` | `retry` | `cancel` | `run_to_gate` | `targeted_rerun`, required for control commands)
- `target_gate` (integer 0–9, required for `run_to_gate`): gate at which execution pauses
- `input_id` (string, required for `targeted_rerun`): logical input identifier whose revised version triggered rerun

---

### Outputs

- Updated `ProjectState.phases[n].phaseState` and `gateState`
- Gate decision record written to `ProjectState.gateDecisions[]`
- Breadcrumb state updates reflected on all nine views
- Audit event appended to `ProjectState.auditHistory[]`
- For `targeted-rerun`: dependency scope computed, affected items invalidated, rerun results written with version linkage

---

### Validation Rules

- Gate outcome must be one of exactly three values: `Pass`, `Conditional Pass`, `Fail`; no other values accepted.
- A gate decision requires `reviewer_role` to be non-empty.
- AI cannot submit a gate decision; gate outcome is a human-only write operation.
- Phase execution (`Running`) requires both logical inputs to be in `User Input Ready` or `Synthetic System Input Ready` state.
- `run_to_gate` target must be greater than current phase index.
- `targeted_rerun` input_id must reference an existing logical input in the current or a prior completed phase.
- Phase may not transition to `Running` if a prior blocking action is unresolved.
- `cancel` is irreversible; system must surface a confirmation prompt before executing.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Gate decision submitted with AI actor | 403 | `GATE_AI_PROHIBITED` | "Gate decisions must be made by an authorized human reviewer. AI cannot approve any gate." |
| Gate outcome value invalid | 400 | `GATE_OUTCOME_INVALID` | "Gate outcome must be Pass, Conditional Pass, or Fail." |
| Phase execution attempted before inputs ready | 409 | `INPUTS_NOT_READY` | "Both inputs must be validated and ready before phase execution can begin." |
| run_to_gate target ≤ current phase | 400 | `RUN_TO_GATE_INVALID` | "Target gate must be ahead of the current phase." |
| targeted_rerun with unknown input_id | 404 | `INPUT_NOT_FOUND` | "The specified logical input ID does not exist in ProjectState." |
| Phase transition not permitted in current state | 409 | `INVALID_STATE_TRANSITION` | "Cannot perform that operation in the current phase state." |
| resume on already-running phase | 200 | — | (no-op; returns current state; no error) |

---

### API Surface (this feature)

See `Y1-api.md` §Orchestrator for full request/response schemas. Summary:

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/orchestrator/phase/{id}/start` | Start phase execution (requires both inputs ready) |
| `POST` | `/api/orchestrator/phase/{id}/pause` | Pause running phase |
| `POST` | `/api/orchestrator/phase/{id}/resume` | Resume paused phase (idempotent) |
| `POST` | `/api/orchestrator/phase/{id}/retry` | Retry failed phase after correction |
| `POST` | `/api/orchestrator/phase/{id}/cancel` | Cancel phase |
| `POST` | `/api/orchestrator/gate/{id}/decide` | Record human gate decision |
| `POST` | `/api/orchestrator/run-to-gate` | Run phases up to specified gate |
| `POST` | `/api/orchestrator/targeted-rerun` | Rerun affected items after input revision |
| `GET` | `/api/orchestrator/state` | Get full orchestrator and phase state summary |

---

### Schema Surface (this feature)

Uses `ProjectState.phases[]`, `ProjectState.gateDecisions[]`, `ProjectState.auditHistory[]` — see `Y0-schema.md` §Orchestration State.

---

*FRD-TTCopilot-v1.0 | F00 | Synthetic POC Data Only*
---

## F01: Artifact-Count Discipline

**Requirements:** AC-01 to AC-05, OP-01 to OP-10 | **Priority:** P0

**Description:** Every lifecycle phase has exactly one external-source input, exactly one internal-artifact input, and exactly one or two outputs for human approval — no more, no fewer. This constraint is enforced at the framework level, in data schemas, API contracts, intake interfaces, artifact generation logic, and test cases. Findings, actions, gate-review packages, audit records, and Cora write-back documents are expressly excluded from the output count; they are rendered from structured ProjectState.

---

### Terminology

- **External Input:** The input sourced from outside TT Electronics (customer-provided document or simulated external-system feed).
- **Internal Input:** The input sourced from within TT Electronics (internal engineering package or simulated internal-system feed).
- **Intake Behavior:** Predetermined per input — either `USER-PROVIDED FILE` (UP) or `SIMULATED EXTERNAL-SYSTEM INTAKE` (SI).
- **Phase Output:** A structured artifact produced by the phase agent and presented to a human reviewer for approval. Maximum two per phase.
- **Non-Output State Data:** Findings, actions, gate decisions, audit events, and compact phase summaries — stored in ProjectState, not counted as phase outputs.

---

### Sub-features

- Exactly one external input per phase enforced at schema and API level
- Exactly one internal input per phase enforced at schema and API level
- One or two phase outputs per phase enforced at schema and API level
- Phase configuration schema defines intake behavior per input (immutable at runtime)
- Gate Review Workspace rendered dynamically from ProjectState; no gate-pack artifact emitted
- Findings and actions stored as ProjectState fields; not counted as outputs
- Count enforcement verified in test cases for all ten phases

---

### Per-Phase Input/Output Specification

| Phase | External Input | Intake | Internal Input | Intake | Output 1 | Output 2 |
|---|---|---|---|---|---|---|
| 0 | Customer Opportunity Package | UP | Capability & Opportunity Assessment Package | SI (Salesforce, Cora, capability library, historical projects, site capacity) | Opportunity Summary & Bid/No-Bid Recommendation (DOCX/PDF, 1–2 pp) | Capability-Match & Critical-Gap Matrix (XLSX, ~10 rows) |
| 1 | Customer Requirements, Quantities & Supplier Pricing Package | UP | Preliminary Cost & Resource Package | SI (Cora, historical proposals, parametric cost model, labor/rate source) | Costed Proposal or Business Case (DOCX/PDF, 1–2 pp) | Resource & Milestone Schedule (XLSX, ~10 rows) |
| 2 | Customer & Standards Requirements Package | UP | Draft System Requirements & Interfaces Package | SI (requirements repository, interface-control repository, Cora) | Requirements Traceability Matrix (XLSX, ~10 rows) | Requirements Quality & Testability Report (DOCX/PDF, 1–2 pp) |
| 3 | Design Rules & Manufacturing Capabilities Package | SI (standards library, manufacturing-capability repository) | Preliminary Design Package | UP | PDR Readiness Summary (DOCX/PDF, 1–2 pp) | Early DFM/DFA Findings & Risk Register (XLSX, ~10 rows) |
| 4 | DFM, Assembly, Standards & Supplier-Risk Package | SI (standards library, supplier feed, obsolescence source) | Released Detailed Design Baseline Package | UP | Source-Cited, Risk-Scored DFM & Standards Audit (XLSX, ~10 findings) | BOM Health & Manufacturability Report (DOCX/PDF, 1–2 pp, includes CDR readiness and design-freeze recommendation) |
| 5 | Test Methods & Customer Acceptance Package | SI (standards library, customer acceptance repository) | Validation Evidence Package | UP | Verification & Validation Matrix (XLSX, ~10 rows) | Gate 5 V&V Summary (DOCX/PDF, 1–2 pp) |
| 6 | Customer Production-Readiness Package | UP | Manufacturing Process & Capability Package | SI (MES, quality system, equipment records, Cora) | Manufacturing Readiness Level Scorecard (XLSX, ~10 rows) | PPAP/FAI Readiness Index & Action List (XLSX, ~10 rows) |
| 7 | Customer Acceptance & Field-Feedback Package | UP | Transfer, Actions, Defects & Yield Package | SI (Cora, MES, CAPA/quality, gate records) | Structured Lessons-Learned Register (XLSX, ~10 rows) | Transfer-Completeness & Improvement-Action Report (DOCX/PDF, 1–2 pp) |
| 8 | Supplier Lifecycle & Availability Package | SI (supplier feeds, distributor feeds, obsolescence databases) | Production, BOM, Yield & Cost Package | SI (ERP, MES, PLM, Change Review Board records) | Obsolescence & Supply-Risk Forecast (XLSX, ~10 rows) | Yield, Quality & Financial-Anomaly Report (DOCX/PDF, 1–2 pp, includes Gate 8 recommendation) |
| 9 | Customer EOL, Last-Time-Buy, Retention & Disposal Package | UP | Final Product, Demand, Asset & Archive Package | SI (ERP, tooling/fixture register, project archive, Cora) | EOL & Last-Time-Buy Decision Pack (DOCX/PDF, 1–2 pp) | Project Closure & Institutional-Memory Record (XLSX/DOCX, ~10 rows or 1–2 pp); project status → Closed after Gate 9 Pass |

**Notes:**
- Phase 8 is the only phase with two SI inputs (both external and internal are simulated).
- Phase 3 is the only phase where the external input is SI and the internal input is UP.
- Opportunity Summary (Phase 0 Output 1) is an **output**, not an input; this is a resolved ambiguity from source documents.
- Project status transitions to `Closed` after Gate 9 `Pass` decision is recorded.

---

### Process: Count Enforcement

1. Phase configuration object is loaded at system initialization; it is immutable at runtime.
2. On any intake or artifact-generation request, the system reads the phase configuration to determine the allowed count and types.
3. Schema validation rejects any write to `ProjectState.phases[n].externalInputs[]` if the array would exceed one element.
4. Schema validation rejects any write to `ProjectState.phases[n].internalInputs[]` if the array would exceed one element.
5. Schema validation rejects any write to `ProjectState.phases[n].outputs[]` if the array would exceed two elements.
6. API endpoints for intake and artifact generation enforce these counts before persisting; return `ARTIFACT_COUNT_VIOLATION` if exceeded.
7. Gate Review Workspace (AV-08) is built from structured state fields; no artifact is emitted from the gate review process.
8. All findings, actions, audit events, and compact phase summaries are written to dedicated ProjectState fields and are never added to `outputs[]`.

---

### Inputs

- `phase_id` (integer 0–9, required): lifecycle phase to configure or validate
- `artifact_type` (enum: `external_input` | `internal_input` | `output`, required): the type of artifact being registered
- `artifact_id` (string, required): unique artifact identifier

---

### Outputs

- Phase configuration record (read-only at runtime): defines intake behavior and expected counts
- Validation result: accepted or rejected with specific count violation detail

---

### Validation Rules

- `external_inputs[]` array per phase: length must equal exactly 1 at time of phase execution.
- `internal_inputs[]` array per phase: length must equal exactly 1 at time of phase execution.
- `outputs[]` array per phase: length must be ≥ 1 and ≤ 2 at time of gate review.
- Gate-pack artifacts, evidence reports, Cora write-back documents, finding summaries, and audit reports must not be registered in `outputs[]`.
- Phase configuration is defined in server-side configuration files; it cannot be modified via API at runtime.
- Test cases must cover all ten phases to verify count compliance.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Attempt to add second external input | 409 | `ARTIFACT_COUNT_VIOLATION` | "Phase {n} already has an external input. Exactly one external input is permitted per phase." |
| Attempt to add second internal input | 409 | `ARTIFACT_COUNT_VIOLATION` | "Phase {n} already has an internal input. Exactly one internal input is permitted per phase." |
| Attempt to add third output | 409 | `ARTIFACT_COUNT_VIOLATION` | "Phase {n} already has two outputs. A maximum of two outputs is permitted per phase." |
| Gate-pack artifact registered as output | 409 | `GATE_PACK_PROHIBITED` | "Gate-pack artifacts must not be registered as phase outputs. Use the Gate Review Workspace." |
| Phase execution before output count validated | 409 | `OUTPUT_COUNT_NOT_VALIDATED` | "Phase outputs have not been validated for count compliance." |

---

### API Surface (this feature)

See `Y1-api.md` §Artifact Count for full schemas. Summary:

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/phases/{id}/config` | Get phase configuration (intake behaviors, expected counts) |
| `GET` | `/api/phases/{id}/artifact-count` | Get current artifact count status for a phase |
| `POST` | `/api/phases/{id}/validate-counts` | Validate that current artifact counts comply with rules |

---

### Schema Surface (this feature)

Uses `PhaseConfig` (immutable, server-side), `ProjectState.phases[n].externalInputs[]`, `ProjectState.phases[n].internalInputs[]`, `ProjectState.phases[n].outputs[]` — see `Y0-schema.md` §Phase Configuration and §Phase State.

---

*FRD-TTCopilot-v1.0 | F01 | Synthetic POC Data Only*
---

## F02: Input Intake Framework

**Requirements:** II-01 to II-21, UP-01 to UP-05, SE-01 to SE-05, IR-01 to IR-03 | **Priority:** P0

**Description:** Every input has a predetermined intake behavior — either USER-PROVIDED FILE (UP) or SIMULATED EXTERNAL-SYSTEM INTAKE (SI) — defined in the phase configuration. The system never prompts the user to select an intake mode. The two intake workflows are fully distinct in their UI presentation, validation logic, status labeling, and audit recording. Intake events are permanently recorded with full provenance.

---

### Terminology

- **USER-PROVIDED FILE (UP):** Intake behavior requiring the user to upload a file; system validates it.
- **SIMULATED EXTERNAL-SYSTEM INTAKE (SI):** Intake behavior using a preloaded synthetic sample representing an enterprise system; user must explicitly ingest the sample.
- **Ingest Sample:** The explicit user action required to accept a synthetic sample into the intake pipeline; automatic ingestion without user action is prohibited.
- **System Represented:** The label identifying which enterprise system (Salesforce, Cora, MES, ERP, etc.) the simulated connector represents.
- **Intake Event:** The immutable audit record written at the completion of any intake action (upload accepted, sample ingested).
- **Upload Revised Version:** The workflow for providing a new version of a user-provided file; prior version is retained. Term "replacement input" is prohibited.
- **Revised Synthetic System Sample Available:** The workflow notification when a new synthetic sample is available; user must ingest explicitly.

---

### Sub-features

- Predetermined intake behavior per input (configured in phase config; not user-selectable)
- USER-PROVIDED FILE workflow: display, upload, validate, confirm, status transition
- SIMULATED EXTERNAL-SYSTEM INTAKE workflow: display, label, ingest action, normalize, record
- Input readiness panel on every Phase Workspace (AV-03)
- Phase Execution Status display with all six states
- Intake event audit record for every intake action
- Prohibited labels and terminology enforced

---

### User-Provided File Workflow (UP)

#### Process

1. System reads phase configuration; determines input requires USER-PROVIDED FILE intake.
2. Phase Workspace (AV-03) Input Readiness Panel displays:
   - **Artifact Name:** e.g., "Customer Opportunity Package"
   - **Required Content Description:** bullet list of required sections/fields
   - **Supported Formats:** accepted file types (e.g., PDF, DOCX, XLSX, CSV)
   - **Size Guidance:** e.g., "~10 rows for XLSX; 1–2 pages for DOCX/PDF"
   - **Sample/Template Link:** optional; if available, shows "Download Sample" link
   - **Upload Prompt:** "Upload [Artifact Name]" button
   - **Status:** `Awaiting User Input`
3. User selects file and submits via upload control.
4. System validates the uploaded file (see Validation Rules below).
5. **If validation fails:** System displays the specific validation failure message. Upload button remains active. Phase execution remains blocked. Status remains `Awaiting User Input`. System does NOT substitute synthetic data.
6. **If validation passes:** System writes artifact record to ProjectState with provenance. Status transitions to `User Input Ready`. Confirmation message displayed: "[Artifact Name] received and validated. Version [n] active."
7. Upload control changes to "Upload Revised Version" after successful intake.
8. Intake event record written to `ProjectState.auditHistory[]`.

#### Validation Rules (User-Provided Files)

- `file_type`: Must match one of the configured accepted formats for this input (e.g., `.pdf`, `.docx`, `.xlsx`, `.csv`). Reject with `FILE_TYPE_INVALID`.
- `parseability`: File must be parseable (not corrupted, not password-protected, not empty). Reject with `FILE_NOT_PARSEABLE`.
- `project_id_field`: If artifact contains a Project ID field, it must match `EVINV-POC-001`. Reject with `PROJECT_ID_MISMATCH`.
- `product_name_field`: If artifact contains a product name field, it must match `EV-INV-800`. Reject with `PRODUCT_NAME_MISMATCH`.
- `phase_field`: If artifact contains a phase field, it must match the current lifecycle phase. Reject with `PHASE_MISMATCH`.
- `revision_field`: Must be present and non-empty for versioned documents. Reject with `REVISION_MISSING`.
- `unit_presence`: Numerical values must have associated units (e.g., kW, VDC, °C). Reject with `UNITS_MISSING`.
- `identifier_uniqueness`: Row identifiers (IDs) within XLSX/CSV must be unique. Reject with `DUPLICATE_IDENTIFIERS`.
- `row_count_guidance`: XLSX/CSV must not exceed ~10 meaningful rows (header excluded). Display warning (not rejection) if exceeded: `ROW_COUNT_WARNING`.
- `page_count_guidance`: DOCX/PDF should be ≤2 pages. Display warning (not rejection) if exceeded: `PAGE_COUNT_WARNING`.
- `data_consistency`: Cross-field consistency checks (e.g., referenced IDs exist, date ranges valid). Reject with `DATA_CONSISTENCY_ERROR`.
- `required_sections`: Document must contain all required sections/fields defined in phase config for this input. Reject with `REQUIRED_SECTION_MISSING`.

#### Status States (UP Workflow)

| Status | Condition |
|---|---|
| `Awaiting User Input` | No file uploaded yet, or prior upload failed validation |
| `Validation In Progress` | File submitted; system is validating |
| `User Input Ready` | File validated successfully; artifact registered |

---

### Simulated External-System Intake Workflow (SI)

#### Process

1. System reads phase configuration; determines input requires SIMULATED EXTERNAL-SYSTEM INTAKE.
2. Phase Workspace (AV-03) Input Readiness Panel displays:
   - **Artifact Name:** e.g., "Capability & Opportunity Assessment Package"
   - **System Represented:** label identifying which enterprise system is simulated (e.g., "Salesforce / Cora / capability library")
   - **Simulated Connector label:** "Simulated Connector — No live connection"
   - **Sample label:** "Preloaded Synthetic Sample"
   - **Synthetic disclaimer:** displayed prominently
   - **View button:** opens artifact viewer for the preloaded sample
   - **Download button:** downloads the preloaded sample file
   - **Ingest Sample button:** the explicit action required to proceed; disabled until user views or downloads
   - **Status:** `Waiting for Synthetic Sample Ingestion`
3. User reviews the synthetic sample (via View or Download).
4. User explicitly clicks "Ingest Sample." System does not auto-ingest.
5. System validates and normalizes the synthetic sample (structural validation; format normalization).
6. System registers provenance: source artifact ID, represented system, intake behavior = `SI`, intake timestamp.
7. System writes intake event record to `ProjectState.auditHistory[]`.
8. Status transitions to `Synthetic System Input Ready`.
9. Confirmation displayed: "[Artifact Name] (Synthetic System Input) ingested from [System Represented]. Version [n] active."

#### Prohibited Labels (SI Workflow)

The following strings must never appear in any UI label, API response, or generated artifact text:

| Prohibited | Use Instead |
|---|---|
| "Connected to [SYSTEM]" | "Simulated Connector" |
| "Retrieved from [SYSTEM]" | "Preloaded Synthetic Sample" |
| "Live [SYSTEM] Data" | "Synthetic System Input" |
| "Real-time [SYSTEM]" | "Simulated [SYSTEM] data" |

#### Status States (SI Workflow)

| Status | Condition |
|---|---|
| `Waiting for Synthetic Sample Ingestion` | Preloaded sample available; user has not yet ingested |
| `Ingesting` | System is validating and normalizing after user clicks "Ingest Sample" |
| `Synthetic System Input Ready` | Sample ingested, validated, and registered |

---

### Intake Event Record Schema

Every intake action (UP or SI) writes one immutable intake event record to `ProjectState.auditHistory[]`:

| Field | Type | Description |
|---|---|---|
| `event_id` | string (UUID) | Unique intake event identifier |
| `event_type` | enum | `USER_FILE_UPLOAD` or `SIMULATED_INTAKE` |
| `phase_id` | integer 0–9 | TT lifecycle phase |
| `logical_input` | string | Name of the logical input (e.g., "Customer Opportunity Package") |
| `intake_behavior` | enum | `UP` or `SI` |
| `user_action` | string | Action taken: "file_uploaded", "sample_ingested", "revised_version_uploaded" |
| `system_represented` | string \| null | Enterprise system label (SI only); null for UP |
| `status` | enum | `User Input Ready` or `Synthetic System Input Ready` |
| `source_artifact_id` | string | Original file/sample artifact ID |
| `normalized_artifact_id` | string | Normalized/validated artifact ID stored in registry |
| `version` | integer | Version number (1 = first; 2 = revised, etc.) |
| `validation_result` | object | `{passed: bool, issues: ValidationIssue[]}` |
| `timestamp` | ISO 8601 datetime | UTC timestamp of intake completion |
| `operator_id` | string | System or user identifier who performed the action |

---

### Input Readiness Panel (Phase Workspace — Both Inputs)

The Phase Workspace (AV-03) must display the following for each of the two logical inputs:

| Field | Description |
|---|---|
| **Artifact Name** | Logical name of this input as defined in phase configuration |
| **Intake Behavior** | `User-Provided File` or `Simulated External-System Intake` |
| **System Represented** | Enterprise system label (SI inputs only; blank for UP) |
| **Format** | Accepted file types |
| **Size Guidance** | Row count or page count guidance |
| **Active Artifact** | Name/ID of the currently active artifact (or "None") |
| **Active Version** | Version number of the active artifact |
| **Validation Status** | Pass/Fail/Pending with validation issue detail if failed |
| **Required User Action** | Next action the user must take (e.g., "Upload file", "Click Ingest Sample") |
| **Ready Indicator** | `Ready` (green) or `Not Ready` (amber/red) |

---

### Phase Execution Status

Displayed prominently on the Phase Workspace, transitions in order:

| Status | Trigger |
|---|---|
| `Waiting for User Input` | UP input not yet uploaded |
| `Waiting for Synthetic Sample Ingestion` | SI input not yet ingested |
| `Ready to Run` | Both inputs validated and ready; awaiting human to initiate execution |
| `Processing` | Phase agent running |
| `Awaiting Human Decision` | Phase execution complete; gate open |
| `Complete` | Gate decided (Pass, Conditional Pass, or Fail recorded) |

Note: If a phase has one UP and one SI input, the status reflects the one that is blocking (not yet ready).

---

### Validation Rules (Framework-Level)

- Intake behavior for every input is defined in phase configuration; runtime selection by user is prohibited.
- Silent substitution of synthetic data for missing user input is prohibited.
- Automatic ingestion of synthetic samples (without explicit user "Ingest Sample" action) is prohibited.
- Phase execution (`Running`) is blocked until both inputs are in `Ready` status.
- Every intake action produces an immutable audit event; no intake action may occur without producing an audit record.
- Prohibited label strings must be absent from all UI strings, API response bodies, and generated artifact text; enforce via automated text scan.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| File upload with unsupported format | 400 | `FILE_TYPE_INVALID` | "File type not accepted. Supported formats: [list]." |
| File not parseable (corrupted/empty) | 400 | `FILE_NOT_PARSEABLE` | "The uploaded file could not be parsed. Please check the file and try again." |
| Project ID mismatch in file | 422 | `PROJECT_ID_MISMATCH` | "Project ID in file does not match EVINV-POC-001." |
| Required section missing | 422 | `REQUIRED_SECTION_MISSING` | "Required section '[section name]' not found in uploaded file." |
| Ingest Sample called without prior view/download | 409 | `INGEST_WITHOUT_REVIEW` | "Please view or download the synthetic sample before ingesting." |
| Auto-ingest attempt (programmatic) | 403 | `AUTO_INGEST_PROHIBITED` | "Automatic sample ingestion is prohibited. User must explicitly click Ingest Sample." |
| Phase execution attempted before both inputs ready | 409 | `INPUTS_NOT_READY` | "Both inputs must be ready before phase execution can begin." |
| Prohibited label string detected in generated text | 500 | `PROHIBITED_LABEL_DETECTED` | "Generated content contains a prohibited connectivity claim. Content rejected." |

---

### API Surface (this feature)

See `Y1-api.md` §Intake for full schemas. Summary:

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/phases/{id}/inputs` | Get input readiness status for both inputs |
| `POST` | `/api/phases/{id}/inputs/external/upload` | Upload user-provided external input file |
| `POST` | `/api/phases/{id}/inputs/internal/upload` | Upload user-provided internal input file |
| `POST` | `/api/phases/{id}/inputs/external/ingest` | Ingest synthetic external sample (explicit user action) |
| `POST` | `/api/phases/{id}/inputs/internal/ingest` | Ingest synthetic internal sample (explicit user action) |
| `POST` | `/api/phases/{id}/inputs/external/upload-revised` | Upload revised version of external input |
| `POST` | `/api/phases/{id}/inputs/internal/upload-revised` | Upload revised version of internal input |
| `GET` | `/api/phases/{id}/execution-status` | Get Phase Execution Status |

---

### Schema Surface (this feature)

Uses `ProjectState.phases[n].externalInput`, `ProjectState.phases[n].internalInput`, `ProjectState.auditHistory[]` (intake event records), `PhaseConfig.intakeBehavior` — see `Y0-schema.md` §Input Intake.

---

*FRD-TTCopilot-v1.0 | F02 | Synthetic POC Data Only*
---

## F03: Input Versioning and Dependency-Aware Revision

**Requirements:** IV-01 to IV-04 | **Priority:** P0

**Description:** Only one version of each logical input is active at any time. When a revised version is provided (either by user upload or by revised synthetic sample availability), the system creates a new version record, preserves all prior versions, makes the new version active, identifies all affected checks, findings, and outputs via the dependency graph, invalidates only the affected items, reruns them, and stores both original and revised results side by side. Human re-review is required wherever evidence materially changes.

---

### Terminology

- **Active Version:** The version of a logical input that is currently used by phase agents, checks, and the Gate Review Workspace. Exactly one per logical input at all times.
- **Historical Version:** A prior version of a logical input that has been superseded; retained in ProjectState for traceability, comparison, audit, and reproduction.
- **Version Record:** A structured record in ProjectState capturing version number, artifact ID, intake behavior, provenance, validation result, timestamp, and active flag.
- **Dependency Graph:** Directed acyclic graph stored in ProjectState mapping each logical input to the checks, findings, and outputs that depend on it.
- **Affected Scope:** The set of checks, findings, and outputs identified by traversing the dependency graph from the revised input node.
- **Invalidated Item:** A check result, finding, or output that depended on the prior version and must be rerun with the new version.
- **Upload Revised Version:** The workflow label for providing a new version of a user-provided file. The term "replacement input" is prohibited in all contexts.
- **Revised Synthetic System Sample Available:** The workflow notification and label for a new version of a synthetic sample.

---

### Sub-features

- Single active version enforcement per logical input
- Prior version retention for traceability and comparison
- Upload Revised Version workflow for user-provided files
- Revised Synthetic System Sample Available workflow for simulated inputs
- Dependency graph traversal to compute affected scope
- Targeted invalidation: only affected items marked `Invalidated`
- Targeted rerun: only invalidated items rerun
- Side-by-side result preservation: original and revised results both stored
- Human re-review flagging when evidence materially changes

---

### Process: Revised User-Provided File

1. Phase Workspace (AV-03) displays "Upload Revised Version" button once an input is in `User Input Ready` status.
2. User submits a revised file via the "Upload Revised Version" control.
3. System creates a new `InputVersion` record: `version = prior_version + 1`, `active = false` (pending validation).
4. System runs all UP validation rules (see F02) on the revised file.
5. If validation fails: new version record marked `validation_failed`; prior version remains active. User must correct and re-upload.
6. If validation passes: new version record marked `active = true`; prior version record set `active = false` (retained).
7. System traverses the dependency graph from this logical input node to compute affected scope.
8. All items in affected scope are marked `Invalidated` in ProjectState.
9. Orchestrator is notified; initiates targeted rerun for the invalidated items.
10. Rerun executes affected checks, regenerates affected findings and outputs.
11. New results stored under `version_ref = new_version_id`; original results retain `version_ref = prior_version_id`.
12. For each affected output where evidence materially changed: output `review_required` flag set to `true`; Gate Review Workspace highlights items requiring re-review.
13. Intake event record written to `ProjectState.auditHistory[]` with `user_action = "revised_version_uploaded"`.

---

### Process: Revised Synthetic System Sample

1. When a revised synthetic sample becomes available (e.g., after Phase 4 correction cycle), the system creates a new `InputVersion` record for the SI input with `status = available`, `active = false`.
2. Phase Workspace displays notification: "Revised Synthetic System Sample Available — [System Represented]."
3. Status indicator for the input changes to `Revised Sample Available; Ingest Required`.
4. User explicitly clicks "Ingest Revised Sample" (same explicit-action requirement as initial ingestion).
5. System validates and normalizes the revised sample.
6. If validation passes: new version made active; prior version retained.
7. System traverses dependency graph; computes and invalidates affected scope.
8. Targeted rerun executed; results stored with version reference.
9. Intake event written with `user_action = "revised_sample_ingested"`.

---

### Dependency Graph Structure

The dependency graph is maintained in `ProjectState.dependencyGraph` as an adjacency list:

- **Nodes:** logical inputs, deterministic checks, findings, phase outputs
- **Edges:** directed edges from input → check, input → finding (where finding is detected from input content), check → finding, finding → output, input → output
- **Traversal:** on revision of input X, perform breadth-first traversal from X; collect all reachable nodes; these form the affected scope

Example dependency chain for Phase 4 external input revision:
```
Phase4.ExternalInput → CrossArtifactConsistencyCheck
Phase4.ExternalInput → HVClearanceCheck
Phase4.ExternalInput → DeratingCheck
Phase4.ExternalInput → TestPointCoverageCheck
HVClearanceCheck → Finding[F4-001]
DeratingCheck → Finding[F4-002]
CrossArtifactConsistencyCheck → Finding[F4-004]
Phase4.ExternalInput → Output[DFM_Audit]
```

---

### Version Record Schema

Each logical input maintains a `versions[]` array in ProjectState:

| Field | Type | Description |
|---|---|---|
| `version_id` | string (UUID) | Unique version identifier |
| `version_number` | integer | Sequential (1, 2, 3, …) |
| `artifact_id` | string | Reference to artifact in artifact registry |
| `intake_behavior` | enum | `UP` or `SI` |
| `active` | boolean | True for exactly one version at any time |
| `validation_result` | object | `{passed: bool, issues: ValidationIssue[]}` |
| `intake_timestamp` | ISO 8601 | UTC timestamp of intake |
| `invalidated_by` | string \| null | `version_id` of version that superseded this one |
| `rerun_triggered` | boolean | Whether this version triggered a targeted rerun |
| `affected_scope` | string[] | List of check/finding/output IDs invalidated by this version |

---

### Inputs

- `phase_id` (integer 0–9, required): lifecycle phase of the input being revised
- `input_type` (enum: `external` | `internal`, required): which logical input is being revised
- `file` (binary, required for UP revision): the revised file
- (For SI revision, no file input — system generates revised sample automatically)

---

### Outputs

- New `InputVersion` record created and made active
- Prior `InputVersion` record retained with `active = false`
- `dependencyGraph` traversal result: `affected_scope[]` list
- Invalidated check results marked in `ProjectState.checkResults[]`
- Invalidated finding results marked in `ProjectState.findings[]`
- Invalidated outputs marked in `ProjectState.phases[n].outputs[]`
- Rerun results written with `version_ref` pointing to new version
- Intake audit event appended to `ProjectState.auditHistory[]`

---

### Validation Rules

- Exactly one `InputVersion` record per logical input may have `active = true` at any time; enforced at write level.
- Prior versions must never be deleted; only `active` flag may change (from true to false).
- The term "replacement input" must not appear in any UI label, API response, or audit record.
- Revised version must pass all validation rules (same rules as initial intake) before being made active.
- If revised version fails validation, the prior active version remains active and unchanged.
- Targeted rerun must only invalidate items in the computed `affected_scope`; it must not invalidate unrelated checks from other inputs.
- Original results (from prior version) must be stored with their `version_ref` intact after rerun.
- Human `review_required` flag must be set on any output where key evidence fields changed between original and revised results.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Revised file fails validation | 422 | `REVISION_VALIDATION_FAILED` | "Revised version did not pass validation: [specific issue]. Prior version remains active." |
| Two active versions detected (data integrity) | 500 | `VERSION_INTEGRITY_VIOLATION` | "Internal error: more than one active version detected for input [id]. Contact system administrator." |
| Dependency graph traversal fails | 500 | `DEPENDENCY_GRAPH_ERROR` | "Dependency graph traversal failed for input [id]. Targeted rerun cannot proceed." |
| Revised sample ingest attempted without availability | 409 | `REVISED_SAMPLE_NOT_AVAILABLE` | "No revised synthetic sample is available for this input." |
| Prior version accessed for read after supersession | 200 | — | (read-only access to historical version succeeds; no error) |

---

### API Surface (this feature)

See `Y1-api.md` §Versioning for full schemas. Summary:

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/phases/{id}/inputs/{type}/versions` | List all versions (active + historical) for a logical input |
| `GET` | `/api/phases/{id}/inputs/{type}/versions/{vid}` | Get a specific version record |
| `POST` | `/api/phases/{id}/inputs/{type}/upload-revised` | Upload revised user-provided file |
| `POST` | `/api/phases/{id}/inputs/{type}/ingest-revised` | Ingest revised synthetic sample |
| `GET` | `/api/phases/{id}/inputs/{type}/affected-scope` | Compute and return affected scope for current active version |
| `GET` | `/api/project/dependency-graph` | Get full dependency graph |

---

### Schema Surface (this feature)

Uses `ProjectState.phases[n].externalInput.versions[]`, `ProjectState.phases[n].internalInput.versions[]`, `ProjectState.dependencyGraph`, `ProjectState.checkResults[]`, `ProjectState.findings[]` — see `Y0-schema.md` §Versioning and §Dependency Graph.

---

*FRD-TTCopilot-v1.0 | F03 | Synthetic POC Data Only*
---

## F04: Shared ProjectState

**Requirements:** PS-01 to PS-04 | **Priority:** P0

**Description:** One versioned `ProjectState` object is the single source of truth for the entire product lifecycle. It is maintained persistently across all phases and contains the complete artifact registry, input version histories, provenance records, dependency graph, deterministic check results, findings, actions, gate decisions, conditional-pass conditions, compact phase summaries, and full immutable audit history. Every application view reads from this shared state. All write operations are validated against schema-level count enforcement rules before persisting.

---

### Terminology

- **ProjectState:** The top-level versioned object encapsulating all lifecycle data for EVINV-POC-001.
- **State Version:** Monotonically increasing version number incremented on every write operation; used for optimistic concurrency.
- **Artifact Registry:** The lookup table of all artifacts (inputs, outputs, synthetic samples) with provenance.
- **Compact Phase Summary:** A structured, condensed representation of an approved phase's key decisions and outputs; stored in ProjectState and used as upstream context by downstream agents (full documents not re-transmitted).
- **Conditional Pass Conditions:** The set of actions that must be closed before a Conditional Pass gate is considered fully satisfied.

---

### Sub-features

- Project identity and lifecycle position fields
- Per-phase state objects (one per phase 0–9)
- Artifact registry with provenance and version references
- Dependency graph
- Deterministic check results store
- Findings store
- Actions store
- Gate decisions store (with full provenance)
- Compact approved-phase summaries store
- Full immutable audit history (append-only)
- Schema-level enforcement of artifact count limits
- State versioning and optimistic concurrency

---

### ProjectState Top-Level Fields

| Field | Type | Description |
|---|---|---|
| `state_id` | string (UUID) | Unique ProjectState identifier |
| `state_version` | integer | Monotonically increasing; incremented on every write |
| `project_id` | string | Always `EVINV-POC-001` for this POC |
| `product_name` | string | `EV-INV-800 Demonstration Traction Inverter` |
| `project_type` | string | `NPI A` |
| `project_category` | string | `Category 1` |
| `current_phase` | integer 0–9 | The lifecycle phase currently active |
| `current_gate` | integer 0–9 | The gate being approached |
| `current_technical_review` | string \| null | Active technical review name (Kickoff, SLR, Schematic/PDR, PCB Layout/CDR) or null |
| `project_status` | enum | `Active`, `Blocked`, `Cancelled`, `Closed` |
| `synthetic_data_indicator` | boolean | Always `true` for POC |
| `created_at` | ISO 8601 | Project creation timestamp |
| `updated_at` | ISO 8601 | Last write timestamp |

---

### Per-Phase State Object (phases[0..9])

Each element in the `phases[]` array has the following structure:

| Field | Type | Description |
|---|---|---|
| `phase_id` | integer 0–9 | TT lifecycle phase number |
| `phase_name` | string | e.g., "Phase 0 — Commercial Assessment" |
| `technical_review` | string \| null | Technical review name where mapped; null otherwise |
| `phase_state` | enum | `Pending`, `AwaitingInputs`, `Running`, `AwaitingGate`, `GatePassed`, `GateConditional`, `GateFailed`, `Cancelled`, `Paused` |
| `gate_state` | enum | `Locked`, `Open`, `Decided` |
| `external_input` | PhaseInputState | External input object (exactly one; see below) |
| `internal_input` | PhaseInputState | Internal input object (exactly one; see below) |
| `outputs` | PhaseOutput[] | Array of 1–2 output objects; schema enforces max 2 |
| `ai_recommendation` | AIRecommendation \| null | AI recommended gate outcome and rationale |
| `compact_phase_summary` | CompactPhaseSummary \| null | Approved phase summary for downstream agent context |
| `execution_started_at` | ISO 8601 \| null | Timestamp when phase moved to `Running` |
| `execution_completed_at` | ISO 8601 \| null | Timestamp when phase moved to `AwaitingGate` |

---

### PhaseInputState Object

| Field | Type | Description |
|---|---|---|
| `logical_name` | string | Canonical artifact name (e.g., "Customer Opportunity Package") |
| `intake_behavior` | enum | `UP` (User-Provided File) or `SI` (Simulated Intake) |
| `system_represented` | string \| null | Enterprise system label for SI inputs; null for UP |
| `accepted_formats` | string[] | e.g., `["pdf", "docx"]` |
| `size_guidance` | string | e.g., "~10 rows for XLSX; 1–2 pages for DOCX/PDF" |
| `versions` | InputVersion[] | All versions; exactly one has `active = true` |
| `readiness_status` | enum | `AwaitingUserInput`, `ValidationInProgress`, `UserInputReady`, `WaitingForSampleIngestion`, `SyntheticSystemInputReady` |
| `validation_issues` | ValidationIssue[] | Current validation issues if status is not ready |
| `required_user_action` | string \| null | Description of what the user must do next |

---

### PhaseOutput Object

| Field | Type | Description |
|---|---|---|
| `output_id` | string (UUID) | Unique output identifier |
| `output_name` | string | Canonical output name (e.g., "Opportunity Summary & Bid/No-Bid Recommendation") |
| `artifact_type` | enum | `DOCX`, `PDF`, `XLSX`, `CSV` |
| `size_guidance` | string | e.g., "1–2 pages" or "~10 rows" |
| `artifact_id` | string \| null | Reference to artifact in artifact registry |
| `version_ref` | string | Version ID of the input version(s) that produced this output |
| `approval_status` | enum | `Pending`, `AwaitingReview`, `Approved`, `Rejected`, `ReviewRequired` |
| `review_required` | boolean | True if evidence materially changed after revision rerun |
| `approved_by` | string \| null | Reviewer role that approved this output |
| `approved_at` | ISO 8601 \| null | Approval timestamp |

---

### AIRecommendation Object

| Field | Type | Description |
|---|---|---|
| `recommendation_id` | string (UUID) | Unique recommendation identifier |
| `recommended_outcome` | enum | `Pass`, `Conditional Pass`, `Fail` |
| `rationale` | string | AI-generated narrative rationale (advisory only) |
| `key_findings_referenced` | string[] | Finding IDs cited in rationale |
| `key_checks_referenced` | string[] | Check result IDs cited in rationale |
| `generated_at` | ISO 8601 | When AI recommendation was generated |
| `model_id` | string | LLM model identifier used |

---

### GateDecision Object (gateDecisions[])

| Field | Type | Description |
|---|---|---|
| `decision_id` | string (UUID) | Unique gate decision identifier |
| `gate_number` | integer 0–9 | TT lifecycle gate |
| `ai_recommendation` | AIRecommendation | AI recommendation at time of decision |
| `human_disposition` | string | Human reviewer's notes on the AI recommendation |
| `reviewer_role` | string | Role of the human who recorded the decision |
| `decision` | enum | `Pass`, `Conditional Pass`, `Fail` |
| `comments` | string \| null | Human reviewer free-text comments |
| `timestamp` | ISO 8601 | Decision timestamp |
| `artifact_versions_reviewed` | string[] | Version IDs of artifacts reviewed |
| `open_conditions` | ConditionalPassAction[] | For Conditional Pass: actions that must close |
| `is_final` | boolean | True once gate is closed; immutable thereafter |

---

### Finding Object (findings[])

| Field | Type | Description |
|---|---|---|
| `finding_id` | string | Unique finding ID (e.g., `F4-001`) |
| `source_phase` | integer 0–9 | Phase in which the finding was raised |
| `source_gate` | integer 0–9 | Gate associated with the phase |
| `detected_by` | enum | `DeterministicCheck`, `AgentAnalysis`, `HumanReview` |
| `check_id` | string \| null | Check result ID if detected by deterministic check |
| `description` | string | Finding description |
| `severity` | enum | `Critical`, `Major`, `Minor`, `Observation` |
| `status` | enum | `Open`, `ActionPending`, `ActionApproved`, `Closed`, `VerifiedClosed` |
| `seeded` | boolean | True if this is a seeded demonstration issue |
| `created_at` | ISO 8601 | When finding was raised |
| `closed_at` | ISO 8601 \| null | When finding was closed |

---

### Action Object (actions[])

| Field | Type | Description |
|---|---|---|
| `action_id` | string | Unique action ID (e.g., `A4-001`) |
| `source_finding_id` | string | Finding ID this action addresses |
| `source_phase` | integer 0–9 | Phase in which action was raised |
| `source_gate` | integer 0–9 | Gate at which action was raised |
| `description` | string | Action description |
| `owner_role` | string | Role responsible for completing the action |
| `blocking` | boolean | True if this action must close before the gate can pass |
| `due_phase` | integer 0–9 | Phase by which this action must be closed |
| `due_gate` | integer 0–9 | Gate by which this action must be closed |
| `required_closure_evidence` | string | Description of what constitutes closure |
| `status` | enum | `Open`, `InProgress`, `ClosedPendingVerification`, `VerifiedClosed`, `Waived` |
| `human_approver` | string \| null | Reviewer role who approved the action |
| `closure_evidence_artifact_id` | string \| null | Artifact proving closure |
| `created_at` | ISO 8601 | When action was created |
| `closed_at` | ISO 8601 \| null | When action was closed |

---

### CompactPhaseSummary Object

| Field | Type | Description |
|---|---|---|
| `phase_id` | integer 0–9 | Source phase |
| `summary_version` | integer | Incremented if phase is rerun |
| `gate_outcome` | enum | `Pass`, `Conditional Pass` |
| `key_decisions` | string[] | Bullet list of material decisions made |
| `key_outputs` | OutputRef[] | Output names and artifact IDs for approved outputs |
| `open_actions` | string[] | Action IDs still open from this phase |
| `findings_summary` | string | One-paragraph summary of findings |
| `token_estimate` | integer | Estimated token count for downstream use |
| `generated_at` | ISO 8601 | When summary was generated |

---

### AuditEvent Object (auditHistory[] — append-only)

| Field | Type | Description |
|---|---|---|
| `audit_id` | string (UUID) | Unique audit event identifier |
| `event_type` | enum | `IntakeEvent`, `GateDecision`, `FindingRaised`, `ActionCreated`, `ActionClosed`, `PhaseStateChange`, `CheckRun`, `VersionCreated`, `OutputApproved`, `Cancellation` |
| `phase_id` | integer \| null | Relevant phase (null for project-level events) |
| `description` | string | Human-readable description of the event |
| `actor` | string | System component or reviewer role that caused the event |
| `related_ids` | string[] | IDs of related objects (artifact_id, finding_id, action_id, etc.) |
| `payload` | object | Event-specific data (varies by event_type) |
| `timestamp` | ISO 8601 | UTC timestamp |

**Enforcement:** auditHistory is append-only. No update or delete operations are permitted on audit records.

---

### Schema Enforcement Rules

- `phases[n].external_input.versions[]`: exactly one element must have `active = true` at all times (enforced at write).
- `phases[n].internal_input.versions[]`: exactly one element must have `active = true` at all times.
- `phases[n].outputs[]`: maximum 2 elements (schema constraint; insert rejected if length = 2).
- `project_status = Closed` may only be set when `phases[9].gate_state = Decided` and `gateDecisions[9].decision = Pass`.
- `gateDecisions[]` records are immutable once `is_final = true`; no update operations permitted.
- `auditHistory[]` is strictly append-only; no delete or update operations permitted.
- `synthetic_data_indicator` is always `true` for EVINV-POC-001; write of `false` is rejected.
- AI recommendation fields must not appear in the `gateDecisions[].decision` field; that field may only be written by a human action.

---

### API Surface (this feature)

See `Y1-api.md` §ProjectState for full schemas. Summary:

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/project/state` | Get full ProjectState |
| `GET` | `/api/project/state/phases/{id}` | Get per-phase state object |
| `GET` | `/api/project/state/findings` | Get all findings |
| `GET` | `/api/project/state/actions` | Get all actions |
| `GET` | `/api/project/state/gate-decisions` | Get all gate decisions |
| `GET` | `/api/project/state/audit-history` | Get full audit history |
| `GET` | `/api/project/state/compact-summaries` | Get all compact phase summaries |

---

*FRD-TTCopilot-v1.0 | F04 | Synthetic POC Data Only*
---

## F05: Deterministic Engineering Checks

**Requirements:** DP-01 to DP-07, SS-01 | **Priority:** P0

**Description:** At least four deterministic engineering checks (and one process-capability check) run outside the LLM as standalone tool calls, producing structured, reproducible results. Running checks outside the LLM ensures that the same inputs always produce the same outputs — independent of model temperature, model version, or prompt variation. Each check records its complete provenance: inputs used, formula or method applied, threshold, unit, result, pass/fail status, source reference, and known limitations. Check results are stored in ProjectState and are version-aware: they are invalidated and rerun when their dependent inputs change (see F03).

---

### Terminology

- **Deterministic Check:** A calculation or consistency rule executed as a tool call outside the LLM; result is purely a function of the input data.
- **Check Result Record:** The structured output of a deterministic check stored in ProjectState.
- **EVINV-POC-STD-001:** Synthetic POC standard ("EV Traction Inverter Design and Manufacturing Standard, POC Demonstration Edition", Version 1.0) that defines thresholds for clearance, derating, and Cpk; labeled as a synthetic POC standard, not an approved TT or industry standard.
- **Cpk:** Process Capability Index = min(USL − μ, μ − LSL) / (3σ); measures how centered and narrow a process is relative to its specification limits.
- **Derating Margin:** The margin by which a component's operating stress is kept below its rated maximum, expressed as a percentage.
- **Test Point Coverage:** The fraction of defined diagnostic nets that have an accessible physical test point.
- **Cross-Artifact Consistency:** Verification that reference designators, revision levels, and part numbers are consistent across two or more design documents.

---

### Sub-features

- Check 1 — Cross-Artifact Reference and Revision Consistency (Phase 4)
- Check 2 — High-Voltage Clearance (Phase 4)
- Check 3 — Component Derating (Phase 4)
- Check 4 — Test-Point Coverage (Phase 4)
- Check 5 — Cpk Calculation (Phase 6)
- Additional deterministic logic: cost calculations, traceability completeness, requirement testability flags, action closure verification, inventory reconciliation (across phases)
- All check results stored in ProjectState with full provenance
- Version-aware: checks invalidated and rerun when dependent inputs change

---

### Check Result Record Schema (all checks)

| Field | Type | Description |
|---|---|---|
| `check_id` | string (UUID) | Unique check result identifier |
| `check_type` | enum | `CrossArtifactConsistency`, `HVClearance`, `ComponentDerating`, `TestPointCoverage`, `Cpk`, `CostCalc`, `TraceabilityCompleteness`, `RequirementTestability`, `ActionClosure`, `InventoryReconciliation` |
| `phase_id` | integer 0–9 | Phase in which the check ran |
| `input_version_ids` | string[] | Version IDs of all inputs used in this check |
| `formula_or_method` | string | Human-readable description of the formula or comparison method |
| `threshold` | number \| string | The pass/fail threshold value |
| `threshold_unit` | string | Unit of the threshold (e.g., `mm`, `%`, dimensionless) |
| `result_value` | number \| string | Computed or extracted result |
| `result_unit` | string | Unit of the result |
| `status` | enum | `Pass`, `Fail`, `Warning` |
| `source_reference` | string | Standard, clause, or POC rule cited (e.g., "EVINV-POC-STD-001 §3.2") |
| `limitation` | string | Known limitation of this check (e.g., "Clearance measured from 2D design data only") |
| `items_checked` | CheckItem[] | Per-item detail (one row per component, net, requirement, etc.) |
| `invalidated` | boolean | True if this result has been invalidated by a revised input |
| `superseded_by` | string \| null | `check_id` of the rerun result that replaced this one |
| `run_at` | ISO 8601 | Timestamp when check executed |

---

### Check 1: Cross-Artifact Reference and Revision Consistency (Phase 4)

**Purpose:** Verifies that reference designators, part numbers, revision levels, and footprint identifiers are consistent between the Released Detailed Design Baseline Package (internal input) and the DFM/Standards Package (external input).

**Inputs used:**
- `Phase4.InternalInput` (Released Detailed Design Baseline Package) — schematic/layout netlist/BOM
- `Phase4.ExternalInput` (DFM, Assembly, Standards & Supplier-Risk Package) — DFM rules referencing part and footprint IDs

**Method:**
1. Extract all reference designators and part numbers from internal input BOM.
2. Extract all reference designators and part numbers referenced in external input DFM rules.
3. For each reference in the external input, verify it exists in the internal BOM with matching revision.
4. For each footprint ID in the internal input, verify it matches the expected footprint in the external DFM database.
5. Flag any mismatches as `Fail` items.

**Threshold:** Zero mismatches for `Pass`; any mismatch = `Fail`.

**Output per item:**

| Field | Type | Description |
|---|---|---|
| `item_id` | string | Reference designator or footprint ID |
| `field_checked` | string | e.g., "Part Number", "Revision", "Footprint" |
| `value_in_internal` | string | Value from internal design package |
| `value_in_external` | string | Value from external DFM package |
| `match` | boolean | True if consistent |
| `status` | enum | `Pass` or `Fail` |

**Seeded issue (SI-03):** One BOM/design footprint mismatch is seeded. Capacitor `C_HV_1` has footprint `0805` in BOM but DFM rules reference `1206`. Detected by this check. Corrected in revised design (SI-04).

**Source reference:** EVINV-POC-STD-001 §2.1 — Cross-Document Consistency Requirements (Synthetic POC Standard).
**Limitation:** Checks textual consistency only; does not verify electrical correctness or 3D clearances.

---

### Check 2: High-Voltage Clearance (Phase 4)

**Purpose:** Compares measured PCB clearances between high-voltage nets (≥60 V) against the minimum clearance threshold defined in EVINV-POC-STD-001. Flags any clearance below threshold.

**Inputs used:**
- `Phase4.InternalInput` — PCB layout clearance data (extracted from design file or provided as structured table in internal package)

**Method:**
1. For each HV net pair in the clearance table, extract the measured clearance value.
2. Compare against `EVINV-POC-STD-001 §3.1` minimum clearance threshold = 8.0 mm (air), 5.0 mm (creepage, synthetic POC values).
3. Flag any net pair where measured clearance < threshold as `Fail`.

**Threshold:** 8.0 mm air / 5.0 mm creepage (EVINV-POC-STD-001 §3.1 — Synthetic POC Standard).
**Unit:** mm.

**Output per item:**

| Field | Type | Description |
|---|---|---|
| `net_pair` | string | e.g., "VBUS+ to VBUS−" |
| `clearance_type` | enum | `Air` or `Creepage` |
| `measured_mm` | number | Measured clearance from design data |
| `threshold_mm` | number | EVINV-POC-STD-001 threshold |
| `margin_mm` | number | `measured_mm − threshold_mm` |
| `status` | enum | `Pass` or `Fail` |

**Seeded issue (SI-03):** Net pair `VBUS+ to GND_SHIELD` has measured clearance of 6.2 mm against 8.0 mm threshold. Margin = −1.8 mm. Status = `Fail`. Corrected in revised design (SI-04).

**Source reference:** EVINV-POC-STD-001 §3.1 — High-Voltage Clearance and Creepage Requirements (Synthetic POC Standard).
**Limitation:** Clearance values taken from design data provided in the internal package; not extracted directly from CAD files in POC.

---

### Check 3: Component Derating (Phase 4)

**Purpose:** Calculates the derating margin for each stress-sensitive component (capacitors, MOSFETs, diodes) by comparing operating stress to rated maximum. Flags components where the derating margin falls below the EVINV-POC-STD-001 minimum.

**Inputs used:**
- `Phase4.InternalInput` — BOM with rated values and design-specified operating conditions
- `Phase4.ExternalInput` — DFM/Standards package containing derating rules

**Method:**
1. For each component in the derating scope (capacitors: voltage; MOSFETs: VDS, ID; diodes: VRRM, IF):
   - Extract rated value from BOM/datasheet reference.
   - Extract operating stress from design conditions in internal package.
   - Compute derating margin = `(Rated − Operating) / Rated × 100%`.
2. Compare against minimum derating margin from EVINV-POC-STD-001 §3.3:
   - Capacitors: ≥ 50% voltage derating margin required.
   - MOSFETs (VDS): ≥ 30% margin required.
   - Diodes (VRRM): ≥ 30% margin required.
3. Flag any component where margin < threshold as `Fail`.

**Output per item:**

| Field | Type | Description |
|---|---|---|
| `ref_des` | string | Reference designator (e.g., `C_HV_2`) |
| `component_type` | string | e.g., `Capacitor`, `MOSFET` |
| `stress_parameter` | string | e.g., `Voltage`, `VDS`, `VRRM` |
| `rated_value` | number | Rated maximum from component spec |
| `operating_value` | number | Design operating stress |
| `unit` | string | e.g., `V`, `A` |
| `derating_margin_pct` | number | `(Rated − Operating) / Rated × 100` |
| `threshold_pct` | number | EVINV-POC-STD-001 minimum margin |
| `status` | enum | `Pass` or `Fail` |

**Seeded issue (SI-03):** Capacitor `C_BULK_3` rated 450 V, operating stress 430 V, derating margin = 4.4% against 50% threshold. Status = `Fail`. Corrected in revised design (SI-04).

**Source reference:** EVINV-POC-STD-001 §3.3 — Component Stress and Derating Limits (Synthetic POC Standard).
**Limitation:** Operating stress values sourced from design package; worst-case stress analysis not performed in POC.

---

### Check 4: Test-Point Coverage (Phase 4)

**Purpose:** Verifies that every diagnostic net identified in the design has an accessible physical test point. Flags any diagnostic net with no associated test point.

**Inputs used:**
- `Phase4.InternalInput` — netlist with diagnostic net designations and test point list

**Method:**
1. Extract list of nets flagged as `diagnostic` in the netlist.
2. Extract list of accessible test points from the design package.
3. For each diagnostic net, verify at least one test point is associated with it.
4. Flag diagnostic nets with no accessible test point as `Fail`.

**Threshold:** Zero uncovered diagnostic nets for `Pass`; any uncovered net = `Fail`.
**Unit:** Count of uncovered nets.

**Output per item:**

| Field | Type | Description |
|---|---|---|
| `net_name` | string | Diagnostic net identifier |
| `test_point_ids` | string[] | Associated test point IDs (empty if none) |
| `accessible` | boolean | True if at least one test point exists |
| `status` | enum | `Pass` or `Fail` |

**Seeded issue (SI-03):** Diagnostic net `DIAG_TEMP_IGBT_CASE` has no accessible test point. Status = `Fail`. Corrected in revised design (SI-04).

**Source reference:** EVINV-POC-STD-001 §4.2 — Diagnostic Accessibility Requirements (Synthetic POC Standard).
**Limitation:** Accessibility determined from design data; physical access constraints (cable routing, enclosure clearance) not assessed in POC.

---

### Check 5: Cpk Calculation (Phase 6)

**Purpose:** Computes the process capability index (Cpk) for a critical assembly characteristic from MES process data. Flags characteristics where Cpk falls below the synthetic acceptance threshold.

**Inputs used:**
- `Phase6.InternalInput` — Manufacturing Process & Capability Package containing process sample data (measurements, USL, LSL, sample size)

**Method:**
1. For each critical assembly characteristic in the capability package:
   - Extract sample measurements, Upper Specification Limit (USL), Lower Specification Limit (LSL).
   - Compute mean (μ) and standard deviation (σ) from sample data.
   - Compute `Cpk = min((USL − μ) / (3σ), (μ − LSL) / (3σ))`.
2. Compare Cpk against synthetic threshold = 1.33 (EVINV-POC-STD-001 §5.1).
3. Flag any characteristic with Cpk < 1.33 as `Fail`.

**Threshold:** Cpk ≥ 1.33 (EVINV-POC-STD-001 §5.1 — Synthetic POC Standard).
**Unit:** Dimensionless.

**Output per item:**

| Field | Type | Description |
|---|---|---|
| `characteristic_id` | string | Characteristic identifier (e.g., `TORQUE_TERM_1`) |
| `characteristic_name` | string | e.g., "Terminal Torque — Position 1" |
| `sample_size` | integer | Number of measurements |
| `mean` | number | Sample mean |
| `std_dev` | number | Sample standard deviation |
| `usl` | number | Upper Specification Limit |
| `lsl` | number | Lower Specification Limit |
| `unit` | string | Measurement unit (e.g., `N·m`) |
| `cpk` | number | Computed Cpk value (4 decimal places) |
| `threshold` | number | 1.33 |
| `status` | enum | `Pass` or `Fail` |

**Seeded issue (SI-06):** Characteristic `SOLDER_JOINT_SHEAR_HV_BUS` has Cpk = 0.87 against threshold 1.33. Status = `Fail`. Human approves corrective action; revised MES sample ingested; check rerun.

**Source reference:** EVINV-POC-STD-001 §5.1 — Process Capability Requirements (Synthetic POC Standard).
**Limitation:** Cpk computed from synthetic sample data only; assumes normal distribution; does not account for measurement system variation.

---

### Additional Deterministic Logic (All Phases)

| Check Type | Phase(s) | Method | Threshold |
|---|---|---|---|
| Cost calculation | Phase 1 | Sum of BOM unit costs × quantities + labor rates × hours | Within ±5% of parametric estimate |
| Traceability completeness | Phase 2 | Count of requirements with ≥1 linked test method / total requirements | ≥ 90% for Pass; < 90% = Warning |
| Requirement testability flag | Phase 2 | Rule: requirement must contain a measurable acceptance criterion (numeric value or binary observable) | Any untestable requirement = Flag |
| Action closure verification | Phase 4, 5, 6, 7 | Verify all blocking actions due by this phase have status `VerifiedClosed` | Zero open blocking actions for gate pass |
| Inventory reconciliation | Phase 8 | Compare BOM quantities against ERP/MES stock levels; flag discrepancies | Zero unresolved discrepancies for pass |

---

### Validation Rules

- All five primary checks must run before Phase 4 / Phase 6 gate reviews; gate review blocked if checks have not run.
- Check must not use LLM inference for threshold comparison or calculation; all arithmetic performed in deterministic code.
- Check inputs must reference specific `version_id` records; if a version is invalidated, check must rerun with the current active version.
- `status` field must be set to exactly one of `Pass`, `Fail`, or `Warning`; no partial or ambiguous states.
- `source_reference` must cite EVINV-POC-STD-001 with section number; the standard must be labeled "Synthetic POC Standard" in every reference.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Check run with no active input version | 409 | `NO_ACTIVE_INPUT_VERSION` | "Cannot run check: no active version for input [logical_name]." |
| Gate review attempted before required checks run | 409 | `REQUIRED_CHECKS_NOT_RUN` | "Phase {n} gate review requires all mandatory checks to have run. Missing: [check_types]." |
| LLM inference detected in check result | 500 | `DETERMINISTIC_INTEGRITY_VIOLATION` | "Check result contains LLM-generated content. Deterministic checks must not use LLM inference." |
| Standard referenced without Synthetic label | 422 | `SYNTHETIC_LABEL_MISSING` | "Reference to EVINV-POC-STD-001 must include 'Synthetic POC Standard' label." |

---

### API Surface (this feature)

See `Y1-api.md` §Checks for full schemas. Summary:

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/checks/phase/{id}/run` | Run all mandatory checks for a phase |
| `POST` | `/api/checks/{check_type}/run` | Run a specific check type for a phase |
| `GET` | `/api/checks/phase/{id}/results` | Get all check results for a phase |
| `GET` | `/api/checks/{check_id}` | Get a specific check result record |
| `POST` | `/api/checks/{check_id}/invalidate` | Mark a check result as invalidated (triggered by targeted-rerun) |

---

### Schema Surface (this feature)

Uses `ProjectState.checkResults[]` — see `Y0-schema.md` §Check Results.

---

*FRD-TTCopilot-v1.0 | F05 | Synthetic POC Data Only*
---

## F06: Seeded Issues and Correction Cycles

**Requirements:** SI-01 to SI-08 | **Priority:** P0

**Description:** Eight specific engineering issues are seeded into the synthetic EV-INV-800 product data across Phases 2–8. Each seeded issue is objectively detectable by a deterministic check or testability rule, triggers a structured finding, requires a human-approved corrective action, leads to a revised input, and results in a targeted rerun of affected checks and outputs. Original and revised results are preserved side by side. Together, these issues demonstrate the full lifecycle correction workflow that the Copilot is designed to support.

---

### Terminology

- **Seeded Issue:** An intentionally embedded engineering problem in synthetic POC data; `finding.seeded = true`.
- **Correction Cycle:** The full workflow for a seeded issue: detection → finding raised → human decision (approve corrective action) → revised input → targeted rerun → result verification → closure.
- **Conditional Pass Action:** An action created when Gate 3 records a Conditional Pass outcome; must be tracked to closure before the project can close.
- **Side-by-Side Preservation:** Both the original (pre-correction) and revised (post-correction) check results and outputs are stored in ProjectState with distinct `version_ref` values.

---

### Seeded Issue: SI-01 — Phase 2 Requirements Testability

**Phase:** 2 (Requirements Definition)
**Detection method:** Requirement testability deterministic check (see F05 §Additional Deterministic Logic).
**Seeded data:** One efficiency or thermal performance requirement in the Customer & Standards Requirements Package has no measurable acceptance criterion (e.g., "The inverter shall be thermally stable under load" — no temperature value, no test condition specified).

**Correction Cycle:**
1. Testability check runs; flags requirement `REQ-THERM-004` as untestable (no numeric criterion).
2. Finding `F2-001` raised: Severity = `Major`; description: "REQ-THERM-004 lacks a measurable acceptance criterion."
3. AI recommendation includes this finding in rationale; recommends `Conditional Pass` or human clarification.
4. Human approves corrective action `A2-001`: "Revise REQ-THERM-004 to add measurable criterion: operating temperature ≤ 85°C at rated power, confirmed by thermocouple measurement at Case Temperature Point TP-CASE-1."
5. User uploads revised Customer & Standards Requirements Package via "Upload Revised Version" workflow.
6. Testability check reruns on revised requirement; `REQ-THERM-004` now passes.
7. Finding `F2-001` status → `VerifiedClosed`.
8. Gate 2: human selects `Pass` (after clarification). Happy-path outcome.

**Outputs in ProjectState:**
- `checkResults[]` entry for original run: `status = Fail`, `version_ref = v1`
- `checkResults[]` entry for rerun: `status = Pass`, `version_ref = v2`
- Both entries retained; `superseded_by` links original to rerun.

---

### Seeded Issue: SI-02 — Phase 3 Assembly Access Concern

**Phase:** 3 (Preliminary Design)
**Detection method:** Agent analysis of Preliminary Design Package (no dedicated deterministic check for assembly access in Phase 3; detected by agent DFM/DFA rule application with Early DFM/DFA Findings output).
**Seeded data:** Coolant connector orientation in the preliminary design drawing places the connector parallel to the PCB mounting face, requiring the connector to be inserted at an angle that obstructs access to adjacent fasteners.

**Correction Cycle:**
1. Phase 3 agent analyzes preliminary design package against DFM/DFA rules from external input.
2. Finding `F3-001` raised: Severity = `Major`; description: "Coolant connector (CN-COOL-1) orientation creates an assembly-access concern. Connector insertion angle obstructs access to M4 fasteners J-FAST-7 through J-FAST-10."
3. AI recommends `Conditional Pass`; human selects `Conditional Pass`. Gate 3 = Conditional Pass.
4. Conditional Pass action `A3-001` created: "Revise coolant connector orientation in detailed design to ensure unobstructed access to J-FAST-7 through J-FAST-10. Provide revised design drawing for verification."
5. Action tracked in Findings and Actions Workspace (AV-07); `blocking = true`; `due_phase = 4`; `due_gate = 4`.
6. Action remains visibly open on all views until Phase 4 revised design verification.

**Phase 4 Verification (SI-04 companion):**
7. Phase 4 released design baseline includes revised connector orientation.
8. Phase 4 cross-artifact consistency check verifies connector designation matches revised DFM spec.
9. Human reviewer confirms `A3-001` closure in Phase 4 Gate Review Workspace: provides closure evidence artifact ID.
10. `A3-001` status → `VerifiedClosed`. Finding `F3-001` status → `VerifiedClosed`.
11. Gate 4 happy-path gate pass includes this verified closure.

---

### Seeded Issues: SI-03 — Phase 4 Initial Design (Four Simultaneous Issues)

**Phase:** 4 (Detailed Design)
**Detection method:** Four deterministic checks (see F05). All four run on initial Phase 4 inputs.

#### SI-03a: HV Clearance Failure

- **Check:** HV Clearance Check (F05 §Check 2)
- **Seeded data:** Net pair `VBUS+ to GND_SHIELD`; measured clearance = 6.2 mm; threshold = 8.0 mm; margin = −1.8 mm.
- **Finding:** `F4-001`; Severity = `Critical`; status = `Open`.
- **Action:** `A4-001` (blocking): "Increase clearance between VBUS+ and GND_SHIELD from 6.2 mm to ≥ 8.5 mm. Provide revised layout extract."

#### SI-03b: Component Derating Failure

- **Check:** Component Derating Check (F05 §Check 3)
- **Seeded data:** `C_BULK_3` rated 450 V, operating 430 V, derating margin = 4.4%; threshold = 50%.
- **Finding:** `F4-002`; Severity = `Critical`; status = `Open`.
- **Action:** `A4-002` (blocking): "Replace C_BULK_3 with 900 V rated capacitor to achieve ≥ 50% derating margin. Update BOM revision."

#### SI-03c: Test-Point Coverage Failure

- **Check:** Test-Point Coverage Check (F05 §Check 4)
- **Seeded data:** Diagnostic net `DIAG_TEMP_IGBT_CASE` has no accessible test point.
- **Finding:** `F4-003`; Severity = `Major`; status = `Open`.
- **Action:** `A4-003` (blocking): "Add accessible test point TP-IGBT-CASE to diagnostic net DIAG_TEMP_IGBT_CASE. Update test point list and netlist."

#### SI-03d: Cross-Artifact Consistency Failure

- **Check:** Cross-Artifact Consistency Check (F05 §Check 1)
- **Seeded data:** `C_HV_1` footprint in BOM = `0805`; footprint in DFM rules = `1206`.
- **Finding:** `F4-004`; Severity = `Major`; status = `Open`.
- **Action:** `A4-004` (blocking): "Resolve footprint mismatch for C_HV_1. Correct BOM or DFM spec to match. Provide revised BOM with corrected footprint designation."

**Gate 4 Initial Recommendation:** AI recommends `Fail` (four critical/major issues open, blocking actions pending). Human selects `Fail`. Project enters correction cycle.

---

### Seeded Issue: SI-04 — Phase 4 Revised Design (Correction Verification)

**Phase:** 4 (Detailed Design — Revised)
**Process:** User uploads revised Released Detailed Design Baseline Package via "Upload Revised Version."

**Correction Verification Steps:**
1. Revised internal input (v2) ingested; all four Phase 4 checks run via targeted rerun.
2. HV Clearance Check (rerun): `VBUS+ to GND_SHIELD` clearance now = 9.1 mm; margin = +1.1 mm; status = `Pass`.
3. Derating Check (rerun): `C_BULK_3` replaced with 900 V rated capacitor; operating 430 V; margin = 52.2%; status = `Pass`.
4. Test-Point Coverage Check (rerun): `DIAG_TEMP_IGBT_CASE` now has test point `TP-IGBT-CASE`; status = `Pass`.
5. Cross-Artifact Consistency Check (rerun): `C_HV_1` footprint now `1206` in both BOM and DFM spec; status = `Pass`.
6. Phase 3 action `A3-001` (coolant connector) verified closed in revised design; reviewer confirms in Gate Review Workspace.
7. All four actions `A4-001` through `A4-004` status → `VerifiedClosed`.
8. Finding statuses → `VerifiedClosed`.
9. Original check results (v1) and revised check results (v2) both stored in `checkResults[]`; linked by `superseded_by`.
10. Gate 4: AI recommends `Pass`; human selects `Pass`. Happy-path outcome.

---

### Seeded Issue: SI-05 — Phase 5 Thermal Verification

**Phase:** 5 (Verification and Validation)
**Detection method:** Requirement testability comparison within V&V Matrix; thermal result exceeds synthetic acceptance criterion.
**Seeded data:** Thermal measurement at `TP-CASE-1` = 91°C; synthetic acceptance criterion (from REQ-THERM-004 revised in SI-01) = ≤ 85°C.

**Correction Cycle:**
1. V&V agent compares test results against acceptance criteria in Validation Evidence Package.
2. Finding `F5-001` raised: Severity = `Critical`; description: "Thermal measurement at TP-CASE-1 (91°C) exceeds acceptance criterion of 85°C defined in REQ-THERM-004."
3. AI recommends `Fail`. Human approves corrective action `A5-001`: "Investigate thermal path; revise thermal interface material specification or heat-sink profile; re-test."
4. User uploads revised Validation Evidence Package (updated test results after thermal mitigation).
5. Targeted rerun: V&V Matrix row for REQ-THERM-004 updated; revised thermal result = 82°C; criterion met.
6. Finding `F5-001` status → `VerifiedClosed`.
7. Gate 5: AI recommends `Pass`; human selects `Pass` (after correction).

---

### Seeded Issue: SI-06 — Phase 6 Process Capability

**Phase:** 6 (Manufacturing Readiness)
**Detection method:** Cpk deterministic check (F05 §Check 5).
**Seeded data:** Characteristic `SOLDER_JOINT_SHEAR_HV_BUS`; Cpk = 0.87; threshold = 1.33.

**Correction Cycle:**
1. Cpk check runs on Manufacturing Process & Capability Package.
2. Finding `F6-001` raised: Severity = `Critical`; description: "SOLDER_JOINT_SHEAR_HV_BUS Cpk = 0.87 below threshold 1.33. Process not capable."
3. AI recommends `Conditional Pass` with action. Human approves corrective action `A6-001`: "Review solder paste volume and reflow profile for HV bus connection; re-sample after process adjustment."
4. Revised synthetic MES sample (v2) becomes available; user ingests via "Ingest Revised Sample."
5. Cpk check reruns on revised sample; `SOLDER_JOINT_SHEAR_HV_BUS` Cpk = 1.45; status = `Pass`.
6. Finding `F6-001` → `VerifiedClosed`; Action `A6-001` → `VerifiedClosed`.
7. Gate 6: AI recommends `Pass`; human selects `Pass` (after correction).

---

### Seeded Issue: SI-07 — Phase 7 Transfer Finding

**Phase:** 7 (Transfer and Lessons Learned)
**Detection method:** Agent analysis of Transfer, Actions, Defects & Yield Package (simulated: Cora/MES/CAPA).
**Seeded data:** MES yield data shows torque variation in mounting operation `MOP-012-BRACKET-MOUNT` (torque range: 2.1–4.8 N·m; specification: 3.5 ± 0.5 N·m). Some readings outside ±14% of target.

**Correction Cycle:**
1. Phase 7 agent analyzes transfer package; identifies torque variation pattern.
2. Finding `F7-001` raised: Severity = `Minor`; description: "Torque variation in MOP-012-BRACKET-MOUNT exceeds specification on 8% of assemblies. Operator training and torque tool calibration recommended."
3. Finding captured in Structured Lessons-Learned Register (Phase 7 Output 1).
4. Action `A7-001` (non-blocking, parallel): "Schedule torque tool calibration and operator re-training for MOP-012-BRACKET-MOUNT before volume ramp." Owner: Manufacturing Engineering.
5. Gate 7: AI recommends `Pass`; human selects `Pass`. (Lessons-learned finding does not block gate for this POC.)

---

### Seeded Issue: SI-08 — Phase 8 Component Obsolescence

**Phase:** 8 (Production and Sustaining)
**Detection method:** Deterministic obsolescence flag from Supplier Lifecycle & Availability Package (simulated: supplier feeds, obsolescence databases).
**Seeded data:** Primary power semiconductor (IGBT module `IGBT-HV-800-A`, reference designator `Q_HV_1`) receives a fictional product discontinuance notice with last-time-buy date 12 months from current date. Replacement requires full redesign and requalification. Remaining customer demand does not justify redevelopment investment.

**Correction Cycle:**
1. Phase 8 agent flags `IGBT-HV-800-A` with `ObsolescenceRisk = Critical` in Obsolescence & Supply-Risk Forecast.
2. Finding `F8-001` raised: Severity = `Critical`; description: "IGBT-HV-800-A (Q_HV_1) has received a product discontinuance notice. Last-time-buy date: [+12 months]. No drop-in replacement identified. Redesign and requalification required."
3. Yield/Quality report confirms remaining demand does not justify redevelopment.
4. AI recommends `Pass to initiate Phase 9 EOL`.
5. Gate 8: human selects `Pass` to initiate EOL. Gate 8 happy-path outcome = `Pass`.
6. Project transitions to Phase 9 (End of Life).

---

### Inputs (general across all seeded issues)

- Phase inputs as defined in F01 per-phase specification
- For revision cycles: revised user-provided file or revised synthetic sample (per F02 and F03 workflows)

---

### Outputs (per correction cycle)

- Finding record in `ProjectState.findings[]` with `seeded = true`
- Action record in `ProjectState.actions[]`
- Human-approved corrective action (gate decision or standalone action approval)
- Revised input version (new `InputVersion` record)
- Rerun check results with version reference (original and revised)
- Revised phase outputs where affected
- Intake audit event for revised input
- Gate decision record with AI recommendation and human outcome

---

### Validation Rules

- Every seeded issue must be detected by a deterministic check or explicit rule (not by unconstrained LLM inference alone).
- `finding.seeded = true` must be set on all eight seeded findings.
- Correction cycle cannot auto-complete; human must explicitly approve the corrective action.
- Original pre-correction check results must be preserved in `checkResults[]` with `invalidated = true`; they must not be deleted.
- Revised results must be stored as separate `checkResults[]` entries linked to original via `superseded_by`.
- SI-04 must verify both Phase 3 action closure (A3-001) and all four Phase 4 actions (A4-001 through A4-004).
- SI-08 must transition project to Phase 9 after Gate 8 Pass; transition is human-gated.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Seeded finding auto-closed without human approval | 403 | `HUMAN_APPROVAL_REQUIRED` | "Corrective action closure requires human approval." |
| Original check result deleted after correction | 500 | `AUDIT_INTEGRITY_VIOLATION` | "Original check results must not be deleted. Correction cycle preserves both results." |
| Seeded issue not flagged with seeded=true | 422 | `SEEDED_FLAG_MISSING` | "Seeded issue finding must have seeded=true in finding record." |

---

### API Surface (this feature)

See `Y1-api.md` §Findings and §Actions for full schemas. Summary:

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/findings` | Get all findings (with seeded filter option) |
| `GET` | `/api/findings/{id}` | Get a specific finding |
| `POST` | `/api/findings/{id}/close` | Close a finding (requires human approver) |
| `GET` | `/api/actions` | Get all actions |
| `POST` | `/api/actions/{id}/approve` | Approve a corrective action (human action) |
| `POST` | `/api/actions/{id}/close` | Close an action with closure evidence |

---

### Schema Surface (this feature)

Uses `ProjectState.findings[]`, `ProjectState.actions[]`, `ProjectState.checkResults[]`, `ProjectState.gateDecisions[]` — see `Y0-schema.md` §Findings, §Actions.

---

*FRD-TTCopilot-v1.0 | F06 | Synthetic POC Data Only*
---

## F07: Token Optimization and Context Management

**Requirements:** TO-01 to TO-04 | **Priority:** P0

**Description:** The system is designed to minimize LLM token consumption at every invocation by using indexed reference document caching, compact upstream phase summaries, and targeted context assembly. Deterministic calculations run outside the LLM entirely (see F05). This ensures the system remains practical across 10 phases without context-window overload and without repeatedly transmitting large documents.

---

### Terminology

- **Reference Index:** A persistent, pre-computed index of reference document content (standards, checklists, POC rules), built at system initialization and cached for all subsequent agent invocations.
- **Relevant Passage Retrieval:** The process of querying the reference index with a phase-specific query to extract only the applicable sections, clauses, or rows — not the full document.
- **Context Package:** The structured set of information assembled for each agent invocation: active inputs, upstream summaries, open actions, selected checklist items, and selected standard passages.
- **Compact Phase Summary:** See F04 §CompactPhaseSummary Object. A condensed structured record of an approved phase's key outputs and decisions; used in place of the full phase documents.
- **Token Budget:** The target maximum token count for any single agent context invocation. Maintained to avoid context-window overload and to control per-invocation LLM cost.

---

### Sub-features

- Reference document indexing at system initialization (one-time, cached)
- Relevant passage retrieval per agent invocation (query-based, not full-document transmission)
- Context package assembly: active inputs + upstream summaries + open actions + selected items
- Compact approved-phase summaries as upstream context (not full prior-phase documents)
- Output length limits set in prompt construction
- Early stop on output schema completion
- Deterministic checks outside LLM (all five checks in F05)

---

### Process: Reference Document Indexing (System Initialization)

1. At system startup, load all reference documents from the reference document store:
   - EVINV-POC-STD-001 (synthetic standard)
   - Power Supplies Technical Review Checklists — Prelim (Kickoff, SLR, Schematic Review, PCB Layout tabs)
   - Any additional POC-specific rules or policies
2. For each document, extract text by section/clause/row.
3. Build a vector index (or keyword index) over the extracted passages.
4. Cache the index in the reference index store; mark index as `initialized`.
5. Do not reload or re-transmit full documents to agent invocations; query index instead.
6. Log index build event with document IDs and timestamps in audit history.

---

### Process: Context Package Assembly (Per Agent Invocation)

For every agent call, assemble a context package as follows:

1. **Active phase inputs:** Include only the active version summaries (not full document content) of the two logical inputs for the current phase. Provide structured field extracts (e.g., requirement rows, BOM rows) rather than raw document text.
2. **Upstream compact summaries:** For each completed prior phase (phases 0 through n−1), include the `CompactPhaseSummary` from ProjectState. Do not include full prior-phase documents or full prior-phase outputs.
3. **Open actions:** Include all actions with `status != VerifiedClosed` that affect the current phase, drawn from `ProjectState.actions[]`.
4. **Selected checklist items:** For phases with a mapped technical review (0, 1, 3, 4), query the reference index for the applicable checklist tab; retrieve only the most relevant items for the current phase focus (not the entire checklist).
5. **Selected standard passages:** Query the reference index with the current phase's engineering focus (e.g., "HV clearance", "component derating"); retrieve the most relevant clauses from EVINV-POC-STD-001.
6. **Output schema:** Include the output schema for the phase's expected outputs; set a maximum token budget for the output section.
7. **No background narrative repetition:** Do not re-include project background, product description, or ENG 001 overview in every prompt; these are provided once at initialization or referenced by ID.

---

### Compact Phase Summary Schema (see also F04)

| Field | Token Budget Target |
|---|---|
| `phase_id` | negligible |
| `gate_outcome` | negligible |
| `key_decisions` | ≤ 3 bullet points, ≤ 50 tokens each |
| `key_outputs` | ≤ 2 output references, ≤ 30 tokens each |
| `open_actions` | List of action IDs only; detail fetched on demand |
| `findings_summary` | ≤ 1 paragraph, ≤ 100 tokens |
| **Total per phase summary** | **≤ 400 tokens** |

With 10 phases, all upstream summaries ≤ 4,000 tokens total — well within any context window.

---

### Context Selection Rules

| Context Component | Rule | Rationale |
|---|---|---|
| Prior phase documents | NEVER transmitted | Full documents would exceed context budget; use compact summaries |
| Active input documents | Structured field extracts only (not raw text) | Reduces tokens while preserving engineering facts |
| Reference documents | Passage retrieval only (never full document) | Index built once; only relevant sections retrieved |
| Checklist items | Top N most relevant items for current phase focus | Entire checklist would violate artifact-count intent |
| Deterministic check results | Include result record (structured) | Small and precise; no narrative required |
| Background narrative | Include once at project initialization; reference by project_id thereafter | Avoids repetition across invocations |
| Output format schema | Always included in context | Required for schema-constrained generation |

---

### Prompt Construction Rules

- Use compact structured fields (JSON or markdown tables) rather than prose repetition.
- Reference artifacts by ID rather than repeating their full content.
- Set explicit output length limits: `max_tokens = [phase-specific budget]` in each prompt.
- Stop generation once the output schema is complete (use stop sequences aligned with output schema end markers).
- Avoid repeating the product description, project ID, or ENG 001 overview in every invocation.
- Do not ask the LLM to compute values that deterministic tools should compute (clearance, Cpk, derating, traceability completeness).

---

### Inputs

- `phase_id` (integer 0–9): the phase for which context is being assembled
- Reference index (cached, pre-built at startup)
- `ProjectState` (read access): upstream summaries, active inputs, open actions, check results

---

### Outputs

- Context package (structured JSON): assembled and passed to phase agent
- Context package token count: logged for monitoring
- Reference index: cached artifact (not transmitted; queried per invocation)

---

### Validation Rules

- Reference index must be initialized before any phase agent is invoked; if not, reject with `REFERENCE_INDEX_NOT_INITIALIZED`.
- Full prior-phase documents must not appear in any agent context package; enforced by context assembly layer.
- Full reference documents (EVINV-POC-STD-001, checklist) must not be transmitted to agent; only retrieved passages may appear.
- Context package must include `token_count` field; if `token_count > context_token_budget` (configurable, default 8,000 tokens for this POC), context assembly must trim least-relevant passages before invoking agent.
- Deterministic check computations (clearance, derating, Cpk, testability, traceability) must not be delegated to LLM inference; they must run as tool calls.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Reference index not initialized | 503 | `REFERENCE_INDEX_NOT_INITIALIZED` | "Reference index has not been built. Run system initialization before invoking agents." |
| Context package exceeds token budget | 422 | `CONTEXT_TOKEN_BUDGET_EXCEEDED` | "Assembled context exceeds token budget of {budget}. Trimming applied; review context selection rules." |
| Full document included in context | 500 | `FULL_DOC_IN_CONTEXT` | "Internal error: full reference document transmitted to agent. Context assembly rules violated." |
| Deterministic computation delegated to LLM | 500 | `DETERMINISTIC_DELEGATION_VIOLATION` | "Deterministic check computation must not be delegated to LLM. Use tool call instead." |

---

### API Surface (this feature)

See `Y1-api.md` §Context for full schemas. Summary:

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/system/initialize-index` | Build and cache the reference document index |
| `GET` | `/api/system/index-status` | Check reference index initialization status |
| `POST` | `/api/context/assemble` | Assemble context package for a phase invocation (returns package + token count) |
| `GET` | `/api/context/phase/{id}/summaries` | Get compact phase summaries for all prior phases |

---

### Schema Surface (this feature)

Uses `ProjectState.phases[n].compactPhaseSummary`, reference index store (external cache, not in ProjectState) — see `Y0-schema.md` §CompactPhaseSummary.

---

*FRD-TTCopilot-v1.0 | F07 | Synthetic POC Data Only*
---

## F08: Compact Artifact Standards

**Requirements:** CA-01 to CA-05, SS-01 | **Priority:** P0

**Description:** All synthetic artifacts (both inputs and outputs) conform to a compact standard that makes them simultaneously human-reviewable, AI-processable, and token-efficient. Every synthetic artifact carries a mandatory disclaimer. Every artifact has full provenance information. The compact standard prevents data padding, unused columns, and documents that are too large for rapid human review or LLM processing within a reasonable token budget.

---

### Terminology

- **Meaningful Row:** A data row that conveys a distinct engineering fact; header rows, blank rows, and sub-total rows are excluded from the row count.
- **Essential Field:** A column that carries data required for the purpose of the artifact; unused, placeholder, or cosmetic columns are prohibited.
- **Provenance Information:** The metadata record identifying the artifact's source, version, phase, intake type, generation method, and timestamp.
- **Mandatory Disclaimer:** The required text that must appear on every synthetic artifact: "Synthetic POC Data. Not TT Electronics Product Data. Not for Design, Fabrication, Certification, Procurement, or Production."
- **EVINV-POC-STD-001 Label:** The required label that must accompany every reference to the synthetic standard: "Synthetic POC Standard, not an approved TT or industry standard."

---

### Sub-features

- XLSX/CSV size limit: ≤ 10 meaningful rows
- XLSX/CSV field discipline: 6–10 essential fields per record
- DOCX/PDF size limit: ≤ 2 pages
- Mandatory disclaimer on every synthetic artifact
- Mandatory provenance on every artifact
- EVINV-POC-STD-001 labeled as synthetic standard wherever referenced
- Artifact generation wrapper enforces all rules before artifact is emitted

---

### XLSX and CSV Artifact Standards

#### Row Count

- Maximum ~10 meaningful representative rows per artifact (header rows excluded from count).
- The ~10 rows must be carefully selected to cover the key engineering scenario, including all seeded issues where applicable.
- No data padding: rows must not be added to meet a minimum count; rows must not be duplicated or modified only to vary the row count.
- If a validation warning `ROW_COUNT_WARNING` is issued (user upload exceeds ~10 rows), phase execution may still proceed but the agent is informed of the excess and instructed to focus on the most representative rows.

#### Column Discipline

- 6–10 essential fields per record.
- Every XLSX/CSV record must include:
  - A stable unique identifier (row ID, requirement ID, action ID, etc.)
  - Units for any quantitative field (e.g., V, A, mm, N·m, °C)
  - Source reference where applicable (standard clause, requirement ID, supplier reference)
  - Revision level where the artifact is versioned
- No unused columns (all columns must contain non-empty values in at least one row).
- No placeholder columns (e.g., "TBD", "Future Use") unless explicitly required by the output schema.

#### Required Metadata Fields (XLSX header area or first row)

| Field | Description |
|---|---|
| `Project ID` | `EVINV-POC-001` |
| `Product Name` | `EV-INV-800 Demonstration Traction Inverter` |
| `Phase` | TT lifecycle phase number and name |
| `Gate` | Associated gate number |
| `Artifact Name` | Canonical output name |
| `Version` | Artifact version number |
| `Status` | e.g., `Draft`, `Awaiting Approval`, `Approved` |
| `Synthetic Data Disclaimer` | Full disclaimer text |
| `Generated At` | ISO 8601 timestamp |

---

### DOCX and PDF Artifact Standards

#### Page Count

- Target: ~1–2 pages.
- Strictly enforced: artifact generation must not exceed 2 pages.
- Content must use concise headings, compact tables, and short narrative paragraphs.
- No padding paragraphs, no repetitive boilerplate beyond the required header and disclaimer.

#### Required Document Sections

Every DOCX/PDF output must include all of the following, in order:

1. **Document Header:** Project ID, Product Name, Phase, Gate, Artifact Name, Version, Status, Date, Synthetic Data Disclaimer.
2. **Executive Summary:** 2–4 sentence summary of the phase outcome and key findings (≤ 100 words).
3. **Key Findings or Results:** Compact table or bulleted list; 3–7 items maximum.
4. **Recommendation (where applicable):** One-sentence gate recommendation or risk call.
5. **Open Actions (where applicable):** Table of open blocking actions with IDs and due dates; omit section if none.
6. **Provenance Statement:** Lists input artifacts used (artifact ID, version) and generation timestamp.

#### Prohibited Content

- Full-length narrative sections (> 2 paragraphs per section)
- Appendices or attachments
- Tables with > 10 rows (use XLSX output for tabular data instead)
- Repeated boilerplate beyond the mandatory disclaimer and header

---

### Mandatory Disclaimer

Every synthetic artifact (inputs and outputs, both XLSX/CSV and DOCX/PDF) must carry the following exact disclaimer text:

> **Synthetic POC Data. Not TT Electronics Product Data. Not for Design, Fabrication, Certification, Procurement, or Production.**

- For XLSX/CSV: appears in a dedicated `Synthetic Data Disclaimer` metadata field in the header area.
- For DOCX/PDF: appears as bold text at the top of the document (immediately after the document title or in the header area).
- Disclaimer must not be removed, abbreviated, or moved to a footnote.
- Artifact generation wrapper must verify disclaimer presence before emitting any artifact; emit rejected if disclaimer is missing.

---

### Provenance Information (All Artifacts)

Every artifact carries:

| Field | Type | Description |
|---|---|---|
| `artifact_id` | string (UUID) | Unique artifact identifier |
| `artifact_name` | string | Canonical artifact name |
| `artifact_type` | enum | `XLSX`, `CSV`, `DOCX`, `PDF` |
| `source` | enum | `UserUploaded`, `AgentGenerated`, `SyntheticSample` |
| `intake_behavior` | enum | `UP`, `SI`, or `Generated` (for agent outputs) |
| `version` | integer | Sequential version number |
| `phase_id` | integer 0–9 | Phase that owns this artifact |
| `gate_id` | integer 0–9 | Associated gate |
| `input_version_refs` | string[] | Version IDs of inputs used to produce this artifact (for Generated artifacts) |
| `timestamp` | ISO 8601 | UTC timestamp of creation or upload |
| `generated_by` | string | `agent:{phase_agent_id}` or `user_upload` or `system_sample` |
| `disclaimer_present` | boolean | Must always be `true`; write rejected if `false` |

---

### EVINV-POC-STD-001 Standard Labeling

Every reference to EVINV-POC-STD-001 must include one of the following label forms:

- In running text: "(Synthetic POC Standard, not an approved TT or industry standard)"
- In tables: abbreviated label "(POC Std)" with full label in document footer or header
- In check result records: `source_reference` field must include "Synthetic POC Standard" qualifier

The synthetic standard document itself must carry the disclaimer and a statement on its cover page: "This is a synthetic demonstration standard created for EVINV-POC-001. It does not represent an actual TT Electronics or industry standard. Not for use in design, fabrication, certification, or production."

---

### Process: Artifact Generation Wrapper

Every artifact emission (by agent or by system) passes through the artifact generation wrapper:

1. Artifact content is generated or prepared.
2. Wrapper validates:
   - Disclaimer present and correct: `disclaimer_present = true` else reject.
   - XLSX/CSV: row count ≤ 10 meaningful rows; column count 6–10; all required metadata fields present.
   - DOCX/PDF: page count ≤ 2; all required document sections present.
   - All quantitative fields have units.
   - All XLSX row IDs are unique.
3. If validation passes: artifact registered in artifact registry with provenance record; status = `AwaitingReview`.
4. If validation fails: artifact rejected; error returned with specific violation detail; not registered.

---

### Inputs

- Artifact content (generated or uploaded)
- Phase configuration (determines expected format and field requirements)
- Artifact provenance metadata

---

### Outputs

- Validated artifact registered in artifact registry
- Artifact provenance record in `ProjectState.artifactRegistry[]`
- Validation result (passed or rejected with specific issue)

---

### Validation Rules

- Row count for XLSX/CSV: > 10 meaningful rows = `ROW_COUNT_WARNING` (warning, not rejection) for user uploads; `ROW_COUNT_VIOLATION` (rejection) for agent-generated outputs.
- Column count for XLSX/CSV: < 6 or > 10 = `COLUMN_COUNT_VIOLATION`.
- Page count for DOCX/PDF: > 2 pages = `PAGE_COUNT_VIOLATION`.
- Missing disclaimer = `DISCLAIMER_MISSING` (hard rejection; artifact not registered).
- Missing provenance field = `PROVENANCE_FIELD_MISSING` (hard rejection).
- Missing units on quantitative field = `UNITS_MISSING` (hard rejection for agent outputs; `UNITS_WARNING` for user uploads).
- EVINV-POC-STD-001 referenced without synthetic label = `SYNTHETIC_LABEL_MISSING` (hard rejection for agent outputs; warning for uploaded documents).
- Unused column in XLSX/CSV (all values empty) = `UNUSED_COLUMN_VIOLATION` (rejection for agent outputs; warning for user uploads).

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Disclaimer missing from artifact | 422 | `DISCLAIMER_MISSING` | "Artifact rejected: mandatory disclaimer not present. Add: 'Synthetic POC Data. Not TT Electronics Product Data. Not for Design, Fabrication, Certification, Procurement, or Production.'" |
| XLSX row count > 10 (agent generated) | 422 | `ROW_COUNT_VIOLATION` | "Agent-generated XLSX artifact has {n} meaningful rows; maximum is 10. Reduce content." |
| DOCX page count > 2 | 422 | `PAGE_COUNT_VIOLATION` | "DOCX artifact has {n} pages; maximum is 2. Condense content." |
| Standard referenced without synthetic label | 422 | `SYNTHETIC_LABEL_MISSING` | "Reference to EVINV-POC-STD-001 must include 'Synthetic POC Standard' label." |
| Missing required metadata field | 422 | `PROVENANCE_FIELD_MISSING` | "Required provenance field '[field_name]' is missing from artifact." |
| Unused column in agent-generated XLSX | 422 | `UNUSED_COLUMN_VIOLATION` | "Artifact contains unused column '[column_name]'. Remove unused columns from generated outputs." |

---

### API Surface (this feature)

See `Y1-api.md` §Artifacts for full schemas. Summary:

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/artifacts/validate` | Validate an artifact against compact artifact standards |
| `POST` | `/api/artifacts/register` | Register a validated artifact in the artifact registry |
| `GET` | `/api/artifacts/{id}` | Get artifact with provenance |
| `GET` | `/api/artifacts/{id}/versions` | Get all versions of an artifact |

---

### Schema Surface (this feature)

Uses `ProjectState.artifactRegistry[]` — see `Y0-schema.md` §Artifact Registry.

---

*FRD-TTCopilot-v1.0 | F08 | Synthetic POC Data Only*
---

## F09: Application Views — Nine-View Web Gate Cockpit

**Requirements:** AV-01 to AV-10 | **Priority:** P0

**Description:** The Web Gate Cockpit is the primary human-in-the-loop surface for all gate navigation, AI-draft review, artifact inspection, and sign-off. It presents nine structured application views (AV-01 through AV-09) with persistent lifecycle breadcrumbs on all views. TT Electronics Product Lifecycle Process terminology is used throughout. The system does not present a generic chatbot as its primary interface; all interactions occur through structured phase workspaces, panels, and decisional controls.

---

### Breadcrumbs (AV-10 Behavior — Present on All Nine Views)

**Description:** Persistent lifecycle breadcrumbs appear at the top of every view. They display the lifecycle progression and allow navigation to any completed or current phase.

**Content per breadcrumb segment:**
- Phase number and name (e.g., "Phase 0 — Commercial Assessment")
- Gate number (e.g., "Gate 0")
- Technical review label where mapped (Kickoff, SLR, Schematic/PDR, PCB Layout/CDR)
- Breadcrumb state indicator (icon + color coding)

**States:**

| State | Icon | Meaning |
|---|---|---|
| `Completed` | ✅ green | Gate passed; phase complete |
| `Current` | ▶ blue | Phase currently active |
| `Awaiting Human Decision` | ⏳ amber | Phase complete; gate open for human decision |
| `Conditional Pass` | 🔶 orange | Gate passed conditionally; actions outstanding |
| `Blocked` | ⛔ red | Gate failed; project blocked |
| `Upcoming` | ○ grey | Phase not yet started |
| `Closed` | 🔒 grey | Phase 9 gate passed; project closed |

**Interaction:** Clicking a `Completed`, `Current`, `Awaiting Human Decision`, or `Conditional Pass` breadcrumb navigates to the Phase Workspace (AV-03) for that phase.

---

### AV-01: Project Overview

**Purpose:** High-level dashboard showing project identity, current status, and phase health across all 10 phases.

**Content:**
- **Project Identity Panel:**
  - Project ID: EVINV-POC-001
  - Product Name: EV-INV-800 Demonstration Traction Inverter
  - Project Type: NPI A / Category 1
  - Current Phase: Phase [n] — [name]
  - Current Gate: Gate [n]
  - Project Status: Active / Blocked / Cancelled / Closed
  - Synthetic Data Indicator: "Synthetic POC Data" badge (always visible)
- **Phase Summary Table:** 10 rows (one per phase); columns: Phase, Technical Review, Gate, Status, Gate Outcome, Last Action Date.
- **Project Health Indicators:**
  - Open Findings: count by severity (Critical, Major, Minor)
  - Open Actions: count (Blocking / Non-blocking)
  - Phases Complete: n of 10
  - Last Gate Decision: date and outcome
- **Quick Navigation:** Buttons to "Go to Current Phase", "Go to Gate Review", "Go to Audit View".

**Data Sources:** `ProjectState.projectIdentity`, `ProjectState.phases[]`, `ProjectState.findings[]`, `ProjectState.actions[]`, `ProjectState.gateDecisions[]`.

**User Interactions:** Click phase row → navigate to AV-03 for that phase. Click health indicator → filter AV-07 (Findings and Actions). Click breadcrumb → navigate to phase.

---

### AV-02: Product Lifecycle View

**Purpose:** Visual representation of the full TT Electronics ENG 001 v4.1 lifecycle showing all 10 phases and 10 gates with their current states.

**Content:**
- **Lifecycle Timeline:** Horizontal or vertical progression showing phases 0–9 and gates 0–9 in order.
- **Phase Nodes:** Each phase shown as a node with:
  - Phase number and name
  - Technical review label (where mapped)
  - Breadcrumb state indicator
  - Gate outcome badge (Pass / Conditional Pass / Fail / Open / Locked)
- **Gate Nodes:** Each gate shown between phases with decision status.
- **Legend:** Breadcrumb state colors and icons defined.
- **Filter Controls:** Filter by state (e.g., show only Conditional Pass phases).

**Data Sources:** `ProjectState.phases[]`, `ProjectState.gateDecisions[]`.

**User Interactions:** Click any phase node → navigate to AV-03 for that phase. Click gate node → navigate to AV-08 (Gate Review Workspace) for that gate. Hover over node → tooltip showing key facts (gate outcome, date, reviewer).

---

### AV-03: Phase Workspace

**Purpose:** The primary per-phase working view. Contains all panels needed to manage a single lifecycle phase from input intake through gate decision.

**Content Panels:**

#### Input Readiness Panel (both inputs)
For each of the two logical inputs:
- Artifact Name
- Intake Behavior label (`User-Provided File` or `Simulated External-System Intake`)
- System Represented (SI inputs only)
- Format and Size Guidance
- Active Artifact name/ID (or "None")
- Active Version number
- Validation Status (Pass / Fail / Pending) with error details if failed
- Required User Action (contextual: "Upload file", "Click Ingest Sample", "Upload Revised Version", "Ingest Revised Sample")
- Ready Indicator: `Ready` (green) or `Not Ready` (red/amber)

**User-Provided File Controls:**
- Upload button (becomes "Upload Revised Version" after successful intake)
- Sample/Template download link (if available)
- Validation result display (per-field failure messages)

**Simulated Intake Controls:**
- View Sample button (opens AV-05 Artifact Viewer for the synthetic sample)
- Download Sample button
- Ingest Sample button (enabled after viewing/downloading; disabled if already ingested)
- "Simulated Connector — No live connection" label (always visible)
- "Preloaded Synthetic Sample" label (always visible)

#### Phase Execution Status Indicator
Displays current execution status in sequence:
`Waiting for User Input` → `Waiting for Synthetic Sample Ingestion` → `Ready to Run` → `Processing` → `Awaiting Human Decision` → `Complete`

**Run Phase button:** Active only when status is `Ready to Run`.

#### Output Panel (1–2 outputs)
For each phase output:
- Output Name
- Artifact Type and Size Guidance
- Artifact link (opens AV-05)
- Version number
- Approval Status badge
- Approve / Request Revision buttons (visible when `AwaitingReview`)
- `Review Required` badge if `review_required = true`

#### Findings and Actions Section (this phase)
- List of findings raised in this phase (finding ID, severity, status, description summary)
- List of actions linked to this phase (action ID, blocking/parallel, status, due gate)
- Link to AV-07 for full detail

#### AI Recommendation Panel
- AI recommended outcome: `Pass` / `Conditional Pass` / `Fail`
- AI rationale (text)
- "Advisory Only — Human Decision Required" label (always visible; cannot be removed)
- Referenced finding IDs and check result IDs

#### Human Decision Control
- Gate outcome selector: radio buttons `Pass` / `Conditional Pass` / `Fail`
- Comments field (free text)
- Record Decision button
- Confirmation dialog before recording decision
- Decision cannot be recorded while phase is in `Processing` state
- Decision cannot be recorded by AI; requires a human reviewer role

**Data Sources:** `ProjectState.phases[n]`, `ProjectState.findings[]`, `ProjectState.actions[]`, `ProjectState.checkResults[]`.

---

### AV-04: Input Intake and Validation Panel

**Purpose:** Detailed view for managing both inputs of a phase, showing full intake workflow controls, validation results, and version history.

**Content:**
- Phase selector (navigate to any phase's intake panel)
- For each input:
  - Full intake workflow (same controls as AV-03 Input Readiness Panel, with additional detail)
  - **Validation Results Detail:** Per-field validation result table (field, value, rule, pass/fail, issue message)
  - **Version History:** Table of all versions (version number, timestamp, status, validation result, active indicator)
  - Diff view button: compare two selected versions (opens AV-05 with comparison mode)
  - Download artifact button for any version

**Data Sources:** `ProjectState.phases[n].externalInput`, `ProjectState.phases[n].internalInput`.

**User Interactions:** Upload file, ingest sample, view sample, download sample, compare versions, view version history.

---

### AV-05: Artifact Viewer

**Purpose:** Inline viewer for any artifact (input or output) with full version history and provenance, and comparison between original and revised versions.

**Content:**
- **Artifact Header:** Artifact name, type, phase, version, status, provenance record.
- **Content Viewer:** Renders the artifact content inline:
  - XLSX/CSV: rendered as a sortable table
  - DOCX/PDF: rendered as a document preview
- **Provenance Panel:** Source, intake behavior, system represented (if SI), generation timestamp, input version references.
- **Version Selector:** Dropdown to switch between all versions of this artifact.
- **Comparison Mode:** Side-by-side view of two selected versions; differences highlighted.
- **Download button:** Download the selected version in its original format.
- **Synthetic disclaimer:** Always visible at top of viewer.

**Data Sources:** `ProjectState.artifactRegistry[]`, artifact content store.

**User Interactions:** Select version, toggle comparison mode, download artifact.

---

### AV-06: Technical Checklist Workspace

**Purpose:** Shows the selected checklist items for the active technical review, with evidence status, action fields, and reviewer controls.

**Conditional Rendering:**
- **Shown for:** Phase 0 (Kickoff), Phase 1 (SLR), Phase 3 (Schematic/PDR), Phase 4 (PCB Layout/CDR).
- **Hidden for:** Phase 2 and Phases 5–9. For these phases, the view displays: "No technical review is mapped to this phase."

**Content (when shown):**
- **Technical Review Label:** e.g., "Phase 4 — PCB Layout Review + CDR"
- **Checklist Source Label:** "Power Supplies Technical Review Checklists — Prelim ([tab name])"
- **Checklist Table:** Selected representative items; columns:
  - Item ID
  - Checklist Item Description (from source wording)
  - Evidence Required
  - Evidence Status (Complete / Partial / Not Started)
  - Linked Artifact (artifact ID and link)
  - Action Required (if incomplete)
  - Reviewer Notes
- **Summary:** Count of complete / partial / not-started items.
- **Export:** Download checklist table as XLSX.

**Data Sources:** Reference index (checklist passages), `ProjectState.phases[n]`, `ProjectState.findings[]`.

**User Interactions:** Update evidence status, link artifact, add reviewer notes, export.

---

### AV-07: Findings and Actions Workspace

**Purpose:** Cross-phase workspace showing all findings and actions with their current status, blocking indicators, and closure evidence.

**Content:**

#### Findings Table
Columns: Finding ID | Phase | Gate | Detected By | Seeded | Description | Severity | Status | Linked Actions

- Filterable by: phase, severity, status, seeded.
- Click finding → expand row with full description and linked actions.

#### Actions Table
Columns: Action ID | Source Finding | Phase | Gate | Description | Owner Role | Blocking | Due Phase/Gate | Required Closure Evidence | Status | Human Approver | Closure Evidence Artifact

- Blocking actions surfaced prominently at top (separate "Blocking Actions" section).
- Filterable by: phase, blocking status, owner role, status.
- Click action → expand with full detail and history.

**User Interactions:**
- Approve corrective action (human action; records approver role and timestamp)
- Close action (requires providing closure evidence artifact link)
- View linked finding
- Navigate to source phase workspace

**Data Sources:** `ProjectState.findings[]`, `ProjectState.actions[]`.

---

### AV-08: Gate Review Workspace

**Purpose:** The primary gate decision surface. Built dynamically from structured ProjectState; no separate gate-pack artifact is created or emitted.

**Content:**
- **Gate Identity:** Gate number, phase name, gate state, date.
- **Inputs Reviewed:** Both inputs with artifact name, version, and validation status.
- **Outputs Reviewed:** All phase outputs with approval status and review-required indicators.
- **Deterministic Check Results:** Summary table of all check results for this phase: check type, result, threshold, status (Pass/Fail/Warning). Link to full check result detail.
- **Findings:** All findings from this phase with severity and status.
- **Open Actions:** All open actions, blocking prominently highlighted. Blocking actions prevent `Pass` selection.
- **AI Recommended Outcome:** AI recommendation (Pass / Conditional Pass / Fail) with rationale. "Advisory Only" label displayed prominently.
- **Human Comments Field:** Free text; optional.
- **Human Decision Selector:** Radio buttons `Pass` / `Conditional Pass` / `Fail`. Not pre-selected.
- **Conditional Pass Action Form:** If `Conditional Pass` selected, a form appears to define conditional actions:
  - Action description, owner role, blocking/parallel, due phase/gate, required closure evidence.
- **Record Decision Button:** Disabled until reviewer selects an outcome. Confirmation dialog required.
- **Gate Decision History:** Shows prior decisions for this gate (if retry occurred), with full provenance.

**Gate Decision Recorded Data:**
- AI recommendation (full record)
- Human disposition (free text)
- Reviewer role
- Decision (Pass / Conditional Pass / Fail)
- Comments
- Timestamp
- Artifact versions reviewed (list)
- Open conditions (for Conditional Pass)
- Full audit trail

**Enforcement:** AI cannot record a gate decision. The "Record Decision" button is a human-only control. Even in demonstration mode the button must be physically clicked by the presenter.

**Data Sources:** `ProjectState.phases[n]`, `ProjectState.gateDecisions[]`, `ProjectState.findings[]`, `ProjectState.actions[]`, `ProjectState.checkResults[]`.

---

### AV-09: Audit View

**Purpose:** Immutable, append-only display of the full project audit history including all intake events and gate decisions.

**Content:**
- **Full Intake Event Log:** All intake events for all phases, in reverse chronological order; columns: Event ID | Phase | Logical Input | Intake Behavior | User Action | System Represented | Status | Source Artifact | Normalized Artifact | Version | Validation Result | Timestamp.
- **Gate Decision History:** All gate decisions for all gates; columns: Decision ID | Gate | AI Recommendation | Human Disposition | Reviewer Role | Decision | Comments | Timestamp | Artifact Versions Reviewed.
- **All Audit Events:** Full `auditHistory[]` including phase state changes, finding raises, action approvals, check runs, version creates, output approvals, and cancellations.
- **Filters:** By event type, phase, date range.
- **Export:** Download filtered or full audit log as XLSX or JSON.

**Enforcement:**
- No edit controls; all data is read-only.
- No delete option.
- Export only; no in-place modification.
- "Immutable Record — Append Only" label visible at top of view.

**Data Sources:** `ProjectState.auditHistory[]`, `ProjectState.gateDecisions[]`.

---

### Validation Rules

- AV-06 (Technical Checklist) must be hidden (not just empty) for Phase 2 and Phases 5–9; no checklist content may appear.
- AI recommendation panel in AV-03 and AV-08 must display "Advisory Only — Human Decision Required" label at all times; the label may not be removed by configuration.
- Gate decision radio buttons in AV-03 and AV-08 must not pre-select any outcome; user must make an affirmative selection.
- Blocking actions in AV-08: if any action has `blocking = true` and `status != VerifiedClosed`, the `Pass` radio button is disabled and a message is displayed: "Blocking actions must be closed before recording a Pass outcome."
- "Simulated Connector — No live connection" label in AV-03 and AV-04 must always be visible for SI inputs; it must not be hidden or removed.
- AV-09 must be read-only; no write controls may appear on this view.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Gate decision submitted from AV-08 without reviewer role | 400 | `REVIEWER_ROLE_MISSING` | "Reviewer role is required to record a gate decision." |
| AI attempts to record gate decision | 403 | `GATE_AI_PROHIBITED` | "Gate decisions must be made by an authorized human reviewer." |
| Pass decision with open blocking actions | 409 | `BLOCKING_ACTIONS_OPEN` | "Cannot record Pass: blocking actions {list} must be closed first." |
| Checklist content requested for Phase 2 or 5–9 | 404 | `NO_CHECKLIST_MAPPED` | "No technical review is mapped to Phase {n}. Checklist Workspace is not available." |
| Audit record edit attempted | 403 | `AUDIT_IMMUTABLE` | "Audit records are immutable. No modifications are permitted." |

---

### API Surface (this feature)

See `Y1-api.md` §Views for full schemas. Summary:

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/views/project-overview` | Get Project Overview data |
| `GET` | `/api/views/lifecycle` | Get Product Lifecycle View data |
| `GET` | `/api/views/phase/{id}/workspace` | Get Phase Workspace data |
| `GET` | `/api/views/phase/{id}/intake` | Get Input Intake and Validation Panel data |
| `GET` | `/api/artifacts/{id}/viewer` | Get Artifact Viewer data |
| `GET` | `/api/views/phase/{id}/checklist` | Get Technical Checklist Workspace data |
| `GET` | `/api/views/findings-actions` | Get Findings and Actions Workspace data |
| `GET` | `/api/views/gate/{id}/review` | Get Gate Review Workspace data |
| `GET` | `/api/views/audit` | Get Audit View data |
| `GET` | `/api/views/breadcrumbs` | Get breadcrumb state for all phases |

---

### Schema Surface (this feature)

All nine views read from `ProjectState` — see `Y0-schema.md` for full schema. No view-specific schema objects; all data served from shared ProjectState fields.

---

*FRD-TTCopilot-v1.0 | F09 | Synthetic POC Data Only*
---

## F10: Gate Review Model

**Requirements:** GR-01 to GR-06 | **Priority:** P0

**Description:** The Gate Review Workspace implements a rigorous, human-controlled gate decision process. The AI provides a recommended outcome with rationale; the human selects the final outcome. Every gate decision is permanently recorded with full provenance. Conditional Pass gates generate tracked actions that are visible across all views and must be verified closed before the project can close. Silent gate approval is prohibited in all code paths.

---

### Terminology

- **Gate Review Workspace (AV-08):** The view built dynamically from structured ProjectState that serves as the primary gate decision surface; no separate gate-pack artifact is created.
- **Gate Outcome:** Exactly one of three values: `Pass`, `Conditional Pass`, `Fail`. Human-selected only.
- **AI Recommendation:** The AI's advisory suggestion (one of the three outcomes) with rationale; stored in ProjectState; carries no decision authority.
- **Conditional Pass Action:** An action created at the time a Conditional Pass gate is recorded; tracks a condition that must be verified closed before project completion.
- **Silent Gate Approval:** Any code path in which a gate advances without an explicit human action; strictly prohibited.
- **Gate Provenance Record:** The full record written to `ProjectState.gateDecisions[]` at the time of each gate decision.

---

### Sub-features

- Gate Review Workspace built dynamically from ProjectState (no separate gate-pack artifact)
- Exactly three gate outcomes: `Pass`, `Conditional Pass`, `Fail` — human-selected only
- AI provides recommended outcome and rationale (advisory only)
- Gate pauses visibly at every gate; presenter must confirm human decision before progression
- Conditional Pass action schema with all required fields
- Full gate decision provenance record
- Silent gate approval prohibition enforced at orchestrator level
- Gate decision history with full audit trail

---

### Gate Review Workspace Content (AV-08 full specification)

The Gate Review Workspace renders the following from ProjectState at the time of review:

1. **Gate Identity Header:**
   - Gate number (0–9)
   - Phase name
   - Gate state: `Open` (awaiting decision) or `Decided` (historical view)
   - Date gate opened

2. **Inputs Reviewed:** Both logical inputs with:
   - Artifact name
   - Active version number
   - Validation status
   - Artifact link (opens AV-05)

3. **Outputs Reviewed:** All phase outputs with:
   - Output name
   - Artifact type and version
   - Approval status
   - `Review Required` badge where applicable
   - Artifact link

4. **Deterministic Check Results Summary:** Table showing all checks run for this phase:
   - Check Type, Result Value, Threshold, Unit, Status (Pass/Fail/Warning), Version Reference
   - Link to full check result detail

5. **Findings Summary:** All findings from this phase with:
   - Finding ID, Severity, Description, Status, Seeded indicator

6. **Open Actions Panel:**
   - All open actions with: Action ID, Description, Owner Role, Blocking indicator, Due Gate, Status
   - Blocking actions highlighted prominently at top
   - Count of blocking vs. non-blocking open actions

7. **AI Recommended Outcome:** Displayed in its own panel:
   - Outcome label: `Pass` / `Conditional Pass` / `Fail`
   - Rationale (AI-generated text)
   - Finding IDs and check IDs cited
   - "Advisory Only — Human Decision Required" label (always visible; cannot be suppressed)

8. **Human Comments Field:** Free-text optional input.

9. **Human Decision Selector:** Radio buttons with three options:
   - `Pass`
   - `Conditional Pass`
   - `Fail`
   - No option is pre-selected; user must make affirmative choice
   - `Pass` is disabled when any blocking action is open (status ≠ `VerifiedClosed`)

10. **Conditional Pass Action Form** (shown when `Conditional Pass` selected):
    - One or more conditional action entries (see schema below)
    - Minimum one conditional action required to record Conditional Pass

11. **Record Decision Button:**
    - Disabled until gate outcome is selected
    - Triggers confirmation dialog: "You are recording [outcome] for Gate [n]. This action cannot be undone. Confirm?"
    - On confirmation: gate decision written to ProjectState; phase transitions accordingly
    - Button is a client-side UI control; no server-side auto-trigger permitted

12. **Gate Decision History** (shown after decision recorded, and on historical review):
    - All prior decisions for this gate (if gate was failed and retried)
    - Each entry shows: AI recommendation, human decision, reviewer role, timestamp

---

### Conditional Pass Action Schema

When a human records `Conditional Pass`, one or more actions must be defined. Each action has:

| Field | Type | Required | Description |
|---|---|---|---|
| `action_id` | string | system-generated | Unique ID: `A{gate}-{seq}` (e.g., `A3-001`) |
| `source_phase` | integer 0–9 | system | Phase at which action was raised |
| `source_gate` | integer 0–9 | system | Gate at which action was raised |
| `related_finding_id` | string | optional | Finding ID this action addresses |
| `description` | string | required | Clear description of what must be done |
| `owner_role` | string | required | Role responsible for completing the action |
| `blocking` | boolean | required | True = must close before any subsequent gate can pass |
| `parallel` | boolean | required | True = can proceed in parallel with ongoing phase work |
| `due_phase` | integer 0–9 | required | Phase by which action must be closed |
| `due_gate` | integer 0–9 | required | Gate at which closure will be verified |
| `required_closure_evidence` | string | required | Description of what constitutes closure (artifact name, test result, design verification, etc.) |
| `status` | enum | system | `Open` (initial) |
| `human_approver` | string | required | Role who approved this action (matches reviewer at gate) |
| `created_at` | ISO 8601 | system | Timestamp of action creation |

---

### Gate Decision Provenance Record

Written to `ProjectState.gateDecisions[]` at the moment of human decision; immutable thereafter:

| Field | Type | Description |
|---|---|---|
| `decision_id` | string (UUID) | Unique gate decision identifier |
| `gate_number` | integer 0–9 | TT lifecycle gate number |
| `phase_name` | string | Phase name (e.g., "Phase 3 — Preliminary Design") |
| `ai_recommendation` | AIRecommendation | Full AI recommendation object at time of decision |
| `human_disposition` | string | Human reviewer's characterization of AI recommendation |
| `reviewer_role` | string | Role of the human who recorded the decision |
| `decision` | enum | `Pass`, `Conditional Pass`, `Fail` |
| `comments` | string \| null | Free-text reviewer comments |
| `timestamp` | ISO 8601 | UTC timestamp of decision recording |
| `artifact_versions_reviewed` | VersionRef[] | List of artifact IDs and version numbers reviewed |
| `open_conditions` | ConditionalPassAction[] | Array of conditional actions (empty for Pass/Fail) |
| `is_final` | boolean | Always `true` for new decisions; immutable after set |
| `supersedes` | string \| null | `decision_id` of prior decision (if this is a retry gate) |

---

### Process: Normal Gate Review

1. Phase agent completes execution; phase transitions to `AwaitingGate`; gate transitions to `Open`.
2. Gate Review Workspace (AV-08) becomes accessible. Breadcrumb state = `Awaiting Human Decision`.
3. AI recommendation generated and written to ProjectState (advisory only).
4. Human reviewer opens AV-08; reviews all content panels.
5. Human enters optional comments in comments field.
6. Human selects gate outcome from radio buttons (not pre-selected).
7. If `Conditional Pass` selected: human completes at least one Conditional Pass Action entry.
8. If `Pass` selected and blocking actions are open: system rejects selection; displays error.
9. Human clicks "Record Decision"; confirmation dialog appears.
10. Human confirms; gate decision written to ProjectState with full provenance.
11. Phase transitions: `GatePassed`, `GateConditional`, or `GateFailed`.
12. Breadcrumb state updates on all nine views.
13. If `Conditional Pass`: conditional actions created in `ProjectState.actions[]`; visible in AV-07.
14. If `Pass` or `Conditional Pass`: next phase transitions from `Pending` to `AwaitingInputs`.
15. Audit event appended to `ProjectState.auditHistory[]`.

---

### Process: Gate Fail and Retry

1. Human records `Fail`; phase transitions to `GateFailed`; project status = `Blocked`.
2. Prior gate decision recorded with `decision = Fail`; `is_final = true`.
3. Human reviews findings and actions; approves corrective actions via AV-07.
4. User provides revised inputs (per F02/F03 workflows); targeted rerun executes (per F03/F00).
5. Human initiates retry via orchestrator `retry` command (POST `/api/orchestrator/phase/{id}/retry`).
6. Phase resets to `AwaitingInputs`; gate resets to `Locked` then `Open` after re-execution.
7. New gate review conducted; new gate decision written as a separate record with `supersedes = prior_decision_id`.
8. Full history of both decisions preserved in `ProjectState.gateDecisions[]`.

---

### Happy-Path Gate Storyline

| Gate | Outcome | Condition |
|---|---|---|
| Gate 0 | `Pass` | Initial commercial assessment complete |
| Gate 1 | `Pass` | Business case approved |
| Gate 2 | `Pass` | After clarification of untestable requirement (SI-01) |
| Gate 3 | `Conditional Pass` | Coolant connector concern (SI-02); action A3-001 raised |
| Gate 4 | `Pass` | After correction of all four design issues (SI-03/04); A3-001 verified closed |
| Gate 5 | `Pass` | After thermal correction (SI-05) |
| Gate 6 | `Pass` | After Cpk correction (SI-06) |
| Gate 7 | `Pass` | Transfer complete; lessons learned captured (SI-07) |
| Gate 8 | `Pass` | Obsolescence triggers EOL (SI-08); project enters Phase 9 |
| Gate 9 | `Pass` | EOL complete; project status → `Closed` |

---

### Inputs

- `gate_id` (integer 0–9, required): gate number
- `reviewer_role` (string, required): human reviewer role
- `decision` (enum: `Pass` | `Conditional Pass` | `Fail`, required): human-selected outcome
- `comments` (string, optional): human reviewer free-text
- `conditional_actions` (ConditionalPassAction[], required if `Conditional Pass`): at least one action

---

### Outputs

- Gate decision record written to `ProjectState.gateDecisions[]`
- Phase state updated (`GatePassed`, `GateConditional`, or `GateFailed`)
- Next phase state updated (`AwaitingInputs` if gate passed or conditional pass)
- Conditional actions written to `ProjectState.actions[]` (if Conditional Pass)
- Compact phase summary generated and stored in `ProjectState.phases[n].compactPhaseSummary`
- Breadcrumbs updated on all nine views
- Audit event appended to `ProjectState.auditHistory[]`

---

### Validation Rules

- Gate outcome must be exactly one of: `Pass`, `Conditional Pass`, `Fail`; no other values.
- AI-submitted gate decisions are rejected at the API layer; `reviewer_role` must be a human role string, not an AI actor identifier.
- `Conditional Pass` requires at least one `ConditionalPassAction` with all required fields populated.
- `Pass` is rejected if any action with `blocking = true` has `status != VerifiedClosed`.
- Gate decision record is immutable once written (`is_final = true`); no update or delete operations permitted.
- Gate cannot advance without an explicit HTTP POST to the gate decision endpoint from a human action; no server-side auto-advance logic is permitted.
- Confirmation dialog must be displayed in the UI before the POST is sent; client must not send the POST without user confirmation.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Gate decision submitted by AI actor | 403 | `GATE_AI_PROHIBITED` | "Gate decisions must be made by an authorized human reviewer. AI cannot approve any gate." |
| Pass with open blocking action | 409 | `BLOCKING_ACTIONS_OPEN` | "Cannot record Pass: blocking action(s) {ids} must be verified closed first." |
| Conditional Pass with no actions defined | 400 | `CONDITIONAL_ACTIONS_REQUIRED` | "Conditional Pass requires at least one conditional action to be defined." |
| Gate decision on locked gate | 409 | `GATE_LOCKED` | "Gate {n} is locked. Phase must complete execution before gate review can be recorded." |
| Gate decision on already-decided gate | 409 | `GATE_ALREADY_DECIDED` | "Gate {n} has already been decided. Use retry workflow to re-evaluate." |
| Invalid gate outcome value | 400 | `GATE_OUTCOME_INVALID` | "Gate outcome must be Pass, Conditional Pass, or Fail." |
| Missing reviewer role | 400 | `REVIEWER_ROLE_MISSING` | "Reviewer role is required for all gate decisions." |

---

### API Surface (this feature)

See `Y1-api.md` §Gates for full schemas. Summary:

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/gates/{id}/review` | Get full gate review data from ProjectState |
| `POST` | `/api/gates/{id}/decide` | Record human gate decision |
| `GET` | `/api/gates/{id}/decisions` | Get all gate decisions for this gate (history) |
| `GET` | `/api/gates/decisions` | Get all gate decisions across all gates |

---

### Schema Surface (this feature)

Uses `ProjectState.gateDecisions[]`, `ProjectState.actions[]`, `ProjectState.phases[n].gateState`, `ProjectState.phases[n].aiRecommendation` — see `Y0-schema.md` §Gate Decisions and §Actions.

---

*FRD-TTCopilot-v1.0 | F10 | Synthetic POC Data Only*
---

## Y0: Database / State Schema (DDL)

**Document:** Full ProjectState and supporting entity definitions for TT Engineering Copilot POC (EVINV-POC-001).

> **Synthetic POC Data. Not TT Electronics Product Data. Not for Design, Fabrication, Certification, Procurement, or Production.**

---

### Implementation Note

The TT Engineering Copilot POC uses a single versioned `ProjectState` JSON document as its primary state store (suitable for a document database or JSON column in a relational DB). TypeScript-style interface definitions are provided below as the canonical schema contract. A relational DDL mapping is provided at the end for implementors using PostgreSQL.

---

### §Orchestration State

```typescript
// Top-level ProjectState
interface ProjectState {
  state_id: string;               // UUID
  state_version: number;          // Monotonically increasing; optimistic concurrency
  project_id: "EVINV-POC-001";
  product_name: string;
  project_type: "NPI A";
  project_category: "Category 1";
  current_phase: 0|1|2|3|4|5|6|7|8|9;
  current_gate: 0|1|2|3|4|5|6|7|8|9;
  current_technical_review: string | null;
  project_status: "Active"|"Blocked"|"Cancelled"|"Closed";
  synthetic_data_indicator: true;  // Always true; write of false rejected
  created_at: string;             // ISO 8601
  updated_at: string;             // ISO 8601

  phases: PhaseState[];           // Length = 10 (indices 0–9)
  artifactRegistry: ArtifactRecord[];
  dependencyGraph: DependencyGraph;
  checkResults: CheckResult[];
  findings: Finding[];
  actions: Action[];
  gateDecisions: GateDecision[];
  auditHistory: AuditEvent[];     // Append-only; no update/delete
}
```

---

### §Phase Configuration

```typescript
// Server-side configuration; immutable at runtime
interface PhaseConfig {
  phase_id: 0|1|2|3|4|5|6|7|8|9;
  phase_name: string;
  technical_review: string | null;
  external_input: InputConfig;
  internal_input: InputConfig;
  output_specs: OutputSpec[];     // Length 1–2
}

interface InputConfig {
  logical_name: string;
  intake_behavior: "UP" | "SI";
  system_represented: string | null;  // SI only
  accepted_formats: string[];
  size_guidance: string;
  required_fields: string[];
  required_sections: string[];
}

interface OutputSpec {
  output_name: string;
  artifact_type: "XLSX"|"CSV"|"DOCX"|"PDF";
  size_guidance: string;
}
```

**Phase Configuration Table (canonical; immutable):**

| phase_id | external_intake | internal_intake | output_count |
|---|---|---|---|
| 0 | UP | SI | 2 |
| 1 | UP | SI | 2 |
| 2 | UP | SI | 2 |
| 3 | SI | UP | 2 |
| 4 | SI | UP | 2 |
| 5 | SI | UP | 2 |
| 6 | UP | SI | 2 |
| 7 | UP | SI | 2 |
| 8 | SI | SI | 2 |
| 9 | UP | SI | 2 |

---

### §Phase State

```typescript
interface PhaseState {
  phase_id: 0|1|2|3|4|5|6|7|8|9;
  phase_name: string;
  technical_review: string | null;
  phase_state: "Pending"|"AwaitingInputs"|"Running"|"AwaitingGate"|
               "GatePassed"|"GateConditional"|"GateFailed"|"Cancelled"|"Paused";
  gate_state: "Locked"|"Open"|"Decided";
  external_input: PhaseInputState;  // Exactly 1; schema enforced
  internal_input: PhaseInputState;  // Exactly 1; schema enforced
  outputs: PhaseOutput[];           // Max 2; schema enforced
  ai_recommendation: AIRecommendation | null;
  compact_phase_summary: CompactPhaseSummary | null;
  execution_started_at: string | null;
  execution_completed_at: string | null;
}
```

---

### §Input Intake

```typescript
interface PhaseInputState {
  logical_name: string;
  intake_behavior: "UP"|"SI";
  system_represented: string | null;
  accepted_formats: string[];
  size_guidance: string;
  versions: InputVersion[];  // Exactly one has active=true
  readiness_status: "AwaitingUserInput"|"ValidationInProgress"|"UserInputReady"|
                    "WaitingForSampleIngestion"|"Ingesting"|"SyntheticSystemInputReady";
  validation_issues: ValidationIssue[];
  required_user_action: string | null;
}

interface InputVersion {
  version_id: string;           // UUID
  version_number: number;       // 1, 2, 3, …
  artifact_id: string;          // Ref to ArtifactRecord
  intake_behavior: "UP"|"SI";
  active: boolean;              // Exactly one true per PhaseInputState
  validation_result: ValidationResult;
  intake_timestamp: string;     // ISO 8601
  invalidated_by: string | null;  // version_id that superseded this
  rerun_triggered: boolean;
  affected_scope: string[];     // check/finding/output IDs
}

interface ValidationResult {
  passed: boolean;
  issues: ValidationIssue[];
}

interface ValidationIssue {
  field: string;
  rule: string;
  value: string | null;
  message: string;
  severity: "Error"|"Warning";
}
```

---

### §Artifact Registry

```typescript
interface ArtifactRecord {
  artifact_id: string;          // UUID
  artifact_name: string;
  artifact_type: "XLSX"|"CSV"|"DOCX"|"PDF";
  source: "UserUploaded"|"AgentGenerated"|"SyntheticSample";
  intake_behavior: "UP"|"SI"|"Generated";
  version: number;
  phase_id: 0|1|2|3|4|5|6|7|8|9;
  gate_id: 0|1|2|3|4|5|6|7|8|9;
  input_version_refs: string[];   // Version IDs used to produce this artifact
  timestamp: string;              // ISO 8601
  generated_by: string;           // "agent:{id}" | "user_upload" | "system_sample"
  disclaimer_present: true;       // Always true; write rejected if false
  storage_uri: string;            // Pointer to content store
  row_count: number | null;       // XLSX/CSV only; null for DOCX/PDF
  page_count: number | null;      // DOCX/PDF only; null for XLSX/CSV
  file_size_bytes: number;
}

interface PhaseOutput {
  output_id: string;              // UUID
  output_name: string;
  artifact_type: "XLSX"|"CSV"|"DOCX"|"PDF";
  size_guidance: string;
  artifact_id: string | null;
  version_ref: string;
  approval_status: "Pending"|"AwaitingReview"|"Approved"|"Rejected"|"ReviewRequired";
  review_required: boolean;
  approved_by: string | null;
  approved_at: string | null;     // ISO 8601
}
```

---

### §Versioning and Dependency Graph

```typescript
interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
}

interface DependencyNode {
  node_id: string;
  node_type: "ExternalInput"|"InternalInput"|"CheckResult"|"Finding"|"Output";
  phase_id: number;
  logical_name: string;
}

interface DependencyEdge {
  from_node_id: string;
  to_node_id: string;
  edge_type: "DependsOn";
}
```

---

### §Check Results

```typescript
interface CheckResult {
  check_id: string;               // UUID
  check_type: "CrossArtifactConsistency"|"HVClearance"|"ComponentDerating"|
              "TestPointCoverage"|"Cpk"|"CostCalc"|"TraceabilityCompleteness"|
              "RequirementTestability"|"ActionClosure"|"InventoryReconciliation";
  phase_id: 0|1|2|3|4|5|6|7|8|9;
  input_version_ids: string[];
  formula_or_method: string;
  threshold: number | string;
  threshold_unit: string;
  result_value: number | string;
  result_unit: string;
  status: "Pass"|"Fail"|"Warning";
  source_reference: string;       // Must include "Synthetic POC Standard" if citing EVINV-POC-STD-001
  limitation: string;
  items_checked: CheckItem[];
  invalidated: boolean;
  superseded_by: string | null;   // check_id of rerun result
  run_at: string;                 // ISO 8601
}

interface CheckItem {
  item_id: string;
  // Fields vary by check_type; see F05 for per-check item schemas
  [key: string]: unknown;
}
```

---

### §Findings

```typescript
interface Finding {
  finding_id: string;             // e.g., "F4-001"
  source_phase: 0|1|2|3|4|5|6|7|8|9;
  source_gate: 0|1|2|3|4|5|6|7|8|9;
  detected_by: "DeterministicCheck"|"AgentAnalysis"|"HumanReview";
  check_id: string | null;
  description: string;
  severity: "Critical"|"Major"|"Minor"|"Observation";
  status: "Open"|"ActionPending"|"ActionApproved"|"Closed"|"VerifiedClosed";
  seeded: boolean;
  created_at: string;             // ISO 8601
  closed_at: string | null;
}
```

---

### §Actions

```typescript
interface Action {
  action_id: string;              // e.g., "A3-001"
  source_finding_id: string;
  source_phase: 0|1|2|3|4|5|6|7|8|9;
  source_gate: 0|1|2|3|4|5|6|7|8|9;
  description: string;
  owner_role: string;
  blocking: boolean;
  parallel: boolean;
  due_phase: 0|1|2|3|4|5|6|7|8|9;
  due_gate: 0|1|2|3|4|5|6|7|8|9;
  required_closure_evidence: string;
  status: "Open"|"InProgress"|"ClosedPendingVerification"|"VerifiedClosed"|"Waived";
  human_approver: string | null;
  closure_evidence_artifact_id: string | null;
  created_at: string;             // ISO 8601
  closed_at: string | null;
}
```

---

### §Gate Decisions

```typescript
interface GateDecision {
  decision_id: string;            // UUID
  gate_number: 0|1|2|3|4|5|6|7|8|9;
  phase_name: string;
  ai_recommendation: AIRecommendation;
  human_disposition: string;
  reviewer_role: string;
  decision: "Pass"|"Conditional Pass"|"Fail";
  comments: string | null;
  timestamp: string;              // ISO 8601
  artifact_versions_reviewed: VersionRef[];
  open_conditions: Action[];      // Conditional Pass actions
  is_final: true;                 // Always true; immutable once written
  supersedes: string | null;      // decision_id of prior attempt
}

interface AIRecommendation {
  recommendation_id: string;
  recommended_outcome: "Pass"|"Conditional Pass"|"Fail";
  rationale: string;
  key_findings_referenced: string[];
  key_checks_referenced: string[];
  generated_at: string;
  model_id: string;
}

interface VersionRef {
  artifact_id: string;
  version_number: number;
}
```

---

### §CompactPhaseSummary

```typescript
interface CompactPhaseSummary {
  phase_id: 0|1|2|3|4|5|6|7|8|9;
  summary_version: number;
  gate_outcome: "Pass"|"Conditional Pass";
  key_decisions: string[];        // ≤ 3 items; ≤ 50 tokens each
  key_outputs: OutputRef[];       // ≤ 2 items
  open_actions: string[];         // Action IDs only
  findings_summary: string;       // ≤ 100 tokens
  token_estimate: number;
  generated_at: string;
}

interface OutputRef {
  output_name: string;
  artifact_id: string;
}
```

---

### §Audit History

```typescript
// Append-only; no update or delete permitted
interface AuditEvent {
  audit_id: string;               // UUID
  event_type: "IntakeEvent"|"GateDecision"|"FindingRaised"|"ActionCreated"|
              "ActionClosed"|"PhaseStateChange"|"CheckRun"|"VersionCreated"|
              "OutputApproved"|"Cancellation"|"SystemInitialization";
  phase_id: number | null;
  description: string;
  actor: string;
  related_ids: string[];
  payload: Record<string, unknown>;
  timestamp: string;              // ISO 8601
}
```

---

### §Relational DDL (PostgreSQL mapping)

For implementations using a relational database, the ProjectState JSON document maps to the following table structure:

```sql
-- Core project identity (one row per project)
CREATE TABLE project_state (
  state_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_version   INTEGER NOT NULL DEFAULT 1,
  project_id      TEXT NOT NULL DEFAULT 'EVINV-POC-001',
  product_name    TEXT NOT NULL,
  project_type    TEXT NOT NULL DEFAULT 'NPI A',
  project_category TEXT NOT NULL DEFAULT 'Category 1',
  current_phase   SMALLINT NOT NULL CHECK (current_phase BETWEEN 0 AND 9),
  current_gate    SMALLINT NOT NULL CHECK (current_gate BETWEEN 0 AND 9),
  current_technical_review TEXT,
  project_status  TEXT NOT NULL CHECK (project_status IN ('Active','Blocked','Cancelled','Closed')),
  synthetic_data_indicator BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Per-phase state
CREATE TABLE phase_states (
  phase_state_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      TEXT NOT NULL REFERENCES project_state(project_id),
  phase_id        SMALLINT NOT NULL CHECK (phase_id BETWEEN 0 AND 9),
  phase_state     TEXT NOT NULL,
  gate_state      TEXT NOT NULL,
  ai_recommendation JSONB,
  compact_phase_summary JSONB,
  execution_started_at TIMESTAMPTZ,
  execution_completed_at TIMESTAMPTZ,
  UNIQUE(project_id, phase_id)
);

-- Logical inputs (one row per logical input per phase)
CREATE TABLE phase_inputs (
  input_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      TEXT NOT NULL,
  phase_id        SMALLINT NOT NULL,
  input_role      TEXT NOT NULL CHECK (input_role IN ('external','internal')),
  logical_name    TEXT NOT NULL,
  intake_behavior TEXT NOT NULL CHECK (intake_behavior IN ('UP','SI')),
  system_represented TEXT,
  readiness_status TEXT NOT NULL,
  validation_issues JSONB NOT NULL DEFAULT '[]'
);

-- Input versions (one row per version per logical input)
CREATE TABLE input_versions (
  version_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  input_id        UUID NOT NULL REFERENCES phase_inputs(input_id),
  version_number  INTEGER NOT NULL,
  artifact_id     UUID,
  intake_behavior TEXT NOT NULL,
  active          BOOLEAN NOT NULL DEFAULT FALSE,
  validation_result JSONB NOT NULL,
  intake_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  invalidated_by  UUID,
  rerun_triggered BOOLEAN NOT NULL DEFAULT FALSE,
  affected_scope  TEXT[] NOT NULL DEFAULT '{}',
  -- Enforce single active version per input at DB level
  UNIQUE(input_id, version_number)
);
CREATE UNIQUE INDEX idx_input_versions_single_active
  ON input_versions(input_id) WHERE active = TRUE;

-- Artifact registry
CREATE TABLE artifact_registry (
  artifact_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_name   TEXT NOT NULL,
  artifact_type   TEXT NOT NULL CHECK (artifact_type IN ('XLSX','CSV','DOCX','PDF')),
  source          TEXT NOT NULL,
  intake_behavior TEXT NOT NULL,
  version         INTEGER NOT NULL,
  phase_id        SMALLINT NOT NULL,
  gate_id         SMALLINT NOT NULL,
  input_version_refs TEXT[] NOT NULL DEFAULT '{}',
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  generated_by    TEXT NOT NULL,
  disclaimer_present BOOLEAN NOT NULL DEFAULT TRUE CHECK (disclaimer_present = TRUE),
  storage_uri     TEXT NOT NULL,
  row_count       INTEGER,
  page_count      INTEGER,
  file_size_bytes BIGINT NOT NULL
);

-- Phase outputs (max 2 per phase; enforced at application layer)
CREATE TABLE phase_outputs (
  output_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      TEXT NOT NULL,
  phase_id        SMALLINT NOT NULL,
  output_name     TEXT NOT NULL,
  artifact_type   TEXT NOT NULL,
  size_guidance   TEXT NOT NULL,
  artifact_id     UUID REFERENCES artifact_registry(artifact_id),
  version_ref     TEXT NOT NULL,
  approval_status TEXT NOT NULL,
  review_required BOOLEAN NOT NULL DEFAULT FALSE,
  approved_by     TEXT,
  approved_at     TIMESTAMPTZ
);

-- Deterministic check results
CREATE TABLE check_results (
  check_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_type      TEXT NOT NULL,
  phase_id        SMALLINT NOT NULL,
  input_version_ids TEXT[] NOT NULL,
  formula_or_method TEXT NOT NULL,
  threshold       TEXT NOT NULL,
  threshold_unit  TEXT NOT NULL,
  result_value    TEXT NOT NULL,
  result_unit     TEXT NOT NULL,
  status          TEXT NOT NULL CHECK (status IN ('Pass','Fail','Warning')),
  source_reference TEXT NOT NULL,
  limitation      TEXT NOT NULL,
  items_checked   JSONB NOT NULL DEFAULT '[]',
  invalidated     BOOLEAN NOT NULL DEFAULT FALSE,
  superseded_by   UUID,
  run_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Findings
CREATE TABLE findings (
  finding_id      TEXT PRIMARY KEY,   -- e.g., 'F4-001'
  source_phase    SMALLINT NOT NULL,
  source_gate     SMALLINT NOT NULL,
  detected_by     TEXT NOT NULL,
  check_id        UUID,
  description     TEXT NOT NULL,
  severity        TEXT NOT NULL CHECK (severity IN ('Critical','Major','Minor','Observation')),
  status          TEXT NOT NULL,
  seeded          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at       TIMESTAMPTZ
);

-- Actions
CREATE TABLE actions (
  action_id       TEXT PRIMARY KEY,   -- e.g., 'A3-001'
  source_finding_id TEXT NOT NULL REFERENCES findings(finding_id),
  source_phase    SMALLINT NOT NULL,
  source_gate     SMALLINT NOT NULL,
  description     TEXT NOT NULL,
  owner_role      TEXT NOT NULL,
  blocking        BOOLEAN NOT NULL DEFAULT FALSE,
  parallel        BOOLEAN NOT NULL DEFAULT FALSE,
  due_phase       SMALLINT NOT NULL,
  due_gate        SMALLINT NOT NULL,
  required_closure_evidence TEXT NOT NULL,
  status          TEXT NOT NULL,
  human_approver  TEXT,
  closure_evidence_artifact_id UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at       TIMESTAMPTZ
);

-- Gate decisions (immutable after insert)
CREATE TABLE gate_decisions (
  decision_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gate_number     SMALLINT NOT NULL,
  phase_name      TEXT NOT NULL,
  ai_recommendation JSONB NOT NULL,
  human_disposition TEXT NOT NULL DEFAULT '',
  reviewer_role   TEXT NOT NULL,
  decision        TEXT NOT NULL CHECK (decision IN ('Pass','Conditional Pass','Fail')),
  comments        TEXT,
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  artifact_versions_reviewed JSONB NOT NULL DEFAULT '[]',
  open_conditions JSONB NOT NULL DEFAULT '[]',
  is_final        BOOLEAN NOT NULL DEFAULT TRUE,
  supersedes      UUID
);

-- Audit history (append-only; no update/delete)
CREATE TABLE audit_history (
  audit_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type      TEXT NOT NULL,
  phase_id        SMALLINT,
  description     TEXT NOT NULL,
  actor           TEXT NOT NULL,
  related_ids     TEXT[] NOT NULL DEFAULT '{}',
  payload         JSONB NOT NULL DEFAULT '{}',
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Revoke UPDATE and DELETE on audit_history at DB level:
-- REVOKE UPDATE, DELETE ON audit_history FROM application_role;
```

---

*FRD-TTCopilot-v1.0 | Y0-Schema | Synthetic POC Data Only*
---

## Y1: REST API Endpoint Catalog

**Document:** Consolidated REST API for TT Engineering Copilot POC (EVINV-POC-001).

> **Synthetic POC Data. Not TT Electronics Product Data. Not for Design, Fabrication, Certification, Procurement, or Production.**

---

### Conventions

- **Base URL:** `/api` (configurable; no version prefix in POC)
- **Authentication:** POC uses reviewer role labels passed in `X-Reviewer-Role` header; no SSO or RBAC in POC scope.
- **Content-Type:** `application/json` for all requests and responses unless noted.
- **File uploads:** `multipart/form-data` for artifact upload endpoints.
- **Error format:** All errors return `{ "error_code": "...", "message": "...", "details": {...} }`.
- **Timestamps:** ISO 8601 UTC (e.g., `2026-08-15T14:30:00Z`).
- **Gate AI prohibition:** Any endpoint that writes a gate decision rejects requests where `X-Reviewer-Role` is absent or matches a known AI actor identifier.

---

### §Orchestrator

#### POST /api/orchestrator/phase/{phase_id}/start
Start phase execution. Requires both inputs to be in ready status.

**Path params:** `phase_id` (0–9)

**Request body:**
```json
{ "reviewer_role": "string" }
```

**Response 200:**
```json
{
  "phase_id": 0,
  "phase_state": "Running",
  "execution_started_at": "2026-08-15T14:30:00Z"
}
```

**Errors:** `409 INPUTS_NOT_READY`, `409 INVALID_STATE_TRANSITION`

---

#### POST /api/orchestrator/phase/{phase_id}/pause
Gracefully pause a running phase.

**Response 200:** `{ "phase_id": 0, "phase_state": "Paused" }`

**Errors:** `409 INVALID_STATE_TRANSITION`

---

#### POST /api/orchestrator/phase/{phase_id}/resume
Resume a paused phase. Idempotent — returns current state if already running.

**Response 200:** `{ "phase_id": 0, "phase_state": "Running" }`

---

#### POST /api/orchestrator/phase/{phase_id}/retry
Reset a failed phase to AwaitingInputs after corrective action.

**Request body:** `{ "reviewer_role": "string", "rationale": "string" }`

**Response 200:** `{ "phase_id": 0, "phase_state": "AwaitingInputs" }`

**Errors:** `409 INVALID_STATE_TRANSITION` (phase not in GateFailed)

---

#### POST /api/orchestrator/phase/{phase_id}/cancel
Cancel a phase. Irreversible.

**Request body:** `{ "reviewer_role": "string", "reason": "string" }`

**Response 200:** `{ "phase_id": 0, "phase_state": "Cancelled" }`

---

#### POST /api/orchestrator/run-to-gate
Run phases sequentially up to and pausing at the specified gate.

**Request body:**
```json
{ "target_gate": 4, "reviewer_role": "string" }
```

**Response 200:**
```json
{ "status": "running", "target_gate": 4, "current_phase": 2 }
```

**Errors:** `400 RUN_TO_GATE_INVALID`, `409 INVALID_STATE_TRANSITION`

---

#### POST /api/orchestrator/targeted-rerun
Rerun only the checks/outputs affected by a revised input version.

**Request body:**
```json
{
  "phase_id": 4,
  "input_type": "internal",
  "new_version_id": "uuid"
}
```

**Response 200:**
```json
{
  "affected_scope": ["check-uuid-1", "check-uuid-2", "finding-F4-001", "output-uuid-1"],
  "rerun_initiated": true
}
```

**Errors:** `404 INPUT_NOT_FOUND`, `409 NO_ACTIVE_INPUT_VERSION`

---

#### GET /api/orchestrator/state
Get full orchestrator and phase state summary.

**Response 200:**
```json
{
  "project_status": "Active",
  "current_phase": 4,
  "current_gate": 4,
  "phases": [
    { "phase_id": 0, "phase_state": "GatePassed", "gate_state": "Decided" },
    ...
  ]
}
```

---

### §Artifact Count

#### GET /api/phases/{phase_id}/config
Get phase configuration (intake behaviors, expected artifact counts).

**Response 200:**
```json
{
  "phase_id": 4,
  "phase_name": "Phase 4 — Detailed Design",
  "technical_review": "PCB Layout Review + CDR",
  "external_input": {
    "logical_name": "DFM, Assembly, Standards & Supplier-Risk Package",
    "intake_behavior": "SI",
    "system_represented": "standards library, supplier feed, obsolescence source",
    "accepted_formats": ["xlsx","csv"],
    "size_guidance": "~10 rows"
  },
  "internal_input": {
    "logical_name": "Released Detailed Design Baseline Package",
    "intake_behavior": "UP",
    "accepted_formats": ["xlsx","docx","pdf"],
    "size_guidance": "multi-format design package"
  },
  "output_specs": [
    { "output_name": "Source-Cited, Risk-Scored DFM & Standards Audit", "artifact_type": "XLSX", "size_guidance": "~10 findings" },
    { "output_name": "BOM Health & Manufacturability Report", "artifact_type": "DOCX", "size_guidance": "1–2 pages" }
  ]
}
```

---

#### GET /api/phases/{phase_id}/artifact-count
Get current artifact count status.

**Response 200:**
```json
{
  "phase_id": 4,
  "external_input_count": 1,
  "external_input_ready": true,
  "internal_input_count": 1,
  "internal_input_ready": false,
  "output_count": 0,
  "max_outputs": 2,
  "compliant": false
}
```

---

### §Intake

#### GET /api/phases/{phase_id}/inputs
Get input readiness status for both inputs.

**Response 200:**
```json
{
  "phase_id": 4,
  "external_input": {
    "logical_name": "...",
    "intake_behavior": "SI",
    "system_represented": "standards library, supplier feed, obsolescence source",
    "readiness_status": "SyntheticSystemInputReady",
    "active_version": 1,
    "validation_issues": []
  },
  "internal_input": {
    "logical_name": "...",
    "intake_behavior": "UP",
    "readiness_status": "AwaitingUserInput",
    "active_version": null,
    "validation_issues": []
  },
  "phase_execution_status": "WaitingForUserInput"
}
```

---

#### POST /api/phases/{phase_id}/inputs/external/upload
Upload user-provided external input file (UP only).

**Content-Type:** `multipart/form-data`
**Form fields:** `file` (binary), `reviewer_role` (string)

**Response 200:**
```json
{
  "version_id": "uuid",
  "version_number": 1,
  "artifact_id": "uuid",
  "validation_result": { "passed": true, "issues": [] },
  "readiness_status": "UserInputReady"
}
```

**Errors:** `400 FILE_TYPE_INVALID`, `400 FILE_NOT_PARSEABLE`, `422 PROJECT_ID_MISMATCH`, `422 REQUIRED_SECTION_MISSING`

---

#### POST /api/phases/{phase_id}/inputs/internal/upload
Upload user-provided internal input file (UP only). Same schema as external upload.

---

#### POST /api/phases/{phase_id}/inputs/external/ingest
Ingest synthetic external sample. Requires explicit user action.

**Request body:** `{ "reviewer_role": "string", "confirm_viewed": true }`

**Response 200:**
```json
{
  "version_id": "uuid",
  "version_number": 1,
  "readiness_status": "SyntheticSystemInputReady",
  "system_represented": "standards library, supplier feed, obsolescence source"
}
```

**Errors:** `409 INGEST_WITHOUT_REVIEW`, `403 AUTO_INGEST_PROHIBITED`

---

#### POST /api/phases/{phase_id}/inputs/internal/ingest
Ingest synthetic internal sample. Same schema as external ingest.

---

#### POST /api/phases/{phase_id}/inputs/external/upload-revised
Upload revised version of external input (UP). Returns new version record.

---

#### POST /api/phases/{phase_id}/inputs/internal/upload-revised
Upload revised version of internal input (UP). Same schema.

---

#### POST /api/phases/{phase_id}/inputs/external/ingest-revised
Ingest revised synthetic external sample (SI). Same schema as initial ingest.

---

#### GET /api/phases/{phase_id}/execution-status
Get Phase Execution Status.

**Response 200:**
```json
{
  "phase_id": 4,
  "phase_execution_status": "ReadyToRun",
  "blocking_reason": null
}
```

---

### §Versioning

#### GET /api/phases/{phase_id}/inputs/{input_type}/versions
List all versions for a logical input. `input_type` = `external` or `internal`.

**Response 200:** `{ "versions": [ InputVersion, ... ] }`

---

#### GET /api/phases/{phase_id}/inputs/{input_type}/versions/{version_id}
Get a specific version record.

---

#### GET /api/phases/{phase_id}/inputs/{input_type}/affected-scope
Compute affected scope for the current active version.

**Response 200:**
```json
{
  "input_type": "internal",
  "active_version_id": "uuid",
  "affected_scope": ["check-uuid-1", "finding-F4-001"]
}
```

---

#### GET /api/project/dependency-graph
Get the full dependency graph.

**Response 200:** `{ "nodes": [ ... ], "edges": [ ... ] }`

---

### §ProjectState

#### GET /api/project/state
Get full ProjectState (top-level only; no binary artifact content).

#### GET /api/project/state/phases/{phase_id}
Get per-phase state object.

#### GET /api/project/state/findings
Get all findings. Query params: `?phase_id=4&severity=Critical&seeded=true&status=Open`

#### GET /api/project/state/actions
Get all actions. Query params: `?phase_id=4&blocking=true&status=Open`

#### GET /api/project/state/gate-decisions
Get all gate decisions.

#### GET /api/project/state/audit-history
Get full audit history. Query params: `?event_type=IntakeEvent&phase_id=4`

#### GET /api/project/state/compact-summaries
Get all compact phase summaries.

---

### §Checks

#### POST /api/checks/phase/{phase_id}/run
Run all mandatory checks for a phase.

**Request body:** `{ "reviewer_role": "string" }`

**Response 200:**
```json
{
  "phase_id": 4,
  "checks_run": ["CrossArtifactConsistency","HVClearance","ComponentDerating","TestPointCoverage"],
  "results": [ CheckResult, ... ],
  "overall_status": "Fail",
  "fail_count": 4,
  "pass_count": 0
}
```

**Errors:** `409 NO_ACTIVE_INPUT_VERSION`, `409 REQUIRED_CHECKS_NOT_RUN`

---

#### GET /api/checks/phase/{phase_id}/results
Get all check results for a phase. Query params: `?status=Fail&invalidated=false`

#### GET /api/checks/{check_id}
Get a specific check result record.

#### POST /api/checks/{check_id}/invalidate
Mark a check result as invalidated (triggered by targeted-rerun).

---

### §Findings

#### GET /api/findings
Get all findings. Query params: `?phase_id=4&seeded=true&severity=Critical`

#### GET /api/findings/{finding_id}
Get a specific finding.

#### POST /api/findings/{finding_id}/close
Close a finding. Requires human approver and closure evidence.

**Request body:**
```json
{
  "reviewer_role": "string",
  "closure_notes": "string",
  "closure_evidence_artifact_id": "uuid"
}
```

---

### §Actions

#### GET /api/actions
Get all actions. Query params: `?phase_id=4&blocking=true&status=Open`

#### GET /api/actions/{action_id}
Get a specific action.

#### POST /api/actions/{action_id}/approve
Approve a corrective action (human only).

**Request body:** `{ "reviewer_role": "string", "approval_notes": "string" }`

#### POST /api/actions/{action_id}/close
Close an action with closure evidence.

**Request body:**
```json
{
  "reviewer_role": "string",
  "closure_notes": "string",
  "closure_evidence_artifact_id": "uuid"
}
```

---

### §Gates

#### GET /api/gates/{gate_id}/review
Get full gate review data from ProjectState (no gate-pack artifact emitted).

**Response 200:**
```json
{
  "gate_number": 4,
  "phase_name": "Phase 4 — Detailed Design",
  "gate_state": "Open",
  "inputs_reviewed": [ ... ],
  "outputs_reviewed": [ ... ],
  "check_results_summary": [ ... ],
  "findings": [ ... ],
  "open_actions": [ ... ],
  "blocking_actions_open": true,
  "ai_recommendation": { ... },
  "prior_decisions": []
}
```

---

#### POST /api/gates/{gate_id}/decide
Record human gate decision. AI actor IDs rejected.

**Request headers:** `X-Reviewer-Role: "Design Engineer"` (required)

**Request body:**
```json
{
  "reviewer_role": "Design Engineer",
  "decision": "Pass",
  "comments": "All issues resolved. Design ready to proceed.",
  "conditional_actions": [],
  "artifact_versions_reviewed": [
    { "artifact_id": "uuid", "version_number": 2 }
  ]
}
```

**Response 201:**
```json
{
  "decision_id": "uuid",
  "gate_number": 4,
  "decision": "Pass",
  "timestamp": "2026-08-15T16:00:00Z"
}
```

**Errors:** `403 GATE_AI_PROHIBITED`, `409 BLOCKING_ACTIONS_OPEN`, `400 CONDITIONAL_ACTIONS_REQUIRED`, `409 GATE_LOCKED`, `409 GATE_ALREADY_DECIDED`, `400 REVIEWER_ROLE_MISSING`

---

#### GET /api/gates/{gate_id}/decisions
Get all gate decisions for a specific gate.

#### GET /api/gates/decisions
Get all gate decisions across all gates.

---

### §Artifacts

#### POST /api/artifacts/validate
Validate an artifact against compact artifact standards.

**Content-Type:** `multipart/form-data`
**Form fields:** `file` (binary), `artifact_type` (XLSX/CSV/DOCX/PDF), `phase_id` (int), `is_agent_generated` (bool)

**Response 200:**
```json
{
  "passed": true,
  "issues": [],
  "row_count": 8,
  "page_count": null,
  "disclaimer_present": true
}
```

**Errors:** `422 DISCLAIMER_MISSING`, `422 ROW_COUNT_VIOLATION`, `422 PAGE_COUNT_VIOLATION`, `422 SYNTHETIC_LABEL_MISSING`

---

#### POST /api/artifacts/register
Register a validated artifact in the artifact registry.

**Request body:** `{ "artifact_id": "uuid", "provenance": { ... } }`

#### GET /api/artifacts/{artifact_id}
Get artifact record with provenance.

#### GET /api/artifacts/{artifact_id}/versions
Get all versions of an artifact.

---

### §Context

#### POST /api/system/initialize-index
Build and cache the reference document index.

**Response 200:** `{ "status": "initialized", "document_count": 5, "indexed_at": "..." }`

#### GET /api/system/index-status
Check reference index initialization status.

**Response 200:** `{ "initialized": true, "indexed_at": "...", "document_ids": [ ... ] }`

#### POST /api/context/assemble
Assemble context package for a phase agent invocation.

**Request body:** `{ "phase_id": 4, "focus": "DFM and clearance check" }`

**Response 200:**
```json
{
  "phase_id": 4,
  "context_package": {
    "active_inputs_summary": { ... },
    "upstream_summaries": [ CompactPhaseSummary, ... ],
    "open_actions": [ ... ],
    "selected_checklist_items": [ ... ],
    "selected_standard_passages": [ ... ],
    "output_schema": { ... }
  },
  "token_count": 3842
}
```

**Errors:** `503 REFERENCE_INDEX_NOT_INITIALIZED`, `422 CONTEXT_TOKEN_BUDGET_EXCEEDED`

#### GET /api/context/phase/{phase_id}/summaries
Get compact phase summaries for all prior phases.

---

### §Views

#### GET /api/views/project-overview
Get Project Overview data (AV-01).

#### GET /api/views/lifecycle
Get Product Lifecycle View data (AV-02). Returns phase nodes, gate nodes, breadcrumb states.

#### GET /api/views/phase/{phase_id}/workspace
Get Phase Workspace data (AV-03). Returns full panel data for a phase.

#### GET /api/views/phase/{phase_id}/intake
Get Input Intake and Validation Panel data (AV-04).

#### GET /api/artifacts/{artifact_id}/viewer
Get Artifact Viewer data (AV-05). Returns artifact content for inline rendering.

#### GET /api/views/phase/{phase_id}/checklist
Get Technical Checklist Workspace data (AV-06).

**Errors:** `404 NO_CHECKLIST_MAPPED` for Phase 2 and Phases 5–9.

#### GET /api/views/findings-actions
Get Findings and Actions Workspace data (AV-07). Query params: `?phase_id=4&blocking=true`

#### GET /api/views/gate/{gate_id}/review
Get Gate Review Workspace data (AV-08). Same as `GET /api/gates/{gate_id}/review`.

#### GET /api/views/audit
Get Audit View data (AV-09). Query params: `?event_type=IntakeEvent&phase_id=4`

#### GET /api/views/breadcrumbs
Get breadcrumb state for all 10 phases.

**Response 200:**
```json
{
  "breadcrumbs": [
    { "phase_id": 0, "phase_name": "Phase 0 — Commercial Assessment", "technical_review": "Kickoff", "gate_number": 0, "state": "Completed", "gate_outcome": "Pass" },
    { "phase_id": 1, "phase_name": "Phase 1 — Business Case", "technical_review": "SLR", "gate_number": 1, "state": "Completed", "gate_outcome": "Pass" },
    ...
    { "phase_id": 4, "phase_name": "Phase 4 — Detailed Design", "technical_review": "PCB Layout Review + CDR", "gate_number": 4, "state": "Awaiting Human Decision", "gate_outcome": null },
    ...
  ]
}
```

---

*FRD-TTCopilot-v1.0 | Y1-API | Synthetic POC Data Only*
---

## Y2: Cross-Feature Error Catalog

**Document:** Complete error catalog for TT Engineering Copilot POC (EVINV-POC-001).

> **Synthetic POC Data. Not TT Electronics Product Data. Not for Design, Fabrication, Certification, Procurement, or Production.**

---

### Error Response Format

All API error responses use the following JSON structure:

```json
{
  "error_code": "ERROR_CODE_CONSTANT",
  "message": "Human-readable message",
  "details": {
    "field": "optional field name",
    "value": "optional value that caused the error",
    "context": "optional contextual information"
  },
  "timestamp": "2026-08-15T14:30:00Z",
  "request_id": "uuid"
}
```

---

### §Gate Authority Errors (F0, F10)

| Error Code | HTTP Status | Source Feature | Trigger | Message | Retry Guidance |
|---|---|---|---|---|---|
| `GATE_AI_PROHIBITED` | 403 | F0, F10 | Gate decision submitted by AI actor or without human reviewer role | "Gate decisions must be made by an authorized human reviewer. AI cannot approve any gate." | Human must explicitly perform the gate decision action. |
| `GATE_OUTCOME_INVALID` | 400 | F0, F10 | Gate outcome value not in {Pass, Conditional Pass, Fail} | "Gate outcome must be Pass, Conditional Pass, or Fail." | Correct the decision value and resubmit. |
| `GATE_LOCKED` | 409 | F0, F10 | Gate decision attempted before phase reaches AwaitingGate | "Gate {n} is locked. Phase must complete execution before gate review." | Wait for phase execution to complete. |
| `GATE_ALREADY_DECIDED` | 409 | F0, F10 | Gate decision on a gate that is already in Decided state | "Gate {n} has already been decided. Use the retry workflow to re-evaluate." | Use POST /api/orchestrator/phase/{id}/retry to re-open. |
| `BLOCKING_ACTIONS_OPEN` | 409 | F10 | Pass decision with open blocking actions | "Cannot record Pass: blocking action(s) {ids} must be verified closed first." | Close all blocking actions, then re-attempt gate decision. |
| `CONDITIONAL_ACTIONS_REQUIRED` | 400 | F10 | Conditional Pass without at least one conditional action | "Conditional Pass requires at least one conditional action to be defined." | Add at least one conditional action before submitting. |
| `REVIEWER_ROLE_MISSING` | 400 | F0, F9, F10 | Gate decision or human action submitted without reviewer role | "Reviewer role is required for all gate decisions and human-controlled actions." | Include reviewer_role in request body and X-Reviewer-Role header. |

---

### §Orchestrator State Errors (F0)

| Error Code | HTTP Status | Source Feature | Trigger | Message | Retry Guidance |
|---|---|---|---|---|---|
| `INPUTS_NOT_READY` | 409 | F0, F2 | Phase execution attempted before both inputs are ready | "Both inputs must be validated and ready before phase execution can begin." | Complete input intake for all pending inputs. |
| `INVALID_STATE_TRANSITION` | 409 | F0 | Phase transition not permitted in current state | "Cannot perform that operation in the current phase state ({current_state})." | Review allowed transitions for current state. |
| `RUN_TO_GATE_INVALID` | 400 | F0 | run_to_gate target gate ≤ current phase | "Target gate must be ahead of the current phase (current: {current})." | Specify a target gate number greater than the current phase. |
| `INPUT_NOT_FOUND` | 404 | F0, F3 | targeted_rerun with unknown input_id | "The specified logical input ID does not exist in ProjectState." | Verify input_id against GET /api/phases/{id}/inputs. |

---

### §Artifact Count Errors (F1)

| Error Code | HTTP Status | Source Feature | Trigger | Message | Retry Guidance |
|---|---|---|---|---|---|
| `ARTIFACT_COUNT_VIOLATION` | 409 | F1 | Attempt to add second external or second internal input, or third output | "Phase {n} already has [one external input / one internal input / two outputs]. Maximum count exceeded." | Do not add additional artifacts; revise the existing artifact instead. |
| `GATE_PACK_PROHIBITED` | 409 | F1 | Gate-pack artifact registered as a phase output | "Gate-pack artifacts must not be registered as phase outputs. Use the Gate Review Workspace (AV-08)." | Remove from outputs[]; render from ProjectState in Gate Review Workspace. |

---

### §Input Intake Errors (F2)

| Error Code | HTTP Status | Source Feature | Trigger | Message | Retry Guidance |
|---|---|---|---|---|---|
| `FILE_TYPE_INVALID` | 400 | F2 | Uploaded file has unsupported extension | "File type not accepted. Supported formats: {list}." | Upload a file in one of the supported formats. |
| `FILE_NOT_PARSEABLE` | 400 | F2 | Uploaded file is corrupted, empty, or password-protected | "The uploaded file could not be parsed. Check the file and try again." | Verify file integrity and re-upload. |
| `PROJECT_ID_MISMATCH` | 422 | F2 | Project ID field in uploaded file ≠ EVINV-POC-001 | "Project ID in file does not match EVINV-POC-001." | Correct the Project ID field and re-upload. |
| `PRODUCT_NAME_MISMATCH` | 422 | F2 | Product name field in file ≠ EV-INV-800 | "Product name in file does not match EV-INV-800 Demonstration Traction Inverter." | Correct the product name and re-upload. |
| `PHASE_MISMATCH` | 422 | F2 | Phase field in file ≠ current phase | "Phase field in file does not match Phase {n}." | Correct the phase field and re-upload. |
| `REVISION_MISSING` | 422 | F2 | Revision field absent or empty | "Revision field is missing or empty. All versioned documents must include a revision level." | Add revision field and re-upload. |
| `UNITS_MISSING` | 422 | F2 | Quantitative field lacks units | "Field '{field}' contains a numeric value without units. Add units to all quantitative fields." | Add units to all numeric fields. |
| `DUPLICATE_IDENTIFIERS` | 422 | F2 | Duplicate row IDs in XLSX/CSV | "Duplicate identifier '{id}' found in rows {rows}. Row identifiers must be unique." | Remove duplicate rows or assign unique IDs. |
| `REQUIRED_SECTION_MISSING` | 422 | F2 | Required section or field absent from uploaded file | "Required section '{section}' not found in uploaded file." | Add the required section and re-upload. |
| `DATA_CONSISTENCY_ERROR` | 422 | F2 | Cross-field consistency check failure | "Data consistency error: {description}." | Correct the inconsistency and re-upload. |
| `INGEST_WITHOUT_REVIEW` | 409 | F2 | Ingest Sample clicked without prior View or Download | "Please view or download the synthetic sample before ingesting." | Click View or Download before clicking Ingest Sample. |
| `AUTO_INGEST_PROHIBITED` | 403 | F2 | Programmatic auto-ingestion attempt | "Automatic sample ingestion is prohibited. User must explicitly click Ingest Sample." | Require explicit user action to ingest. |
| `PROHIBITED_LABEL_DETECTED` | 500 | F2 | Generated content contains prohibited connectivity claim | "Generated content contains a prohibited connectivity claim ('Connected to…', 'Retrieved from…', 'Live…'). Content rejected." | Regenerate content using permitted labels. |

---

### §Versioning Errors (F3)

| Error Code | HTTP Status | Source Feature | Trigger | Message | Retry Guidance |
|---|---|---|---|---|---|
| `REVISION_VALIDATION_FAILED` | 422 | F3 | Revised file fails validation | "Revised version did not pass validation: {issue}. Prior version remains active." | Correct the validation issue and re-upload the revised version. |
| `VERSION_INTEGRITY_VIOLATION` | 500 | F3 | Two active versions detected for same input | "Internal error: more than one active version detected for input {id}." | Contact system administrator. |
| `DEPENDENCY_GRAPH_ERROR` | 500 | F3 | Dependency graph traversal fails | "Dependency graph traversal failed for input {id}. Targeted rerun cannot proceed." | Check dependency graph integrity via GET /api/project/dependency-graph. |
| `REVISED_SAMPLE_NOT_AVAILABLE` | 409 | F3 | Revised SI sample ingest attempted when no revised sample available | "No revised synthetic sample is available for this input." | Wait for revised sample to become available, then retry. |

---

### §Deterministic Check Errors (F5)

| Error Code | HTTP Status | Source Feature | Trigger | Message | Retry Guidance |
|---|---|---|---|---|---|
| `NO_ACTIVE_INPUT_VERSION` | 409 | F5 | Check run with no active input version | "Cannot run check: no active version for input '{logical_name}'." | Complete input intake before running checks. |
| `REQUIRED_CHECKS_NOT_RUN` | 409 | F5 | Gate review before mandatory checks run | "Phase {n} gate review requires all mandatory checks. Missing: {check_types}." | Run all mandatory checks via POST /api/checks/phase/{id}/run. |
| `DETERMINISTIC_INTEGRITY_VIOLATION` | 500 | F5 | LLM inference detected in deterministic check result | "Check result contains LLM-generated content. Deterministic checks must not use LLM inference." | Fix check implementation to use code-only calculation. |
| `SYNTHETIC_LABEL_MISSING` | 422 | F5, F8 | EVINV-POC-STD-001 referenced without synthetic label | "Reference to EVINV-POC-STD-001 must include 'Synthetic POC Standard' label." | Add synthetic label to all standard references. |

---

### §Seeded Issue Errors (F6)

| Error Code | HTTP Status | Source Feature | Trigger | Message | Retry Guidance |
|---|---|---|---|---|---|
| `HUMAN_APPROVAL_REQUIRED` | 403 | F6 | Corrective action auto-closed without human approval | "Corrective action closure requires human approval." | Human must explicitly approve and close the action. |
| `AUDIT_INTEGRITY_VIOLATION` | 500 | F6, F4 | Original check results deleted after correction | "Original check results must not be deleted. Correction cycle preserves both results." | Restore original results; contact system administrator. |
| `SEEDED_FLAG_MISSING` | 422 | F6 | Seeded finding created without seeded=true | "Seeded issue finding must have seeded=true in the finding record." | Set seeded=true on all seeded demonstration findings. |

---

### §Token Optimization Errors (F7)

| Error Code | HTTP Status | Source Feature | Trigger | Message | Retry Guidance |
|---|---|---|---|---|---|
| `REFERENCE_INDEX_NOT_INITIALIZED` | 503 | F7 | Agent invoked before reference index built | "Reference index has not been built. Run system initialization first." | POST /api/system/initialize-index, then retry. |
| `CONTEXT_TOKEN_BUDGET_EXCEEDED` | 422 | F7 | Assembled context exceeds token budget | "Assembled context exceeds token budget of {budget} tokens. Trimming applied." | Review context selection rules; reduce passage retrieval scope. |
| `FULL_DOC_IN_CONTEXT` | 500 | F7 | Full reference document transmitted to agent | "Internal error: full reference document transmitted to agent. Context assembly rules violated." | Fix context assembly layer to use passage retrieval only. |
| `DETERMINISTIC_DELEGATION_VIOLATION` | 500 | F7 | Deterministic computation delegated to LLM | "Deterministic check computation must not be delegated to LLM. Use tool call instead." | Implement calculation as a deterministic tool call. |

---

### §Compact Artifact Errors (F8)

| Error Code | HTTP Status | Source Feature | Trigger | Message | Retry Guidance |
|---|---|---|---|---|---|
| `DISCLAIMER_MISSING` | 422 | F8 | Artifact lacks mandatory disclaimer | "Artifact rejected: mandatory disclaimer not present." | Add disclaimer text to artifact before submission. |
| `ROW_COUNT_VIOLATION` | 422 | F8 | Agent-generated XLSX has > 10 meaningful rows | "Agent-generated XLSX has {n} rows; maximum is 10." | Reduce to ≤ 10 representative rows. |
| `ROW_COUNT_WARNING` | 200 (warning) | F8 | User-uploaded XLSX has > 10 rows | "Uploaded file has {n} rows; recommended maximum is 10. Processing continues." | Consider condensing to most representative rows. |
| `PAGE_COUNT_VIOLATION` | 422 | F8 | DOCX/PDF has > 2 pages | "DOCX/PDF has {n} pages; maximum is 2." | Condense document to ≤ 2 pages. |
| `COLUMN_COUNT_VIOLATION` | 422 | F8 | XLSX/CSV has < 6 or > 10 columns | "XLSX/CSV has {n} columns; required range is 6–10." | Add or remove columns to comply. |
| `PROVENANCE_FIELD_MISSING` | 422 | F8 | Required provenance field absent from artifact | "Required provenance field '{field}' is missing." | Add all required provenance fields. |
| `UNUSED_COLUMN_VIOLATION` | 422 | F8 | Agent-generated XLSX has unused columns | "Artifact contains unused column '{column}'. Remove unused columns." | Remove or populate all columns. |

---

### §Application View Errors (F9)

| Error Code | HTTP Status | Source Feature | Trigger | Message | Retry Guidance |
|---|---|---|---|---|---|
| `NO_CHECKLIST_MAPPED` | 404 | F9 | Checklist workspace requested for Phase 2 or 5–9 | "No technical review is mapped to Phase {n}. Checklist Workspace is not available." | No action; this is expected behavior for unmapped phases. |
| `AUDIT_IMMUTABLE` | 403 | F9 | Edit or delete attempted on audit record | "Audit records are immutable. No modifications are permitted." | No action; audit records cannot be changed by design. |
| `OUTPUT_COUNT_NOT_VALIDATED` | 409 | F1, F9 | Phase execution before output count validated | "Phase outputs have not been validated for count compliance." | Validate artifact counts before proceeding. |

---

### §Terminology Enforcement

These are not runtime API errors but enforcement rules verified by automated text scan:

| Prohibited String | Correct String | Enforcement Point |
|---|---|---|
| "replacement input" | "revised version" or "Upload Revised Version" | UI labels, API response bodies, generated text, audit records |
| "Connected to [SYSTEM]" | "Simulated Connector" | UI labels, API response bodies |
| "Retrieved from [SYSTEM]" | "Preloaded Synthetic Sample" | UI labels, API response bodies |
| "Live [SYSTEM] Data" | "Synthetic System Input" | UI labels, API response bodies |
| "Real-time [SYSTEM]" | "Simulated [SYSTEM] data" | UI labels, API response bodies |

---

*FRD-TTCopilot-v1.0 | Y2-Errors | Synthetic POC Data Only*
---

## Y3: External Integration Points

**Document:** Integration contracts and simulated connector specifications for TT Engineering Copilot POC (EVINV-POC-001).

> **Synthetic POC Data. Not TT Electronics Product Data. Not for Design, Fabrication, Certification, Procurement, or Production.**

---

### Overview

The TT Engineering Copilot POC uses **simulated connectors only** — no live connections to external enterprise systems in POC v1. Every simulated system is represented by a preloaded synthetic sample. The table below defines each simulated system, the phase(s) in which it appears, what data it provides, and the labels used in the UI.

Live integration with all listed systems is deferred to v2 (see REQUIREMENTS.md §v2 Requirements).

---

### Simulated System Inventory

| System | Phases Used | Input Role | UI Label | Sample Data Description |
|---|---|---|---|---|
| **Salesforce** | Phase 0 (internal) | Capability & Opportunity Assessment Package | "Simulated Connector — Salesforce" | Synthetic opportunity record: customer name, application, annual volume, target price, key requirements |
| **Cora** | Phase 0 (internal), Phase 1 (internal), Phase 7 (internal), Phase 9 (internal) | Various capability, cost, transfer, archive packages | "Simulated Connector — Cora" | Synthetic capability library, historical project records, gate records |
| **Capability Library** | Phase 0 (internal) | Part of Capability & Opportunity Assessment Package | "Simulated Connector — Capability Library" | Synthetic site capability profile: processes, certifications, equipment classes, capacity headroom |
| **Historical Projects** | Phase 0 (internal), Phase 1 (internal) | Part of Capability and Cost/Resource packages | "Simulated Connector — Historical Projects" | Synthetic historical NPI analogues with cost, schedule, and quality outcomes |
| **Site Capacity** | Phase 0 (internal) | Part of Capability & Opportunity Assessment Package | "Simulated Connector — Site Capacity" | Synthetic site loading: available engineering hours, floor capacity, equipment utilization |
| **Parametric Cost Model** | Phase 1 (internal) | Preliminary Cost & Resource Package | "Simulated Connector — Parametric Cost Model" | Synthetic cost model output: BOM cost estimate, NRE, tooling, labor |
| **Labor/Rate Source** | Phase 1 (internal) | Preliminary Cost & Resource Package | "Simulated Connector — Labor/Rate Source" | Synthetic labor rates by role and site |
| **Requirements Repository** | Phase 2 (internal) | Draft System Requirements & Interfaces Package | "Simulated Connector — Requirements Repository" | Synthetic draft system requirements aligned to EV-INV-800 specifications |
| **Interface Control Repository** | Phase 2 (internal) | Draft System Requirements & Interfaces Package | "Simulated Connector — Interface Control Repository" | Synthetic interface control document stub: CAN, power, thermal, mechanical |
| **Standards Library** | Phase 3 (external), Phase 4 (external), Phase 5 (external) | Design Rules, DFM/Standards, Test Methods packages | "Simulated Connector — Standards Library" | Synthetic EVINV-POC-STD-001 content; selected DFM rules; test method references |
| **Manufacturing Capability Repository** | Phase 3 (external) | Design Rules & Manufacturing Capabilities Package | "Simulated Connector — Manufacturing Capability Repository" | Synthetic DFM/DFA capability limits: trace width, clearance, component placement, soldering specs |
| **Supplier Feed** | Phase 4 (external) | DFM, Assembly, Standards & Supplier-Risk Package | "Simulated Connector — Supplier Feed" | Synthetic supplier risk data: lead times, single-source flags, supply chain concentration |
| **Obsolescence Source** | Phase 4 (external), Phase 8 (external) | DFM/Standards Package; Supplier Lifecycle Package | "Simulated Connector — Obsolescence Source" | Synthetic obsolescence notices including fictional IGBT discontinuance (SI-08) |
| **Customer Acceptance Repository** | Phase 5 (external) | Test Methods & Customer Acceptance Package | "Simulated Connector — Customer Acceptance Repository" | Synthetic customer acceptance test requirements aligned to EV-INV-800 |
| **MES (Manufacturing Execution System)** | Phase 6 (internal), Phase 7 (internal), Phase 8 (internal) | Manufacturing Process & Capability; Transfer; Production packages | "Simulated Connector — MES" | Synthetic process data: yield, cycle time, torque values, Cpk measurements |
| **Quality System / CAPA** | Phase 6 (internal), Phase 7 (internal) | Manufacturing Process; Transfer packages | "Simulated Connector — Quality System" | Synthetic CAPA records, quality KPIs, non-conformance counts |
| **Equipment Records** | Phase 6 (internal) | Manufacturing Process & Capability Package | "Simulated Connector — Equipment Records" | Synthetic equipment qualification status, calibration records |
| **ERP** | Phase 8 (internal), Phase 9 (internal) | Production, BOM, Yield & Cost; Final Product & Archive packages | "Simulated Connector — ERP" | Synthetic production orders, BOM revisions, inventory, financial data |
| **PLM (Product Lifecycle Management)** | Phase 8 (internal) | Production, BOM, Yield & Cost Package | "Simulated Connector — PLM" | Synthetic design change records, BOM history, revision control |
| **Change Review Board Records** | Phase 8 (internal) | Production, BOM, Yield & Cost Package | "Simulated Connector — Change Review Board" | Synthetic ECO/ECN records for EV-INV-800 |
| **Distributor Feeds** | Phase 8 (external) | Supplier Lifecycle & Availability Package | "Simulated Connector — Distributor Feeds" | Synthetic stock availability, pricing, and lead-time data from fictional distributors |
| **Tooling/Fixture Register** | Phase 9 (internal) | Final Product, Demand, Asset & Archive Package | "Simulated Connector — Tooling/Fixture Register" | Synthetic tooling asset list with condition, location, and disposal status |
| **Project Archive** | Phase 9 (internal) | Final Product, Demand, Asset & Archive Package | "Simulated Connector — Project Archive" | Synthetic project record summary: approved outputs, gate decisions, lessons learned |

---

### Simulated Connector Contract

Every simulated connector must implement the following behavior contract:

| Behavior | Requirement |
|---|---|
| **Label always visible** | "Simulated Connector — [System Name]" label must be displayed at all times the synthetic sample is presented |
| **Synthetic sample label** | "Preloaded Synthetic Sample" label must accompany the sample at all times |
| **No live connection claim** | "No live connection exists to [System Name]" statement must appear in the connector panel |
| **Explicit ingest required** | User must click "Ingest Sample" before data enters the intake pipeline; no auto-ingest |
| **Provenance recording** | System represented, intake behavior (SI), intake timestamp, and system label must be recorded in intake event |
| **Sample content compliance** | All synthetic sample content must comply with compact artifact standards (F08): ≤ 10 rows, 6–10 fields, disclaimer present |
| **No real system credentials** | No live API keys, tokens, or credentials for external systems may exist in the POC codebase or configuration |
| **Disclaimer on sample** | Every synthetic sample file carries the mandatory disclaimer |

---

### Prohibited Integration Behaviors (POC v1)

The following are explicitly out of scope and must not be implemented:

| Prohibited Behavior | Reason |
|---|---|
| Live connection to Cora (checklist read, RAIL, gate approval write-back) | POC scope; v2 |
| Live Salesforce API call | POC scope |
| Live CAD/PLM connector (SolidWorks/NX/Creo) | POC scope |
| Live ERP read or write | POC scope |
| Live MES read | POC scope |
| Live quality system / CAPA API | POC scope |
| Live obsolescence database API | POC scope |
| Entra ID / SSO authentication | POC uses reviewer role labels only |
| Any network call from the POC application to an external enterprise system | No live credentials; simulated connectors only |

---

### v2 Integration Roadmap (Out of Scope for POC)

| System | v2 Capability |
|---|---|
| **Cora** | Live checklist read; RAIL action write-back; gate approval synchronization |
| **Salesforce** | Live opportunity data retrieval |
| **CAD/PLM (SolidWorks/NX/Creo)** | Automated feature extraction; clearance and BOM data from live models |
| **ERP** | Live BOM, inventory, and financial data |
| **MES** | Live process data for Cpk and yield calculations |
| **Quality System / CAPA** | Live CAPA records and quality KPIs |
| **Obsolescence Databases** | Live PDNA/IHS Markit or equivalent feed |
| **Entra ID / SSO** | Production RBAC and authentication |

---

### Reference Document Store (System-Level, Not External Integrations)

The following documents are loaded into the reference index at system initialization (see F07). These are internal POC documents, not live system integrations:

| Document | Source | Purpose in POC |
|---|---|---|
| EVINV-POC-STD-001 | POC-authored synthetic standard | Threshold source for clearance, derating, Cpk checks |
| Power Supplies Technical Review Checklists — Prelim | TT Electronics internal (adapted for POC) | Selected checklist items for Phases 0, 1, 3, 4 |
| TT-New-Product-Process-v4.1 | TT Electronics formal lifecycle document | Phase/gate governance reference |
| TechSur GenAI Automation Proposal | TechSur internal | Agent flow and input/output structure reference |
| TT Copilot Inputs/Outputs specification | TechSur internal | Compact artifact scope and per-phase intake behavior |

---

*FRD-TTCopilot-v1.0 | Y3-Integrations | Synthetic POC Data Only*
