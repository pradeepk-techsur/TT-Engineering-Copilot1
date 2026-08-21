import { NextRequest, NextResponse } from 'next/server';
import { VVAgent } from '@/server/agents/phase5/vvAgent';
import { buildAgentContext } from '@/server/context/contextAssembly';
import { db } from '@/db';
import { beginPhaseExecution, recordPhaseExecutionFailure } from '@/server/orchestrator/executionFailure';
import { phaseInputs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const PROJECT_ID = 'EVINV-POC-001';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const isRevised = body.isRevised === true;

  const inputs = await db.select().from(phaseInputs)
    .where(and(eq(phaseInputs.projectId, PROJECT_ID), eq(phaseInputs.phaseId, 5 as any)));

  // Phase 5: external = SI (test methods/standards), internal = UP (validation evidence package)
  const extReady = inputs.find(i => i.inputRole === 'external')?.readinessStatus === 'Synthetic System Input Ready';
  const intReady = inputs.find(i => i.inputRole === 'internal')?.readinessStatus === 'User Input Ready';

  if (!extReady || !intReady) {
    return NextResponse.json({ error_code: 'INPUTS_NOT_READY', message: 'Both inputs must be ready before phase execution.' }, { status: 409 });
  }

  // Fast-fail if LLM key not configured
  const { getLlmKeyStatus } = await import('@/server/config/llmKeyService');
  const { configured: keyConfigured } = await getLlmKeyStatus();
  if (!keyConfigured) {
    return NextResponse.json({
      error_code: 'LLM_KEY_NOT_CONFIGURED',
      message: 'Anthropic API key is not configured. Go to Settings to add your key.',
      settings_url: '/settings',
    }, { status: 503 });
  }

  await beginPhaseExecution(5);

  buildAgentContext(PROJECT_ID, 5).then(async context => {
    const agent = new VVAgent();
    return agent.run(context, isRevised);
  }).catch((err: unknown) => recordPhaseExecutionFailure(5, err));

  return NextResponse.json({
    accepted: true, phaseId: 5, isRevised,
    message: 'Phase execution started. Poll /execution-status for progress.',
  }, { status: 202 });
}
