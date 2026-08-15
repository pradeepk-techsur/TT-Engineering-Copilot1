# Screen-08: AV-09 — Audit View

**Route:** `/audit`
**Purpose:** Full immutable intake event log and gate decision history; read-only; append-only
**User Stories:** US-4.2, US-9.6
**Primary Persona:** Priya Nair, James Okoro

> **Read-only constraint:** No edit controls, no delete option. "Immutable Record — Append Only" label always visible.

---

## Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ TT Engineering Copilot              EV-INV-800 · EVINV-POC-001  [SYNTHETIC] │
├──────────────────────────────────────────────────────────────────────────────┤
│ EV-INV-800 > Phase 4: PCB Layout/CDR > Gate 4                    [breadcrumb]│
├──────────────────┬───────────────────────────────────────────────────────────┤
│ Sidebar          │ AUDIT VIEW                                                 │
│                  │ 🔒 Immutable Record — Append Only                         │
│ ○ Audit Log      │                                                            │
│                  │ ── Filters ────────────────────────────────────────────── │
│                  │ Event Type: [ All ▼ ]  Phase: [ All ▼ ]                   │
│                  │ Date Range: [ 2026-08-01 ] to [ 2026-08-15 ]              │
│                  │                              [ Apply ]  [ Export XLSX ]   │
│                  │                                        [ Export JSON ]    │
│                  │                                                            │
│                  │ ┌─ Intake Event Log ──────────────────────────────────── ┐ │
│                  │ │ (Reverse chronological order)                          │ │
│                  │ │                                                        │ │
│                  │ │ EVT-2026-0815-042 | 2026-08-13 09:15 UTC              │ │
│                  │ │ Type: USER_FILE_UPLOAD                                 │ │
│                  │ │ Phase: 4  |  Logical Input: Released Detailed Design   │ │
│                  │ │              Baseline Package                          │ │
│                  │ │ Intake Behavior: UP                                    │ │
│                  │ │ User Action: revised_version_uploaded                  │ │
│                  │ │ System Represented: —                                  │ │
│                  │ │ Status: User Input Ready                               │ │
│                  │ │ Source Artifact: EV-INV-800-DDB-Rev-B.xlsx            │ │
│                  │ │ Normalized Artifact: ART-P4-INT-v2                    │ │
│                  │ │ Version: 2                                             │ │
│                  │ │ Validation Result: Pass                                │ │
│                  │ │ ─────────────────────────────────────────────────── │ │
│                  │ │                                                        │ │
│                  │ │ EVT-2026-0812-039 | 2026-08-12 16:40 UTC              │ │
│                  │ │ Type: SIMULATED_INTAKE                                 │ │
│                  │ │ Phase: 4  |  Logical Input: DFM/Assembly/Standards Pkg │ │
│                  │ │ Intake Behavior: SI                                    │ │
│                  │ │ User Action: sample_ingested                           │ │
│                  │ │ System Represented: Standards library / supplier feed  │ │
│                  │ │ Status: Synthetic System Input Ready                   │ │
│                  │ │ Source Artifact: DFM-STD-SUPP-PKG-synthetic-v1.xlsx   │ │
│                  │ │ Normalized Artifact: ART-P4-EXT-v1                    │ │
│                  │ │ Version: 1                                             │ │
│                  │ │ Validation Result: Pass                                │ │
│                  │ └────────────────────────────────────────────────────────┘ │
│                  │                                                            │
│                  │ ┌─ Gate Decision History ────────────────────────────── ┐  │
│                  │ │                                                        │  │
│                  │ │ GD-G3-001 | 2026-08-11 15:22 UTC                      │  │
│                  │ │ Gate: 3  |  Decision: Conditional Pass 🔶             │  │
│                  │ │ AI Recommendation: Conditional Pass                    │  │
│                  │ │ Human Disposition: Conditional Pass (agreed)           │  │
│                  │ │ Reviewer Role: Technical Reviewer                      │  │
│                  │ │ Comments: "Coolant connector orientation creates        │  │
│                  │ │   assembly-access concern. Conditional Pass. Action     │  │
│                  │ │   A3-001 created — must be closed by Gate 4."          │  │
│                  │ │ Artifact Versions Reviewed:                            │  │
│                  │ │   Design Rules Pkg v1, Preliminary Design Pkg v1       │  │
│                  │ │ Open Conditions: A3-001                                │  │
│                  │ │ is_final: true                                         │  │
│                  │ │ ─────────────────────────────────────────────────── │  │
│                  │ │                                                        │  │
│                  │ │ GD-G2-001 | 2026-08-09 11:05 UTC                      │  │
│                  │ │ Gate: 2  |  Decision: Pass ✅                          │  │
│                  │ │ AI Recommendation: Pass (after clarification)          │  │
│                  │ │ Human Disposition: Pass (agreed)                       │  │
│                  │ │ Reviewer Role: Program Manager                         │  │
│                  │ │ Comments: "REQ-THERM-004 testability resolved. Rerun   │  │
│                  │ │   confirmed scoped correctly. Gate 2 Pass."            │  │
│                  │ └────────────────────────────────────────────────────────┘  │
└──────────────────┴───────────────────────────────────────────────────────────┘
```

---

## Intake Event Log — All Fields

| Field | Description |
|-------|-------------|
| Event ID | UUID (EVT-…) |
| Event Type | USER_FILE_UPLOAD / SIMULATED_INTAKE |
| Phase | 0–9 |
| Logical Input | Name of the input (e.g., "Customer Opportunity Package") |
| Intake Behavior | UP / SI |
| User Action | file_uploaded / sample_ingested / revised_version_uploaded / revised_sample_ingested |
| System Represented | Enterprise system label (SI only) |
| Status | User Input Ready / Synthetic System Input Ready |
| Source Artifact | Original file / synthetic sample filename |
| Normalized Artifact | Internal artifact ID |
| Version | Integer (1 = first; 2 = revised, etc.) |
| Validation Result | Pass / Fail + issues array |
| Timestamp | ISO 8601 UTC |

---

## Gate Decision History — All Fields

| Field | Description |
|-------|-------------|
| Decision ID | GD-G{n}-{seq} |
| Gate | 0–9 |
| AI Recommendation | Text of AI recommended outcome |
| Human Disposition | Pass / Conditional Pass / Fail |
| Reviewer Role | Role of human who recorded decision |
| Decision | Pass / Conditional Pass / Fail |
| Comments | Free text entered by human |
| Timestamp | ISO 8601 UTC |
| Artifact Versions Reviewed | IDs of active artifact versions at decision time |
| Open Conditions | Conditional Pass action IDs (if applicable) |
| is_final | Always true (immutable) |

---

## States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| No events yet | Empty state | "No audit events recorded yet." |
| Read-only mode | 🔒 icon + banner; no edit controls anywhere | "Immutable Record — Append Only" |
| Filter applied | Filtered event list | Count of events shown: "Showing 12 of 47 events" |
| Export in progress | Loading state on export buttons | Spinner |

---

## Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| Event Type filter | Select | Filters to USER_FILE_UPLOAD / SIMULATED_INTAKE / GATE_DECISION / etc. |
| Phase filter | Select | Filters to Phase N |
| Date Range filter | Date pickers | Filters by event timestamp range |
| "Export XLSX" | Export | Downloads filtered log as XLSX |
| "Export JSON" | Export | Downloads filtered log as JSON |
| Event row | Expandable | Shows all 9+ fields for that event |

> **No write controls anywhere on this view.** No edit button, no delete button, no approve button.

---

*UX-Mockup-TTCopilot | Screen-08 AV-09 | 2026-08-15 | Synthetic POC Data Only*
