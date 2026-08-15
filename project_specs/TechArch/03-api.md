## 4. API Design

### 4.1 Conventions

- **Base URL:** `/api` (no version prefix in POC)
- **Authentication:** No SSO in POC. Reviewer role passed in `X-Reviewer-Role` request header. Any endpoint that writes a gate decision rejects requests where this header is absent or matches a known AI actor identifier.
- **Content-Type:** `application/json` for all request/response bodies unless noted
- **File uploads:** `multipart/form-data`
- **Streaming:** `text/event-stream` (SSE) for phase execution progress
- **Error envelope:** `{ "error_code": "...", "message": "...", "details": {...}, "timestamp": "ISO8601", "request_id": "uuid" }`
- **Timestamps:** ISO 8601 UTC

### 4.2 TypeScript Request / Response Interfaces

```typescript
// ─── Orchestrator ─────────────────────────────────────────────────────────────

// POST /api/orchestrator/phase/{phase_id}/start
interface StartPhaseRequest {
  reviewer_role: string;
}
interface StartPhaseResponse {
  phase_id: number;
  phase_state: "Running";
  execution_started_at: string;
}

// POST /api/orchestrator/phase/{phase_id}/retry
interface RetryPhaseRequest {
  reviewer_role: string;
  rationale: string;
}
interface RetryPhaseResponse {
  phase_id: number;
  phase_state: "AwaitingInputs";
}

// POST /api/orchestrator/phase/{phase_id}/cancel
interface CancelPhaseRequest {
  reviewer_role: string;
  reason: string;
}

// POST /api/orchestrator/run-to-gate
interface RunToGateRequest {
  target_gate: 0|1|2|3|4|5|6|7|8|9;
  reviewer_role: string;
}
interface RunToGateResponse {
  status: "running";
  target_gate: number;
  current_phase: number;
}

// POST /api/orchestrator/targeted-rerun
interface TargetedRerunRequest {
  phase_id: number;
  input_type: "external"|"internal";
  new_version_id: string;
}
interface TargetedRerunResponse {
  affected_scope: string[];          // check_ids, finding_ids, output_ids
  rerun_initiated: boolean;
}

// GET /api/orchestrator/state
interface OrchestratorStateResponse {
  project_status: "Active"|"Blocked"|"Cancelled"|"Closed";
  current_phase: number;
  current_gate: number;
  phases: Array<{
    phase_id: number;
    phase_state: string;
    gate_state: string;
  }>;
}

// ─── Intake ───────────────────────────────────────────────────────────────────

// GET /api/phases/{phase_id}/inputs
interface PhaseInputsResponse {
  phase_id: number;
  external_input: InputReadinessSummary;
  internal_input: InputReadinessSummary;
  phase_execution_status: "WaitingForUserInput"|"WaitingForSyntheticSampleIngestion"|
                          "ReadyToRun"|"Processing"|"AwaitingHumanDecision"|"Complete";
}
interface InputReadinessSummary {
  logical_name: string;
  intake_behavior: "UP"|"SI";
  system_represented: string | null;
  readiness_status: string;
  active_version: number | null;
  validation_issues: ValidationIssue[];
  required_user_action: string | null;
  ready: boolean;
}

// POST /api/phases/{phase_id}/inputs/external/upload  (multipart/form-data)
// POST /api/phases/{phase_id}/inputs/internal/upload  (multipart/form-data)
// Form fields: file (binary), reviewer_role (string)
interface UploadInputResponse {
  version_id: string;
  version_number: number;
  artifact_id: string;
  validation_result: {
    passed: boolean;
    issues: ValidationIssue[];
  };
  readiness_status: "UserInputReady"|"AwaitingUserInput";
}

// POST /api/phases/{phase_id}/inputs/external/ingest
// POST /api/phases/{phase_id}/inputs/internal/ingest
interface IngestSampleRequest {
  reviewer_role: string;
  confirm_viewed: true;             // Must be true; rejects if false
}
interface IngestSampleResponse {
  version_id: string;
  version_number: number;
  readiness_status: "SyntheticSystemInputReady";
  system_represented: string;
}

// GET /api/phases/{phase_id}/execution-status
interface ExecutionStatusResponse {
  phase_id: number;
  phase_execution_status: string;
  blocking_reason: string | null;
}

// ─── Versioning ───────────────────────────────────────────────────────────────

// GET /api/phases/{phase_id}/inputs/{input_type}/versions
interface InputVersionsResponse {
  versions: InputVersion[];
}

// GET /api/phases/{phase_id}/inputs/{input_type}/affected-scope
interface AffectedScopeResponse {
  input_type: "external"|"internal";
  active_version_id: string;
  affected_scope: string[];
}

// GET /api/project/dependency-graph
interface DependencyGraphResponse {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
}

// ─── ProjectState ────────────────────────────────────────────────────────────

// GET /api/project/state
interface ProjectStateResponse extends ProjectState {}

// GET /api/project/state/findings?phase_id=4&severity=Critical&seeded=true&status=Open
// GET /api/project/state/actions?phase_id=4&blocking=true&status=Open
// GET /api/project/state/gate-decisions
// GET /api/project/state/audit-history?event_type=IntakeEvent&phase_id=4
// GET /api/project/state/compact-summaries
// (all return typed arrays of the respective entity)

// ─── Checks ───────────────────────────────────────────────────────────────────

// POST /api/checks/phase/{phase_id}/run
interface RunChecksRequest {
  reviewer_role: string;
}
interface RunChecksResponse {
  phase_id: number;
  checks_run: string[];
  results: CheckResult[];
  overall_status: "Pass"|"Fail"|"Warning";
  fail_count: number;
  pass_count: number;
  warning_count: number;
}

// POST /api/checks/{check_id}/invalidate
interface InvalidateCheckRequest {
  reason: string;
  new_version_id: string;
}

// ─── Findings ────────────────────────────────────────────────────────────────

// POST /api/findings/{finding_id}/close
interface CloseFieldingRequest {
  reviewer_role: string;
  closure_notes: string;
  closure_evidence_artifact_id: string;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

// POST /api/actions/{action_id}/approve
interface ApproveActionRequest {
  reviewer_role: string;
  approval_notes: string;
}

// POST /api/actions/{action_id}/close
interface CloseActionRequest {
  reviewer_role: string;
  closure_notes: string;
  closure_evidence_artifact_id: string;
}

// ─── Gates ───────────────────────────────────────────────────────────────────

// GET /api/gates/{gate_id}/review
interface GateReviewResponse {
  gate_number: number;
  phase_name: string;
  gate_state: "Locked"|"Open"|"Decided";
  date_opened: string | null;
  inputs_reviewed: Array<{
    logical_name: string;
    active_version: number;
    validation_status: string;
    artifact_id: string | null;
  }>;
  outputs_reviewed: PhaseOutput[];
  check_results_summary: Array<{
    check_type: string;
    result_value: string;
    threshold: string;
    unit: string;
    status: "Pass"|"Fail"|"Warning";
    version_ref: string;
    check_id: string;
  }>;
  findings: Finding[];
  open_actions: Action[];
  blocking_actions_open: boolean;
  ai_recommendation: AIRecommendation | null;
  prior_decisions: GateDecision[];
}

// POST /api/gates/{gate_id}/decide
// Header: X-Reviewer-Role: "Design Engineer" (required; AI actor IDs rejected)
interface GateDecisionRequest {
  reviewer_role: string;
  decision: "Pass"|"Conditional Pass"|"Fail";
  comments?: string;
  human_disposition?: string;
  conditional_actions: ConditionalPassActionInput[];  // Required if Conditional Pass
  artifact_versions_reviewed: VersionRef[];
}
interface ConditionalPassActionInput {
  description: string;
  owner_role: string;
  blocking: boolean;
  parallel: boolean;
  due_phase: number;
  due_gate: number;
  required_closure_evidence: string;
  related_finding_id?: string;
}
interface GateDecisionResponse {
  decision_id: string;
  gate_number: number;
  decision: "Pass"|"Conditional Pass"|"Fail";
  timestamp: string;
}

// ─── Artifacts ───────────────────────────────────────────────────────────────

// POST /api/artifacts/validate  (multipart/form-data)
// Form fields: file (binary), artifact_type, phase_id, is_agent_generated
interface ArtifactValidationResponse {
  passed: boolean;
  issues: Array<{
    rule: string;
    field: string;
    message: string;
    severity: "Error"|"Warning";
  }>;
  row_count: number | null;
  page_count: number | null;
  disclaimer_present: boolean;
}

// POST /api/artifacts/register
interface RegisterArtifactRequest {
  artifact_id: string;
  provenance: {
    artifact_name: string;
    artifact_type: "XLSX"|"CSV"|"DOCX"|"PDF";
    source: "UserUploaded"|"AgentGenerated"|"SyntheticSample";
    intake_behavior: "UP"|"SI"|"Generated";
    version: number;
    phase_id: number;
    gate_id: number;
    input_version_refs: string[];
    generated_by: string;
    storage_uri: string;
    row_count?: number;
    page_count?: number;
    file_size_bytes: number;
  };
}

// ─── Context ─────────────────────────────────────────────────────────────────

// POST /api/system/initialize-index
interface InitIndexResponse {
  status: "initialized";
  document_count: number;
  indexed_at: string;
}

// GET /api/system/index-status
interface IndexStatusResponse {
  initialized: boolean;
  indexed_at: string | null;
  document_ids: string[];
}

// POST /api/context/assemble
interface AssembleContextRequest {
  phase_id: number;
  focus: string;              // e.g., "DFM and clearance check"
}
interface AssembleContextResponse {
  phase_id: number;
  context_package: {
    active_inputs_summary: Record<string, unknown>;
    upstream_summaries: CompactPhaseSummary[];
    open_actions: Action[];
    selected_checklist_items: Array<{ item_id: string; description: string; evidence_required: string }>;
    selected_standard_passages: Array<{ document: string; clause: string; text: string }>;
    output_schema: Record<string, unknown>;
  };
  token_count: number;
}

// ─── Views ───────────────────────────────────────────────────────────────────

// GET /api/views/breadcrumbs
interface BreadcrumbsResponse {
  breadcrumbs: Array<{
    phase_id: number;
    phase_name: string;
    technical_review: string | null;
    gate_number: number;
    state: "Completed"|"Current"|"Awaiting Human Decision"|
           "Conditional Pass"|"Blocked"|"Upcoming"|"Closed";
    gate_outcome: "Pass"|"Conditional Pass"|"Fail" | null;
  }>;
}

// GET /api/views/phase/{phase_id}/checklist
// Returns 404 NO_CHECKLIST_MAPPED for Phase 2 and Phases 5–9
interface ChecklistResponse {
  phase_id: number;
  technical_review: string;
  checklist_source: string;
  items: Array<{
    item_id: string;
    description: string;
    evidence_required: string;
    evidence_status: "Complete"|"Partial"|"NotStarted";
    linked_artifact_id: string | null;
    action_required: string | null;
    reviewer_notes: string | null;
  }>;
  summary: {
    complete: number;
    partial: number;
    not_started: number;
  };
}
```

### 4.3 Complete API Endpoint Index

#### Orchestrator

| Method | Path | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/orchestrator/phase/{id}/start` | Start phase execution | X-Reviewer-Role |
| `POST` | `/api/orchestrator/phase/{id}/pause` | Pause running phase | X-Reviewer-Role |
| `POST` | `/api/orchestrator/phase/{id}/resume` | Resume paused phase (idempotent) | X-Reviewer-Role |
| `POST` | `/api/orchestrator/phase/{id}/retry` | Retry failed phase after correction | X-Reviewer-Role |
| `POST` | `/api/orchestrator/phase/{id}/cancel` | Cancel phase (irreversible) | X-Reviewer-Role |
| `POST` | `/api/orchestrator/run-to-gate` | Run phases to specified gate | X-Reviewer-Role |
| `POST` | `/api/orchestrator/targeted-rerun` | Rerun affected items after input revision | X-Reviewer-Role |
| `GET` | `/api/orchestrator/state` | Get orchestrator + phase state summary | — |

#### Artifact Count

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/phases/{id}/config` | Get phase configuration (intake behaviors, counts) |
| `GET` | `/api/phases/{id}/artifact-count` | Get current artifact count status |
| `POST` | `/api/phases/{id}/validate-counts` | Validate artifact count compliance |

#### Intake

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/phases/{id}/inputs` | Get input readiness status for both inputs |
| `POST` | `/api/phases/{id}/inputs/external/upload` | Upload user-provided external input (UP) |
| `POST` | `/api/phases/{id}/inputs/internal/upload` | Upload user-provided internal input (UP) |
| `POST` | `/api/phases/{id}/inputs/external/ingest` | Ingest synthetic external sample (SI) |
| `POST` | `/api/phases/{id}/inputs/internal/ingest` | Ingest synthetic internal sample (SI) |
| `POST` | `/api/phases/{id}/inputs/external/upload-revised` | Upload revised external input (UP) |
| `POST` | `/api/phases/{id}/inputs/internal/upload-revised` | Upload revised internal input (UP) |
| `POST` | `/api/phases/{id}/inputs/external/ingest-revised` | Ingest revised synthetic external sample (SI) |
| `POST` | `/api/phases/{id}/inputs/internal/ingest-revised` | Ingest revised synthetic internal sample (SI) |
| `GET` | `/api/phases/{id}/execution-status` | Get Phase Execution Status |

#### Versioning

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/phases/{id}/inputs/{type}/versions` | List all versions for a logical input |
| `GET` | `/api/phases/{id}/inputs/{type}/versions/{vid}` | Get a specific version record |
| `GET` | `/api/phases/{id}/inputs/{type}/affected-scope` | Compute affected scope |
| `GET` | `/api/project/dependency-graph` | Get full dependency graph |

#### ProjectState

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/project/state` | Get full ProjectState |
| `GET` | `/api/project/state/phases/{id}` | Get per-phase state |
| `GET` | `/api/project/state/findings` | Get all findings (filterable) |
| `GET` | `/api/project/state/actions` | Get all actions (filterable) |
| `GET` | `/api/project/state/gate-decisions` | Get all gate decisions |
| `GET` | `/api/project/state/audit-history` | Get full audit history (filterable) |
| `GET` | `/api/project/state/compact-summaries` | Get all compact phase summaries |

#### Checks

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/checks/phase/{id}/run` | Run all mandatory checks for a phase |
| `POST` | `/api/checks/{check_type}/run` | Run a specific check type |
| `GET` | `/api/checks/phase/{id}/results` | Get all check results for a phase |
| `GET` | `/api/checks/{check_id}` | Get a specific check result |
| `POST` | `/api/checks/{check_id}/invalidate` | Mark check result as invalidated |

#### Findings & Actions

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/findings` | Get all findings (filterable) |
| `GET` | `/api/findings/{id}` | Get a specific finding |
| `POST` | `/api/findings/{id}/close` | Close a finding (human action) |
| `GET` | `/api/actions` | Get all actions (filterable) |
| `GET` | `/api/actions/{id}` | Get a specific action |
| `POST` | `/api/actions/{id}/approve` | Approve corrective action (human) |
| `POST` | `/api/actions/{id}/close` | Close action with closure evidence |

#### Gates

| Method | Path | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/gates/{id}/review` | Get full gate review data (no gate-pack artifact) | — |
| `POST` | `/api/gates/{id}/decide` | Record human gate decision | X-Reviewer-Role (AI rejected) |
| `GET` | `/api/gates/{id}/decisions` | Get all decisions for this gate | — |
| `GET` | `/api/gates/decisions` | Get all gate decisions | — |

#### Artifacts

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/artifacts/validate` | Validate artifact vs compact standards |
| `POST` | `/api/artifacts/register` | Register validated artifact |
| `GET` | `/api/artifacts/{id}` | Get artifact with provenance |
| `GET` | `/api/artifacts/{id}/versions` | Get all versions of artifact |
| `GET` | `/api/artifacts/{id}/viewer` | Get artifact viewer data (AV-05) |

#### System / Context

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/system/initialize-index` | Build and cache reference document index |
| `GET` | `/api/system/index-status` | Check reference index status |
| `POST` | `/api/context/assemble` | Assemble context package for phase agent |
| `GET` | `/api/context/phase/{id}/summaries` | Get compact summaries for prior phases |

#### Views

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/views/project-overview` | AV-01 data |
| `GET` | `/api/views/lifecycle` | AV-02 data |
| `GET` | `/api/views/phase/{id}/workspace` | AV-03 data |
| `GET` | `/api/views/phase/{id}/intake` | AV-04 data |
| `GET` | `/api/views/phase/{id}/checklist` | AV-06 data (404 for Phase 2, 5–9) |
| `GET` | `/api/views/findings-actions` | AV-07 data |
| `GET` | `/api/views/gate/{id}/review` | AV-08 data (alias for /api/gates/{id}/review) |
| `GET` | `/api/views/audit` | AV-09 data |
| `GET` | `/api/views/breadcrumbs` | Breadcrumb states for all 10 phases |

#### SSE

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/sse/phase/{id}` | Subscribe to phase execution SSE stream |

---

*TechArch-TTCopilot-v1.0 | §03-API | Synthetic POC Data Only*
