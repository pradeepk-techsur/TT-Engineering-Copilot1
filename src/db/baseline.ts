/**
 * The seeded baseline for EVINV-POC-001 — the state a freshly seeded database
 * is in, before anyone has uploaded a file or run a phase.
 *
 * `db/seed.ts` (first boot) and New Cycle (`server/cycle/newCycle.ts`) both
 * read from here on purpose. A new cycle has to land on exactly the state a
 * fresh install lands on; two copies of these values is how that promise
 * quietly stops being true.
 *
 * Imports here stay relative (`./schema`), not `@/db/...` — seed.ts runs under
 * tsx outside Next's module resolution, so a path alias in this file would
 * break `npm run db:seed`.
 */

export const PROJECT_ID = 'EVINV-POC-001';

/** The single project row. */
export const PROJECT_BASELINE = {
  projectId: PROJECT_ID,
  productName: 'EV-INV-800 Demonstration Traction Inverter',
  projectType: 'NPI A',
  projectCategory: 'Category 1',
  currentPhase: 0,
  currentGate: 0,
  currentTechnicalReview: 'Kickoff',
  projectStatus: 'Active',
  syntheticDataIndicator: true,
};

/** This programme runs Phase 0 through Phase 9. */
export const PHASE_IDS = Array.from({ length: 10 }, (_, i) => i);

/**
 * Seeded AI recommendations for phases 0–2 — used by the Gate Review Workspace
 * tests. The advisory label is set here at seed time and overwritten by the
 * real agent at execute time. SYNTHETIC POC data.
 */
export const SEEDED_AI_RECOMMENDATIONS: Record<number, object> = {
  0: {
    recommendedOutcome: 'Pass',
    rationale: '[SYNTHETIC POC] Commercial assessment complete. EV-INV-800 meets bid/no-bid criteria for Category 1 NPI. Opportunity summary and capability gap matrix produced.',
    findingsCited: [],
    checksCited: [],
    advisoryLabel: 'Advisory Only — Human Decision Required',
  },
  1: {
    recommendedOutcome: 'Pass',
    rationale: '[SYNTHETIC POC] Business case and costed proposal reviewed. Resource schedule milestone alignment acceptable. No critical cost variances detected.',
    findingsCited: [],
    checksCited: [],
    advisoryLabel: 'Advisory Only — Human Decision Required',
  },
  2: {
    recommendedOutcome: 'Conditional Pass',
    rationale: '[SYNTHETIC POC] Requirements definition mostly complete. Finding F2-001 (REQ-THERM-004 non-testable criterion) raised. Conditional pass pending revised thermal criterion.',
    findingsCited: ['F2-001'],
    checksCited: ['RequirementTestability'],
    advisoryLabel: 'Advisory Only — Human Decision Required',
  },
};

/**
 * Where one phase sits before anything has happened to it: Phase 0 is waiting
 * for its inputs, every later phase is Pending behind a locked gate.
 */
export function baselinePhaseState(phaseId: number) {
  return {
    phaseState: phaseId === 0 ? 'AwaitingInputs' : 'Pending',
    gateState: 'Locked',
    aiRecommendation: SEEDED_AI_RECOMMENDATIONS[phaseId] ?? null,
    compactPhaseSummary: null,
    executionStartedAt: null,
    executionCompletedAt: null,
    // A new cycle clears the run, and a failure from the cleared run is part
    // of it — leaving it set would report a fresh phase as having just failed.
    executionError: null,
  };
}

/**
 * No phase starts with its inputs ready.
 *
 * Phase 3's two inputs used to be seeded as ready so that the flagship Phase
 * 3 → 4 walkthrough could run on a fresh database without an intake step. The
 * cost was that the internal input is USER-PROVIDED, so a seeded "User Input
 * Ready" asserted a Preliminary Design Package the user had never uploaded —
 * the silent synthetic substitution the FRD prohibits — and the phase would
 * execute on it. It also made New Cycle look broken twice over: Phase 3 came
 * back ready while every other phase came back awaiting intake, and on the
 * Phase 3 workspace a new cycle changed nothing visible at all.
 *
 * Both intake handlers create the `phase_inputs` row themselves when none
 * exists, so a phase with no rows is the correct starting point for every
 * phase: the user ingests the sample and uploads the file, and the readiness
 * the execute route checks is then backed by a real stored artifact.
 */
