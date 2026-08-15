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
