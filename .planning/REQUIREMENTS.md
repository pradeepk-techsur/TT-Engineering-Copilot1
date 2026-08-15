# Requirements: TT Manufacturing and Engineering Copilot

**Defined:** 2026-08-15
**Core Value:** Demonstrate that AI can process compact lifecycle artifacts, detect objective issues, recommend corrections, regenerate only affected outputs, and preserve full traceability — while keeping every material decision under human authority.

---

## v1 Requirements

### Lifecycle Orchestration

- [ ] **LC-01**: System implements Phase 0 through Phase 9 and Gate 0 through Gate 9 in canonical order as defined in TT Electronics ENG 001 v4.1
- [ ] **LC-02**: A gated state-machine orchestrator controls phase progression; no phase may advance without a human gate decision
- [ ] **LC-03**: Gate outcomes are exactly three: Pass, Conditional Pass, or Fail — selected by an authorized human reviewer only
- [ ] **LC-04**: AI may not autonomously approve any gate; the system enforces this constraint in all code paths
- [ ] **LC-05**: Persistent lifecycle breadcrumbs display on all primary views, showing phase, technical review (where mapped), and gate; states include Completed, Current, Awaiting Human Decision, Conditional Pass, Blocked, Upcoming, Closed
- [ ] **LC-06**: Technical reviews are mapped only where defined: Kickoff→Phase 0, System Level Review→Phase 1, Schematic Review→Phase 3, PCB Layout Review+CDR→Phase 4; no technical reviews invented for Phase 2 or Phases 5–9
- [ ] **LC-07**: Orchestrator supports pause, resume, retry, cancel, run-to-gate, idempotent resume, and targeted rerun
- [ ] **LC-08**: Happy-path gate storyline is implemented: G0 Pass, G1 Pass, G2 Pass after clarification, G3 Conditional Pass, G4 Pass after correction, G5 Pass after correction, G6 Pass after correction, G7 Pass, G8 Pass to initiate EOL, G9 Pass and project closed

### Artifact Count Enforcement

- [ ] **AC-01**: Every phase has exactly one external-source input (no more, no fewer)
- [ ] **AC-02**: Every phase has exactly one internal-artifact input (no more, no fewer)
- [ ] **AC-03**: Every phase generates exactly one or two outputs for human approval (never more)
- [ ] **AC-04**: Artifact count rule is enforced in product requirements, functional specifications, agent specifications, data schemas, intake interfaces, synthetic artifact generation, API contracts, test cases, acceptance criteria, and demo scripts
- [ ] **AC-05**: No separate gate-pack artifacts, evidence reports, Cora write-back documents, finding summaries, or audit reports are created as additional outputs; this information is rendered from structured ProjectState or included within permitted outputs

### Input-Intake Configuration

- [ ] **II-01**: Every input has a predetermined intake behavior (USER-PROVIDED FILE or SIMULATED EXTERNAL-SYSTEM INTAKE) defined in phase configuration; the system never asks the user to select the intake behavior
- [ ] **II-02**: Phase 0 External: Customer Opportunity Package — User-Provided File
- [ ] **II-03**: Phase 0 Internal: Capability and Opportunity Assessment Package — Simulated (Salesforce, Cora, capability library, historical projects, site capacity)
- [ ] **II-04**: Phase 1 External: Customer Requirements, Quantities, and Supplier Pricing Package — User-Provided File
- [ ] **II-05**: Phase 1 Internal: Preliminary Cost and Resource Package — Simulated (Cora, historical proposals, parametric cost model, labor/rate source)
- [ ] **II-06**: Phase 2 External: Customer and Standards Requirements Package — User-Provided File
- [ ] **II-07**: Phase 2 Internal: Draft System Requirements and Interfaces Package — Simulated (requirements repository, interface-control repository, Cora)
- [ ] **II-08**: Phase 3 External: Design Rules and Manufacturing Capabilities Package — Simulated (standards library, manufacturing-capability repository)
- [ ] **II-09**: Phase 3 Internal: Preliminary Design Package — User-Provided File
- [ ] **II-10**: Phase 4 External: DFM, Assembly, Standards, and Supplier-Risk Package — Simulated (standards library, supplier feed, obsolescence source)
- [ ] **II-11**: Phase 4 Internal: Released Detailed Design Baseline Package — User-Provided File
- [ ] **II-12**: Phase 5 External: Test Methods and Customer Acceptance Package — Simulated (standards library, customer acceptance repository)
- [ ] **II-13**: Phase 5 Internal: Validation Evidence Package — User-Provided File
- [ ] **II-14**: Phase 6 External: Customer Production-Readiness Package — User-Provided File
- [ ] **II-15**: Phase 6 Internal: Manufacturing Process and Capability Package — Simulated (MES, quality system, equipment records, Cora)
- [ ] **II-16**: Phase 7 External: Customer Acceptance and Field-Feedback Package — User-Provided File
- [ ] **II-17**: Phase 7 Internal: Transfer, Actions, Defects, and Yield Package — Simulated (Cora, MES, CAPA/quality, gate records)
- [ ] **II-18**: Phase 8 External: Supplier Lifecycle and Availability Package — Simulated (supplier feeds, distributor feeds, obsolescence databases)
- [ ] **II-19**: Phase 8 Internal: Production, BOM, Yield, and Cost Package — Simulated (ERP, MES, PLM, Change Review Board records)
- [ ] **II-20**: Phase 9 External: Customer EOL, Last-Time-Buy, Retention, and Disposal Package — User-Provided File
- [ ] **II-21**: Phase 9 Internal: Final Product, Demand, Asset, and Archive Package — Simulated (ERP, tooling/fixture register, project archive, Cora)

### User-Provided File Workflow

- [ ] **UP-01**: For each USER-PROVIDED FILE input, the system displays: artifact name, required content description, supported formats, size guidance, optional sample/template, upload prompt; status shows "Awaiting User Input"
- [ ] **UP-02**: System validates uploaded file for: file type, parseability, required fields/sections, Project ID, product name, phase, revision, unit presence, identifier uniqueness, row/page guidance, data consistency
- [ ] **UP-03**: Validation failure displays the specific issue and prevents phase execution; user may upload a corrected version
- [ ] **UP-04**: After successful validation, status shows "User Input Ready" and a confirmation message is displayed
- [ ] **UP-05**: System never silently substitutes synthetic data for missing user input

### Simulated External-System Intake Workflow

- [ ] **SE-01**: For each SIMULATED EXTERNAL-SYSTEM INTAKE input, the system identifies the represented system, displays the preloaded synthetic sample, labels it clearly as synthetic, states no live connection exists, provides View and Download controls
- [ ] **SE-02**: The user must explicitly select "Ingest Sample" to proceed; automatic ingestion without user action is prohibited
- [ ] **SE-03**: After ingestion, system validates and normalizes the sample, registers provenance, records the intake event; status shows "Synthetic System Input Ready"
- [ ] **SE-04**: Labels used: "System Represented", "Simulated Connector", "Preloaded Synthetic Sample", "Synthetic System Input", "Simulated Intake" — never "Connected to [SYSTEM]", "Retrieved from [SYSTEM]", "Live [SYSTEM] Data"
- [ ] **SE-05**: Every intake event is recorded with: phase, logical input, intake behavior, user action, system represented, status, source artifact, normalized artifact, version, validation result, timestamp

### Input Readiness and Phase Execution

- [ ] **IR-01**: Every Phase Workspace displays readiness status for both inputs: artifact name, intake behavior, system represented (if applicable), format, size guidance, active artifact, active version, validation status, required user action, Ready or Not Ready indicator
- [ ] **IR-02**: Phase execution is disabled until both inputs are active, validated, and ready
- [ ] **IR-03**: Phase Execution Status is displayed: Waiting for User Input, Waiting for Synthetic Sample Ingestion, Ready to Run, Processing, Awaiting Human Decision, Complete

### Input Versioning

- [ ] **IV-01**: Only one version of each logical input is active at any time; prior versions are preserved as historical
- [ ] **IV-02**: Revised user-provided inputs use the "Upload Revised Version" workflow; the term "replacement input" is never used
- [ ] **IV-03**: Revised synthetic samples use the "Revised Synthetic System Sample Available" workflow
- [ ] **IV-04**: When a revised version is provided: a new version is created, prior versions preserved, new version made active, affected checks/findings/actions/outputs identified, only affected results invalidated and rerun, original and revised results kept traceable, human re-review required where evidence materially changed

### Outputs and Phase Outputs

- [ ] **OP-01**: Phase 0 outputs: (1) Opportunity Summary and Bid/No-Bid Recommendation (DOCX/PDF, 1–2 pages); (2) Capability-Match and Critical-Gap Matrix (XLSX, ~10 rows). Opportunity Summary is an output, not an input.
- [ ] **OP-02**: Phase 1 outputs: (1) Costed Proposal or Business Case (DOCX/PDF, 1–2 pages); (2) Resource and Milestone Schedule (XLSX, ~10 rows)
- [ ] **OP-03**: Phase 2 outputs: (1) Requirements Traceability Matrix (XLSX, ~10 rows); (2) Requirements Quality and Testability Report (DOCX/PDF, 1–2 pages)
- [ ] **OP-04**: Phase 3 outputs: (1) PDR Readiness Summary (DOCX/PDF, 1–2 pages); (2) Early DFM/DFA Findings and Risk Register (XLSX, ~10 rows)
- [ ] **OP-05**: Phase 4 outputs: (1) Source-Cited, Risk-Scored DFM and Standards Audit (XLSX, ~10 findings); (2) BOM Health and Manufacturability Report (DOCX/PDF, 1–2 pages, including CDR readiness and design-freeze recommendation)
- [ ] **OP-06**: Phase 5 outputs: (1) Verification and Validation Matrix (XLSX, ~10 rows); (2) Gate 5 Verification and Validation Summary (DOCX/PDF, 1–2 pages)
- [ ] **OP-07**: Phase 6 outputs: (1) Manufacturing Readiness Level Scorecard (XLSX, ~10 rows); (2) PPAP/FAI Readiness Index and Action List (XLSX, ~10 rows)
- [ ] **OP-08**: Phase 7 outputs: (1) Structured Lessons-Learned Register (XLSX, ~10 rows); (2) Transfer-Completeness and Improvement-Action Report (DOCX/PDF, 1–2 pages)
- [ ] **OP-09**: Phase 8 outputs: (1) Obsolescence and Supply-Risk Forecast (XLSX, ~10 rows); (2) Yield, Quality, and Financial-Anomaly Report (DOCX/PDF, 1–2 pages, including Gate 8 recommendation)
- [ ] **OP-10**: Phase 9 outputs: (1) EOL and Last-Time-Buy Decision Pack (DOCX/PDF, 1–2 pages); (2) Project Closure and Institutional-Memory Record (XLSX/DOCX, ~10 rows or 1–2 pages); project status becomes Closed after Gate 9 Pass

### Compact Artifact Standards

- [ ] **CA-01**: XLSX and CSV artifacts contain no more than ~10 meaningful representative rows; header rows excluded from count; no data padding
- [ ] **CA-02**: XLSX/CSV records use 6–10 essential fields; stable identifiers, units, source references, and revisions included where applicable; no unused columns
- [ ] **CA-03**: DOCX and PDF artifacts are ~1–2 pages; concise headings, compact tables, short narrative; includes Project ID, product, phase, gate, version, status, and synthetic-data marking
- [ ] **CA-04**: Every synthetic artifact carries the disclaimer: "Synthetic POC Data. Not TT Electronics Product Data. Not for Design, Fabrication, Certification, Procurement, or Production."
- [ ] **CA-05**: Every artifact has provenance information: source, version, phase, intake type, timestamp

### Deterministic Processing

- [ ] **DP-01**: At least four deterministic engineering checks run outside the LLM, producing structured results (inputs used, formula/method, threshold, unit, result, status, source reference, limitation)
- [ ] **DP-02**: Phase 4 check: Cross-artifact reference and revision consistency
- [ ] **DP-03**: Phase 4 check: POC high-voltage clearance comparison against EVINV-POC-STD-001 threshold
- [ ] **DP-04**: Phase 4 check: POC component derating calculation against EVINV-POC-STD-001 margin
- [ ] **DP-05**: Phase 4 check: Test-point coverage check (diagnostic nets vs accessible test points)
- [ ] **DP-06**: Phase 6 check: Cpk calculation for critical assembly characteristic against synthetic threshold
- [ ] **DP-07**: Deterministic checks are used for: cost calculations, traceability completeness, requirement testability flags, cross-artifact consistency, revision consistency, clearance comparison, component derating, test-point coverage, Cpk, action closure, inventory reconciliation

### Seeded Issues and Correction Cycles

- [ ] **SI-01**: Phase 2: one efficiency or thermal requirement lacks a measurable acceptance criterion; objectively detectable by testability flag; resolved by human-approved clarification then rerun
- [ ] **SI-02**: Phase 3: coolant-connector orientation creates an assembly-access concern; Conditional Pass outcome; action tracked until closed in Phase 4
- [ ] **SI-03**: Phase 4 (initial): one clearance below threshold; one capacitor below POC derating margin; one diagnostic net without accessible test point; one BOM/design footprint mismatch
- [ ] **SI-04**: Phase 4 (revised): Phase 3 coolant-connector action verified closed in revised design; corrected issues verified; original and revised results preserved
- [ ] **SI-05**: Phase 5: one thermal result exceeds synthetic acceptance criterion; human approves corrective action; revised input requested; affected results rerun
- [ ] **SI-06**: Phase 6: one critical assembly characteristic Cpk below synthetic threshold; human approves corrective action; revised synthetic sample available; affected results rerun
- [ ] **SI-07**: Phase 7: torque variation in one mounting operation identified as seeded issue; captured in lessons-learned register
- [ ] **SI-08**: Phase 8: primary power semiconductor receives fictional discontinuance notice; replacement requires redesign and requalification; remaining demand does not justify redevelopment; triggers Gate 8 Pass to initiate Phase 9

### Token Optimization and Context Management

- [ ] **TO-01**: Reference documents are extracted and indexed once; content is cached; only relevant passages retrieved per agent invocation — full documents never repeatedly transmitted
- [ ] **TO-02**: Agent context includes only: active phase inputs, relevant approved upstream facts, open actions affecting current phase, selected applicable checklist items, selected applicable standards or POC rules
- [ ] **TO-03**: Approved upstream phases are represented to downstream agents through compact structured summaries; full upstream documents are not re-sent by default
- [ ] **TO-04**: Prompt construction uses compact structured fields; avoids repeating background narrative; references artifacts rather than repeating full content; sets output length limits; stops generation once output schema is complete

### Shared ProjectState

- [ ] **PS-01**: One versioned ProjectState is maintained covering: Project ID, product, project type/category, current phase/gate/technical review, project status, synthetic-data indicator
- [ ] **PS-02**: ProjectState contains per-phase: one logical external input (version history), one logical internal input (version history), configured intake behavior, system represented, active and historical versions, one or two outputs, compact approved phase summary
- [ ] **PS-03**: ProjectState contains: artifact registry with provenance and dependencies, requirements traceability, findings, risks/issues, actions, gate decisions with conditional-pass conditions, human comments, reviewer roles, input validation results, deterministic check results, simulated ingestion events, full audit history
- [ ] **PS-04**: Enforcement: maximum one active external input per phase, maximum one active internal input per phase, maximum two outputs per phase

### Application Views

- [ ] **AV-01**: Project Overview view showing project identity, status, and phase summary
- [ ] **AV-02**: Product Lifecycle View showing all phases and gates with lifecycle states
- [ ] **AV-03**: Phase Workspace with: input readiness panel for both inputs, output panel for one or two outputs, findings and actions, AI recommendation, human decision control
- [ ] **AV-04**: Input Intake and Validation Panel — separate detailed view for input management
- [ ] **AV-05**: Artifact Viewer with version history and provenance
- [ ] **AV-06**: Technical Checklist Workspace showing selected checklist items with evidence, status, action fields
- [ ] **AV-07**: Findings and Actions Workspace showing all findings, actions, blocking status, closure evidence
- [ ] **AV-08**: Gate Review Workspace rendered dynamically from structured state (active inputs, outputs, findings, open actions, AI recommendation, human comments, human decision) — no separate gate-pack artifact generated
- [ ] **AV-09**: Audit View showing full intake event log with all fields (phase, logical input, intake behavior, user action, system represented, status, source artifact, version, validation result, timestamp)
- [ ] **AV-10**: Breadcrumbs displayed on all nine views; selectable; show technical review where mapped

### Gate Review Model

- [ ] **GR-01**: Gate Review Workspace is built dynamically from structured state; no separate gate-pack artifact is created
- [ ] **GR-02**: Exactly three gate outcomes: Pass, Conditional Pass, Fail — human-selected only
- [ ] **GR-03**: AI provides a recommended gate outcome with rationale; this is advisory only
- [ ] **GR-04**: Conditional Pass actions include: Action ID, source phase/gate, related finding, description, owner role, blocking or parallel status, due phase/gate, required closure evidence, status, human approver
- [ ] **GR-05**: Human gate decisions are preserved: original AI recommendation, human disposition, reviewer role, comments, decision, timestamp, artifact versions reviewed, open conditions, audit history
- [ ] **GR-06**: Gate pauses visibly at every gate; even in demonstration mode, the presenter must confirm the human decision; silent gate approval is prohibited

### Synthetic Standard

- [ ] **SS-01**: Synthetic standard EVINV-POC-STD-001 ("EV Traction Inverter Design and Manufacturing Standard, POC Demonstration Edition", Version 1.0) is defined and used for Phase 4 deterministic checks; explicitly labeled as "Synthetic POC Standard, not an approved TT or industry standard"

---

## v2 Requirements

### Future Integration (Out of Scope for POC)

- **FI-01**: Live Cora federation (read from and write back to Cora: checklists, RAIL, gate approvals)
- **FI-02**: Live CAD/PLM connector (SolidWorks/NX/Creo feature extraction)
- **FI-03**: Live ERP/MES/quality system connectors
- **FI-04**: Live Salesforce connector
- **FI-05**: Entra ID / SSO authentication and production RBAC
- **FI-06**: Multi-project-type support (NPI B/C/D, Make-to-Print, NTI, CI) via build_plan() tailoring
- **FI-07**: Leadership portfolio dashboards and cross-project analytics
- **FI-08**: Teams bot, Outlook add-in, CAD-side plugin as additional channels
- **FI-09**: Fine-tuning on TT historical data (CAPA, yield, past proposals)
- **FI-10**: Full TT internal DFM rules library digitization

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Live system connections (Cora, Salesforce, PLM, ERP, MES, CAD) | POC uses simulated connectors only |
| Real TT Electronics product data | All data is synthetic; marked accordingly |
| Production-scale datasets | POC uses compact representative samples (~10 rows) |
| Full TT checklist implementation | Selected representative items only; full checklist would violate artifact-count and token rules |
| Separate gate-pack artifacts | Gate review rendered from structured state |
| Cora write-back | POC scope; requires live integration |
| Entra ID SSO / production RBAC | POC uses reviewer role labels only |
| Multi-project-type orchestration | NPI A / Cat 1 only for POC happy path |
| Mobile application | Web Gate Cockpit only |
| Teams/Outlook/CAD plugin channels | Web only for POC |
| The term "replacement input" | System uses "revised version" throughout |
| Invented technical reviews for Phase 2, 5–9 | None mapped from reference documents |

---

## Traceability

*Phase numbers refer to software development phases in ROADMAP.md, not TT lifecycle phase numbers.*

| Requirement | Roadmap Phase | Status |
|-------------|---------------|--------|
| LC-01 | Phase 1 — Foundation | Pending |
| LC-02 | Phase 1 — Foundation | Pending |
| LC-03 | Phase 1 — Foundation | Pending |
| LC-04 | Phase 1 — Foundation | Pending |
| LC-05 | Phase 1 — Foundation | Pending |
| LC-06 | Phase 1 — Foundation | Pending |
| LC-07 | Phase 1 — Foundation | Pending |
| LC-08 | Phase 7 — Cross-Cutting Views and Demo Polish | Pending |
| AC-01 | Phase 2 — Input Intake Framework (enforced in framework) | Pending |
| AC-02 | Phase 2 — Input Intake Framework (enforced in framework) | Pending |
| AC-03 | Phase 2 — Input Intake Framework (enforced in framework) | Pending |
| AC-04 | Phase 2 — Input Intake Framework (enforced in framework) | Pending |
| AC-05 | Phase 2 — Input Intake Framework (enforced in framework) | Pending |
| II-01 | Phase 2 — Input Intake Framework | Pending |
| II-02 | Phase 3 — Lifecycle Phases 0–2 Agents | Pending |
| II-03 | Phase 3 — Lifecycle Phases 0–2 Agents | Pending |
| II-04 | Phase 3 — Lifecycle Phases 0–2 Agents | Pending |
| II-05 | Phase 3 — Lifecycle Phases 0–2 Agents | Pending |
| II-06 | Phase 3 — Lifecycle Phases 0–2 Agents | Pending |
| II-07 | Phase 3 — Lifecycle Phases 0–2 Agents | Pending |
| II-08 | Phase 4 — Lifecycle Phases 3–4 Agents (Flagship) | Pending |
| II-09 | Phase 4 — Lifecycle Phases 3–4 Agents (Flagship) | Pending |
| II-10 | Phase 4 — Lifecycle Phases 3–4 Agents (Flagship) | Pending |
| II-11 | Phase 4 — Lifecycle Phases 3–4 Agents (Flagship) | Pending |
| II-12 | Phase 5 — Lifecycle Phases 5–7 Agents | Pending |
| II-13 | Phase 5 — Lifecycle Phases 5–7 Agents | Pending |
| II-14 | Phase 5 — Lifecycle Phases 5–7 Agents | Pending |
| II-15 | Phase 5 — Lifecycle Phases 5–7 Agents | Pending |
| II-16 | Phase 5 — Lifecycle Phases 5–7 Agents | Pending |
| II-17 | Phase 5 — Lifecycle Phases 5–7 Agents | Pending |
| II-18 | Phase 6 — Lifecycle Phases 8–9 Agents | Pending |
| II-19 | Phase 6 — Lifecycle Phases 8–9 Agents | Pending |
| II-20 | Phase 6 — Lifecycle Phases 8–9 Agents | Pending |
| II-21 | Phase 6 — Lifecycle Phases 8–9 Agents | Pending |
| UP-01 | Phase 2 — Input Intake Framework | Pending |
| UP-02 | Phase 2 — Input Intake Framework | Pending |
| UP-03 | Phase 2 — Input Intake Framework | Pending |
| UP-04 | Phase 2 — Input Intake Framework | Pending |
| UP-05 | Phase 2 — Input Intake Framework | Pending |
| SE-01 | Phase 2 — Input Intake Framework | Pending |
| SE-02 | Phase 2 — Input Intake Framework | Pending |
| SE-03 | Phase 2 — Input Intake Framework | Pending |
| SE-04 | Phase 2 — Input Intake Framework | Pending |
| SE-05 | Phase 2 — Input Intake Framework | Pending |
| IR-01 | Phase 2 — Input Intake Framework | Pending |
| IR-02 | Phase 2 — Input Intake Framework | Pending |
| IR-03 | Phase 2 — Input Intake Framework | Pending |
| IV-01 | Phase 2 — Input Intake Framework | Pending |
| IV-02 | Phase 2 — Input Intake Framework | Pending |
| IV-03 | Phase 2 — Input Intake Framework | Pending |
| IV-04 | Phase 2 — Input Intake Framework | Pending |
| OP-01 | Phase 3 — Lifecycle Phases 0–2 Agents | Pending |
| OP-02 | Phase 3 — Lifecycle Phases 0–2 Agents | Pending |
| OP-03 | Phase 3 — Lifecycle Phases 0–2 Agents | Pending |
| OP-04 | Phase 4 — Lifecycle Phases 3–4 Agents (Flagship) | Pending |
| OP-05 | Phase 4 — Lifecycle Phases 3–4 Agents (Flagship) | Pending |
| OP-06 | Phase 5 — Lifecycle Phases 5–7 Agents | Pending |
| OP-07 | Phase 5 — Lifecycle Phases 5–7 Agents | Pending |
| OP-08 | Phase 5 — Lifecycle Phases 5–7 Agents | Pending |
| OP-09 | Phase 6 — Lifecycle Phases 8–9 Agents | Pending |
| OP-10 | Phase 6 — Lifecycle Phases 8–9 Agents | Pending |
| CA-01 | Phase 3 — Lifecycle Phases 0–2 Agents (first phase that generates artifacts; enforced in all subsequent) | Pending |
| CA-02 | Phase 3 — Lifecycle Phases 0–2 Agents | Pending |
| CA-03 | Phase 3 — Lifecycle Phases 0–2 Agents | Pending |
| CA-04 | Phase 2 — Input Intake Framework (applies at intake; enforced in all artifact generation) | Pending |
| CA-05 | Phase 2 — Input Intake Framework (provenance recorded at intake; carried through) | Pending |
| DP-01 | Phase 4 — Lifecycle Phases 3–4 Agents (Flagship) | Pending |
| DP-02 | Phase 4 — Lifecycle Phases 3–4 Agents (Flagship) | Pending |
| DP-03 | Phase 4 — Lifecycle Phases 3–4 Agents (Flagship) | Pending |
| DP-04 | Phase 4 — Lifecycle Phases 3–4 Agents (Flagship) | Pending |
| DP-05 | Phase 4 — Lifecycle Phases 3–4 Agents (Flagship) | Pending |
| DP-06 | Phase 5 — Lifecycle Phases 5–7 Agents | Pending |
| DP-07 | Phase 4 — Lifecycle Phases 3–4 Agents (Flagship) | Pending |
| SI-01 | Phase 3 — Lifecycle Phases 0–2 Agents | Pending |
| SI-02 | Phase 4 — Lifecycle Phases 3–4 Agents (Flagship) | Pending |
| SI-03 | Phase 4 — Lifecycle Phases 3–4 Agents (Flagship) | Pending |
| SI-04 | Phase 4 — Lifecycle Phases 3–4 Agents (Flagship) | Pending |
| SI-05 | Phase 5 — Lifecycle Phases 5–7 Agents | Pending |
| SI-06 | Phase 5 — Lifecycle Phases 5–7 Agents | Pending |
| SI-07 | Phase 5 — Lifecycle Phases 5–7 Agents | Pending |
| SI-08 | Phase 6 — Lifecycle Phases 8–9 Agents | Pending |
| TO-01 | Phase 1 — Foundation | Pending |
| TO-02 | Phase 1 — Foundation | Pending |
| TO-03 | Phase 1 — Foundation | Pending |
| TO-04 | Phase 1 — Foundation | Pending |
| PS-01 | Phase 1 — Foundation | Pending |
| PS-02 | Phase 1 — Foundation | Pending |
| PS-03 | Phase 1 — Foundation | Pending |
| PS-04 | Phase 1 — Foundation | Pending |
| AV-01 | Phase 1 — Foundation | Pending |
| AV-02 | Phase 1 — Foundation | Pending |
| AV-03 | Phase 4 — Lifecycle Phases 3–4 Agents (Flagship) | Pending |
| AV-04 | Phase 2 — Input Intake Framework | Pending |
| AV-05 | Phase 4 — Lifecycle Phases 3–4 Agents (Flagship) | Pending |
| AV-06 | Phase 4 — Lifecycle Phases 3–4 Agents (Flagship) | Pending |
| AV-07 | Phase 4 — Lifecycle Phases 3–4 Agents (Flagship) | Pending |
| AV-08 | Phase 7 — Cross-Cutting Views and Demo Polish | Pending |
| AV-09 | Phase 7 — Cross-Cutting Views and Demo Polish | Pending |
| AV-10 | Phase 1 — Foundation | Pending |
| GR-01 | Phase 3 — Lifecycle Phases 0–2 Agents (first gates; pattern enforced throughout) | Pending |
| GR-02 | Phase 3 — Lifecycle Phases 0–2 Agents | Pending |
| GR-03 | Phase 3 — Lifecycle Phases 0–2 Agents | Pending |
| GR-04 | Phase 3 — Lifecycle Phases 0–2 Agents | Pending |
| GR-05 | Phase 3 — Lifecycle Phases 0–2 Agents | Pending |
| GR-06 | Phase 7 — Cross-Cutting Views and Demo Polish (enforced at all gates; verified in demo pass) | Pending |
| SS-01 | Phase 4 — Lifecycle Phases 3–4 Agents (Flagship) | Pending |

**Coverage:**
- v1 requirements: 79 total
- Mapped to phases: 79
- Unmapped: 0 ✓

---
*Requirements defined: 2026-08-15*
*Last updated: 2026-08-15 after initial definition from BUILD REQUEST*
