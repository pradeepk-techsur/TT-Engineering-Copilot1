import { NextRequest, NextResponse } from 'next/server';
import { RequirementsAgent } from '@/server/agents/phase2/requirementsAgent';
import { buildAgentContext } from '@/server/context/contextAssembly';
import { db } from '@/db';
import { phaseStates, phaseInputs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const PROJECT_ID = 'EVINV-POC-001';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const isRevised = body.isRevised === true;  // True when called after correction

  const inputs = await db.select().from(phaseInputs)
    .where(and(eq(phaseInputs.projectId, PROJECT_ID), eq(phaseInputs.phaseId, 2 as any)));

  const extReady = inputs.find(i => i.inputRole === 'external')?.readinessStatus === 'User Input Ready';
  const intReady = inputs.find(i => i.inputRole === 'internal')?.readinessStatus === 'Synthetic System Input Ready';

  if (!extReady || !intReady) {
    return NextResponse.json({ error_code: 'INPUTS_NOT_READY' }, { status: 409 });
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
  await db.update(phaseStates).set({ phaseState: 'Running', executionStartedAt: new Date().toISOString() })
    .where(and(eq(phaseStates.projectId, PROJECT_ID), eq(phaseStates.phaseId, 2 as any)));

  buildAgentContext(PROJECT_ID, 2).then(async context => {
    const agent = new RequirementsAgent();
    return agent.run(context, isRevised);
  }).catch(async (err: unknown) => {
    console.error('[phase2/execute] agent failed:', (err as Error).message);
    await db.update(phaseStates).set({ phaseState: 'AwaitingInputs' })
      .where(and(eq(phaseStates.projectId, PROJECT_ID), eq(phaseStates.phaseId, 2 as any)));
  });

  return NextResponse.json({ accepted: true, phaseId: 2, isRevised, message: 'Phase execution started. Poll /execution-status for progress.' }, { status: 202 });
}
