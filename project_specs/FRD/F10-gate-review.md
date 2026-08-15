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
