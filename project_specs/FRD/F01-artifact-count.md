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
