# Jobs to Be Done
## TT Manufacturing and Engineering Copilot

| Field | Value |
|-------|-------|
| **Product Name** | TT Manufacturing and Engineering Copilot |
| **Date** | 2026-08-15 |
| **Related Personas** | PERSONAS-TTCopilot.md |
| **Related PRD** | PRD-TTCopilot.md |
| **Project** | EVINV-POC-001 |
| **Classification** | Internal POC — Synthetic Data Only |

> **Synthetic POC Data. Not TT Electronics Product Data. Not for Design, Fabrication, Certification, Procurement, or Production.**

---

## JTBD Summary

| ID | Persona | Job Statement | Priority |
|----|---------|--------------|----------|
| JTBD-01.1 | PER-01 Marcus Webb | When reviewing Phase 4 outputs, I want to verify all four deterministic check results without manual recomputation, so I can reach a gate-ready decision with confidence in the engineering evidence. | P0 |
| JTBD-01.2 | PER-01 Marcus Webb | When Gate 4 sign-off is approaching, I want to confirm that all Phase 3 conditional-pass actions are visibly closed in the revised design, so I can approve the design freeze without relying on email threads or shared drives. | P0 |
| JTBD-01.3 | PER-01 Marcus Webb | When working through the Phase 3 or Phase 4 technical review checklist, I want to record evidence and mark items complete in a structured workspace, so I can produce an auditable checklist record without assembling separate spreadsheets. | P1 |
| JTBD-02.1 | PER-02 Priya Nair | When chairing a gate review meeting, I want to reach a structured gate decision with AI recommendation, open findings, and pending actions all in one workspace, so I can make an accountable go/no-go decision without assembling a pre-meeting email package. | P0 |
| JTBD-02.2 | PER-02 Priya Nair | When monitoring a program in flight, I want to track all open conditional-pass actions across phases in a single view with blocking vs. parallel status clearly distinguished, so I can identify what is holding up progression before it becomes a gate-delay risk. | P0 |
| JTBD-02.3 | PER-02 Priya Nair | When a corrective action is completed and a revised input is provided, I want to confirm that only the affected checks were rerun and that original results are preserved alongside revised results, so I can satisfy audit inquiries without reconstructing the decision history manually. | P1 |
| JTBD-03.1 | PER-03 Claire Ashby | When evaluating a new customer opportunity, I want to review an AI-drafted Opportunity Summary and Capability-Match & Critical-Gap Matrix generated from simulated intake data, so I can make a structured bid/no-bid recommendation in a single session rather than coordinating inputs across colleagues over several days. | P0 |
| JTBD-03.2 | PER-03 Claire Ashby | When ready to commit to a proposal, I want to review a compact AI-drafted Costed Proposal and Resource Schedule that clearly labels all data as synthetic, so I can approve or request revision at Gate 1 with the commercial rationale formally recorded. | P0 |
| JTBD-03.3 | PER-03 Claire Ashby | When closing Gate 0 or Gate 1, I want to record my commercial decision with comments in a structured Gate Review Workspace, so I can hand off a formally documented commercial baseline to the program team without communicating the outcome by email. | P1 |
| JTBD-04.1 | PER-04 James Okoro | When reviewing Phase 5 validation evidence, I want the thermal exceedance finding to be surfaced automatically by the V&V Matrix, so I can focus my review on the flagged issue and its corrective action rather than manually cross-referencing ten test records against ten acceptance criteria. | P0 |
| JTBD-04.2 | PER-04 James Okoro | When assessing Phase 6 manufacturing readiness, I want to inspect the Cpk deterministic check result — computed outside the LLM — alongside the MRL Scorecard and PPAP/FAI Readiness Index, so I can make the Gate 6 decision with process capability evidence formally visible rather than relying on a manually assembled dashboard. | P0 |
| JTBD-04.3 | PER-04 James Okoro | When completing Phase 7 production transfer, I want to capture the torque variation finding in a structured Lessons-Learned Register and confirm the Transfer-Completeness Report is ready, so I can close Gate 7 with retrievable institutional knowledge rather than a Word document distributed by email. | P1 |

---

## PER-01: Marcus Webb — Jobs

### JTBD-01.1: Verify Deterministic Check Results at Phase 4

**Job Statement:**
When reviewing the Phase 4 DFM & Standards Audit and BOM Health Report after the AI draft is available, I want to inspect all four deterministic check results — high-voltage clearance, component derating, test-point coverage, and cross-artifact consistency — in a single structured workspace, so I can reach a gate-ready engineering decision without recomputing a single value manually.

**Current Alternatives:**
- Computes clearance margins and derating factors in ad hoc spreadsheets; cross-references results manually against BOM extracts and schematic captures
- Navigates between four disconnected files (layout export, BOM, schematic PDF, checklist) to piece together a coherent picture of whether all four checks pass
- Relies on personal memory or email notes to track which check results have been reviewed and which have outstanding concerns

**Hiring Criteria:**
- Displays each deterministic check with: inputs used, formula/method, threshold, unit, result, and Pass/Fail status — no recomputation required
- Flags the specific finding (clearance below threshold, capacitor below derating margin, diagnostic net without test point, BOM/footprint mismatch) with a source reference in the same view
- Check results are version-aware: reruns automatically when a revised design input is provided; original and revised results preserved side by side
- Phase 4 check workspace loads and displays all four results in under 10 seconds

**Success Measure:** Marcus can confirm all four Phase 4 deterministic check results and identify any failed check within 5 minutes of opening the Phase Workspace, without opening any external spreadsheet or design tool.

**Related Features:** F5, F6, F9 (AV-03, AV-05)
**Priority:** P0

---

### JTBD-01.2: Confirm Phase 3 Action Closure Before Gate 4 Sign-Off

**Job Statement:**
When Gate 4 sign-off is approaching and the revised Phase 4 design has been ingested, I want to see the Phase 3 conditional-pass action (coolant-connector orientation) explicitly confirmed as closed in the revised design — visible in the Gate Review Workspace without navigating email or shared drives — so I can approve the design freeze with documented evidence that the prior gate condition is satisfied.

**Current Alternatives:**
- Relies on email reminders from the program manager to check whether the Phase 3 action has been addressed
- Re-reads the full revised design package to search for evidence of the correction — no structured flag surfaces the result
- Records action closure informally in a comment on a shared-drive document with no link to the gate decision record

**Hiring Criteria:**
- Phase 3 conditional-pass action appears in the Gate 4 Gate Review Workspace with status "Closed" and the evidence artifact version that confirmed closure
- The Artifact Viewer shows the original and revised Phase 4 design side by side, with the Phase 3 action item visually linked to the relevant change
- Gate 4 cannot reach a Pass decision if the linked conditional-pass action is still shown as Open — blocking status enforced in the gate workspace
- Action closure evidence includes: action ID, source gate, required closure evidence, artifact version that satisfied closure, human approver, and timestamp

**Success Measure:** Marcus can confirm Phase 3 action closure status at Gate 4 within 60 seconds of opening the Gate Review Workspace, with zero reliance on email or external tracking tools.

**Related Features:** F6, F10, F9 (AV-07, AV-08)
**Priority:** P0

---

### JTBD-01.3: Complete Technical Review Checklist in a Structured Workspace

**Job Statement:**
When working through the Phase 3 Schematic Review / PDR checklist or the Phase 4 PCB Layout Review + CDR checklist, I want to mark items complete, attach evidence artefacts, and record actions against specific items in the Technical Checklist Workspace, so I can produce an auditable checklist record that is formally linked to the gate package without assembling a separate Excel sheet.

**Current Alternatives:**
- Tracks checklist progress in a shared Excel file with no formal link to design artifacts or the gate decision record
- Evidence is attached to email threads referencing checklist item numbers — no structured link exists between the item, the evidence artifact, and the gate decision
- Relies on the program manager to chase outstanding checklist items; no automated status surfacing

**Hiring Criteria:**
- Displays selected checklist items from the mapped technical review (Phase 3: Schematic Review; Phase 4: PCB Layout/CDR) with evidence, status, and action fields per item
- No checklist content displayed for Phase 2 or Phases 5–9 — only the four mapped technical reviews are shown
- Evidence artifacts attached to checklist items are stored with provenance and are visible in the Artifact Viewer
- Checklist item status (Complete / Incomplete / Action Raised) is reflected in the Gate Review Workspace at gate time

**Success Measure:** Marcus can work through the Phase 4 PCB Layout/CDR checklist, attach evidence for each selected item, and confirm checklist readiness for Gate 4 within a single review session, with all item statuses persisted in ProjectState.

**Related Features:** F9 (AV-06), F4, F10
**Priority:** P1

---

## PER-02: Priya Nair — Jobs

### JTBD-02.1: Reach a Gate Decision Without Pre-Meeting Email Assembly

**Job Statement:**
When chairing a gate review meeting for any gate from Gate 0 through Gate 9, I want a single Gate Review Workspace that surfaces the AI recommended outcome, open findings, outstanding conditional-pass actions, artifact versions reviewed, and a field for my comments and gate decision, so I can make an accountable, fully traceable go/no-go decision without requiring the team to assemble an email-based gate pack the night before.

**Current Alternatives:**
- Engineers assemble a PowerPoint or email package the day before each gate review containing status updates, open issues, and artifact links from shared drives
- Priya reviews the presentation in the meeting and records the gate decision in email or a shared spreadsheet — no formal link exists between the decision and the artifacts reviewed
- Conditional-pass conditions are captured in meeting notes and tracked in a separate spreadsheet with no automatic escalation

**Hiring Criteria:**
- Gate Review Workspace rendered dynamically from ProjectState — no separate gate-pack artifact created or required
- Displays at minimum: active inputs, outputs reviewed, findings, open actions (with blocking/parallel status), AI recommended outcome with rationale, human comments field, and Pass / Conditional Pass / Fail decision selector
- Every gate decision record persists: AI recommendation, human disposition, reviewer role, comments, decision, timestamp, artifact versions reviewed, and open conditions
- Gate pauses and waits for explicit human action at every gate — no auto-advance in any code path

**Success Measure:** Priya can review all gate-relevant information and record a gate decision at any gate within a single session (target: under 15 minutes of active review time), without opening email, a shared drive, or a separate tracking spreadsheet.

**Related Features:** F10, F9 (AV-08), F4, F0
**Priority:** P0

---

### JTBD-02.2: Track Open Conditional-Pass Actions Across All Phases

**Job Statement:**
When monitoring the EV-INV-800 program across multiple active phases, I want to see all open conditional-pass actions and findings consolidated in a Findings and Actions Workspace with blocking vs. parallel status clearly indicated, so I can identify exactly what is preventing phase progression before it escalates to a gate-delay risk — without asking individual engineers for status updates.

**Current Alternatives:**
- Tracks conditional-pass actions in a separate Excel spreadsheet that is updated manually by engineers after each gate; no automatic escalation when a due phase approaches
- Has no direct view into whether a corrective action has been submitted — relies on email from the engineer who owns it
- Cannot tell, without asking the team, whether a revised design input has triggered rerun of affected checks

**Hiring Criteria:**
- Findings and Actions Workspace displays all findings and actions across all phases with: finding ID, source phase/gate, description, severity, status, action owner role, blocking/parallel status, due phase/gate, and required closure evidence
- Blocking actions surfaced prominently and visually distinguished from parallel actions — cannot be silently bypassed en route to gate progression
- Lifecycle breadcrumb on all nine views reflects accurate phase and gate state (Completed, Current, Awaiting Human Decision, Conditional Pass, Blocked, Upcoming, Closed) at all times
- View updates in real time as findings are raised and actions are closed — no manual refresh or spreadsheet reconciliation required

**Success Measure:** Priya can identify all blocking actions across the full program within 2 minutes of opening the Findings and Actions Workspace, with zero reliance on engineer-provided status updates or external spreadsheets.

**Related Features:** F9 (AV-07, AV-02), F4, F0, F10
**Priority:** P0

---

### JTBD-02.3: Validate Correction Cycle Completeness Through the Audit View

**Job Statement:**
When a corrective action is completed and a revised input is provided for Phases 4, 5, or 6, I want to confirm in the Audit View that the dependency-aware rerun touched only the affected checks and that original results are preserved alongside revised results, so I can respond to audit inquiries about the correction cycle with documented evidence rather than reconstructing the history from email and shared-drive versions.

**Current Alternatives:**
- Has no system view of which checks were rerun after a revised design input was provided — relies on the engineer's verbal confirmation
- Original check results are overwritten when corrections are made; no side-by-side comparison is available after the fact
- Audit evidence for correction cycles is reconstructed from email threads and file timestamps on shared drives, which is time-consuming and unreliable

**Hiring Criteria:**
- Audit View is immutable and append-only — every intake event, version change, check rerun, and gate decision is recorded with full provenance and cannot be modified
- Artifact Viewer shows original and revised versions of affected artifacts side by side for Phases 4, 5, and 6 correction cycles
- ProjectState records which checks were invalidated and rerun when a revised input was provided, and which checks were unaffected — dependency scope is visible in the Audit View
- Audit View loads within 5 seconds for the full program history with all events visible without pagination barriers

**Success Measure:** Priya can reconstruct the complete correction cycle history for any phase — showing which checks ran, on which input version, with original and revised results — within 3 minutes using the Audit View and Artifact Viewer, without consulting any engineer.

**Related Features:** F9 (AV-09, AV-05), F3, F4, F6
**Priority:** P1

---

## PER-03: Claire Ashby — Jobs

### JTBD-03.1: Make a Bid/No-Bid Assessment from Simulated Intake Data

**Job Statement:**
When a new EV traction inverter opportunity arrives and I need to assess whether TT should pursue the bid, I want to upload the Customer Opportunity Package and trigger ingestion of the simulated Salesforce/Cora Capability Assessment Package, then immediately review the AI-drafted Opportunity Summary and Capability-Match & Critical-Gap Matrix, so I can make a structured bid/no-bid recommendation in a single session rather than coordinating capability inputs across engineering, operations, and finance over multiple days.

**Current Alternatives:**
- Emails engineering, operations, and finance contacts to gather capability inputs; waits 1–3 days for responses; assembles a gap assessment manually in Word and Excel
- No structured gap matrix exists — Claire constructs it from scratch for each bid based on colleague inputs and her own judgement
- AI tools Claire has experimented with receive the full customer requirements document and produce generic summaries that do not reflect TT's specific capability constraints or historical project data

**Hiring Criteria:**
- Phase 0 supports exactly one user-provided input (Customer Opportunity Package) and one simulated system input (Capability & Opportunity Assessment Package — labeled clearly as synthetic, from simulated Salesforce and Cora)
- AI-drafted Opportunity Summary is ≤2 pages and AI-drafted Gap Matrix is ≤10 rows — both reviewable within a single session
- Simulated intake is clearly labeled "Simulated Connector / Preloaded Synthetic Sample" at all times — no label implies live Salesforce or Cora connectivity
- Ingestion requires explicit "Ingest Sample" action from Claire — no automatic ingestion without user confirmation

**Success Measure:** Claire can complete the Phase 0 bid/no-bid assessment — from uploading the Customer Opportunity Package through reviewing the AI-drafted Gap Matrix — within one structured session, with no email-based input collection required.

**Related Features:** F1, F2, F8, F9 (AV-03, AV-04)
**Priority:** P0

---

### JTBD-03.2: Review and Approve the Costed Proposal Before Gate 1

**Job Statement:**
When Phase 1 processing is complete and the AI-drafted Costed Proposal and Resource & Milestone Schedule are available for review, I want to assess both documents as compact, clearly labeled synthetic artifacts and either approve them or request revision before the Gate 1 decision, so I can commit to a commercially sound proposal baseline with the approval formally captured — not communicated by email.

**Current Alternatives:**
- Assembles the costed proposal manually in Microsoft Word with embedded cost tables sourced from finance and engineering colleagues — process takes 2–3 days of coordination and produces an output that is immediately out of date when engineering inputs change
- Cross-references parametric cost estimates against historical project data manually — no automated consistency check flags cost outliers or schedule conflicts
- Gate 1 outcome is communicated by email; no structured record links the commercial decision to the specific artifact versions reviewed or the approval status

**Hiring Criteria:**
- Costed Proposal is ≤2 pages and Resource & Milestone Schedule is ≤10 rows, both carrying the required synthetic disclaimer
- Artifact Viewer provides direct download of approved Phase 1 outputs with provenance metadata (source, version, phase, intake type, timestamp)
- Claire can request revision of either output before Gate 1 — the system tracks revision requests and holds gate progression until she approves the final versions
- Gate 1 decision record includes: AI recommendation, human disposition, Claire's comments, timestamp, and the specific artifact versions reviewed

**Success Measure:** Claire can review, optionally request revision of, and formally approve the Phase 1 Costed Proposal and Resource Schedule within a single session, with the Gate 1 decision record complete and no separate email or document needed to communicate the outcome.

**Related Features:** F1, F8, F10, F9 (AV-03, AV-05, AV-08)
**Priority:** P0

---

### JTBD-03.3: Record a Formal Commercial Gate Decision at Gate 0 or Gate 1

**Job Statement:**
When I am ready to close Gate 0 or Gate 1 after reviewing the phase outputs, I want to select my gate outcome (Pass / Conditional Pass / Fail), enter my commercial rationale in a structured comments field, and have the decision formally recorded in the Gate Review Workspace with all supporting artifact versions linked, so I can hand off a documented commercial baseline to the program team without the outcome living only in an email thread.

**Current Alternatives:**
- Gate 0 and Gate 1 outcomes are communicated by email to the program manager; no structured record exists linking the commercial decision to the artifact versions reviewed
- Commercial rationale is captured in meeting notes or email body text — not formally linked to the gate record, making it difficult to retrieve during later reviews or audits
- No objective record distinguishes between a provisional go-ahead and a full Pass — conditional passes with specific actions are not formally tracked

**Hiring Criteria:**
- Gate Review Workspace at Gate 0 and Gate 1 presents: AI recommended outcome with rationale, Phase 0/1 outputs reviewed, open findings, and Claire's comments field — all in one view
- Exactly three gate outcomes available: Pass, Conditional Pass, Fail — human-selected only; AI recommendation is advisory with no decision authority
- Conditional Pass at Gate 0 or Gate 1 generates tracked actions with: action ID, description, owner role, blocking/parallel status, due phase, required closure evidence
- Gate decision record is permanently stored in ProjectState and visible in the Audit View with full provenance — immutable after submission

**Success Measure:** Claire can record a formal Gate 0 or Gate 1 decision with commercial rationale in under 5 minutes, with the resulting record containing all required fields and visible to the program manager in the Audit View without any email follow-up.

**Related Features:** F10, F9 (AV-08, AV-09), F4, F0
**Priority:** P1

---

## PER-04: James Okoro — Jobs

### JTBD-04.1: Identify the Thermal Exceedance Finding in Phase 5 V&V Review

**Job Statement:**
When the Phase 5 V&V Matrix and Gate 5 Summary are ready for review, I want the thermal result that exceeds the synthetic acceptance criterion to be automatically surfaced as a flagged finding in the V&V Matrix — without me manually cross-referencing ten test records against ten requirement acceptance criteria — so I can focus my review time on the flagged issue, assess the corrective action, and confirm the rerun passes before recommending Gate 5.

**Current Alternatives:**
- Manually exports test results from a separate Excel file and cross-references each result against the relevant acceptance criterion row by row — a process that takes 45–90 minutes and is prone to oversight when the exceedance is small
- The thermal exceedance on real programs is discovered late in the review cycle, after gate preparation is already underway, which delays gate scheduling
- No structured mechanism links the thermal finding to a corrective action workflow that tracks revised input ingestion and check rerun

**Hiring Criteria:**
- V&V Matrix automatically flags any result that exceeds its synthetic acceptance criterion with a Pass/Fail status field — the thermal exceedance finding is present in the Phase 5 V&V Matrix without requiring manual identification
- Finding triggers a structured corrective action record: finding ID, description, severity, owner role, required closure evidence, status
- After corrective action is approved and revised Validation Evidence Package is provided, only affected V&V checks rerun — original exceedance result and revised pass result preserved side by side in the Artifact Viewer
- Gate 5 Summary clearly states the thermal finding, the corrective action taken, and the revised result — all within the ≤2-page compact format

**Success Measure:** James can identify the Phase 5 thermal exceedance finding, approve the corrective action, and confirm the rerun passes — all within a single review session — without manually cross-referencing any external test data export.

**Related Features:** F5, F6, F9 (AV-03, AV-05, AV-07), F1
**Priority:** P0

---

### JTBD-04.2: Assess Process Capability at Phase 6 with Deterministic Cpk Evidence

**Job Statement:**
When the Phase 6 Manufacturing Process & Capability Package is ingested and the Cpk check has run, I want to inspect the deterministic Cpk result — computed outside the LLM, showing formula, threshold, unit, result, and Pass/Fail status — alongside the Manufacturing Readiness Level Scorecard and PPAP/FAI Readiness Index, so I can make the Gate 6 decision with objective process capability evidence formally visible rather than relying on a manually computed spreadsheet that has no link to the gate record.

**Current Alternatives:**
- Computes Cpk manually using a local spreadsheet fed by MES data exports; the result is not automatically linked to the acceptance threshold or to the gate decision record
- MRL scorecard is constructed from scratch for each program using a shared-drive template with no structured readiness scoring or scoring history
- PPAP checklists live in a shared drive with no automated readiness index — James manually determines whether each PPAP element is complete

**Hiring Criteria:**
- Phase 6 Cpk deterministic check displays: inputs used, formula, threshold, unit, result, Pass/Fail status, source reference, and known limitations — computed outside the LLM for correctness and reproducibility
- When the initial Cpk check fails, system provides a "Revised Synthetic System Sample Available" workflow; after James approves the corrective action and the revised MES sample is ingested, only the Cpk check reruns — original Fail and revised Pass results preserved side by side
- Phase 6 outputs (MRL Scorecard and PPAP/FAI Readiness Index) are ≤10 rows each, structured and compact, with stable IDs, units, and source references
- Gate 6 decision record includes the Cpk check result version, corrective action reference, and James's approval — all in the Gate Review Workspace

**Success Measure:** James can confirm the Phase 6 Cpk result, approve the corrective action, verify the rerun passes, and make the Gate 6 decision within a single structured session — with the Cpk formula and threshold visible — without opening any external MES export or spreadsheet.

**Related Features:** F5, F6, F9 (AV-03, AV-08), F1, F10
**Priority:** P0

---

### JTBD-04.3: Capture Transfer Findings in a Retrievable Lessons-Learned Register

**Job Statement:**
When Phase 7 transfer review is complete and the torque variation finding has been identified, I want to capture it in a structured Lessons-Learned Register — with stable IDs, finding descriptions, root cause, corrective action, and phase reference — and confirm the Transfer-Completeness Report is ready for Gate 7 sign-off, so I can close the phase with institutional knowledge that is retrievable by future programs rather than a Word document distributed by email and lost between programs.

**Current Alternatives:**
- Captures lessons learned in a Word template distributed by email after each production transfer — no structured format, no stable IDs, and no central repository makes lessons retrievable for new programs
- Transfer completeness is assessed informally; no structured report tracks which transfer elements are complete and which have open actions
- Gate 7 is approved based on verbal confirmation of transfer completeness, with no formal link between the approval and the evidence artifacts reviewed

**Hiring Criteria:**
- Phase 7 Lessons-Learned Register is a structured XLSX (≤10 rows) with stable IDs, finding descriptions, root cause, improvement action, owner role, and phase reference — not a Word document
- Register is available in the Artifact Viewer with full provenance (source, version, phase, intake type, timestamp) and is directly downloadable
- Transfer-Completeness Report (≤2 pages) formally lists transfer elements with completion status and any open improvement actions — linked to the Gate 7 gate decision record
- Gate 7 decision record includes James's review confirmation, AI recommendation, comments, and the artifact versions of the Lessons-Learned Register and Transfer Report reviewed

**Success Measure:** James can capture the torque variation finding in the Lessons-Learned Register, confirm the Transfer-Completeness Report is complete, and record the Gate 7 decision — all within a single session — with the Register subsequently retrievable by future program teams from the Artifact Viewer.

**Related Features:** F6, F1, F9 (AV-05, AV-08), F10, F8
**Priority:** P1

---

## Outcome-to-Feature Traceability

| JTBD ID | Feature(s) | Expected Outcome |
|---------|-----------|-----------------|
| JTBD-01.1 | F5, F6, F9 (AV-03, AV-05) | Marcus confirms all four Phase 4 deterministic check results in a single structured workspace without manual recomputation; failed checks are flagged with source references |
| JTBD-01.2 | F6, F10, F9 (AV-07, AV-08) | Phase 3 conditional-pass action closure is visible in the Gate 4 Gate Review Workspace with artifact version evidence; blocking status prevents Pass if action is still open |
| JTBD-01.3 | F9 (AV-06), F4, F10 | Technical review checklist items for Phase 3 and Phase 4 are completed with evidence in the structured workspace; checklist status is linked to the gate decision record |
| JTBD-02.1 | F10, F9 (AV-08), F4, F0 | Gate decision is recorded with AI recommendation, human disposition, reviewer role, comments, timestamp, and artifact versions — no email gate-pack required at any gate |
| JTBD-02.2 | F9 (AV-07, AV-02), F4, F0, F10 | All conditional-pass actions across all phases are visible in one workspace with blocking/parallel status; lifecycle breadcrumb reflects accurate phase/gate state at all times |
| JTBD-02.3 | F9 (AV-09, AV-05), F3, F4, F6 | Correction cycle history is fully reconstructable from the Audit View; dependency-aware rerun scope is documented; original and revised results preserved side by side |
| JTBD-03.1 | F1, F2, F8, F9 (AV-03, AV-04) | Claire completes Phase 0 bid/no-bid assessment in one session from structured AI-drafted outputs generated from clearly labeled simulated intake data — no email coordination required |
| JTBD-03.2 | F1, F8, F10, F9 (AV-03, AV-05, AV-08) | Gate 1 decision record links approval to specific artifact versions of the Costed Proposal and Resource Schedule; revision requests are tracked; outcome does not live in email |
| JTBD-03.3 | F10, F9 (AV-08, AV-09), F4, F0 | Formal Gate 0/Gate 1 commercial decision is stored in ProjectState with all required fields; program team can access the record in the Audit View without email follow-up |
| JTBD-04.1 | F5, F6, F9 (AV-03, AV-05, AV-07), F1 | Phase 5 thermal exceedance is surfaced automatically in the V&V Matrix; corrective action and rerun results are linked; original and revised results preserved side by side |
| JTBD-04.2 | F5, F6, F9 (AV-03, AV-08), F1, F10 | Phase 6 Cpk check result — formula, threshold, unit, result, Pass/Fail — is formally visible in the Gate 6 workspace; Cpk correction cycle is fully traceable in ProjectState |
| JTBD-04.3 | F6, F1, F9 (AV-05, AV-08), F10, F8 | Phase 7 Lessons-Learned Register is structured, retrievable from Artifact Viewer with provenance, and linked to the Gate 7 decision record — not a Word document distributed by email |

---

## NaC Preview

| JTBD ID | Outcome | Candidate NaC |
|---------|---------|--------------|
| JTBD-01.1 | Deterministic check results visible without manual recomputation | Given Marcus opens the Phase 4 Phase Workspace after AI draft is complete, when he navigates to the deterministic checks section, then all four check results (clearance, derating, test-point coverage, cross-artifact consistency) are displayed with formula, threshold, unit, result, and Pass/Fail status — and no external spreadsheet is required to interpret any result |
| JTBD-01.2 | Phase 3 action closure confirmed in Gate 4 workspace | Given the Phase 3 coolant-connector action has been resolved in the revised design, when Marcus opens the Gate 4 Gate Review Workspace, then the conditional-pass action from Gate 3 is shown with status "Closed", the artifact version that confirmed closure, and the human approver — and the Pass outcome is no longer blocked |
| JTBD-01.3 | Technical checklist completed and linked to gate record | Given Marcus is working through the Phase 4 PCB Layout/CDR checklist in the Technical Checklist Workspace, when he marks a selected item complete and attaches an evidence artifact, then the item status and evidence link are persisted in ProjectState and visible in the Gate Review Workspace at Gate 4 |
| JTBD-02.1 | Gate decision reached in one session without email assembly | Given Priya opens the Gate Review Workspace for any gate, when the phase outputs are complete, then she can review AI recommendation, open findings, blocking actions, and artifact versions reviewed — and record a Pass/Conditional Pass/Fail decision with comments — without navigating to any external system |
| JTBD-02.2 | All conditional-pass actions visible in one workspace | Given one or more conditional-pass actions are open across multiple phases, when Priya opens the Findings and Actions Workspace, then all open actions are listed with action ID, source phase/gate, blocking/parallel status, due phase, and required closure evidence — and blocking actions are visually distinguished |
| JTBD-02.3 | Correction cycle reconstructable from Audit View | Given a revised input was provided for Phase 4, 5, or 6 and affected checks were rerun, when Priya opens the Audit View, then every rerun event is recorded with: input version that triggered the rerun, checks invalidated, checks rerun, timestamp — and the Artifact Viewer shows original and revised results side by side |
| JTBD-03.1 | Bid/no-bid assessment completed in one session | Given Claire uploads the Customer Opportunity Package and ingests the simulated Capability Assessment Package, when AI processing completes, then she can review an Opportunity Summary (≤2 pages) and Gap Matrix (≤10 rows) — both clearly labeled "Synthetic POC Data" — within the same session, with no email coordination required |
| JTBD-03.2 | Costed Proposal formally approved before Gate 1 | Given the Phase 1 AI-drafted Costed Proposal and Resource Schedule are available, when Claire reviews and approves them, then the Gate 1 decision record stores: AI recommendation, her comments, approval timestamp, and the exact artifact versions approved — and no separate email is needed to communicate the outcome |
| JTBD-03.3 | Commercial gate decision formally recorded | Given Claire is ready to close Gate 0 or Gate 1, when she selects her gate outcome and submits comments in the Gate Review Workspace, then the decision is stored in ProjectState with all required fields and is immediately visible to Priya in the Audit View — with no email follow-up needed |
| JTBD-04.1 | Thermal exceedance surfaced automatically | Given the Phase 5 Validation Evidence Package contains a thermal result that exceeds the synthetic acceptance criterion, when AI processing completes, then the V&V Matrix flags that specific result with Pass/Fail status — and James does not need to manually cross-reference any external test data file to identify the finding |
| JTBD-04.2 | Cpk evidence visible in Gate 6 workspace | Given the Phase 6 Cpk check has run outside the LLM, when James opens the Gate 6 Gate Review Workspace, then the Cpk result is displayed with formula, threshold, unit, result, and Pass/Fail status — and the MRL Scorecard and PPAP/FAI Readiness Index are both present in the same view |
| JTBD-04.3 | Lessons-Learned Register retrievable from Artifact Viewer | Given Phase 7 transfer review is complete and the torque variation finding has been captured, when James or a future program team opens the Artifact Viewer and navigates to Phase 7, then the Lessons-Learned Register (structured XLSX, ≤10 rows) is available for download with full provenance metadata — not a Word document in a shared drive |

---

*Document generated by Pivota Spec Framework*
*Last updated: 2026-08-15*
*Project: EVINV-POC-001 | PRD: PRD-TTCopilot-v1.0 | Synthetic POC Data. Not TT Electronics Product Data. Not for Design, Fabrication, Certification, Procurement, or Production.*
