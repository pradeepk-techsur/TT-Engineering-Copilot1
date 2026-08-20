import { NextRequest, NextResponse } from 'next/server';
import { GatedStateMachine } from '@/server/orchestrator/stateMachine';
import { AI_ACTOR_BLOCKLIST } from '@/server/orchestrator/types';
import { recordDecisionFallback, RULE_ERROR_CODES } from '@/server/risk/gateDecisionFallback';
import { db } from '@/db';
import { phaseStates } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  // GR-02: Human-only gate decision — AI actor prohibition (T-06-01 mitigation)
  const reviewerRole = req.headers.get('X-Reviewer-Role') ?? '';
  if (!reviewerRole || AI_ACTOR_BLOCKLIST.has(reviewerRole)) {
    return NextResponse.json({
      error_code: 'GATE_AI_PROHIBITED',
      message: 'Gate decisions must be made by an authorized human reviewer. AI cannot approve any gate.',
    }, { status: 403 });
  }

  const body = await req.json();
  const { decision, comments } = body;

  // GR-03: Validate outcome
  if (!['Pass', 'Conditional Pass', 'Fail'].includes(decision)) {
    return NextResponse.json({ error_code: 'GATE_OUTCOME_INVALID', message: 'Gate outcome must be Pass, Conditional Pass, or Fail.' }, { status: 400 });
  }

  try {
    const sm = new GatedStateMachine('EVINV-POC-001');
    await sm.recordGateDecision({
      gateNumber: 8,
      decision,
      reviewerRole,
      comments,
      humanRationale: body.humanRationale,
      openConditions: [],
    });

    // Gate 8 Pass — explicitly initiates Phase 9 (End of Life)
    if (decision === 'Pass') {
      await db.update(phaseStates).set({ phaseState: 'AwaitingInputs', gateState: 'Locked' })
        .where(and(eq(phaseStates.projectId, 'EVINV-POC-001'), eq(phaseStates.phaseId, 9 as any)));
    }

    // Compact Phase 8 summary
    await db.update(phaseStates).set({
      compactPhaseSummary: {
        phaseId: 8,
        phaseName: 'Production & Sustaining',
        outcome: decision,
        keyFindings: ['F8-001: IGBT-HV-800-A PDN received — EOL triggered'],
        openActions: [],
        approvedOutputs: ['Obsolescence and Supply-Risk Forecast', 'Yield, Quality, and Financial-Anomaly Report'],
        approvedAt: new Date().toISOString(),
        eolTriggered: decision === 'Pass',
      } as any,
    }).where(and(eq(phaseStates.projectId, 'EVINV-POC-001'), eq(phaseStates.phaseId, 8 as any)));

    return NextResponse.json({ success: true, decision, gateNumber: 8, reviewerRole, phase9Initiated: decision === 'Pass' });
  } catch (err: any) {
    const code = err.message?.split(':')[0] ?? 'INTERNAL_ERROR';

    // A rule rejection is a rejection. An unreachable database is not — in
    // Preview mode the decision is recorded in the process-local store with
    // the same shape, so human gate authority stays demonstrable.
    if (!RULE_ERROR_CODES.has(code)) {
      const fallback = await recordDecisionFallback(8, decision, reviewerRole, body);
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
