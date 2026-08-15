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
