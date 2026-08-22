import { NextRequest, NextResponse } from 'next/server';
import { MRLPPAPAgent } from '@/server/agents/phase6/mrlPpapAgent';
import { buildAgentContext } from '@/server/context/contextAssembly';
import { beginPhaseExecution, recordPhaseExecutionFailure } from '@/server/orchestrator/executionFailure';
import { readPhaseReadiness } from '@/server/orchestrator/inputReadiness';

const PROJECT_ID = 'EVINV-POC-001';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const isRevised = body.isRevised === true;

  const readiness = await readPhaseReadiness(6);
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

  await beginPhaseExecution(6);

  buildAgentContext(PROJECT_ID, 6).then(async context => {
    const agent = new MRLPPAPAgent();
    return agent.run(context, isRevised);
  }).catch((err: unknown) => recordPhaseExecutionFailure(6, err));

  return NextResponse.json({
    accepted: true, phaseId: 6, isRevised,
    message: 'Phase execution started. Poll /execution-status for progress.',
  }, { status: 202 });
}
