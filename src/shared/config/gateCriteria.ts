/**
 * Gate criteria — what each gate requires, and what the AI recommendation must
 * obey.
 *
 * Nothing here creates a new input or output artifact. The mandatory evidence
 * list is derived from the phase's ALREADY-CONFIGURED intake inputs and
 * outputs in `phaseConfig.ts`; the mandatory checks are the deterministic
 * checks the app already runs. This file only says which of those are
 * *required* at the gate, and states the criteria in words the LLM can be
 * grounded against.
 */

import { PHASE_CONFIG_MAP, type PhaseId } from '@/shared/constants/phaseConfig';

/**
 * Deterministic checks that must pass at each gate. Mirrors the check types the
 * runner executes (`/api/checks/phase/[id]/run`). A gate with no entry has no
 * mandatory checks — its criteria are evidence-based only.
 */
export const MANDATORY_CHECKS: Record<number, string[]> = {
  4: ['CrossArtifactConsistency', 'HVClearance', 'ComponentDerating', 'TestPointCoverage'],
  6: ['CpkCalculation'],
};

/** Human-readable gate criteria. Sent to the LLM as grounding — never invented. */
export const GATE_CRITERIA: Record<number, string[]> = {
  0: [
    'Opportunity is assessed against site capability and capacity.',
    'Critical capability gaps are identified and owned.',
    'Bid/no-bid recommendation is supported by the capability-match matrix.',
  ],
  1: [
    'Costed proposal or business case is complete and internally consistent.',
    'Resource and milestone schedule is achievable against declared capacity.',
  ],
  2: [
    'Every requirement is uniquely identified and traceable.',
    'Every requirement carries a measurable, testable acceptance criterion.',
  ],
  3: [
    'Preliminary architecture and principal interfaces are defined.',
    'Design rules and manufacturing capabilities have been applied to the concept.',
    'Early DFM/DFA risks are recorded with owners and due gates.',
  ],
  4: [
    'Detailed design baseline is released and internally consistent.',
    'HV clearance, component derating and test-point coverage checks pass.',
    'BOM health and manufacturability risks are quantified and owned.',
  ],
  5: [
    'Verification and validation matrix covers every requirement.',
    'Validation evidence exists for each acceptance criterion.',
  ],
  6: [
    'Manufacturing readiness level is assessed against the target.',
    'PPAP/FAI readiness gaps carry closure actions.',
    'Process capability (Cpk) meets the configured threshold.',
  ],
  7: [
    'Transfer completeness is demonstrated.',
    'Lessons learned are captured in structured, reusable form.',
  ],
  8: [
    'Obsolescence and supply risk are forecast with mitigation owners.',
    'Yield, quality and financial anomalies are explained.',
  ],
  9: [
    'EOL and last-time-buy decisions are recorded and approved.',
    'Project closure and institutional-memory record is complete.',
  ],
};

export type EvidenceKind = 'input' | 'output';

export interface EvidenceRequirement {
  /** Stable key, used as the drill-down ref id. */
  key: string;
  kind: EvidenceKind;
  /** The logical input name or output name from phaseConfig. */
  name: string;
  /** Why the gate needs it. */
  requirement: string;
  /**
   * Input requirements describe a pre-execution prerequisite. Once the phase
   * has produced its outputs, the gate reviews those outputs instead, so this
   * requirement is retired (see `countInputEvidenceOnlyBeforeExecution`).
   */
  retiredAfterExecution: boolean;
}

/**
 * The mandatory evidence for a gate: both configured intake inputs and both
 * configured phase outputs. No new artifact is introduced — these are exactly
 * the ones `phaseConfig.ts` already declares.
 */
export function mandatoryEvidenceFor(phaseId: number): EvidenceRequirement[] {
  const config = PHASE_CONFIG_MAP[phaseId as PhaseId];
  if (!config) return [];

  const inputs: EvidenceRequirement[] = [
    {
      key: `input:external:${phaseId}`,
      kind: 'input',
      name: config.externalIntake.logicalName,
      requirement: 'External-source input must be ready before the phase runs.',
      retiredAfterExecution: true,
    },
    {
      key: `input:internal:${phaseId}`,
      kind: 'input',
      name: config.internalIntake.logicalName,
      requirement: 'Internal-artifact input must be ready before the phase runs.',
      retiredAfterExecution: true,
    },
  ];

  const outputs: EvidenceRequirement[] = config.outputs.map((name, i) => ({
    key: `output:${phaseId}:${i}`,
    kind: 'output' as EvidenceKind,
    name,
    requirement: 'Phase output must exist for the gate to review.',
    retiredAfterExecution: false,
  }));

  return [...inputs, ...outputs];
}

/** Phase states that mean the phase has produced its outputs. */
export const EXECUTED_PHASE_STATES = new Set([
  'AwaitingGate', 'GatePassed', 'GateConditional', 'GateFailed',
]);

/**
 * Phase states that mean there is nothing yet to score.
 *
 * The Overall Risk Score is a *gate* score: it answers how risky it would be to
 * pass this gate, and a gate is not in play until the phase has produced
 * something to review. Until then its evidence is not missing, it is not due.
 *
 * This set used to hold only 'Pending', which left the two states a phase
 * actually passes through on its way to the gate — 'AwaitingInputs' while it
 * waits for its files, 'Running' while the agent works — being scored as though
 * their outputs were overdue. The visible cost was a freshly seeded project:
 * Phase 0 starts at 'AwaitingInputs', so a brand-new cycle opened on
 * "Risk: 80 / 100, Critical" before anyone had touched it, and New Cycle could
 * not clear a number that was never about the cleared run in the first place.
 */
export const UNSTARTED_PHASE_STATES = new Set([
  'Pending', 'AwaitingInputs', 'Running',
]);

/** Output approval statuses that mean the artifact exists. */
export const PRESENT_OUTPUT_STATUSES = new Set([
  'AwaitingReview', 'Approved', 'ReviewRequired', 'Rejected',
]);

/** Input readiness statuses that mean the input is usable. */
export const READY_INPUT_STATUSES = new Set([
  'Ready', 'User Input Ready', 'Synthetic System Input Ready',
]);
