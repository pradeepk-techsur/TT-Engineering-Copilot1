# Screen-00: AV-01 — Project Overview

**Route:** `/`
**Purpose:** Program status at a glance — identity, phase health, open issues
**User Stories:** US-9.1, US-0.3, US-4.1, US-10.3
**Primary Persona:** Priya Nair

---

## Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ TT Engineering Copilot              EV-INV-800 · EVINV-POC-001  [SYNTHETIC] │
├──────────────────────────────────────────────────────────────────────────────┤
│ EV-INV-800 > Phase 4: PCB Layout/CDR > Gate 4                    [breadcrumb]│
├──────────────────┬───────────────────────────────────────────────────────────┤
│ Sidebar          │ PROJECT OVERVIEW                                           │
│                  │                                                            │
│ ● Project        │ ┌─ Project Identity ──────────────────────────────────┐   │
│   Overview       │ │ Project ID:     EVINV-POC-001                       │   │
│ ○ Lifecycle      │ │ Product:        EV-INV-800 Demonstration Traction    │   │
│ ○ Findings       │ │                 Inverter                             │   │
│ ○ Audit Log      │ │ Type:           NPI A / Category 1                  │   │
│                  │ │ Current Phase:  4 — PCB Layout Review + CDR          │   │
│ ── Phases ──     │ │ Current Gate:   Gate 4                              │   │
│ P0 ✅            │ │ Project Status: Active                               │   │
│ P1 ✅            │ │                                                      │   │
│ P2 ✅            │ │ ┌──────────────────────────────────────────────────┐ │   │
│ P3 🔶            │ │ │ ⚠️  SYNTHETIC POC DATA                          │ │   │
│ P4 ▶ (current)   │ │ │ Not TT Electronics Product Data.                 │ │   │
│ P5 ○             │ │ │ Not for Design, Fabrication, Certification,      │ │   │
│ P6 ○             │ │ │ Procurement, or Production.                      │ │   │
│ P7 ○             │ │ └──────────────────────────────────────────────────┘ │   │
│ P8 ○             │ └──────────────────────────────────────────────────────┘   │
│ P9 ○             │                                                            │
│                  │ ┌─ Project Health Indicators ──────────────────────────┐   │
│                  │ │  Open Findings:  2 Critical  1 Major  0 Minor        │   │
│                  │ │  Open Actions:   3 Blocking  1 Non-Blocking          │   │
│                  │ │  Phases Complete: 3 of 10                            │   │
│                  │ │  Last Gate:      Gate 3 — Conditional Pass           │   │
│                  │ │                  2026-08-14                          │   │
│                  │ └──────────────────────────────────────────────────────┘   │
│                  │                                                            │
│                  │ ┌─ Phase Summary Table ─────────────────────────────────┐  │
│                  │ │ Phase│Tech Review    │Gate│Status         │Gate Outcome│  │
│                  │ │──────┼───────────────┼────┼───────────────┼────────────│  │
│                  │ │  0   │Kickoff        │ G0 │Complete       │Pass ✅     │  │
│                  │ │  1   │SLR            │ G1 │Complete       │Pass ✅     │  │
│                  │ │  2   │—              │ G2 │Complete       │Pass ✅     │  │
│                  │ │  3   │Schematic/PDR  │ G3 │Cond. Pass 🔶  │Cond.Pass   │  │
│                  │ │  4   │PCB Layout/CDR │ G4 │Current ▶      │Pending     │  │
│                  │ │  5   │—              │ G5 │Upcoming ○     │—           │  │
│                  │ │  6   │—              │ G6 │Upcoming ○     │—           │  │
│                  │ │  7   │—              │ G7 │Upcoming ○     │—           │  │
│                  │ │  8   │—              │ G8 │Upcoming ○     │—           │  │
│                  │ │  9   │—              │ G9 │Upcoming ○     │—           │  │
│                  │ └──────────────────────────────────────────────────────┘   │
│                  │                                    [View Lifecycle →]      │
└──────────────────┴───────────────────────────────────────────────────────────┘
```

---

## Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Project identity (ID, product, type, status) | Top card, always visible |
| Primary | Synthetic Data badge | Prominent yellow/amber banner in identity card |
| Secondary | Health indicators (findings, actions, phases complete) | Below identity card |
| Secondary | Current phase/gate | Identity card |
| Tertiary | Full 10-phase summary table | Below health indicators |

---

## States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Default | Identity card + health + table | Static |
| Blocking action present | Health indicator counter red; opens AV-07 on click | "N Blocking Actions" badge with red background |
| All phases complete | Phase Summary all green ✅ | "Project Status: Closed" + 🔒 badge |
| Synthetic POC always | Yellow/amber disclaimer banner in identity card | Cannot be hidden |

---

## Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| Phase row in summary table | Clickable row | Navigate to AV-03 for that phase |
| "View Lifecycle →" button | Navigation link | Navigate to AV-02 |
| Sidebar phase shortcut (P0–P9) | Nav links | Navigate to AV-03 for that phase |
| Health indicator "Open Findings" | Clickable count | Navigate to AV-07 filtered by open |
| Health indicator "Blocking Actions" | Clickable count | Navigate to AV-07 filtered by blocking |
| Breadcrumb phase segment | Clickable (if Completed/Current/AwaitingDecision/ConditionalPass) | Navigate to AV-03 |

---

*UX-Mockup-TTCopilot | Screen-00 AV-01 | 2026-08-15 | Synthetic POC Data Only*
