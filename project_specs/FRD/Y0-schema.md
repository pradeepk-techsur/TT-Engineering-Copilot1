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
