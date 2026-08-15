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
