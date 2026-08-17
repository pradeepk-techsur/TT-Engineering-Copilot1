import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { phaseInputs, phaseStates } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { PHASE_CONFIG_MAP } from '@/shared/constants/phaseConfig';
import { PhaseExecutionStatus } from '@/server/intake/types';

const PROJECT_ID = 'EVINV-POC-001';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const phaseId = parseInt(id);
  if (isNaN(phaseId) || phaseId < 0 || phaseId > 9) {
    return NextResponse.json({ error_code: 'INVALID_PHASE' }, { status: 400 });
  }

  const inputs = await db.select().from(phaseInputs)
    .where(and(eq(phaseInputs.projectId, PROJECT_ID), eq(phaseInputs.phaseId, phaseId as any)));

  const [phaseState] = await db.select().from(phaseStates)
    .where(and(eq(phaseStates.projectId, PROJECT_ID), eq(phaseStates.phaseId, phaseId as any)));

  const config = PHASE_CONFIG_MAP[phaseId as keyof typeof PHASE_CONFIG_MAP];
  const extInput = inputs.find(i => i.inputRole === 'external');
  const intInput = inputs.find(i => i.inputRole === 'internal');

  const extReady = extInput?.readinessStatus === 'User Input Ready' || extInput?.readinessStatus === 'Synthetic System Input Ready';
  const intReady = intInput?.readinessStatus === 'User Input Ready' || intInput?.readinessStatus === 'Synthetic System Input Ready';

  let status: PhaseExecutionStatus = 'Ready to Run';

  if (phaseState?.phaseState === 'GatePassed' || phaseState?.phaseState === 'GateConditional') {
    status = 'Complete';
  } else if (phaseState?.phaseState === 'AwaitingGate') {
    status = 'Awaiting Human Decision';
  } else if (phaseState?.phaseState === 'Running') {
    status = 'Processing';
  } else if (!extReady && config?.externalIntake.behavior === 'UP') {
    status = 'Waiting for User Input';
  } else if (!intReady && config?.internalIntake.behavior === 'UP') {
    status = 'Waiting for User Input';
  } else if (!extReady && config?.externalIntake.behavior === 'SI') {
    status = 'Waiting for Synthetic Sample Ingestion';
  } else if (!intReady && config?.internalIntake.behavior === 'SI') {
    status = 'Waiting for Synthetic Sample Ingestion';
  } else if (extReady && intReady) {
    status = 'Ready to Run';
  }

  const bothReady = extReady && intReady;

  return NextResponse.json({
    phaseId,
    status,
    bothReady,
    externalReady: extReady,
    internalReady: intReady,
    // If not both ready, return 409 hint (not HTTP error — just field)
    blockingReason: !bothReady ? 'INPUTS_NOT_READY' : null,
  });
}
