/**
 * New cycle — return the project to its freshly seeded state so the lifecycle
 * can be run again from Phase 0.
 *
 * A completed cycle leaves three kinds of residue behind, and clearing only one
 * of them looks worse than clearing none: the uploaded and generated files on
 * disk, the database rows that point at them, and the process-local caches that
 * hold a computed advisory. All three go here, in that order of care — the
 * database work is one transaction, so a new cycle either lands completely or
 * not at all.
 *
 * Two things deliberately survive:
 *  - the LLM API key (`llm_key_config`) — wiping it would make "new cycle"
 *    mean "go and paste your key in again";
 *  - `audit_history`, which the database enforces as append-only via a trigger.
 *    DELETE there raises, so a new cycle appends a `NewCycle` event instead.
 *    The history of the cycle that was cleared stays readable, which is the
 *    point of an audit trail.
 */

import { existsSync, readdirSync, rmSync, statSync } from 'fs';
import path from 'path';
import {
  PHASE_IDS,
  PROJECT_BASELINE,
  PROJECT_ID,
  baselinePhaseState,
} from '@/db/baseline';
import { clearPreviewDecisions } from '@/server/risk/decisionRecordStore';
import { invalidateGateAssessment } from '@/server/risk/gateAdvisoryService';

/**
 * The directories a cycle writes into: `uploads/<projectId>` for user files,
 * `outputs/<projectId>` for agent artifacts. `public/samples` is NOT one of
 * them — those are the shipped synthetic samples every SI intake reads, and
 * deleting them would break the app rather than reset it.
 */
const RUN_DIRS = ['uploads', 'outputs'] as const;
type RunDir = (typeof RUN_DIRS)[number];

/**
 * Project ids that are safe to use as a path segment. The leading character
 * must be alphanumeric, which is what rules out `.` and `..` — both of which
 * are otherwise spelled entirely from allowed characters.
 */
const SAFE_PROJECT_ID = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

export interface NewCycleSummary {
  projectId: string;
  /** Files deleted, per run directory. */
  filesRemoved: Record<RunDir, number>;
  /** 'reset' when the database was updated; 'unavailable' in Preview mode. */
  database: 'reset' | 'unavailable';
  /** Rows deleted, per table. Empty when the database was unavailable. */
  rowsDeleted: Record<string, number>;
  at: string;
}

/** Every file under `dir`, counted recursively. Missing dir counts as zero. */
function countFiles(dir: string): number {
  if (!existsSync(dir)) return 0;
  let total = 0;
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    total += statSync(full).isDirectory() ? countFiles(full) : 1;
  }
  return total;
}

/**
 * Delete the uploaded inputs and generated outputs for one project.
 *
 * `root` is injectable so this is testable without pointing it at the real
 * working tree — a delete that resolves against `process.cwd()` is not
 * something to discover the behaviour of by running the test suite.
 */
export function clearRunFiles(
  projectId: string = PROJECT_ID,
  root: string = process.cwd()
): Record<RunDir, number> {
  if (!SAFE_PROJECT_ID.test(projectId)) {
    throw new Error(`UNSAFE_PROJECT_ID: ${projectId} is not usable as a path segment`);
  }

  const removed = {} as Record<RunDir, number>;

  for (const dirName of RUN_DIRS) {
    const base = path.resolve(root, dirName);
    const target = path.resolve(base, projectId);

    // Belt and braces on top of the id check: nothing outside uploads/ or
    // outputs/ is ever a candidate for deletion.
    if (target === base || !target.startsWith(base + path.sep)) {
      throw new Error(`UNSAFE_RUN_PATH: ${target} is not inside ${base}`);
    }

    removed[dirName] = countFiles(target);
    rmSync(target, { recursive: true, force: true });
  }

  return removed;
}

/**
 * Clear the cycle and put the skeleton rows back at their baseline.
 *
 * Deletes run from the leaves inward, which is what the foreign keys require:
 * actions → findings → check_results, and phase_outputs before the artifacts
 * it references. `phase_states` and `project_state` are updated rather than
 * deleted — the whole app reads them, and a project with no phase rows is a
 * different failure, not a fresh start.
 *
 * findings, actions, check_results, artifact_registry and gate_decisions carry
 * no project column. This is a single-project POC (`project_state.project_id`
 * is unique), so clearing the table clears the project.
 */
async function resetDatabase(): Promise<Record<string, number>> {
  const { db } = await import('@/db');
  const {
    actions, artifactRegistry, auditHistory, checkResults, findings,
    gateDecisions, inputVersions, phaseInputs, phaseOutputs, phaseStates,
    projectState,
  } = await import('@/db/schema');
  const { and, eq } = await import('drizzle-orm');

  return db.transaction(async (tx) => {
    const rowsDeleted: Record<string, number> = {};

    rowsDeleted.actions = (await tx.delete(actions).returning({ id: actions.actionId })).length;
    rowsDeleted.findings = (await tx.delete(findings).returning({ id: findings.findingId })).length;
    rowsDeleted.check_results =
      (await tx.delete(checkResults).returning({ id: checkResults.checkId })).length;
    rowsDeleted.phase_outputs =
      (await tx.delete(phaseOutputs).returning({ id: phaseOutputs.outputId })).length;
    rowsDeleted.input_versions =
      (await tx.delete(inputVersions).returning({ id: inputVersions.versionId })).length;
    rowsDeleted.phase_inputs =
      (await tx.delete(phaseInputs).returning({ id: phaseInputs.inputId })).length;
    rowsDeleted.artifact_registry =
      (await tx.delete(artifactRegistry).returning({ id: artifactRegistry.artifactId })).length;
    rowsDeleted.gate_decisions =
      (await tx.delete(gateDecisions).returning({ id: gateDecisions.decisionId })).length;

    // Nothing is re-seeded: every phase comes back awaiting its intake, which
    // is what a cleared run means. Re-seeding Phase 3 here was why a new cycle
    // left that phase reporting both inputs ready.

    for (const phaseId of PHASE_IDS) {
      const baseline = baselinePhaseState(phaseId);
      const updated = await tx.update(phaseStates)
        .set(baseline as never)
        .where(and(
          eq(phaseStates.projectId, PROJECT_ID),
          eq(phaseStates.phaseId, phaseId as never),
        ))
        .returning({ id: phaseStates.phaseStateId });

      // A phase row can be missing if the database was migrated but never
      // seeded. A new cycle should leave a usable project either way.
      if (updated.length === 0) {
        await tx.insert(phaseStates).values({
          projectId: PROJECT_ID,
          phaseId: phaseId as never,
          ...baseline,
        } as never);
      }
    }

    await tx.insert(projectState)
      .values(PROJECT_BASELINE as never)
      .onConflictDoUpdate({
        target: projectState.projectId,
        set: {
          currentPhase: PROJECT_BASELINE.currentPhase as never,
          currentGate: PROJECT_BASELINE.currentGate as never,
          currentTechnicalReview: PROJECT_BASELINE.currentTechnicalReview,
          projectStatus: PROJECT_BASELINE.projectStatus,
          updatedAt: new Date().toISOString(),
        },
      });

    // Append-only: the new cycle is recorded, never the erasure of the record.
    await tx.insert(auditHistory).values({
      eventType: 'NewCycle',
      phaseId: null,
      description:
        'New cycle started — uploaded inputs, generated outputs, findings, actions, ' +
        'deterministic check results and gate decisions cleared. Lifecycle returned to Phase 0.',
      actor: 'user',
      relatedIds: [],
      payload: { projectId: PROJECT_ID, rowsDeleted } as never,
    });

    return rowsDeleted;
  });
}

/**
 * Start a new cycle. Files and in-process caches are always cleared; the
 * database is cleared when it is reachable, and reported as `unavailable`
 * when the app is running in Preview mode.
 */
export async function startNewCycle(): Promise<NewCycleSummary> {
  const filesRemoved = clearRunFiles();

  let database: NewCycleSummary['database'] = 'reset';
  let rowsDeleted: Record<string, number> = {};
  try {
    rowsDeleted = await resetDatabase();
  } catch (err) {
    // Preview mode has no database to clear. Anything else is worth seeing in
    // the log — but not worth failing a new cycle that did clear the files.
    console.warn('[new-cycle] database not reset:', err instanceof Error ? err.message : err);
    database = 'unavailable';
  }

  // A gate advisory is computed from evidence that has just been deleted, and
  // Preview-mode decisions live only in this process.
  invalidateGateAssessment();
  clearPreviewDecisions();

  return {
    projectId: PROJECT_ID,
    filesRemoved,
    database,
    rowsDeleted,
    at: new Date().toISOString(),
  };
}
