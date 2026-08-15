# Screen-04: AV-05 — Artifact Viewer

**Route:** `/artifacts/:artifactId` (single); `/artifacts/:artifactId/compare/:v1/:v2` (comparison)
**Purpose:** View/download any artifact with version history, provenance, and side-by-side comparison
**User Stories:** US-3.3, US-5.1–US-5.4, US-8.3
**Primary Personas:** Marcus Webb, James Okoro, Claire Ashby

---

## Layout — Single Version Mode

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ TT Engineering Copilot              EV-INV-800 · EVINV-POC-001  [SYNTHETIC] │
├──────────────────────────────────────────────────────────────────────────────┤
│ EV-INV-800 > Phase 4: PCB Layout/CDR > Gate 4                    [breadcrumb]│
├──────────────────┬───────────────────────────────────────────────────────────┤
│ Sidebar          │ ARTIFACT VIEWER                                            │
│                  │                                                            │
│                  │ ╔════════════════════════════════════════════════════════╗ │
│                  │ ║ ⚠️  SYNTHETIC POC DATA                                ║ │
│                  │ ║ Not TT Electronics Product Data. Not for Design,      ║ │
│                  │ ║ Fabrication, Certification, Procurement, or Production.║ │
│                  │ ╚════════════════════════════════════════════════════════╝ │
│                  │                                                            │
│                  │ ┌─ Artifact Identity ──────────────────────────────────┐  │
│                  │ │ DFM & Standards Audit                                │  │
│                  │ │ Type: XLSX  |  Phase: 4  |  Gate: 4                  │  │
│                  │ │ Version: v2 (Active) ✅                              │  │
│                  │ │                                                      │  │
│                  │ │ Version: [ v2 (Active) ▼ ]  [ Compare two versions ]│  │
│                  │ └──────────────────────────────────────────────────────┘  │
│                  │                                                            │
│                  │ ┌─────────────────────────────────────────────────────┐   │
│                  │ │ CONTENT PREVIEW                                     │   │
│                  │ │ ─────────────────────────────────────────────────── │   │
│                  │ │ [Rendered XLSX table — scrollable]                  │   │
│                  │ │ Row │ Check ID  │ Description      │ Status         │   │
│                  │ │  1  │ HC-P4-001 │ HV Clearance...  │ ✅ Pass (v2)  │   │
│                  │ │  2  │ DR-P4-001 │ Derating C_BULK_3│ ✅ Pass (v2)  │   │
│                  │ │  3  │ TP-P4-001 │ DIAG_TEMP_IGBT   │ ✅ Pass (v2)  │   │
│                  │ │  4  │ CA-P4-001 │ C_HV_1 footprint │ ✅ Pass (v2)  │   │
│                  │ │ ...                                                 │   │
│                  │ └─────────────────────────────────────────────────────┘   │
│                  │                                                            │
│                  │ ┌─ Provenance ─────────────────────────────────────────┐  │
│                  │ │ Artifact ID:        ART-P4-OUT1-v2                   │  │
│                  │ │ Source:             AgentGenerated                   │  │
│                  │ │ Intake Behavior:    —                                │  │
│                  │ │ System Represented: —                                │  │
│                  │ │ Generation Time:    2026-08-13 10:45 UTC             │  │
│                  │ │ Input Version Refs: DDB-v2 (internal), DFM-STD-v1   │  │
│                  │ │ Disclaimer Present: Yes                              │  │
│                  │ └──────────────────────────────────────────────────────┘  │
│                  │                                                            │
│                  │        [ Download v2 (XLSX) ]       [ ← Back ]           │
└──────────────────┴───────────────────────────────────────────────────────────┘
```

---

## Layout — Comparison Mode

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ TT Engineering Copilot              EV-INV-800 · EVINV-POC-001  [SYNTHETIC] │
├──────────────────────────────────────────────────────────────────────────────┤
│ EV-INV-800 > Phase 4: PCB Layout/CDR > Gate 4                    [breadcrumb]│
├──────────────────┬───────────────────────────────────────────────────────────┤
│ Sidebar          │ ARTIFACT VIEWER — COMPARISON MODE                         │
│                  │                                                            │
│                  │ ╔═══════════════════════════════════════════════════════╗  │
│                  │ ║ ⚠️  SYNTHETIC POC DATA — Both versions               ║  │
│                  │ ╚═══════════════════════════════════════════════════════╝  │
│                  │                                                            │
│                  │ Comparing: [ v1 (Original) ▼ ]  ↔  [ v2 (Revised) ▼ ]   │
│                  │                                                            │
│                  │ ┌──────────────────────────┬───────────────────────────┐  │
│                  │ │ v1 — Original            │ v2 — Revised              │  │
│                  │ │ 2026-08-10 · Fail ❌     │ 2026-08-13 · Pass ✅    │  │
│                  │ │ Input: DDB-Rev-A (v1)    │ Input: DDB-Rev-B (v2)    │  │
│                  │ ├──────────────────────────┼───────────────────────────┤  │
│                  │ │ Check     │ Result        │ Check     │ Result        │  │
│                  │ │ HV Clear  │ 6.2mm ❌      │ HV Clear  │ 9.1mm ✅   │  │← diff highlighted
│                  │ │ C_BULK_3  │ 4.4%  ❌      │ C_BULK_3  │ 52.2% ✅   │  │← diff highlighted
│                  │ │ DIAG_TEMP │ No TP  ❌     │ DIAG_TEMP │ TP-IGBT ✅  │  │← diff highlighted
│                  │ │ C_HV_1    │ 0805   ❌     │ C_HV_1    │ 1206    ✅  │  │← diff highlighted
│                  │ ├──────────────────────────┼───────────────────────────┤  │
│                  │ │ [ Download v1 ]          │ [ Download v2 ]            │  │
│                  │ └──────────────────────────┴───────────────────────────┘  │
│                  │                                                            │
│                  │ Changed rows: 4 of 4  |  Unchanged rows: 0              │  │
│                  │                                          [ ← Back ]       │
└──────────────────┴───────────────────────────────────────────────────────────┘
```

---

## Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Synthetic data disclaimer | Persistent amber/red banner — ALWAYS first element |
| Primary | Content preview (table or document) | Center panel |
| Secondary | Version selector + comparison trigger | Below artifact identity |
| Secondary | Provenance panel | Below content |
| Tertiary | Download button | Footer of each panel |

---

## States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Single version | Full-width content + provenance | Standard view |
| Comparison mode | Two-column fixed layout; diff cells highlighted yellow | Changed rows count badge |
| XLSX artifact | Rendered table, scrollable | Column headers pinned |
| DOCX/PDF artifact | Page-by-page render or embedded PDF viewer | Page N of M counter |
| Loading | Skeleton in content area | "Loading artifact..." |
| Error (artifact not found) | Error state | "Artifact not found. It may have been superseded." |
| SI artifact (synthetic) | Provenance shows "System Represented" | "Preloaded Synthetic Sample" label in provenance |

---

## Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| Version dropdown | Select | Loads selected version in single-view mode |
| "Compare two versions" | Button | Opens version pair selector → comparison mode |
| Comparison version dropdowns | 2× Select | User selects v1 and v2 for comparison |
| "Download [version]" | Download | Downloads file in original format (XLSX/DOCX/PDF) |
| "← Back" | Navigation link | Returns to calling view (AV-03, AV-04, AV-08) |

---

*UX-Mockup-TTCopilot | Screen-04 AV-05 | 2026-08-15 | Synthetic POC Data Only*
