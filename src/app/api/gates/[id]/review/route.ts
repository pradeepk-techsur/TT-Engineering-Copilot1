import { NextResponse } from 'next/server';
import { MOCK_PHASE_STATES, MOCK_FINDINGS, MOCK_ACTIONS, MOCK_GATE_DECISIONS } from '@/lib/mockData';
import { PHASE_CONFIG_MAP } from '@/shared/constants/phaseConfig';

const PHASE_NAMES: Record<number, string> = {
  0: 'Commercial Assessment', 1: 'Business Case', 2: 'Requirements Definition',
  3: 'Preliminary Design', 4: 'Detailed Design', 5: 'Verification & Validation',
  6: 'Manufacturing Readiness', 7: 'Transfer & Lessons Learned',
  8: 'Production & Sustaining', 9: 'End of Life',
};

function buildMockReview(gateId: number) {
  const mockPhase = MOCK_PHASE_STATES.find(p => p.phaseId === gateId);
  const config = PHASE_CONFIG_MAP[gateId as keyof typeof PHASE_CONFIG_MAP];
  const mockDecisions = MOCK_GATE_DECISIONS.filter(d => d.gateNumber === gateId);
  const mockFindings = MOCK_FINDINGS.filter(f => f.sourcePhase === gateId);
  const mockActions = MOCK_ACTIONS.filter(a => a.sourcePhase === gateId);

  return {
    gateNumber: gateId,
    phaseName: `Phase ${gateId} — ${PHASE_NAMES[gateId] ?? 'Unknown'}`,
    gateState: mockPhase?.gateState ?? 'Locked',
    phaseState: mockPhase?.phaseState ?? 'Pending',
    inputs: config ? [
      {
        logicalName: config.externalIntake.logicalName,
        inputRole: 'external',
        intakeBehavior: config.externalIntake.behavior,
        systemRepresented: config.externalIntake.systemRepresented ?? null,
        readinessStatus: gateId < 3
          ? (config.externalIntake.behavior === 'UP' ? 'User Input Ready' : 'Synthetic System Input Ready')
          : (config.externalIntake.behavior === 'UP' ? 'Awaiting User Input' : 'Waiting for Synthetic Sample Ingestion'),
      },
      {
        logicalName: config.internalIntake.logicalName,
        inputRole: 'internal',
        intakeBehavior: config.internalIntake.behavior,
        systemRepresented: config.internalIntake.systemRepresented ?? null,
        readinessStatus: gateId < 3
          ? (config.internalIntake.behavior === 'UP' ? 'User Input Ready' : 'Synthetic System Input Ready')
          : (config.internalIntake.behavior === 'UP' ? 'Awaiting User Input' : 'Waiting for Synthetic Sample Ingestion'),
      },
    ] : [],
    outputs: config
      ? config.outputs.map((name, i) => ({
          outputId: `mock-out-${gateId}-${i}`,
          outputName: name,
          artifactType: i === 0 ? 'XLSX' : 'DOCX',
          approvalStatus: gateId < 3 ? 'Approved' : 'AwaitingReview',
        }))
      : [],
    findings: mockFindings,
    openActions: mockActions,
    aiRecommendation: mockPhase?.aiRecommendation
      ? { ...(mockPhase.aiRecommendation as any), advisoryLabel: 'Advisory Only — Human Decision Required' }
      : null,
    decisionHistory: mockDecisions,
  };
}

// Next.js 15 route handler — segment params passed as second argument
export async function GET(
  request: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const resolved = params instanceof Promise ? await params : params;
    const gateId = parseInt(resolved.id ?? '0');

    if (isNaN(gateId) || gateId < 0 || gateId > 9) {
      return NextResponse.json({ error_code: 'INVALID_GATE' }, { status: 400 });
    }

    // Try DB first, fall back to mock
    try {
      const { db } = await import('@/db');
      const { phaseStates, phaseOutputs, phaseInputs, gateDecisions, findings, actions } = await import('@/db/schema');
      const { eq, and } = await import('drizzle-orm');

      const [phase] = await db.select().from(phaseStates)
        .where(and(eq(phaseStates.projectId, 'EVINV-POC-001'), eq(phaseStates.phaseId, gateId as any)));
      const outputs = await db.select().from(phaseOutputs)
        .where(and(eq(phaseOutputs.projectId, 'EVINV-POC-001'), eq(phaseOutputs.phaseId, gateId as any)));
      const inputs = await db.select().from(phaseInputs)
        .where(and(eq(phaseInputs.projectId, 'EVINV-POC-001'), eq(phaseInputs.phaseId, gateId as any)));
      const allFindings = await db.select().from(findings).where(eq(findings.sourcePhase, gateId as any));
      const openActions = await db.select().from(actions).where(eq(actions.sourceGate, gateId as any));
      const decisions = await db.select().from(gateDecisions).where(eq(gateDecisions.gateNumber, gateId as any));

      return NextResponse.json({
        gateNumber: gateId,
        phaseName: `Phase ${gateId} — ${PHASE_NAMES[gateId]}`,
        gateState: phase?.gateState ?? 'Locked',
        phaseState: phase?.phaseState ?? 'Pending',
        inputs: inputs.map((i: any) => ({
          logicalName: i.logicalName, inputRole: i.inputRole,
          intakeBehavior: i.intakeBehavior, systemRepresented: i.systemRepresented,
          readinessStatus: i.readinessStatus,
        })),
        outputs: outputs.slice(0, 2),
        findings: allFindings,
        openActions,
        aiRecommendation: phase?.aiRecommendation
          ? { ...(phase.aiRecommendation as any), advisoryLabel: 'Advisory Only — Human Decision Required' }
          : null,
        decisionHistory: decisions,
      });
    } catch {
      return NextResponse.json(buildMockReview(gateId));
    }
  } catch (err) {
    console.error('Gate review route error:', err);
    return NextResponse.json({ error_code: 'INTERNAL_ERROR', gateNumber: 0 }, { status: 500 });
  }
}
