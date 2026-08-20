import { NextResponse } from 'next/server';
import { assessPhaseRisk } from '@/server/risk/gateAdvisoryService';

/**
 * The Overall Risk Score for one phase/gate, with the four drill-down lists.
 * Calculated by the application from structured rules — no LLM involved.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const phaseId = parseInt(id, 10);

  if (Number.isNaN(phaseId) || phaseId < 0 || phaseId > 9) {
    return NextResponse.json({ error_code: 'INVALID_PHASE' }, { status: 400 });
  }

  try {
    return NextResponse.json(await assessPhaseRisk(phaseId));
  } catch (err) {
    console.error(`Phase ${phaseId} risk score failed:`, err);
    return NextResponse.json({ error_code: 'RISK_UNAVAILABLE' }, { status: 500 });
  }
}
