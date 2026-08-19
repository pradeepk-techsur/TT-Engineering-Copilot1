import { NextRequest, NextResponse } from 'next/server';
import { EOLMemoryAgent } from '@/server/agents/phase9/eolMemoryAgent';
import { buildAgentContext } from '@/server/context/contextAssembly';
import { db } from '@/db';
import { phaseStates, phaseInputs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const PROJECT_ID = 'EVINV-POC-001';

export async function POST(_req: NextRequest) {
  const inputs = await db.select().from(phaseInputs)
    .where(and(eq(phaseInputs.projectId, PROJECT_ID), eq(phaseInputs.phaseId, 9 as any)));

  // Phase 9: external = UP (customer EOL/LTB), internal = SI (ERP/archive)
  const extReady = inputs.find(i => i.inputRole === 'external')?.readinessStatus === 'User Input Ready';
  const intReady = inputs.find(i => i.inputRole === 'internal')?.readinessStatus === 'Synthetic System Input Ready';

  if (!extReady || !intReady) {
    return NextResponse.json({ error_code: 'INPUTS_NOT_READY', message: 'Customer EOL package (upload) and archive package (ingest) must both be ready.' }, { status: 409 });
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

  await db.update(phaseStates).set({ phaseState: 'Running', executionStartedAt: new Date().toISOString() })
    .where(and(eq(phaseStates.projectId, PROJECT_ID), eq(phaseStates.phaseId, 9 as any)));

  buildAgentContext(PROJECT_ID, 9).then(async context => {
    const agent = new EOLMemoryAgent();
    return agent.run(context);
  }).catch(async (err: unknown) => {
    console.error('[phase9/execute] agent failed:', (err as Error).message);
    await db.update(phaseStates).set({ phaseState: 'AwaitingInputs' })
      .where(and(eq(phaseStates.projectId, PROJECT_ID), eq(phaseStates.phaseId, 9 as any)));
  });

  return NextResponse.json({
    accepted: true, phaseId: 9,
    message: 'Phase 9 execution started. Poll /execution-status for progress.',
  }, { status: 202 });
}
