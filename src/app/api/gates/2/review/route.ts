import { NextResponse } from 'next/server';

const MOCK_DATA = {
  gateNumber: 2,
  phaseName: 'Phase 2 — Requirements Development',
  gateState: 'Decided',
  phaseState: 'GatePassed',
  inputs: [
    { logicalName: 'Customer and Standards Requirements Package', inputRole: 'external', intakeBehavior: 'UP', systemRepresented: null, readinessStatus: 'User Input Ready' },
    { logicalName: 'Draft System Requirements and Interfaces Package', inputRole: 'internal', intakeBehavior: 'SI', systemRepresented: 'Requirements Repository, Cora', readinessStatus: 'Synthetic System Input Ready' },
  ],
  outputs: [
    { outputId: 'mock-out-2-0', outputName: 'Requirements Traceability Matrix', artifactType: 'XLSX', approvalStatus: 'Approved' },
    { outputId: 'mock-out-2-1', outputName: 'Requirements Quality and Testability Report', artifactType: 'DOCX', approvalStatus: 'Approved' },
  ],
  findings: [{ findingId: 'F2-001-original', sourcePhase: 2, sourceGate: 2, detectedBy: 'DeterministicCheck', description: 'REQ-THERM-004 lacked measurable criterion — resolved.', severity: 'Major', status: 'VerifiedClosed', seeded: true, createdAt: '2026-08-17T10:00:00Z', closedAt: '2026-08-17T11:00:00Z' }],
  openActions: [],
  aiRecommendation: { recommendedOutcome: 'Pass', rationale: 'Phase 2 complete. Recommend Gate 2 Pass.', findingsCited: [], checksCited: [], advisoryLabel: 'Advisory Only — Human Decision Required' },
  decisionHistory: [{ decisionId: 'mock-dec-2', gateNumber: 2, phaseName: 'Phase 2 — Requirements Development', decision: 'Pass', reviewerRole: 'Priya Nair', comments: 'Phase 2 complete.', timestamp: '2026-08-17T14:00:00Z', isFinal: true }],
};

export async function GET() {
  try {
    const { db } = await import('@/db');
    const schemaModule = await import("@/db/schema"); const { phaseStates, phaseOutputs, phaseInputs, gateDecisions, actions } = schemaModule; const findingsTable = schemaModule.findings;
    const { eq, and } = await import('drizzle-orm');
    const GATE = 2;
    const PROJECT_ID = 'EVINV-POC-001';

    const [phase] = await db.select().from(phaseStates).where(and(eq(phaseStates.projectId, PROJECT_ID), eq(phaseStates.phaseId, GATE as any)));
    const outputs = await db.select().from(phaseOutputs).where(and(eq(phaseOutputs.projectId, PROJECT_ID), eq(phaseOutputs.phaseId, GATE as any)));
    const inputs = await db.select().from(phaseInputs).where(and(eq(phaseInputs.projectId, PROJECT_ID), eq(phaseInputs.phaseId, GATE as any)));
    const allFindings = await db.select().from(findingsTable).where(eq(findingsTable.sourcePhase, GATE as any));
    const openActions = await db.select().from(actions).where(eq(actions.sourcePhase, GATE as any));
    const decisions = await db.select().from(gateDecisions).where(eq(gateDecisions.gateNumber, GATE as any));

    return NextResponse.json({
      gateNumber: GATE, phaseName: 'Phase 2 — Requirements Development',
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
