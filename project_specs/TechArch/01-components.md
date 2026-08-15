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
