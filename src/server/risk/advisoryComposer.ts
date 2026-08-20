/**
 * Composes the gate advisory from content that already exists.
 *
 * Everything here is derived from recorded structure — findings, actions,
 * check results, intake readiness, phase outputs, and the compact phase
 * summaries the phase agents already wrote. Nothing is invented, no artifact is
 * created, and no whole document is read.
 *
 * This serves two purposes:
 *   1. it is the structured fallback, used whenever no LLM key is configured or
 *      the model call fails, so the screen is never empty; and
 *   2. it is the grounding payload handed to the LLM — the candidate strengths,
 *      risks and next steps the model may rewrite but not replace.
 */

import { GATE_CRITERIA } from '@/shared/config/gateCriteria';
import { severityToRiskLevel } from '@/shared/config/riskScoringConfig';
import { blocksGate, bearsOnGate, bySeverity } from './riskScoreEngine';
import type { AssembledEvidence } from './evidenceAssembly';
import type { GateRuleEvaluation } from './gateRules';
import type {
  GateAdvisory, KeyStrength, KeyRisk, NextStep, RiskScore, GateOutcome,
} from '@/shared/types/risk';

export const ADVISORY_LABEL = 'Advisory Only — Human Decision Required';
export const MAX_ITEMS = 3;
export const NO_STRENGTHS = 'No evidence-supported Key Strengths identified.';

const RESOLVED = new Set(['VerifiedClosed', 'Closed', 'Waived']);

/** Trim a long artifact sentence to something that fits one line. */
function oneLine(text: string, max = 150): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  // Prefer cutting at a sentence end — a clause that stops mid-part-number
  // reads as corrupt rather than shortened.
  const firstSentence = flat.match(/^[^.!?]+[.!?]/)?.[0]?.trim();
  if (firstSentence && firstSentence.length <= max) return firstSentence;
  const cut = flat.slice(0, max);
  const at = cut.lastIndexOf(' ');
  return `${cut.slice(0, at > max * 0.6 ? at : max).replace(/[,;:]$/, '')}…`;
}

/**
 * Sentence-case a clause without flattening an acronym. `PDR Readiness
 * Summary` must not become `pDR Readiness Summary`.
 */
function lowerFirstUnlessAcronym(text: string): string {
  if (/^[A-Z]{2,}/.test(text)) return text;
  return text.charAt(0).toLowerCase() + text.slice(1);
}

/** "1 finding" / "2 findings". */
function plural(n: number, singular: string, pluralForm?: string): string {
  return `${n} ${n === 1 ? singular : (pluralForm ?? `${singular}s`)}`;
}

/** Ensure a statement reads as a sentence. */
function sentence(text: string): string {
  const t = oneLine(text);
  if (!t) return t;
  const capped = t.charAt(0).toUpperCase() + t.slice(1);
  return /[.!?…]$/.test(capped) ? capped : `${capped}.`;
}

/** A risk reduced to a short clause, for embedding in the rationale. */
function clause(risk: KeyRisk): string {
  const base = risk.detail.findingId
    ? `${risk.detail.findingId}: ${risk.statement}`
    : risk.statement;
  return oneLine(base, 90).replace(/\.$/, '');
}

/* ── Key Strengths ─────────────────────────────────────────────────────── */

/**
 * Strengths must be *supported*. Each candidate carries the ref that backs it,
 * and a candidate with no ref is never produced in the first place.
 */
export function composeKeyStrengths(evidence: AssembledEvidence): KeyStrength[] {
  const strengths: KeyStrength[] = [];
  const { phaseId } = evidence;

  // 1. Passed mandatory checks — the hardest evidence available.
  for (const check of evidence.passedChecks) {
    strengths.push({
      statement: sentence(`${check.checkType} check passes${check.sourceReference ? ` against ${check.sourceReference}` : ''}`),
      evidence: {
        id: check.checkId ?? check.checkType,
        label: `${check.checkType} — Pass${check.resultValue ? ` (${check.resultValue})` : ''}`,
        detail: check.sourceReference,
        href: `/phase/${phaseId}/checklist`,
      },
    });
  }

  // 2. Outputs the phase actually produced.
  for (const output of evidence.outputs) {
    const approved = output.approvalStatus === 'Approved';
    strengths.push({
      statement: sentence(
        approved
          ? `${output.outputName} is approved`
          : `${output.outputName} is complete and ready for review`
      ),
      evidence: {
        id: output.outputId ?? output.outputName,
        label: output.outputName,
        detail: output.approvalStatus,
        href: `/phase/${phaseId}`,
      },
    });
  }

  // 3. Closed prior-gate actions — reuses what the compact summaries recorded.
  for (const action of evidence.closedActions) {
    strengths.push({
      statement: sentence(`Prior-gate action ${action.actionId} is ${action.status === 'VerifiedClosed' ? 'verified closed' : 'closed'}`),
      evidence: {
        id: action.actionId,
        label: oneLine(action.description),
        detail: `Raised at Gate ${action.sourceGate} · ${action.status}`,
        href: `/audit?tab=findings&action=${encodeURIComponent(action.actionId)}`,
      },
    });
  }

  // 4. Findings closed in this phase, then in earlier phases — a prior
  //    clarification that was resolved is still a strength at this gate.
  for (const finding of [...evidence.closedFindings, ...evidence.priorClosedFindings]) {
    strengths.push({
      statement: sentence(`${finding.findingId} is closed and verified`),
      evidence: {
        id: finding.findingId,
        label: oneLine(finding.description),
        detail: `${finding.severity} · ${finding.status}`,
        href: `/audit?tab=findings&finding=${encodeURIComponent(finding.findingId)}`,
      },
    });
  }

  // 5. Prior gates already passed, most recent first, from their own summaries.
  for (const summary of [...evidence.priorSummaries].sort(
    (a, b) => (b.phaseId ?? 0) - (a.phaseId ?? 0)
  )) {
    if (summary.outcome !== 'Pass') continue;
    strengths.push({
      statement: sentence(`Gate ${summary.phaseId} (${summary.phaseName}) passed with its outputs approved`),
      evidence: {
        id: `gate-${summary.phaseId}`,
        label: `Gate ${summary.phaseId} — ${summary.outcome}`,
        detail: (summary.approvedOutputs ?? []).join(', ') || undefined,
        href: `/gate/${summary.phaseId}/review`,
      },
    });
  }

  return strengths;
}

/* ── Key Risks ─────────────────────────────────────────────────────────── */

export function composeKeyRisks(evidence: AssembledEvidence): KeyRisk[] {
  const { gateId, phaseId } = evidence;
  const risks: KeyRisk[] = [];

  const unresolved = evidence.findings
    .filter(f => !RESOLVED.has(f.status))
    .sort(bySeverity);

  for (const finding of unresolved) {
    // The action raised against this finding carries the owner and due gate.
    const action = evidence.actions.find(
      a => a.sourceFindingId === finding.findingId && !RESOLVED.has(a.status)
    );
    const blocking = action ? blocksGate(action, gateId) : finding.severity === 'Critical';

    risks.push({
      statement: sentence(oneLine(finding.description, 110)),
      level: severityToRiskLevel(finding.severity),
      blocking,
      detail: {
        findingId: finding.findingId,
        fullFinding: finding.description,
        supportingEvidence: finding.detectedBy === 'DeterministicCheck'
          ? 'Raised by a deterministic check — see the check result for the measured value and threshold.'
          : 'Raised by phase agent analysis of the recorded phase inputs and outputs.',
        applicableRule: (GATE_CRITERIA[phaseId] ?? [])[0],
        recommendedAction: action?.description,
        ownerRole: action?.ownerRole,
        duePhase: action?.duePhase ?? null,
        dueGate: action?.dueGate ?? null,
        actionId: action?.actionId,
        href: `/audit?tab=findings&finding=${encodeURIComponent(finding.findingId)}`,
      },
    });
  }

  // Failed mandatory checks are risks in their own right.
  for (const check of evidence.checkResults) {
    if (check.invalidated || check.status !== 'Fail') continue;
    if (unresolved.some(f => f.checkId && f.checkId === check.checkId)) continue;
    risks.push({
      statement: sentence(`${check.checkType} check fails against its configured threshold`),
      level: 'High',
      blocking: true,
      detail: {
        fullFinding: `${check.checkType}: measured ${check.resultValue ?? 'n/a'} against threshold ${check.threshold ?? 'n/a'}.`,
        supportingEvidence: check.sourceReference,
        applicableRule: check.sourceReference,
        recommendedAction: 'Correct the design or process and re-run the mandatory check.',
        href: `/phase/${phaseId}/checklist`,
      },
    });
  }

  // Risk carried in from an earlier gate. The finding lives in another phase,
  // so it is not in `evidence.findings` — but an action that is blocking and
  // now due here is one of the most important things on this screen.
  const seenFindings = new Set(unresolved.map(f => f.findingId));
  for (const action of evidence.actions) {
    if (RESOLVED.has(action.status)) continue;
    if (!bearsOnGate(action, gateId)) continue;
    if (action.sourceGate >= gateId) continue;
    if (action.sourceFindingId && seenFindings.has(action.sourceFindingId)) continue;

    const finding = action.sourceFindingId
      ? evidence.findingsIndex[action.sourceFindingId]
      : undefined;
    const blocking = blocksGate(action, gateId);

    risks.push({
      statement: sentence(
        finding
          ? oneLine(finding.description, 110)
          : oneLine(action.description, 110)
      ),
      level: finding ? severityToRiskLevel(finding.severity) : 'High',
      blocking,
      detail: {
        findingId: finding?.findingId,
        fullFinding: finding?.description ?? action.description,
        supportingEvidence: `Raised at Gate ${action.sourceGate} and still ${action.status}.`,
        applicableRule: (GATE_CRITERIA[phaseId] ?? [])[0],
        recommendedAction: action.description,
        ownerRole: action.ownerRole,
        duePhase: action.duePhase ?? null,
        dueGate: action.dueGate ?? null,
        actionId: action.actionId,
        href: `/audit?tab=findings&action=${encodeURIComponent(action.actionId)}`,
      },
    });
  }

  // Missing mandatory evidence is scored by the engine, so those risks are
  // built from the score itself (see composeEvidenceRisks) — never twice.
  return risks;
}

/** Missing-evidence risks come from the score, so the two can never disagree. */
export function composeEvidenceRisks(risk: RiskScore): KeyRisk[] {
  return risk.drillDown.missingEvidence.map(ref => ({
    statement: sentence(`${ref.label} is not available for review`),
    level: 'Critical' as const,
    blocking: true,
    detail: {
      fullFinding: `${ref.label}: ${ref.detail ?? 'missing.'}`,
      supportingEvidence: 'Mandatory gate evidence, configured in the gate criteria.',
      recommendedAction: `Provide ${ref.label} before the gate decision.`,
      href: ref.href,
    },
  }));
}

/* ── Next Steps ────────────────────────────────────────────────────────── */

export function composeNextSteps(
  evidence: AssembledEvidence,
  risk: RiskScore
): NextStep[] {
  const steps: NextStep[] = [];
  const { gateId } = evidence;

  // Missing evidence first — without it the gate cannot be judged at all.
  for (const ref of risk.drillDown.missingEvidence) {
    steps.push({
      statement: sentence(`Provide ${ref.label} so the gate has evidence to review`),
      source: ref,
      sourceKind: 'MissingEvidence',
    });
  }

  // Then failed mandatory checks.
  for (const ref of risk.drillDown.failedChecks) {
    steps.push({
      statement: sentence(`Correct and re-run the ${ref.label.replace(/ check failed$/, '')} check`),
      source: ref,
      sourceKind: 'FailedCheck',
    });
  }

  // Then open actions — blocking and already due before deferred ones.
  const open = evidence.actions
    .filter(a => !RESOLVED.has(a.status) && bearsOnGate(a, gateId))
    .sort((a, b) => {
      const blockDiff = Number(blocksGate(b, gateId)) - Number(blocksGate(a, gateId));
      if (blockDiff !== 0) return blockDiff;
      return (a.dueGate ?? 99) - (b.dueGate ?? 99);
    });

  for (const action of open) {
    steps.push({
      statement: sentence(oneLine(action.description, 165)),
      source: {
        id: action.actionId,
        label: oneLine(action.description),
        detail: [action.ownerRole, typeof action.dueGate === 'number' ? `due Gate ${action.dueGate}` : null]
          .filter(Boolean).join(' · '),
        href: `/audit?tab=findings&action=${encodeURIComponent(action.actionId)}`,
      },
      sourceKind: 'Action',
    });
  }

  // Finally, the gate condition each deferred action has to be closed against.
  for (const action of open) {
    if (typeof action.dueGate !== 'number' || action.dueGate <= gateId) continue;
    steps.push({
      statement: `Verify closure of ${action.actionId} at Gate ${action.dueGate}.`,
      source: {
        id: `${action.actionId}@G${action.dueGate}`,
        label: action.requiredClosureEvidence
          ? oneLine(action.requiredClosureEvidence)
          : `Closure evidence for ${action.actionId}`,
        detail: `Due Gate ${action.dueGate}`,
        href: `/gate/${action.dueGate}/review`,
      },
      sourceKind: 'GateCondition',
    });
  }

  return steps;
}

/* ── Rationale ─────────────────────────────────────────────────────────── */

/**
 * Two or three sentences: what is sufficiently complete, what remains
 * unresolved and whether it blocks, and why the outcome follows.
 */
export function composeRationale(
  outcome: GateOutcome,
  evidence: AssembledEvidence,
  risk: RiskScore,
  rules: GateRuleEvaluation,
  strengths: KeyStrength[],
  risks: KeyRisk[]
): string {
  const complete = strengths.length
    ? strengths.slice(0, 2).map(s => s.statement.replace(/\.$/, '')).join(', and ')
    : 'no completed evidence has been recorded for this phase yet';

  const blockingRisks = risks.filter(r => r.blocking);
  const openRisks = risks.filter(r => !r.blocking);

  const first = `${outcome} is recommended because ${lowerFirstUnlessAcronym(complete)}.`;

  let second: string;
  if (!risks.length) {
    second = `No unresolved findings, failed mandatory checks or open blocking actions bear on Gate ${evidence.gateId}.`;
  } else if (blockingRisks.length) {
    second = `However, ${plural(blockingRisks.length, 'blocking item')} ${blockingRisks.length > 1 ? 'remain' : 'remains'} unresolved (${blockingRisks.slice(0, 2).map(r => clause(r)).join('; ')}), which prevents progression.`;
  } else {
    second = `However, ${plural(openRisks.length, `${openRisks[0].level.toLowerCase()}-risk item`)} ${openRisks.length > 1 ? 'remain' : 'remains'} open (${openRisks.slice(0, 2).map(r => clause(r)).join('; ')}), ${openRisks.length > 1 ? 'none of which blocks' : 'which does not block'} this gate.`;
  }

  const third =
    outcome === 'Fail'
      ? `The configured gate rules require a Fail while ${rules.failReasons[0]?.replace(/\.$/, '') ?? 'a mandatory criterion is unmet'}.`
      : outcome === 'Conditional Pass'
        ? `A Conditional Pass is appropriate because the remaining work is tracked to a defined downstream gate and can proceed in parallel, at an Overall Risk Score of ${risk.score}/${risk.configSnapshot.cap} (${risk.level}).`
        : `A Pass is appropriate because mandatory evidence is complete and no blocking item remains, at an Overall Risk Score of ${risk.score}/${risk.configSnapshot.cap} (${risk.level}).`;

  return `${first} ${second} ${third}`;
}

/** Hard limit: two or three sentences, never more. */
export function limitToSentences(text: string, max = 3): string {
  const trimmed = (text ?? '').replace(/\s+/g, ' ').trim();
  if (!trimmed) return trimmed;
  const parts = trimmed.match(/[^.!?]+[.!?]+(\s|$)/g);
  if (!parts) return trimmed;
  return parts.slice(0, max).join('').trim();
}

/* ── Assembled fallback advisory ───────────────────────────────────────── */

export function composeStructuredAdvisory(
  evidence: AssembledEvidence,
  risk: RiskScore,
  rules: GateRuleEvaluation
): GateAdvisory {
  const outcome = rules.ruleOutcome;
  // A locked gate cannot be decided, so there is nothing to recommend for it.
  const recommendationAvailable = evidence.gateState !== 'Locked';
  const strengths = composeKeyStrengths(evidence).slice(0, MAX_ITEMS);
  const allRisks = [...composeEvidenceRisks(risk), ...composeKeyRisks(evidence)];
  const keyRisks = rankRisks(allRisks).slice(0, MAX_ITEMS);
  const nextSteps = dedupeSteps(composeNextSteps(evidence, risk)).slice(0, MAX_ITEMS);

  return {
    gateNumber: evidence.gateId,
    phaseName: evidence.phaseName,
    recommendedOutcome: outcome,
    recommendationAvailable,
    rationale: recommendationAvailable
      ? limitToSentences(composeRationale(outcome, evidence, risk, rules, strengths, keyRisks))
      : `Gate ${evidence.gateId} is locked, so no outcome is recommended yet. ${risk.explanation || describeOpenWork(risk)}`,
    keyStrengths: strengths,
    keyRisks,
    nextSteps,
    findingsCited: keyRisks.map(r => r.detail.findingId).filter((v): v is string => !!v),
    checksCited: risk.drillDown.failedChecks.map(c => c.id),
    actionsCited: nextSteps
      .filter(s => s.sourceKind === 'Action' || s.sourceKind === 'GateCondition')
      .map(s => s.source.id),
    advisoryLabel: ADVISORY_LABEL,
    generatedBy: 'StructuredFallback',
    ruleOverrideApplied: false,
    ruleOutcome: outcome,
    allowedOutcomes: rules.allowedOutcomes,
    ruleReasons: rules.failReasons.length ? rules.failReasons : rules.passBlockers,
  };
}

/** What is carried into a locked gate, for its stand-in rationale. */
function describeOpenWork(risk: RiskScore): string {
  const open = risk.drillDown.openActions.length;
  return open
    ? `${plural(open, 'open action')} from earlier gates already ${open === 1 ? 'bears' : 'bear'} on it.`
    : 'No earlier open work bears on it yet.';
}

const LEVEL_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 } as const;

/** Highest severity first; blocking items outrank non-blocking at equal level. */
export function rankRisks(risks: KeyRisk[]): KeyRisk[] {
  return [...risks].sort((a, b) => {
    const d = LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level];
    if (d !== 0) return d;
    return Number(b.blocking) - Number(a.blocking);
  });
}

function dedupeSteps(steps: NextStep[]): NextStep[] {
  const seen = new Set<string>();
  return steps.filter(s => {
    const key = `${s.sourceKind}:${s.source.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export { dedupeSteps };
