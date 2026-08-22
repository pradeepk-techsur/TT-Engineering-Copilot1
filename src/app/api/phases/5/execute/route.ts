import { NextRequest, NextResponse } from 'next/server';
import { VVAgent } from '@/server/agents/phase5/vvAgent';
import { buildAgentContext } from '@/server/context/contextAssembly';
import { beginPhaseExecution, recordPhaseExecutionFailure } from '@/server/orchestrator/executionFailure';
import { readPhaseReadiness } from '@/server/orchestrator/inputReadiness';

const PROJECT_ID = 'EVINV-POC-001';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const isRevised = body.isRevised === true;

  const readiness = await readPhaseReadiness(5);
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
