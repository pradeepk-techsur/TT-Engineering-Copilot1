import { NextRequest, NextResponse } from 'next/server';
import { GatedStateMachine } from '@/server/orchestrator/stateMachine';
import { AI_ACTOR_BLOCKLIST } from '@/server/orchestrator/types';
import { recordDecisionFallback, RULE_ERROR_CODES } from '@/server/risk/gateDecisionFallback';
import { db } from '@/db';
import { phaseStates } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  // GR-02: Human-only gate decision — AI actor prohibition
  const reviewerRole = req.headers.get('X-Reviewer-Role') ?? '';
  if (!reviewerRole || AI_ACTOR_BLOCKLIST.has(reviewerRole)) {
    return NextResponse.json({
      error_code: 'GATE_AI_PROHIBITED',
      message: 'Gate decisions must be made by an authorized human reviewer. AI cannot approve any gate.',
    }, { status: 403 });
  }

  const body = await req.json();
  const { decision, comments, conditionalActions } = body;

  // GR-03: Validate outcome
  if (!['Pass', 'Conditional Pass', 'Fail'].includes(decision)) {
    return NextResponse.json({ error_code: 'GATE_OUTCOME_INVALID', message: 'Gate outcome must be Pass, Conditional Pass, or Fail.' }, { status: 400 });
  }

  if (decision === 'Conditional Pass' && (!conditionalActions || conditionalActions.length === 0)) {
    return NextResponse.json({ error_code: 'CONDITIONAL_ACTIONS_REQUIRED', message: 'Conditional Pass requires at least one conditional action.' }, { status: 400 });
  }

  try {
    const sm = new GatedStateMachine('EVINV-POC-001');
    await sm.recordGateDecision({
      gateNumber: 2,
      decision,
      reviewerRole,
      comments,
      humanRationale: body.humanRationale,
      openConditions: conditionalActions ?? [],
    });

    // Generate compact phase summary after gate decision
    const compactSummary = {
      phaseId: 2,
      phaseName: 'Requirements Development',
      outcome: decision,
      keyFindings: ['SI-01: REQ-THERM-004 testability issue detected and corrected'],
      openActions: [],
      approvedOutputs: ['Requirements Traceability Matrix', 'Requirements Quality and Testability Report'],
      approvedAt: new Date().toISOString(),
    };

    await db.update(phaseStates)
      .set({ compactPhaseSummary: compactSummary as any })
      .where(and(eq(phaseStates.projectId, 'EVINV-POC-001'), eq(phaseStates.phaseId, 2 as any)));

    return NextResponse.json({ success: true, decision, gateNumber: 2, reviewerRole });
  } catch (err: any) {
    const code = err.message?.split(':')[0] ?? 'INTERNAL_ERROR';

    // A rule rejection is a rejection. An unreachable database is not — in
    // Preview mode the decision is recorded in the process-local store with
    // the same shape, so human gate authority stays demonstrable.
    if (!RULE_ERROR_CODES.has(code)) {
      const fallback = await recordDecisionFallback(2, decision, reviewerRole, body);
      if (fallback) return fallback;
    }
    const status = code === 'GATE_AI_PROHIBITED' ? 403
      : code === 'INVALID_GATE_OUTCOME' ? 400
      // A decision that differs from the AI recommendation and carries no
      // reason is a bad request, not a server fault.
      : code === 'HUMAN_RATIONALE_REQUIRED' ? 400
      : code === 'GATE_NOT_OPEN' ? 409
      : 500;
    return NextResponse.json({ error_code: code, message: err.message }, { status });
  }
}
