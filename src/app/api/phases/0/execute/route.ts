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

  // Transition to Running
  await db.update(phaseStates)
    .set({ phaseState: 'Running', executionStartedAt: new Date().toISOString() })
    .where(and(eq(phaseStates.projectId, PROJECT_ID), eq(phaseStates.phaseId, 0 as any)));

  try {
    const context = await buildAgentContext(PROJECT_ID, 0);
    const agent = new BidNoBidAgent();
    const result = await agent.run(context);

    return NextResponse.json({
      success: true,
      phaseId: 0,
      outputs: result.outputs,
      aiRecommendation: result.aiRecommendation,
      findings: result.findings,
    });
  } catch (err: any) {
    // Reset to AwaitingInputs on failure
    await db.update(phaseStates)
      .set({ phaseState: 'AwaitingInputs' })
      .where(and(eq(phaseStates.projectId, PROJECT_ID), eq(phaseStates.phaseId, 0 as any)));

    return NextResponse.json({ error_code: 'AGENT_FAILED', message: err.message }, { status: 500 });
  }
}
