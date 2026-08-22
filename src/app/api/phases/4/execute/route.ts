import { NextRequest, NextResponse } from 'next/server';
import { DFMStandardsAgent } from '@/server/agents/phase4/dfmStandardsAgent';
import { buildAgentContext } from '@/server/context/contextAssembly';
import { beginPhaseExecution, recordPhaseExecutionFailure } from '@/server/orchestrator/executionFailure';
import { readPhaseReadiness } from '@/server/orchestrator/inputReadiness';

const PROJECT_ID = 'EVINV-POC-001';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const isRevised = body.isRevised === true;

  const readiness = await readPhaseReadiness(4);
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

  await beginPhaseExecution(4);

  buildAgentContext(PROJECT_ID, 4).then(async context => {
    const agent = new DFMStandardsAgent();
    return agent.run(context, isRevised);
  }).catch((err: unknown) => recordPhaseExecutionFailure(4, err));

  return NextResponse.json({
    accepted: true, phaseId: 4, isRevised,
    message: 'Phase execution started. Poll /execution-status for progress.',
  }, { status: 202 });
}
