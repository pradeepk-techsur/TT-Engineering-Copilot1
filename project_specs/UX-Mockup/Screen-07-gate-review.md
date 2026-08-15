# Screen-07: AV-08 — Gate Review Workspace

**Route:** `/gates/:gateId/review`
**Purpose:** Human gate decision — dynamically built from ProjectState; no separate gate-pack artifact
**User Stories:** US-9.5, US-10.1, US-10.2, US-10.4, US-0.4, US-6.2, US-6.3
**Primary Personas:** Priya Nair, Marcus Webb, James Okoro

> **Critical UX constraint:** AI can NEVER approve a gate. "Record Decision" is a human-only control. No option is pre-selected. Confirmation dialog always required.

---

## Layout — Gate 4 (AwaitingGate, Conditional Pass action outstanding)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ TT Engineering Copilot              EV-INV-800 · EVINV-POC-001  [SYNTHETIC] │
├──────────────────────────────────────────────────────────────────────────────┤
│ EV-INV-800 > Phase 4: PCB Layout/CDR > Gate 4                    [breadcrumb]│
├──────────────────┬───────────────────────────────────────────────────────────┤
│ Sidebar          │ GATE REVIEW WORKSPACE — Gate 4                            │
│                  │  Phase 4 — PCB Layout Review + CDR                        │
│                  │  Status: ⏳ Awaiting Human Decision                       │
│                  │                                                            │
│                  │ ─── Gate Review Content (from ProjectState) ────────────  │
│                  │                                                            │
│                  │ ┌─ Inputs Reviewed ─────────────────────────────────────┐ │
│                  │ │ External: DFM/Assembly/Standards Pkg  v1 ✅ Pass       │ │
│                  │ │           [SI] Simulated Connector — Standards library  │ │
│                  │ │ Internal: Released Detailed Design Baseline Pkg v2 ✅   │ │
│                  │ │           [UP] EV-INV-800-DDB-Rev-B.xlsx               │ │
│                  │ └────────────────────────────────────────────────────────┘ │
│                  │                                                            │
│                  │ ┌─ Outputs Reviewed ────────────────────────────────────┐ │
│                  │ │ Output 1: DFM & Standards Audit (XLSX)                │ │
│                  │ │   v2 ✅ Approved    [View]                             │ │
│                  │ │                                                        │ │
│                  │ │ Output 2: BOM Health & Manufacturability Report (PDF)  │ │
│                  │ │   v2 ✅ Approved    [View]                             │ │
│                  │ └────────────────────────────────────────────────────────┘ │
│                  │                                                            │
│                  │ ┌─ Deterministic Check Results ─────────────────────────┐ │
│                  │ │ Check Type         │ v1 Result │ v2 Result │ Status    │ │
│                  │ │ ──────────────────────────────────────────────────── │ │
│                  │ │ HV Clearance (mm)  │ 6.2 ❌    │ 9.1       │ ✅ Pass  │ │
│                  │ │   Threshold: 8.0 mm (EVINV-POC-STD-001 §3.1)          │ │
│                  │ │ Derating Margin    │ 4.4% ❌   │ 52.2%     │ ✅ Pass  │ │
│                  │ │   Threshold: 50% (EVINV-POC-STD-001 §4.1)             │ │
│                  │ │ Test-Pt Coverage   │ No TP ❌  │ TP-IGBT   │ ✅ Pass  │ │
│                  │ │ Cross-Art Consist. │ 0805 ❌   │ 1206      │ ✅ Pass  │ │
│                  │ │             [ View Full Check Results → ]              │ │
│                  │ └────────────────────────────────────────────────────────┘ │
│                  │                                                            │
│                  │ ┌─ Findings Summary ────────────────────────────────────┐ │
│                  │ │ F4-001 | Critical | HV Clearance | VerifiedClosed ✅  │ │
│                  │ │ F4-002 | Critical | Derating     | VerifiedClosed ✅  │ │
│                  │ │ F4-003 | Major    | Test-Pt      | VerifiedClosed ✅  │ │
│                  │ │ F4-004 | Major    | Cross-Art.   | VerifiedClosed ✅  │ │
│                  │ │                   [ View All Findings → ]              │ │
│                  │ └────────────────────────────────────────────────────────┘ │
│                  │                                                            │
│                  │ ┌─ Open Actions ────────────────────────────────────────┐ │
│                  │ │ ⛔ A3-001 | BLOCKING | From Gate 3 | Due: Gate 4     │ │
│                  │ │   Description: Verify coolant connector orientation   │ │
│                  │ │   Status: Open                                        │ │
│                  │ │   [ View A3-001 in Findings & Actions → ]            │ │
│                  │ └────────────────────────────────────────────────────────┘ │
│                  │                                                            │
│                  │ ┌─ AI Recommendation ───────────────────────────────────┐ │
│                  │ │ ℹ️  Advisory Only — Human Decision Required            │ │
│                  │ │ Recommended Outcome: Pass                              │ │
│                  │ │ Rationale: All four Phase 4 deterministic checks pass  │ │
│                  │ │ in Rev B. Gate 3 action A3-001 verified closed with    │ │
│                  │ │ revised design. No outstanding blocking issues.         │ │
│                  │ └────────────────────────────────────────────────────────┘ │
│                  │                                                            │
│                  │ ┌─ Human Decision ──────────────────────────────────────┐ │
│                  │ │ Reviewer Comments (optional):                         │ │
│                  │ │ ┌──────────────────────────────────────────────────┐  │ │
│                  │ │ │ All four Phase 4 checks resolved in Rev B.        │  │ │
│                  │ │ │ Phase 3 action confirmed closed. Approving Gate 4 │  │ │
│                  │ │ │ Pass.                                             │  │ │
│                  │ │ └──────────────────────────────────────────────────┘  │ │
│                  │ │                                                        │ │
│                  │ │ Gate Outcome:                                          │ │
│                  │ │ ○ Pass            ← disabled (A3-001 still Open)      │ │
│                  │ │ ○ Conditional Pass                                    │ │
│                  │ │ ○ Fail                                                │ │
│                  │ │                                                        │ │
│                  │ │ ⚠️ Blocking actions must be closed before recording   │ │
│                  │ │    a Pass outcome.  [ Go to A3-001 → ]               │ │
│                  │ │                                                        │ │
│                  │ │        [ Record Decision ]  ← disabled                │ │
│                  │ └────────────────────────────────────────────────────────┘ │
│                  │                                                            │
│                  │ ┌─ Gate Decision History ───────────────────────────────┐ │
│                  │ │ (No prior decisions for Gate 4)                       │ │
│                  │ └────────────────────────────────────────────────────────┘ │
└──────────────────┴───────────────────────────────────────────────────────────┘
```

---

## Layout — After A3-001 Closed (Pass becomes available)

```
│                  │ ┌─ Open Actions ────────────────────────────────────────┐ │
│                  │ │ ✅ No blocking actions outstanding                    │ │
│                  │ └────────────────────────────────────────────────────────┘ │
│                  │                                                            │
│                  │ ┌─ Human Decision ──────────────────────────────────────┐ │
│                  │ │ Gate Outcome:                                          │ │
│                  │ │ ○ Pass            ← NOW ENABLED                       │ │
│                  │ │ ○ Conditional Pass                                    │ │
│                  │ │ ○ Fail                                                │ │
│                  │ │                                                        │ │
│                  │ │ [No option pre-selected — human must choose]          │ │
│                  │ │                                                        │ │
│                  │ │        [ Record Decision ]  ← enabled after selection │ │
│                  │ └────────────────────────────────────────────────────────┘ │
```

---

## Conditional Pass Action Form (appears when "Conditional Pass" selected)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Conditional Pass Actions (at least one required)                             │
│ ─────────────────────────────────────────────────────────────────────────── │
│ Action 1                                                                     │
│   Description:          [ _________________________________________ ]        │
│   Owner Role:           [ _________________________________________ ]        │
│   Blocking / Parallel:  ● Blocking   ○ Parallel                             │
│   Due Phase:            [ 4 ▼ ]     Due Gate: [ 4 ▼ ]                      │
│   Required Closure Evidence: [ __________________________________ ]          │
│                                                                               │
│ [ + Add Another Action ]                                                     │
│                                                                               │
│ [ Cancel ]              [ Record Decision ]  ← enabled when form complete    │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Confirmation Dialog (always shown before gate decision is submitted)

```
┌─────────────────────────────────────────────────────────────┐
│ Confirm Gate Decision                                        │
│ ──────────────────────────────────────────────────────────  │
│ You are recording PASS for Gate 4.                          │
│ This action cannot be undone.                               │
│                                                             │
│ Reviewer Role: [ Marcus Webb — Technical Reviewer ]         │
│                                                             │
│               [ Cancel ]  [ Confirm — Record Decision ]     │
└─────────────────────────────────────────────────────────────┘
```

---

## Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Human Decision panel (gate outcome + record button) | Bottom of content, always visible; sticky on scroll |
| Primary | Open Actions (blocking) | Prominently above Human Decision |
| Primary | AI Recommendation with "Advisory Only" label | Above Human Decision |
| Secondary | Deterministic check results summary | Middle of page |
| Secondary | Findings summary | Middle of page |
| Tertiary | Inputs/Outputs reviewed | Top of content area |
| Tertiary | Gate Decision History | Bottom of page |

---

## States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Phase still Processing | "Record Decision" disabled; message | "Phase execution in progress — cannot record decision." |
| Blocking action(s) Open | Pass radio disabled; red warning | "Blocking actions must be closed before recording a Pass outcome" |
| No option selected | "Record Decision" disabled | Button greyed; tooltip: "Select a gate outcome to continue" |
| Option selected | "Record Decision" enabled | Button active |
| Conditional Pass selected | Conditional Action form appears | Form required; "Record Decision" disabled until complete |
| Decision recorded | Read-only; history entry added | "Gate N decision recorded — [outcome]. Immutable." |
| Retry scenario | Prior decision shown in history | History section shows previous Fail decision |

---

## Gate Decision Record Fields (written on Record Decision confirm)

| Field | Content |
|-------|---------|
| Decision ID | System-assigned UUID |
| Gate Number | N |
| AI Recommendation | Stored recommendation text |
| Human Disposition | Pass / Conditional Pass / Fail |
| Reviewer Role | From confirmation dialog |
| Comments | Free text entered by human |
| Timestamp | UTC |
| Artifact Versions Reviewed | Auto-captured from current active versions |
| Open Conditions | Conditional Pass action IDs (if applicable) |
| is_final | true (immutable) |

---

*UX-Mockup-TTCopilot | Screen-07 AV-08 | 2026-08-15 | Synthetic POC Data Only*
