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

  await db.update(phaseStates).set({ phaseState: 'Running', executionStartedAt: new Date() })
    .where(and(eq(phaseStates.projectId, PROJECT_ID), eq(phaseStates.phaseId, 1 as any)));

  try {
    const context = await buildAgentContext(PROJECT_ID, 1);
    const agent = new ProposalCostAgent();
    const result = await agent.run(context);

    return NextResponse.json({
      success: true, phaseId: 1,
      outputs: result.outputs, aiRecommendation: result.aiRecommendation, findings: result.findings,
    });
  } catch (err: any) {
    await db.update(phaseStates).set({ phaseState: 'AwaitingInputs' })
      .where(and(eq(phaseStates.projectId, PROJECT_ID), eq(phaseStates.phaseId, 1 as any)));
    return NextResponse.json({ error_code: 'AGENT_FAILED', message: err.message }, { status: 500 });
  }
}
