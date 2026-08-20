import { NextResponse } from 'next/server';

const MOCK_DATA = {
  gateNumber: 1,
  phaseName: 'Phase 1 — Concept & Proposal',
  gateState: 'Decided',
  phaseState: 'GatePassed',
  inputs: [
    { logicalName: 'Customer Requirements, Quantities, and Supplier Pricing Package', inputRole: 'external', intakeBehavior: 'UP', systemRepresented: null, readinessStatus: 'User Input Ready' },
    { logicalName: 'Preliminary Cost and Resource Package', inputRole: 'internal', intakeBehavior: 'SI', systemRepresented: 'Cora, Historical Proposals', readinessStatus: 'Synthetic System Input Ready' },
  ],
  outputs: [
    { outputId: 'mock-out-1-0', outputName: 'Costed Proposal or Business Case', artifactType: 'XLSX', approvalStatus: 'Approved' },
    { outputId: 'mock-out-1-1', outputName: 'Resource and Milestone Schedule', artifactType: 'DOCX', approvalStatus: 'Approved' },
  ],
  findings: [],
  openActions: [],
  aiRecommendation: { recommendedOutcome: 'Pass', rationale: 'Phase 1 complete. Recommend Gate 1 Pass.', findingsCited: [], checksCited: [], advisoryLabel: 'Advisory Only — Human Decision Required' },
  decisionHistory: [{ decisionId: 'mock-dec-1', gateNumber: 1, phaseName: 'Phase 1 — Concept & Proposal', decision: 'Pass', reviewerRole: 'Claire Ashby', comments: 'Phase 1 complete.', timestamp: '2026-08-16T14:00:00Z', isFinal: true }],
};

export async function GET() {
  try {
    const { db } = await import('@/db');
    const schemaModule = await import("@/db/schema"); const { phaseStates, phaseOutputs, phaseInputs, gateDecisions, actions } = schemaModule; const findingsTable = schemaModule.findings;
    const { eq, and } = await import('drizzle-orm');
    const GATE = 1;
    const PROJECT_ID = 'EVINV-POC-001';

    const [phase] = await db.select().from(phaseStates).where(and(eq(phaseStates.projectId, PROJECT_ID), eq(phaseStates.phaseId, GATE as any)));
    const outputs = await db.select().from(phaseOutputs).where(and(eq(phaseOutputs.projectId, PROJECT_ID), eq(phaseOutputs.phaseId, GATE as any)));
    const inputs = await db.select().from(phaseInputs).where(and(eq(phaseInputs.projectId, PROJECT_ID), eq(phaseInputs.phaseId, GATE as any)));
    const allFindings = await db.select().from(findingsTable).where(eq(findingsTable.sourcePhase, GATE as any));
    const openActions = await db.select().from(actions).where(eq(actions.sourcePhase, GATE as any));
    const decisions = await db.select().from(gateDecisions).where(eq(gateDecisions.gateNumber, GATE as any));

    return NextResponse.json({
      gateNumber: GATE, phaseName: 'Phase 1 — Concept & Proposal',
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
