# Screen-05: AV-06 — Technical Checklist Workspace

**Route:** `/phases/:phaseId/checklist`
**Purpose:** Structured technical review checklist with evidence, status, and action fields
**User Stories:** US-9.3
**Primary Persona:** Marcus Webb

> **Scope constraint:** Renders checklist content ONLY for Phases 0, 1, 3, 4.
> For Phase 2 and Phases 5–9: displays "No technical review is mapped to this phase."

---

## Layout — Phase 4 (PCB Layout Review + CDR)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ TT Engineering Copilot              EV-INV-800 · EVINV-POC-001  [SYNTHETIC] │
├──────────────────────────────────────────────────────────────────────────────┤
│ EV-INV-800 > Phase 4: PCB Layout/CDR > Gate 4                    [breadcrumb]│
├──────────────────┬───────────────────────────────────────────────────────────┤
│ Sidebar          │ TECHNICAL CHECKLIST WORKSPACE — Phase 4                   │
│                  │                                                            │
│                  │ Checklist Source:                                          │
│                  │ Power Supplies Technical Review Checklists — Prelim        │
│                  │ (PCB Layout Review tab; selected Mechanical Review and     │
│                  │  TRR items)                                                │
│                  │                                                            │
│                  │ Summary: 8 Complete ✅  |  3 Partial ⚠️  |  2 Not Started ○│
│                  │                                                            │
│                  │ [ Export Checklist as XLSX ]                               │
│                  │                                                            │
│                  │ ┌─ Checklist Table ─────────────────────────────────────┐ │
│                  │ │ ID     │ Checklist Item         │ Evidence  │ Status  │ │
│                  │ │ ──────────────────────────────────────────────────── │ │
│                  │ │ CL-4-01│ HV creepage and clear- │ HV clear. │ ✅      │ │
│                  │ │        │ ance verified against  │ check rpt │ Complete│ │
│                  │ │        │ applicable standard    │ HC-P4-001 │         │ │
│                  │ │ ──────────────────────────────────────────────────── │ │
│                  │ │ CL-4-02│ Component derating     │ Derating  │ ✅      │ │
│                  │ │        │ reviewed for all stress │ check rpt │ Complete│ │
│                  │ │        │ -sensitive components  │ DR-P4-001 │         │ │
│                  │ │ ──────────────────────────────────────────────────── │ │
│                  │ │ CL-4-03│ Test points accessible │ TP check  │ ✅      │ │
│                  │ │        │ for all diagnostic nets│ TP-P4-001 │ Complete│ │
│                  │ │ ──────────────────────────────────────────────────── │ │
│                  │ │ CL-4-04│ BOM and schematic ref  │ Cross-art │ ✅      │ │
│                  │ │        │ designators consistent │ CA-P4-001 │ Complete│ │
│                  │ │ ──────────────────────────────────────────────────── │ │
│                  │ │ CL-4-05│ Thermal simulation     │ [link]    │ ⚠️      │ │
│                  │ │        │ completed for all power│           │ Partial │ │
│                  │ │        │ components             │           │         │ │
│                  │ │        │ Action: Upload thermal  │           │         │ │
│                  │ │        │ analysis report         │           │         │ │
│                  │ │ ──────────────────────────────────────────────────── │ │
│                  │ │ CL-4-06│ Design freeze confirmed│ None      │ ○       │ │
│                  │ │        │ by Engineering Manager │           │ Not     │ │
│                  │ │        │                        │           │ Started │ │
│                  │ └────────────────────────────────────────────────────────┘ │
│                  │                                                            │
│                  │   [← Back to Phase Workspace]                              │
└──────────────────┴───────────────────────────────────────────────────────────┘
```

---

## Layout — Phase 2 or Phases 5–9 (No Checklist Mapped)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ...breadcrumb...                                                              │
├──────────────────┬───────────────────────────────────────────────────────────┤
│ Sidebar          │ TECHNICAL CHECKLIST WORKSPACE — Phase 5                   │
│                  │                                                            │
│                  │ ┌──────────────────────────────────────────────────────┐  │
│                  │ │                                                       │  │
│                  │ │   No technical review is mapped to this phase.        │  │
│                  │ │                                                       │  │
│                  │ │   Technical reviews are defined for:                  │  │
│                  │ │   • Phase 0 — Kickoff                                 │  │
│                  │ │   • Phase 1 — System Level Review (SLR)               │  │
│                  │ │   • Phase 3 — Schematic Review / PDR                  │  │
│                  │ │   • Phase 4 — PCB Layout Review + CDR                 │  │
│                  │ │                                                       │  │
│                  │ └──────────────────────────────────────────────────────┘  │
│                  │                                                            │
│                  │   [← Back to Phase Workspace]                              │
└──────────────────┴───────────────────────────────────────────────────────────┘
```

---

## Checklist Table Columns

| Column | Description |
|--------|-------------|
| Item ID | Stable ID from checklist source (e.g., CL-4-01) |
| Checklist Item Description | Exact wording from Power Supplies Checklists — Prelim |
| Evidence Required | What evidence is expected |
| Evidence Status | Complete ✅ / Partial ⚠️ / Not Started ○ |
| Linked Artifact | Artifact ID + clickable link to AV-05 |
| Action Required | Free-text action if item is incomplete |
| Reviewer Notes | Free-text reviewer commentary |

---

## Technical Review Mapping

| Phase | Technical Review | Checklist Tab |
|-------|-----------------|---------------|
| 0 | Kickoff | Kickoff tab |
| 1 | SLR | SLR tab |
| 2 | **None** | — (shows empty state) |
| 3 | Schematic Review / PDR | Schematic Review tab |
| 4 | PCB Layout Review + CDR | PCB Layout tab + selected Mechanical Review + TRR |
| 5–9 | **None** | — (shows empty state) |

---

## States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Phase with checklist (default) | Full table | Item count summary line |
| Phase without checklist | Empty state panel | Message + list of phases that have reviews |
| Item: Complete | Green ✅ badge | Evidence artifact linked |
| Item: Partial | Amber ⚠️ badge | Action Required field visible |
| Item: Not Started | Grey ○ badge | Action Required field editable |

---

## Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| Linked Artifact | Link | Opens AV-05 for that artifact |
| Evidence Status dropdown | Select per row | Change item status |
| Action Required field | Editable text per row | Records required action |
| Reviewer Notes field | Editable text per row | Records reviewer commentary |
| "Export Checklist as XLSX" | Export | Downloads current checklist as XLSX |

---

*UX-Mockup-TTCopilot | Screen-05 AV-06 | 2026-08-15 | Synthetic POC Data Only*
