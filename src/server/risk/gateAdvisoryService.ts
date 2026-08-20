/**
 * One entry point for "what does this gate look like right now".
 *
 * Order matters and is deliberate:
 *   1. assemble structured evidence from what is already recorded
 *   2. CALCULATE the Overall Risk Score — application, structured rules
 *   3. evaluate the configured gate rules → the outcome the rules permit
 *   4. compose a fully grounded advisory from existing content
 *   5. optionally let the LLM rewrite the prose, then clamp it back to (3)
 *
 * If step 5 is unavailable — no LLM key, model error, unparseable reply — the
 * screen still shows a complete, grounded advisory from step 4. The numeric
 * score is identical either way, because the LLM never touches it.
 */

import { computeRiskScore, describeRiskScore, blocksGate } from './riskScoreEngine';
import { evaluateGateRules } from './gateRules';
import { composeStructuredAdvisory } from './advisoryComposer';
import { GateAdvisoryAgent } from './gateAdvisoryAgent';
import { assembleEvidence, type AssembledEvidence } from './evidenceAssembly';
import { listDecisionRecords } from './decisionRecordStore';
import type {
  GateAdvisory, GateAdvisoryResponse, RiskScore, GateDecisionRecord,
} from '@/shared/types/risk';

export interface GateAssessment {
  evidence: AssembledEvidence;
  risk: RiskScore;
  advisory: GateAdvisory;
}

/**
 * Short-lived cache. The gate review screen polls, and every poll would
 * otherwise be a fresh model call for a payload that changes only when a human
 * does something.
 *
 * On `globalThis` because route handlers compile into separate bundles: a
 * module-level Map would give the decide route its own copy, so invalidating
 * after a decision would leave the advisory route serving a stale assessment.
 */
/**
 * Five minutes, not seconds. The gate review screen polls, but the evidence
 * behind an advisory only moves when a human does something — and we invalidate
 * explicitly when they do. A short TTL turned every idle reviewer into a
 * recurring model call for an answer that had not changed.
 */
const CACHE_TTL_MS = 5 * 60_000;
const CACHE_KEY = '__ttGateAssessmentCache__';

type AssessmentCache = Map<number, { at: number; value: GateAssessment }>;

function cacheStore(): AssessmentCache {
  const g = globalThis as typeof globalThis & { [CACHE_KEY]?: AssessmentCache };
  if (!g[CACHE_KEY]) g[CACHE_KEY] = new Map();
  return g[CACHE_KEY];
}

export function invalidateGateAssessment(gateId?: number): void {
  const cache = cacheStore();
  if (typeof gateId === 'number') cache.delete(gateId);
  else cache.clear();
}

export async function assessGate(
  gateId: number,
  options: { useLlm?: boolean; force?: boolean } = {}
): Promise<GateAssessment> {
  const { useLlm = true, force = false } = options;

  const cache = cacheStore();
  const hit = cache.get(gateId);
  if (!force && hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;

  const evidence = await assembleEvidence(gateId);

  // Step 2 — the number. Never the LLM.
  const risk = computeRiskScore(evidence);

  // Step 3 — what the configured rules allow.
  const rules = evaluateGateRules(evidence, risk);

  // Step 4 — grounded advisory from existing content.
  let advisory = composeStructuredAdvisory(evidence, risk, rules);
  risk.explanation = describeRiskScore(risk);

  // Step 5 — LLM prose, clamped. A phase that has not started has nothing to
  // say, so we do not spend a model call on it.
  if (useLlm && risk.assessed) {
    try {
      const agent = new GateAdvisoryAgent(gateId);
      const result = await agent.generate(evidence, risk, rules, advisory);
      advisory = result.advisory;
      if (result.riskExplanation) risk.explanation = result.riskExplanation;
    } catch (err) {
      // No key configured, or no way to reach the store that holds it, is the
      // normal Preview-mode path — not something to shout about on every poll.
      const code = (err as NodeJS.ErrnoException)?.code;
      const expected = code === 'LLM_KEY_NOT_CONFIGURED' || code === 'ECONNREFUSED';
      if (!expected) {
        console.warn(
          `Gate ${gateId} advisory fell back to structured rules:`,
          (err as Error)?.message
        );
      }
    }
  }

  const value: GateAssessment = { evidence, risk, advisory };
  cache.set(gateId, { at: Date.now(), value });
  return value;
}

/** The Gate Review header, straight from the assessment. */
export function buildHeader(assessment: GateAssessment) {
  const { evidence, risk } = assessment;
  const openFindings = risk.counts.unresolvedFindings;

  // Two numbers, because they answer different questions. `blockingActions` is
  // every open blocking action bearing on this gate — the same set the decision
  // control refuses to let a Pass through. `blockingActionsDueNow` is the
  // subset already due here; the rest are tracked to a later gate, which is
  // what makes a Conditional Pass legitimate.
  const openBlocking = evidence.actions.filter(
    a => !['VerifiedClosed', 'Closed', 'Waived'].includes(a.status) &&
         a.blocking === true &&
         (a.sourceGate === evidence.gateId || (a.dueGate ?? evidence.gateId) <= evidence.gateId)
  );
  const blockingActions = openBlocking.length;
  const blockingActionsDueNow = openBlocking.filter(
    a => blocksGate(a, evidence.gateId)
  ).length;

  return {
    gateNumber: evidence.gateId,
    phaseName: evidence.phaseName,
    gateState: evidence.gateState,
    phaseState: evidence.phaseState,
    openFindings,
    blockingActions,
    blockingActionsDueNow,
    requiredHumanDecision: 'Pass, Conditional Pass or Fail — authorised TT reviewer only',
  };
}

export async function buildGateAdvisoryResponse(
  gateId: number,
  options: { useLlm?: boolean; force?: boolean } = {}
): Promise<GateAdvisoryResponse> {
  const assessment = await assessGate(gateId, options);
  const decisionRecords: GateDecisionRecord[] = await listDecisionRecords(gateId);

  return {
    header: buildHeader(assessment),
    riskScore: assessment.risk,
    advisory: assessment.advisory,
    decisionRecords,
  };
}

/** Risk-only assessment, for the phase header and the lifecycle view. */
export async function assessPhaseRisk(phaseId: number): Promise<RiskScore> {
  const evidence = await assembleEvidence(phaseId);
  const risk = computeRiskScore(evidence);
  risk.explanation = describeRiskScore(risk);
  return risk;
}
