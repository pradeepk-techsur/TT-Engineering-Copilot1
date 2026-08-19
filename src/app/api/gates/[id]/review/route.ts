import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { phaseStates, phaseOutputs, phaseInputs, gateDecisions, findings as findingsTable, actions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const PHASE_NAMES: Record<number, string> = {
  0: 'Commercial Assessment', 1: 'Business Case', 2: 'Requirements Definition',
  3: 'Preliminary Design', 4: 'Detailed Design', 5: 'Verification & Validation',
  6: 'Manufacturing Readiness', 7: 'Transfer & Lessons Learned',
  8: 'Production & Sustaining', 9: 'End of Life',
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const gateId = parseInt(id);
  if (isNaN(gateId) || gateId < 0 || gateId > 9) {
    return NextResponse.json({ error_code: 'INVALID_GATE' }, { status: 400 });
  }

  const PROJECT_ID = 'EVINV-POC-001';

  const [phase] = await db.select().from(phaseStates)
    .where(and(eq(phaseStates.projectId, PROJECT_ID), eq(phaseStates.phaseId, gateId as any)));

  const outputs = await db.select().from(phaseOutputs)
    .where(and(eq(phaseOutputs.projectId, PROJECT_ID), eq(phaseOutputs.phaseId, gateId as any)));

  const inputs = await db.select().from(phaseInputs)
    .where(and(eq(phaseInputs.projectId, PROJECT_ID), eq(phaseInputs.phaseId, gateId as any)));

  const allFindings = await db.select().from(findingsTable)
    .where(eq(findingsTable.sourcePhase, gateId as any));

  const openActions = await db.select().from(actions)
    .where(eq(actions.sourceGate, gateId as any));

  const decisions = await db.select().from(gateDecisions)
    .where(eq(gateDecisions.gateNumber, gateId as any));

  const aiRecommendation = phase?.aiRecommendation as any;

  return NextResponse.json({
    gateNumber: gateId,
    phaseName: `Phase ${gateId} — ${PHASE_NAMES[gateId] ?? 'Unknown'}`,
    gateState: phase?.gateState ?? 'Locked',
    phaseState: phase?.phaseState ?? 'Pending',
    inputs: inputs.map(i => ({
      logicalName: i.logicalName,
      inputRole: i.inputRole,
      intakeBehavior: i.intakeBehavior,
      systemRepresented: i.systemRepresented,
      readinessStatus: i.readinessStatus,
    })),
    outputs: outputs.slice(0, 2),  // AC-03: max 2 outputs
    findings: allFindings,
    openActions,
    aiRecommendation: aiRecommendation ? {
      ...aiRecommendation,
      advisoryLabel: 'Advisory Only — Human Decision Required',
    } : null,
    decisionHistory: decisions,
  });
}
