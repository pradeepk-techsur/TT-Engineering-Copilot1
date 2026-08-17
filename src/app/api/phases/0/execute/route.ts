import { NextRequest, NextResponse } from 'next/server';
import { BidNoBidAgent } from '@/server/agents/phase0/bidNoBidAgent';
import { buildAgentContext } from '@/server/context/contextAssembly';
import { db } from '@/db';
import { phaseStates, phaseInputs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const PROJECT_ID = 'EVINV-POC-001';

export async function POST(_req: NextRequest) {
  // Check both inputs are ready
  const inputs = await db.select().from(phaseInputs)
    .where(and(eq(phaseInputs.projectId, PROJECT_ID), eq(phaseInputs.phaseId, 0 as any)));

  const externalReady = inputs.find(i => i.inputRole === 'external')?.readinessStatus === 'User Input Ready';
  const internalReady = inputs.find(i => i.inputRole === 'internal')?.readinessStatus === 'Synthetic System Input Ready';

  if (!externalReady || !internalReady) {
    return NextResponse.json({ error_code: 'INPUTS_NOT_READY', message: 'Both inputs must be ready before phase execution.' }, { status: 409 });
  }

  // Guard against double-submission: if already Running or beyond, reject
  const [current] = await db.select().from(phaseStates)
    .where(and(eq(phaseStates.projectId, PROJECT_ID), eq(phaseStates.phaseId, 0 as any)));
  if (current?.phaseState === 'Running') {
    return NextResponse.json({ accepted: true, phaseId: 0, status: 'Processing', message: 'Phase execution already in progress.' }, { status: 202 });
  }
  if (current?.phaseState === 'AwaitingGate' || current?.phaseState === 'GatePassed' || current?.phaseState === 'GateConditional') {
    return NextResponse.json({ accepted: true, phaseId: 0, status: 'Complete', message: 'Phase execution already complete.' }, { status: 202 });
  }

  // Transition to Running synchronously so UI polls see 'Processing' immediately
  await db.update(phaseStates)
    .set({ phaseState: 'Running', executionStartedAt: new Date().toISOString() })
    .where(and(eq(phaseStates.projectId, PROJECT_ID), eq(phaseStates.phaseId, 0 as any)));

  // Fire-and-forget: respond 202 immediately so the preview proxy doesn't time out.
  // The agent runs in the background; the frontend polls /api/phases/0/execution-status
  // (every 3s via SWR) and transitions from "Processing" → "Awaiting Human Decision"
  // when the agent writes AwaitingGate to the DB.
  setImmediate(async () => {
    try {
      const context = await buildAgentContext(PROJECT_ID, 0);
      const agent = new BidNoBidAgent();
      await agent.run(context);
      // execution_completed_at: the agent already transitions phaseState to AwaitingGate.
      // Stamp the completion time here so the status route can surface it.
      await db.update(phaseStates)
        .set({ executionCompletedAt: new Date().toISOString() } as any)
        .where(and(eq(phaseStates.projectId, PROJECT_ID), eq(phaseStates.phaseId, 0 as any)));
    } catch (_err) {
      // Reset to AwaitingInputs on failure so user can retry
      await db.update(phaseStates)
        .set({ phaseState: 'AwaitingInputs' })
        .where(and(eq(phaseStates.projectId, PROJECT_ID), eq(phaseStates.phaseId, 0 as any)));
    }
  });

  return NextResponse.json({ accepted: true, phaseId: 0, status: 'Processing' }, { status: 202 });
}
