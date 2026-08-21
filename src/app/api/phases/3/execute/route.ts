import { NextRequest, NextResponse } from 'next/server';
import { PDRAgent } from '@/server/agents/phase3/pdrAgent';
import { buildAgentContext } from '@/server/context/contextAssembly';
import { db } from '@/db';
import { beginPhaseExecution, recordPhaseExecutionFailure } from '@/server/orchestrator/executionFailure';
import { phaseInputs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const PROJECT_ID = 'EVINV-POC-001';

export async function POST(_req: NextRequest) {
  const inputs = await db.select().from(phaseInputs)
    .where(and(eq(phaseInputs.projectId, PROJECT_ID), eq(phaseInputs.phaseId, 3 as any)));

  // Phase 3: external = SI (standards library / Synthetic System Input Ready), internal = UP (preliminary design / User Input Ready)
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

  await beginPhaseExecution(3);

  buildAgentContext(PROJECT_ID, 3).then(async context => {
    const agent = new PDRAgent();
    return agent.run(context);
  }).catch((err: unknown) => recordPhaseExecutionFailure(3, err));

  return NextResponse.json({ accepted: true, phaseId: 3, message: 'Phase execution started. Poll /execution-status for progress.' }, { status: 202 });
}
