import { NextResponse } from 'next/server';

const MOCK_DATA = {
  gateNumber: 7,
  phaseName: 'Phase 7 — Transfer & Lessons Learned',
  gateState: 'Locked',
  phaseState: 'Pending',
  inputs: [
    { logicalName: 'Customer Acceptance and Field-Feedback Package', inputRole: 'external', intakeBehavior: 'UP', systemRepresented: null, readinessStatus: 'Awaiting User Input' },
    { logicalName: 'Transfer, Actions, Defects, and Yield Package', inputRole: 'internal', intakeBehavior: 'SI', systemRepresented: 'Cora, MES, CAPA', readinessStatus: 'Waiting for Synthetic Sample Ingestion' },
  ],
  outputs: [
    { outputId: 'mock-out-7-0', outputName: 'Structured Lessons-Learned Register', artifactType: 'XLSX', approvalStatus: 'AwaitingReview' },
    { outputId: 'mock-out-7-1', outputName: 'Transfer-Completeness and Improvement-Action Report', artifactType: 'DOCX', approvalStatus: 'AwaitingReview' },
  ],
  findings: [],
  openActions: [],
  aiRecommendation: null,
  decisionHistory: [],
};

export async function GET() {
  try {
    const { db } = await import('@/db');
    const schemaModule = await import("@/db/schema"); const { phaseStates, phaseOutputs, phaseInputs, gateDecisions, actions } = schemaModule; const findingsTable = schemaModule.findings;
    const { eq, and } = await import('drizzle-orm');
    const GATE = 7;
    const PROJECT_ID = 'EVINV-POC-001';

    const [phase] = await db.select().from(phaseStates).where(and(eq(phaseStates.projectId, PROJECT_ID), eq(phaseStates.phaseId, GATE as any)));
    const outputs = await db.select().from(phaseOutputs).where(and(eq(phaseOutputs.projectId, PROJECT_ID), eq(phaseOutputs.phaseId, GATE as any)));
    const inputs = await db.select().from(phaseInputs).where(and(eq(phaseInputs.projectId, PROJECT_ID), eq(phaseInputs.phaseId, GATE as any)));
    const allFindings = await db.select().from(findingsTable).where(eq(findingsTable.sourcePhase, GATE as any));
    const openActions = await db.select().from(actions).where(eq(actions.sourcePhase, GATE as any));
    const decisions = await db.select().from(gateDecisions).where(eq(gateDecisions.gateNumber, GATE as any));

    return NextResponse.json({
      gateNumber: GATE, phaseName: 'Phase 7 — Transfer & Lessons Learned',
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
