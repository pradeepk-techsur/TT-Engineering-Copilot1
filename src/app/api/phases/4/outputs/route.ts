import { NextResponse } from 'next/server';
import { db } from '@/db';
import { phaseOutputs, phaseStates } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET() {
  const outputs = await db.select().from(phaseOutputs)
    .where(and(eq(phaseOutputs.projectId, 'EVINV-POC-001'), eq(phaseOutputs.phaseId, 4 as any)));

  const [phase] = await db.select().from(phaseStates)
    .where(and(eq(phaseStates.projectId, 'EVINV-POC-001'), eq(phaseStates.phaseId, 4 as any)));

  // Enforce max 2 outputs (AC-03)
  if (outputs.length > 2) {
    console.error(`AC-03 VIOLATION: Phase 4 has ${outputs.length} outputs; maximum is 2`);
  }

  return NextResponse.json({
    phaseId: 4,
    phaseState: phase?.phaseState,
    gateState: phase?.gateState,
    aiRecommendation: phase?.aiRecommendation,
    outputs: outputs.slice(0, 2),  // Hard limit to 2
  });
}
