# User Journeys
## TT Manufacturing and Engineering Copilot

| Field | Value |
|-------|-------|
| **Product Name** | TT Manufacturing and Engineering Copilot |
| **Date** | 2026-08-15 |
| **Related Personas** | PERSONAS-TTCopilot.md |
| **Related JTBD** | JTBD-TTCopilot.md |
| **Related PRD** | PRD-TTCopilot.md |
| **Project** | EVINV-POC-001 |
| **Classification** | Internal POC — Synthetic Data Only |

> **Synthetic POC Data. Not TT Electronics Product Data. Not for Design, Fabrication, Certification, Procurement, or Production.**

---

## Journey Index

| ID | Persona | Scenario | Key JTBD | Stages |
|----|---------|----------|----------|--------|
| JRN-01.1 | PER-01 Marcus Webb | Phase 4 Flagship: Upload released design, review 4 deterministic check results, approve corrections, verify revised design, recommend Gate 4 Pass | JTBD-01.1, JTBD-01.2 | 7 |
| JRN-02.1 | PER-02 Priya Nair | Gate 2 Decision Moment: Monitor Phase 2 testability finding, approve clarification, run rerun, review RTM, record Gate 2 Pass | JTBD-02.1, JTBD-02.2, JTBD-02.3 | 6 |
| JRN-03.1 | PER-03 Claire Ashby | Phase 0 Commercial Assessment: Upload opportunity package, trigger simulated intake, review Gap Matrix, record Gate 0 Pass | JTBD-03.1, JTBD-03.3 | 6 |
| JRN-04.1 | PER-04 James Okoro | Phase 6 Manufacturing Readiness: Review Cpk failure, approve correction, ingest revised MES sample, verify rerun, record Gate 6 Pass | JTBD-04.2 | 7 |

---

## PER-01: Marcus Webb

### JRN-01.1: Phase 4 Flagship — Design Review, Deterministic Check Findings, and Gate 4 Pass

**Persona:** PER-01 (Marcus Webb)
**Scenario:** Marcus is the lead technical reviewer for the EV-INV-800 Phase 4 PCB Layout Review + CDR. He has uploaded the Released Detailed Design Baseline Package. The Phase Workspace shows both inputs are Ready. He triggers phase execution, waits for the AI draft and four deterministic checks to complete, then opens the Findings and Actions Workspace to see four seeded defects flagged — a high-voltage clearance violation, a capacitor below the derating margin, a diagnostic net without a test point, and a BOM/footprint mismatch. He approves the corrective actions, the engineer uploads a revised design, and Marcus reviews the rerun results side by side in the Artifact Viewer. With all four checks now passing and the Phase 3 coolant-connector action confirmed closed, he opens the Gate 4 Gate Review Workspace and selects Pass.
**Related Jobs:** JTBD-01.1, JTBD-01.2, JTBD-01.3

#### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|-------|--------|------------|----------|---------|------------|-------------|
| Upload Input | Opens Phase 4 Phase Workspace; uploads the Released Detailed Design Baseline Package; waits for validation confirmation | Phase Workspace — AV-03 (Input Intake Panel, F2) | "Let me make sure the file validates cleanly before I kick off the run — last time a wrong revision number caused a false start." | Cautious, methodical | Validation error messages are often generic; hard to know exactly which field failed without re-reading the whole file | Inline validation feedback highlighting the specific field or row that failed, with a suggested fix |
| Trigger Execution | Confirms both inputs are Ready; clicks "Run Phase 4"; monitors Phase Execution Status indicator | Phase Workspace — AV-03 (F0, F2) | "Both inputs are green. Good. Let me kick it off and come back when the AI draft is done." | Focused, slightly impatient | No estimated completion time; Marcus doesn't know whether to expect results in 30 seconds or 5 minutes | Progress indicator with estimated time remaining so Marcus can step away without anxiety |
| Review AI Outputs | Opens AI-drafted DFM & Standards Audit and BOM Health Report from the output panel; scans findings | Phase Workspace — AV-03 → Artifact Viewer — AV-05 (F8, F5) | "Four findings flagged. Good — that matches what I expected given the seeded design. Let me look at each one." | Curious, alert | Full audit and report are compact but still require careful reading to confirm all four checks are represented | Summary banner at the top of the Artifact Viewer showing count of Pass / Fail checks so Marcus can triage immediately |
| Inspect Deterministic Checks | Navigates to deterministic check results section; inspects each check — clearance, derating, test-point coverage, cross-artifact consistency — with formula, threshold, unit, result, and Pass/Fail status visible | Phase Workspace — AV-03 / Artifact Viewer — AV-05 (F5, F9) | "Clearance: 2.1 mm against a 3.0 mm threshold — clear fail. Derating: 18% margin when 25% is required — another fail. Test point NET_DIAG_03 missing — fail. BOM footprint CAP_C14 mismatch — fail. All four showing exactly as expected." | Confident, analytically engaged | Without the deterministic check panel, Marcus would have to recompute each value manually from a spreadsheet | Structured check panel eliminates manual recomputation; Marcus can focus on engineering judgment, not arithmetic |
| Approve Corrective Actions | Opens Findings and Actions Workspace; reviews all four findings with severity and blocking status; approves corrective actions; confirms Phase 3 coolant-connector action is also listed with status "Open — awaiting revised design" | Findings and Actions Workspace — AV-07 (F6, F10) | "I need to approve the actions before the corrective-design upload is unblocked. Let me confirm each one is correctly described before I sign off." | Deliberate, responsible | No easy way to see that approving all four actions simultaneously is safe — Marcus wants to verify each one individually | Per-action approval with a brief rationale field so Marcus's decisions are recorded and distinguishable in the audit trail |
| Review Revised Design | After corrected design is uploaded, reviews original vs. revised artifacts side by side in Artifact Viewer; confirms all four checks now Pass; confirms Phase 3 action status has changed to "Closed" with the revised design version referenced | Artifact Viewer — AV-05 (F3, F6) | "Original: four fails. Revised: four passes. Phase 3 action — closed against version Rev B. Everything lines up." | Relieved, satisfied | Side-by-side comparison requires careful visual scanning; no automated diff highlighting changes between versions | Visual diff highlights changed cells or rows between original and revised artifact so Marcus can confirm corrections precisely |
| Record Gate 4 Decision | Opens Gate Review Workspace — AV-08; reviews AI recommendation (Pass), open findings (none blocking), Phase 3 action (Closed), artifact versions reviewed; enters comments ("All four Phase 4 deterministic checks resolved in Rev B. Phase 3 action confirmed closed."); selects Pass | Gate Review Workspace — AV-08 (F10, F9) | "Everything is clean. AI recommendation aligns with my review. I'm selecting Pass. Let me write a brief rationale before I submit." | Confident, accountable | Gate Review Workspace must dynamically surface Phase 3 action closure — if it doesn't appear automatically, Marcus would need to navigate separately | Automatic cross-phase action summary in the Gate Review Workspace so Marcus never has to manually navigate to confirm prior-gate conditions |

#### Key Moments
- **Decision Point:** Approve Corrective Actions stage — Marcus decides whether each corrective action is correctly scoped; an overly broad or overly narrow action description here affects the rerun scope and what gets preserved in the audit trail.
- **Risk of Abandonment:** Inspect Deterministic Checks stage — if the check results are not clearly structured (formula, threshold, unit, result, Pass/Fail all visible without scrolling), Marcus may distrust the output and fall back to his personal spreadsheet, defeating the POC's core value.
- **Delight Opportunity:** Review Revised Design stage — seeing all four checks flip from Fail to Pass in a clean side-by-side comparison, with the Phase 3 action simultaneously confirmed closed, is the flagship moment of the entire POC demonstration.

#### Success Outcome
Marcus confirms all four Phase 4 deterministic check results, approves corrective actions, verifies the revised design resolves all findings, and records Gate 4 Pass — all within a single structured session and without opening any external spreadsheet or shared-drive document. (JTBD-01.1 success measure: under 5 minutes to confirm all four check results; JTBD-01.2 success measure: Phase 3 action closure confirmed within 60 seconds of opening Gate Review Workspace.)

#### Feature Touchpoints

| Stage | Features |
|-------|----------|
| Upload Input | F2 (Input Intake Framework), F8 (Compact Artifact Standards), F4 (Shared ProjectState) |
| Trigger Execution | F0 (Lifecycle Orchestration), F2, F4 |
| Review AI Outputs | F8, F5 (Deterministic Checks), F9 AV-03, AV-05 |
| Inspect Deterministic Checks | F5, F9 AV-05 |
| Approve Corrective Actions | F6 (Seeded Issues), F10 (Gate Review Model), F9 AV-07 |
| Review Revised Design | F3 (Input Versioning), F6, F9 AV-05 |
| Record Gate 4 Decision | F10, F9 AV-08 |

---

## PER-02: Priya Nair

### JRN-02.1: Gate 2 Decision Moment — Requirements Testability Finding, Rerun, and Gate 2 Pass

**Persona:** PER-02 (Priya Nair)
**Scenario:** Priya is chairing the Gate 2 review for the EV-INV-800 program. The Phase 2 requirements analysis is complete and the Requirements Traceability Matrix (RTM) and Testability Report have been generated. She opens the Product Lifecycle View and sees Phase 2 is in "Awaiting Human Decision" state. She navigates to the Gate 2 Gate Review Workspace and immediately notices a seeded testability finding — one efficiency requirement lacks a measurable acceptance criterion and is flagged as untestable. The AI recommends Conditional Pass. Priya reviews the finding detail, approves the corrective clarification action (which is marked as blocking), and monitors the rerun. After the requirement is clarified and the affected RTM rows are rerun, she reviews the updated Testability Report, confirms the finding is now resolved, and records Gate 2 Pass with her rationale and timestamp formally captured.
**Related Jobs:** JTBD-02.1, JTBD-02.2, JTBD-02.3

#### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|-------|--------|------------|----------|---------|------------|-------------|
| Monitor Lifecycle | Opens Product Lifecycle View; scans breadcrumb states for all phases; notes Phase 2 shows "Awaiting Human Decision" | Product Lifecycle View — AV-02 (F0, F4) | "Phase 2 is waiting on me. Let me make sure nothing else has shifted since yesterday — I don't want to approve one gate while a blocking action is open somewhere else." | Attentive, slightly anxious | The breadcrumb only tells Priya the state label, not why a phase is awaiting — she has to navigate to find out | Tooltip or summary popover on breadcrumb showing the specific reason a phase is awaiting human decision, saving one navigation step |
| Review Gate Workspace | Opens Gate 2 Gate Review Workspace; scans AI recommended outcome (Conditional Pass), open findings panel, and Phase 2 RTM and Testability Report outputs | Gate Review Workspace — AV-08 (F10, F9) | "AI is recommending Conditional Pass. One testability finding. Let me read the rationale before I decide whether to agree or override." | Focused, governance-minded | AI recommendation rationale may be brief — Priya needs enough context to make an accountable decision, not just a label | Expandable rationale panel that shows the specific requirement and testability flag that drove the Conditional Pass recommendation |
| Inspect Finding | Navigates to the testability finding detail; confirms the efficiency requirement REQ-EFF-003 lacks a measurable acceptance criterion; notes corrective action is marked "Blocking" — progression paused | Findings and Actions Workspace — AV-07 (F6, F10) | "One requirement without a measurable criterion. That's a real issue — if we can't test it, we can't ship. The blocking status is correct." | Concerned but methodical | Finding descriptions must be clear enough for Priya (non-engineer) to understand the severity and correct action without asking the engineering team | Plain-language finding summary alongside the technical detail — one sentence a non-engineer can read and act on |
| Approve Clarification Action | Reviews the corrective action record (Action ID, description, owner role, required closure evidence, blocking status); approves the clarification action; adds a comment ("Requirement REQ-EFF-003 must include a quantified acceptance criterion before rerun.") | Gate Review Workspace — AV-08 / Findings and Actions Workspace — AV-07 (F10, F6) | "I'm approving this action. The requirement owner needs to supply a measurable criterion — I'll record that explicitly so there's no ambiguity." | Deliberate, accountable | No in-line field for Priya to record the specific clarification she is requesting — her reasoning would live only in email without a structured comments field | Structured comments field on the corrective action approval record so Priya's rationale is formally linked to the action, not left in email |
| Confirm Rerun and Review Updated Outputs | After requirement clarification is ingested, reviews Audit View to confirm only affected RTM rows were rerun; opens revised RTM and Testability Report; confirms REQ-EFF-003 now carries a measurable acceptance criterion and the testability flag is resolved | Audit View — AV-09 / Artifact Viewer — AV-05 (F3, F9, JTBD-02.3) | "Audit View shows exactly which RTM rows were invalidated and rerun. The original testability failure is preserved alongside the revised pass. Good — this is what I'd need to show an auditor." | Reassured, confident | Without the Audit View showing rerun scope explicitly, Priya has no way to confirm that only affected rows were touched — she would have to ask the engineering team | Audit View rerun summary showing: input version that triggered rerun, checks invalidated, checks rerun, timestamp — all in one panel without pagination |
| Record Gate 2 Pass | Returns to Gate 2 Gate Review Workspace; reviews AI updated recommendation (now Pass after corrective action closure); enters comments ("REQ-EFF-003 testability requirement resolved. Rerun confirmed scoped correctly. Approving Gate 2 Pass."); selects Pass; confirms timestamp and artifact versions recorded | Gate Review Workspace — AV-08 (F10, F4, F9) | "Everything is resolved and documented. I'm selecting Pass. I want my rationale recorded against the specific artifact versions I reviewed — not in a follow-up email." | Confident, relieved | Gate decision record must capture artifact versions automatically — if Priya has to manually log which version she reviewed, errors creep in | Automatic artifact version capture in the gate decision record so Priya's decision is always linked to the exact inputs she reviewed |

#### Key Moments
- **Decision Point:** Approve Clarification Action stage — Priya decides whether to approve the blocking corrective action or raise a concern before the rerun proceeds. A poorly described action could lead to an incomplete correction that fails to resolve the testability flag.
- **Risk of Abandonment:** Monitor Lifecycle stage — if the breadcrumb states are ambiguous or stale, Priya may lose confidence in the system's accuracy and revert to emailing engineers for a manual status update, breaking the governance model.
- **Delight Opportunity:** Confirm Rerun and Review Updated Outputs stage — the Audit View showing an immutable, precise rerun scope record is the POC's clearest proof that AI-augmented governance can be fully auditable; this is the moment Priya can imagine showing an auditor the system.

#### Success Outcome
Priya reviews the Gate 2 testability finding, approves the clarification action, confirms the rerun scope in the Audit View, and records Gate 2 Pass — all within a single structured session and without opening email, a shared drive, or a separate tracking spreadsheet. (JTBD-02.1 success measure: gate decision in under 15 minutes of active review time; JTBD-02.3 success measure: correction cycle reconstructable in under 3 minutes from the Audit View.)

#### Feature Touchpoints

| Stage | Features |
|-------|----------|
| Monitor Lifecycle | F0 (Lifecycle Orchestration), F4 (Shared ProjectState), F9 AV-02 |
| Review Gate Workspace | F10 (Gate Review Model), F9 AV-08 |
| Inspect Finding | F6 (Seeded Issues), F10, F9 AV-07 |
| Approve Clarification Action | F10, F6, F9 AV-08, AV-07 |
| Confirm Rerun and Review Updated Outputs | F3 (Input Versioning), F9 AV-09, AV-05 |
| Record Gate 2 Pass | F10, F4, F9 AV-08 |

---

## PER-03: Claire Ashby

### JRN-03.1: Phase 0 Commercial Assessment — Opportunity Package Upload, Simulated Intake, Gap Matrix Review, and Gate 0 Pass

**Persona:** PER-03 (Claire Ashby)
**Scenario:** Claire has received a new EV traction inverter customer opportunity and needs to make a bid/no-bid decision before committing engineering resources. She opens the Phase 0 Phase Workspace in the Web Gate Cockpit. The workspace shows two input slots: one awaiting her Customer Opportunity Package upload, and one showing a preloaded Capability & Opportunity Assessment Package labeled as a simulated Salesforce/Cora synthetic connector. She uploads the customer document, validates it, then clicks "Ingest Sample" to confirm the simulated intake. Once both inputs are Ready, she triggers Phase 0 execution. The AI drafts a compact Opportunity Summary (≤2 pages) and a Capability-Match & Critical-Gap Matrix (≤10 rows), both clearly labeled as synthetic POC data. Claire reviews both outputs in the Artifact Viewer, confirms TT has the core capability with two manageable gaps, and then opens the Gate 0 Gate Review Workspace to record her Pass decision with commercial rationale captured in the structured comments field.
**Related Jobs:** JTBD-03.1, JTBD-03.3

#### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|-------|--------|------------|----------|---------|------------|-------------|
| Open Phase 0 Workspace | Navigates to Phase 0 Phase Workspace; sees two input readiness slots — one "Awaiting User Input" (Customer Opportunity Package), one showing the simulated Capability Assessment Package labeled "Simulated Connector / Preloaded Synthetic Sample" with View and Download controls | Phase Workspace — AV-03 (F2, F1) | "Good — I can see exactly what I need to provide and what the system has already preloaded. The label says synthetic, not live Salesforce. That's the right framing for the POC demo." | Reassured, orientated | If the simulated connector label were ambiguous or missing, stakeholders watching the demo might question whether real company data is being used | Prominent "Preloaded Synthetic Sample — No live Salesforce connection" label on the simulated intake slot, visible without scrolling |
| Upload Customer Package | Uploads the Customer Opportunity Package; system validates file type, required fields (Project ID, opportunity reference, product name, voltage/power specs), and size guidance; sees "User Input Ready" confirmation | Phase Workspace — AV-03, Input Intake Panel — AV-04 (F2, F8) | "Validation passed first time. The required fields checklist is clear — I knew exactly what to include in the document." | Confident, efficient | Validation failure messages need to be specific enough for Claire to fix the issue without calling an engineer | Field-specific validation errors with plain-language descriptions so Claire can self-serve the correction |
| Ingest Simulated Sample | Reviews preloaded synthetic Capability Assessment Package (simulated Salesforce/Cora data); clicks "Ingest Sample" to explicitly confirm ingestion; sees status change to "Synthetic System Input Ready" | Input Intake Panel — AV-04 (F2, F8) | "I need to confirm this action myself — the system isn't going to ingest it automatically. Good. That gives me control over when Phase 0 actually starts." | In control, deliberate | The distinction between "View" and "Ingest Sample" must be visually clear — an accidental click on Ingest should prompt a confirmation step | Confirmation dialog on "Ingest Sample" action with a brief description of what will happen next, preventing accidental execution |
| Trigger Phase 0 Execution | Both inputs show Ready; clicks "Run Phase 0"; Phase Execution Status shows Processing; waits for outputs to become available | Phase Workspace — AV-03 (F0, F2) | "Both inputs are confirmed ready. Let me run it. I'd rather wait a few minutes for a structured output than spend three days on email coordination." | Anticipatory, calm | No progress indicator means Claire doesn't know if the system is processing normally or stuck | Real-time Phase Execution Status transitions (Waiting → Processing → Awaiting Human Decision) give Claire confidence the run is progressing |
| Review Opportunity Summary and Gap Matrix | Opens Opportunity Summary (≤2 pages) and Capability-Match & Critical-Gap Matrix (≤10 rows) in the Artifact Viewer; both carry the synthetic disclaimer; reviews TT capability ratings against EV traction inverter requirements; notes two critical gaps flagged in the matrix | Artifact Viewer — AV-05 (F8, F9, F1) | "Two critical gaps: high-voltage isolation testing capability and automotive-grade thermal cycling certification. Both addressable with the right partner or investment — not show-stoppers. This is exactly the kind of structured summary I'd normally spend three days assembling." | Engaged, impressed | Gap Matrix rows must be actionable — vague gap descriptions ("capability concern") are not useful without a severity or recommended response | Each gap row includes a severity rating and a recommended response field (partner / invest / decline) so Claire can assess bid viability at a glance |
| Record Gate 0 Pass | Opens Gate 0 Gate Review Workspace; reviews AI recommendation (Pass with two conditional gaps noted), Opportunity Summary and Gap Matrix artifacts listed with version and provenance, open findings panel; enters commercial rationale ("EV-INV-800 opportunity is viable. Two gaps identified — thermal certification and HV isolation testing — both addressable. Recommending Gate 0 Pass with commercial team to confirm partnership strategy for gap mitigation."); selects Pass | Gate Review Workspace — AV-08 (F10, F9, F4) | "The AI recommendation aligns with my commercial read. Two gaps, both manageable. I'm recording Pass. My rationale is in the comments — this replaces the email I'd usually send." | Confident, decisive | Gate decision record must capture the specific artifact versions Claire reviewed — if this is done automatically, she doesn't need to maintain a separate version log | Automatic artifact version binding in the gate decision record so Claire's commercial rationale is formally linked to exactly the outputs she reviewed |

#### Key Moments
- **Decision Point:** Review Opportunity Summary and Gap Matrix stage — Claire decides whether the two identified gaps are manageable enough to recommend a Pass or whether a Fail or Conditional Pass is more appropriate; this is the commercial judgment call the entire Phase 0 flow is designed to support.
- **Risk of Abandonment:** Upload Customer Package stage — if validation fails with a cryptic error message, Claire may not be able to self-serve the fix and will need to call an engineer, delaying the assessment and undermining the POC's self-service value proposition.
- **Delight Opportunity:** Review Opportunity Summary and Gap Matrix stage — Claire's reaction to seeing a structured, compact, two-page AI-drafted summary that normally takes three days to assemble manually is the commercial equivalent of Marcus's four-check deterministic moment; the key framing is time saved and quality gained.

#### Success Outcome
Claire uploads the Customer Opportunity Package, triggers simulated ingestion, reviews the AI-drafted Opportunity Summary and Gap Matrix, and records Gate 0 Pass with commercial rationale — all within a single structured session and without email-based input collection. Gate decision record is immediately visible to Priya in the Audit View. (JTBD-03.1 success measure: complete Phase 0 assessment in one session; JTBD-03.3 success measure: gate decision recorded with all required fields in under 5 minutes.)

#### Feature Touchpoints

| Stage | Features |
|-------|----------|
| Open Phase 0 Workspace | F2 (Input Intake Framework), F1 (Artifact-Count Discipline), F9 AV-03 |
| Upload Customer Package | F2, F8 (Compact Artifact Standards), F9 AV-04 |
| Ingest Simulated Sample | F2, F8, F9 AV-04 |
| Trigger Phase 0 Execution | F0 (Lifecycle Orchestration), F2 |
| Review Opportunity Summary and Gap Matrix | F8, F1, F9 AV-05 |
| Record Gate 0 Pass | F10 (Gate Review Model), F4 (Shared ProjectState), F9 AV-08 |

---

## PER-04: James Okoro

### JRN-04.1: Phase 6 Manufacturing Readiness — Cpk Failure, Corrective Action, Revised MES Sample, and Gate 6 Pass

**Persona:** PER-04 (James Okoro)
**Scenario:** James is reviewing Phase 6 manufacturing readiness for the EV-INV-800 program. The simulated Manufacturing Process & Capability Package has been ingested from the synthetic MES/quality system connector, and the Customer Production-Readiness Package has been uploaded. After Phase 6 executes, James opens the Phase Workspace and immediately sees the Cpk deterministic check result flagged as Fail — the critical assembly characteristic Cpk is 0.98 against a synthetic threshold of 1.33. The check result shows the full formula, inputs, threshold, unit, result, and Pass/Fail status, computed outside the LLM. James reviews the MRL Scorecard and PPAP/FAI Readiness Index alongside the Cpk finding, approves the corrective action, triggers the "Revised Synthetic System Sample Available" workflow, monitors the rerun of only the affected Cpk check, and reviews the original Fail and revised Pass results side by side. With the Cpk now above threshold and all other outputs ready, he opens the Gate 6 Gate Review Workspace and records Pass.
**Related Jobs:** JTBD-04.2, JTBD-04.1

#### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|-------|--------|------------|----------|---------|------------|-------------|
| Open Phase 6 Workspace | Opens Phase 6 Phase Workspace; confirms the simulated Manufacturing Process & Capability Package has been ingested (status: "Synthetic System Input Ready") and Customer Production-Readiness Package is validated (status: "User Input Ready"); triggers Phase 6 execution | Phase Workspace — AV-03 (F2, F0) | "Both inputs are showing Ready. Good. I want to see the Cpk result and the MRL Scorecard before I think about Gate 6." | Focused, methodical | Without a clear status indicator distinguishing simulated intake from user-provided input, James might question which data source each input came from | Color-coded or icon-differentiated intake status badges (user-provided vs. simulated) so James can confirm both inputs at a glance |
| Inspect Cpk Deterministic Check | Navigates to deterministic check results in the Phase Workspace output panel; reads the Cpk check result: formula (Cpk = min(USL−μ, μ−LSL) / 3σ), inputs (μ=12.3 N·m, σ=1.8 N·m, USL=15.0, LSL=9.0), threshold (1.33), unit (dimensionless), result (0.98), status (FAIL), source (EVINV-POC-STD-001 §6.2), limitation (synthetic data — not production MES output) | Phase Workspace — AV-03 / Artifact Viewer — AV-05 (F5, F8) | "0.98 against a 1.33 threshold. That's a real process capability gap — the spread is too wide for the tolerance window. This is exactly what I'd expect to catch on a real program. Good that it's surfaced here automatically." | Analytically engaged, unsurprised | The Cpk formula and inputs must be human-readable, not just a raw JSON dump — James needs to verify the formula is being applied correctly, not just trust the number | Formatted check result panel with formula rendered in mathematical notation alongside a brief plain-language interpretation so James can verify the logic without parsing raw data fields |
| Review MRL Scorecard and PPAP/FAI Index | Opens MRL Scorecard (≤10 rows) and PPAP/FAI Readiness Index (≤10 rows) in the Artifact Viewer alongside the Cpk result; confirms all other readiness elements show Pass or Amber; Cpk is the only blocking item | Artifact Viewer — AV-05 (F1, F8) | "MRL is mostly green. PPAP elements are in order. The Cpk failure is isolated — this isn't a systemic manufacturing problem, it's a specific process parameter that needs adjustment." | Measured, analytical | Three outputs are spread across different views — James must mentally integrate the Cpk check, MRL Scorecard, and PPAP Index before forming a gate recommendation | Single-pane Phase 6 readiness summary consolidating Cpk status, MRL score, and PPAP readiness into one view before James drills into artifact detail |
| Approve Corrective Action | Opens Findings and Actions Workspace; reviews the Cpk finding record (finding ID, description "Cpk 0.98 below threshold 1.33 for torque characteristic", severity High, status Open, owner role Manufacturing Process Engineer, blocking status Blocking); approves corrective action; adds comment ("Process parameter adjustment required. Revised MES synthetic sample to be ingested once corrective process run is complete.") | Findings and Actions Workspace — AV-07 (F6, F10) | "I'm approving the corrective action. I want my comment to specify what the revised sample needs to demonstrate — not just 'fix the process' generically." | Responsible, precise | Corrective action approval field must allow a free-text rationale — without it, James's specific expectations for the revised sample are nowhere in the system | Structured corrective action approval form with a required rationale field so James's approval is always accompanied by actionable guidance |
| Ingest Revised MES Sample and Confirm Rerun | System makes "Revised Synthetic System Sample Available" banner visible; James clicks "Ingest Revised Sample" to confirm; monitors Phase Execution Status; system reruns only the Cpk check (not MRL Scorecard or PPAP Index); Audit View shows the rerun event with input version, invalidated check, and rerun check recorded | Phase Workspace — AV-03 / Audit View — AV-09 (F3, F6, F9) | "Good — only the Cpk check reran. The MRL and PPAP outputs weren't touched. The Audit View shows the exact rerun scope. This is what I'd need if QA ever asked why we didn't rerun the full phase." | Reassured, methodical | If the rerun scope is not explicitly shown in the Audit View, James must trust the system's claims without verification — a significant audit risk | Explicit rerun scope record in the Audit View showing: revised input version, checks invalidated, checks rerun, checks unaffected, timestamp — all in one panel |
| Compare Original and Revised Cpk Results | Opens Artifact Viewer; navigates to Cpk check comparison; sees original result (Fail, Cpk 0.98) alongside revised result (Pass, Cpk 1.41) with both input versions labeled and provenance visible | Artifact Viewer — AV-05 (F3, F5) | "Original: 0.98 — Fail. Revised: 1.41 — Pass. The corrective process run moved the Cpk above threshold by a comfortable margin. Both results are preserved. Perfect for the audit trail." | Satisfied, confident | Side-by-side comparison requires visual alignment between original and revised panels — if layout shifts or cells don't align, comparison is error-prone | Fixed-column side-by-side layout for deterministic check comparisons so original and revised rows always align by field name |
| Record Gate 6 Pass | Opens Gate 6 Gate Review Workspace; reviews AI recommendation (Pass after Cpk correction), Cpk check result version (revised), corrective action reference, MRL Scorecard and PPAP Index artifact versions; enters comments ("Cpk corrected to 1.41 (threshold 1.33). MRL and PPAP both gate-ready. Approving Gate 6 Pass."); selects Pass | Gate Review Workspace — AV-08 (F10, F9, F4) | "Everything checks out. AI recommendation is Pass. I agree. My rationale references the Cpk result version and the corrective action ID — that's the link QA will need if this decision is ever reviewed." | Decisive, accountable | Gate Review Workspace must automatically surface the Cpk check result version (not just the finding) so James doesn't have to manually copy the version number into his comments | Automatic deterministic check result version binding in the Gate Review Workspace so the gate record is always traceable to the exact check result that underpinned the Pass decision |

#### Key Moments
- **Decision Point:** Approve Corrective Action stage — James decides whether the corrective action description is specific enough to unambiguously guide the process adjustment; a vague corrective action could lead to a revised sample that still fails Cpk.
- **Risk of Abandonment:** Inspect Cpk Deterministic Check stage — if the Cpk formula and inputs are presented in raw JSON or in a format that requires decoding, James will not trust the result and will recompute it in his local spreadsheet, reverting to the old workflow and breaking the POC value proposition.
- **Delight Opportunity:** Compare Original and Revised Cpk Results stage — the clean side-by-side comparison showing a Fail result preserved alongside a Pass result, both linked to their respective input versions, is the manufacturing equivalent of Marcus's phase 4 moment; it demonstrates that the system can support an engineering audit without any spreadsheet reconstruction.

#### Success Outcome
James confirms the Phase 6 Cpk failure, approves the corrective action, ingests the revised MES sample, verifies the rerun passes (Cpk 1.41 > threshold 1.33), and records Gate 6 Pass — all within a single structured session, with the Cpk formula and threshold visible throughout and no external MES export or spreadsheet opened. (JTBD-04.2 success measure: complete Gate 6 decision within one structured session with Cpk formula and threshold visible; original and revised results preserved side by side.)

#### Feature Touchpoints

| Stage | Features |
|-------|----------|
| Open Phase 6 Workspace | F2 (Input Intake Framework), F0 (Lifecycle Orchestration), F9 AV-03 |
| Inspect Cpk Deterministic Check | F5 (Deterministic Engineering Checks), F8 (Compact Artifact Standards), F9 AV-05 |
| Review MRL Scorecard and PPAP/FAI Index | F1 (Artifact-Count Discipline), F8, F9 AV-05 |
| Approve Corrective Action | F6 (Seeded Issues), F10 (Gate Review Model), F9 AV-07 |
| Ingest Revised MES Sample and Confirm Rerun | F3 (Input Versioning), F6, F9 AV-03, AV-09 |
| Compare Original and Revised Cpk Results | F3, F5, F9 AV-05 |
| Record Gate 6 Pass | F10, F4 (Shared ProjectState), F9 AV-08 |

---

## Cross-Journey Patterns

### Common Pain Points Across All Journeys

- **Ambiguous status labeling:** All four personas encounter moments where a status indicator (breadcrumb, input readiness, check result) does not tell them *why* a phase is in its current state — only *that* it is. Marcus doesn't know why the check failed until he drills in; Priya doesn't know why a phase is awaiting decision until she navigates to the gate workspace; Claire doesn't know whether validation failed at file level or field level; James doesn't know which inputs drove the Cpk check until he reads the full panel. **Opportunity:** Contextual summary popovers or inline "why" text at every status indicator.

- **Multi-view mental integration:** Every persona must mentally connect outputs across two or more views before forming a decision — Marcus integrates the Artifact Viewer, the Findings Workspace, and the Gate Review Workspace; Priya integrates the Lifecycle View, the Gate Review Workspace, and the Audit View; Claire integrates the Intake Panel and the Artifact Viewer; James integrates the Phase Workspace, the Artifact Viewer, and the Findings Workspace. **Opportunity:** Per-phase readiness summary pane that consolidates the most relevant cross-view signals without requiring navigation.

- **Comments field underuse risk:** All four gate decisions (Gate 0, 2, 4, 6) require the persona to write a meaningful rationale in the comments field. None of the personas are prompted about what a useful comment looks like. Without guidance, comments risk being too generic ("Approved") to serve as audit evidence. **Opportunity:** Prompted comment template per gate type (commercial gate, requirements gate, design gate, manufacturing gate) with placeholder text showing what information an auditor would expect.

### Shared Opportunities

- **Universal side-by-side comparison:** Marcus (Phase 4 design correction), Priya (Phase 2 RTM rerun), and James (Phase 6 Cpk rerun) all need to compare original and revised artifacts or check results side by side. A consistent, fixed-column side-by-side layout in the Artifact Viewer would benefit all three and reduce per-journey UI complexity.

- **Explicit rerun scope record:** Priya and James both depend on the Audit View to confirm that a rerun touched only the affected checks. The same rerun scope panel design (input version → checks invalidated → checks rerun → timestamp) would serve both gate review and audit response scenarios without requiring separate UI components.

- **Corrective action rationale capture:** Marcus, Priya, and James all approve corrective actions at different gates. All three benefit from a structured rationale field on the approval record that links their reasoning to the specific finding and action ID — preventing the rationale from living only in email.

### Convergence Points

- **Gate Review Workspace (AV-08):** All four personas end their journeys at a Gate Review Workspace. The workspace must serve two very different audiences — a detail-oriented engineer (Marcus, James) who will read Cpk formulas and check result panels, and a governance-oriented program manager or commercial reviewer (Priya, Claire) who will read finding summaries and AI recommendations. The workspace must present both levels without one audience drowning out the other.

- **Findings and Actions Workspace (AV-07):** Marcus (Phase 4 corrections), Priya (Gate 2 blocking action), and James (Phase 6 Cpk corrective action) all interact with the same Findings and Actions Workspace. Blocking actions must be visually prominent for Priya's governance view, while the technical detail of each finding must be accessible to Marcus and James without excessive drilling.

- **Audit View (AV-09):** Priya and James both use the Audit View to confirm rerun scope after a correction cycle. The Audit View is also the permanent record that all four personas' gate decisions are written into. Its append-only, immutable design is a shared trust anchor across all personas.

---

## Journey-to-JTBD Traceability

| Journey Stage | JTBD ID | Expected Outcome |
|--------------|---------|-----------------|
| JRN-01.1: Upload Input | JTBD-01.1 | Released Detailed Design Baseline Package validates cleanly and Phase 4 execution is unblocked |
| JRN-01.1: Trigger Execution | JTBD-01.1 | Both inputs confirmed Ready; Phase 4 executes and deterministic checks run outside the LLM |
| JRN-01.1: Inspect Deterministic Checks | JTBD-01.1 | All four Phase 4 check results (clearance, derating, test-point coverage, cross-artifact consistency) displayed with formula, threshold, unit, result, and Pass/Fail status — no manual recomputation required |
| JRN-01.1: Approve Corrective Actions | JTBD-01.2, JTBD-01.3 | All four findings confirmed and corrective actions approved; Phase 3 action status visible as Open in the same workspace |
| JRN-01.1: Review Revised Design | JTBD-01.1, JTBD-01.2 | Original and revised Phase 4 check results preserved side by side; Phase 3 action confirmed Closed against revised design version |
| JRN-01.1: Record Gate 4 Decision | JTBD-01.2 | Gate 4 Pass recorded with AI recommendation, Phase 3 action closure evidence, reviewer role, comments, timestamp, and artifact versions — zero email reliance |
| JRN-02.1: Monitor Lifecycle | JTBD-02.2 | Product Lifecycle View breadcrumb shows accurate phase/gate state for all 10 phases without manual refresh |
| JRN-02.1: Review Gate Workspace | JTBD-02.1 | Gate Review Workspace surfaces AI recommendation, open findings, and Phase 2 outputs without requiring email gate pack |
| JRN-02.1: Inspect Finding | JTBD-02.2 | Testability finding surfaced automatically with blocking status; Priya does not need to ask the engineering team for status |
| JRN-02.1: Approve Clarification Action | JTBD-02.1 | Blocking corrective action approved with Priya's structured rationale formally recorded in the action record |
| JRN-02.1: Confirm Rerun and Review Updated Outputs | JTBD-02.3 | Audit View shows complete rerun scope (input version, invalidated checks, rerun checks, timestamp); original and revised RTM results preserved side by side |
| JRN-02.1: Record Gate 2 Pass | JTBD-02.1 | Gate 2 Pass recorded with full provenance; Priya's decision linked to artifact versions reviewed and open conditions resolved |
| JRN-03.1: Open Phase 0 Workspace | JTBD-03.1 | Phase Workspace shows both input slots with correct intake mode labels; simulated connector labeled as synthetic with no claim of live Salesforce connectivity |
| JRN-03.1: Upload Customer Package | JTBD-03.1 | Customer Opportunity Package validates successfully; status shows "User Input Ready" |
| JRN-03.1: Ingest Simulated Sample | JTBD-03.1 | Claire explicitly confirms "Ingest Sample" action; system records intake event with full provenance; status shows "Synthetic System Input Ready" |
| JRN-03.1: Trigger Phase 0 Execution | JTBD-03.1 | Both inputs confirmed Ready; Phase 0 executes and AI drafts Opportunity Summary and Gap Matrix |
| JRN-03.1: Review Opportunity Summary and Gap Matrix | JTBD-03.1 | AI-drafted outputs are ≤2 pages and ≤10 rows respectively; both carry synthetic disclaimer; Claire can assess bid viability without email coordination |
| JRN-03.1: Record Gate 0 Pass | JTBD-03.3 | Gate 0 Pass recorded with commercial rationale, AI recommendation, artifact versions, and timestamp; decision immediately visible to Priya in Audit View |
| JRN-04.1: Open Phase 6 Workspace | JTBD-04.2 | Phase Workspace shows both Phase 6 inputs with correct intake status; execution triggered with both inputs Ready |
| JRN-04.1: Inspect Cpk Deterministic Check | JTBD-04.2 | Cpk check result displayed with formula, inputs, threshold, unit, result (0.98 Fail), and source reference — computed outside LLM; no external spreadsheet required |
| JRN-04.1: Review MRL Scorecard and PPAP/FAI Index | JTBD-04.2 | MRL Scorecard and PPAP/FAI Readiness Index both ≤10 rows; structured and compact; Cpk is the only blocking item |
| JRN-04.1: Approve Corrective Action | JTBD-04.2 | Cpk corrective action approved with James's structured rationale; finding linked to revised synthetic MES sample workflow |
| JRN-04.1: Ingest Revised MES Sample and Confirm Rerun | JTBD-04.2 | Dependency-aware rerun touches only the Cpk check; MRL and PPAP outputs unaffected; Audit View records full rerun scope |
| JRN-04.1: Compare Original and Revised Cpk Results | JTBD-04.2 | Original Fail (Cpk 0.98) and revised Pass (Cpk 1.41) preserved side by side in Artifact Viewer with input versions labeled |
| JRN-04.1: Record Gate 6 Pass | JTBD-04.2 | Gate 6 Pass recorded with Cpk result version, corrective action reference, James's comments, and timestamp — no external MES export or spreadsheet referenced |

---

*Document generated by Pivota Spec Framework*
*Last updated: 2026-08-15*
*Project: EVINV-POC-001 | PRD: PRD-TTCopilot-v1.0 | Synthetic POC Data. Not TT Electronics Product Data. Not for Design, Fabrication, Certification, Procurement, or Production.*
