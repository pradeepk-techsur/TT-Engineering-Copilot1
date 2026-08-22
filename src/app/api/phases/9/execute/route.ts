import { NextRequest, NextResponse } from 'next/server';
import { EOLMemoryAgent } from '@/server/agents/phase9/eolMemoryAgent';
import { buildAgentContext } from '@/server/context/contextAssembly';
import { beginPhaseExecution, recordPhaseExecutionFailure } from '@/server/orchestrator/executionFailure';
import { readPhaseReadiness } from '@/server/orchestrator/inputReadiness';

const PROJECT_ID = 'EVINV-POC-001';

export async function POST(_req: NextRequest) {
  const readiness = await readPhaseReadiness(9);
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

  await beginPhaseExecution(9);

  buildAgentContext(PROJECT_ID, 9).then(async context => {
    const agent = new EOLMemoryAgent();
    return agent.run(context);
  }).catch((err: unknown) => recordPhaseExecutionFailure(9, err));

  return NextResponse.json({
    accepted: true, phaseId: 9,
    message: 'Phase 9 execution started. Poll /execution-status for progress.',
  }, { status: 202 });
}
