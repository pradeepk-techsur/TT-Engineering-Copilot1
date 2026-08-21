import { NextRequest, NextResponse } from 'next/server';
import { startNewCycle } from '@/server/cycle/newCycle';

/**
 * POST /api/project/new-cycle — start a new cycle.
 *
 * Clears the uploaded inputs, the generated outputs and the run state, and puts
 * the lifecycle back at Phase 0. Requires `{ "confirm": true }` in the body:
 * this deletes the current cycle, so it should never be reachable by accident
 * from a mistyped fetch or a link prefetch.
 */
export async function POST(req: NextRequest) {
  let confirmed = false;
  try {
    const body = await req.json();
    confirmed = (body as { confirm?: unknown } | null)?.confirm === true;
  } catch {
    // No body, or not JSON — treated as unconfirmed.
  }

  if (!confirmed) {
    return NextResponse.json(
      {
        error_code: 'NEW_CYCLE_NOT_CONFIRMED',
        message: 'Send { "confirm": true } to start a new cycle.',
      },
      { status: 400 }
    );
  }

  try {
    const summary = await startNewCycle();
    return NextResponse.json(summary);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'New cycle failed';
    console.error('[project/new-cycle]', message);
    return NextResponse.json({ error_code: 'NEW_CYCLE_FAILED', message }, { status: 500 });
  }
}
