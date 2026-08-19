import { NextResponse } from 'next/server';
import { db } from '@/db';
import { phaseOutputs, phaseStates, projectState } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET() {
  const outputs = await db.select().from(phaseOutputs)
    .where(and(eq(phaseOutputs.projectId, 'EVINV-POC-001'), eq(phaseOutputs.phaseId, 9 as any)));

  const [phase] = await db.select().from(phaseStates)
    .where(and(eq(phaseStates.projectId, 'EVINV-POC-001'), eq(phaseStates.phaseId, 9 as any)));

  const [project] = await db.select().from(projectState)
    .where(eq(projectState.projectId, 'EVINV-POC-001'));

  // Enforce max 2 outputs (CA-03): EOL Decision Pack + Closure Record
  if (outputs.length > 2) {
    console.error(`CA-03 VIOLATION: Phase 9 has ${outputs.length} outputs; maximum is 2`);
  }

  return NextResponse.json({
    phaseId: 9,
    phaseState: phase?.phaseState,
    gateState: phase?.gateState,
    aiRecommendation: phase?.aiRecommendation,
    projectStatus: project?.projectStatus,
    outputs: outputs.slice(0, 2), // Hard limit to 2
  });
}
