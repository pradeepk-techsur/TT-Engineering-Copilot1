/**
 * Whether a phase may run — decided from the artifacts, not from a label.
 *
 * Every execute route used to answer this by reading one text column:
 *
 *   inputs.find(i => i.inputRole === 'internal')
 *         ?.readinessStatus === 'User Input Ready'
 *
 * `phase_inputs.readiness_status` is a plain string, and nothing in that check
 * asks whether a file exists behind it. Anything that writes the string gets a
 * phase that will run: the intake handlers write it after storing an artifact,
 * but so did the Phase 3 seed, which wrote it for two inputs that had no
 * version and no artifact at all. Phase 3 then executed on a Preliminary Design
 * Package nobody had uploaded, which is the silent synthetic substitution for
 * missing user input the FRD prohibits — and it defeated the 409 by pre-seeding
 * the very string the 409 inspects.
 *
 * So readiness is now the artifact: an active `input_versions` row carrying an
 * `artifact_id`, for both of the phase's inputs. The status column is still
 * checked, because it is what the intake handlers use to record a validation
 * failure, but it can no longer be the whole answer.
 *
 * Which status counts as ready comes from the phase config rather than being
 * repeated per route — the intake behavior of a given input is declared in one
 * place, and the ten copies had already drifted into ten slightly different
 * spellings of the same rule.
 */

import { db } from '@/db';
import { phaseInputs, inputVersions } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { PROJECT_ID } from '@/db/baseline';
import { PHASE_CONFIG_MAP } from '@/shared/constants/phaseConfig';

/** The readiness status each intake behavior writes once its artifact is stored. */
export const READY_STATUS: Record<'UP' | 'SI', string> = {
  UP: 'User Input Ready',
  SI: 'Synthetic System Input Ready',
};

export type InputRole = 'external' | 'internal';

/** Why one input is not ready. `null` when it is. */
export type NotReadyReason =
  | 'MISSING'          // no phase_inputs row — intake has not been attempted
  | 'NOT_VALIDATED'    // row exists but its status is not the ready status
  | 'NO_ARTIFACT';     // status says ready, but no active version holds an artifact

export interface InputReadiness {
  role: InputRole;
  logicalName: string;
  behavior: 'UP' | 'SI';
  ready: boolean;
  reason: NotReadyReason | null;
}

export interface PhaseReadiness {
  ready: boolean;
  inputs: InputReadiness[];
  /** A sentence naming what is outstanding, for the 409 body. */
  message: string;
}

/** What the user has to do about a given reason, phrased for the intake behavior. */
function outstanding(input: InputReadiness): string {
  const action = input.behavior === 'UP' ? 'must be uploaded' : 'must be ingested';
  switch (input.reason) {
    case 'MISSING':
      return `${input.logicalName} ${action}`;
    case 'NOT_VALIDATED':
      return `${input.logicalName} has not passed validation`;
    case 'NO_ARTIFACT':
      // The state the Phase 3 seed produced: marked ready, nothing behind it.
      return `${input.logicalName} is marked ready but has no stored artifact`;
    default:
      return input.logicalName;
  }
}

/**
 * Resolve both of a phase's inputs against what is actually stored.
 *
 * Throws whatever the database throws — the execute routes have no mock
 * fallback and a phase that cannot be read is not a phase that may run.
 */
export async function readPhaseReadiness(phaseId: number): Promise<PhaseReadiness> {
  const config = PHASE_CONFIG_MAP[phaseId as keyof typeof PHASE_CONFIG_MAP];
  if (!config) {
    return {
      ready: false,
      inputs: [],
      message: `Phase ${phaseId} is not part of this lifecycle.`,
    };
  }

  const rows = await db.select().from(phaseInputs)
    .where(and(eq(phaseInputs.projectId, PROJECT_ID), eq(phaseInputs.phaseId, phaseId as never)));

  const resolve = async (role: InputRole): Promise<InputReadiness> => {
    const intake = role === 'external' ? config.externalIntake : config.internalIntake;
    const behavior = intake.behavior as 'UP' | 'SI';
    const base = { role, logicalName: intake.logicalName, behavior };

    const row = rows.find(r => r.inputRole === role);
    if (!row) return { ...base, ready: false, reason: 'MISSING' };

    if (row.readinessStatus !== READY_STATUS[behavior]) {
      return { ...base, ready: false, reason: 'NOT_VALIDATED' };
    }

    // The check the status column cannot make for itself.
    const [active] = await db.select().from(inputVersions)
      .where(and(eq(inputVersions.inputId, row.inputId), eq(inputVersions.active, true)));

    if (!active?.artifactId) {
      return { ...base, ready: false, reason: 'NO_ARTIFACT' };
    }

    return { ...base, ready: true, reason: null };
  };

  const inputs = await Promise.all([resolve('external'), resolve('internal')]);
  const blocked = inputs.filter(i => !i.ready);

  return {
    ready: blocked.length === 0,
    inputs,
    message: blocked.length === 0
      ? 'Both inputs are ready.'
      : `Both inputs must be ready before phase execution. Outstanding: ${
          blocked.map(outstanding).join('; ')}.`,
  };
}
