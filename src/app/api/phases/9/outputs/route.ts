import { NextResponse } from 'next/server';
import { mockPhaseOutputsResponse } from '@/lib/mockData';
import { db } from '@/db';
import { phaseOutputs, phaseStates, projectState } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const PROJECT_ID = 'EVINV-POC-001';
const PHASE = 9;

export async function GET() {
  try {
    const outputs = await db.select().from(phaseOutputs)
      .where(and(
        eq(phaseOutputs.projectId, PROJECT_ID),
        eq(phaseOutputs.phaseId, PHASE as never),
      ));

    const [phase] = await db.select().from(phaseStates)
      .where(and(
        eq(phaseStates.projectId, PROJECT_ID),
        eq(phaseStates.phaseId, PHASE as never),
      ));

    const [project] = await db.select().from(projectState)
      .where(eq(projectState.projectId, PROJECT_ID));

    // CA-03 — EOL Decision Pack + Closure Record, and never a third.
    if (outputs.length > 2) {
      console.error(`CA-03 VIOLATION: Phase 9 has ${outputs.length} outputs; maximum is 2`);
    }

    return NextResponse.json({
      phaseId: PHASE,
      phaseState: phase?.phaseState,
      gateState: phase?.gateState,
      aiRecommendation: phase?.aiRecommendation,
      projectStatus: project?.projectStatus,
      outputs: outputs.slice(0, 2),
    });
  } catch {
    // Preview mode: see the note in the other phase outputs routes.
    return NextResponse.json({
      ...mockPhaseOutputsResponse(PHASE),
      projectStatus: 'Active',
    });
  }
}
