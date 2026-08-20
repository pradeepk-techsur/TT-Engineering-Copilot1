import { NextResponse } from 'next/server';
import { assessPhaseRisk } from '@/server/risk/gateAdvisoryService';
import type { RiskScore } from '@/shared/types/risk';

/**
 * One risk score per phase, for the Product Lifecycle View. Phases that have
 * not started come back `assessed: false` — the lifecycle shows an indicator
 * only beside active or completed phases.
 */
export async function GET() {
  try {
    const scores = await Promise.all(
      Array.from({ length: 10 }, (_, phaseId) => assessPhaseRisk(phaseId))
    );

    const byPhase: Record<number, RiskScore> = {};
    for (const score of scores) byPhase[score.phaseId] = score;

    return NextResponse.json({ phases: scores, byPhase });
  } catch (err) {
    console.error('Lifecycle risk scores failed:', err);
    return NextResponse.json({ error_code: 'RISK_UNAVAILABLE', phases: [] }, { status: 500 });
  }
}
