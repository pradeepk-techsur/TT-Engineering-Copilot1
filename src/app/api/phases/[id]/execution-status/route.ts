import { NextRequest, NextResponse } from 'next/server';
import { MOCK_PHASE_STATES } from '@/lib/mockData';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const phaseId = parseInt(id);
  try {
    const { db } = await import('@/db');
    const { phaseStates, phaseInputs } = await import('@/db/schema');
    const { eq, and } = await import('drizzle-orm');
    const { PHASE_CONFIG_MAP } = await import('@/shared/constants/phaseConfig');

    const inputs = await db.select().from(phaseInputs)
      .where(and(eq(phaseInputs.projectId, 'EVINV-POC-001'), eq(phaseInputs.phaseId, phaseId as any)));
    const [phaseState] = await db.select().from(phaseStates)
      .where(and(eq(phaseStates.projectId, 'EVINV-POC-001'), eq(phaseStates.phaseId, phaseId as any)));
    const config = PHASE_CONFIG_MAP[phaseId as keyof typeof PHASE_CONFIG_MAP];
    const extInput = inputs.find((i: any) => i.inputRole === 'external');
    const intInput = inputs.find((i: any) => i.inputRole === 'internal');
    const extReady = extInput?.readinessStatus === 'User Input Ready' || extInput?.readinessStatus === 'Synthetic System Input Ready';
    const intReady = intInput?.readinessStatus === 'User Input Ready' || intInput?.readinessStatus === 'Synthetic System Input Ready';
    let status = 'Ready to Run';
    if (['GatePassed', 'GateConditional'].includes(phaseState?.phaseState ?? '')) status = 'Complete';
    else if (phaseState?.phaseState === 'AwaitingGate') status = 'Awaiting Human Decision';
    else if (phaseState?.phaseState === 'Running') status = 'Processing';
    else if (!extReady && config?.externalIntake.behavior === 'UP') status = 'Waiting for User Input';
    else if (!intReady && config?.internalIntake.behavior === 'UP') status = 'Waiting for User Input';
    else if (!extReady && config?.externalIntake.behavior === 'SI') status = 'Waiting for Synthetic Sample Ingestion';
    else if (!intReady && config?.internalIntake.behavior === 'SI') status = 'Waiting for Synthetic Sample Ingestion';
    return NextResponse.json({ phaseId, status, bothReady: extReady && intReady, externalReady: extReady, internalReady: intReady });
  } catch {
    // Mock fallback
    const mockState = MOCK_PHASE_STATES.find(p => p.phaseId === phaseId);
    const bothReady = (mockState?.phaseId ?? 99) < 3;
    const status = mockState?.phaseState === 'GatePassed' ? 'Complete'
      : mockState?.phaseState === 'AwaitingGate' ? 'Awaiting Human Decision'
      : bothReady ? 'Ready to Run' : 'Waiting for Synthetic Sample Ingestion';
    return NextResponse.json({ phaseId, status, bothReady, externalReady: bothReady, internalReady: bothReady, blockingReason: !bothReady ? 'INPUTS_NOT_READY' : null });
  }
}
