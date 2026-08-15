# Screen-01: AV-02 — Product Lifecycle View

**Route:** `/lifecycle`
**Purpose:** Visual timeline of all 10 phases/gates; selectable breadcrumb navigation
**User Stories:** US-9.1, US-0.3
**Primary Persona:** Priya Nair

---

## Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ TT Engineering Copilot              EV-INV-800 · EVINV-POC-001  [SYNTHETIC] │
├──────────────────────────────────────────────────────────────────────────────┤
│ EV-INV-800 > Phase 4: PCB Layout/CDR > Gate 4                    [breadcrumb]│
├──────────────────┬───────────────────────────────────────────────────────────┤
│ Sidebar          │ PRODUCT LIFECYCLE VIEW — ENG 001 v4.1                     │
│                  │                                                            │
│ ○ Project        │  ← Scroll left/right if viewport < 1200px →              │
│   Overview       │                                                            │
│ ● Lifecycle      │  ┌──────────┐   ┌──────────┐   ┌──────────┐             │
│ ○ Findings       │  │ Phase 0  │   │ Phase 1  │   │ Phase 2  │  ...        │
│ ○ Audit Log      │  │ Kickoff  │   │ SLR      │   │ (none)   │             │
│                  │  │ ✅ Pass  │   │ ✅ Pass  │   │ ✅ Pass  │             │
│ ── Phases ──     │  └────┬─────┘   └────┬─────┘   └────┬─────┘             │
│ P0 ✅            │       │               │               │                   │
│ P1 ✅            │     [G0 ✅]         [G1 ✅]         [G2 ✅]             │
│ P2 ✅            │       │               │               │                   │
│ P3 🔶            │  ┌──────────┐   ┌──────────┐                            │
│ P4 ▶             │  │ Phase 3  │   │ Phase 4  │   ...                      │
│ P5 ○             │  │ Sch/PDR  │   │ PCB/CDR  │                            │
│ P6 ○             │  │ 🔶 Cond. │   │ ▶ Current│                            │
│ P7 ○             │  └────┬─────┘   └────┬─────┘                            │
│ P8 ○             │       │               │                                   │
│ P9 ○             │     [G3 🔶]         [G4 ⏳]                             │
│                  │                       │                                   │
│                  │  ┌──────────────────────────────────────────────────┐    │
│                  │  │ Phase 5 ○  Phase 6 ○  Phase 7 ○  Phase 8 ○       │    │
│                  │  │ (none)     (none)     (none)     (none)           │    │
│                  │  │ Upcoming   Upcoming   Upcoming   Upcoming          │    │
│                  │  │ [G5 ○]    [G6 ○]    [G7 ○]    [G8 ○]            │    │
│                  │  └──────────────────────────────────────────────────┘    │
│                  │                                                           │
│                  │  ┌──────────┐                                            │
│                  │  │ Phase 9  │                                            │
│                  │  │ (none)   │                                            │
│                  │  │ Upcoming │                                            │
│                  │  └────┬─────┘                                           │
│                  │       │                                                   │
│                  │     [G9 ○]                                               │
│                  │                                                           │
│                  │ Legend: ✅ Completed  ▶ Current  ⏳ Awaiting Decision   │
│                  │         🔶 Conditional Pass  ⛔ Blocked  ○ Upcoming     │
│                  │         🔒 Closed                                        │
└──────────────────┴───────────────────────────────────────────────────────────┘
```

### Phase Node Detail (on hover / expanded state)

```
┌─────────────────────────────────────┐
│ Phase 4 — PCB Layout Review + CDR  │
│ Status: Current ▶                  │
│ Gate: Gate 4 ⏳ Awaiting Decision  │
│ Technical Review: PCB Layout/CDR   │
│ Last Action: 2026-08-14            │
│                                     │
│ [Open Phase Workspace →]            │
│ [Open Gate Review →]                │
└─────────────────────────────────────┘
```

---

## Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Phase state indicators (icons + colors) | Phase node center |
| Primary | Gate state indicators | Gate diamond/connector between phases |
| Secondary | Technical review label (where mapped) | Phase node subtitle |
| Secondary | Phase name | Phase node title |
| Tertiary | Last action date | Phase node hover tooltip |

---

## States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Phase — Completed | Green node ✅ | Clickable → AV-03 |
| Phase — Current | Blue node ▶ | Clickable → AV-03 |
| Phase — Awaiting Decision | Amber node ⏳ | Clickable → AV-03 |
| Phase — Conditional Pass | Orange node 🔶 | Clickable → AV-03 |
| Phase — Blocked | Red node ⛔ | Non-clickable; tooltip: "Phase blocked — Gate Fail recorded" |
| Phase — Upcoming | Grey node ○ | Non-clickable; tooltip: "Awaiting prior gate decision" |
| Gate — Decided Pass | Green diamond ✅ | Clickable → AV-08 |
| Gate — Awaiting Decision | Amber diamond ⏳ | Clickable → AV-08 |
| Gate — Undecided/Locked | Grey diamond ○ | Non-clickable |

---

## Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| Phase node (Completed/Current/Awaiting/Conditional) | Clickable card | Navigate to AV-03 for that phase |
| Phase node (Blocked/Upcoming) | Non-interactive | Tooltip with reason |
| Gate node (Decided/Awaiting) | Clickable | Navigate to AV-08 for that gate |
| Gate node (Locked) | Non-interactive | Tooltip: "Gate locked" |
| Legend items | Static | Reference only |

---

*UX-Mockup-TTCopilot | Screen-01 AV-02 | 2026-08-15 | Synthetic POC Data Only*
