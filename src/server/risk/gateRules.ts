/**
 * Configured gate rules.
 *
 * The LLM writes the recommendation, but it does not get to disagree with these
 * rules. Every LLM outcome is checked against `allowedOutcomes` and replaced by
 * `ruleOutcome` if it conflicts — so a model cannot talk its way past a missing
 * mandatory artifact or an unresolved critical blocker.
 *
 * PASS
 *   - no unresolved blocking findings
 *   - mandatory evidence is complete
 *   - required prior-gate actions are closed
 *
 * CONDITIONAL PASS
 *   - phase objectives substantially complete
 *   - no critical blocking issue prevents progression
 *   - remaining actions can be completed before a defined downstream milestone,
 *     or run in parallel
 *
 * FAIL
 *   - a critical blocking issue remains unresolved
 *   - mandatory evidence is missing
 *   - a mandatory gate criterion has failed
 *   - required prior-gate actions block progression
 */

import { resolveRiskScoringConfig, type RiskScoringConfigOverride } from '@/shared/config/riskScoringConfig';
import {
  blocksGate, bearsOnGate, type RiskEvidence, type ActionLike, type FindingLike,
} from './riskScoreEngine';
import type { GateOutcome, RiskScore } from '@/shared/types/risk';

export interface GateRuleEvaluation {
  /** The outcome the configured rules produce from the evidence. */
  ruleOutcome: GateOutcome;
  /**
   * What the LLM may recommend without conflicting with the rules. A model may
   * be more cautious than the rules require, never less.
   */
  allowedOutcomes: GateOutcome[];
  /** Conditions that force a Fail. Empty unless ruleOutcome is Fail. */
  failReasons: string[];
  /** Conditions that stop this being a clean Pass. */
  passBlockers: string[];
  signals: {
    unresolvedCriticalBlocking: FindingLike[];
    unresolvedBlockingFindings: FindingLike[];
    missingEvidence: string[];
    failedMandatoryChecks: string[];
    blockingPriorGateActions: ActionLike[];
    deferrableActions: ActionLike[];
  };
}

/** A finding is "blocking" at this gate when an action for it is due here. */
function blockingFindingIds(evidence: RiskEvidence, resolved: string[]): Set<string> {
  const ids = new Set<string>();
  for (const action of evidence.actions) {
    if (resolved.includes(action.status)) continue;
    if (!action.sourceFindingId) continue;
    if (blocksGate(action, evidence.gateId)) ids.add(action.sourceFindingId);
  }
  return ids;
}

export function evaluateGateRules(
  evidence: RiskEvidence,
  risk: RiskScore,
  override?: RiskScoringConfigOverride
): GateRuleEvaluation {
  const config = resolveRiskScoringConfig(override);
  const resolved = config.resolvedStatuses;
  const gateId = evidence.gateId;

  const unresolvedFindings = evidence.findings.filter(f => !resolved.includes(f.status));
  const blockingIds = blockingFindingIds(evidence, resolved);

  // A Critical finding is treated as blocking on its own — its severity is the
  // blocker, whether or not anyone has raised an action for it yet.
  const unresolvedBlockingFindings = unresolvedFindings.filter(
    f => blockingIds.has(f.findingId) || f.severity === 'Critical'
  );
  const unresolvedCriticalBlocking = unresolvedBlockingFindings.filter(
    f => f.severity === 'Critical'
  );

  const missingEvidence = risk.drillDown.missingEvidence.map(e => e.label);
  const failedMandatoryChecks = risk.drillDown.failedChecks.map(c => c.label);

  // Only actions that bear on THIS gate. An action raised at Gate 3 says
  // nothing about Gate 0 — scoping this wrongly made every earlier gate
  // inherit a future gate's open work.
  const unresolvedActions = evidence.actions.filter(
    a => !resolved.includes(a.status) && bearsOnGate(a, gateId)
  );
  const blockingPriorGateActions = unresolvedActions.filter(
    a => a.sourceGate < gateId && blocksGate(a, gateId)
  );
  /**
   * Actions that legitimately survive a Conditional Pass: they run in parallel
   * or they are due at a later gate, so they have a defined downstream
   * milestone to close against.
   */
  const deferrableActions = unresolvedActions.filter(
    a => !blocksGate(a, gateId) && (a.parallel === true || (a.dueGate ?? gateId) > gateId)
  );

  const failReasons: string[] = [];
  if (unresolvedCriticalBlocking.length) {
    failReasons.push(
      `Critical blocking issue unresolved: ${unresolvedCriticalBlocking.map(f => f.findingId).join(', ')}.`
    );
  }
  if (missingEvidence.length) {
    failReasons.push(`Mandatory evidence missing: ${missingEvidence.join('; ')}.`);
  }
  if (failedMandatoryChecks.length) {
    failReasons.push(`Mandatory gate criterion failed: ${failedMandatoryChecks.join('; ')}.`);
  }
  if (blockingPriorGateActions.length) {
    failReasons.push(
      `Prior-gate action blocks progression: ${blockingPriorGateActions.map(a => a.actionId).join(', ')}.`
    );
  }

  const passBlockers: string[] = [];
  if (unresolvedBlockingFindings.length) {
    passBlockers.push(
      `Unresolved blocking finding${unresolvedBlockingFindings.length > 1 ? 's' : ''}: ${unresolvedBlockingFindings.map(f => f.findingId).join(', ')}.`
    );
  }
  if (missingEvidence.length) passBlockers.push('Mandatory evidence is incomplete.');
  if (unresolvedActions.some(a => a.sourceGate < gateId)) {
    passBlockers.push(
      `Prior-gate action${unresolvedActions.filter(a => a.sourceGate < gateId).length > 1 ? 's' : ''} not yet closed: ${unresolvedActions.filter(a => a.sourceGate < gateId).map(a => a.actionId).join(', ')}.`
    );
  }
  if (deferrableActions.length) {
    passBlockers.push(
      `Action${deferrableActions.length > 1 ? 's' : ''} still open, tracked to a later gate: ${deferrableActions.map(a => a.actionId).join(', ')}.`
    );
  }

  const ruleOutcome: GateOutcome = failReasons.length
    ? 'Fail'
    : passBlockers.length
      ? 'Conditional Pass'
      : 'Pass';

  // More caution than the rules demand is allowed; less is not.
  const allowedOutcomes: GateOutcome[] =
    ruleOutcome === 'Fail' ? ['Fail']
    : ruleOutcome === 'Conditional Pass' ? ['Conditional Pass']
    : ['Pass', 'Conditional Pass'];

  return {
    ruleOutcome,
    allowedOutcomes,
    failReasons,
    passBlockers,
    signals: {
      unresolvedCriticalBlocking,
      unresolvedBlockingFindings,
      missingEvidence,
      failedMandatoryChecks,
      blockingPriorGateActions,
      deferrableActions,
    },
  };
}

/** Clamp any proposed outcome to what the rules permit. */
export function clampOutcome(
  proposed: string | undefined,
  rules: GateRuleEvaluation
): { outcome: GateOutcome; overridden: boolean } {
  const candidate = proposed as GateOutcome | undefined;
  if (candidate && rules.allowedOutcomes.includes(candidate)) {
    return { outcome: candidate, overridden: false };
  }
  return { outcome: rules.ruleOutcome, overridden: true };
}
