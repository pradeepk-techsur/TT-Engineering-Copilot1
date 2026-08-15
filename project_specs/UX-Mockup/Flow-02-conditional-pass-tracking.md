# Flow-02: Conditional Pass Gate — Action Creation and Cross-Phase Tracking

**User Stories:** US-6.2, US-10.2, US-10.3
**Persona:** Marcus Webb (Gate 3 → Phase 4), Priya Nair (monitoring)
**Trigger:** AI recommends Conditional Pass at Gate 3; human agrees

```
[AV-08 Gate Review Workspace — Gate 3]
    AI Recommendation: "Conditional Pass — Advisory Only"
    Rationale: Coolant connector CN-COOL-1 orientation concern (F3-001)
         │
         ├── Human selects "Conditional Pass" radio button
         │
         ▼
    Conditional Pass Action Form appears (required; cannot dismiss)
    Fields per action (at least one required):
      - Description
      - Owner Role
      - Blocking / Parallel indicator
      - Due Phase (4) / Due Gate (4)
      - Required Closure Evidence (text)
         │
         ├── Human completes form; action ID assigned: A3-001
         │
         ├── Human clicks "Record Decision"
         │   Confirmation dialog: "You are recording Conditional Pass for Gate 3.
         │   This creates 1 blocking action. This action cannot be undone. Confirm?"
         │   └── Confirm → gate decision recorded; A3-001 created
         │
         ▼
    Gate 3 breadcrumb → 🔶 Conditional Pass (orange) on ALL nine views

    A3-001 appears immediately in:
      - AV-07 Findings and Actions Workspace (Blocking Actions section, top)
      - AV-01 Project Health Indicators (open blocking count ≥ 1)
      - AV-08 Gate 4 (Open Actions Panel, blocking highlighted)
         │
         ▼
[Phase 4 proceeds to AwaitingInputs]
    Note: Phase 4 may proceed while A3-001 is Open
    But: Gate 4 Pass radio is DISABLED until A3-001.status = VerifiedClosed
    Message shown in AV-08 Gate 4:
    "Blocking actions must be closed before recording a Pass outcome"
         │
         ▼
[Phase 4 Correction Cycle — Revised Design verifies connector corrected]
    Human reviews revised design in AV-05
    Human provides closure evidence artifact ID in AV-07 for A3-001
         │
         ▼
    A3-001.status → VerifiedClosed
    Gate 4 Pass radio becomes enabled
    Phase 3 breadcrumb: 🔶 → ✅ Completed (after Gate 4 decided Pass)
         │
         ▼
[AV-08 Gate 4 — Human records Pass]
    Gate decision includes: A3-001 closure evidence reference in record
```

**Cross-View Blocking Action Visibility:**

| View | How A3-001 appears while Open |
|------|-------------------------------|
| AV-01 | Health Indicator: "Blocking Actions: 1" (red counter) |
| AV-02 | Phase 3 breadcrumb node: 🔶 orange |
| AV-03 Phase 4 | Findings section: "1 blocking action from Gate 3 outstanding" banner |
| AV-07 | Blocking Actions section at top of page; full action detail |
| AV-08 Gate 4 | Open Actions Panel; Pass radio disabled with message |
| All others | Phase 3 breadcrumb segment: 🔶 |

---

*UX-Mockup-TTCopilot | Flow-02 | 2026-08-15 | Synthetic POC Data Only*
