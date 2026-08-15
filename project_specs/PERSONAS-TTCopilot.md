# Personas
## TT Manufacturing and Engineering Copilot

| Field | Value |
|-------|-------|
| **Product Name** | TT Manufacturing and Engineering Copilot |
| **Date** | 2026-08-15 |
| **Related PRD** | PRD-TTCopilot.md |
| **Project** | EVINV-POC-001 |
| **Classification** | Internal POC — Synthetic Data Only |

---

## Persona Summary

| ID | Name | Role | Primary Goal |
|----|------|------|--------------|
| PER-01 | Marcus Webb | Engineering / Technical Reviewer | Review AI-drafted phase outputs for Phases 3–4, run deterministic checks, and make gate-ready decisions at PCB Layout Review and CDR |
| PER-02 | Priya Nair | Program / Project Manager | Monitor gate progress across all 10 phases, track open actions, and drive gate decisions with full traceability |
| PER-03 | Claire Ashby | Commercial / Proposal Reviewer | Evaluate bid/no-bid readiness and validate the costed proposal in Phases 0–1 before lifecycle commitment |
| PER-04 | James Okoro | Quality / Manufacturing Engineer | Validate process capability, PPAP readiness, and lessons-learned completeness in Phases 5–7 |

---

## PER-01: Marcus Webb

**Role & Context:**
Marcus is a senior electronics engineer at TT Electronics, specialising in power electronics hardware — specifically high-voltage traction inverter design. He sits within the engineering function and is the primary technical reviewer for Phases 3 and 4 of the ENG 001 v4.1 lifecycle. On any given NPI A program, Marcus is responsible for conducting the Schematic Review / PDR (Phase 3) and the PCB Layout Review + CDR (Phase 4), reviewing AI-drafted DFM findings, checking that deterministic clearance and derating results align with engineering expectations, and signing off the design baseline before it freezes.

Marcus works from a dual-monitor engineering workstation. He spends the bulk of his day in design tools and review documents, navigating between schematics, BOM exports, layout files, and process checklists. Today he assembles gate packages manually — pulling schematic captures, BOM extracts, DFM annotation markups, and checklist evidence from shared drives and email threads. He is deeply comfortable with engineering calculations and standards but frustrated by the fragmentation: the clearance margin he just computed in a spreadsheet has no formal link to the BOM or the gate record. He expects an AI-augmented tool to surface structured findings, trace them back to source documents, and hold all evidence in one place — but he insists on reviewing every finding himself before any gate recommendation is accepted.

**Goals:**
- Review AI-drafted DFM findings and deterministic check results (clearance, derating, test-point coverage, cross-artifact consistency) without having to recompute them manually (F5)
- Inspect original and revised design artefacts side by side when correction cycles close a seeded finding (F3, F5, F6)
- Work through the Phase 3 Schematic Review / PDR checklist and Phase 4 PCB Layout / CDR checklist in a structured workspace — not a shared Excel sheet (F9 AV-06)
- Approve or override AI gate recommendations at Gate 3 and Gate 4 with full rationale captured in the audit record (F10)
- Confirm that Phase 3 conditional-pass actions are visibly closed in the Phase 4 revised design before Gate 4 sign-off (F6, F10)

**Pain Points:**
- Currently assembles Phase 3 and Phase 4 gate packages from disconnected sources (email attachments, shared drives, PLM exports) — no single structured state tracks what was reviewed and what findings were raised (PRD §2)
- Clearance margins and derating calculations are computed manually in ad hoc spreadsheets; results are not automatically cross-referenced to the BOM or linked to gate evidence (PRD §2)
- Conditional-pass actions from Gate 3 have no structured tracking mechanism — Marcus relies on email reminders to verify they are closed before Gate 4 (PRD §2)
- No objective check confirms whether the revised design addresses all four Phase 4 seeded issues; he must re-read the full package to verify (PRD §2, F6)
- Existing general-purpose AI tools receive full design documents as context and produce inconsistent DFM analysis (PRD §2)

**Technical Expertise:** Expert — deep power electronics engineering knowledge; comfortable with engineering calculation tools, PLM/EDA systems, and structured review checklists; familiar with EVINV-POC-STD-001 threshold concepts; prefers structured views over free-text chat

**Top Tasks:**
1. Review AI-drafted DFM & Standards Audit (Phase 4 Output 1) and validate all four deterministic check results — clearance, derating, test-point coverage, cross-artifact consistency (daily during Phase 4, critical)
2. Work through PCB Layout Review + CDR checklist in the Technical Checklist Workspace, attaching evidence and marking items complete (daily during Phase 4, critical)
3. Compare original vs. revised design artefacts in the Artifact Viewer after correction cycle to verify all seeded findings are resolved (as-needed, critical)
4. Review Phase 3 Schematic Review / PDR checklist and approve the PDR Readiness Summary (weekly during Phase 3, high)
5. Select gate outcome (Pass / Conditional Pass / Fail) in the Gate Review Workspace at Gate 3 and Gate 4, with comments recorded (per gate, critical)

**Success Criteria:**
- Can verify all four Phase 4 deterministic check results without recomputing a single value manually
- Phase 3 conditional-pass action status is visible in the Gate 4 Gate Review Workspace without navigating email or shared drives
- Original and revised Phase 4 artefacts are available for side-by-side comparison in the Artifact Viewer
- Gate 3 and Gate 4 decisions are recorded with reviewer role, comments, AI recommendation, and human disposition in the audit trail
- Technical Checklist Workspace shows selected representative items with evidence and action fields — no invented checklist items for Phase 2 or Phases 5–9

---

## PER-02: Priya Nair

**Role & Context:**
Priya is a program manager at TT Electronics, responsible for driving the EV-INV-800 NPI A program from Gate 0 through Gate 9. She does not perform detailed engineering calculations herself but is the accountable decision-maker at every gate. Her role spans the full lifecycle — she owns the gate storyline, monitors open actions across all phases, ensures conditional-pass conditions are resolved before progression, and is the primary user of the Project Overview, Product Lifecycle View, and Gate Review Workspace on a daily basis.

Priya works from a laptop, often in gate review meetings with cross-functional teams. She currently coordinates gate readiness through email status updates, shared tracking spreadsheets, and presentations assembled by engineers the night before each gate. She has no single view of which phases are complete, which actions are blocking, and what evidence has been reviewed. Her biggest challenge is that gate decisions are made without a structured record — AI recommendations, human overrides, rationale, and artifact versions are not formally linked in any system. She is not deeply technical but is highly governance-minded: she cares deeply about traceability, audit completeness, and clear accountability at every step.

**Goals:**
- See a persistent, accurate lifecycle breadcrumb across all 10 phases and 10 gates without opening multiple systems (F0, F9 AV-02)
- Make gate decisions at every gate with a structured AI recommendation, full findings summary, and open actions visible in one workspace — no email assembly required (F10, F9 AV-08)
- Track all open and conditional-pass actions across phases in one view, with blocking vs. parallel status clearly distinguished (F9 AV-07)
- Confirm that the gate storyline (G0 Pass → … → G9 Pass and close) is progressing and that no gate has been auto-advanced by the AI (F0, F10)
- Access the full audit trail of every gate decision, intake event, and human approval at any time (F4, F9 AV-09)

**Pain Points:**
- Gate reviews currently require engineers to assemble email attachments and shared-drive packages the day before — Priya receives a presentation, not a structured workspace (PRD §2)
- No single system links gate outcomes to the specific artifact versions reviewed and the open conditions attached to a Conditional Pass (PRD §2)
- Open actions from conditional-pass gates are tracked in a separate spreadsheet with no automatic escalation when a due phase is approaching (PRD §2)
- Priya cannot tell, without asking the team, whether a revised input has triggered rerun of affected checks — or whether the gate package reflects the latest design state (PRD §2)
- Human decision latency is high because reviewers must navigate multiple tools to reach a decision point (PRD §2)

**Technical Expertise:** Intermediate — comfortable with web applications, governance dashboards, and structured forms; does not use engineering calculation tools; expects the system to surface structured summaries and action lists rather than raw engineering outputs

**Top Tasks:**
1. Review the Gate Review Workspace at each gate — inspect AI recommendation, open findings, outstanding actions, and artifact versions reviewed — then select gate outcome (per gate, critical)
2. Monitor the Product Lifecycle View for phase/gate state changes across all 10 phases and confirm no auto-advance has occurred (daily, high)
3. Check the Findings and Actions Workspace for blocking actions due at the current phase, and confirm closure evidence is present before gate sign-off (weekly, high)
4. Navigate to any prior completed phase via breadcrumb to review its approved outputs and gate decision record (as-needed, medium)
5. Review the Audit View after a correction cycle to confirm revised inputs triggered the correct dependency-aware rerun (as-needed, medium)

**Success Criteria:**
- Can reach a gate decision at any gate within one session without opening email, a shared drive, or a separate tracking spreadsheet
- Every gate decision record contains: AI recommendation, human disposition, reviewer role, comments, timestamp, and artifact versions reviewed
- Blocking actions from conditional-pass gates are surfaced prominently and cannot be silently bypassed
- Project lifecycle breadcrumb reflects accurate phase and gate state at all times across all nine application views
- Audit View shows an immutable, append-only record of every intake event and gate decision for the full program

---

## PER-03: Claire Ashby

**Role & Context:**
Claire is a commercial and proposals manager at TT Electronics. She is the primary human decision-maker for Phase 0 (Bid/No-Bid) and Phase 1 (Costed Proposal / Business Case). Her role spans pre-contract commercial assessment: evaluating whether TT has the capability and capacity to pursue an opportunity, reviewing the AI-drafted opportunity summary and gap matrix, and approving the costed proposal and resource schedule before commitments are made to the customer.

Claire works primarily from her laptop, splitting time between Salesforce, email, and proposal documents. She is responsible for the commercial gate decisions at Gate 0 and Gate 1. Today she receives customer requirement packages, pulls together capability assessments from colleagues across engineering and operations, and produces proposals in Microsoft Word with embedded cost tables. The process is heavily manual, takes days of internal coordination, and produces outputs that are immediately out of date when engineering inputs change. She needs the Copilot to surface a structured AI-drafted summary and gap matrix from simulated Salesforce and capability data, allow her to upload the customer package, and give her a clear gate workspace where she can review the AI recommendation and make the commercial go/no-go decision with the rationale recorded.

**Goals:**
- Upload the Customer Opportunity Package and see an AI-drafted Opportunity Summary and Capability-Match & Critical-Gap Matrix generated from simulated Salesforce/Cora data — without manually assembling inputs from multiple colleagues (F1, F2, Phase 0)
- Review the Costed Proposal and Resource & Milestone Schedule AI drafts for Phase 1, approve or request revision, and record the commercial gate decision at Gate 1 (F1, F10, Phase 1)
- Confirm that the simulated intake connector clearly labels its source as synthetic — so the POC demo is credible to stakeholders and no one mistakes simulated Salesforce data for live data (F2, F8)
- Ensure the Phase 0 and Phase 1 outputs are compact (1–2 pages / ~10 rows) and reviewable within a single session, not 40-page proposal documents (F8)
- Access the Gate Review Workspace at Gate 0 and Gate 1 with the AI recommendation, findings, and her comments in a structured record (F10)

**Pain Points:**
- Capability and opportunity assessment today requires manually gathering inputs from engineering, operations, and finance — no single system surfaces a structured gap analysis (PRD §2)
- Proposal documents are assembled ad hoc in Word and Excel; version control is informal, and the approved version is not formally linked to the gate decision record (PRD §2)
- No objective cost and capability check: Claire must cross-reference parametric cost estimates against historical project data manually (PRD §2)
- The AI tools Claire has experimented with receive the full customer requirements document as context and produce generic summaries that don't reflect TT's specific capability constraints (PRD §2)
- Gate 0 and Gate 1 outcomes are communicated by email; no structured record links the commercial decision to the artifact versions that were reviewed (PRD §2)

**Technical Expertise:** Intermediate — proficient with Salesforce, Microsoft Office, and web-based proposal tools; comfortable with structured forms and dashboards; does not use engineering calculation tools; expects narrative summaries and compact tables, not raw technical schemas

**Top Tasks:**
1. Upload the Customer Opportunity Package in Phase 0 and trigger ingestion of the simulated Salesforce/Cora Capability Assessment Package, then review the AI-drafted Opportunity Summary and Gap Matrix (weekly during active bids, critical)
2. Review and approve (or request revision of) Phase 1 Costed Proposal and Resource & Milestone Schedule before Gate 1 (per bid cycle, critical)
3. Select gate outcome (Pass / Conditional Pass / Fail) at Gate 0 and Gate 1 in the Gate Review Workspace, with commercial rationale recorded in comments (per gate, critical)
4. View the Phase 0 and Phase 1 lifecycle breadcrumb status to confirm the program has passed commercial gates before engineering phases begin (as-needed, high)
5. Download Phase 0 and Phase 1 approved outputs (Opportunity Summary, Costed Proposal) from the Artifact Viewer for customer-facing or internal distribution (as-needed, medium)

**Success Criteria:**
- Can complete Phase 0 bid/no-bid assessment and gate decision in a single structured session without email-based input collection
- Phase 1 Costed Proposal and Resource Schedule are available as compact, reviewable AI drafts (≤2 pages / ≤10 rows) with synthetic disclaimer visible
- Gate 0 and Gate 1 decision records include AI recommendation, human disposition, Claire's comments, and timestamp
- Simulated intake connectors are clearly labeled as synthetic at all times — no label implies live Salesforce or Cora connectivity
- Artifact Viewer provides direct download of approved Phase 0 and Phase 1 outputs with provenance metadata

---

## PER-04: James Okoro

**Role & Context:**
James is a quality and manufacturing engineer at TT Electronics, responsible for process readiness, PPAP/FAI qualification, V&V evidence review, and lessons-learned capture for NPI programs. He is the primary technical reviewer for Phases 5 through 7 — verifying validation evidence against acceptance criteria (Phase 5), assessing manufacturing readiness and process capability (Phase 6), and capturing transfer findings and improvement actions (Phase 7). He also monitors the obsolescence and yield anomalies that trigger the Phase 8 and Phase 9 EOL decisions.

James works from the manufacturing plant floor and an adjacent engineering office, switching between MES terminals, quality system dashboards, and test data exports. He currently tracks V&V results in Excel, computes Cpk values manually, manages PPAP checklists in a shared drive, and records lessons learned in a Word template distributed by email after transfer. He is deeply process-oriented and methodical, with a low tolerance for ambiguous acceptance criteria or incomplete evidence — the Phase 5 seeded issue (a thermal result that exceeds the synthetic acceptance criterion) and the Phase 6 Cpk failure are exactly the class of issue he encounters on real programs and expects the Copilot to surface automatically.

**Goals:**
- Review the AI-drafted V&V Matrix and Gate 5 Summary for completeness and flag the thermal result that exceeds the acceptance criterion — without manually cross-referencing 10 test records against 10 requirements (F5, F6, Phase 5)
- Inspect the Cpk calculation result for the critical assembly characteristic in Phase 6 — computed outside the LLM — and approve the corrective action before the revised MES sample is ingested and checks rerun (F5, F6, Phase 6)
- Review the Manufacturing Readiness Level Scorecard and PPAP/FAI Readiness Index in Phase 6 and make the Gate 6 decision with process capability evidence visible (F1, F9 AV-08, Phase 6)
- Capture the Phase 7 torque variation finding in the Lessons-Learned Register and confirm the Transfer-Completeness Report is complete before Gate 7 sign-off (F6, Phase 7)
- Monitor the Phase 8 obsolescence forecast that triggers the EOL recommendation and confirm the Gate 8 Pass decision to initiate Phase 9 (F1, Phase 8)

**Pain Points:**
- V&V evidence review today requires manually matching test results to requirement acceptance criteria across separate Excel files — no automated cross-referencing flags the thermal exceedance until it is discovered late in review (PRD §2, F6)
- Cpk values are computed manually using MES data exports and a local spreadsheet; results are not automatically linked to the acceptance threshold or the gate record (PRD §2, F5)
- PPAP checklists live in a shared drive with no structured readiness scoring — James must construct an MRL scorecard from scratch for each program (PRD §2)
- Lessons learned from prior programs are captured in Word documents distributed by email and are not systematically retrievable for new programs (PRD §2)
- No structured mechanism links a Phase 6 Cpk failure corrective action to the revised MES sample, the rerun of affected checks, and the preserved original/revised result comparison (PRD §2, F3, F6)

**Technical Expertise:** Expert in manufacturing and quality processes (Cpk, PPAP, MRL, V&V); intermediate with web dashboards and structured forms; comfortable interpreting structured engineering check results without detailed explanation; does not configure orchestration or modify system state

**Top Tasks:**
1. Review Phase 5 V&V Matrix for evidence completeness and inspect the Gate 5 Summary for the seeded thermal exceedance finding; approve corrective action and confirm rerun (per program, critical)
2. Inspect Phase 6 Cpk deterministic check result; approve corrective action and "Revised Synthetic System Sample Available" workflow; confirm corrected check passes before Gate 6 (per program, critical)
3. Review Phase 6 MRL Scorecard and PPAP/FAI Readiness Index; select Gate 6 outcome with process capability evidence recorded (per program, critical)
4. Review Phase 7 Lessons-Learned Register for the torque variation finding and approve the Transfer-Completeness Report before Gate 7 (per program, high)
5. Review Phase 8 Obsolescence & Supply-Risk Forecast and Yield/Quality/Financial-Anomaly Report; confirm Gate 8 Pass to initiate EOL (per program, medium)

**Success Criteria:**
- Phase 5 thermal exceedance finding is surfaced automatically in the V&V Matrix — James does not need to manually cross-reference test results against acceptance criteria
- Phase 6 Cpk check result is computed outside the LLM, shows the formula, threshold, unit, result, and pass/fail status, and links to the corrective action record
- Original and revised Phase 6 check results are preserved side by side after the correction cycle — James can compare them in the Artifact Viewer
- Gate 5, 6, and 7 decisions are recorded with reviewer role, comments, AI recommendation, and human disposition
- Phase 7 Lessons-Learned Register is structured (XLSX, ~10 rows) and retrievable from the Artifact Viewer with full provenance — not a Word document distributed by email

---

## Persona Relationships

| Persona | Interacts With | Nature of Interaction |
|---------|----------------|----------------------|
| PER-01 Marcus (Engineering Reviewer) | PER-02 Priya (Program Manager) | Marcus raises findings and proposes gate outcomes at Gate 3 and Gate 4; Priya holds formal gate decision authority and tracks Marcus's conditional-pass actions to closure |
| PER-01 Marcus (Engineering Reviewer) | PER-04 James (Quality / Manufacturing) | Marcus's Phase 4 design freeze and CDR decision feeds James's Phase 5 V&V scope; James's Phase 6 Cpk findings may trigger design-level investigation that Marcus owns |
| PER-02 Priya (Program Manager) | PER-03 Claire (Commercial Reviewer) | Claire's Gate 0 and Gate 1 commercial decisions set the program baseline; Priya monitors the overall gate breadcrumb and escalates commercial conditions that remain open |
| PER-02 Priya (Program Manager) | PER-04 James (Quality / Manufacturing) | James owns gate decisions at Gates 5–7; Priya monitors open actions from James's conditional-pass findings and drives them to closure before lifecycle progression |
| PER-03 Claire (Commercial Reviewer) | PER-02 Priya (Program Manager) | Claire hands off a commercially approved program at Gate 1; Priya drives the engineering lifecycle from Gate 2 onward and surfaces any commercial risks that re-emerge in later phases |

---

## Feature-Persona Matrix

| Feature | PER-01 Marcus (Engineering) | PER-02 Priya (PM) | PER-03 Claire (Commercial) | PER-04 James (Quality/Mfg) |
|---------|----------------------------|-------------------|---------------------------|---------------------------|
| F0: Lifecycle Orchestration and Gated State Machine | Secondary | Primary | Secondary | Secondary |
| F1: Artifact-Count Discipline | Primary | Secondary | Primary | Primary |
| F2: Input Intake Framework | Primary | Secondary | Primary | Primary |
| F3: Input Versioning and Dependency-Aware Revision | Primary | Secondary | Secondary | Primary |
| F4: Shared ProjectState | Secondary | Primary | Secondary | Secondary |
| F5: Deterministic Engineering Checks | Primary | — | — | Primary |
| F6: Seeded Issues and Correction Cycles | Primary | Secondary | — | Primary |
| F7: Token Optimization and Context Management | — | — | — | — |
| F8: Compact Artifact Standards | Primary | Secondary | Primary | Primary |
| F9: Application Views — Nine-View Web Gate Cockpit | Primary | Primary | Primary | Primary |
| F10: Gate Review Model | Primary | Primary | Primary | Primary |

> **Matrix legend:** Primary = core daily use / decision authority for this feature; Secondary = uses or benefits from this feature as a consumer; — = not a direct user of this feature in normal workflow. F7 (Token Optimization) is an infrastructure feature with no direct user-facing persona interaction.

---

*Document generated by Pivota Spec Framework*
*Last updated: 2026-08-15*
*Project: EVINV-POC-001 | PRD: PRD-TTCopilot-v1.0 | Synthetic POC Data. Not TT Electronics Product Data. Not for Design, Fabrication, Certification, Procurement, or Production.*
