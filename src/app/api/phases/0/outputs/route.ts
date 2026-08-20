import { NextResponse } from 'next/server';
import { mockPhaseOutputsResponse } from '@/lib/mockData';
import { db } from '@/db';
import { phaseOutputs, phaseStates } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const PROJECT_ID = 'EVINV-POC-001';
const PHASE = 0;

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

    // AC-03 — a phase may never present more than two outputs for approval.
    if (outputs.length > 2) {
      console.error(`AC-03 VIOLATION: Phase ${PHASE} has ${outputs.length} outputs; maximum is 2`);
    }

    return NextResponse.json({
      phaseId: PHASE,
      phaseState: phase?.phaseState,
      gateState: phase?.gateState,
      aiRecommendation: phase?.aiRecommendation,
      outputs: outputs.slice(0, 2),
    });
  } catch {
    // Preview mode: the database is unreachable. Every other route in the app
    // falls back to the synthetic sample here; these ten did not, which left
    // the Outputs panel stuck on "Could not load outputs" for the whole demo.
    return NextResponse.json(mockPhaseOutputsResponse(PHASE));
  }
}
