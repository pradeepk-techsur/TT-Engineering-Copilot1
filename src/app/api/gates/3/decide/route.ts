import { NextRequest, NextResponse } from 'next/server';
import { GatedStateMachine } from '@/server/orchestrator/stateMachine';
import { AI_ACTOR_BLOCKLIST } from '@/server/orchestrator/types';
import { recordDecisionFallback, RULE_ERROR_CODES } from '@/server/risk/gateDecisionFallback';
import { db } from '@/db';
import { phaseStates, actions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  // GR-02: Human-only gate decision
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
      gateNumber: 3,
      decision,
      reviewerRole,
      comments,
      humanRationale: body.humanRationale,
      openConditions: [],
    });

    // Create A3-001 Conditional Pass action if Conditional Pass (happy path)
    if (decision === 'Conditional Pass') {
      await db.insert(actions).values({
        actionId: 'A3-001',
        sourceFindingId: 'F3-001',
        sourcePhase: 3 as any,
        sourceGate: 3 as any,
        description: 'Revise coolant connector (CN-COOL-1) orientation in detailed design to ensure unobstructed access to J-FAST-7 through J-FAST-10. Provide revised design drawing for Phase 4 verification.',
        ownerRole: 'Design Engineer',
        blocking: true,    // Must be closed before Phase 4 Gate 4 can be passed
        parallel: true,    // Can proceed in parallel with Phase 4 work
        duePhase: 4 as any,
        dueGate: 4 as any,
        requiredClosureEvidence: 'Revised design drawing showing CN-COOL-1 reorientation with unobstructed J-FAST-7 to J-FAST-10 access verified.',
        status: 'Open',
        humanApprover: reviewerRole,
      }).onConflictDoNothing();
    }

    // Compact phase 3 summary
    await db.update(phaseStates).set({
      compactPhaseSummary: {
        phaseId: 3,
        phaseName: 'Preliminary Design',
        outcome: decision,
        keyFindings: ['F3-001: Coolant connector orientation concern'],
        openActions: decision === 'Conditional Pass' ? ['A3-001'] : [],
        approvedOutputs: ['PDR Readiness Summary', 'Early DFM/DFA Findings and Risk Register'],
        approvedAt: new Date().toISOString(),
      } as any,
    }).where(and(eq(phaseStates.projectId, 'EVINV-POC-001'), eq(phaseStates.phaseId, 3 as any)));

    return NextResponse.json({
      success: true,
      decision,
      gateNumber: 3,
      actionCreated: decision === 'Conditional Pass' ? 'A3-001' : null,
    });
  } catch (err: any) {
    const code = err.message?.split(':')[0] ?? 'INTERNAL_ERROR';

    // A rule rejection is a rejection. An unreachable database is not — in
    // Preview mode the decision is recorded in the process-local store with
    // the same shape, so human gate authority stays demonstrable.
    if (!RULE_ERROR_CODES.has(code)) {
      const fallback = await recordDecisionFallback(3, decision, reviewerRole, body);
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
