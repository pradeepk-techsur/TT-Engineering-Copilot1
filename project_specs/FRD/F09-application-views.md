---

## F09: Application Views — Nine-View Web Gate Cockpit

**Requirements:** AV-01 to AV-10 | **Priority:** P0

**Description:** The Web Gate Cockpit is the primary human-in-the-loop surface for all gate navigation, AI-draft review, artifact inspection, and sign-off. It presents nine structured application views (AV-01 through AV-09) with persistent lifecycle breadcrumbs on all views. TT Electronics Product Lifecycle Process terminology is used throughout. The system does not present a generic chatbot as its primary interface; all interactions occur through structured phase workspaces, panels, and decisional controls.

---

### Breadcrumbs (AV-10 Behavior — Present on All Nine Views)

**Description:** Persistent lifecycle breadcrumbs appear at the top of every view. They display the lifecycle progression and allow navigation to any completed or current phase.

**Content per breadcrumb segment:**
- Phase number and name (e.g., "Phase 0 — Commercial Assessment")
- Gate number (e.g., "Gate 0")
- Technical review label where mapped (Kickoff, SLR, Schematic/PDR, PCB Layout/CDR)
- Breadcrumb state indicator (icon + color coding)

**States:**

| State | Icon | Meaning |
|---|---|---|
| `Completed` | ✅ green | Gate passed; phase complete |
| `Current` | ▶ blue | Phase currently active |
| `Awaiting Human Decision` | ⏳ amber | Phase complete; gate open for human decision |
| `Conditional Pass` | 🔶 orange | Gate passed conditionally; actions outstanding |
| `Blocked` | ⛔ red | Gate failed; project blocked |
| `Upcoming` | ○ grey | Phase not yet started |
| `Closed` | 🔒 grey | Phase 9 gate passed; project closed |

**Interaction:** Clicking a `Completed`, `Current`, `Awaiting Human Decision`, or `Conditional Pass` breadcrumb navigates to the Phase Workspace (AV-03) for that phase.

---

### AV-01: Project Overview

**Purpose:** High-level dashboard showing project identity, current status, and phase health across all 10 phases.

**Content:**
- **Project Identity Panel:**
  - Project ID: EVINV-POC-001
  - Product Name: EV-INV-800 Demonstration Traction Inverter
  - Project Type: NPI A / Category 1
  - Current Phase: Phase [n] — [name]
  - Current Gate: Gate [n]
  - Project Status: Active / Blocked / Cancelled / Closed
  - Synthetic Data Indicator: "Synthetic POC Data" badge (always visible)
- **Phase Summary Table:** 10 rows (one per phase); columns: Phase, Technical Review, Gate, Status, Gate Outcome, Last Action Date.
- **Project Health Indicators:**
  - Open Findings: count by severity (Critical, Major, Minor)
  - Open Actions: count (Blocking / Non-blocking)
  - Phases Complete: n of 10
  - Last Gate Decision: date and outcome
- **Quick Navigation:** Buttons to "Go to Current Phase", "Go to Gate Review", "Go to Audit View".

**Data Sources:** `ProjectState.projectIdentity`, `ProjectState.phases[]`, `ProjectState.findings[]`, `ProjectState.actions[]`, `ProjectState.gateDecisions[]`.

**User Interactions:** Click phase row → navigate to AV-03 for that phase. Click health indicator → filter AV-07 (Findings and Actions). Click breadcrumb → navigate to phase.

---

### AV-02: Product Lifecycle View

**Purpose:** Visual representation of the full TT Electronics ENG 001 v4.1 lifecycle showing all 10 phases and 10 gates with their current states.

**Content:**
- **Lifecycle Timeline:** Horizontal or vertical progression showing phases 0–9 and gates 0–9 in order.
- **Phase Nodes:** Each phase shown as a node with:
  - Phase number and name
  - Technical review label (where mapped)
  - Breadcrumb state indicator
  - Gate outcome badge (Pass / Conditional Pass / Fail / Open / Locked)
- **Gate Nodes:** Each gate shown between phases with decision status.
- **Legend:** Breadcrumb state colors and icons defined.
- **Filter Controls:** Filter by state (e.g., show only Conditional Pass phases).

**Data Sources:** `ProjectState.phases[]`, `ProjectState.gateDecisions[]`.

**User Interactions:** Click any phase node → navigate to AV-03 for that phase. Click gate node → navigate to AV-08 (Gate Review Workspace) for that gate. Hover over node → tooltip showing key facts (gate outcome, date, reviewer).

---

### AV-03: Phase Workspace

**Purpose:** The primary per-phase working view. Contains all panels needed to manage a single lifecycle phase from input intake through gate decision.

**Content Panels:**

#### Input Readiness Panel (both inputs)
For each of the two logical inputs:
- Artifact Name
- Intake Behavior label (`User-Provided File` or `Simulated External-System Intake`)
- System Represented (SI inputs only)
- Format and Size Guidance
- Active Artifact name/ID (or "None")
- Active Version number
- Validation Status (Pass / Fail / Pending) with error details if failed
- Required User Action (contextual: "Upload file", "Click Ingest Sample", "Upload Revised Version", "Ingest Revised Sample")
- Ready Indicator: `Ready` (green) or `Not Ready` (red/amber)

**User-Provided File Controls:**
- Upload button (becomes "Upload Revised Version" after successful intake)
- Sample/Template download link (if available)
- Validation result display (per-field failure messages)

**Simulated Intake Controls:**
- View Sample button (opens AV-05 Artifact Viewer for the synthetic sample)
- Download Sample button
- Ingest Sample button (enabled after viewing/downloading; disabled if already ingested)
- "Simulated Connector — No live connection" label (always visible)
- "Preloaded Synthetic Sample" label (always visible)

#### Phase Execution Status Indicator
Displays current execution status in sequence:
`Waiting for User Input` → `Waiting for Synthetic Sample Ingestion` → `Ready to Run` → `Processing` → `Awaiting Human Decision` → `Complete`

**Run Phase button:** Active only when status is `Ready to Run`.

#### Output Panel (1–2 outputs)
For each phase output:
- Output Name
- Artifact Type and Size Guidance
- Artifact link (opens AV-05)
- Version number
- Approval Status badge
- Approve / Request Revision buttons (visible when `AwaitingReview`)
- `Review Required` badge if `review_required = true`

#### Findings and Actions Section (this phase)
- List of findings raised in this phase (finding ID, severity, status, description summary)
- List of actions linked to this phase (action ID, blocking/parallel, status, due gate)
- Link to AV-07 for full detail

#### AI Recommendation Panel
- AI recommended outcome: `Pass` / `Conditional Pass` / `Fail`
- AI rationale (text)
- "Advisory Only — Human Decision Required" label (always visible; cannot be removed)
- Referenced finding IDs and check result IDs

#### Human Decision Control
- Gate outcome selector: radio buttons `Pass` / `Conditional Pass` / `Fail`
- Comments field (free text)
- Record Decision button
- Confirmation dialog before recording decision
- Decision cannot be recorded while phase is in `Processing` state
- Decision cannot be recorded by AI; requires a human reviewer role

**Data Sources:** `ProjectState.phases[n]`, `ProjectState.findings[]`, `ProjectState.actions[]`, `ProjectState.checkResults[]`.

---

### AV-04: Input Intake and Validation Panel

**Purpose:** Detailed view for managing both inputs of a phase, showing full intake workflow controls, validation results, and version history.

**Content:**
- Phase selector (navigate to any phase's intake panel)
- For each input:
  - Full intake workflow (same controls as AV-03 Input Readiness Panel, with additional detail)
  - **Validation Results Detail:** Per-field validation result table (field, value, rule, pass/fail, issue message)
  - **Version History:** Table of all versions (version number, timestamp, status, validation result, active indicator)
  - Diff view button: compare two selected versions (opens AV-05 with comparison mode)
  - Download artifact button for any version

**Data Sources:** `ProjectState.phases[n].externalInput`, `ProjectState.phases[n].internalInput`.

**User Interactions:** Upload file, ingest sample, view sample, download sample, compare versions, view version history.

---

### AV-05: Artifact Viewer

**Purpose:** Inline viewer for any artifact (input or output) with full version history and provenance, and comparison between original and revised versions.

**Content:**
- **Artifact Header:** Artifact name, type, phase, version, status, provenance record.
- **Content Viewer:** Renders the artifact content inline:
  - XLSX/CSV: rendered as a sortable table
  - DOCX/PDF: rendered as a document preview
- **Provenance Panel:** Source, intake behavior, system represented (if SI), generation timestamp, input version references.
- **Version Selector:** Dropdown to switch between all versions of this artifact.
- **Comparison Mode:** Side-by-side view of two selected versions; differences highlighted.
- **Download button:** Download the selected version in its original format.
- **Synthetic disclaimer:** Always visible at top of viewer.

**Data Sources:** `ProjectState.artifactRegistry[]`, artifact content store.

**User Interactions:** Select version, toggle comparison mode, download artifact.

---

### AV-06: Technical Checklist Workspace

**Purpose:** Shows the selected checklist items for the active technical review, with evidence status, action fields, and reviewer controls.

**Conditional Rendering:**
- **Shown for:** Phase 0 (Kickoff), Phase 1 (SLR), Phase 3 (Schematic/PDR), Phase 4 (PCB Layout/CDR).
- **Hidden for:** Phase 2 and Phases 5–9. For these phases, the view displays: "No technical review is mapped to this phase."

**Content (when shown):**
- **Technical Review Label:** e.g., "Phase 4 — PCB Layout Review + CDR"
- **Checklist Source Label:** "Power Supplies Technical Review Checklists — Prelim ([tab name])"
- **Checklist Table:** Selected representative items; columns:
  - Item ID
  - Checklist Item Description (from source wording)
  - Evidence Required
  - Evidence Status (Complete / Partial / Not Started)
  - Linked Artifact (artifact ID and link)
  - Action Required (if incomplete)
  - Reviewer Notes
- **Summary:** Count of complete / partial / not-started items.
- **Export:** Download checklist table as XLSX.

**Data Sources:** Reference index (checklist passages), `ProjectState.phases[n]`, `ProjectState.findings[]`.

**User Interactions:** Update evidence status, link artifact, add reviewer notes, export.

---

### AV-07: Findings and Actions Workspace

**Purpose:** Cross-phase workspace showing all findings and actions with their current status, blocking indicators, and closure evidence.

**Content:**

#### Findings Table
Columns: Finding ID | Phase | Gate | Detected By | Seeded | Description | Severity | Status | Linked Actions

- Filterable by: phase, severity, status, seeded.
- Click finding → expand row with full description and linked actions.

#### Actions Table
Columns: Action ID | Source Finding | Phase | Gate | Description | Owner Role | Blocking | Due Phase/Gate | Required Closure Evidence | Status | Human Approver | Closure Evidence Artifact

- Blocking actions surfaced prominently at top (separate "Blocking Actions" section).
- Filterable by: phase, blocking status, owner role, status.
- Click action → expand with full detail and history.

**User Interactions:**
- Approve corrective action (human action; records approver role and timestamp)
- Close action (requires providing closure evidence artifact link)
- View linked finding
- Navigate to source phase workspace

**Data Sources:** `ProjectState.findings[]`, `ProjectState.actions[]`.

---

### AV-08: Gate Review Workspace

**Purpose:** The primary gate decision surface. Built dynamically from structured ProjectState; no separate gate-pack artifact is created or emitted.

**Content:**
- **Gate Identity:** Gate number, phase name, gate state, date.
- **Inputs Reviewed:** Both inputs with artifact name, version, and validation status.
- **Outputs Reviewed:** All phase outputs with approval status and review-required indicators.
- **Deterministic Check Results:** Summary table of all check results for this phase: check type, result, threshold, status (Pass/Fail/Warning). Link to full check result detail.
- **Findings:** All findings from this phase with severity and status.
- **Open Actions:** All open actions, blocking prominently highlighted. Blocking actions prevent `Pass` selection.
- **AI Recommended Outcome:** AI recommendation (Pass / Conditional Pass / Fail) with rationale. "Advisory Only" label displayed prominently.
- **Human Comments Field:** Free text; optional.
- **Human Decision Selector:** Radio buttons `Pass` / `Conditional Pass` / `Fail`. Not pre-selected.
- **Conditional Pass Action Form:** If `Conditional Pass` selected, a form appears to define conditional actions:
  - Action description, owner role, blocking/parallel, due phase/gate, required closure evidence.
- **Record Decision Button:** Disabled until reviewer selects an outcome. Confirmation dialog required.
- **Gate Decision History:** Shows prior decisions for this gate (if retry occurred), with full provenance.

**Gate Decision Recorded Data:**
- AI recommendation (full record)
- Human disposition (free text)
- Reviewer role
- Decision (Pass / Conditional Pass / Fail)
- Comments
- Timestamp
- Artifact versions reviewed (list)
- Open conditions (for Conditional Pass)
- Full audit trail

**Enforcement:** AI cannot record a gate decision. The "Record Decision" button is a human-only control. Even in demonstration mode the button must be physically clicked by the presenter.

**Data Sources:** `ProjectState.phases[n]`, `ProjectState.gateDecisions[]`, `ProjectState.findings[]`, `ProjectState.actions[]`, `ProjectState.checkResults[]`.

---

### AV-09: Audit View

**Purpose:** Immutable, append-only display of the full project audit history including all intake events and gate decisions.

**Content:**
- **Full Intake Event Log:** All intake events for all phases, in reverse chronological order; columns: Event ID | Phase | Logical Input | Intake Behavior | User Action | System Represented | Status | Source Artifact | Normalized Artifact | Version | Validation Result | Timestamp.
- **Gate Decision History:** All gate decisions for all gates; columns: Decision ID | Gate | AI Recommendation | Human Disposition | Reviewer Role | Decision | Comments | Timestamp | Artifact Versions Reviewed.
- **All Audit Events:** Full `auditHistory[]` including phase state changes, finding raises, action approvals, check runs, version creates, output approvals, and cancellations.
- **Filters:** By event type, phase, date range.
- **Export:** Download filtered or full audit log as XLSX or JSON.

**Enforcement:**
- No edit controls; all data is read-only.
- No delete option.
- Export only; no in-place modification.
- "Immutable Record — Append Only" label visible at top of view.

**Data Sources:** `ProjectState.auditHistory[]`, `ProjectState.gateDecisions[]`.

---

### Validation Rules

- AV-06 (Technical Checklist) must be hidden (not just empty) for Phase 2 and Phases 5–9; no checklist content may appear.
- AI recommendation panel in AV-03 and AV-08 must display "Advisory Only — Human Decision Required" label at all times; the label may not be removed by configuration.
- Gate decision radio buttons in AV-03 and AV-08 must not pre-select any outcome; user must make an affirmative selection.
- Blocking actions in AV-08: if any action has `blocking = true` and `status != VerifiedClosed`, the `Pass` radio button is disabled and a message is displayed: "Blocking actions must be closed before recording a Pass outcome."
- "Simulated Connector — No live connection" label in AV-03 and AV-04 must always be visible for SI inputs; it must not be hidden or removed.
- AV-09 must be read-only; no write controls may appear on this view.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Gate decision submitted from AV-08 without reviewer role | 400 | `REVIEWER_ROLE_MISSING` | "Reviewer role is required to record a gate decision." |
| AI attempts to record gate decision | 403 | `GATE_AI_PROHIBITED` | "Gate decisions must be made by an authorized human reviewer." |
| Pass decision with open blocking actions | 409 | `BLOCKING_ACTIONS_OPEN` | "Cannot record Pass: blocking actions {list} must be closed first." |
| Checklist content requested for Phase 2 or 5–9 | 404 | `NO_CHECKLIST_MAPPED` | "No technical review is mapped to Phase {n}. Checklist Workspace is not available." |
| Audit record edit attempted | 403 | `AUDIT_IMMUTABLE` | "Audit records are immutable. No modifications are permitted." |

---

### API Surface (this feature)

See `Y1-api.md` §Views for full schemas. Summary:

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/views/project-overview` | Get Project Overview data |
| `GET` | `/api/views/lifecycle` | Get Product Lifecycle View data |
| `GET` | `/api/views/phase/{id}/workspace` | Get Phase Workspace data |
| `GET` | `/api/views/phase/{id}/intake` | Get Input Intake and Validation Panel data |
| `GET` | `/api/artifacts/{id}/viewer` | Get Artifact Viewer data |
| `GET` | `/api/views/phase/{id}/checklist` | Get Technical Checklist Workspace data |
| `GET` | `/api/views/findings-actions` | Get Findings and Actions Workspace data |
| `GET` | `/api/views/gate/{id}/review` | Get Gate Review Workspace data |
| `GET` | `/api/views/audit` | Get Audit View data |
| `GET` | `/api/views/breadcrumbs` | Get breadcrumb state for all phases |

---

### Schema Surface (this feature)

All nine views read from `ProjectState` — see `Y0-schema.md` for full schema. No view-specific schema objects; all data served from shared ProjectState fields.

---

*FRD-TTCopilot-v1.0 | F09 | Synthetic POC Data Only*
