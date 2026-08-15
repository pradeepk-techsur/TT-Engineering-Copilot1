# Technical Architecture Document
## TT Manufacturing and Engineering Copilot

**Document ID:** TechArch-TTCopilot-v1.0
**Project:** EVINV-POC-001
**Product:** EV-INV-800 Demonstration Traction Inverter
**Status:** Active
**Date:** 2026-08-15
**Classification:** Internal POC — Synthetic Data Only
**Built from:** PRD-TTCopilot-v1.0, FRD-TTCopilot-v1.0, PROJECT.md

> **Synthetic POC Data. Not TT Electronics Product Data. Not for Design, Fabrication, Certification, Procurement, or Production.**

---

## 1. Architectural Overview

### 1.1 Pattern

The TT Engineering Copilot POC follows a **layered server-rendered web application** pattern with a clear separation between:

- **Presentation layer** — Next.js React frontend (Web Gate Cockpit, 9 views)
- **API layer** — Next.js API routes (or Express.js) serving a REST API
- **Orchestration layer** — Gated state-machine orchestrator running server-side TypeScript
- **Tool layer** — Deterministic engineering checks running as pure TypeScript functions (zero LLM involvement)
- **Agent layer** — LLM calls via Anthropic Claude API, hardened wrapper (retries, truncation continuation, cancellation)
- **State layer** — PostgreSQL for durable ProjectState persistence; Redis for reference-doc content cache and per-run context cache
- **Storage layer** — Local file system (dev) or S3-compatible object store (prod) for uploaded artifacts and synthetic sample files

The overarching architectural constraint is the **human-gate primitive**: no phase may advance, no gate may be decided, and no corrective action may close without an explicit human HTTP action from the Web Gate Cockpit. This is enforced at the API layer, the orchestrator, and the database schema — not merely by UI convention.

### 1.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BROWSER (Web Gate Cockpit)                          │
│                                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │  AV-01   │ │  AV-02   │ │  AV-03   │ │  AV-04   │ │  AV-05   │  ...    │
│  │ Overview │ │Lifecycle │ │  Phase   │ │  Intake  │ │ Artifact │         │
│  │          │ │   View   │ │Workspace │ │  Panel   │ │  Viewer  │         │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘         │
│       │             │            │             │            │               │
│  ┌────┴─────────────┴────────────┴─────────────┴────────────┴─────────┐     │
│  │              SSE Stream  +  REST Fetch (Next.js Router)             │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │ HTTPS
┌───────────────────────────────────▼─────────────────────────────────────────┐
│                          NEXT.JS API LAYER  (/api/*)                        │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                   Request Router + Auth Header Check                │   │
│  │          (X-Reviewer-Role enforcement; AI actor rejection)          │   │
│  └───────────┬───────────┬────────────┬──────────────────┬────────────┘   │
│              │           │            │                  │                 │
│  ┌───────────▼──┐ ┌──────▼───┐ ┌─────▼──────┐ ┌────────▼────────┐        │
│  │ Orchestrator │ │  Intake  │ │  Artifact  │ │  Views / Gates  │        │
│  │  Controller  │ │ Handler  │ │  Handler   │ │    Handler      │        │
│  └───────────┬──┘ └──────┬───┘ └─────┬──────┘ └────────┬────────┘        │
│              │           │            │                  │                 │
│  ┌───────────▼───────────▼────────────▼──────────────────▼────────────┐   │
│  │                      SERVICE LAYER (TypeScript)                     │   │
│  │                                                                     │   │
│  │  ┌────────────────────┐   ┌──────────────────────────────────────┐  │   │
│  │  │  State Machine /   │   │    Deterministic Tool Layer          │  │   │
│  │  │  Orchestrator      │   │    (NO LLM)                          │  │   │
│  │  │                    │   │  - CrossArtifactConsistency()        │  │   │
│  │  │  phase transitions │   │  - HVClearanceCheck()                │  │   │
│  │  │  dependency graph  │   │  - ComponentDeratingCheck()          │  │   │
│  │  │  targeted rerun    │   │  - TestPointCoverageCheck()          │  │   │
│  │  │  gate enforcement  │   │  - CpkCalculation()                  │  │   │
│  │  │  pause/resume/     │   │  - TraceabilityCompleteness()        │  │   │
│  │  │  retry/cancel      │   │  - RequirementTestability()          │  │   │
│  │  └────────────────────┘   │  - ActionClosureVerification()       │  │   │
│  │                           │  - CostCalculation()                 │  │   │
│  │  ┌────────────────────┐   └──────────────────────────────────────┘  │   │
│  │  │  LLM Agent Layer   │                                             │  │   │
│  │  │  (Anthropic Claude)│   ┌──────────────────────────────────────┐  │   │
│  │  │                    │   │  Context Assembly Service            │  │   │
│  │  │  Phase 0–9 agents  │   │  - Reference index query (Redis)     │  │   │
│  │  │  Hardened wrapper  │   │  - Compact phase summaries           │  │   │
│  │  │  - retries         │   │  - Token budget enforcement          │  │   │
│  │  │  - continuation    │   │  - Prompt construction               │  │   │
│  │  │  - cancellation    │   └──────────────────────────────────────┘  │   │
│  │  │  - SSE streaming   │                                             │   │
│  │  └────────────────────┘                                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────┬───────────────────────┘
                           │                          │
           ┌───────────────▼──────┐    ┌──────────────▼──────────┐
           │     PostgreSQL       │    │   Redis Cache           │
           │                      │    │                         │
           │  project_state       │    │  Reference index        │
           │  phase_states        │    │  (EVINV-POC-STD-001,    │
           │  phase_inputs        │    │   checklists, rules)    │
           │  input_versions      │    │                         │
           │  artifact_registry   │    │  Per-run context cache  │
           │  phase_outputs       │    │  SSE run state          │
           │  check_results       │    └─────────────────────────┘
           │  findings            │
           │  actions             │    ┌─────────────────────────┐
           │  gate_decisions      │    │  File Storage           │
           │  audit_history       │    │  (Local / S3-compat.)   │
           └──────────────────────┘    │                         │
                                       │  Uploaded artifacts     │
                                       │  Synthetic samples      │
                                       │  Generated outputs      │
                                       └─────────────────────────┘
```

### 1.3 Deployment Topology

**POC deployment:** Single-server Node.js process with all layers co-located.

```
┌───────────────────────────────────────────────────────┐
│   POC Server (Node.js / Next.js)                      │
│                                                       │
│   Port 3000 — Next.js (frontend + API routes)        │
│   PostgreSQL — localhost:5432 (or managed instance)  │
│   Redis — localhost:6379 (or managed instance)       │
│   File storage — /var/tt-copilot/artifacts/          │
│                                                       │
│   Environment vars:                                   │
│     ANTHROPIC_API_KEY=sk-ant-...                      │
│     DATABASE_URL=postgresql://...                     │
│     REDIS_URL=redis://localhost:6379                  │
│     STORAGE_PATH=/var/tt-copilot/artifacts            │
│     POC_CONTEXT_TOKEN_BUDGET=8000                     │
└───────────────────────────────────────────────────────┘
```

**No external enterprise system connections in POC v1.** All 23 simulated connectors are preloaded synthetic sample files served from local storage.

### 1.4 Key Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Frontend framework | Next.js (React) | Full-stack TypeScript; API routes co-located; SSR for initial load |
| Backend API | Next.js API routes (or Express.js) | Simplicity for POC; same language as frontend |
| Primary state store | PostgreSQL | Relational integrity for audit immutability; UNIQUE index enforces single active version |
| Reference cache | Redis | Low-latency retrieval of indexed passages; prevents cold-start per invocation |
| LLM provider | Anthropic Claude (claude-sonnet or claude-opus) | Single provider; hardened wrapper handles retries and continuation |
| Streaming | Server-Sent Events (SSE) | One-directional; simpler than WebSockets for phase execution streaming |
| Deterministic tools | Pure TypeScript functions (no LLM) | Correctness, repeatability, auditability |
| Authentication | None (POC) — reviewer role in `X-Reviewer-Role` header | Single-user demo; no Entra ID in POC scope |
| File storage | Local filesystem (dev); S3-compatible (prod) | Configurable via `STORAGE_PATH` / `STORAGE_BUCKET` env var |
| Artifact format | JSON state + binary file storage | ProjectState in PostgreSQL; file content in storage; URL pointer in `artifact_registry.storage_uri` |

---

*TechArch-TTCopilot-v1.0 | §00-Overview | Synthetic POC Data Only*
## 2. Component Architecture

### 2.1 Backend Components

#### 2.1.1 Orchestrator (`src/server/orchestrator/`)

The gated state-machine orchestrator is the central control authority. It:

- Manages all lifecycle phase state transitions (Pending → AwaitingInputs → Running → AwaitingGate → GatePassed / GateConditional / GateFailed)
- Enforces the human-gate primitive: no autonomous gate decisions in any code path
- Processes control commands: `pause`, `resume`, `retry`, `cancel`, `run-to-gate`, `targeted-rerun`
- Traverses the dependency graph on input revision to compute affected scope
- Initiates targeted reruns (invalidates only affected check results / findings / outputs)
- Emits phase execution events to SSE stream

**Key files:**
```
src/server/orchestrator/
  stateMachine.ts       — Phase state transitions and gate state management
  commands.ts           — pause, resume, retry, cancel, run-to-gate handlers
  targetedRerun.ts      — Dependency graph traversal and invalidation logic
  gateEnforcement.ts    — Human-only gate decision validation
  phaseRunner.ts        — Agent invocation sequencing for a phase
```

**Critical invariants enforced here:**
- Gate outcome can only be written by an endpoint that verifies `X-Reviewer-Role` is non-empty and not an AI actor identifier
- `phase_state = Running` requires both inputs to be in `UserInputReady` or `SyntheticSystemInputReady`
- `GateFailed → AwaitingInputs` transition (retry) only permitted from `GateFailed` state

---

#### 2.1.2 Intake Handler (`src/server/intake/`)

Manages all input ingestion for both intake modes (UP and SI). Responsibilities:

- **UP workflow:** receives multipart file upload, runs full validation suite (file type, parseability, project ID, product name, phase, revision, units, identifier uniqueness, row/page guidance, data consistency, required sections), creates `InputVersion` record, writes intake audit event
- **SI workflow:** serves preloaded synthetic sample for View/Download, enforces explicit "Ingest Sample" user action (rejects programmatic auto-ingest with 403), validates/normalizes the sample, creates `InputVersion` record, writes intake audit event
- Enforces `ARTIFACT_COUNT_VIOLATION` when a second external or internal input is attempted
- Writes to `phase_inputs` and `input_versions` tables; appends to `audit_history`

**Key files:**
```
src/server/intake/
  upWorkflow.ts         — User-Provided File upload and validation
  siWorkflow.ts         — Simulated Intake sample serve/ingest
  validators/           — Per-rule validators (fileType, parseability, projectId, etc.)
  artifactCounter.ts    — Enforces max-1 external / max-1 internal per phase
```

---

#### 2.1.3 Deterministic Tool Layer (`src/server/tools/`)

Pure TypeScript functions that run deterministic engineering checks. **No LLM calls.** Each function takes structured input data and returns a `CheckResult` record ready for storage.

| Tool Function | Phase | Check |
|---|---|---|
| `crossArtifactConsistencyCheck()` | 4 | Reference designator / part number / footprint consistency between BOM and DFM spec |
| `hvClearanceCheck()` | 4 | PCB HV net-pair clearances vs EVINV-POC-STD-001 §3.1 threshold (8.0 mm air / 5.0 mm creepage) |
| `componentDeratingCheck()` | 4 | Component operating stress vs rated value; derating margin vs EVINV-POC-STD-001 §3.3 thresholds |
| `testPointCoverageCheck()` | 4 | Diagnostic nets vs accessible test points; flags zero-coverage nets |
| `cpkCalculation()` | 6 | Cpk = min((USL−μ)/(3σ), (μ−LSL)/(3σ)) vs threshold 1.33 per EVINV-POC-STD-001 §5.1 |
| `traceabilityCompletenessCheck()` | 2 | Requirements with ≥1 linked test method / total; warns if < 90% |
| `requirementTestabilityCheck()` | 2 | Flags requirements without measurable acceptance criteria |
| `actionClosureVerification()` | 4,5,6,7 | Verifies all blocking actions due by this phase are `VerifiedClosed` |
| `costCalculation()` | 1 | BOM unit cost × quantity + labor rate × hours vs parametric estimate ±5% |
| `inventoryReconciliation()` | 8 | BOM quantities vs ERP/MES synthetic stock; flags discrepancies |

Every tool returns a `CheckResult` object with: `check_id`, `check_type`, `phase_id`, `input_version_ids`, `formula_or_method`, `threshold`, `threshold_unit`, `result_value`, `result_unit`, `status` (Pass/Fail/Warning), `source_reference`, `limitation`, `items_checked[]`, `invalidated: false`, `superseded_by: null`, `run_at`.

---

#### 2.1.4 LLM Agent Layer (`src/server/agents/`)

One agent module per phase cluster, invoked by the orchestrator. Each agent:

1. Receives a `ContextPackage` assembled by the Context Assembly Service
2. Calls the Anthropic Claude API with a structured prompt and output schema
3. Returns: draft outputs (XLSX/DOCX structured JSON), findings array, AI gate recommendation, compact phase summary
4. Is **not** invoked for deterministic check computation — those are delegated to the Tool Layer before agent call

**Hardened wrapper (`src/server/agents/wrapper.ts`):**
- Retry with exponential backoff on API errors (max 3 attempts)
- Truncation continuation: detects incomplete output and requests continuation up to 2 times
- Cancellation: checks a Redis cancel flag before each retry iteration
- SSE event emission: streams progress tokens to the frontend
- Enforces: AI recommendation in response does not trigger gate state change (advisory only)

**Agent roster:**
```
src/server/agents/
  phase0Agent.ts        — Commercial Assessment
  phase1Agent.ts        — Business Case
  phase2Agent.ts        — Requirements Definition
  phase3Agent.ts        — Preliminary Design
  phase4Agent.ts        — Detailed Design (primary: DFM checks, seeded issues SI-03/04)
  phase5Agent.ts        — Verification & Validation
  phase6Agent.ts        — Manufacturing Readiness
  phase7Agent.ts        — Transfer & Lessons Learned
  phase8Agent.ts        — Production & Sustaining
  phase9Agent.ts        — End of Life
  wrapper.ts            — Hardened Claude API wrapper (retries, continuation, cancel, SSE)
```

---

#### 2.1.5 Context Assembly Service (`src/server/context/`)

Assembles the `ContextPackage` for each agent invocation. Enforces token budget (default 8,000 tokens for POC).

Steps per invocation:
1. **Active input summaries** — structured field extracts from active input version (not raw file text)
2. **Upstream compact summaries** — `CompactPhaseSummary` records from all prior completed phases (≤ 400 tokens each; full documents never transmitted)
3. **Open actions** — actions from `ProjectState.actions[]` where `status != VerifiedClosed` and `due_phase >= current_phase`
4. **Selected checklist items** — query Redis reference index for the applicable checklist tab (Phases 0, 1, 3, 4 only)
5. **Selected standard passages** — query Redis reference index with phase-specific engineering focus keywords
6. **Output schema** — JSON schema for expected outputs; sets max token budget for output section
7. Token count computed; if > budget, trim least-relevant standard passages first, then checklist items

**Never included in context:**
- Full prior-phase documents
- Full reference documents (EVINV-POC-STD-001, checklist)
- Project background narrative (included once at system init; referenced by `project_id` thereafter)
- Raw file binary content

---

#### 2.1.6 Reference Index Service (`src/server/referenceIndex/`)

Initialized once at system startup. Builds a searchable index over:
- EVINV-POC-STD-001 (synthetic standard — clearance, derating, Cpk thresholds)
- Power Supplies Technical Review Checklists — Prelim (Kickoff, SLR, Schematic Review, PCB Layout tabs)
- TT ENG 001 v4.1 lifecycle governance excerpts
- POC-specific rules and policies

Index stored in Redis. Per-invocation: query with phase-specific keywords, return top-N relevant passages (not full document).

---

#### 2.1.7 Artifact Service (`src/server/artifacts/`)

Manages the artifact lifecycle: validation, registration, storage, retrieval, versioning.

- **Artifact generation wrapper:** every agent-generated artifact passes through validation before registration. Enforces: disclaimer present, XLSX ≤ 10 rows, DOCX/PDF ≤ 2 pages, 6–10 columns, all required provenance fields present, EVINV-POC-STD-001 labeled as synthetic
- **Storage:** writes file binary to `STORAGE_PATH/{artifact_id}/{version}/{filename}`; stores URI in `artifact_registry.storage_uri`
- **Retrieval:** streams file content for AV-05 Artifact Viewer; supports comparison between two versions

---

#### 2.1.8 SSE Stream Handler (`src/server/sse/`)

Manages Server-Sent Events for real-time phase execution progress.

- One SSE connection per active phase run
- Events: `phase_started`, `check_running`, `check_complete`, `agent_token`, `agent_complete`, `phase_complete`, `error`
- Phase execution status updates trigger breadcrumb refresh on all nine views
- Redis stores per-run cancel flags; wrapper checks before each retry

---

### 2.2 Frontend Components (Web Gate Cockpit)

The frontend is a Next.js React application. All nine views share:
- **Persistent lifecycle breadcrumbs** (top of every view; 10 phase segments; selectable)
- **Synthetic data badge** ("Synthetic POC Data" — always visible)
- **TT Electronics ENG 001 v4.1 terminology** throughout

#### View Components

| View | Route | Component | Data Source |
|---|---|---|---|
| AV-01 Project Overview | `/` | `ProjectOverview` | `GET /api/views/project-overview` |
| AV-02 Product Lifecycle | `/lifecycle` | `LifecycleView` | `GET /api/views/lifecycle` |
| AV-03 Phase Workspace | `/phase/[id]` | `PhaseWorkspace` | `GET /api/views/phase/[id]/workspace` |
| AV-04 Input Intake Panel | `/phase/[id]/intake` | `IntakePanel` | `GET /api/views/phase/[id]/intake` |
| AV-05 Artifact Viewer | `/artifacts/[id]` | `ArtifactViewer` | `GET /api/artifacts/[id]/viewer` |
| AV-06 Checklist Workspace | `/phase/[id]/checklist` | `ChecklistWorkspace` | `GET /api/views/phase/[id]/checklist` |
| AV-07 Findings & Actions | `/findings-actions` | `FindingsActions` | `GET /api/views/findings-actions` |
| AV-08 Gate Review | `/gate/[id]/review` | `GateReview` | `GET /api/views/gate/[id]/review` |
| AV-09 Audit View | `/audit` | `AuditView` | `GET /api/views/audit` |

#### Key Frontend Invariants

- **AV-06 conditional render:** `ChecklistWorkspace` component renders "No technical review mapped" for Phase 2 and Phases 5–9; no checklist content displayed
- **Gate decision radio buttons:** never pre-selected; user must make affirmative selection
- **AI recommendation panel:** "Advisory Only — Human Decision Required" label is non-removable; rendered from a dedicated non-conditional component
- **Pass radio button:** disabled client-side when API reports `blocking_actions_open: true`; server also rejects the POST
- **Simulated Connector label:** always visible for SI inputs; cannot be hidden by configuration
- **SSE consumer:** `PhaseWorkspace` subscribes to `/api/sse/phase/[id]` during execution; updates execution status display in real time
- **Confirmation dialog:** required before any gate decision POST is sent; `window.confirm()` or modal component

---

*TechArch-TTCopilot-v1.0 | §01-Components | Synthetic POC Data Only*
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
## 5. Security Architecture

### 5.1 Authentication (POC Mode)

**No SSO or production RBAC in POC v1.** Authentication is intentionally omitted to simplify the demonstration scope.

- The `X-Reviewer-Role` HTTP header carries the human reviewer role (e.g., `"Design Engineer"`, `"Manufacturing Engineer"`, `"Quality Manager"`)
- This header is required for all write operations that represent human decisions (gate decisions, action approvals, action closures, phase start/cancel)
- No session tokens, JWTs, or cookies are used in POC
- The server treats the `X-Reviewer-Role` value as a role label string — not an authenticated identity
- **AI actor rejection:** Any POST to a gate decision endpoint checks that `X-Reviewer-Role` is present, non-empty, and not in the `AI_ACTOR_IDENTIFIERS` blocklist (`["AI","LLM","Claude","system","agent","orchestrator"]`). Requests with these values return `403 GATE_AI_PROHIBITED`.

**v2 scope:** Full Entra ID SSO with RBAC; reviewer roles mapped to Entra ID groups; JWT verification on all write endpoints.

---

### 5.2 Human-Gate Authority Enforcement

This is the most critical security invariant in the system. It is enforced at **three independent layers**:

| Layer | Mechanism |
|---|---|
| **API layer** | `POST /api/gates/{id}/decide` validates `X-Reviewer-Role` header; rejects AI actor values; returns `403 GATE_AI_PROHIBITED` |
| **Orchestrator layer** | `stateMachine.ts` gate state transitions (`AwaitingGate → GatePassed/GateConditional/GateFailed`) only accept calls originating from the gate decision endpoint handler; no internal auto-advance code path exists |
| **Database layer** | `gate_decisions` table has `is_final BOOLEAN NOT NULL DEFAULT TRUE`; no UPDATE or DELETE is permitted by the application role; gate state can only advance via explicit INSERT into `gate_decisions` |

**Silent gate approval prohibition:** No code path in the orchestrator, agent wrapper, or any tool function may call the gate decision endpoint or insert a `gate_decisions` record. Only the `POST /api/gates/{id}/decide` handler inserts gate decisions, and only after `X-Reviewer-Role` validation passes.

---

### 5.3 Audit Immutability

The `audit_history` table is append-only. Protection is enforced at two layers:

| Layer | Mechanism |
|---|---|
| **Application layer** | No UPDATE or DELETE operations are issued against `audit_history` anywhere in the service layer; only `INSERT` operations via `auditService.append()` |
| **Database layer** | `REVOKE UPDATE, DELETE ON audit_history FROM application_role;` executed at DB setup |

The AV-09 Audit View is a read-only display. No write controls appear on this view. The UI renders "Immutable Record — Append Only" label at the top.

---

### 5.4 Single Active Version Enforcement

The `input_versions` table enforces the constraint that exactly one version per logical input is active at any time via a partial unique index:

```sql
CREATE UNIQUE INDEX idx_input_versions_single_active
  ON input_versions(input_id)
  WHERE active = TRUE;
```

The DB will reject any INSERT or UPDATE that would result in two rows with `active = TRUE` for the same `input_id`. The application layer also validates this before issuing the write.

---

### 5.5 Artifact Disclaimer Enforcement

The `artifact_registry` table enforces the mandatory disclaimer at the database level:

```sql
disclaimer_present BOOLEAN NOT NULL DEFAULT TRUE CHECK (disclaimer_present = TRUE)
```

A `CHECK` constraint rejects any INSERT where `disclaimer_present = FALSE`. The artifact generation wrapper also verifies disclaimer presence before calling the register endpoint.

---

### 5.6 Synthetic Data Indicator Enforcement

```sql
synthetic_data_indicator BOOLEAN NOT NULL DEFAULT TRUE CHECK (synthetic_data_indicator = TRUE)
```

The `project_state` table's `CHECK` constraint prevents any write of `synthetic_data_indicator = FALSE`. This ensures the POC's synthetic data status cannot be accidentally cleared.

---

### 5.7 Prohibited Label Detection

The intake handler and artifact generation wrapper scan all generated text (UI labels, API responses, generated artifact content) for prohibited connectivity claims:

```typescript
const PROHIBITED_LABELS = [
  /connected to \w+/i,
  /retrieved from \w+/i,
  /live \w+ data/i,
  /real-time \w+/i,
  /replacement input/i,
];
```

If a prohibited label is detected in generated content, the response is rejected with `500 PROHIBITED_LABEL_DETECTED` before being returned to the client.

---

### 5.8 No Live System Credentials

**Requirement (non-negotiable for POC):** No live API keys, tokens, or credentials for any enterprise system (Cora, Salesforce, PLM, ERP, MES, quality system, obsolescence databases) may exist in the codebase or environment configuration.

The `.env` file contains only:

```
ANTHROPIC_API_KEY=sk-ant-...          # Only external key permitted
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
STORAGE_PATH=/var/tt-copilot/artifacts
POC_CONTEXT_TOKEN_BUDGET=8000
```

All 23 simulated connectors serve preloaded synthetic sample files from local storage. No outbound HTTP calls to enterprise systems are made.

---

### 5.9 Input Validation and Injection Prevention

- All file uploads are validated for MIME type and parseability before processing
- PostgreSQL queries use parameterized statements exclusively (via the `pg` driver or ORM); no string concatenation in SQL
- User-supplied text fields (comments, descriptions) are stored as plain text; not interpreted as HTML or executed as code
- File storage uses UUID-based paths (`/artifacts/{artifact_id}/{version}/{filename}`); no user-supplied path segments in storage URIs
- `storage_uri` values are only served from the known `STORAGE_PATH` prefix; path traversal prevented by path normalization check

---

### 5.10 Blocking Action Gate Enforcement

When a human selects "Pass" in the Gate Review Workspace:

1. **Client-side:** "Pass" radio button is disabled if the API reported `blocking_actions_open: true`. A message is displayed: "Blocking actions must be closed before recording a Pass outcome."
2. **Server-side (API layer):** `POST /api/gates/{id}/decide` queries `actions` table for `blocking = TRUE AND status != 'VerifiedClosed'` for the gate phase; if any exist, returns `409 BLOCKING_ACTIONS_OPEN`.

Both layers must independently reject the Pass decision when blocking actions are open.

---

*TechArch-TTCopilot-v1.0 | §04-Security | Synthetic POC Data Only*
## 6. Technology Stack

### 6.1 Stack Table

#### Frontend

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Framework** | Next.js (App Router) | 15.x | React SSR + API routes; co-located frontend and backend; `next.config.mjs` (not `.ts`) |
| **UI library** | React | 19.x | Component model for 9 Web Gate Cockpit views |
| **Component library** | **shadcn/ui** (Radix UI primitives) | Latest stable | Copy-owned accessible component primitives — Dialog, AlertDialog, Table, Badge, Button, Progress, Tabs, Select, RadioGroup |
| **Styling** | **Tailwind CSS v4** | 4.x | Utility-first; custom color tokens (surface, border, semantic status colors) |
| **Icons** | **Lucide React** | Latest stable | Consistent stroke-weight icons; ships with shadcn/ui |
| **Data tables** | **TanStack Table v8** | 8.x | Headless sortable/filterable tables for Findings, Audit Log, Artifact history |
| **Charts** | **Recharts** | 2.x | Phase-status timeline, Cpk indicator, progress visualizations |
| **File upload** | **react-dropzone** | Latest stable | Drag-and-drop with validation callbacks for UP intake workflow |
| **Toast notifications** | **Sonner** (shadcn/ui default) | Latest stable | Non-blocking status feedback for intake events, rerun triggers, gate decisions |
| **Fonts** | **Inter** (sans-serif) via `next/font`; **JetBrains Mono** for code/IDs | Latest stable | Industry-standard legibility; monospace for deterministic check values |
| **State management** | React Server Components + **SWR** | — | Server-driven data; optimistic client-side revalidation |
| **SSE client** | `EventSource` (browser native) | — | Phase execution real-time progress streaming |
| **Theme** | Dark-first; `class="light"` toggle for light mode | — | Dark matches engineering tool conventions (Linear, Vercel, GitHub) |

**Color token summary:**

| Token | Dark value | Light value | Semantic use |
|---|---|---|---|
| `--color-background` | `#0f1117` | `#ffffff` | Page background |
| `--color-surface` | `#1a1d27` | `#f8f9fa` | Card / panel background |
| `--color-border` | `#2d3148` | `#e2e8f0` | Card and input borders |
| `--color-pass` | `#22c55e` | `#16a34a` | Pass badges and indicators |
| `--color-conditional` | `#f97316` | `#ea580c` | Conditional Pass badges |
| `--color-fail` | `#ef4444` | `#dc2626` | Fail badges and error states |
| `--color-awaiting` | `#f59e0b` | `#d97706` | Awaiting Decision badges |
| `--color-synthetic` | `#8b5cf6` | `#7c3aed` | Synthetic data disclaimer badges |
| `--color-advisory` | `#3b82f6` | `#2563eb` | AI Advisory labels |

#### Backend

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Runtime** | Node.js | 20.x LTS | Server runtime for Next.js API routes |
| **Language** | TypeScript (strict mode) | 5.x | Full-stack type safety; shared interfaces between frontend, API, and DB layers |
| **Primary database** | PostgreSQL | 15.x | Durable ProjectState persistence; partial unique index for single-active-version enforcement |
| **PostgreSQL client** | `pg` + `pg-types` | 8.x | Parameterized queries; type-safe access |
| **ORM / Query builder** | **Drizzle ORM** | Latest stable | Type-safe SQL; schema-as-code; lightweight migrations |
| **Cache / Reference index** | Redis | 7.x | Reference document index; per-run SSE cancel flags; context cache |
| **Redis client** | `ioredis` | 5.x | Redis connection pool |
| **LLM provider** | Anthropic Claude API | claude-sonnet-4-6 / claude-opus-4 | Phase agent LLM calls |
| **Anthropic SDK** | `@anthropic-ai/sdk` | Latest stable | Typed Claude API client |
| **File uploads** | Next.js built-in multipart | — | Multipart form-data parsing for artifact uploads |
| **File storage** | Local filesystem (dev) / S3-compatible (prod) | — | Uploaded artifacts, synthetic samples, generated outputs |
| **S3 client** | `@aws-sdk/client-s3` | 3.x | S3-compatible storage access |
| **XLSX parsing / generation** | `xlsx` (SheetJS) | Latest stable | Parse and generate XLSX artifacts |
| **PDF parsing** | `pdf-parse` | Latest stable | Parse uploaded PDF artifacts for validation |
| **DOCX parsing** | `mammoth` | Latest stable | Parse uploaded DOCX artifacts |
| **DOCX generation** | `docx` | Latest stable | Generate DOCX output artifacts |

#### Tooling

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Testing** | `vitest` + `@testing-library/react` | Latest stable | Unit tests for deterministic tools; component tests |
| **E2E testing** | `playwright` | Latest stable | End-to-end UI tests; gate decision flow verification |
| **Linting** | ESLint (flat config) + Prettier | Latest stable | Code quality; formatting |
| **Environment config** | `.env.local` (Next.js convention) | — | No live system credentials in POC |

### 6.2 Key Dependency Rationale

| Dependency | Rationale |
|---|---|
| **Next.js 15 + `next.config.mjs`** | App Router enables RSC-first data fetching; `next.config.mjs` (not `.ts`) required for Next.js 15 compatibility — `.ts` config causes hard build errors in Next 14 and is unsupported. |
| **shadcn/ui (copy-owned)** | Components are copied into the repo (not a package import), giving full control over styling without fighting a design system's opinions. Radix UI primitives handle accessibility (ARIA, keyboard nav, focus management) out of the box. |
| **Tailwind CSS v4** | v4 drops the `tailwind.config.js` in favor of CSS-native `@theme` blocks — simpler token management. Utility-first eliminates CSS specificity bugs common in engineering tools with dense tables. |
| **TanStack Table v8** | Headless — works with shadcn/ui `<Table>` render. Supports server-side sorting/filtering for the Audit View (potentially 100+ intake events) without re-implementing sort logic. |
| **Drizzle ORM** | Schema-as-code with TypeScript inference; migrations via `drizzle-kit push` in dev. Lighter than Prisma; no `schema.prisma` separate file — interfaces live in TypeScript alongside the app code. |
| **react-dropzone** | Handles drag-and-drop, file-type filtering, and size limits as callbacks — integrates cleanly with the UP intake validation flow without reimplementing browser File API handling. |
| **Sonner** | shadcn/ui's recommended toast library; stacks correctly, supports promise-based toasts for async intake/rerun operations, and respects `prefers-reduced-motion`. |
| **PostgreSQL (not SQLite/JSON file)** | Partial unique index (`WHERE active = TRUE`) enforces single-active-version at DB level. `REVOKE UPDATE DELETE ON audit_history` provides immutability. ACID transactions prevent race conditions on ProjectState writes. |
| **Redis (not in-memory Map)** | Reference index survives Node.js process restarts. Per-run SSE cancel flags are accessible across multiple requests. Context cache reduces LLM cost on rerun. |
| **TypeScript strict mode** | Shared interfaces for `CheckResult`, `AuditEvent`, `GateDecision`, etc. prevent runtime type mismatches between frontend, API, and DB layers. |
| **`@anthropic-ai/sdk`** | Official SDK handles API versioning, streaming, and error types. Hardened wrapper adds retry/continuation/cancellation on top. |
| **SheetJS (`xlsx`)** | Most capable open-source XLSX parser; handles both read (validation) and write (generation) of compact XLSX artifacts. |
| **`playwright`** | Gate decision UI tests require browser automation; playwright verifies confirmation dialog, radio button state, and SSE progress display. |
| **`vitest` (not Jest)** | Native ESM support; no transform config needed for Next.js App Router; faster cold start than Jest for TypeScript projects. |

### 6.3 Directory Structure

```
tt-copilot/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                  # AV-01 Project Overview
│   ├── lifecycle/page.tsx        # AV-02 Product Lifecycle View
│   ├── phase/[id]/
│   │   ├── page.tsx              # AV-03 Phase Workspace
│   │   ├── intake/page.tsx       # AV-04 Input Intake Panel
│   │   └── checklist/page.tsx    # AV-06 Technical Checklist Workspace
│   ├── artifacts/[id]/page.tsx   # AV-05 Artifact Viewer
│   ├── findings-actions/page.tsx # AV-07 Findings & Actions Workspace
│   ├── gate/[id]/review/page.tsx # AV-08 Gate Review Workspace
│   └── audit/page.tsx            # AV-09 Audit View
│
├── app/api/                      # Next.js API routes
│   ├── orchestrator/             # Orchestrator endpoints
│   ├── phases/                   # Phase config, artifact count, intake
│   ├── project/                  # ProjectState, dependency graph
│   ├── checks/                   # Deterministic check endpoints
│   ├── findings/                 # Findings endpoints
│   ├── actions/                  # Actions endpoints
│   ├── gates/                    # Gate review and decision endpoints
│   ├── artifacts/                # Artifact registry endpoints
│   ├── system/                   # Index initialization, status
│   ├── context/                  # Context assembly endpoints
│   ├── views/                    # View data aggregation endpoints
│   └── sse/                      # SSE streaming endpoint
│
├── src/
│   ├── server/
│   │   ├── orchestrator/         # State machine + commands
│   │   ├── intake/               # UP and SI workflow handlers + validators
│   │   ├── tools/                # Deterministic check functions (no LLM)
│   │   ├── agents/               # Phase agents + hardened Claude wrapper
│   │   ├── context/              # Context assembly service
│   │   ├── referenceIndex/       # Reference doc indexing and query
│   │   ├── artifacts/            # Artifact validation, registration, storage
│   │   ├── sse/                  # SSE stream management
│   │   └── db/                   # PostgreSQL connection pool, query helpers
│   │
│   ├── shared/
│   │   ├── types/                # TypeScript interfaces (ProjectState, etc.)
│   │   ├── constants/            # Phase configuration (immutable)
│   │   └── errors/               # Error code constants
│   │
│   └── components/               # React components for 9 views
│       ├── layout/               # Breadcrumbs, shell, nav
│       ├── views/                # Per-view components (AV-01 through AV-09)
│       ├── intake/               # UP and SI intake panel components
│       ├── gate/                 # Gate Review Workspace components
│       └── shared/               # Artifact viewer, findings table, etc.
│
├── prisma/ or db/migrations/     # PostgreSQL migrations
├── public/samples/               # Preloaded synthetic sample files (23 connectors)
├── scripts/                      # DB seed, index initialization
└── tests/                        # Jest unit tests + Playwright E2E
```

### 6.4 Synthetic Sample Files

All 23 simulated connector synthetic samples are static files committed to the repository under `public/samples/`:

```
public/samples/
  phase0-ext-salesforce-cora-capability.xlsx
  phase1-ext-cora-historical-cost.xlsx
  phase2-ext-requirements-repo-icr.xlsx
  phase3-int-standards-library-mfg-capability.xlsx
  phase4-int-dfm-standards-supplier-risk.xlsx
  phase4-int-dfm-standards-supplier-risk-revised.xlsx   ← for SI-04 correction
  phase5-ext-test-methods-customer-acceptance.xlsx
  phase6-ext-mes-quality-capability.xlsx
  phase6-ext-mes-quality-capability-revised.xlsx         ← for SI-06 correction
  phase7-ext-cora-mes-capa-transfer.xlsx
  phase8-ext-supplier-distributor-obsolescence.xlsx
  phase8-int-erp-mes-plm-crb.xlsx
  phase9-ext-erp-tooling-archive.xlsx
  ... (additional per-connector files as needed)
```

Each file complies with compact artifact standards: ≤ 10 meaningful rows, 6–10 columns, mandatory disclaimer, provenance metadata in header row.

---

*TechArch-TTCopilot-v1.0 | §05-TechStack | Synthetic POC Data Only*
## 7. Integration Points

### 7.1 External Integrations (POC v1 — Simulated Only)

**No live connections to any enterprise system in POC v1.** All 23 simulated connectors serve preloaded static synthetic sample files. The table below documents each simulated system, which phases and input roles it serves, the UI label used, and the synthetic sample data description.

| Connector # | System | Phases | Input Role | UI Label | Sample Description |
|---|---|---|---|---|---|
| 1 | Salesforce | 0 | Internal | "Simulated Connector — Salesforce" | Synthetic opportunity record: customer name, application, annual volume, target price, key requirements |
| 2 | Cora | 0, 1, 7, 9 | Internal | "Simulated Connector — Cora" | Synthetic capability library, historical project records, gate records |
| 3 | Capability Library | 0 | Internal (part of) | "Simulated Connector — Capability Library" | Synthetic site capability profile: processes, certifications, equipment classes, capacity headroom |
| 4 | Historical Projects | 0, 1 | Internal (part of) | "Simulated Connector — Historical Projects" | Synthetic historical NPI analogues with cost, schedule, and quality outcomes |
| 5 | Site Capacity | 0 | Internal (part of) | "Simulated Connector — Site Capacity" | Synthetic site loading: available engineering hours, floor capacity, equipment utilization |
| 6 | Parametric Cost Model | 1 | Internal | "Simulated Connector — Parametric Cost Model" | Synthetic cost model output: BOM cost estimate, NRE, tooling, labor |
| 7 | Labor/Rate Source | 1 | Internal (part of) | "Simulated Connector — Labor/Rate Source" | Synthetic labor rates by role and site |
| 8 | Requirements Repository | 2 | Internal | "Simulated Connector — Requirements Repository" | Synthetic draft system requirements aligned to EV-INV-800 specifications |
| 9 | Interface Control Repository | 2 | Internal (part of) | "Simulated Connector — Interface Control Repository" | Synthetic ICD stub: CAN, power, thermal, mechanical interfaces |
| 10 | Standards Library | 3, 4, 5 | External | "Simulated Connector — Standards Library" | Synthetic EVINV-POC-STD-001 content; selected DFM rules; test method references |
| 11 | Manufacturing Capability Repository | 3 | External (part of) | "Simulated Connector — Manufacturing Capability Repository" | Synthetic DFM/DFA capability limits: trace width, clearance, component placement, soldering specs |
| 12 | Supplier Feed | 4 | External (part of) | "Simulated Connector — Supplier Feed" | Synthetic supplier risk data: lead times, single-source flags, supply chain concentration |
| 13 | Obsolescence Source | 4, 8 | External (part of) | "Simulated Connector — Obsolescence Source" | Synthetic obsolescence notices including fictional IGBT discontinuance notice (SI-08) |
| 14 | Customer Acceptance Repository | 5 | External (part of) | "Simulated Connector — Customer Acceptance Repository" | Synthetic customer acceptance test requirements aligned to EV-INV-800 |
| 15 | MES (Manufacturing Execution System) | 6, 7, 8 | Internal | "Simulated Connector — MES" | Synthetic process data: yield, cycle time, torque values, Cpk measurements |
| 16 | Quality System / CAPA | 6, 7 | Internal (part of) | "Simulated Connector — Quality System" | Synthetic CAPA records, quality KPIs, non-conformance counts |
| 17 | Equipment Records | 6 | Internal (part of) | "Simulated Connector — Equipment Records" | Synthetic equipment qualification status, calibration records |
| 18 | ERP | 8, 9 | Internal | "Simulated Connector — ERP" | Synthetic production orders, BOM revisions, inventory, financial data |
| 19 | PLM (Product Lifecycle Management) | 8 | Internal (part of) | "Simulated Connector — PLM" | Synthetic design change records, BOM history, revision control |
| 20 | Change Review Board Records | 8 | Internal (part of) | "Simulated Connector — Change Review Board" | Synthetic ECO/ECN records for EV-INV-800 |
| 21 | Distributor Feeds | 8 | External (part of) | "Simulated Connector — Distributor Feeds" | Synthetic stock availability, pricing, and lead-time data from fictional distributors |
| 22 | Tooling/Fixture Register | 9 | Internal (part of) | "Simulated Connector — Tooling/Fixture Register" | Synthetic tooling asset list with condition, location, and disposal status |
| 23 | Project Archive | 9 | Internal (part of) | "Simulated Connector — Project Archive" | Synthetic project record summary: approved outputs, gate decisions, lessons learned |

### 7.2 Simulated Connector Behavior Contract

Every simulated connector implements the following behavior in the SI intake workflow:

| Behavior | Implementation |
|---|---|
| Label always visible | `PhaseInputState.system_represented` displayed as "Simulated Connector — [System Name]" in AV-03 Input Readiness Panel |
| Synthetic sample label | "Preloaded Synthetic Sample" label adjacent to View/Download controls |
| No live connection claim | "No live connection exists to [System Name]" statement in connector panel |
| Explicit ingest required | "Ingest Sample" button enabled only after View or Download; POST to `/api/phases/{id}/inputs/{role}/ingest` requires `confirm_viewed: true` |
| Provenance recording | `system_represented`, `intake_behavior: "SI"`, `intake_timestamp` written to `phase_inputs` and `audit_history` |
| Sample content compliance | All synthetic sample files comply with F08: ≤ 10 rows, 6–10 fields, mandatory disclaimer, provenance metadata |
| No real system credentials | No live API keys or tokens for any enterprise system in codebase or `.env` |
| Disclaimer on sample | Every synthetic sample file carries the mandatory disclaimer |

### 7.3 LLM Integration — Anthropic Claude API

**Only external API used in POC v1.**

| Parameter | Value |
|---|---|
| Provider | Anthropic |
| Model | `claude-sonnet-4-6` (default) / `claude-opus-4` (flagship phases if budget permits) |
| SDK | `@anthropic-ai/sdk` |
| Authentication | `ANTHROPIC_API_KEY` environment variable |
| Streaming | Messages API with `stream: true` |
| Max tokens per invocation | Phase-specific; default 2,048 output tokens; bounded by `POC_CONTEXT_TOKEN_BUDGET` |

**Hardened wrapper behavior:**

| Scenario | Wrapper Response |
|---|---|
| API transient error (529, 503, network) | Retry with exponential backoff; max 3 attempts; 2s / 4s / 8s delays |
| Response truncated (output incomplete) | Detect truncation marker; send continuation prompt up to 2 times |
| Phase cancelled by operator | Check Redis cancel flag before each retry iteration; abort and emit `phase_cancelled` SSE event |
| Model refusal or safety block | Return `503 LLM_REFUSED` with error; do not retry |
| Token budget exceeded in prompt | Context assembly trims least-relevant passages before retry |

**What the LLM is never asked to do:**
- Compute clearance margins, Cpk, derating percentages, or traceability completeness (all deterministic tools)
- Approve a gate or set a gate decision (prohibited at orchestrator and API layers)
- Generate text containing "Connected to [SYSTEM]", "Retrieved from [SYSTEM]", "Live [SYSTEM] Data" (checked by prohibited label scanner)

### 7.4 Reference Document Store

The following documents are loaded into the Redis reference index at system initialization. These are internal POC documents, not live system integrations.

| Document | Source | Purpose in POC |
|---|---|---|
| EVINV-POC-STD-001 | POC-authored synthetic standard | Threshold source for clearance (§3.1), derating (§3.3), Cpk (§5.1) checks |
| Power Supplies Technical Review Checklists — Prelim | TT Electronics internal (adapted for POC) | Selected checklist items for Phases 0 (Kickoff), 1 (SLR), 3 (Schematic Review), 4 (PCB Layout) |
| TT-New-Product-Process-v4.1 | TT Electronics formal lifecycle document | Phase/gate governance reference; ENG 001 v4.1 |
| TechSur GenAI Automation Proposal | TechSur internal | Agent flow and input/output structure reference |
| TT Copilot Inputs/Outputs specification | TechSur internal | Compact artifact scope and per-phase intake behavior |

Index initialization (`POST /api/system/initialize-index`): extracts text by section/clause/row, builds searchable index in Redis, marks `initialized`. Does not reload on subsequent agent invocations — queries only.

### 7.5 v2 Integration Roadmap (Out of Scope for POC)

The following live integrations are explicitly deferred to v2:

| System | v2 Capability |
|---|---|
| Cora | Live checklist read; RAIL action write-back; gate approval synchronization |
| Salesforce | Live opportunity data retrieval |
| CAD/PLM (SolidWorks/NX/Creo) | Automated feature extraction; clearance and BOM data from live models |
| ERP | Live BOM, inventory, and financial data |
| MES | Live process data for Cpk and yield calculations |
| Quality System / CAPA | Live CAPA records and quality KPIs |
| Obsolescence Databases | Live PDNA/IHS Markit or equivalent feed |
| Entra ID / SSO | Production RBAC and authentication |

### 7.6 Prohibited Integration Behaviors (POC v1 Enforcement)

The following behaviors are explicitly prohibited and must not be implemented:

| Prohibited Behavior | Enforcement |
|---|---|
| Live connection to any enterprise system | No live API keys in `.env`; no outbound HTTP calls to enterprise hosts |
| Auto-ingest of synthetic samples | `POST /api/.../ingest` requires `confirm_viewed: true` from client; rejects `403 AUTO_INGEST_PROHIBITED` otherwise |
| UI label "Connected to [SYSTEM]" | Prohibited label scanner rejects generated content containing this string |
| UI label "Retrieved from [SYSTEM]" | Same scanner |
| UI label "Live [SYSTEM] Data" | Same scanner |
| Checklist content for Phase 2 or Phases 5–9 | `GET /api/views/phase/{id}/checklist` returns `404 NO_CHECKLIST_MAPPED` for these phases |
| AI actor submitting gate decision | `POST /api/gates/{id}/decide` rejects `X-Reviewer-Role` values in AI actor blocklist |
| "Replacement input" terminology | Text scan in CI; error `PROHIBITED_LABEL_DETECTED` if detected in generated content |

---

*TechArch-TTCopilot-v1.0 | §06-Integrations | Synthetic POC Data Only*

---

## Appendix A: Seeded Issue — Deterministic Check Summary

The following table documents the seeded engineering issues, the deterministic checks that detect them, and their correction cycle outcomes. This serves as implementation verification reference.

| Issue ID | Phase | Seeded Problem | Detecting Check | Finding ID | Action ID | Correction Outcome |
|---|---|---|---|---|---|---|
| SI-01 | 2 | REQ-THERM-004 lacks measurable acceptance criterion | RequirementTestability | F2-001 | A2-001 | Revised requirement adds ≤85°C at TP-CASE-1; check reruns Pass; Gate 2 Pass |
| SI-02 | 3 | CN-COOL-1 orientation obstructs J-FAST-7 through J-FAST-10 | Agent analysis (DFM/DFA) | F3-001 | A3-001 (blocking) | Gate 3 Conditional Pass; A3-001 verified closed in Phase 4 revised design |
| SI-03a | 4 | VBUS+ to GND_SHIELD clearance 6.2 mm (threshold 8.0 mm) | HVClearanceCheck | F4-001 | A4-001 (blocking) | Revised design: clearance 9.1 mm; check reruns Pass |
| SI-03b | 4 | C_BULK_3 derating margin 4.4% (threshold 50%) | ComponentDeratingCheck | F4-002 | A4-002 (blocking) | Revised design: 900 V cap, margin 52.2%; check reruns Pass |
| SI-03c | 4 | DIAG_TEMP_IGBT_CASE has no accessible test point | TestPointCoverageCheck | F4-003 | A4-003 (blocking) | Revised design: TP-IGBT-CASE added; check reruns Pass |
| SI-03d | 4 | C_HV_1 footprint 0805 in BOM vs 1206 in DFM spec | CrossArtifactConsistency | F4-004 | A4-004 (blocking) | Revised BOM: footprint corrected to 1206; check reruns Pass |
| SI-04 | 4 | Correction verification of SI-02/03a-d | All 4 Phase 4 checks | — | A3-001, A4-001–A4-004 verified closed | Gate 4 Pass after correction |
| SI-05 | 5 | TP-CASE-1 thermal measurement 91°C (criterion ≤85°C) | V&V comparison (agent) | F5-001 | A5-001 | Revised validation: 82°C; Gate 5 Pass after correction |
| SI-06 | 6 | SOLDER_JOINT_SHEAR_HV_BUS Cpk 0.87 (threshold 1.33) | CpkCalculation | F6-001 | A6-001 | Revised MES sample: Cpk 1.45; Gate 6 Pass after correction |
| SI-07 | 7 | Torque variation in MOP-012-BRACKET-MOUNT (2.1–4.8 N·m; spec 3.5±0.5) | Agent analysis | F7-001 | A7-001 (non-blocking) | Captured in Lessons-Learned Register; Gate 7 Pass |
| SI-08 | 8 | IGBT-HV-800-A (Q_HV_1) discontinuance notice; no drop-in replacement | Obsolescence deterministic flag | F8-001 | — | Demand insufficient for redevelopment; Gate 8 Pass to initiate EOL |

---

## Appendix B: Happy-Path Gate Storyline

| Gate | Phase | Outcome | Condition |
|---|---|---|---|
| Gate 0 | Commercial Assessment | Pass | Initial commercial assessment complete |
| Gate 1 | Business Case | Pass | Business case approved |
| Gate 2 | Requirements Definition | Pass | After clarification of REQ-THERM-004 (SI-01) |
| Gate 3 | Preliminary Design | Conditional Pass | Coolant connector concern (SI-02); action A3-001 raised |
| Gate 4 | Detailed Design | Pass | After correction of SI-03a/b/c/d; A3-001 verified closed |
| Gate 5 | Verification & Validation | Pass | After thermal correction (SI-05) |
| Gate 6 | Manufacturing Readiness | Pass | After Cpk correction (SI-06) |
| Gate 7 | Transfer & Lessons Learned | Pass | Transfer complete; lessons learned captured (SI-07) |
| Gate 8 | Production & Sustaining | Pass | Obsolescence triggers EOL (SI-08); project enters Phase 9 |
| Gate 9 | End of Life | Pass | EOL complete; project status → Closed |

---

*TechArch-TTCopilot-v1.0 | §06-Integrations + Appendices | Synthetic POC Data Only*
