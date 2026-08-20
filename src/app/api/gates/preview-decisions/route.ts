import { NextResponse } from 'next/server';
import { clearPreviewDecisions, previewDecisionsFor } from '@/server/risk/decisionRecordStore';
import { invalidateGateAssessment } from '@/server/risk/gateAdvisoryService';

/**
 * The Preview-mode decision store.
 *
 * Only reachable when there is no database. A recorded gate decision is
 * immutable by design, so this must never be able to touch a real one — the
 * guard below is a hard precondition, not a convenience.
 *
 * GET lists what Preview mode currently holds. DELETE clears it, which is what
 * makes the demo (and the acceptance suite) repeatable without a restart.
 */
async function databaseIsReachable(): Promise<boolean> {
  try {
    const { db } = await import('@/db');
    const { projectState } = await import('@/db/schema');
    await db.select().from(projectState).limit(1);
    return true;
  } catch {
    return false;
  }
}

const REFUSED = {
  error_code: 'NOT_PREVIEW_MODE',
  message:
    'A database is available, so gate decisions are durable and immutable. ' +
    'This endpoint only ever touches the in-memory Preview store.',
};

export async function GET() {
  if (await databaseIsReachable()) {
    return NextResponse.json(REFUSED, { status: 409 });
  }
  const decisions = Array.from({ length: 10 }, (_, gate) => previewDecisionsFor(gate)).flat();
  return NextResponse.json({ preview: true, count: decisions.length, decisions });
}

export async function DELETE() {
  if (await databaseIsReachable()) {
    return NextResponse.json(REFUSED, { status: 409 });
  }
  clearPreviewDecisions();
  invalidateGateAssessment();
  return NextResponse.json({
    preview: true,
    cleared: true,
    message: 'Preview-mode gate decisions cleared. No durable record was touched.',
  });
}
