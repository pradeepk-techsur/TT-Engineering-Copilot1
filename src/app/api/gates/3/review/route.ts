import { NextResponse } from 'next/server';

const MOCK_DATA = {
  gateNumber: 3,
  phaseName: 'Phase 3 — Preliminary Design',
  gateState: 'Open',
  phaseState: 'AwaitingGate',
  inputs: [
    { logicalName: 'Design Rules and Manufacturing Capabilities Package', inputRole: 'external', intakeBehavior: 'SI', systemRepresented: 'Standards Library', readinessStatus: 'Waiting for Synthetic Sample Ingestion' },
    { logicalName: 'Preliminary Design Package', inputRole: 'internal', intakeBehavior: 'UP', systemRepresented: null, readinessStatus: 'Awaiting User Input' },
  ],
  outputs: [
    { outputId: 'mock-out-3-0', outputName: 'PDR Readiness Summary', artifactType: 'XLSX', approvalStatus: 'AwaitingReview' },
    { outputId: 'mock-out-3-1', outputName: 'Early DFM/DFA Findings and Risk Register', artifactType: 'DOCX', approvalStatus: 'AwaitingReview' },
  ],
  findings: [{ findingId: 'F3-001', sourcePhase: 3, sourceGate: 3, detectedBy: 'AgentAnalysis', description: 'Coolant connector (CN-COOL-1) orientation creates assembly-access concern for J-FAST-7 through J-FAST-10.', severity: 'Major', status: 'Open', seeded: true, createdAt: '2026-08-19T09:00:00Z', closedAt: null }],
  openActions: [{ actionId: 'A3-001', sourceFindingId: 'F3-001', sourcePhase: 3, sourceGate: 3, description: 'Revise coolant connector orientation in detailed design.', ownerRole: 'Design Engineer', blocking: true, parallel: true, duePhase: 4, dueGate: 4, requiredClosureEvidence: 'Revised design drawing showing unobstructed fastener access.', status: 'Open', humanApprover: 'Marcus Webb', createdAt: '2026-08-19T09:30:00Z', closedAt: null }],
  aiRecommendation: { recommendedOutcome: 'Conditional Pass', rationale: 'Coolant connector orientation concern (F3-001). Action A3-001 required before CDR.', findingsCited: ['F3-001'], checksCited: [], advisoryLabel: 'Advisory Only — Human Decision Required' },
  decisionHistory: [],
};

export async function GET() {
  try {
    const { db } = await import('@/db');
    const schemaModule = await import("@/db/schema"); const { phaseStates, phaseOutputs, phaseInputs, gateDecisions, actions } = schemaModule; const findingsTable = schemaModule.findings;
    const { eq, and } = await import('drizzle-orm');
    const GATE = 3;
    const PROJECT_ID = 'EVINV-POC-001';

    const [phase] = await db.select().from(phaseStates).where(and(eq(phaseStates.projectId, PROJECT_ID), eq(phaseStates.phaseId, GATE as any)));
    const outputs = await db.select().from(phaseOutputs).where(and(eq(phaseOutputs.projectId, PROJECT_ID), eq(phaseOutputs.phaseId, GATE as any)));
    const inputs = await db.select().from(phaseInputs).where(and(eq(phaseInputs.projectId, PROJECT_ID), eq(phaseInputs.phaseId, GATE as any)));
    const allFindings = await db.select().from(findingsTable).where(eq(findingsTable.sourcePhase, GATE as any));
    const openActions = await db.select().from(actions).where(eq(actions.sourcePhase, GATE as any));
    const decisions = await db.select().from(gateDecisions).where(eq(gateDecisions.gateNumber, GATE as any));

    return NextResponse.json({
      gateNumber: GATE, phaseName: 'Phase 3 — Preliminary Design',
      gateState: phase?.gateState ?? 'Locked', phaseState: phase?.phaseState ?? 'Pending',
      inputs: inputs.map((i: any) => ({ logicalName: i.logicalName, inputRole: i.inputRole, intakeBehavior: i.intakeBehavior, systemRepresented: i.systemRepresented, readinessStatus: i.readinessStatus })),
      outputs: outputs.slice(0, 2), findings: allFindings, openActions,
      aiRecommendation: phase?.aiRecommendation ? { ...(phase.aiRecommendation as any), advisoryLabel: 'Advisory Only — Human Decision Required' } : null,
      decisionHistory: decisions,
    });
  } catch {
    return NextResponse.json(MOCK_DATA);
  }
}
