export const PHASE_CONFIG = [
  {
    phaseId: 0, phaseName: 'Commercial Assessment',
    technicalReview: 'Kickoff',
    externalIntake: { behavior: 'UP', logicalName: 'Customer Opportunity Package', format: 'DOCX/PDF', systemRepresented: null },
    internalIntake: { behavior: 'SI', logicalName: 'Capability and Opportunity Assessment Package', format: 'XLSX', systemRepresented: 'Salesforce, Cora, Capability Library, Historical Projects, Site Capacity' },
    outputs: ['Opportunity Summary and Bid/No-Bid Recommendation', 'Capability-Match and Critical-Gap Matrix'],
  },
  {
    phaseId: 1, phaseName: 'Business Case',
    technicalReview: 'SLR',
    externalIntake: { behavior: 'UP', logicalName: 'Customer Requirements, Quantities, and Supplier Pricing Package', format: 'XLSX', systemRepresented: null },
    internalIntake: { behavior: 'SI', logicalName: 'Preliminary Cost and Resource Package', format: 'XLSX', systemRepresented: 'Cora, Historical Proposals, Parametric Cost Model, Labor/Rate Source' },
    outputs: ['Costed Proposal or Business Case', 'Resource and Milestone Schedule'],
  },
  {
    phaseId: 2, phaseName: 'Requirements Definition',
    technicalReview: null,
    externalIntake: { behavior: 'UP', logicalName: 'Customer and Standards Requirements Package', format: 'XLSX', systemRepresented: null },
    internalIntake: { behavior: 'SI', logicalName: 'Draft System Requirements and Interfaces Package', format: 'XLSX', systemRepresented: 'Requirements Repository, Interface-Control Repository, Cora' },
    outputs: ['Requirements Traceability Matrix', 'Requirements Quality and Testability Report'],
  },
  {
    phaseId: 3, phaseName: 'Preliminary Design',
    technicalReview: 'Schematic/PDR',
    externalIntake: { behavior: 'SI', logicalName: 'Design Rules and Manufacturing Capabilities Package', format: 'XLSX', systemRepresented: 'Standards Library, Manufacturing-Capability Repository' },
    internalIntake: { behavior: 'UP', logicalName: 'Preliminary Design Package', format: 'XLSX/PDF/ZIP', systemRepresented: null },
    outputs: ['PDR Readiness Summary', 'Early DFM/DFA Findings and Risk Register'],
  },
  {
    phaseId: 4, phaseName: 'Detailed Design',
    technicalReview: 'PCB Layout/CDR',
    externalIntake: { behavior: 'SI', logicalName: 'DFM, Assembly, Standards, and Supplier-Risk Package', format: 'XLSX', systemRepresented: 'Standards Library, Supplier Feed, Obsolescence Source' },
    internalIntake: { behavior: 'UP', logicalName: 'Released Detailed Design Baseline Package', format: 'XLSX/ZIP', systemRepresented: null },
    outputs: ['Source-Cited, Risk-Scored DFM and Standards Audit', 'BOM Health and Manufacturability Report'],
  },
  {
    phaseId: 5, phaseName: 'Verification & Validation',
    technicalReview: null,
    externalIntake: { behavior: 'SI', logicalName: 'Test Methods and Customer Acceptance Package', format: 'XLSX', systemRepresented: 'Standards Library, Customer Acceptance Repository' },
    internalIntake: { behavior: 'UP', logicalName: 'Validation Evidence Package', format: 'XLSX', systemRepresented: null },
    outputs: ['Verification and Validation Matrix', 'Gate 5 Verification and Validation Summary'],
  },
  {
    phaseId: 6, phaseName: 'Manufacturing Readiness',
    technicalReview: null,
    externalIntake: { behavior: 'UP', logicalName: 'Customer Production-Readiness Package', format: 'XLSX', systemRepresented: null },
    internalIntake: { behavior: 'SI', logicalName: 'Manufacturing Process and Capability Package', format: 'XLSX', systemRepresented: 'MES, Quality System, Equipment Records, Cora' },
    outputs: ['Manufacturing Readiness Level Scorecard', 'PPAP/FAI Readiness Index and Action List'],
  },
  {
    phaseId: 7, phaseName: 'Transfer & Lessons Learned',
    technicalReview: null,
    externalIntake: { behavior: 'UP', logicalName: 'Customer Acceptance and Field-Feedback Package', format: 'CSV/XLSX', systemRepresented: null },
    internalIntake: { behavior: 'SI', logicalName: 'Transfer, Actions, Defects, and Yield Package', format: 'XLSX', systemRepresented: 'Cora, MES, CAPA/Quality, Gate Records' },
    outputs: ['Structured Lessons-Learned Register', 'Transfer-Completeness and Improvement-Action Report'],
  },
  {
    phaseId: 8, phaseName: 'Production & Sustaining',
    technicalReview: null,
    externalIntake: { behavior: 'SI', logicalName: 'Supplier Lifecycle and Availability Package', format: 'CSV/XLSX', systemRepresented: 'Supplier Feeds, Distributor Feeds, Obsolescence Databases' },
    internalIntake: { behavior: 'SI', logicalName: 'Production, BOM, Yield, and Cost Package', format: 'XLSX', systemRepresented: 'ERP, MES, PLM, Change Review Board Records' },
    outputs: ['Obsolescence and Supply-Risk Forecast', 'Yield, Quality, and Financial-Anomaly Report'],
  },
  {
    phaseId: 9, phaseName: 'End of Life',
    technicalReview: null,
    externalIntake: { behavior: 'UP', logicalName: 'Customer EOL, Last-Time-Buy, Retention, and Disposal Package', format: 'XLSX/DOCX', systemRepresented: null },
    internalIntake: { behavior: 'SI', logicalName: 'Final Product, Demand, Asset, and Archive Package', format: 'XLSX', systemRepresented: 'ERP, Tooling/Fixture Register, Project Archive, Cora' },
    outputs: ['EOL and Last-Time-Buy Decision Pack', 'Project Closure and Institutional-Memory Record'],
  },
] as const;

export type PhaseId = 0|1|2|3|4|5|6|7|8|9;
export const PHASE_CONFIG_MAP = Object.fromEntries(
  PHASE_CONFIG.map(p => [p.phaseId, p])
) as Record<PhaseId, typeof PHASE_CONFIG[number]>;

// Phases with mapped technical reviews (ONLY these four)
export const TECHNICAL_REVIEW_PHASES = new Set([0, 1, 3, 4]);
