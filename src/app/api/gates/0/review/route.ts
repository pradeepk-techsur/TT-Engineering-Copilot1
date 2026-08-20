import { NextResponse } from 'next/server';

const MOCK_DATA = {
  gateNumber: 0,
  phaseName: 'Phase 0 — Project Initiation',
  gateState: 'Decided',
  phaseState: 'GatePassed',
  inputs: [
    { logicalName: 'Customer Opportunity Package', inputRole: 'external', intakeBehavior: 'UP', systemRepresented: null, readinessStatus: 'User Input Ready' },
    { logicalName: 'Capability and Opportunity Assessment Package', inputRole: 'internal', intakeBehavior: 'SI', systemRepresented: 'Salesforce, Cora', readinessStatus: 'Synthetic System Input Ready' },
  ],
  outputs: [
    { outputId: 'mock-out-0-0', outputName: 'Opportunity Summary and Bid/No-Bid Recommendation', artifactType: 'XLSX', approvalStatus: 'Approved' },
    { outputId: 'mock-out-0-1', outputName: 'Capability-Match and Critical-Gap Matrix', artifactType: 'DOCX', approvalStatus: 'Approved' },
  ],
  findings: [],
  openActions: [],
  aiRecommendation: { recommendedOutcome: 'Pass', rationale: 'Phase 0 complete. Recommend Gate 0 Pass.', findingsCited: [], checksCited: [], advisoryLabel: 'Advisory Only — Human Decision Required' },
  decisionHistory: [{ decisionId: 'mock-dec-0', gateNumber: 0, phaseName: 'Phase 0 — Project Initiation', decision: 'Pass', reviewerRole: 'Claire Ashby', comments: 'Phase 0 complete.', timestamp: '2026-08-15T14:00:00Z', isFinal: true }],
};

export async function GET() {
  try {
    const { db } = await import('@/db');
    const schemaModule = await import("@/db/schema"); const { phaseStates, phaseOutputs, phaseInputs, gateDecisions, actions } = schemaModule; const findingsTable = schemaModule.findings;
    const { eq, and } = await import('drizzle-orm');
    const GATE = 0;
    const PROJECT_ID = 'EVINV-POC-001';

    const [phase] = await db.select().from(phaseStates).where(and(eq(phaseStates.projectId, PROJECT_ID), eq(phaseStates.phaseId, GATE as any)));
    const outputs = await db.select().from(phaseOutputs).where(and(eq(phaseOutputs.projectId, PROJECT_ID), eq(phaseOutputs.phaseId, GATE as any)));
    const inputs = await db.select().from(phaseInputs).where(and(eq(phaseInputs.projectId, PROJECT_ID), eq(phaseInputs.phaseId, GATE as any)));
    const allFindings = await db.select().from(findingsTable).where(eq(findingsTable.sourcePhase, GATE as any));
    const openActions = await db.select().from(actions).where(eq(actions.sourcePhase, GATE as any));
    const decisions = await db.select().from(gateDecisions).where(eq(gateDecisions.gateNumber, GATE as any));

    return NextResponse.json({
      gateNumber: GATE, phaseName: 'Phase 0 — Project Initiation',
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
