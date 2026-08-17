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

  // Guard: already running or complete (allow re-run when isRevised=true on a completed phase)
  const [current] = await db.select().from(phaseStates)
    .where(and(eq(phaseStates.projectId, PROJECT_ID), eq(phaseStates.phaseId, 2 as any)));
  if (current?.phaseState === 'Running') {
    return NextResponse.json({ accepted: true, phaseId: 2, status: 'Processing', message: 'Phase execution already in progress.' }, { status: 202 });
  }

  await db.update(phaseStates).set({ phaseState: 'Running', executionStartedAt: new Date().toISOString() })
    .where(and(eq(phaseStates.projectId, PROJECT_ID), eq(phaseStates.phaseId, 2 as any)));

  setImmediate(async () => {
    try {
      const context = await buildAgentContext(PROJECT_ID, 2);
      const agent = new RequirementsAgent();
      await agent.run(context, isRevised);
      await db.update(phaseStates)
        .set({ executionCompletedAt: new Date().toISOString() } as any)
        .where(and(eq(phaseStates.projectId, PROJECT_ID), eq(phaseStates.phaseId, 2 as any)));
    } catch (_err) {
      await db.update(phaseStates).set({ phaseState: 'AwaitingInputs' })
        .where(and(eq(phaseStates.projectId, PROJECT_ID), eq(phaseStates.phaseId, 2 as any)));
    }
  });

  return NextResponse.json({ accepted: true, phaseId: 2, status: 'Processing', isRevised }, { status: 202 });
}
