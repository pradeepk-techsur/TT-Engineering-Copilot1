import { NextRequest, NextResponse } from 'next/server';
import { GatedStateMachine } from '@/server/orchestrator/stateMachine';
import { AI_ACTOR_BLOCKLIST } from '@/server/orchestrator/types';
import { db } from '@/db';
import { phaseStates, actions } from '@/db/schema';
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
  const { decision, comments } = body;

  // GR-03: Validate outcome
  if (!['Pass', 'Conditional Pass', 'Fail'].includes(decision)) {
    return NextResponse.json({ error_code: 'GATE_OUTCOME_INVALID', message: 'Gate outcome must be Pass, Conditional Pass, or Fail.' }, { status: 400 });
  }

  // For Pass at Gate 4, verify A3-001 is closed (blocking action from Phase 3)
  if (decision === 'Pass') {
    const [a3001] = await db.select().from(actions).where(eq(actions.actionId, 'A3-001'));
    if (a3001 && a3001.blocking && a3001.status !== 'VerifiedClosed') {
      return NextResponse.json({
        error_code: 'BLOCKING_ACTIONS_OPEN',
        message: 'Gate 4 Pass requires A3-001 (coolant connector orientation) to be VerifiedClosed. Current status: ' + a3001.status,
        openBlockingActions: ['A3-001'],
      }, { status: 409 });
    }
  }

  try {
    const sm = new GatedStateMachine('EVINV-POC-001');
    await sm.recordGateDecision({
      gateNumber: 4,
      decision,
      reviewerRole,
      comments,
      openConditions: [],
    });

    // Compact phase 4 summary with A3-001 verified closed status
    const [a3001] = await db.select().from(actions).where(eq(actions.actionId, 'A3-001'));
    await db.update(phaseStates).set({
      compactPhaseSummary: {
        phaseId: 4,
        phaseName: 'Detailed Design CDR',
        outcome: decision,
        keyFindings: ['F4-001: VBUS+ clearance (SI-03a)', 'F4-002: C_BULK_3 derating (SI-03b)', 'F4-003: DIAG_TEMP test point (SI-03c)', 'F4-004: C_HV_1 footprint (SI-03d)'],
        openActions: [],
        a3001Status: a3001?.status ?? 'Unknown',
        approvedOutputs: ['DFM and Standards Audit', 'BOM Health and Manufacturability Report'],
        approvedAt: new Date().toISOString(),
      } as any,
    }).where(and(eq(phaseStates.projectId, 'EVINV-POC-001'), eq(phaseStates.phaseId, 4 as any)));

    return NextResponse.json({ success: true, decision, gateNumber: 4, reviewerRole });
  } catch (err: any) {
    const code = err.message?.split(':')[0] ?? 'INTERNAL_ERROR';
    const status = code === 'GATE_AI_PROHIBITED' ? 403
      : code === 'INVALID_GATE_OUTCOME' ? 400
      : code === 'GATE_NOT_OPEN' ? 409
      : 500;
    return NextResponse.json({ error_code: code, message: err.message }, { status });
  }
}
