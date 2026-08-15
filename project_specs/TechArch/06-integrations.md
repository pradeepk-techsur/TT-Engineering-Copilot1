## 7. Integration Points

### 7.1 External Integrations (POC v1 — Simulated Only)

**No live connections to any enterprise system in POC v1.** All 23 simulated connectors serve preloaded static synthetic sample files. The table below documents each simulated system, which phases and input roles it serves, the UI label used, and the synthetic sample data description.

| Connector # | System | Phases | Input Role | UI Label | Sample Description |
|---|---|---|---|---|---|
| 1 | Salesforce | 0 | Internal | "Simulated Connector — Salesforce" | Synthetic opportunity record: customer name, application, annual volume, target price, key requirements |
| 2 | Cora | 0, 1, 7, 9 | Internal | "Simulated Connector — Cora" | Synthetic capability library, historical project records, gate records |
| 3 | Capability Library | 0 | Internal (part of) | "Simulated Connector — Capability Library" | Synthetic site capability profile: processes, certifications, equipment classes, capacity headroom |
| 4 | Historical Projects | 0, 1 | Internal (part of) | "Simulated Connector — Historical Projects" | Synthetic historical NPI analogues with cost, schedule, and quality outcomes |
| 5 | Site Capacity | 0 | Internal (part of) | "Simulated Connector — Site Capacity" | Synthetic site loading: available engineering hours, floor capacity, equipment utilization |
| 6 | Parametric Cost Model | 1 | Internal | "Simulated Connector — Parametric Cost Model" | Synthetic cost model output: BOM cost estimate, NRE, tooling, labor |
| 7 | Labor/Rate Source | 1 | Internal (part of) | "Simulated Connector — Labor/Rate Source" | Synthetic labor rates by role and site |
| 8 | Requirements Repository | 2 | Internal | "Simulated Connector — Requirements Repository" | Synthetic draft system requirements aligned to EV-INV-800 specifications |
| 9 | Interface Control Repository | 2 | Internal (part of) | "Simulated Connector — Interface Control Repository" | Synthetic ICD stub: CAN, power, thermal, mechanical interfaces |
| 10 | Standards Library | 3, 4, 5 | External | "Simulated Connector — Standards Library" | Synthetic EVINV-POC-STD-001 content; selected DFM rules; test method references |
| 11 | Manufacturing Capability Repository | 3 | External (part of) | "Simulated Connector — Manufacturing Capability Repository" | Synthetic DFM/DFA capability limits: trace width, clearance, component placement, soldering specs |
| 12 | Supplier Feed | 4 | External (part of) | "Simulated Connector — Supplier Feed" | Synthetic supplier risk data: lead times, single-source flags, supply chain concentration |
| 13 | Obsolescence Source | 4, 8 | External (part of) | "Simulated Connector — Obsolescence Source" | Synthetic obsolescence notices including fictional IGBT discontinuance notice (SI-08) |
| 14 | Customer Acceptance Repository | 5 | External (part of) | "Simulated Connector — Customer Acceptance Repository" | Synthetic customer acceptance test requirements aligned to EV-INV-800 |
| 15 | MES (Manufacturing Execution System) | 6, 7, 8 | Internal | "Simulated Connector — MES" | Synthetic process data: yield, cycle time, torque values, Cpk measurements |
| 16 | Quality System / CAPA | 6, 7 | Internal (part of) | "Simulated Connector — Quality System" | Synthetic CAPA records, quality KPIs, non-conformance counts |
| 17 | Equipment Records | 6 | Internal (part of) | "Simulated Connector — Equipment Records" | Synthetic equipment qualification status, calibration records |
| 18 | ERP | 8, 9 | Internal | "Simulated Connector — ERP" | Synthetic production orders, BOM revisions, inventory, financial data |
| 19 | PLM (Product Lifecycle Management) | 8 | Internal (part of) | "Simulated Connector — PLM" | Synthetic design change records, BOM history, revision control |
| 20 | Change Review Board Records | 8 | Internal (part of) | "Simulated Connector — Change Review Board" | Synthetic ECO/ECN records for EV-INV-800 |
| 21 | Distributor Feeds | 8 | External (part of) | "Simulated Connector — Distributor Feeds" | Synthetic stock availability, pricing, and lead-time data from fictional distributors |
| 22 | Tooling/Fixture Register | 9 | Internal (part of) | "Simulated Connector — Tooling/Fixture Register" | Synthetic tooling asset list with condition, location, and disposal status |
| 23 | Project Archive | 9 | Internal (part of) | "Simulated Connector — Project Archive" | Synthetic project record summary: approved outputs, gate decisions, lessons learned |

### 7.2 Simulated Connector Behavior Contract

Every simulated connector implements the following behavior in the SI intake workflow:

| Behavior | Implementation |
|---|---|
| Label always visible | `PhaseInputState.system_represented` displayed as "Simulated Connector — [System Name]" in AV-03 Input Readiness Panel |
| Synthetic sample label | "Preloaded Synthetic Sample" label adjacent to View/Download controls |
| No live connection claim | "No live connection exists to [System Name]" statement in connector panel |
| Explicit ingest required | "Ingest Sample" button enabled only after View or Download; POST to `/api/phases/{id}/inputs/{role}/ingest` requires `confirm_viewed: true` |
| Provenance recording | `system_represented`, `intake_behavior: "SI"`, `intake_timestamp` written to `phase_inputs` and `audit_history` |
| Sample content compliance | All synthetic sample files comply with F08: ≤ 10 rows, 6–10 fields, mandatory disclaimer, provenance metadata |
| No real system credentials | No live API keys or tokens for any enterprise system in codebase or `.env` |
| Disclaimer on sample | Every synthetic sample file carries the mandatory disclaimer |

### 7.3 LLM Integration — Anthropic Claude API

**Only external API used in POC v1.**

| Parameter | Value |
|---|---|
| Provider | Anthropic |
| Model | `claude-sonnet-4-6` (default) / `claude-opus-4` (flagship phases if budget permits) |
| SDK | `@anthropic-ai/sdk` |
| Authentication | `ANTHROPIC_API_KEY` environment variable |
| Streaming | Messages API with `stream: true` |
| Max tokens per invocation | Phase-specific; default 2,048 output tokens; bounded by `POC_CONTEXT_TOKEN_BUDGET` |

**Hardened wrapper behavior:**

| Scenario | Wrapper Response |
|---|---|
| API transient error (529, 503, network) | Retry with exponential backoff; max 3 attempts; 2s / 4s / 8s delays |
| Response truncated (output incomplete) | Detect truncation marker; send continuation prompt up to 2 times |
| Phase cancelled by operator | Check Redis cancel flag before each retry iteration; abort and emit `phase_cancelled` SSE event |
| Model refusal or safety block | Return `503 LLM_REFUSED` with error; do not retry |
| Token budget exceeded in prompt | Context assembly trims least-relevant passages before retry |

**What the LLM is never asked to do:**
- Compute clearance margins, Cpk, derating percentages, or traceability completeness (all deterministic tools)
- Approve a gate or set a gate decision (prohibited at orchestrator and API layers)
- Generate text containing "Connected to [SYSTEM]", "Retrieved from [SYSTEM]", "Live [SYSTEM] Data" (checked by prohibited label scanner)

### 7.4 Reference Document Store

The following documents are loaded into the Redis reference index at system initialization. These are internal POC documents, not live system integrations.

| Document | Source | Purpose in POC |
|---|---|---|
| EVINV-POC-STD-001 | POC-authored synthetic standard | Threshold source for clearance (§3.1), derating (§3.3), Cpk (§5.1) checks |
| Power Supplies Technical Review Checklists — Prelim | TT Electronics internal (adapted for POC) | Selected checklist items for Phases 0 (Kickoff), 1 (SLR), 3 (Schematic Review), 4 (PCB Layout) |
| TT-New-Product-Process-v4.1 | TT Electronics formal lifecycle document | Phase/gate governance reference; ENG 001 v4.1 |
| TechSur GenAI Automation Proposal | TechSur internal | Agent flow and input/output structure reference |
| TT Copilot Inputs/Outputs specification | TechSur internal | Compact artifact scope and per-phase intake behavior |

Index initialization (`POST /api/system/initialize-index`): extracts text by section/clause/row, builds searchable index in Redis, marks `initialized`. Does not reload on subsequent agent invocations — queries only.

### 7.5 v2 Integration Roadmap (Out of Scope for POC)

The following live integrations are explicitly deferred to v2:

| System | v2 Capability |
|---|---|
| Cora | Live checklist read; RAIL action write-back; gate approval synchronization |
| Salesforce | Live opportunity data retrieval |
| CAD/PLM (SolidWorks/NX/Creo) | Automated feature extraction; clearance and BOM data from live models |
| ERP | Live BOM, inventory, and financial data |
| MES | Live process data for Cpk and yield calculations |
| Quality System / CAPA | Live CAPA records and quality KPIs |
| Obsolescence Databases | Live PDNA/IHS Markit or equivalent feed |
| Entra ID / SSO | Production RBAC and authentication |

### 7.6 Prohibited Integration Behaviors (POC v1 Enforcement)

The following behaviors are explicitly prohibited and must not be implemented:

| Prohibited Behavior | Enforcement |
|---|---|
| Live connection to any enterprise system | No live API keys in `.env`; no outbound HTTP calls to enterprise hosts |
| Auto-ingest of synthetic samples | `POST /api/.../ingest` requires `confirm_viewed: true` from client; rejects `403 AUTO_INGEST_PROHIBITED` otherwise |
| UI label "Connected to [SYSTEM]" | Prohibited label scanner rejects generated content containing this string |
| UI label "Retrieved from [SYSTEM]" | Same scanner |
| UI label "Live [SYSTEM] Data" | Same scanner |
| Checklist content for Phase 2 or Phases 5–9 | `GET /api/views/phase/{id}/checklist` returns `404 NO_CHECKLIST_MAPPED` for these phases |
| AI actor submitting gate decision | `POST /api/gates/{id}/decide` rejects `X-Reviewer-Role` values in AI actor blocklist |
| "Replacement input" terminology | Text scan in CI; error `PROHIBITED_LABEL_DETECTED` if detected in generated content |

---

*TechArch-TTCopilot-v1.0 | §06-Integrations | Synthetic POC Data Only*

---

## Appendix A: Seeded Issue — Deterministic Check Summary

The following table documents the seeded engineering issues, the deterministic checks that detect them, and their correction cycle outcomes. This serves as implementation verification reference.

| Issue ID | Phase | Seeded Problem | Detecting Check | Finding ID | Action ID | Correction Outcome |
|---|---|---|---|---|---|---|
| SI-01 | 2 | REQ-THERM-004 lacks measurable acceptance criterion | RequirementTestability | F2-001 | A2-001 | Revised requirement adds ≤85°C at TP-CASE-1; check reruns Pass; Gate 2 Pass |
| SI-02 | 3 | CN-COOL-1 orientation obstructs J-FAST-7 through J-FAST-10 | Agent analysis (DFM/DFA) | F3-001 | A3-001 (blocking) | Gate 3 Conditional Pass; A3-001 verified closed in Phase 4 revised design |
| SI-03a | 4 | VBUS+ to GND_SHIELD clearance 6.2 mm (threshold 8.0 mm) | HVClearanceCheck | F4-001 | A4-001 (blocking) | Revised design: clearance 9.1 mm; check reruns Pass |
| SI-03b | 4 | C_BULK_3 derating margin 4.4% (threshold 50%) | ComponentDeratingCheck | F4-002 | A4-002 (blocking) | Revised design: 900 V cap, margin 52.2%; check reruns Pass |
| SI-03c | 4 | DIAG_TEMP_IGBT_CASE has no accessible test point | TestPointCoverageCheck | F4-003 | A4-003 (blocking) | Revised design: TP-IGBT-CASE added; check reruns Pass |
| SI-03d | 4 | C_HV_1 footprint 0805 in BOM vs 1206 in DFM spec | CrossArtifactConsistency | F4-004 | A4-004 (blocking) | Revised BOM: footprint corrected to 1206; check reruns Pass |
| SI-04 | 4 | Correction verification of SI-02/03a-d | All 4 Phase 4 checks | — | A3-001, A4-001–A4-004 verified closed | Gate 4 Pass after correction |
| SI-05 | 5 | TP-CASE-1 thermal measurement 91°C (criterion ≤85°C) | V&V comparison (agent) | F5-001 | A5-001 | Revised validation: 82°C; Gate 5 Pass after correction |
| SI-06 | 6 | SOLDER_JOINT_SHEAR_HV_BUS Cpk 0.87 (threshold 1.33) | CpkCalculation | F6-001 | A6-001 | Revised MES sample: Cpk 1.45; Gate 6 Pass after correction |
| SI-07 | 7 | Torque variation in MOP-012-BRACKET-MOUNT (2.1–4.8 N·m; spec 3.5±0.5) | Agent analysis | F7-001 | A7-001 (non-blocking) | Captured in Lessons-Learned Register; Gate 7 Pass |
| SI-08 | 8 | IGBT-HV-800-A (Q_HV_1) discontinuance notice; no drop-in replacement | Obsolescence deterministic flag | F8-001 | — | Demand insufficient for redevelopment; Gate 8 Pass to initiate EOL |

---

## Appendix B: Happy-Path Gate Storyline

| Gate | Phase | Outcome | Condition |
|---|---|---|---|
| Gate 0 | Commercial Assessment | Pass | Initial commercial assessment complete |
| Gate 1 | Business Case | Pass | Business case approved |
| Gate 2 | Requirements Definition | Pass | After clarification of REQ-THERM-004 (SI-01) |
| Gate 3 | Preliminary Design | Conditional Pass | Coolant connector concern (SI-02); action A3-001 raised |
| Gate 4 | Detailed Design | Pass | After correction of SI-03a/b/c/d; A3-001 verified closed |
| Gate 5 | Verification & Validation | Pass | After thermal correction (SI-05) |
| Gate 6 | Manufacturing Readiness | Pass | After Cpk correction (SI-06) |
| Gate 7 | Transfer & Lessons Learned | Pass | Transfer complete; lessons learned captured (SI-07) |
| Gate 8 | Production & Sustaining | Pass | Obsolescence triggers EOL (SI-08); project enters Phase 9 |
| Gate 9 | End of Life | Pass | EOL complete; project status → Closed |

---

*TechArch-TTCopilot-v1.0 | §06-Integrations + Appendices | Synthetic POC Data Only*
