## 3. Data Model

### 3.1 Entity-Relationship Diagram (ASCII)

```
project_state (1)
    │
    ├──────────────────────────────────────────────────────┐
    │                                                      │
    │ 1:10                                                 │
    ▼                                                      │
phase_states (10 rows — one per phase 0–9)               │
    │                                                      │
    │ 1:2 (via phase_inputs.input_role)                    │
    ▼                                                      │
phase_inputs (external + internal per phase)              │
    │                                                      │
    │ 1:N                                                  │
    ▼                                                      │
input_versions  ──────────────────────────────────────────┤
    │                                                      │
    │ N:1 (artifact_id → artifact_registry)                │
    ▼                                                      │
artifact_registry ◄───────────────────────────────────────┤
    ▲                                                      │
    │ N:1 (phase_outputs.artifact_id)                      │
    │                                                      │
phase_outputs (max 2 per phase; project_id + phase_id)    │
                                                          │
project_state ────────────────────────────────────────────┘
    │
    ├──► check_results  (1:N; phase_id FK; superseded_by self-ref)
    │
    ├──► findings       (1:N; check_id → check_results; closed_at nullable)
    │        │
    │        └──► actions  (1:N; source_finding_id → findings)
    │                  │
    │                  └── closure_evidence_artifact_id → artifact_registry
    │
    ├──► gate_decisions (1:10; gate_number; supersedes self-ref)
    │
    └──► audit_history  (1:N; append-only; no FK constraints enforced for immutability)
```

### 3.2 TypeScript Interfaces (Canonical Schema Contract)

The ProjectState JSON document is the canonical schema. TypeScript interfaces define the shape; PostgreSQL DDL (§3.3) provides the relational mapping.

```typescript
// ─── Top-level ProjectState ──────────────────────────────────────────────────
interface ProjectState {
  state_id: string;                    // UUID
  state_version: number;               // Monotonically increasing; optimistic concurrency
  project_id: "EVINV-POC-001";
  product_name: string;
  project_type: "NPI A";
  project_category: "Category 1";
  current_phase: 0|1|2|3|4|5|6|7|8|9;
  current_gate: 0|1|2|3|4|5|6|7|8|9;
  current_technical_review: string | null;
  project_status: "Active"|"Blocked"|"Cancelled"|"Closed";
  synthetic_data_indicator: true;      // Always true; write of false rejected
  created_at: string;                  // ISO 8601
  updated_at: string;                  // ISO 8601

  phases: PhaseState[];                // Length = 10 (indices 0–9)
  artifactRegistry: ArtifactRecord[];
  dependencyGraph: DependencyGraph;
  checkResults: CheckResult[];
  findings: Finding[];
  actions: Action[];
  gateDecisions: GateDecision[];
  auditHistory: AuditEvent[];          // Append-only; no update/delete
}

// ─── Phase Configuration (server-side; immutable at runtime) ─────────────────
interface PhaseConfig {
  phase_id: 0|1|2|3|4|5|6|7|8|9;
  phase_name: string;
  technical_review: string | null;
  external_input: InputConfig;
  internal_input: InputConfig;
  output_specs: OutputSpec[];          // Length 1–2
}

interface InputConfig {
  logical_name: string;
  intake_behavior: "UP" | "SI";
  system_represented: string | null;
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

// ─── Phase State ─────────────────────────────────────────────────────────────
interface PhaseState {
  phase_id: 0|1|2|3|4|5|6|7|8|9;
  phase_name: string;
  technical_review: string | null;
  phase_state: "Pending"|"AwaitingInputs"|"Running"|"AwaitingGate"|
               "GatePassed"|"GateConditional"|"GateFailed"|"Cancelled"|"Paused";
  gate_state: "Locked"|"Open"|"Decided";
  external_input: PhaseInputState;     // Exactly 1; schema enforced
  internal_input: PhaseInputState;     // Exactly 1; schema enforced
  outputs: PhaseOutput[];              // Max 2; schema enforced
  ai_recommendation: AIRecommendation | null;
  compact_phase_summary: CompactPhaseSummary | null;
  execution_started_at: string | null;
  execution_completed_at: string | null;
}

// ─── Input State ─────────────────────────────────────────────────────────────
interface PhaseInputState {
  logical_name: string;
  intake_behavior: "UP"|"SI";
  system_represented: string | null;
  accepted_formats: string[];
  size_guidance: string;
  versions: InputVersion[];            // Exactly one has active=true
  readiness_status: "AwaitingUserInput"|"ValidationInProgress"|"UserInputReady"|
                    "WaitingForSampleIngestion"|"Ingesting"|"SyntheticSystemInputReady";
  validation_issues: ValidationIssue[];
  required_user_action: string | null;
}

interface InputVersion {
  version_id: string;                  // UUID
  version_number: number;              // 1, 2, 3, …
  artifact_id: string;                 // Ref to ArtifactRecord
  intake_behavior: "UP"|"SI";
  active: boolean;                     // Exactly one true per PhaseInputState
  validation_result: ValidationResult;
  intake_timestamp: string;            // ISO 8601
  invalidated_by: string | null;       // version_id that superseded this
  rerun_triggered: boolean;
  affected_scope: string[];            // check/finding/output IDs
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

// ─── Artifact Registry ───────────────────────────────────────────────────────
interface ArtifactRecord {
  artifact_id: string;                 // UUID
  artifact_name: string;
  artifact_type: "XLSX"|"CSV"|"DOCX"|"PDF";
  source: "UserUploaded"|"AgentGenerated"|"SyntheticSample";
  intake_behavior: "UP"|"SI"|"Generated";
  version: number;
  phase_id: 0|1|2|3|4|5|6|7|8|9;
  gate_id: 0|1|2|3|4|5|6|7|8|9;
  input_version_refs: string[];
  timestamp: string;                   // ISO 8601
  generated_by: string;                // "agent:{id}" | "user_upload" | "system_sample"
  disclaimer_present: true;            // Always true; write rejected if false
  storage_uri: string;
  row_count: number | null;
  page_count: number | null;
  file_size_bytes: number;
}

interface PhaseOutput {
  output_id: string;                   // UUID
  output_name: string;
  artifact_type: "XLSX"|"CSV"|"DOCX"|"PDF";
  size_guidance: string;
  artifact_id: string | null;
  version_ref: string;
  approval_status: "Pending"|"AwaitingReview"|"Approved"|"Rejected"|"ReviewRequired";
  review_required: boolean;
  approved_by: string | null;
  approved_at: string | null;          // ISO 8601
}

// ─── Dependency Graph ────────────────────────────────────────────────────────
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

// ─── Check Results ───────────────────────────────────────────────────────────
interface CheckResult {
  check_id: string;                    // UUID
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
  source_reference: string;
  limitation: string;
  items_checked: CheckItem[];
  invalidated: boolean;
  superseded_by: string | null;
  run_at: string;                      // ISO 8601
}

interface CheckItem {
  item_id: string;
  [key: string]: unknown;              // Per-check-type fields; see F05 for detail
}

// ─── Findings ────────────────────────────────────────────────────────────────
interface Finding {
  finding_id: string;                  // e.g., "F4-001"
  source_phase: 0|1|2|3|4|5|6|7|8|9;
  source_gate: 0|1|2|3|4|5|6|7|8|9;
  detected_by: "DeterministicCheck"|"AgentAnalysis"|"HumanReview";
  check_id: string | null;
  description: string;
  severity: "Critical"|"Major"|"Minor"|"Observation";
  status: "Open"|"ActionPending"|"ActionApproved"|"Closed"|"VerifiedClosed";
  seeded: boolean;
  created_at: string;                  // ISO 8601
  closed_at: string | null;
}

// ─── Actions ─────────────────────────────────────────────────────────────────
interface Action {
  action_id: string;                   // e.g., "A3-001"
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
  created_at: string;                  // ISO 8601
  closed_at: string | null;
}

// ─── Gate Decisions ──────────────────────────────────────────────────────────
interface GateDecision {
  decision_id: string;                 // UUID
  gate_number: 0|1|2|3|4|5|6|7|8|9;
  phase_name: string;
  ai_recommendation: AIRecommendation;
  human_disposition: string;
  reviewer_role: string;
  decision: "Pass"|"Conditional Pass"|"Fail";
  comments: string | null;
  timestamp: string;                   // ISO 8601
  artifact_versions_reviewed: VersionRef[];
  open_conditions: Action[];
  is_final: true;                      // Always true; immutable once written
  supersedes: string | null;
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

// ─── Compact Phase Summary ───────────────────────────────────────────────────
interface CompactPhaseSummary {
  phase_id: 0|1|2|3|4|5|6|7|8|9;
  summary_version: number;
  gate_outcome: "Pass"|"Conditional Pass";
  key_decisions: string[];             // ≤ 3 items; ≤ 50 tokens each
  key_outputs: OutputRef[];            // ≤ 2 items
  open_actions: string[];              // Action IDs only
  findings_summary: string;            // ≤ 100 tokens
  token_estimate: number;
  generated_at: string;
}

interface OutputRef {
  output_name: string;
  artifact_id: string;
}

// ─── Audit History ───────────────────────────────────────────────────────────
interface AuditEvent {                 // Append-only; no update or delete permitted
  audit_id: string;                   // UUID
  event_type: "IntakeEvent"|"GateDecision"|"FindingRaised"|"ActionCreated"|
              "ActionClosed"|"PhaseStateChange"|"CheckRun"|"VersionCreated"|
              "OutputApproved"|"Cancellation"|"SystemInitialization";
  phase_id: number | null;
  description: string;
  actor: string;
  related_ids: string[];
  payload: Record<string, unknown>;
  timestamp: string;                   // ISO 8601
}
```

### 3.3 Relational DDL (PostgreSQL — Canonical Source)

```sql
-- ============================================================
-- TT Engineering Copilot POC — PostgreSQL DDL
-- Project: EVINV-POC-001
-- Synthetic POC Data Only
-- ============================================================

-- Core project identity (one row per project in POC)
CREATE TABLE project_state (
  state_id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  state_version     INTEGER     NOT NULL DEFAULT 1,
  project_id        TEXT        NOT NULL DEFAULT 'EVINV-POC-001'
                                UNIQUE,
  product_name      TEXT        NOT NULL,
  project_type      TEXT        NOT NULL DEFAULT 'NPI A',
  project_category  TEXT        NOT NULL DEFAULT 'Category 1',
  current_phase     SMALLINT    NOT NULL CHECK (current_phase BETWEEN 0 AND 9),
  current_gate      SMALLINT    NOT NULL CHECK (current_gate BETWEEN 0 AND 9),
  current_technical_review TEXT,
  project_status    TEXT        NOT NULL
                                CHECK (project_status IN
                                  ('Active','Blocked','Cancelled','Closed')),
  synthetic_data_indicator BOOLEAN NOT NULL DEFAULT TRUE
                                CHECK (synthetic_data_indicator = TRUE),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_project_state_project_id ON project_state(project_id);

-- ─── Per-phase state ─────────────────────────────────────────────────────────
CREATE TABLE phase_states (
  phase_state_id      UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          TEXT      NOT NULL
                                REFERENCES project_state(project_id),
  phase_id            SMALLINT  NOT NULL CHECK (phase_id BETWEEN 0 AND 9),
  phase_state         TEXT      NOT NULL
                                CHECK (phase_state IN (
                                  'Pending','AwaitingInputs','Running',
                                  'AwaitingGate','GatePassed','GateConditional',
                                  'GateFailed','Cancelled','Paused')),
  gate_state          TEXT      NOT NULL
                                CHECK (gate_state IN ('Locked','Open','Decided')),
  ai_recommendation   JSONB,
  compact_phase_summary JSONB,
  execution_started_at  TIMESTAMPTZ,
  execution_completed_at TIMESTAMPTZ,
  UNIQUE(project_id, phase_id)
);

CREATE INDEX idx_phase_states_project ON phase_states(project_id);
CREATE INDEX idx_phase_states_phase ON phase_states(phase_id);

-- ─── Logical inputs (one external + one internal per phase) ──────────────────
CREATE TABLE phase_inputs (
  input_id          UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        TEXT      NOT NULL
                              REFERENCES project_state(project_id),
  phase_id          SMALLINT  NOT NULL CHECK (phase_id BETWEEN 0 AND 9),
  input_role        TEXT      NOT NULL
                              CHECK (input_role IN ('external','internal')),
  logical_name      TEXT      NOT NULL,
  intake_behavior   TEXT      NOT NULL
                              CHECK (intake_behavior IN ('UP','SI')),
  system_represented TEXT,
  readiness_status  TEXT      NOT NULL,
  validation_issues JSONB     NOT NULL DEFAULT '[]',
  UNIQUE(project_id, phase_id, input_role)
);

CREATE INDEX idx_phase_inputs_project_phase ON phase_inputs(project_id, phase_id);

-- ─── Input versions (one active version per logical input at all times) ──────
CREATE TABLE input_versions (
  version_id        UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  input_id          UUID      NOT NULL REFERENCES phase_inputs(input_id),
  version_number    INTEGER   NOT NULL,
  artifact_id       UUID,               -- Ref to artifact_registry
  intake_behavior   TEXT      NOT NULL,
  active            BOOLEAN   NOT NULL DEFAULT FALSE,
  validation_result JSONB     NOT NULL,
  intake_timestamp  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  invalidated_by    UUID,               -- version_id that superseded this
  rerun_triggered   BOOLEAN   NOT NULL DEFAULT FALSE,
  affected_scope    TEXT[]    NOT NULL DEFAULT '{}',
  UNIQUE(input_id, version_number)
);

-- Critical: enforces single active version per logical input at DB level
CREATE UNIQUE INDEX idx_input_versions_single_active
  ON input_versions(input_id)
  WHERE active = TRUE;

CREATE INDEX idx_input_versions_input ON input_versions(input_id);
CREATE INDEX idx_input_versions_active ON input_versions(input_id, active);

-- ─── Artifact registry ───────────────────────────────────────────────────────
CREATE TABLE artifact_registry (
  artifact_id       UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_name     TEXT      NOT NULL,
  artifact_type     TEXT      NOT NULL
                              CHECK (artifact_type IN ('XLSX','CSV','DOCX','PDF')),
  source            TEXT      NOT NULL
                              CHECK (source IN
                                ('UserUploaded','AgentGenerated','SyntheticSample')),
  intake_behavior   TEXT      NOT NULL,
  version           INTEGER   NOT NULL,
  phase_id          SMALLINT  NOT NULL CHECK (phase_id BETWEEN 0 AND 9),
  gate_id           SMALLINT  NOT NULL CHECK (gate_id BETWEEN 0 AND 9),
  input_version_refs TEXT[]   NOT NULL DEFAULT '{}',
  timestamp         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  generated_by      TEXT      NOT NULL,
  disclaimer_present BOOLEAN  NOT NULL DEFAULT TRUE
                              CHECK (disclaimer_present = TRUE),
  storage_uri       TEXT      NOT NULL,
  row_count         INTEGER,            -- XLSX/CSV only; null for DOCX/PDF
  page_count        INTEGER,            -- DOCX/PDF only; null for XLSX/CSV
  file_size_bytes   BIGINT    NOT NULL
);

CREATE INDEX idx_artifact_registry_phase ON artifact_registry(phase_id);
CREATE INDEX idx_artifact_registry_type ON artifact_registry(artifact_type);

-- ─── Phase outputs (max 2 per phase; enforced at application layer) ──────────
CREATE TABLE phase_outputs (
  output_id         UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        TEXT      NOT NULL
                              REFERENCES project_state(project_id),
  phase_id          SMALLINT  NOT NULL CHECK (phase_id BETWEEN 0 AND 9),
  output_name       TEXT      NOT NULL,
  artifact_type     TEXT      NOT NULL,
  size_guidance     TEXT      NOT NULL,
  artifact_id       UUID      REFERENCES artifact_registry(artifact_id),
  version_ref       TEXT      NOT NULL,
  approval_status   TEXT      NOT NULL
                              CHECK (approval_status IN (
                                'Pending','AwaitingReview','Approved',
                                'Rejected','ReviewRequired')),
  review_required   BOOLEAN   NOT NULL DEFAULT FALSE,
  approved_by       TEXT,
  approved_at       TIMESTAMPTZ
);

CREATE INDEX idx_phase_outputs_project_phase ON phase_outputs(project_id, phase_id);

-- ─── Deterministic check results ─────────────────────────────────────────────
CREATE TABLE check_results (
  check_id          UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  check_type        TEXT      NOT NULL
                              CHECK (check_type IN (
                                'CrossArtifactConsistency','HVClearance',
                                'ComponentDerating','TestPointCoverage','Cpk',
                                'CostCalc','TraceabilityCompleteness',
                                'RequirementTestability','ActionClosure',
                                'InventoryReconciliation')),
  phase_id          SMALLINT  NOT NULL CHECK (phase_id BETWEEN 0 AND 9),
  input_version_ids TEXT[]    NOT NULL,
  formula_or_method TEXT      NOT NULL,
  threshold         TEXT      NOT NULL,
  threshold_unit    TEXT      NOT NULL,
  result_value      TEXT      NOT NULL,
  result_unit       TEXT      NOT NULL,
  status            TEXT      NOT NULL
                              CHECK (status IN ('Pass','Fail','Warning')),
  source_reference  TEXT      NOT NULL,
  limitation        TEXT      NOT NULL,
  items_checked     JSONB     NOT NULL DEFAULT '[]',
  invalidated       BOOLEAN   NOT NULL DEFAULT FALSE,
  superseded_by     UUID,               -- check_id of rerun result (self-ref)
  run_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_check_results_phase ON check_results(phase_id);
CREATE INDEX idx_check_results_type ON check_results(check_type);
CREATE INDEX idx_check_results_status ON check_results(status);
CREATE INDEX idx_check_results_invalidated ON check_results(invalidated);

-- ─── Findings ────────────────────────────────────────────────────────────────
CREATE TABLE findings (
  finding_id        TEXT      PRIMARY KEY,  -- e.g., 'F4-001'
  source_phase      SMALLINT  NOT NULL CHECK (source_phase BETWEEN 0 AND 9),
  source_gate       SMALLINT  NOT NULL CHECK (source_gate BETWEEN 0 AND 9),
  detected_by       TEXT      NOT NULL
                              CHECK (detected_by IN (
                                'DeterministicCheck','AgentAnalysis','HumanReview')),
  check_id          UUID      REFERENCES check_results(check_id),
  description       TEXT      NOT NULL,
  severity          TEXT      NOT NULL
                              CHECK (severity IN
                                ('Critical','Major','Minor','Observation')),
  status            TEXT      NOT NULL
                              CHECK (status IN (
                                'Open','ActionPending','ActionApproved',
                                'Closed','VerifiedClosed')),
  seeded            BOOLEAN   NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at         TIMESTAMPTZ
);

CREATE INDEX idx_findings_phase ON findings(source_phase);
CREATE INDEX idx_findings_severity ON findings(severity);
CREATE INDEX idx_findings_status ON findings(status);
CREATE INDEX idx_findings_seeded ON findings(seeded);

-- ─── Actions ─────────────────────────────────────────────────────────────────
CREATE TABLE actions (
  action_id         TEXT      PRIMARY KEY,  -- e.g., 'A3-001'
  source_finding_id TEXT      NOT NULL REFERENCES findings(finding_id),
  source_phase      SMALLINT  NOT NULL CHECK (source_phase BETWEEN 0 AND 9),
  source_gate       SMALLINT  NOT NULL CHECK (source_gate BETWEEN 0 AND 9),
  description       TEXT      NOT NULL,
  owner_role        TEXT      NOT NULL,
  blocking          BOOLEAN   NOT NULL DEFAULT FALSE,
  parallel          BOOLEAN   NOT NULL DEFAULT FALSE,
  due_phase         SMALLINT  NOT NULL CHECK (due_phase BETWEEN 0 AND 9),
  due_gate          SMALLINT  NOT NULL CHECK (due_gate BETWEEN 0 AND 9),
  required_closure_evidence TEXT NOT NULL,
  status            TEXT      NOT NULL
                              CHECK (status IN (
                                'Open','InProgress','ClosedPendingVerification',
                                'VerifiedClosed','Waived')),
  human_approver    TEXT,
  closure_evidence_artifact_id UUID REFERENCES artifact_registry(artifact_id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at         TIMESTAMPTZ
);

CREATE INDEX idx_actions_source_finding ON actions(source_finding_id);
CREATE INDEX idx_actions_blocking ON actions(blocking);
CREATE INDEX idx_actions_status ON actions(status);
CREATE INDEX idx_actions_due_gate ON actions(due_gate);

-- ─── Gate decisions (immutable after insert) ─────────────────────────────────
CREATE TABLE gate_decisions (
  decision_id       UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  gate_number       SMALLINT  NOT NULL CHECK (gate_number BETWEEN 0 AND 9),
  phase_name        TEXT      NOT NULL,
  ai_recommendation JSONB     NOT NULL,
  human_disposition TEXT      NOT NULL DEFAULT '',
  reviewer_role     TEXT      NOT NULL,
  decision          TEXT      NOT NULL
                              CHECK (decision IN
                                ('Pass','Conditional Pass','Fail')),
  comments          TEXT,
  timestamp         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  artifact_versions_reviewed JSONB NOT NULL DEFAULT '[]',
  open_conditions   JSONB     NOT NULL DEFAULT '[]',
  is_final          BOOLEAN   NOT NULL DEFAULT TRUE,
  supersedes        UUID      REFERENCES gate_decisions(decision_id)
);

CREATE INDEX idx_gate_decisions_gate ON gate_decisions(gate_number);
CREATE INDEX idx_gate_decisions_decision ON gate_decisions(decision);

-- ─── Audit history (append-only; no update/delete) ───────────────────────────
CREATE TABLE audit_history (
  audit_id          UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type        TEXT      NOT NULL
                              CHECK (event_type IN (
                                'IntakeEvent','GateDecision','FindingRaised',
                                'ActionCreated','ActionClosed','PhaseStateChange',
                                'CheckRun','VersionCreated','OutputApproved',
                                'Cancellation','SystemInitialization')),
  phase_id          SMALLINT  CHECK (phase_id BETWEEN 0 AND 9),
  description       TEXT      NOT NULL,
  actor             TEXT      NOT NULL,
  related_ids       TEXT[]    NOT NULL DEFAULT '{}',
  payload           JSONB     NOT NULL DEFAULT '{}',
  timestamp         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_history_event_type ON audit_history(event_type);
CREATE INDEX idx_audit_history_phase ON audit_history(phase_id);
CREATE INDEX idx_audit_history_timestamp ON audit_history(timestamp DESC);

-- Revoke UPDATE and DELETE on audit_history at DB level:
-- REVOKE UPDATE, DELETE ON audit_history FROM application_role;
```

### 3.4 Phase Configuration Table (Immutable — server-side constant)

| phase_id | Phase Name | Technical Review | External Intake | Internal Intake | Output Count |
|---|---|---|---|---|---|
| 0 | Commercial Assessment | Kickoff | UP | SI (Salesforce, Cora, capability library, historical projects, site capacity) | 2 |
| 1 | Business Case | SLR | UP | SI (Cora, historical proposals, parametric cost model, labor/rate source) | 2 |
| 2 | Requirements Definition | None | UP | SI (requirements repository, interface-control repository, Cora) | 2 |
| 3 | Preliminary Design | Schematic/PDR | SI (standards library, manufacturing-capability repository) | UP | 2 |
| 4 | Detailed Design | PCB Layout/CDR | SI (standards library, supplier feed, obsolescence source) | UP | 2 |
| 5 | Verification & Validation | None | SI (standards library, customer acceptance repository) | UP | 2 |
| 6 | Manufacturing Readiness | None | UP | SI (MES, quality system, equipment records, Cora) | 2 |
| 7 | Transfer & Lessons Learned | None | UP | SI (Cora, MES, CAPA/quality, gate records) | 2 |
| 8 | Production & Sustaining | None | SI (supplier feeds, distributor feeds, obsolescence databases) | SI (ERP, MES, PLM, Change Review Board records) | 2 |
| 9 | End of Life | None | UP | SI (ERP, tooling/fixture register, project archive, Cora) | 2 |

---

*TechArch-TTCopilot-v1.0 | §02-DataModel | Synthetic POC Data Only*
