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
