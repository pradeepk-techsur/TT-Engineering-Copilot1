import { NextRequest, NextResponse } from 'next/server';
import { RequirementsAgent } from '@/server/agents/phase2/requirementsAgent';
import { buildAgentContext } from '@/server/context/contextAssembly';
import { beginPhaseExecution, recordPhaseExecutionFailure } from '@/server/orchestrator/executionFailure';
import { readPhaseReadiness } from '@/server/orchestrator/inputReadiness';

const PROJECT_ID = 'EVINV-POC-001';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const isRevised = body.isRevised === true;  // True when called after correction

  const readiness = await readPhaseReadiness(2);
  if (!readiness.ready) {
    return NextResponse.json({
      error_code: 'INPUTS_NOT_READY',
      message: readiness.message,
      inputs: readiness.inputs,
    }, { status: 409 });
  }

  // Fast-fail if LLM key not configured — before transitioning state
  const { getLlmKeyStatus } = await import('@/server/config/llmKeyService');
  const { configured: keyConfigured } = await getLlmKeyStatus();
  if (!keyConfigured) {
    return NextResponse.json({
      error_code: 'LLM_KEY_NOT_CONFIGURED',
      message: 'Anthropic API key is not configured. Go to Settings to add your key.',
      settings_url: '/settings',
    }, { status: 503 });
  }

  // Transition to Running and return 202 immediately — LLM runs in background.
  await beginPhaseExecution(2);

  buildAgentContext(PROJECT_ID, 2).then(async context => {
    const agent = new RequirementsAgent();
    return agent.run(context, isRevised);
  }).catch((err: unknown) => recordPhaseExecutionFailure(2, err));

  return NextResponse.json({ accepted: true, phaseId: 2, isRevised, message: 'Phase execution started. Poll /execution-status for progress.' }, { status: 202 });
}
