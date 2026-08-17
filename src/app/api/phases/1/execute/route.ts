import { NextRequest, NextResponse } from 'next/server';
import { ProposalCostAgent } from '@/server/agents/phase1/proposalCostAgent';
import { buildAgentContext } from '@/server/context/contextAssembly';
import { db } from '@/db';
import { phaseStates, phaseInputs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const PROJECT_ID = 'EVINV-POC-001';

export async function POST(_req: NextRequest) {
  const inputs = await db.select().from(phaseInputs)
    .where(and(eq(phaseInputs.projectId, PROJECT_ID), eq(phaseInputs.phaseId, 1 as any)));

  const externalReady = inputs.find(i => i.inputRole === 'external')?.readinessStatus === 'User Input Ready';
  const internalReady = inputs.find(i => i.inputRole === 'internal')?.readinessStatus === 'Synthetic System Input Ready';

  if (!externalReady || !internalReady) {
    return NextResponse.json({ error_code: 'INPUTS_NOT_READY', message: 'Both inputs must be ready before phase execution.' }, { status: 409 });
  }

  // Guard: already running or complete
  const [current] = await db.select().from(phaseStates)
    .where(and(eq(phaseStates.projectId, PROJECT_ID), eq(phaseStates.phaseId, 1 as any)));
  if (current?.phaseState === 'Running') {
    return NextResponse.json({ accepted: true, phaseId: 1, status: 'Processing', message: 'Phase execution already in progress.' }, { status: 202 });
  }
  if (current?.phaseState === 'AwaitingGate' || current?.phaseState === 'GatePassed' || current?.phaseState === 'GateConditional') {
    return NextResponse.json({ accepted: true, phaseId: 1, status: 'Complete', message: 'Phase execution already complete.' }, { status: 202 });
  }

  await db.update(phaseStates).set({ phaseState: 'Running', executionStartedAt: new Date().toISOString() })
    .where(and(eq(phaseStates.projectId, PROJECT_ID), eq(phaseStates.phaseId, 1 as any)));

  setImmediate(async () => {
    try {
      const context = await buildAgentContext(PROJECT_ID, 1);
      const agent = new ProposalCostAgent();
      await agent.run(context);
      await db.update(phaseStates)
        .set({ executionCompletedAt: new Date().toISOString() } as any)
        .where(and(eq(phaseStates.projectId, PROJECT_ID), eq(phaseStates.phaseId, 1 as any)));
    } catch (_err) {
      await db.update(phaseStates).set({ phaseState: 'AwaitingInputs' })
        .where(and(eq(phaseStates.projectId, PROJECT_ID), eq(phaseStates.phaseId, 1 as any)));
    }
  });

  return NextResponse.json({ accepted: true, phaseId: 1, status: 'Processing' }, { status: 202 });
}
