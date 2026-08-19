/**
 * Mock data for Preview mode (when PostgreSQL is unavailable).
 * Returns realistic synthetic data so all UI views render correctly.
 * Synthetic POC Data. Not TT Electronics Product Data.
 */

import { PHASE_CONFIG } from '@/shared/constants/phaseConfig';

export const MOCK_PROJECT = {
  stateId: 'mock-state-1',
  projectId: 'EVINV-POC-001',
  productName: 'EV-INV-800 Demonstration Traction Inverter',
  projectType: 'NPI A',
  projectCategory: 'Category 1',
  currentPhase: 3,
  currentGate: 3,
  currentTechnicalReview: 'Schematic/PDR',
  projectStatus: 'Active',
  syntheticDataIndicator: true,
  createdAt: '2026-08-15T00:00:00Z',
  updatedAt: '2026-08-19T00:00:00Z',
};

// Simulate happy-path: G0, G1, G2 passed; G3 current
export const MOCK_PHASE_STATES = PHASE_CONFIG.map((config, i) => ({
  phaseStateId: `mock-phase-state-${i}`,
  projectId: 'EVINV-POC-001',
  phaseId: config.phaseId,
  phaseState: i === 0 ? 'GatePassed'
    : i === 1 ? 'GatePassed'
    : i === 2 ? 'GatePassed'
    : i === 3 ? 'AwaitingGate'
    : 'Pending',
  gateState: i < 3 ? 'Decided' : i === 3 ? 'Open' : 'Locked',
  aiRecommendation: i === 3 ? {
    recommendedOutcome: 'Conditional Pass',
    rationale: 'Coolant connector orientation creates assembly access concern. Action A3-001 required.',
    findingsCited: ['F3-001'],
    checksCited: [],
    advisoryLabel: 'Advisory Only — Human Decision Required',
  } : null,
  compactPhaseSummary: i < 3 ? {
    phaseId: config.phaseId,
    phaseName: config.phaseName,
    outcome: 'Pass',
    keyFindings: [],
    openActions: [],
    approvedOutputs: config.outputs,
    approvedAt: `2026-08-${15 + i}T00:00:00Z`,
  } : null,
  executionStartedAt: null,
  executionCompletedAt: null,
}));

export const MOCK_LIFECYCLE = {
  projectId: 'EVINV-POC-001',
  productName: 'EV-INV-800 Demonstration Traction Inverter',
  projectType: 'NPI A',
  projectCategory: 'Category 1',
  currentPhase: 3,
  currentGate: 3,
  projectStatus: 'Active',
  phases: PHASE_CONFIG.map((config, i) => ({
    phaseId: config.phaseId,
    phaseName: config.phaseName,
    technicalReview: config.technicalReview ?? null,
    externalIntakeBehavior: config.externalIntake.behavior,
    internalIntakeBehavior: config.internalIntake.behavior,
    phaseState: i === 0 ? 'GatePassed'
      : i === 1 ? 'GatePassed'
      : i === 2 ? 'GatePassed'
      : i === 3 ? 'AwaitingGate'
      : 'Pending',
    gateState: i < 3 ? 'Decided' : i === 3 ? 'Open' : 'Locked',
    hasCompactSummary: i < 3,
  })),
};

export const MOCK_INPUTS: Record<number, { external: any; internal: any }> = {};
PHASE_CONFIG.forEach((config, i) => {
  MOCK_INPUTS[config.phaseId] = {
    external: {
      inputRole: 'external',
      logicalName: config.externalIntake.logicalName,
      intakeBehavior: config.externalIntake.behavior,
      systemRepresented: config.externalIntake.systemRepresented ?? null,
      format: config.externalIntake.format,
      sizeGuidance: '≤10 rows (XLSX) or 1–2 pages (DOCX/PDF)',
      activeArtifactId: i < 3 ? `mock-artifact-ext-${config.phaseId}` : null,
      activeVersion: i < 3 ? 1 : null,
      validationStatus: i < 3 ? 'Pass' : 'Pending',
      validationIssues: [],
      requiredUserAction: i < 3 ? 'None'
        : config.externalIntake.behavior === 'UP' ? 'Upload file' : 'Click Ingest Sample',
      isReady: i < 3,
      readyStatus: i < 3
        ? (config.externalIntake.behavior === 'UP' ? 'User Input Ready' : 'Synthetic System Input Ready')
        : (config.externalIntake.behavior === 'UP' ? 'Awaiting User Input' : 'Waiting for Synthetic Sample Ingestion'),
    },
    internal: {
      inputRole: 'internal',
      logicalName: config.internalIntake.logicalName,
      intakeBehavior: config.internalIntake.behavior,
      systemRepresented: config.internalIntake.systemRepresented ?? null,
      format: config.internalIntake.format,
      sizeGuidance: '≤10 rows (XLSX)',
      activeArtifactId: i < 3 ? `mock-artifact-int-${config.phaseId}` : null,
      activeVersion: i < 3 ? 1 : null,
      validationStatus: i < 3 ? 'Pass' : 'Pending',
      validationIssues: [],
      requiredUserAction: i < 3 ? 'None'
        : config.internalIntake.behavior === 'UP' ? 'Upload file' : 'Click Ingest Sample',
      isReady: i < 3,
      readyStatus: i < 3
        ? (config.internalIntake.behavior === 'UP' ? 'User Input Ready' : 'Synthetic System Input Ready')
        : (config.internalIntake.behavior === 'UP' ? 'Awaiting User Input' : 'Waiting for Synthetic Sample Ingestion'),
    },
  };
});

export const MOCK_FINDINGS = [
  {
    findingId: 'F2-001-original',
    sourcePhase: 2, sourceGate: 2,
    detectedBy: 'DeterministicCheck',
    checkId: 'mock-check-1',
    description: 'REQ-THERM-004 lacks a measurable acceptance criterion. Testability check: FAIL.',
    severity: 'Major', status: 'VerifiedClosed', seeded: true,
    createdAt: '2026-08-17T10:00:00Z', closedAt: '2026-08-17T11:00:00Z',
  },
  {
    findingId: 'F3-001',
    sourcePhase: 3, sourceGate: 3,
    detectedBy: 'AgentAnalysis',
    checkId: null,
    description: 'Coolant connector (CN-COOL-1) orientation creates assembly-access concern. Connector obstructs access to M4 fasteners J-FAST-7 through J-FAST-10.',
    severity: 'Major', status: 'Open', seeded: true,
    createdAt: '2026-08-19T09:00:00Z', closedAt: null,
  },
];

export const MOCK_ACTIONS = [
  {
    actionId: 'A3-001',
    sourceFindingId: 'F3-001',
    sourcePhase: 3, sourceGate: 3,
    description: 'Revise coolant connector (CN-COOL-1) orientation in detailed design to ensure unobstructed access to J-FAST-7 through J-FAST-10.',
    ownerRole: 'Design Engineer',
    blocking: true, parallel: true,
    duePhase: 4, dueGate: 4,
    requiredClosureEvidence: 'Revised design drawing showing CN-COOL-1 reorientation with unobstructed fastener access.',
    status: 'Open',
    humanApprover: 'Marcus Webb',
    closureEvidenceArtifactId: null,
    createdAt: '2026-08-19T09:30:00Z', closedAt: null,
  },
];

export const MOCK_GATE_DECISIONS = [
  {
    decisionId: 'mock-decision-0',
    gateNumber: 0, phaseName: 'Phase 0 — Commercial Assessment',
    aiRecommendation: { recommendedOutcome: 'Pass', rationale: 'Capability assessment complete.', advisoryLabel: 'Advisory Only — Human Decision Required' },
    humanDisposition: 'Proceeding to proposal phase.',
    reviewerRole: 'Claire Ashby', decision: 'Pass',
    comments: 'Strong capability match. Export control review complete.',
    timestamp: '2026-08-15T14:00:00Z',
    artifactVersionsReviewed: [], openConditions: [], isFinal: true, supersedes: null,
  },
  {
    decisionId: 'mock-decision-1',
    gateNumber: 1, phaseName: 'Phase 1 — Business Case',
    aiRecommendation: { recommendedOutcome: 'Pass', rationale: 'Business case complete.', advisoryLabel: 'Advisory Only — Human Decision Required' },
    humanDisposition: 'Proposal approved.',
    reviewerRole: 'Claire Ashby', decision: 'Pass',
    comments: 'Cost model validated. Schedule achievable.',
    timestamp: '2026-08-16T10:00:00Z',
    artifactVersionsReviewed: [], openConditions: [], isFinal: true, supersedes: null,
  },
  {
    decisionId: 'mock-decision-2',
    gateNumber: 2, phaseName: 'Phase 2 — Requirements Definition',
    aiRecommendation: { recommendedOutcome: 'Pass', rationale: 'All requirements testable after REQ-THERM-004 clarification.', advisoryLabel: 'Advisory Only — Human Decision Required' },
    humanDisposition: 'Requirements baseline confirmed.',
    reviewerRole: 'Priya Nair', decision: 'Pass',
    comments: 'REQ-THERM-004 clarified with measurable criterion (≤85°C at TP-CASE-1).',
    timestamp: '2026-08-17T15:00:00Z',
    artifactVersionsReviewed: [], openConditions: [], isFinal: true, supersedes: null,
  },
];

export const MOCK_AUDIT_EVENTS = [
  {
    auditId: 'mock-audit-1',
    eventType: 'IntakeEvent',
    phaseId: 0,
    description: 'USER_FILE_UPLOAD: Customer Opportunity Package — file_uploaded',
    actor: 'user',
    timestamp: '2026-08-15T09:00:00Z',
    intakeEvent: {
      phase_id: 0, logical_input: 'Customer Opportunity Package',
      intake_behavior: 'UP', user_action: 'file_uploaded',
      system_represented: null, status: 'User Input Ready',
      source_artifact_id: 'mock-art-0-ext', version: 1,
      validation_result: { passed: true, issues: [] },
      timestamp: '2026-08-15T09:00:00Z',
    },
  },
  {
    auditId: 'mock-audit-2',
    eventType: 'IntakeEvent',
    phaseId: 0,
    description: 'SIMULATED_INTAKE: Capability and Opportunity Assessment Package — sample_ingested',
    actor: 'user',
    timestamp: '2026-08-15T09:05:00Z',
    intakeEvent: {
      phase_id: 0, logical_input: 'Capability and Opportunity Assessment Package',
      intake_behavior: 'SI', user_action: 'sample_ingested',
      system_represented: 'Salesforce, Cora, Capability Library',
      status: 'Synthetic System Input Ready',
      source_artifact_id: 'mock-art-0-int', version: 1,
      validation_result: { passed: true, issues: [] },
      timestamp: '2026-08-15T09:05:00Z',
    },
  },
  {
    auditId: 'mock-audit-3',
    eventType: 'GateDecision',
    phaseId: 0,
    description: 'Gate 0 decided: Pass by Claire Ashby',
    actor: 'Claire Ashby',
    timestamp: '2026-08-15T14:00:00Z',
    intakeEvent: null,
  },
  {
    auditId: 'mock-audit-4',
    eventType: 'IntakeEvent',
    phaseId: 2,
    description: 'USER_FILE_UPLOAD: Customer and Standards Requirements Package — file_uploaded',
    actor: 'user',
    timestamp: '2026-08-17T08:00:00Z',
    intakeEvent: {
      phase_id: 2, logical_input: 'Customer and Standards Requirements Package',
      intake_behavior: 'UP', user_action: 'file_uploaded',
      system_represented: null, status: 'User Input Ready',
      source_artifact_id: 'mock-art-2-ext', version: 1,
      validation_result: { passed: true, issues: [] },
      timestamp: '2026-08-17T08:00:00Z',
    },
  },
  {
    auditId: 'mock-audit-5',
    eventType: 'IntakeEvent',
    phaseId: 2,
    description: 'USER_FILE_UPLOAD: Customer and Standards Requirements Package — revised_version_uploaded',
    actor: 'user',
    timestamp: '2026-08-17T10:30:00Z',
    intakeEvent: {
      phase_id: 2, logical_input: 'Customer and Standards Requirements Package',
      intake_behavior: 'UP', user_action: 'revised_version_uploaded',
      system_represented: null, status: 'User Input Ready',
      source_artifact_id: 'mock-art-2-ext-v2', version: 2,
      validation_result: { passed: true, issues: [] },
      timestamp: '2026-08-17T10:30:00Z',
    },
  },
];

export function isMockMode(): boolean {
  // Use mock data when DATABASE_URL is not set or DB is unreachable
  return !process.env.DATABASE_URL || process.env.DATABASE_URL === '';
}
