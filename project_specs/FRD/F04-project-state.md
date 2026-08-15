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
