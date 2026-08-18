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

  await db.update(phaseStates).set({ phaseState: 'Running', executionStartedAt: new Date().toISOString() })
    .where(and(eq(phaseStates.projectId, PROJECT_ID), eq(phaseStates.phaseId, 2 as any)));

  try {
    const context = await buildAgentContext(PROJECT_ID, 2);
    const agent = new RequirementsAgent();
    const result = await agent.run(context, isRevised);

    return NextResponse.json({
      success: true, phaseId: 2, isRevised,
      outputs: result.outputs, aiRecommendation: result.aiRecommendation,
      findings: result.findings,
      seededIssueDetected: result.findings.some(f => f.seeded && f.findingId.includes('F2-001')),
    });
  } catch (err: unknown) {
    const e = err as NodeJS.ErrnoException;
    await db.update(phaseStates).set({ phaseState: 'AwaitingInputs' })
      .where(and(eq(phaseStates.projectId, PROJECT_ID), eq(phaseStates.phaseId, 2 as any)));
    if (e.code === 'LLM_KEY_NOT_CONFIGURED') {
      return NextResponse.json({ error_code: 'LLM_KEY_NOT_CONFIGURED', message: e.message, settings_url: '/settings' }, { status: 503 });
    }
    return NextResponse.json({ error_code: 'AGENT_FAILED', message: (err as Error).message }, { status: 500 });
  }
}
