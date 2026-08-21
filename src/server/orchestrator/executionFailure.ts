/**
 * What happens to a phase run that fails after the route has already answered.
 *
 * `POST /api/phases/N/execute` returns 202 as soon as it has transitioned the
 * phase to Running — the agent then runs in the background, long after the
 * response has gone. When that background work threw, every route did the same
 * two things: log the message to the server console, and roll the phase back to
 * AwaitingInputs. Nothing reached the browser. The run bar polled
 * `/execution-status`, saw a phase with both inputs ready, and rendered "Ready
 * to Run" — the exact state it shows for a phase that was never run at all.
 *
 * So a failed run and an un-started run looked identical, and the only record
 * of the difference was in a terminal nobody had open. That is how "the outputs
 * are not being generated" gets reported with no other detail: the screen had
 * none to give.
 *
 * The failure is recorded on the phase row so the next poll can carry it to the
 * screen, and appended to the audit trail because a run that failed is part of
 * what happened to this project.
 */

import { db } from '@/db';
import { phaseStates, auditHistory } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { PROJECT_ID } from '@/db/baseline';

/** The shape stored in `phase_states.execution_error`. */
export interface PhaseExecutionError {
  message: string;
  /** Set when the thrown error carried a code (e.g. LLM_KEY_NOT_CONFIGURED). */
  code: string | null;
  at: string;
}

/**
 * Anthropic returns its failures as JSON in the message — a whole envelope of
 * `{"type":"error","error":{"type":...,"message":...}}`. Shown raw it buries
 * the one sentence a reader needs, so pull that sentence out when it is there
 * and otherwise leave the message alone.
 */
export function readableFailure(err: unknown): { message: string; code: string | null } {
  const raw = err instanceof Error ? err.message : String(err);
  const code = (err as NodeJS.ErrnoException)?.code ?? null;

  const jsonStart = raw.indexOf('{');
  if (jsonStart !== -1) {
    try {
      const parsed = JSON.parse(raw.slice(jsonStart));
      const inner = parsed?.error?.message ?? parsed?.message;
      if (typeof inner === 'string' && inner.length > 0) {
        // Keep any leading HTTP status ("400 {...}") — it tells you whether to
        // retry or to go and change something.
        const prefix = raw.slice(0, jsonStart).trim();
        return { message: prefix ? `${prefix} ${inner}` : inner, code: parsed?.error?.type ?? code };
      }
    } catch {
      // Not JSON after all — fall through and use the message as thrown.
    }
  }
  return { message: raw, code };
}

/**
 * Mark a phase as running and clear any failure from the previous attempt.
 * Retrying is how a user responds to a failure, so the old message must not
 * outlive the run that replaces it.
 */
export async function beginPhaseExecution(phaseId: number): Promise<void> {
  await db.update(phaseStates)
    .set({
      phaseState: 'Running',
      executionStartedAt: new Date().toISOString(),
      executionError: null,
    })
    .where(and(
      eq(phaseStates.projectId, PROJECT_ID),
      eq(phaseStates.phaseId, phaseId as never),
    ));
}

/**
 * Roll the phase back and keep the reason. `fallbackState` exists because not
 * every phase returns to the same place: most go back to AwaitingInputs, and a
 * caller that knows better can say so.
 */
export async function recordPhaseExecutionFailure(
  phaseId: number,
  err: unknown,
  fallbackState: string = 'AwaitingInputs'
): Promise<PhaseExecutionError> {
  const { message, code } = readableFailure(err);
  const failure: PhaseExecutionError = { message, code, at: new Date().toISOString() };

  console.error(`[phase${phaseId}/execute] agent failed:`, message);

  await db.update(phaseStates)
    .set({ phaseState: fallbackState, executionError: failure })
    .where(and(
      eq(phaseStates.projectId, PROJECT_ID),
      eq(phaseStates.phaseId, phaseId as never),
    ));

  // Append-only by trigger, so this is an insert and never an update. A failed
  // run is a real event in the project's history, not just a transient.
  await db.insert(auditHistory).values({
    eventType: 'PhaseExecutionFailed',
    phaseId: phaseId as never,
    description: `Phase ${phaseId} run failed: ${message}`,
    actor: 'system',
    relatedIds: [],
    payload: failure as never,
  });

  return failure;
}
