import { NextRequest, NextResponse } from 'next/server';
import { PDRAgent } from '@/server/agents/phase3/pdrAgent';
import { buildAgentContext } from '@/server/context/contextAssembly';
import { beginPhaseExecution, recordPhaseExecutionFailure } from '@/server/orchestrator/executionFailure';
import { readPhaseReadiness } from '@/server/orchestrator/inputReadiness';

const PROJECT_ID = 'EVINV-POC-001';

export async function POST(_req: NextRequest) {
  const readiness = await readPhaseReadiness(3);
  if (!readiness.ready) {
    return NextResponse.json({
      error_code: 'INPUTS_NOT_READY',
      message: readiness.message,
      inputs: readiness.inputs,
    }, { status: 409 });
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
