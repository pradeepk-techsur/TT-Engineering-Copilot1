# UX Mockup — TT Manufacturing and Engineering Copilot

**Project:** EVINV-POC-001 — EV-INV-800 Demonstration Traction Inverter
**Generated:** 2026-08-15
**Based on:** UserStories-TTCopilot.md, PRD-TTCopilot.md, FRD-TTCopilot.md, JOURNEYS-TTCopilot.md, PROJECT.md
**Classification:** Internal POC — Synthetic Data Only

> **Synthetic POC Data. Not TT Electronics Product Data. Not for Design, Fabrication, Certification, Procurement, or Production.**

---

## 1. UX Approach and Design Principles

### Primary Surface
The Web Gate Cockpit is the **sole** human-in-the-loop interface. It is purpose-built for structured engineering governance — not a generic chatbot. Every screen communicates phase state, input readiness, and human decision authority at a glance.

### Design Principles

| # | Principle | Rationale |
|---|-----------|-----------|
| 1 | **Human authority is never ambiguous** | Gate decision controls must be prominent, require explicit action, and never auto-submit. |
| 2 | **Status before detail** | Every view surfaces the current phase/gate state and blocking issues before detailed content. |
| 3 | **No silent actions** | Simulated ingestion, corrective action approval, and gate recording always require explicit user clicks with confirmation dialogs. |
| 4 | **Synthetic is always labeled** | The disclaimer banner and "Preloaded Synthetic Sample" / "Simulated Connector" labels appear wherever synthetic data is displayed. Never "Connected to", "Retrieved from", or "Live … Data". |
| 5 | **Breadcrumb as navigation spine** | The persistent breadcrumb on all nine views is the primary wayfinding mechanism — every phase is reachable without going back to the home screen. |
| 6 | **Progressive disclosure** | Summary cards surface the most critical signals (blocked, fail, awaiting decision); detail is one click away. |
| 7 | **Immutable audit identity** | Audit View (AV-09) is visually distinct from all write-capable views — read-only icon, no edit controls, "Immutable Record — Append Only" label always visible. |
| 8 | **Intake mode clarity** | User-Provided File (UP) and Simulated External-System Intake (SI) inputs are visually differentiated by icon and badge, never conflated. |

### Terminology Constraints (Hard Rules)

| ❌ Prohibited | ✅ Required |
|---|---|
| "Connected to [SYSTEM]" | "Simulated Connector" |
| "Retrieved from [SYSTEM]" | "Preloaded Synthetic Sample" |
| "Live [SYSTEM] Data" | "Synthetic System Input" |
| "replacement input" | "revised version" / "Upload Revised Version" |
| Technical reviews for Phase 2, 5–9 | "No technical review is mapped to this phase" |
| AI auto-approving a gate | Human-only "Record Decision" button with confirmation dialog |

---

## 2. Persona Summary

| Persona | Role | Primary Views |
|---------|------|---------------|
| **Marcus Webb** | Engineering / Technical Reviewer | AV-03, AV-05, AV-06, AV-07, AV-08 |
| **Priya Nair** | Program / Project Manager | AV-01, AV-02, AV-07, AV-08, AV-09 |
| **Claire Ashby** | Commercial / Proposal Reviewer | AV-03, AV-04, AV-05, AV-08 |
| **James Okoro** | Quality / Manufacturing Engineer | AV-03, AV-05, AV-07, AV-08, AV-09 |

---

## 3. Navigation Map

> **Invariant — no orphan screens:** every screen listed here has at least one inbound path traceable back to the app shell (left sidebar navigation or breadcrumb). Modal/detail panels reached from a parent are noted accordingly.

| Screen | Route | Reached from | Nav element |
|--------|-------|--------------|-------------|
| AV-01 Project Overview | `/` | App shell | Sidebar: "Project Overview" |
| AV-02 Product Lifecycle View | `/lifecycle` | App shell; AV-01 "View Lifecycle" button | Sidebar: "Lifecycle"; AV-01 shortcut |
| AV-03 Phase Workspace | `/phases/:phaseId` | AV-02 phase node click; breadcrumb phase segment click; AV-07 "Navigate to source phase" link | Breadcrumb; AV-02 node; AV-07 link |
| AV-04 Input Intake and Validation Panel | `/phases/:phaseId/intake` | AV-03 "Open Intake Detail" link on either input card | AV-03 input card link |
| AV-05 Artifact Viewer | `/artifacts/:artifactId` (single); `/artifacts/:artifactId/compare/:v1/:v2` (compare) | AV-03 output card "View" button; AV-04 version history row; AV-06 checklist "Linked Artifact" link; AV-08 artifact row "View" button | Multiple parent views |
| AV-06 Technical Checklist Workspace | `/phases/:phaseId/checklist` | AV-03 "Open Checklist" button (Phases 0,1,3,4 only); Sidebar: "Checklists" | Sidebar; AV-03 button |
| AV-07 Findings and Actions Workspace | `/findings` | App shell; AV-03 "View All Findings" link; AV-08 finding row link | Sidebar: "Findings & Actions"; AV-03 link; AV-08 link |
| AV-08 Gate Review Workspace | `/gates/:gateId/review` | AV-02 gate node click; AV-03 "Open Gate Review" button (when phase AwaitingGate); breadcrumb gate segment | AV-02 node; AV-03 button; breadcrumb |
| AV-09 Audit View | `/audit` | App shell | Sidebar: "Audit Log" |

---

## 4. Global Shell Layout

All nine views share the same outer shell:

```
┌────────────────────────────────────────────────────────────────────────┐
│ TT Engineering Copilot    EV-INV-800 · EVINV-POC-001   [SYNTHETIC POC]│ ← Top bar
├──────────┬─────────────────────────────────────────────────────────────┤
│          │ ┌ Breadcrumb ───────────────────────────────────────────── ┐│
│ Sidebar  │ │ EV-INV-800 > Phase N: [Name] > [Tech Review] > Gate N    ││
│          │ └──────────────────────────────────────────────────────────┘│
│ ○ Project│                                                              │
│   Overview│         [ View content area ]                              │
│ ○ Lifecycle│                                                            │
│ ○ Findings│                                                             │
│ ○ Audit  │                                                              │
│   Log    │                                                              │
│          │                                                              │
│ ── Phase ─│                                                             │
│ shortcuts│                                                              │
│ (P0–P9)  │                                                              │
└──────────┴─────────────────────────────────────────────────────────────┘
```

### Persistent Breadcrumb States

| State | Indicator | Color | Interactive? |
|-------|-----------|-------|-------------|
| Completed | ✅ | Green | Yes → AV-03 |
| Current | ▶ | Blue | Yes → AV-03 |
| Awaiting Human Decision | ⏳ | Amber | Yes → AV-03 |
| Conditional Pass | 🔶 | Orange | Yes → AV-03 |
| Blocked | ⛔ | Red | No |
| Upcoming | ○ | Grey | No |
| Closed | 🔒 | Grey | No |

Technical review segment (where mapped): `Phase 0: Kickoff`, `Phase 1: SLR`, `Phase 3: Schematic/PDR`, `Phase 4: PCB Layout/CDR`. No segment for Phase 2 or Phases 5–9.

---

## 5. Phase-Level Status Quick Reference

| Phase | External Input | Internal Input | Technical Review | Seeded Issue |
|-------|---------------|----------------|-----------------|--------------|
| 0 | Customer Opportunity Package (UP) | Capability & Opportunity Assessment (SI: Salesforce/Cora) | Kickoff | — |
| 1 | Customer Requirements/Pricing (UP) | Preliminary Cost & Resource (SI: Cora/historical) | SLR | — |
| 2 | Customer & Standards Requirements (UP) | Draft System Requirements (SI: repo/Cora) | None | REQ-THERM-004 testability |
| 3 | Design Rules & Capabilities (SI: standards library) | Preliminary Design Package (UP) | Schematic/PDR | Coolant connector orientation → Conditional Pass |
| 4 | DFM/Assembly/Standards/Supplier-Risk (SI) | Released Detailed Design Baseline (UP) | PCB Layout/CDR | 4 issues: clearance, derating, test-point, cross-artifact |
| 5 | Test Methods/Acceptance (SI) | Validation Evidence Package (UP) | None | TP-CASE-1 91°C vs ≤85°C |
| 6 | Customer Production-Readiness (UP) | Manufacturing Process & Capability (SI: MES/quality) | None | Cpk 0.87 vs 1.33 |
| 7 | Customer Field Feedback (UP) | Transfer/Defects/Yield (SI: Cora/MES/CAPA) | None | Torque variation |
| 8 | Supplier Lifecycle/Availability (SI) | Production/BOM/Yield/Cost (SI: ERP/MES/PLM) | None | IGBT-HV-800-A obsolescence |
| 9 | Customer EOL/Last-Time-Buy (UP) | Final Product/Asset/Archive (SI: ERP/Cora) | None | — |

---

*UX-Mockup-TTCopilot | 00-overview | 2026-08-15 | Synthetic POC Data Only*
