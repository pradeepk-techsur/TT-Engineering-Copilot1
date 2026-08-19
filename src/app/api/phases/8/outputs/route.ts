import { NextResponse } from 'next/server';
import { db } from '@/db';
import { phaseOutputs, phaseStates } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET() {
  const outputs = await db.select().from(phaseOutputs)
    .where(and(eq(phaseOutputs.projectId, 'EVINV-POC-001'), eq(phaseOutputs.phaseId, 8 as any)));

  const [phase] = await db.select().from(phaseStates)
    .where(and(eq(phaseStates.projectId, 'EVINV-POC-001'), eq(phaseStates.phaseId, 8 as any)));

  // Enforce max 2 outputs (CA-03): Obsolescence Forecast + Yield/Quality Report
  if (outputs.length > 2) {
    console.error(`CA-03 VIOLATION: Phase 8 has ${outputs.length} outputs; maximum is 2`);
  }

  return NextResponse.json({
    phaseId: 8,
    phaseState: phase?.phaseState,
    gateState: phase?.gateState,
    aiRecommendation: phase?.aiRecommendation,
    outputs: outputs.slice(0, 2), // Hard limit to 2
  });
}
