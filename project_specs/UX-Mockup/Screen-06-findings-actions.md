# Screen-06: AV-07 — Findings and Actions Workspace

**Route:** `/findings`
**Purpose:** All findings and actions across all phases; blocking actions surfaced prominently; approvals and closures
**User Stories:** US-9.4, US-6.2, US-6.3, US-10.2, US-10.3
**Primary Personas:** Priya Nair, Marcus Webb, James Okoro

---

## Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ TT Engineering Copilot              EV-INV-800 · EVINV-POC-001  [SYNTHETIC] │
├──────────────────────────────────────────────────────────────────────────────┤
│ EV-INV-800 > Phase 4: PCB Layout/CDR > Gate 4                    [breadcrumb]│
├──────────────────┬───────────────────────────────────────────────────────────┤
│ Sidebar          │ FINDINGS AND ACTIONS WORKSPACE                            │
│                  │                                                            │
│ ● Findings       │ Filters: [ Phase ▼ ] [ Severity ▼ ] [ Status ▼ ] [Seeded]│
│   & Actions      │                                                            │
│                  │ ╔═══════════════════════════════════════════════════════╗  │
│                  │ ║ ⛔ BLOCKING ACTIONS — 1 outstanding                  ║  │
│                  │ ║ These actions must be closed before Gate Pass.       ║  │
│                  │ ╠═══════════════════════════════════════════════════════╣  │
│                  │ ║ A3-001 | Gate 3 | Phase 3 → due Phase 4 / Gate 4    ║  │
│                  │ ║ Description: Verify coolant connector CN-COOL-1      ║  │
│                  │ ║              orientation corrected in revised design  ║  │
│                  │ ║ Owner: Mechanical Design Engineer                    ║  │
│                  │ ║ Status: Open  |  Required Closure Evidence: Revised  ║  │
│                  │ ║         design artifact showing corrected orientation ║  │
│                  │ ║ [ Expand Detail ]  [ Close Action — provide evidence ]║  │
│                  │ ╚═══════════════════════════════════════════════════════╝  │
│                  │                                                            │
│                  │ ── Findings ───────────────────────────────────────────── │
│                  │                                                            │
│                  │ ┌─ Findings Table ──────────────────────────────────────┐ │
│                  │ │ID     │Ph│Detected By  │S    │Sev     │Status         │ │
│                  │ │───────────────────────────────────────────────────── │ │
│                  │ │F3-001 │3 │Phase Agent  │⚙️   │Major   │VerifiedClosed │ │
│                  │ │       │  │Seeded ✦     │     │        │               │ │
│                  │ │F4-001 │4 │HV Clearance │⚙️   │Critical│VerifiedClosed │ │
│                  │ │       │  │Check Seeded ✦│    │        │               │ │
│                  │ │F4-002 │4 │Derating Chk │⚙️   │Critical│VerifiedClosed │ │
│                  │ │       │  │Seeded ✦     │     │        │               │ │
│                  │ │F4-003 │4 │TP Coverage  │⚙️   │Major   │VerifiedClosed │ │
│                  │ │F4-004 │4 │Cross-Art.   │⚙️   │Major   │VerifiedClosed │ │
│                  │ └────────────────────────────────────────────────────────┘ │
│                  │ [Click any finding row → expand detail + linked actions]   │
│                  │                                                            │
│                  │ ── Actions ────────────────────────────────────────────── │
│                  │                                                            │
│                  │ ┌─ All Actions Table ───────────────────────────────────┐ │
│                  │ │ID    │Src │Ph│Owner Role│Blk│Due  │Status         │Appr│ │
│                  │ │────────────────────────────────────────────────────  │ │
│                  │ │A3-001│F3  │3 │Mech.Eng  │⛔ │G4   │Open           │MWebb│ │
│                  │ │A4-001│F4-1│4 │HW Eng    │⛔ │G4   │VerifiedClosed │MWebb│ │
│                  │ │A4-002│F4-2│4 │HW Eng    │⛔ │G4   │VerifiedClosed │MWebb│ │
│                  │ │A4-003│F4-3│4 │HW Eng    │⛔ │G4   │VerifiedClosed │MWebb│ │
│                  │ │A4-004│F4-4│4 │HW Eng    │⛔ │G4   │VerifiedClosed │MWebb│ │
│                  │ └────────────────────────────────────────────────────────┘ │
│                  │                                                            │
│                  │   [← Back]                                                 │
└──────────────────┴───────────────────────────────────────────────────────────┘
```

---

## Finding Row — Expanded Detail

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Finding F4-001                                          [Collapse ↑]         │
│ Phase: 4  |  Gate: 4  |  Detected By: HV Clearance Check                    │
│ Seeded Issue ✦  |  Severity: Critical  |  Status: VerifiedClosed ✅         │
│                                                                               │
│ Description:                                                                 │
│   VBUS+ to GND_SHIELD air clearance 6.2 mm is below the EVINV-POC-STD-001   │
│   §3.1 threshold of 8.0 mm (margin: −1.8 mm).                               │
│   (Synthetic POC Standard, not an approved TT or industry standard.)         │
│                                                                               │
│ Linked Actions: A4-001 — VerifiedClosed ✅                                   │
│ Closure Evidence: EV-INV-800-DDB-Rev-B.xlsx (v2) — VBUS+ clearance = 9.1 mm │
│                                                                               │
│ Check Result: HC-P4-001  [ View Check Result ]                               │
│ [ Navigate to Phase 4 Workspace → ]                                          │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Action Approval / Closure Form

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Close Action A3-001                                                           │
│ ─────────────────────────────────────────────────────────────────────────── │
│ Closure Evidence Artifact ID: [ _______________________ ]  (required)        │
│ Rationale / Notes:            [ _______________________ ]  (optional)        │
│                                                                               │
│ By closing this action you confirm the corrective action has been            │
│ verified against the required closure evidence.                              │
│                                                                               │
│ [ Cancel ]           [ Close Action — Record Closure ]                       │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Blocking Actions section (red banner, top of page) | Always visible when any blocking action is Open |
| Primary | Open blocking action detail (expanded by default) | Inside blocking section |
| Secondary | Findings table (filterable) | Below blocking section |
| Secondary | All actions table (filterable) | Below findings table |
| Tertiary | Expanded finding / action detail | On-row expansion |

---

## States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| No blocking actions | Blocking section hidden or shows "✅ No blocking actions outstanding" | Green confirmation |
| Blocking action(s) open | Red banner with action count | Prominent; cannot be dismissed |
| Finding: Open | Grey status | Linked action shows next step |
| Finding: VerifiedClosed | Green ✅ | Closure evidence artifact linked |
| Action: Open | Amber status | "Close Action" button visible |
| Action: VerifiedClosed | Green ✅ | Approver role + timestamp visible |
| Seeded issue | ✦ Seeded badge | Distinguishes POC-injected issues from real findings |

---

## Filter Controls

| Filter | Options |
|--------|---------|
| Phase | All / Phase 0–9 |
| Severity | All / Critical / Major / Minor |
| Status | All / Open / VerifiedClosed |
| Seeded | All / Seeded Only / Non-Seeded Only |

---

## Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| Finding row | Expandable | Shows full description, linked actions, check result link |
| Action row | Expandable | Shows full detail, history, approval/closure form |
| "Close Action — provide evidence" | Action button | Opens closure form requiring evidence artifact ID |
| "Approve Action" | Action button | Records approver role + timestamp; requires rationale |
| "Navigate to source phase" | Link | Opens AV-03 for the originating phase |
| Filter dropdowns | Select | Filters both tables simultaneously |
| Check Result link | Link | Opens AV-05 for the deterministic check result |

---

*UX-Mockup-TTCopilot | Screen-06 AV-07 | 2026-08-15 | Synthetic POC Data Only*
