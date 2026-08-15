# Screen-03: AV-04 — Input Intake and Validation Panel

**Route:** `/phases/:phaseId/intake`
**Purpose:** Detailed input management — full intake workflow, per-field validation, version history, diff controls
**User Stories:** US-2.5, US-3.1, US-3.2, US-3.3
**Primary Personas:** Priya Nair, Claire Ashby

---

## Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ TT Engineering Copilot              EV-INV-800 · EVINV-POC-001  [SYNTHETIC] │
├──────────────────────────────────────────────────────────────────────────────┤
│ EV-INV-800 > Phase 4: PCB Layout/CDR > Gate 4                    [breadcrumb]│
├──────────────────┬───────────────────────────────────────────────────────────┤
│ Sidebar          │ INPUT INTAKE AND VALIDATION PANEL                         │
│                  │                                                            │
│                  │ Phase: [ Phase 4 — PCB Layout/CDR  ▼ ]  ← phase selector │
│                  │                                                            │
│                  │ ┌─────────────────────┬────────────────────────────────┐  │
│                  │ │ External Input      │ Internal Input                  │  │
│                  │ │ [SI] DFM/Assembly/  │ [UP] Released Detailed Design  │  │
│                  │ │ Standards Package   │ Baseline Package                │  │
│                  │ └─────────────────────┴────────────────────────────────┘  │
│                  │                                                            │
│                  │ ── Currently selected: Internal Input (UP) ──             │
│                  │                                                            │
│                  │ ┌─ Intake Workflow ─────────────────────────────────────┐ │
│                  │ │ Artifact: Released Detailed Design Baseline Package    │ │
│                  │ │ Intake:   User-Provided File (UP)                      │ │
│                  │ │ Format:   XLSX / DOCX / PDF  |  Size: ≤10 rows / 2pp  │ │
│                  │ │                                                        │ │
│                  │ │ Active Version: v2 (Revised) ✅ Ready                  │ │
│                  │ │ Ingested: 2026-08-13 09:15 UTC                         │ │
│                  │ │                                                        │ │
│                  │ │ [ Upload Revised Version ]  [ View ]  [ Download ]     │ │
│                  │ └────────────────────────────────────────────────────────┘ │
│                  │                                                            │
│                  │ ┌─ Per-Field Validation Results ────────────────────────┐ │
│                  │ │ Field              │ Value        │ Rule    │ Result   │ │
│                  │ │ ──────────────────────────────────────────────────    │ │
│                  │ │ Project ID         │ EVINV-POC-001│ match   │ ✅ Pass  │ │
│                  │ │ Product Name       │ EV-INV-800   │ match   │ ✅ Pass  │ │
│                  │ │ Phase              │ 4            │ match   │ ✅ Pass  │ │
│                  │ │ Revision           │ Rev B        │ present │ ✅ Pass  │ │
│                  │ │ Row Count          │ 8 rows       │ ≤10     │ ✅ Pass  │ │
│                  │ │ Identifier Unique  │ Yes          │ unique  │ ✅ Pass  │ │
│                  │ │ Units Present      │ Yes          │ present │ ✅ Pass  │ │
│                  │ └────────────────────────────────────────────────────────┘ │
│                  │                                                            │
│                  │ ┌─ Version History ─────────────────────────────────────┐ │
│                  │ │ Ver │ Timestamp           │ Status    │ Validation  │ A │ │
│                  │ │ ─────────────────────────────────────────────────── │ │
│                  │ │ v2  │ 2026-08-13 09:15 UTC│ ✅ Ready  │ Pass        │ ● │ │
│                  │ │ v1  │ 2026-08-10 14:20 UTC│ Superseded│ Pass        │ ○ │ │
│                  │ │                                                        │ │
│                  │ │ [ Compare v1 ↔ v2 ]  ← opens AV-05 comparison mode   │ │
│                  │ │ [ Download v1 ]  [ Download v2 ]                      │ │
│                  │ └────────────────────────────────────────────────────────┘ │
│                  │                                                            │
│                  │ ┌─ Intake Audit Events (this input) ───────────────────┐  │
│                  │ │ [2026-08-13 09:15] revised_version_uploaded — v2     │  │
│                  │ │   Operator: marcus.webb | Validation: Pass            │  │
│                  │ │ [2026-08-10 14:20] file_uploaded — v1                │  │
│                  │ │   Operator: marcus.webb | Validation: Pass            │  │
│                  │ └──────────────────────────────────────────────────────┘  │
│                  │                          [← Back to Phase Workspace]      │
└──────────────────┴───────────────────────────────────────────────────────────┘
```

---

## Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Active version status + required action | Top of intake workflow card |
| Primary | Validation result (Pass/Fail with detail) | Per-field table, immediately visible |
| Secondary | Version history | Collapsible section below validation |
| Tertiary | Per-input audit event log | Below version history |

---

## States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| First-time / No file uploaded | Empty upload zone with guidance | "Upload [Artifact Name]" prompt |
| File being validated | Spinner in validation section | "Validating..." |
| Validation failed | Red error per failing field | Error code + plain-language message |
| Validated, active | Green status + "Upload Revised Version" | "[Artifact Name] received and validated. Version [n] active." |
| SI — pre-ingestion | Synthetic sample card with View/Download | "Ingest Sample" button (disabled until viewed) |
| SI — revised sample available | Amber banner | "Revised Synthetic System Sample Available — [System]" |
| Version history: diff mode | Two-column compare (links to AV-05) | Highlights changed fields |

---

## Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| Phase selector dropdown | Select | Loads intake detail for selected phase |
| External/Internal input tabs | Tab | Switches between the two input panels |
| "Upload Revised Version" | File upload CTA | New version created; prior retained |
| "Compare v1 ↔ v2" | Action button | Opens AV-05 in comparison mode |
| Version row [Download] | Download per version | Downloads that specific version's file |
| "Ingest Sample" | CTA (SI only) | Requires prior View/Download; confirmation dialog |
| "← Back to Phase Workspace" | Navigation link | Returns to AV-03 |

---

*UX-Mockup-TTCopilot | Screen-03 AV-04 | 2026-08-15 | Synthetic POC Data Only*
