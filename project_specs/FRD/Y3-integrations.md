---

## Y3: External Integration Points

**Document:** Integration contracts and simulated connector specifications for TT Engineering Copilot POC (EVINV-POC-001).

> **Synthetic POC Data. Not TT Electronics Product Data. Not for Design, Fabrication, Certification, Procurement, or Production.**

---

### Overview

The TT Engineering Copilot POC uses **simulated connectors only** — no live connections to external enterprise systems in POC v1. Every simulated system is represented by a preloaded synthetic sample. The table below defines each simulated system, the phase(s) in which it appears, what data it provides, and the labels used in the UI.

Live integration with all listed systems is deferred to v2 (see REQUIREMENTS.md §v2 Requirements).

---

### Simulated System Inventory

| System | Phases Used | Input Role | UI Label | Sample Data Description |
|---|---|---|---|---|
| **Salesforce** | Phase 0 (internal) | Capability & Opportunity Assessment Package | "Simulated Connector — Salesforce" | Synthetic opportunity record: customer name, application, annual volume, target price, key requirements |
| **Cora** | Phase 0 (internal), Phase 1 (internal), Phase 7 (internal), Phase 9 (internal) | Various capability, cost, transfer, archive packages | "Simulated Connector — Cora" | Synthetic capability library, historical project records, gate records |
| **Capability Library** | Phase 0 (internal) | Part of Capability & Opportunity Assessment Package | "Simulated Connector — Capability Library" | Synthetic site capability profile: processes, certifications, equipment classes, capacity headroom |
| **Historical Projects** | Phase 0 (internal), Phase 1 (internal) | Part of Capability and Cost/Resource packages | "Simulated Connector — Historical Projects" | Synthetic historical NPI analogues with cost, schedule, and quality outcomes |
| **Site Capacity** | Phase 0 (internal) | Part of Capability & Opportunity Assessment Package | "Simulated Connector — Site Capacity" | Synthetic site loading: available engineering hours, floor capacity, equipment utilization |
| **Parametric Cost Model** | Phase 1 (internal) | Preliminary Cost & Resource Package | "Simulated Connector — Parametric Cost Model" | Synthetic cost model output: BOM cost estimate, NRE, tooling, labor |
| **Labor/Rate Source** | Phase 1 (internal) | Preliminary Cost & Resource Package | "Simulated Connector — Labor/Rate Source" | Synthetic labor rates by role and site |
| **Requirements Repository** | Phase 2 (internal) | Draft System Requirements & Interfaces Package | "Simulated Connector — Requirements Repository" | Synthetic draft system requirements aligned to EV-INV-800 specifications |
| **Interface Control Repository** | Phase 2 (internal) | Draft System Requirements & Interfaces Package | "Simulated Connector — Interface Control Repository" | Synthetic interface control document stub: CAN, power, thermal, mechanical |
| **Standards Library** | Phase 3 (external), Phase 4 (external), Phase 5 (external) | Design Rules, DFM/Standards, Test Methods packages | "Simulated Connector — Standards Library" | Synthetic EVINV-POC-STD-001 content; selected DFM rules; test method references |
| **Manufacturing Capability Repository** | Phase 3 (external) | Design Rules & Manufacturing Capabilities Package | "Simulated Connector — Manufacturing Capability Repository" | Synthetic DFM/DFA capability limits: trace width, clearance, component placement, soldering specs |
| **Supplier Feed** | Phase 4 (external) | DFM, Assembly, Standards & Supplier-Risk Package | "Simulated Connector — Supplier Feed" | Synthetic supplier risk data: lead times, single-source flags, supply chain concentration |
| **Obsolescence Source** | Phase 4 (external), Phase 8 (external) | DFM/Standards Package; Supplier Lifecycle Package | "Simulated Connector — Obsolescence Source" | Synthetic obsolescence notices including fictional IGBT discontinuance (SI-08) |
| **Customer Acceptance Repository** | Phase 5 (external) | Test Methods & Customer Acceptance Package | "Simulated Connector — Customer Acceptance Repository" | Synthetic customer acceptance test requirements aligned to EV-INV-800 |
| **MES (Manufacturing Execution System)** | Phase 6 (internal), Phase 7 (internal), Phase 8 (internal) | Manufacturing Process & Capability; Transfer; Production packages | "Simulated Connector — MES" | Synthetic process data: yield, cycle time, torque values, Cpk measurements |
| **Quality System / CAPA** | Phase 6 (internal), Phase 7 (internal) | Manufacturing Process; Transfer packages | "Simulated Connector — Quality System" | Synthetic CAPA records, quality KPIs, non-conformance counts |
| **Equipment Records** | Phase 6 (internal) | Manufacturing Process & Capability Package | "Simulated Connector — Equipment Records" | Synthetic equipment qualification status, calibration records |
| **ERP** | Phase 8 (internal), Phase 9 (internal) | Production, BOM, Yield & Cost; Final Product & Archive packages | "Simulated Connector — ERP" | Synthetic production orders, BOM revisions, inventory, financial data |
| **PLM (Product Lifecycle Management)** | Phase 8 (internal) | Production, BOM, Yield & Cost Package | "Simulated Connector — PLM" | Synthetic design change records, BOM history, revision control |
| **Change Review Board Records** | Phase 8 (internal) | Production, BOM, Yield & Cost Package | "Simulated Connector — Change Review Board" | Synthetic ECO/ECN records for EV-INV-800 |
| **Distributor Feeds** | Phase 8 (external) | Supplier Lifecycle & Availability Package | "Simulated Connector — Distributor Feeds" | Synthetic stock availability, pricing, and lead-time data from fictional distributors |
| **Tooling/Fixture Register** | Phase 9 (internal) | Final Product, Demand, Asset & Archive Package | "Simulated Connector — Tooling/Fixture Register" | Synthetic tooling asset list with condition, location, and disposal status |
| **Project Archive** | Phase 9 (internal) | Final Product, Demand, Asset & Archive Package | "Simulated Connector — Project Archive" | Synthetic project record summary: approved outputs, gate decisions, lessons learned |

---

### Simulated Connector Contract

Every simulated connector must implement the following behavior contract:

| Behavior | Requirement |
|---|---|
| **Label always visible** | "Simulated Connector — [System Name]" label must be displayed at all times the synthetic sample is presented |
| **Synthetic sample label** | "Preloaded Synthetic Sample" label must accompany the sample at all times |
| **No live connection claim** | "No live connection exists to [System Name]" statement must appear in the connector panel |
| **Explicit ingest required** | User must click "Ingest Sample" before data enters the intake pipeline; no auto-ingest |
| **Provenance recording** | System represented, intake behavior (SI), intake timestamp, and system label must be recorded in intake event |
| **Sample content compliance** | All synthetic sample content must comply with compact artifact standards (F08): ≤ 10 rows, 6–10 fields, disclaimer present |
| **No real system credentials** | No live API keys, tokens, or credentials for external systems may exist in the POC codebase or configuration |
| **Disclaimer on sample** | Every synthetic sample file carries the mandatory disclaimer |

---

### Prohibited Integration Behaviors (POC v1)

The following are explicitly out of scope and must not be implemented:

| Prohibited Behavior | Reason |
|---|---|
| Live connection to Cora (checklist read, RAIL, gate approval write-back) | POC scope; v2 |
| Live Salesforce API call | POC scope |
| Live CAD/PLM connector (SolidWorks/NX/Creo) | POC scope |
| Live ERP read or write | POC scope |
| Live MES read | POC scope |
| Live quality system / CAPA API | POC scope |
| Live obsolescence database API | POC scope |
| Entra ID / SSO authentication | POC uses reviewer role labels only |
| Any network call from the POC application to an external enterprise system | No live credentials; simulated connectors only |

---

### v2 Integration Roadmap (Out of Scope for POC)

| System | v2 Capability |
|---|---|
| **Cora** | Live checklist read; RAIL action write-back; gate approval synchronization |
| **Salesforce** | Live opportunity data retrieval |
| **CAD/PLM (SolidWorks/NX/Creo)** | Automated feature extraction; clearance and BOM data from live models |
| **ERP** | Live BOM, inventory, and financial data |
| **MES** | Live process data for Cpk and yield calculations |
| **Quality System / CAPA** | Live CAPA records and quality KPIs |
| **Obsolescence Databases** | Live PDNA/IHS Markit or equivalent feed |
| **Entra ID / SSO** | Production RBAC and authentication |

---

### Reference Document Store (System-Level, Not External Integrations)

The following documents are loaded into the reference index at system initialization (see F07). These are internal POC documents, not live system integrations:

| Document | Source | Purpose in POC |
|---|---|---|
| EVINV-POC-STD-001 | POC-authored synthetic standard | Threshold source for clearance, derating, Cpk checks |
| Power Supplies Technical Review Checklists — Prelim | TT Electronics internal (adapted for POC) | Selected checklist items for Phases 0, 1, 3, 4 |
| TT-New-Product-Process-v4.1 | TT Electronics formal lifecycle document | Phase/gate governance reference |
| TechSur GenAI Automation Proposal | TechSur internal | Agent flow and input/output structure reference |
| TT Copilot Inputs/Outputs specification | TechSur internal | Compact artifact scope and per-phase intake behavior |

---

*FRD-TTCopilot-v1.0 | Y3-Integrations | Synthetic POC Data Only*
