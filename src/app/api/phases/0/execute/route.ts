import { NextRequest, NextResponse } from 'next/server';
import { BidNoBidAgent } from '@/server/agents/phase0/bidNoBidAgent';
import { buildAgentContext } from '@/server/context/contextAssembly';
import { db } from '@/db';
import { beginPhaseExecution, recordPhaseExecutionFailure } from '@/server/orchestrator/executionFailure';
import { phaseInputs } from '@/db/schema';
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

  // Check LLM key before transitioning state (fast fail — avoids a Running→AwaitingInputs flip)
  const { getLlmKeyStatus } = await import('@/server/config/llmKeyService');
  const { configured: keyConfigured } = await getLlmKeyStatus();
  if (!keyConfigured) {
    return NextResponse.json({
      error_code: 'LLM_KEY_NOT_CONFIGURED',
      message: 'Anthropic API key is not configured. Go to Settings to add your key.',
      settings_url: '/settings',
    }, { status: 503 });
  }

  // Transition to Running and return 202 immediately — the LLM call runs in the background.
  // The client polls /api/phases/[id]/execution-status (SWR refreshInterval: 3000) and will
  // see Running → AwaitingGate without waiting for the full LLM response.
  await beginPhaseExecution(0);

  // Fire-and-forget: do NOT await this Promise — the response is already sent.
  buildAgentContext(PROJECT_ID, 0).then(context => {
    const agent = new BidNoBidAgent();
    return agent.run(context);
  }).catch((err: unknown) => recordPhaseExecutionFailure(0, err));

  return NextResponse.json({ accepted: true, phaseId: 0, message: 'Phase execution started. Poll /execution-status for progress.' }, { status: 202 });
}
