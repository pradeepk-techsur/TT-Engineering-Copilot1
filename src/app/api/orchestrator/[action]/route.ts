import { NextRequest, NextResponse } from 'next/server';
import { GatedStateMachine } from '@/server/orchestrator/stateMachine';
import { AI_ACTOR_BLOCKLIST } from '@/server/orchestrator/types';

const PROJECT_ID = 'EVINV-POC-001';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params;
  const sm = new GatedStateMachine(PROJECT_ID);

  try {
    switch (action) {
      case 'gate-decide': {
        // CRITICAL: check X-Reviewer-Role before any processing
        const reviewerRole = req.headers.get('X-Reviewer-Role') ?? '';
        if (!reviewerRole || AI_ACTOR_BLOCKLIST.has(reviewerRole)) {
          return NextResponse.json(
            {
              error_code: 'GATE_AI_PROHIBITED',
              message: 'Gate decisions require a human reviewer role. AI actors are prohibited.',
            },
            { status: 403 }
          );
        }
        const body = await req.json();
        await sm.recordGateDecision({ ...body, reviewerRole });
        return NextResponse.json({ success: true });
      }
      case 'pause':
        await sm.pause();
        return NextResponse.json({ success: true });
      case 'resume':
        await sm.resume();
        return NextResponse.json({ success: true });
      case 'cancel':
        await sm.cancel();
        return NextResponse.json({ success: true });
      case 'retry':
        await sm.retry();
        return NextResponse.json({ success: true });
      case 'run-to-gate': {
        const { targetGate } = await req.json();
        await sm.runToGate(targetGate);
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ error_code: 'UNKNOWN_ACTION' }, { status: 400 });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    const errorCode = message.split(':')[0] ?? 'INTERNAL_ERROR';
    const status = errorCode === 'GATE_AI_PROHIBITED' ? 403
      : errorCode === 'INVALID_GATE_OUTCOME' ? 400
      : errorCode === 'GATE_NOT_OPEN' ? 409
      : 500;
    return NextResponse.json({ error_code: errorCode, message }, { status });
  }
}
