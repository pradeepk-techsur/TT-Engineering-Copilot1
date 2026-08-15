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

## 1a. Modern Design System

The Web Gate Cockpit must follow current (2025–2026) professional web application design conventions. This is an engineering governance tool used by senior engineers, program managers, and commercial reviewers — it must feel as polished as tools like Linear, Vercel Dashboard, or GitHub, not like a legacy enterprise portal.

### Design Stack

| Layer | Choice | Rationale |
|---|---|---|
| **Component library** | **shadcn/ui** (built on Radix UI primitives) | Accessible, headless, fully customizable, no proprietary theming lock-in; copy-owned components |
| **Styling** | **Tailwind CSS v4** | Utility-first, consistent spacing/color tokens, excellent dark-mode support |
| **Icons** | **Lucide React** | Consistent stroke-weight icon set; ships with shadcn/ui by default |
| **Charts / data viz** | **Recharts** (or **Tremor** for dashboard cards) | Lightweight, React-native, sufficient for phase-status timelines and Cpk indicators |
| **Tables** | **TanStack Table v8** | Headless, sortable, filterable — required for Findings, Audit Log, RTM views |
| **File upload** | **react-dropzone** | Drag-and-drop upload with validation callbacks; integrates with UP intake workflow |
| **Notifications / toasts** | **Sonner** (shadcn/ui default) | Non-blocking status feedback for intake events, rerun triggers, gate decisions |
| **Fonts** | **Inter** (sans-serif) via `next/font` | Industry-standard UI font; excellent legibility for dense engineering tables |

### Color System

Use a neutral-first palette with semantic status colors. Tailwind CSS custom tokens:

```
--color-background:     #0f1117   (dark) / #ffffff   (light)
--color-surface:        #1a1d27   (dark) / #f8f9fa   (light)
--color-border:         #2d3148   (dark) / #e2e8f0   (light)
--color-text-primary:   #f1f5f9   (dark) / #0f172a   (light)
--color-text-muted:     #94a3b8   (both)

/* Semantic / status */
--color-pass:           #22c55e   (green-500)
--color-conditional:    #f97316   (orange-500)
--color-fail:           #ef4444   (red-500)
--color-awaiting:       #f59e0b   (amber-500)
--color-upcoming:       #64748b   (slate-500)
--color-synthetic:      #8b5cf6   (violet-500)   ← synthetic data badge
--color-advisory:       #3b82f6   (blue-500)     ← AI recommendation
--color-blocked:        #dc2626   (red-600)
```

**Default mode:** Dark (matches engineering tool conventions; Linear, Vercel, Figma all ship dark-first). Light mode supported via `class="light"` on `<html>`.

### Typography Scale

```
Display  — 28px / 700 / Inter     (page titles: "Phase 4: Detail Design")
Heading  — 18px / 600 / Inter     (section headings, card titles)
Body     — 14px / 400 / Inter     (primary content, table cells)
Caption  — 12px / 400 / Inter     (labels, metadata, provenance)
Mono     — 13px / 400 / JetBrains Mono  (check results, field values, IDs)
```

All text meets WCAG 2.1 AA contrast (≥4.5:1 for body, ≥3:1 for large text).

### Spacing and Layout

- **Base unit:** 4px (Tailwind default)
- **Content max-width:** 1440px; centered with `px-6` gutters
- **Sidebar width:** 240px fixed; collapses to icon-only (48px) at <1280px
- **Card padding:** `p-4` (16px) inner, `gap-4` between cards
- **Table row height:** 44px (comfortable touch target even on trackpad)
- **Border radius:** `rounded-lg` (8px) for cards, `rounded-md` (6px) for buttons/inputs

### Component Conventions

**Cards** — all Phase Workspace panels, input readiness cards, output cards:
```
bg-surface border border-border rounded-lg p-4 shadow-sm
```

**Status badges** — phase states, gate outcomes, intake status:
```
inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium
```
- Pass: `bg-green-500/10 text-green-400 border border-green-500/20`
- Conditional Pass: `bg-orange-500/10 text-orange-400 border border-orange-500/20`
- Fail: `bg-red-500/10 text-red-400 border border-red-500/20`
- Awaiting Decision: `bg-amber-500/10 text-amber-400 border border-amber-500/20`
- Synthetic: `bg-violet-500/10 text-violet-400 border border-violet-500/20`
- AI Advisory: `bg-blue-500/10 text-blue-400 border border-blue-500/20`

**Buttons — hierarchy:**
- Primary (Record Decision, Ingest Sample): `bg-primary text-primary-foreground hover:bg-primary/90`
- Secondary (View, Download): `variant="outline"`
- Destructive (Fail gate): `variant="destructive"` — always behind a confirmation dialog
- Ghost (breadcrumb links, inline navigation): `variant="ghost"`

**Confirmation dialogs** — required before any gate decision, ingestion, or corrective action approval:
Use shadcn/ui `<AlertDialog>` with explicit "Confirm" + "Cancel" buttons. Never a bare `window.confirm()`.

**Data tables** (Findings, Audit Log, RTM):
Use TanStack Table with shadcn/ui `<Table>` render. Include:
- Column sorting (click header)
- Global text filter input (`<Input>` above table)
- Sticky header on scroll
- Row hover highlight
- Empty state with icon + message when no results

**Code / structured values** (deterministic check results, IDs, field values):
```
<code className="font-mono text-xs bg-surface px-1.5 py-0.5 rounded border border-border">
```

**SSE / streaming states:**
Use an animated `<Progress>` bar (indeterminate) + spinner icon during phase execution. Never a raw loading text string.

### Key Interaction Patterns

1. **Gate decision control** — radio group (Pass / Conditional Pass / Fail) in a visually contained card with amber background until decided; "Record Decision" button disabled until a selection is made and a comment is entered (minimum 1 character).

2. **Ingest Sample action** — displayed as a bordered card showing the synthetic sample table; a `<Button variant="default">Ingest Sample</Button>` is below the table. Status badge changes from "Preloaded Synthetic Sample Ready" (violet) to "Synthetic System Input Ready" (green) after ingestion. No auto-ingestion.

3. **Upload Revised Version** — shown only after a finding triggers a correction cycle; labeled explicitly "Upload Revised Version" (never "Replace" or "Reupload"); triggers a version-diff view in Artifact Viewer after upload.

4. **Blocking action banner** — a full-width `bg-red-500/10 border-b border-red-500/20` banner at the top of Phase Workspace when an open blocking action from a prior phase is unresolved, with a direct link to the action in AV-07.

5. **AI recommendation pill** — always displayed with `bg-blue-500/10 text-blue-400` badge labeled "AI Advisory Only — Not a Gate Decision". The human decision control is visually separated below it.

6. **Synthetic disclaimer** — a `bg-violet-500/5 border border-violet-500/20 rounded-md px-3 py-2 text-xs text-violet-400` banner at the top of every artifact display and every synthetic sample card. Never suppressible.

### Animation and Motion

- **Transitions:** `transition-colors duration-150` on interactive elements; `transition-all duration-200` on expanding panels
- **Reduced motion:** all animations respect `prefers-reduced-motion: reduce` — use `motion-safe:` Tailwind variant
- **Skeleton loaders:** use shimmer placeholders during data fetch (never blank white space)
- **No decorative animations** — no confetti, no particle effects, no page-enter animations beyond a single `fade-in` at 150ms

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
# Flow-00: Phase Execution (Normal Happy Path)

**User Stories:** US-0.1, US-0.3, US-2.2, US-2.3, US-9.2
**Personas:** All four (entry point varies by role)
**Trigger:** Prior gate decided Pass or Conditional Pass → phase transitions to AwaitingInputs

```
[AV-02 Product Lifecycle View]
    Phase node shows ○ Upcoming → AwaitingInputs
         │
         ▼
[AV-03 Phase Workspace]
    Phase Execution Status: "Waiting for User Input" (if UP not yet uploaded)
    Phase Execution Status: "Waiting for Synthetic Sample Ingestion" (if SI not yet ingested)
         │
         ├── External Input is UP ─────────────────────────────────┐
         │   User uploads file                                      │
         │   ├── Validation Fail → error inline; status unchanged   │
         │   └── Validation Pass → status "User Input Ready" ✓      │
         │                                                          │
         ├── External/Internal Input is SI ──────────────────────────┤
         │   System shows preloaded synthetic sample                 │
         │   Labels: "Simulated Connector — No live connection"      │
         │           "Preloaded Synthetic Sample"                    │
         │   User clicks View or Download (required first)          │
         │   User clicks "Ingest Sample"                            │
         │   Confirmation dialog → "Confirm ingestion?"             │
         │   ├── Cancel → no change                                 │
         │   └── Confirm → status "Synthetic System Input Ready" ✓  │
         │                                                          │
         └── Both inputs Ready ◄────────────────────────────────────┘
              Phase Execution Status: "Ready to Run"
              "Run Phase N" button becomes active
                   │
                   ▼
         [User clicks "Run Phase N"]
              Phase Execution Status: "Processing"
              Progress indicator displayed
                   │
                   ├── Phase agent runs; deterministic checks execute
                   │
                   ▼
         Phase Execution Status: "Awaiting Human Decision"
         Outputs appear in Output Panel
         Findings appear in Findings section
         AI Recommendation panel populated
              │
              ▼
         [AV-08 Gate Review Workspace]
         (reached via "Open Gate Review" button or breadcrumb gate segment)
              │
              ├── Blocking actions outstanding?
              │   └── Yes → Pass radio disabled; message shown
              │
              ├── Human selects Pass / Conditional Pass / Fail
              │   (no option pre-selected)
              │
              ├── If Conditional Pass → Conditional Action form required
              │
              ├── Human clicks "Record Decision"
              │   Confirmation dialog: "You are recording [outcome] for Gate N.
              │   This action cannot be undone. Confirm?"
              │   ├── Cancel → no change
              │   └── Confirm → gate decision recorded
              │
              └── Gate Decided
                   ├── Pass → next phase AwaitingInputs; breadcrumb ✅
                   ├── Conditional Pass → actions created; next phase proceeds; breadcrumb 🔶
                   └── Fail → phase blocked; project status Blocked; breadcrumb ⛔
```

**Steps (narrative):**

1. Reviewer navigates to Phase Workspace (AV-03) via breadcrumb or lifecycle view.
2. Input Readiness Panel shows both inputs with their current status and required action.
3. For UP inputs: reviewer or engineer uploads file; inline validation feedback shown.
4. For SI inputs: system shows labeled synthetic sample; user reviews, then clicks "Ingest Sample."
5. Once both inputs show Ready, Phase Execution Status transitions to "Ready to Run."
6. User clicks "Run Phase N" — phase agent executes, deterministic checks run as tool calls.
7. Phase Execution Status transitions through "Processing" → "Awaiting Human Decision."
8. AI Recommendation Panel shows recommended outcome with "Advisory Only — Human Decision Required" label.
9. Reviewer opens Gate Review Workspace (AV-08) via button or breadcrumb.
10. Reviewer reads gate content (inputs, outputs, checks, findings, open actions, AI recommendation).
11. Reviewer selects gate outcome via radio buttons (none pre-selected).
12. Reviewer clicks "Record Decision" → confirmation dialog → confirms.
13. Gate decision written as immutable record; breadcrumb and lifecycle view update.

---

*UX-Mockup-TTCopilot | Flow-00 | 2026-08-15 | Synthetic POC Data Only*
# Flow-01: Correction Cycle (Finding → Action → Revised Input → Rerun)

**User Stories:** US-3.1, US-3.2, US-6.1–US-6.4, US-9.4
**Personas:** Marcus Webb (Phase 4), Priya Nair (Phase 2), James Okoro (Phase 6)
**Trigger:** Phase execution complete; one or more findings raised with blocking actions

```
[AV-03 Phase Workspace — Findings Section]
    Finding(s) displayed with severity badges
    Blocking action banner: "N blocking action(s) must be closed before Gate Pass"
         │
         ▼
[AV-07 Findings and Actions Workspace]
    Blocking Actions section at top (red banner)
    Finding detail: ID, Phase, Severity, Description, Linked Actions
         │
         ├── Human reviews finding detail
         │
         ▼
    Corrective Action approval form
    Fields: Action ID, Description, Owner Role, Blocking, Due Phase/Gate,
            Required Closure Evidence, Rationale (free text, required)
         │
         ├── Human approves action
         │   Approval recorded with approver role + timestamp
         │
         └── (If UP input): "Upload Revised Version" button enabled in AV-03
             (If SI input): System creates revised synthetic sample →
                            banner appears: "Revised Synthetic System Sample Available — [System]"
                            Status: "Revised Sample Available; Ingest Required"
                                │
                                ├── User clicks "Ingest Revised Sample"
                                │   (same explicit-action requirement as initial ingestion)
                                │   Confirmation dialog → Confirm
                                └── Status: "Synthetic System Input Ready" (new version)

         ┌─────────────────────────────────────────────────┐
         │ FOR USER-PROVIDED REVISED FILE                  │
         │ AV-03: "Upload Revised Version" button visible  │
         │ User uploads revised file                       │
         │   ├── Validation Fail → prior version stays active│
         │   └── Validation Pass → new version active      │
         └─────────────────────────────────────────────────┘
              │
              ▼
    Targeted Rerun triggered automatically
    Only affected checks, findings, outputs rerun
    Unaffected results preserved
         │
         ▼
[AV-05 Artifact Viewer — Comparison Mode]
    Two-column layout: Original Version | Revised Version
    Differences highlighted
    Provenance panel for each version
         │
         ├── Original results: version_ref = prior_version_id (Fail results)
         └── Revised results: version_ref = new_version_id (Pass/Fail results)
         │
         ▼
    If all blocking actions verified closed:
    → AV-08 Gate Review Workspace: Pass radio enabled
    → Human records gate decision (Pass or Conditional Pass)

    If revised result still fails:
    → New finding(s) raised or existing finding remains Open
    → Cycle repeats
```

**Key UX Constraints in this Flow:**

- "Upload Revised Version" — never "Replace Input" or any synonym of "replacement input"
- Prior versions retained in version history; never deleted
- "Ingest Revised Sample" — same explicit action requirement as initial "Ingest Sample"
- Targeted rerun scope: visible in AV-09 Audit View (input version → checks invalidated → checks rerun → timestamp)
- Where evidence materially changed: output gets "Review Required" badge in AV-08
- Corrective action closure requires: closure evidence artifact ID provided by human

---

*UX-Mockup-TTCopilot | Flow-01 | 2026-08-15 | Synthetic POC Data Only*
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
# Flow-03: Artifact Version Comparison (Side-by-Side)

**User Stories:** US-3.3, US-5.1–US-5.4, US-8.3
**Personas:** Marcus Webb, James Okoro
**Trigger:** Revised input version created; targeted rerun complete; both original and revised results stored

```
[AV-05 Artifact Viewer — Entry Points]
    From AV-03: Output card "View" button
    From AV-04: Version history row → "View" or "Compare"
    From AV-08: Artifact row "View" button
         │
         ▼
[AV-05 Single Version Mode]
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ SYNTHETIC POC DATA — Not for Design, Fabrication,       │
│    Certification, Procurement, or Production                │
├─────────────────────────────────────────────────────────────┤
│ Artifact: [Name]                    Version: v[N] (Active)  │
│ Phase: N | Gate: N | Type: XLSX/DOCX/PDF                    │
│ Source: [UserUploaded / AgentGenerated / SyntheticSample]   │
│ Intake Behavior: [UP / SI]                                  │
│ System Represented: [if SI]     Generated: [timestamp]      │
├──────────────────────────┬──────────────────────────────────┤
│ Version History          │ Content Preview                  │
│ ┌──────────────────────┐ │                                  │
│ │v3 (Active) ✓ Current │ │ [rendered XLSX table or         │
│ │v2 ○ 2026-08-12       │ │  DOCX/PDF page view]            │
│ │v1 ○ 2026-08-10       │ │                                  │
│ └──────────────────────┘ │                                  │
│ [Compare two versions]   │                                  │
│ [Download this version]  │                                  │
└──────────────────────────┴──────────────────────────────────┘
         │
         ├── User selects "Compare two versions"
         │   Version selector: v1 ↔ v2 (or any two)
         │
         ▼
[AV-05 Comparison Mode]
┌──────────────────────────────────────────────────────────────┐
│ ⚠️ SYNTHETIC POC DATA — Not for Design, Fabrication, ...    │
├──────────────────────────┬───────────────────────────────────┤
│ Version v1 (Original)    │ Version v2 (Revised)              │
│ 2026-08-10 · Fail        │ 2026-08-12 · Pass                 │
│ Input ref: [v1_id]       │ Input ref: [v2_id]                │
├──────────────────────────┼───────────────────────────────────┤
│ [Field / Row]  [Value]   │ [Field / Row]    [Value]          │
│ ─────────────────────    │ ──────────────────────────        │
│ VBUS+ to GND  6.2 mm ❌  │ VBUS+ to GND    9.1 mm ✅        │← highlighted diff
│ C_BULK_3      4.4%   ❌  │ C_BULK_3        52.2%  ✅        │← highlighted diff
│ DIAG_TEMP     No TP  ❌  │ DIAG_TEMP       TP-IGBT ✅       │← highlighted diff
│ C_HV_1 foot   0805   ❌  │ C_HV_1 foot     1206   ✅        │← highlighted diff
├──────────────────────────┴───────────────────────────────────┤
│ [Download v1]                        [Download v2]           │
└──────────────────────────────────────────────────────────────┘
```

**Provenance Panel (always visible in AV-05):**

| Field | Description |
|-------|-------------|
| Artifact ID | Unique stable identifier |
| Artifact Name | Logical name |
| Type | XLSX / DOCX / PDF |
| Source | UserUploaded / AgentGenerated / SyntheticSample |
| Intake Behavior | UP / SI |
| System Represented | (SI only) e.g., "Salesforce / Cora" |
| Generation / Intake Timestamp | UTC |
| Phase | N |
| Gate | N |
| Input Version References | IDs of input versions used to generate this artifact |
| Disclaimer Present | Always true |

**Deterministic Check Result Panel (when viewing check results, not file artifacts):**

```
┌──────────────────────────────────────────────────────────────────┐
│ Check: HV Clearance | Phase 4 | v1 (Initial) → v2 (Revised)     │
├────────────────────┬─────────────────────────────────────────────┤
│ Field              │ v1 (Initial)     │ v2 (Revised)             │
├────────────────────┼──────────────────┼──────────────────────────┤
│ Net Pair           │ VBUS+ to GND_SH  │ VBUS+ to GND_SH         │
│ Clearance Type     │ Air              │ Air                      │
│ Measured (mm)      │ 6.2              │ 9.1                      │
│ Threshold (mm)     │ 8.0              │ 8.0                      │
│ Margin (mm)        │ −1.8             │ +1.1                     │
│ Status             │ ❌ FAIL          │ ✅ PASS                  │
├────────────────────┴──────────────────┴──────────────────────────┤
│ Source: EVINV-POC-STD-001 §3.1 — HV Clearance Requirements       │
│         (Synthetic POC Standard, not an approved TT or           │
│          industry standard)                                       │
│ Limitation: Clearance values from design data; not extracted      │
│             directly from CAD files in POC                        │
└───────────────────────────────────────────────────────────────────┘
```

---

*UX-Mockup-TTCopilot | Flow-03 | 2026-08-15 | Synthetic POC Data Only*
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
# Screen-02: AV-03 — Phase Workspace

**Route:** `/phases/:phaseId`
**Purpose:** Core per-phase working view — input readiness, output review, findings, AI recommendation, human decision, phase execution status
**User Stories:** US-2.1–US-2.4, US-9.2, US-1.2, US-5.1, US-6.2, US-6.3, US-10.4
**Primary Personas:** Marcus Webb, Claire Ashby, James Okoro

---

## Layout (Phase 4 example — AwaitingGate state)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ TT Engineering Copilot              EV-INV-800 · EVINV-POC-001  [SYNTHETIC] │
├──────────────────────────────────────────────────────────────────────────────┤
│ EV-INV-800 > Phase 4: PCB Layout/CDR > Gate 4            ⏳ Awaiting Decision│
├──────────────────┬───────────────────────────────────────────────────────────┤
│ Sidebar          │ PHASE 4 — PCB Layout Review + CDR                         │
│                  │                                                            │
│                  │ ┌─ Phase Execution Status ─────────────────────────────┐  │
│                  │ │  ⏳  AWAITING HUMAN DECISION                          │  │
│                  │ │  Phase execution complete. Open Gate Review to decide.│  │
│                  │ │                    [Open Gate Review →]               │  │
│                  │ └──────────────────────────────────────────────────────┘  │
│                  │                                                            │
│                  │ ┌─ Input Readiness Panel ──────────────────────────────┐  │
│                  │ │                                                       │  │
│                  │ │ ── External Input ──────────────────────────────────  │  │
│                  │ │ [SI badge] DFM, Assembly, Standards & Supplier-Risk  │  │
│                  │ │           Package                                     │  │
│                  │ │ Intake: Simulated External-System Intake              │  │
│                  │ │ ┌──────────────────────────────────────────────────┐ │  │
│                  │ │ │ Simulated Connector — No live connection         │ │  │
│                  │ │ │ Preloaded Synthetic Sample                       │ │  │
│                  │ │ │ System Represented: Standards library /          │ │  │
│                  │ │ │                     supplier feed / obsolescence  │ │  │
│                  │ │ └──────────────────────────────────────────────────┘ │  │
│                  │ │ Active Artifact: DFM-STD-SUPP-PKG-v1.xlsx           │  │
│                  │ │ Active Version:  v1                                  │  │
│                  │ │ Validation:      ✅ Pass                             │  │
│                  │ │ ● READY                  [View] [Download]           │  │
│                  │ │ [Open Intake Detail →]                               │  │
│                  │ │                                                       │  │
│                  │ │ ── Internal Input ──────────────────────────────────  │  │
│                  │ │ [UP badge] Released Detailed Design Baseline Package  │  │
│                  │ │ Intake: User-Provided File                            │  │
│                  │ │ Format: XLSX / DOCX / PDF  |  Size: ≤10 rows / 2pp   │  │
│                  │ │ Active Artifact: EV-INV-800-DDB-Rev-B.xlsx           │  │
│                  │ │ Active Version:  v2 (Revised)                        │  │
│                  │ │ Validation:      ✅ Pass                             │  │
│                  │ │ ● READY          [Upload Revised Version]            │  │
│                  │ │ [Open Intake Detail →]                               │  │
│                  │ └──────────────────────────────────────────────────────┘  │
│                  │                                                            │
│                  │ ┌─ Output Panel ───────────────────────────────────────┐  │
│                  │ │ Output 1: DFM & Standards Audit (XLSX)               │  │
│                  │ │   Version: v2 | Status: ✅ Approved                  │  │
│                  │ │   [View] [Download]                                   │  │
│                  │ │                                                       │  │
│                  │ │ Output 2: BOM Health & Manufacturability Report (PDF) │  │
│                  │ │   Version: v2 | Status: ✅ Approved                  │  │
│                  │ │   [View] [Download]                                   │  │
│                  │ └──────────────────────────────────────────────────────┘  │
│                  │                                                            │
│                  │ ┌─ Findings & Actions ─────────────────────────────────┐  │
│                  │ │ ⛔ 1 blocking action from Gate 3 outstanding (A3-001) │  │
│                  │ │                                                       │  │
│                  │ │ F4-001 | Critical | HV Clearance below threshold      │  │
│                  │ │         Status: VerifiedClosed ✅                    │  │
│                  │ │ F4-002 | Critical | Derating margin below threshold   │  │
│                  │ │         Status: VerifiedClosed ✅                    │  │
│                  │ │ F4-003 | Major    | Diagnostic net no test point      │  │
│                  │ │         Status: VerifiedClosed ✅                    │  │
│                  │ │ F4-004 | Major    | BOM/footprint mismatch C_HV_1    │  │
│                  │ │         Status: VerifiedClosed ✅                    │  │
│                  │ │                     [View All Findings & Actions →]   │  │
│                  │ └──────────────────────────────────────────────────────┘  │
│                  │                                                            │
│                  │ ┌─ AI Recommendation ──────────────────────────────────┐  │
│                  │ │ ℹ️  Advisory Only — Human Decision Required           │  │
│                  │ │ Recommended Outcome: Pass                             │  │
│                  │ │ Rationale: All four Phase 4 deterministic checks pass │  │
│                  │ │ in Rev B design. Phase 3 action A3-001 verified       │  │
│                  │ │ closed against revised design. No open blocking        │  │
│                  │ │ actions.                                               │  │
│                  │ │ Referenced Findings: F4-001, F4-002, F4-003, F4-004  │  │
│                  │ │ Referenced Checks: HC-P4-001, DR-P4-001, TP-P4-001,  │  │
│                  │ │                    CA-P4-001                          │  │
│                  │ └──────────────────────────────────────────────────────┘  │
│                  │                                                            │
│                  │              [Open Gate Review Workspace →]               │
└──────────────────┴───────────────────────────────────────────────────────────┘
```

---

## Phase Execution Status States (prominent bar, top of content area)

| Status | Visual | Trigger |
|--------|--------|---------|
| Waiting for User Input | 🔴 Red banner | UP input not yet uploaded |
| Waiting for Synthetic Sample Ingestion | 🟡 Amber banner | SI input not yet ingested |
| Ready to Run | 🟢 Green banner + active "Run Phase N" button | Both inputs validated and ready |
| Processing | 🔵 Blue banner + spinner + progress steps | Phase agent running |
| Awaiting Human Decision | 🟡 Amber banner + "Open Gate Review" button | Phase execution complete |
| Complete | ✅ Green banner | Gate decided |

---

## Input Card — UP (User-Provided File) Detail

```
┌─────────────────────────────────────────────────────────────────┐
│ [UP] Customer Opportunity Package                               │
│ Intake: User-Provided File                                      │
│ Format: PDF, DOCX, XLSX  |  Size: ≤10 rows or ≤2 pages         │
│ Required Content: [collapsible bullet list]                     │
│ ─────────────────────────────────────────────────────────────── │
│ Status: Awaiting User Input ●                                   │
│                                                                 │
│ [Download Sample Template]  (if available)                      │
│                                                                 │
│         [  Upload Customer Opportunity Package  ]               │
│                    (or drag and drop)                           │
│                                                                 │
│ ● NOT READY                                                     │
└─────────────────────────────────────────────────────────────────┘

After successful upload:
┌─────────────────────────────────────────────────────────────────┐
│ [UP] Customer Opportunity Package                               │
│ Active Artifact: COP-EV-INV-800-v1.pdf                         │
│ Active Version:  v1   |  Validated: 2026-08-10 14:32 UTC        │
│ Validation:      ✅ Pass — All required sections present        │
│ Required Action: None                                           │
│                                                                 │
│ ● READY            [Upload Revised Version]  [View]  [Download] │
│ [Open Intake Detail →]                                          │
└─────────────────────────────────────────────────────────────────┘

Validation failure state:
┌─────────────────────────────────────────────────────────────────┐
│ [UP] Customer Opportunity Package                               │
│ Status: Awaiting User Input ●                                   │
│                                                                 │
│ ❌ Validation Failed                                            │
│    • REQUIRED_SECTION_MISSING: "Voltage/Power Specifications"   │
│      section not found in uploaded file.                        │
│    • ROW_COUNT_WARNING: XLSX has 14 rows (guidance: ≤10).       │
│      You may proceed or trim the file.                          │
│                                                                 │
│ [  Upload Corrected File  ]                                     │
│ ● NOT READY                                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Input Card — SI (Simulated External-System Intake) Detail

```
┌─────────────────────────────────────────────────────────────────┐
│ [SI] Capability & Opportunity Assessment Package               │
│ Intake: Simulated External-System Intake                       │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ Simulated Connector — No live connection                  │  │
│ │ Preloaded Synthetic Sample                                │  │
│ │ System Represented: Salesforce / Cora / capability library│  │
│ └───────────────────────────────────────────────────────────┘  │
│ Format: XLSX  |  Size: ~10 rows                                 │
│ ─────────────────────────────────────────────────────────────── │
│ Status: Waiting for Synthetic Sample Ingestion ●               │
│                                                                 │
│ [ View Sample ]     [ Download Sample ]                        │
│                                                                 │
│ [  Ingest Sample  ]  ← disabled until View or Download clicked │
│                                                                 │
│ ● NOT READY                                                     │
└─────────────────────────────────────────────────────────────────┘

After ingestion:
┌─────────────────────────────────────────────────────────────────┐
│ [SI] Capability & Opportunity Assessment Package               │
│   Simulated Connector — No live connection                     │
│   Preloaded Synthetic Sample                                   │
│   System Represented: Salesforce / Cora / capability library   │
│ Active Artifact: CAP-ASSESS-PKG-v1.xlsx                        │
│ Active Version:  v1   |  Ingested: 2026-08-10 14:45 UTC        │
│ Validation:      ✅ Pass                                        │
│                                                                 │
│ ● READY                           [View]  [Download]           │
│ [Open Intake Detail →]                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Output Panel — States

| Status | Badge | Controls |
|--------|-------|----------|
| AwaitingReview | 🟡 "Awaiting Review" | [Approve] [Request Revision] [View] |
| Review Required | 🔶 "Review Required" (orange badge) | [Approve] [View] — shown after targeted rerun |
| Approved | ✅ "Approved" | [View] [Download] |
| Revision Requested | 🔴 "Revision Requested" | [View] |

---

## Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| "Run Phase N" button | Primary CTA (active only when Ready to Run) | Triggers phase execution with confirmation |
| "Upload [Artifact]" | File upload | Opens file picker; validates on submit |
| "Upload Revised Version" | File upload (secondary) | Opens file picker; new version created |
| "Ingest Sample" | CTA (disabled until reviewed) | Confirmation dialog → ingests SI sample |
| "Ingest Revised Sample" | CTA | Confirmation dialog → ingests revised SI sample |
| "Open Gate Review" | Navigation button | Navigate to AV-08 |
| "View All Findings & Actions" | Link | Navigate to AV-07 |
| "Open Intake Detail" | Link per input | Navigate to AV-04 |
| Output [View] button | Navigation | Navigate to AV-05 |
| Output [Approve] button | Action | Approve output; confirmation required |
| "Open Checklist" button | Navigation (Phases 0,1,3,4 only) | Navigate to AV-06 |

---

*UX-Mockup-TTCopilot | Screen-02 AV-03 | 2026-08-15 | Synthetic POC Data Only*
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
# Y0 — Interaction Patterns

---

## Pattern 1: Explicit Action Required (No Auto-Execution)

**When to use:** Any action with irreversible or significant state change consequences.
**Applies to:** "Ingest Sample", "Ingest Revised Sample", "Run Phase N", "Record Decision", "Close Action", "Cancel Phase"

**Behavior:**
1. Button is rendered in its normal state (not disabled unless prerequisite unmet).
2. User clicks button.
3. System shows a confirmation dialog before executing.
4. User must explicitly click "Confirm" in the dialog.
5. System executes the action and shows success/failure feedback.
6. Audit event written.

**Confirmation Dialog Template:**
```
┌─────────────────────────────────────────────────────┐
│ Confirm: [Action Name]                              │
│ ─────────────────────────────────────────────────── │
│ [Plain-language description of what will happen]   │
│ [Any irreversibility warning if applicable]         │
│                                                     │
│        [ Cancel ]    [ Confirm — [Action Name] ]    │
└─────────────────────────────────────────────────────┘
```

**Examples:**
- "You are recording PASS for Gate 4. This action cannot be undone. Confirm?"
- "Ingesting this synthetic sample will start the intake process. Confirm?"
- "Running Phase 4 will begin agent execution. Both inputs are Ready. Confirm?"

---

## Pattern 2: Progressive Disclosure for Status Details

**When to use:** Any status indicator that has a "why" behind it.
**Applies to:** Breadcrumb states, Phase Execution Status, Input readiness indicators

**Behavior:**
- Status badge shows the state label (e.g., "Awaiting Human Decision")
- Hover → tooltip or popover shows the specific reason (e.g., "Phase execution complete. 1 blocking action from Gate 3 outstanding.")
- Click → navigates to the relevant detail view

**Tooltip Pattern:**
```
Status: ⏳ Awaiting Human Decision
Reason: Phase execution complete.
        Blocking action A3-001 from Gate 3 must be
        closed before Gate 4 Pass can be recorded.
[ Open Gate Review → ]
```

---

## Pattern 3: Inline Validation Feedback

**When to use:** File upload validation (UP inputs)
**Applies to:** AV-03 input cards, AV-04 intake panel

**Behavior:**
1. User submits file.
2. System validates (spinner shown).
3. If validation fails: error(s) shown inline in the input card, per-field detail. Upload button remains available.
4. If validation passes: success confirmation shown. Status transitions. Upload control changes to "Upload Revised Version".
5. Warning-level issues (ROW_COUNT_WARNING, PAGE_COUNT_WARNING) shown in amber — user may proceed.

**Validation Error Display:**
```
❌ Validation Failed
   • REQUIRED_SECTION_MISSING: "Voltage/Power Specifications" not found.
   • PROJECT_ID_MISMATCH: File contains "EVINV-TEST-001"; expected "EVINV-POC-001".

⚠️ Warning (non-blocking):
   • ROW_COUNT_WARNING: 14 rows found (guidance: ≤10). You may proceed.

[  Upload Corrected File  ]
```

---

## Pattern 4: Intake Mode Badge System

**When to use:** Every input card in AV-03, AV-04; every artifact entry in AV-05, AV-08
**Applies to:** All input readiness panels

| Badge | Color | Meaning |
|-------|-------|---------|
| [UP] | Blue | User-Provided File |
| [SI] | Purple/grey | Simulated External-System Intake |

**SI input card always shows (cannot be hidden):**
```
┌──────────────────────────────────────────────────┐
│ Simulated Connector — No live connection         │
│ Preloaded Synthetic Sample                       │
│ System Represented: [system name(s)]             │
└──────────────────────────────────────────────────┘
```

**Never shown (prohibited):**
- "Connected to [SYSTEM]"
- "Retrieved from [SYSTEM]"
- "Live [SYSTEM] Data"
- "Real-time [SYSTEM]"

---

## Pattern 5: Blocking Action Banner

**When to use:** Whenever one or more blocking actions are open
**Applies to:** AV-03 (Findings section), AV-07 (top of page), AV-08 (Open Actions panel), AV-01 (Health Indicators)

**Visual treatment:** Red background banner, ⛔ icon, count

```
╔═══════════════════════════════════════════════════════╗
║ ⛔ BLOCKING ACTIONS — N outstanding                  ║
║ These actions must be closed before Gate Pass.       ║
╚═══════════════════════════════════════════════════════╝
```

**Pass radio behavior when blocking actions exist:**
```
○ Pass   ← disabled, greyed out
⚠️ Blocking actions must be closed before recording a Pass outcome.
   [ Go to A3-001 → ]
```

---

## Pattern 6: AI Recommendation "Advisory Only" Label

**When to use:** Any display of AI-generated gate recommendation
**Applies to:** AV-03 (AI Recommendation panel), AV-08 (AI Recommendation section)

**Required label (cannot be removed or hidden by configuration):**
```
ℹ️  Advisory Only — Human Decision Required
```

**Full AI Recommendation block:**
```
┌──────────────────────────────────────────────────────┐
│ ℹ️  Advisory Only — Human Decision Required          │
│ Recommended Outcome: [Pass / Conditional Pass / Fail]│
│ Rationale: [1–3 sentences]                          │
│ Referenced Findings: [ID list]                       │
│ Referenced Checks: [ID list]                         │
└──────────────────────────────────────────────────────┘
```

---

## Pattern 7: Immutable Record Visual Identity

**When to use:** AV-09 (Audit View) exclusively
**Applies to:** Page-level banner; no edit/delete controls anywhere on this view

```
🔒 Immutable Record — Append Only
```

- Top of page, always visible
- Page background: slightly different shade (e.g., light grey tint)
- No edit pencil icons, no delete icons, no approve/reject buttons
- Export only

---

## Pattern 8: Synthetic Data Disclaimer

**When to use:** Every view that displays synthetic artifacts or data
**Placement:** Always the first visual element in any artifact content area (AV-05); persistent top-bar badge in global shell

**Required disclaimer text (verbatim, never abbreviated):**
> "Synthetic POC Data. Not TT Electronics Product Data. Not for Design, Fabrication, Certification, Procurement, or Production."

**Visual treatment in AV-05:**
```
╔════════════════════════════════════════════════════════════════╗
║ ⚠️  SYNTHETIC POC DATA                                        ║
║ Not TT Electronics Product Data. Not for Design,              ║
║ Fabrication, Certification, Procurement, or Production.       ║
╚════════════════════════════════════════════════════════════════╝
```

**Global shell top bar:** `[SYNTHETIC POC]` badge — amber background, always visible on all 9 views.

---

## Pattern 9: Revised Version Workflow Labeling

**When to use:** Any time a new version of an existing input is being uploaded or ingested
**Applies to:** AV-03 input cards, AV-04 intake panel

| Context | Label to Use | Label Never Used |
|---------|-------------|-----------------|
| Upload control after first successful upload | "Upload Revised Version" | "Replace Input", "Re-upload", "replacement input" |
| SI revised sample notification | "Revised Synthetic System Sample Available — [System]" | "New sample loaded", "Input replaced" |
| SI revised sample action | "Ingest Revised Sample" | "Re-ingest", "Replace sample" |
| Status during revised sample wait | "Revised Sample Available; Ingest Required" | "New input ready" |

---

## Pattern 10: Gate Outcome Radio Button Control

**When to use:** AV-08 Gate Review Workspace — Human Decision section
**Critical behavior:**
- No option is pre-selected on page load (all three radios blank/unchecked)
- "Record Decision" button disabled until one option is selected
- "Pass" radio is additionally disabled (and shows warning message) if any blocking action has status ≠ VerifiedClosed
- On "Conditional Pass" selection: Conditional Pass Action form appears; "Record Decision" disabled until form complete

```
Gate Outcome:
  ○ Pass                        ← may be disabled (blocking actions)
  ○ Conditional Pass
  ○ Fail

  [No option pre-selected — human must choose]

  [ Record Decision ]  ← disabled until selection; enabled after
```

---

*UX-Mockup-TTCopilot | Y0-patterns | 2026-08-15 | Synthetic POC Data Only*
# Y1 — Responsive Considerations

---

## Breakpoints

| Breakpoint | Range | Layout strategy |
|------------|-------|----------------|
| Desktop (primary) | ≥1280px | Full sidebar + full content; all columns visible |
| Desktop (compact) | 1024px – 1279px | Sidebar collapsible; full content |
| Tablet | 768px – 1023px | Sidebar hidden (hamburger menu); single-column content; tables horizontally scrollable |
| Mobile | <768px | Out of scope for POC (Web Gate Cockpit, web only) |

> The POC targets desktop-first (≥1024px). The Web Gate Cockpit is an internal engineering tool; mobile is explicitly out of scope per PRD Section 9.

---

## Desktop (≥1280px) — Standard Layout

- Persistent left sidebar (240px) always visible
- Breadcrumb bar below top nav header
- Content area: 3-column grid where applicable (e.g., AV-03: input panel | output panel | AI recommendation)
- Phase summary table (AV-01): all 6 columns visible
- Findings table (AV-07): all 8 columns visible
- Comparison view (AV-05): 50%/50% split columns, fixed-width, always aligned

---

## Desktop (1024px – 1279px) — Compact

- Sidebar collapses to icon-only rail (48px); hover/click expands full sidebar as overlay
- Content area full-width
- AV-03 Phase Workspace: 2-column layout (inputs + execution status | outputs + recommendation)
- AV-07 Findings table: secondary columns (Seeded, Last Action) hidden by default; expandable per row
- Lifecycle view (AV-02): phase nodes in 5-across grid (2 rows of 5); horizontal scroll if viewport clips

---

## Tablet (768px – 1023px)

- Sidebar hidden; accessed via hamburger icon (☰) in top bar
- Breadcrumb: shows only "EV-INV-800 > Phase N > Gate N" (tech review segment omitted on narrow); full breadcrumb on hover/tap
- AV-03 Phase Workspace: single column; input cards stacked vertically; output panel below inputs
- AV-01 Phase Summary Table: columns reduced to Phase | Status | Gate Outcome; secondary columns hidden
- AV-07 Tables: horizontal scroll with sticky first column (ID); row expansion for full detail
- AV-05 Comparison Mode: vertical stacking (v1 above v2) instead of side-by-side; diff highlighted per field
- AV-08 Gate Review: single column; sticky "Human Decision" panel pinned to bottom of viewport
- AV-02 Lifecycle View: horizontal scroll; phase nodes in a single row
- File upload: same behavior (drag-and-drop replaced by button on touch devices)

---

## Specific Responsive Behaviors by View

### AV-01 Project Overview
- Desktop: 3-column health indicators + full 10-row table visible
- Tablet: health indicators stacked; table shows 4 columns (Phase, Status, Gate, Outcome); tap row to expand

### AV-02 Product Lifecycle View
- Desktop: horizontal timeline, all 10 phases visible
- Compact/Tablet: horizontal scroll; phase nodes fixed width; current phase centered in viewport

### AV-03 Phase Workspace
- Desktop: 2-panel layout (Input Readiness | Outputs/AI/Decision)
- Compact: sequential sections; Phase Execution Status always pinned at top
- Tablet: full-page scroll; "Open Gate Review" button floats at page bottom

### AV-05 Artifact Viewer — Comparison Mode
- Desktop: side-by-side 50/50 fixed-column layout (critical: columns must always align by field name)
- Tablet: stacked; v1 on top, v2 below; field labels repeat in each version block

### AV-07 Findings and Actions
- Desktop: full-width table with all columns
- Tablet: Blocking Actions section expands to full width; main table collapses to ID + Status + expand button

### AV-08 Gate Review Workspace
- All breakpoints: Human Decision panel (outcome radios + Record Decision button) sticky at bottom of viewport
- Tablet: content sections collapse to accordions (Inputs Reviewed, Outputs Reviewed, Check Results, Findings, Open Actions, AI Recommendation); Human Decision always expanded

---

## Typography and Spacing Scaling

| Element | Desktop | Compact | Tablet |
|---------|---------|---------|--------|
| Page heading | 24px | 22px | 20px |
| Section heading | 18px | 16px | 15px |
| Body / table | 14px | 13px | 13px |
| Status badges | 12px | 12px | 11px |
| Breadcrumb | 13px | 12px | 11px |
| Input card padding | 24px | 20px | 16px |
| Table row height | 48px | 44px | 40px |

---

## Touch Targets (Tablet)

- All interactive elements minimum 44×44px touch target
- Radio buttons (gate outcome): oversized tap area (full row clickable)
- "Record Decision" button: full-width on tablet (prevents missed tap)
- "Ingest Sample" / "Run Phase N": full-width CTA buttons on tablet

---

*UX-Mockup-TTCopilot | Y1-responsive | 2026-08-15 | Synthetic POC Data Only*
# Y2 — Accessibility Notes

---

## Color Contrast Requirements

All text meets WCAG 2.1 AA minimum contrast ratios (4.5:1 for body text; 3:1 for large text/UI components):

| Element | Foreground | Background | Ratio target |
|---------|-----------|------------|--------------|
| Body text | #1a1a2e (near-black) | #ffffff | ≥7:1 |
| Status badge text | #ffffff | state color | ≥4.5:1 |
| Blocking action banner | #ffffff | #b91c1c (red-700) | ≥4.5:1 |
| Amber/warning badge | #1a1a2e | #fbbf24 (amber-400) | ≥4.5:1 |
| Green success badge | #ffffff | #15803d (green-700) | ≥4.5:1 |
| Disabled button text | #6b7280 (grey-500) | #f3f4f6 (grey-100) | ≥3:1 |
| Synthetic data banner | #1a1a2e | #fef3c7 (amber-50) | ≥7:1 |
| Diff highlight (changed) | #1a1a2e | #fef08a (yellow-200) | ≥4.5:1 |

**Color is never the sole differentiator.** Status states use both color AND icon/text:
- ✅ Green + "Pass" text
- ❌ Red + "Fail" text
- ⏳ Amber + "Awaiting Decision" text
- 🔶 Orange + "Conditional Pass" text
- ⛔ Red + "Blocked" text

---

## Keyboard Navigation

All interactive elements are reachable and operable via keyboard alone:

| Key | Behavior |
|-----|---------|
| Tab | Move focus forward through interactive elements |
| Shift+Tab | Move focus backward |
| Enter / Space | Activate focused button, link, or radio button |
| Arrow keys | Navigate radio button groups (gate outcome selection) |
| Escape | Close confirmation dialogs without confirming |
| Enter | Confirm dialog (when confirm button has focus) |

### Focus Order (AV-03 Phase Workspace)
1. Breadcrumb links (left to right)
2. Phase Execution Status action button (if available)
3. External input card controls (View, Download, Upload, Ingest Sample)
4. Internal input card controls (View, Download, Upload, Ingest Sample)
5. Output card controls (View, Approve, Request Revision)
6. AI Recommendation (read-only, skip in tab order unless expandable)
7. Findings & Actions (View All link)
8. "Open Gate Review" button

### Focus Order (AV-08 Gate Review Workspace)
1. Breadcrumb
2. Inputs/Outputs reviewed (View links)
3. Check results (View link)
4. Findings (View All link)
5. Open Actions (link to AV-07)
6. AI Recommendation (read-only)
7. Reviewer Comments textarea
8. Gate Outcome radio group (Pass, Conditional Pass, Fail)
9. Conditional Pass Action form (if visible)
10. Record Decision button

### Focus Trap in Confirmation Dialogs
When a confirmation dialog is open:
- Tab cycles only within the dialog (Cancel ↔ Confirm)
- Escape = Cancel
- Focus returns to triggering button on dialog close

---

## Screen Reader Considerations

### ARIA Labels

| Element | ARIA attribute |
|---------|---------------|
| Input readiness "READY" / "NOT READY" indicator | `aria-label="[Artifact Name] input status: Ready"` |
| Radio button group | `role="radiogroup"` + `aria-labelledby="gate-outcome-heading"` |
| Disabled radio ("Pass" when blocking) | `aria-disabled="true"` + `aria-describedby="blocking-actions-message"` |
| Blocking action banner | `role="alert"` + `aria-live="assertive"` |
| Phase Execution Status (when it changes) | `aria-live="polite"` |
| "Record Decision" button (when disabled) | `aria-disabled="true"` + `aria-describedby="no-selection-hint"` |
| Synthetic data disclaimer banner | `role="note"` + `aria-label="Synthetic POC data disclaimer"` |
| Confirmation dialog | `role="dialog"` + `aria-modal="true"` + `aria-labelledby="dialog-title"` |
| Breadcrumb nav | `role="navigation"` + `aria-label="Lifecycle breadcrumb"` |
| Sidebar nav | `role="navigation"` + `aria-label="Main navigation"` |
| Audit View immutable banner | `role="status"` + `aria-label="Immutable record, append only"` |
| Version comparison table | `aria-label="Artifact comparison: version [v1] vs version [v2]"` |

### Dynamic Announcements

| Event | Announcement strategy |
|-------|----------------------|
| File upload validation complete | `aria-live="polite"`: "[Artifact Name] validated. Status: [Pass/Fail]." |
| Sample ingestion complete | `aria-live="polite"`: "[Artifact Name] ingested. Synthetic System Input Ready." |
| Phase execution status change | `aria-live="polite"`: "Phase [N] status: [new status]." |
| Blocking action banner appears | `aria-live="assertive"`: "N blocking actions outstanding. Pass outcome disabled." |
| Gate decision recorded | `aria-live="assertive"`: "Gate [N] decision recorded: [outcome]. Immutable." |
| Confirmation dialog opened | Focus moves to dialog; `aria-modal="true"` |

---

## Alternative Text

| Image/Icon | Alt text |
|-----------|----------|
| ✅ Pass icon | "Pass" |
| ❌ Fail icon | "Fail" |
| ⚠️ Warning icon | "Warning" |
| ⛔ Blocked icon | "Blocked" |
| ⏳ Awaiting Decision icon | "Awaiting human decision" |
| 🔶 Conditional Pass icon | "Conditional Pass" |
| ○ Upcoming icon | "Upcoming" |
| 🔒 Closed icon | "Project closed" |
| [SI] badge | "Simulated External-System Intake" |
| [UP] badge | "User-Provided File" |
| ✦ Seeded badge | "Seeded issue" |

---

## Form Accessibility

- All form fields have associated `<label>` elements (not just placeholder text)
- Required fields marked with `aria-required="true"` and visual asterisk
- Validation errors associated via `aria-describedby` pointing to error message element
- Error messages are programmatically associated with the field that failed
- File upload inputs have descriptive labels: `aria-label="Upload [Artifact Name] (PDF, DOCX, or XLSX)"`

---

## Table Accessibility

- All data tables use `<th>` with `scope="col"` for column headers
- Comparison tables use `<th>` with `scope="row"` for row headers (field names)
- Phase summary table (AV-01) summary row totals labeled with `aria-label`
- Findings/Actions tables use `aria-sort` on sortable columns

---

## Reduced Motion

- All transition animations respect `prefers-reduced-motion` media query
- Progress spinners: static indicator (percentage or step count) as fallback
- Phase Execution Status transitions: instant text update, no animated slide

---

*UX-Mockup-TTCopilot | Y2-accessibility | 2026-08-15 | Synthetic POC Data Only*
