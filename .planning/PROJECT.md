# TT Manufacturing and Engineering Copilot

## What This Is

A proof-of-concept internal-only, multi-agent, human-in-the-loop AI copilot that walks a fictional EV traction inverter product (EV-INV-800, project EVINV-POC-001) through TT Electronics' full Product Lifecycle Process (ENG 001 v4.1) — Phase 0 through Phase 9, Gate 0 through Gate 9. The AI drafts, checks, analyzes, recommends, and packages; authorized human reviewers decide, revise, approve, override, and sign at every gate. The POC is built on a fictional liquid-cooled, three-phase traction inverter to give engineering realism without recreating a real program.

All synthetic artifacts are marked: "Synthetic POC Data. Not TT Electronics Product Data. Not for Design, Fabrication, Certification, Procurement, or Production."

## Core Value

Demonstrate that AI can process realistic compact lifecycle artifacts, detect objective issues, recommend corrections, regenerate only affected outputs, and preserve full traceability — while keeping every material decision under human authority.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Lifecycle Coverage**
- [ ] Phase 0–9 and Gate 0–9 fully represented in a gated state-machine orchestrator
- [ ] Happy-path gate storyline: G0 Pass, G1 Pass, G2 Pass after clarification, G3 Conditional Pass, G4 Pass after correction, G5 Pass after correction, G6 Pass after correction, G7 Pass, G8 Pass to initiate EOL, G9 Pass and close
- [ ] Persistent lifecycle breadcrumbs with technical-review segments where mapped (Phase 0→Kickoff, Phase 1→SRR, Phase 3→Schematic/PDR, Phase 4→PCB Layout/CDR + TRR, no invented reviews for Phase 2 or 5–9)

**Artifact-Count Discipline (enforced everywhere)**
- [ ] Exactly one external-source input per phase (user-provided file OR simulated system intake — predetermined per phase)
- [ ] Exactly one internal-artifact input per phase (same rule)
- [ ] One or two outputs per phase for human approval — never more
- [ ] No separate gate-pack, evidence report, Cora write-back, or finding summary that violates the two-output limit

**Input-Intake Behavior**
- [ ] Application never asks the user to select intake mode — configuration is predetermined per input
- [ ] USER-PROVIDED FILE: display artifact name, required content, format, size guidance, upload prompt, validation; block execution until valid
- [ ] SIMULATED EXTERNAL-SYSTEM INTAKE: display system name, preloaded synthetic sample, View/Download controls, require "Ingest Sample" action; never claim live connectivity
- [ ] No silent synthetic substitution for missing user input
- [ ] Every intake event is visible and audited with full provenance record

**Input Versioning and Revision**
- [ ] Only one active version of each logical input at a time
- [ ] Revised versions use "Upload Revised Version" / "Revised Synthetic System Sample Available" — term "replacement input" never used
- [ ] Prior versions retained for traceability, comparison, audit, reproduction
- [ ] Dependency-aware invalidation: only affected checks rerun; original and revised results preserved

**Token Optimization**
- [ ] Reference documents extracted and indexed once; cached; only relevant passages retrieved per phase
- [ ] Agent context contains only: active inputs, relevant approved upstream facts, open actions, selected checklist items, selected standards/rules
- [ ] Approved upstream phases represented through compact structured summaries — not full documents
- [ ] Deterministic calculations (clearance, derating, Cpk, testability, traceability completeness) run outside the LLM as tools

**Deterministic Checks (Phase 4 mandatory, others as applicable)**
- [ ] Cross-artifact reference and revision consistency check
- [ ] POC high-voltage clearance comparison (threshold from EVINV-POC-STD-001)
- [ ] POC component derating calculation
- [ ] Test-point coverage check
- [ ] Optional assembly-access comparison
- [ ] Phase 6 Cpk calculation (synthetic threshold)

**Seeded Issues and Correction Cycles**
- [ ] Phase 2: one efficiency/thermal requirement lacks measurable acceptance criterion → Pass after human-approved clarification
- [ ] Phase 3: coolant-connector orientation assembly-access concern → Conditional Pass; action visible until closed
- [ ] Phase 4: one clearance below threshold; one capacitor below derating margin; one diagnostic net without accessible test point; one BOM/design footprint mismatch; Phase 3 action closure verified in revised design
- [ ] Phase 5: one thermal result exceeds synthetic acceptance criterion
- [ ] Phase 6: one critical assembly characteristic Cpk below synthetic threshold
- [ ] Phase 7: torque variation in one mounting operation
- [ ] Phase 8: primary power semiconductor receives fictional discontinuance notice triggering EOL

**Application Views**
- [ ] Project Overview
- [ ] Product Lifecycle View
- [ ] Phase Workspace (per-phase with input readiness panel, output panel, findings, actions, AI recommendation, human decision)
- [ ] Input Intake and Validation Panel
- [ ] Artifact Viewer (with version history)
- [ ] Technical Checklist Workspace
- [ ] Findings and Actions Workspace
- [ ] Gate Review Workspace (rendered dynamically from structured state — no separate gate-pack artifact)
- [ ] Audit View (full intake event log)

**Shared ProjectState and Orchestration**
- [ ] One versioned ProjectState covering all phases with artifact registry, provenance, dependencies, findings, actions, gate decisions, audit history
- [ ] Support: pause, resume, retry, cancel, run-to-gate, idempotent resume, targeted rerun, dependency-aware invalidation
- [ ] Human-controlled decisions: AI recommends gate outcome; human selects Pass / Conditional Pass / Fail
- [ ] AI may not approve any gate; every gate requires human sign-off

**Compact Artifact Standards**
- [ ] XLSX/CSV: max ~10 meaningful rows, 6–10 essential fields, stable IDs, units, source refs
- [ ] DOCX/PDF: ~1–2 pages, concise headings and compact tables
- [ ] No data padding; no unused columns

**Phase 0–9 Input/Output Specifications** (as defined in sections 13–22 of the build request, enforced per phase)
- [ ] Phase 0: Customer Opportunity Package (user) + Capability Assessment Package (simulated: Salesforce/Cora) → Opportunity Summary + Gap Matrix
- [ ] Phase 1: Customer Requirements/Pricing (user) + Cost/Resource Package (simulated: Cora/historical) → Costed Proposal + Schedule
- [ ] Phase 2: Customer/Standards Requirements (user) + Draft System Requirements (simulated: requirements repo/Cora) → RTM + Testability Report
- [ ] Phase 3: Design Rules/Capabilities (simulated: standards library) + Preliminary Design Package (user) → PDR Summary + DFM Findings Register
- [ ] Phase 4: DFM/Standards/Supplier-Risk (simulated: standards/supplier/obsolescence) + Released Design Baseline (user) → DFM/Standards Audit + BOM Health Report
- [ ] Phase 5: Test Methods/Acceptance (simulated: standards/customer repo) + Validation Evidence (user) → V&V Matrix + Gate 5 Summary
- [ ] Phase 6: Customer Production-Readiness (user) + Manufacturing Process/Capability (simulated: MES/quality/Cora) → MRL Scorecard + PPAP/FAI Readiness Index
- [ ] Phase 7: Customer Field Feedback (user) + Transfer/Defects/Yield (simulated: Cora/MES/CAPA) → Lessons-Learned Register + Transfer Report
- [ ] Phase 8: Supplier Lifecycle/Availability (simulated: supplier/distributor/obsolescence feeds) + Production/BOM/Yield/Cost (simulated: ERP/MES/PLM) → Obsolescence Forecast + Yield/Anomaly Report
- [ ] Phase 9: Customer EOL/Retention (user) + Final Product/Asset/Archive (simulated: ERP/Cora/archive) → EOL Decision Pack + Project Closure Record

**Web Gate Cockpit**
- [ ] Primary human-in-the-loop surface for all gate navigation, AI-draft review, and sign-off
- [ ] TT Electronics Product Lifecycle Process terminology throughout
- [ ] No generic chatbot as primary interface

### Out of Scope

- Live connections to Cora, Salesforce, PLM, ERP, MES, CAD systems — POC uses simulated connectors only
- Real TT Electronics product data — all data is synthetic POC data
- Cora write-back (checklists, RAIL, approvals) — POC renders from structured state only
- Mobile app, Teams bot, Outlook add-in, CAD plugin — Web Gate Cockpit only for POC
- Multi-project-type support (NPI B/C/D, Make-to-Print, NTI, CI) — POC demonstrates NPI A / Cat 1 only
- Entra ID SSO and production RBAC — POC uses role labels only
- Production-scale datasets or full checklist implementation — compact representative subsets only
- Separate gate-pack artifacts — gate review rendered from structured state
- The term "replacement input" — use "revised version"
- Invented technical reviews for Phase 2 or Phases 5–9

## Context

**Reference documents extracted (all five):**
1. TT-New-Product-Process-v4-1-04Mar2026 (1).pdf — Formal lifecycle, phases, gates, governance, gate exit criteria, project types/categories
2. TT_Electronics_GenAI_Automation_Proposal_V2.docx — Agent flow, agent roster (G0–G9), Appendix A input/output table, Web Gate Cockpit concept
3. Proposal-Copilot-Architecture-Extraction.docx — Gated state-machine orchestrator, shared state, artifact registry, human-gate primitive, dependency-aware invalidation, skill files, deterministic tools, idempotent resume
4. Power_Supplies_-_Technical_Review_Checklists_-_Prelim.xlsx — Kickoff (Phase 0), System Level Review (Phase 1), Schematic Review (Phase 3), PCB Layout Review (Phase 4 CDR) checklists with evidence, action, reviewer terminology
5. TT_Copilot_Inputs_Outputs.docx — Compact POC artifact scope, per-phase intake behavior, artifact sizing guidance

**Source authority precedence confirmed:**
1. TT-New-Product-Process → formal lifecycle, gates, governance
2. TechSur Proposal → logical agent flow, input/output structure
3. TT_Copilot_Inputs_Outputs → compact artifact scope (where it conflicts with TechSur, TechSur wins; Phase 0 correction: Opportunity Summary is an output not an input)
4. Power Supplies Checklist → selected technical-review wording
5. Architecture Extraction → implementation patterns

**Product (synthetic):**
- Name: EV-INV-800 Demonstration Traction Inverter
- Project ID: EVINV-POC-001
- Type: NPI A / Category 1
- 800 VDC nominal, 550–920 VDC range, 150 kW continuous / 220 kW peak, liquid-cooled cold plate, CAN + diagnostic interface, sealed aluminum housing

**Technical-review mapping:**
- Kickoff Checklist → Phase 0
- System Level Review → Phase 1
- Schematic Review → Phase 3
- PCB Layout Review → Phase 4 (primary: CDR/PCB Layout/DFM-Standards Audit; secondary: selected Mechanical Review and TRR questions)
- No technical reviews for Phase 2 or Phases 5–9

**Unresolved items / Assumptions Register:**
- Synthetic standard EVINV-POC-STD-001 thresholds (clearance, derating, Cpk) are POC-invented — require TT confirmation before any production use
- Gate exit criteria for Gates 1–7 not fully detailed in the PDF extract (pages appear blank in document) — POC uses TechSur Proposal Appendix A as the authoritative input/output reference
- Power Supplies checklist is labeled "Prelim" and maps to Power Supplies products; selected items adapted for traction inverter context with wording preserved

## Constraints

- **Artifact count**: Exactly one external input + one internal input + one or two outputs per phase — enforced in all specs, schemas, and code
- **Token budget**: No full reference docs in agent context; no full prior-phase docs; compact phase summaries only; deterministic checks outside LLM
- **Synthetic data marking**: Every synthetic artifact must carry the disclaimer marking
- **Human authority**: AI cannot approve any gate; every consequential decision requires human sign-off
- **Terminology**: Preserve TT formal lifecycle terminology; use "revised version" not "replacement input"; use "Simulated Connector" / "Preloaded Synthetic Sample" not "Live [SYSTEM] Data"
- **No chatbot primary UI**: Phase Workspace with structured intake panels is the primary interface

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Phase-mode workflow (not spec-express) | Full lifecycle with requirements and roadmap | — Pending |
| NPI A / Cat 1 only for POC | Simplest happy path; all gates mandatory | — Pending |
| Web Gate Cockpit as primary surface | Structured phase workspaces > generic chat | — Pending |
| Simulated connectors (no live systems) | POC scope; avoids integration complexity | — Pending |
| Deterministic checks run as tools outside LLM | Correctness, repeatability, auditability | — Pending |
| Gate Review rendered from structured state | Avoids third artifact; satisfies output limit | — Pending |
| Compact approved-phase summaries as upstream context | Token optimization; avoids full-doc re-transmission | — Pending |

---
*Last updated: 2026-08-15 after initialization from BUILD REQUEST and five reference documents*
