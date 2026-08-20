import { NextResponse } from 'next/server';
import {
  recordPreviewDecision, previewGateIsOpen,
} from './decisionRecordStore';
import { assessGate, invalidateGateAssessment } from './gateAdvisoryService';
import { phaseLabel } from './evidenceAssembly';
import type { GateOutcome } from '@/shared/types/risk';

/**
 * Recording a gate decision when the database is unreachable.
 *
 * Preview mode exists so the whole flow can be demonstrated without
 * infrastructure. Before this, a gate decision in Preview mode returned a 500 —
 * which meant the single most important behaviour in the product, a human
 * overriding an AI recommendation, could not be shown or tested at all.
 *
 * The fallback enforces exactly the same rules as the state machine:
 *   • the gate must be open, and may only be decided once; and
 *   • a decision that differs from the AI recommendation must carry a rationale.
 *
 * It is explicitly not durable, and it says so in the response.
 */

/** Codes that mean the RULES rejected the decision — never retried in memory. */
export const RULE_ERROR_CODES = new Set([
  'GATE_AI_PROHIBITED',
  'INVALID_GATE_OUTCOME',
  'GATE_OUTCOME_INVALID',
  'GATE_NOT_OPEN',
  'HUMAN_RATIONALE_REQUIRED',
  'CONDITIONAL_ACTIONS_REQUIRED',
]);

interface DecideBody {
  humanRationale?: string;
  comments?: string;
  artifactVersionsReviewed?: string[];
}

export async function recordDecisionFallback(
  gateNumber: number,
  decision: GateOutcome,
  reviewerRole: string,
  body: DecideBody
): Promise<NextResponse | null> {
  // Only stand in when there is genuinely no database behind us.
  try {
    const { db } = await import('@/db');
    const { projectState } = await import('@/db/schema');
    await db.select().from(projectState).limit(1);
    // The database answered, so this was a real failure — let it surface.
    return null;
  } catch {
    // No database. Continue into the preview path.
  }

  if (!previewGateIsOpen(gateNumber)) {
    return NextResponse.json(
      {
        error_code: 'GATE_NOT_OPEN',
        message:
          `Gate ${gateNumber} is not open for a decision, or a decision has already ` +
          `been recorded for it.`,
      },
      { status: 409 }
    );
  }

  const { advisory, risk } = await assessGate(gateNumber);
  const humanRationale = (body.humanRationale ?? '').trim();

  if (
    advisory.recommendationAvailable &&
    advisory.recommendedOutcome !== decision &&
    humanRationale.length === 0
  ) {
    return NextResponse.json(
      {
        error_code: 'HUMAN_RATIONALE_REQUIRED',
        message:
          `The decision (${decision}) differs from the AI recommendation ` +
          `(${advisory.recommendedOutcome}). A short rationale is required.`,
      },
      { status: 400 }
    );
  }

  const record = recordPreviewDecision({
    gateNumber,
    phaseName: phaseLabel(gateNumber),
    decision,
    reviewerRole,
    comments: body.comments ?? '',
    humanRationale,
    advisory,
    riskScore: { score: risk.score, level: risk.level, display: risk.display },
    artifactVersionsReviewed: body.artifactVersionsReviewed ?? [],
  });

  invalidateGateAssessment(gateNumber);

  return NextResponse.json({
    success: true,
    decision,
    gateNumber,
    reviewerRole,
    preview: true,
    message:
      'Recorded in Preview mode — the database is unavailable, so this decision ' +
      'is held in memory and is not durable.',
    decisionId: record.decisionId,
    aiRecommendation: advisory.recommendedOutcome,
    divergedFromAi: record.divergedFromAi,
    riskScore: record.riskScore,
  });
}
