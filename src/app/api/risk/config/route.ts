import { NextResponse } from 'next/server';
import { resolveRiskScoringConfig, riskBands } from '@/shared/config/riskScoringConfig';
import { MANDATORY_CHECKS, GATE_CRITERIA } from '@/shared/config/gateCriteria';

/**
 * The effective scoring rules. Exposed so the configuration is auditable —
 * a reviewer can confirm which weights and thresholds produced a score without
 * the weighting arithmetic cluttering the primary screen.
 */
export async function GET() {
  const config = resolveRiskScoringConfig();
  return NextResponse.json({
    cap: config.cap,
    weights: config.weights,
    bands: riskBands(config),
    resolvedStatuses: config.resolvedStatuses,
    countInputEvidenceOnlyBeforeExecution: config.countInputEvidenceOnlyBeforeExecution,
    mandatoryChecks: MANDATORY_CHECKS,
    gateCriteria: GATE_CRITERIA,
    overriddenByEnvironment: !!process.env.RISK_SCORING_CONFIG,
    calculatedBy: 'application (structured rules) — never the LLM',
  });
}
