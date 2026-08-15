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
