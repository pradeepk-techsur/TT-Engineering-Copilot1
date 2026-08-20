/**
 * The Overall Risk Score.
 *
 * THE LLM NEVER RUNS THIS. The score is a pure function of structured evidence
 * and the configured weights — same inputs, same number, every time. That is
 * the whole point: a reviewer can be told exactly which finding, action, check
 * or missing artifact produced each point, and can change the weights without
 * touching code.
 *
 * The score is advisory. It does not approve or reject anything.
 */

import {
  resolveRiskScoringConfig,
  riskLevelFor,
  riskBands,
  findingWeight,
  type RiskScoringConfig,
  type RiskScoringConfigOverride,
} from '@/shared/config/riskScoringConfig';
import {
  EXECUTED_PHASE_STATES,
  UNSTARTED_PHASE_STATES,
  PRESENT_OUTPUT_STATUSES,
  READY_INPUT_STATUSES,
  mandatoryEvidenceFor,
  MANDATORY_CHECKS,
  type EvidenceRequirement,
} from '@/shared/config/gateCriteria';
import type {
  RiskScore, RiskContribution, RiskRef, RiskCategory, RiskLevel,
} from '@/shared/types/risk';

/* ── Evidence the engine scores ────────────────────────────────────────── */

export interface FindingLike {
  findingId: string;
  sourcePhase: number;
  sourceGate?: number;
  description: string;
  severity: string;
  status: string;
  detectedBy?: string;
  checkId?: string | null;
}

export interface ActionLike {
  actionId: string;
  sourceFindingId?: string;
  sourcePhase: number;
  sourceGate: number;
  description: string;
  ownerRole?: string;
  blocking?: boolean;
  parallel?: boolean;
  duePhase?: number | null;
  dueGate?: number | null;
  status: string;
  requiredClosureEvidence?: string;
  closureEvidenceArtifactId?: string | null;
}

export interface CheckLike {
  checkId?: string;
  checkType: string;
  phaseId: number;
  status: string;
  sourceReference?: string;
  resultValue?: string;
  threshold?: string;
  invalidated?: boolean;
}

export interface InputLike {
  inputRole: string;
  logicalName: string;
  readinessStatus: string;
}

export interface OutputLike {
  outputId?: string;
  outputName: string;
  approvalStatus: string;
  artifactId?: string | null;
}

export interface RiskEvidence {
  phaseId: number;
  gateId: number;
  phaseState: string;
  /** Findings raised in this phase. */
  findings: FindingLike[];
  /** EVERY project action. The engine decides which ones bear on this gate. */
  actions: ActionLike[];
  /** Check results for this phase. */
  checkResults: CheckLike[];
  inputs: InputLike[];
  outputs: OutputLike[];
}

/* ── Helpers ───────────────────────────────────────────────────────────── */

function isResolved(status: string, config: RiskScoringConfig): boolean {
  return config.resolvedStatuses.includes(status);
}

const SEVERITY_ORDER: Record<string, number> = {
  Critical: 0, Major: 1, Minor: 2, Observation: 3,
};

/** Highest severity first, then by id so the order is stable. */
export function bySeverity<T extends { severity: string; findingId?: string }>(a: T, b: T): number {
  const d = (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9);
  return d !== 0 ? d : (a.findingId ?? '').localeCompare(b.findingId ?? '');
}

/**
 * An action bears on this gate if it was raised at or before it, or if it is
 * due at or before it. An action raised at Gate 3 and due at Gate 4 is open
 * work at Gate 3 — visible, but not yet *due*. An action raised at Gate 3 is
 * still hanging over Gate 8. An action raised at Gate 3 says nothing about
 * Gate 0.
 *
 * Exported because the rule evaluation and the advisory must use exactly this
 * definition — three slightly different versions of "relevant" is how a
 * screen ends up recommending work that belongs to another gate.
 */
export function bearsOnGate(action: ActionLike, gateId: number): boolean {
  if (action.sourceGate <= gateId) return true;
  return typeof action.dueGate === 'number' && action.dueGate <= gateId;
}

/** Past its due gate and still not closed. */
function isOverdue(action: ActionLike, gateId: number): boolean {
  return typeof action.dueGate === 'number' && action.dueGate < gateId;
}

/** Raised at an earlier gate and still not closed. */
function isPriorGate(action: ActionLike, gateId: number): boolean {
  return action.sourceGate < gateId;
}

/**
 * Does this action block progression through THIS gate? Only if it is blocking
 * and already due. A blocking action due at a later gate is tracked, not a
 * blocker here — which is exactly how a Conditional Pass is meant to work.
 */
export function blocksGate(action: ActionLike, gateId: number): boolean {
  if (!action.blocking) return false;
  return typeof action.dueGate === 'number' ? action.dueGate <= gateId : true;
}

function actionHref(actionId: string): string {
  return `/audit?tab=findings&action=${encodeURIComponent(actionId)}`;
}

function findingHref(findingId: string): string {
  return `/audit?tab=findings&finding=${encodeURIComponent(findingId)}`;
}

/* ── Mandatory evidence resolution ─────────────────────────────────────── */

export interface EvidenceStatus {
  requirement: EvidenceRequirement;
  present: boolean;
  /** Why it counts as missing (or how it was satisfied). */
  note: string;
  /** True when the requirement does not apply at this point in the lifecycle. */
  retired: boolean;
}

/**
 * Resolve each configured mandatory evidence item against what actually exists.
 * Input requirements retire once the phase has executed, so a gate reviewing a
 * completed phase is not penalised for intake state that is now history.
 */
export function resolveEvidence(
  evidence: RiskEvidence,
  config: RiskScoringConfig
): EvidenceStatus[] {
  const executed = EXECUTED_PHASE_STATES.has(evidence.phaseState);
  // A phase that has not started is not *missing* its evidence — it is not due
  // yet. Scoring it as missing would report every future phase as Critical.
  if (UNSTARTED_PHASE_STATES.has(evidence.phaseState)) {
    return mandatoryEvidenceFor(evidence.phaseId).map(requirement => ({
      requirement,
      retired: true,
      present: true,
      note: 'Not yet due — this phase has not started.',
    }));
  }

  return mandatoryEvidenceFor(evidence.phaseId).map(requirement => {
    if (requirement.kind === 'input') {
      const retired =
        config.countInputEvidenceOnlyBeforeExecution &&
        requirement.retiredAfterExecution &&
        executed;
      const role = requirement.key.split(':')[1];
      const input = evidence.inputs.find(i => i.inputRole === role);
      const ready = !!input && READY_INPUT_STATUSES.has(input.readinessStatus);
      return {
        requirement,
        retired,
        present: retired || ready,
        note: retired
          ? 'Satisfied — the phase has executed, so the gate reviews its outputs.'
          : ready
            ? `Ready (${input?.readinessStatus}).`
            : input
              ? `Not ready — ${input.readinessStatus}.`
              : 'No intake record for this input.',
      };
    }

    // Outputs are matched by name, then positionally, so a renamed output does
    // not silently read as missing.
    const index = parseInt(requirement.key.split(':')[2] ?? '0', 10);
    const byName = evidence.outputs.find(
      o => o.outputName.toLowerCase() === requirement.name.toLowerCase()
    );
    const output = byName ?? evidence.outputs[index];
    const present = !!output && PRESENT_OUTPUT_STATUSES.has(output.approvalStatus);
    return {
      requirement,
      retired: false,
      present,
      note: present
        ? `Present (${output?.approvalStatus}).`
        : 'Not generated — the gate has no artifact to review.',
    };
  });
}

/* ── The engine ────────────────────────────────────────────────────────── */

function contribution(
  category: RiskCategory,
  label: string,
  weight: number,
  refs: RiskRef[]
): RiskContribution {
  return {
    category,
    label,
    weight,
    count: refs.length,
    points: weight * refs.length,
    refs: refs.map(r => ({ ...r, points: weight })),
  };
}

export function computeRiskScore(
  evidence: RiskEvidence,
  override?: RiskScoringConfigOverride
): RiskScore {
  const config = resolveRiskScoringConfig(override);
  const { gateId, phaseId } = evidence;
  const contributions: RiskContribution[] = [];

  /* 1 — Unresolved findings, one contribution per severity so the weights stay
         legible in the drill-down. */
  const unresolvedFindings = evidence.findings
    .filter(f => !isResolved(f.status, config))
    .sort(bySeverity);

  const KNOWN_SEVERITIES = ['Critical', 'Major', 'Minor', 'Observation'];
  // A severity the backend added but this build has not seen must still be
  // grouped, or the count would report a finding the score never charged for.
  const severityGroups = [
    ...KNOWN_SEVERITIES,
    ...new Set(
      unresolvedFindings
        .map(f => f.severity)
        .filter(sev => !KNOWN_SEVERITIES.includes(sev))
    ),
  ];

  for (const severity of severityGroups) {
    const group = unresolvedFindings.filter(f => f.severity === severity);
    if (!group.length) continue;
    const weight = findingWeight(severity, config);
    contributions.push(
      contribution('UnresolvedFinding', `${severity} unresolved findings`, weight,
        group.map(f => ({
          id: f.findingId,
          label: f.description,
          detail: `${severity} · ${f.status}`,
          href: findingHref(f.findingId),
        })))
    );
  }

  /* 2 — Failed mandatory deterministic checks. Superseded runs don't count. */
  const mandatoryChecks = MANDATORY_CHECKS[phaseId] ?? [];
  const failedChecks = evidence.checkResults.filter(
    c => !c.invalidated && c.status === 'Fail' && mandatoryChecks.includes(c.checkType)
  );
  if (failedChecks.length) {
    contributions.push(
      contribution('FailedMandatoryCheck', 'Failed mandatory checks',
        config.weights.failedMandatoryCheck,
        failedChecks.map(c => ({
          id: c.checkId ?? c.checkType,
          label: `${c.checkType} check failed`,
          detail: c.sourceReference
            ? `${c.sourceReference}${c.resultValue ? ` · measured ${c.resultValue}` : ''}`
            : undefined,
          href: `/phase/${phaseId}/checklist`,
        })))
    );
  }

  /* 3 — Missing mandatory evidence. */
  const evidenceStatuses = resolveEvidence(evidence, config);
  const missingEvidence = evidenceStatuses.filter(e => !e.present);
  if (missingEvidence.length) {
    contributions.push(
      contribution('MissingMandatoryEvidence', 'Missing mandatory evidence',
        config.weights.missingMandatoryEvidence,
        missingEvidence.map(e => ({
          id: e.requirement.key,
          label: e.requirement.name,
          detail: e.note,
          href: e.requirement.kind === 'input'
            ? `/phase/${phaseId}/intake`
            : `/phase/${phaseId}`,
        })))
    );
  }

  /* 4 — Actions. One action can be open, overdue AND inherited from an earlier
         gate; each configured rule adds its own points, as specified. */
  const relevantActions = evidence.actions.filter(
    a => !isResolved(a.status, config) && bearsOnGate(a, gateId)
  );

  const openBlocking = relevantActions.filter(a => a.blocking);
  if (openBlocking.length) {
    contributions.push(
      contribution('OpenBlockingAction', 'Open blocking actions',
        config.weights.openBlockingAction,
        openBlocking.map(a => ({
          id: a.actionId,
          label: a.description,
          detail: [
            a.ownerRole,
            typeof a.dueGate === 'number' ? `due Gate ${a.dueGate}` : null,
            blocksGate(a, gateId) ? 'blocks this gate' : 'due at a later gate',
          ].filter(Boolean).join(' · '),
          href: actionHref(a.actionId),
        })))
    );
  }

  const overdue = relevantActions.filter(a => isOverdue(a, gateId));
  if (overdue.length) {
    contributions.push(
      contribution('OverdueAction', 'Overdue actions', config.weights.overdueAction,
        overdue.map(a => ({
          id: a.actionId,
          label: a.description,
          detail: `was due Gate ${a.dueGate} · still ${a.status}`,
          href: actionHref(a.actionId),
        })))
    );
  }

  const priorGate = relevantActions.filter(a => isPriorGate(a, gateId));
  if (priorGate.length) {
    contributions.push(
      contribution('UnclosedPriorGateAction', 'Unclosed prior-gate actions',
        config.weights.unclosedPriorGateAction,
        priorGate.map(a => ({
          id: a.actionId,
          label: a.description,
          detail: `raised at Gate ${a.sourceGate} · still ${a.status}`,
          href: actionHref(a.actionId),
        })))
    );
  }

  /* 5 — Total, capped. */
  const rawScore = contributions.reduce((sum, c) => sum + c.points, 0);
  const score = Math.min(rawScore, config.cap);
  const level: RiskLevel = riskLevelFor(score, config);
  // Every phase and gate gets a real 0–100 score. `phaseStarted` says whether
  // the phase is active or complete — the Product Lifecycle View shows its
  // compact indicator only for those.
  const phaseStarted = !UNSTARTED_PHASE_STATES.has(evidence.phaseState);

  const counts = {
    unresolvedFindings: unresolvedFindings.length,
    openBlockingActions: openBlocking.length,
    overdueActions: overdue.length,
    unclosedPriorGateActions: priorGate.length,
    failedMandatoryChecks: failedChecks.length,
    missingMandatoryEvidence: missingEvidence.length,
  };

  return {
    phaseId,
    gateId,
    score,
    rawScore,
    capped: rawScore > config.cap,
    level,
    display: `Risk: ${score} / ${config.cap}, ${level}`,
    assessed: true,
    phaseStarted,
    contributions,
    drillDown: {
      contributingFindings: unresolvedFindings.map(f => ({
            id: f.findingId,
            label: f.description,
            detail: `${f.severity} · ${f.status}`,
            href: findingHref(f.findingId),
            points: findingWeight(f.severity, config),
          })),
      openActions: relevantActions.map(a => ({
            id: a.actionId,
            label: a.description,
            detail: [
              a.blocking ? 'Blocking' : 'Non-blocking',
              a.ownerRole,
              typeof a.dueGate === 'number' ? `due Gate ${a.dueGate}` : null,
              a.status,
            ].filter(Boolean).join(' · '),
            href: actionHref(a.actionId),
          })),
      failedChecks: failedChecks.map(c => ({
            id: c.checkId ?? c.checkType,
            label: `${c.checkType} check failed`,
            detail: [c.sourceReference, c.resultValue && `measured ${c.resultValue}`,
                     c.threshold && `threshold ${c.threshold}`].filter(Boolean).join(' · '),
            href: `/phase/${phaseId}/checklist`,
          })),
      missingEvidence: missingEvidence.map(e => ({
            id: e.requirement.key,
            label: e.requirement.name,
            detail: e.note,
            href: e.requirement.kind === 'input'
              ? `/phase/${phaseId}/intake`
              : `/phase/${phaseId}`,
          })),
    },
    counts,
    explanation: '',
    configSnapshot: {
      cap: config.cap,
      thresholds: riskBands(config),
      weights: { ...config.weights } as unknown as Record<string, number>,
    },
  };
}

/**
 * Deterministic one-liner for why the score sits in its band. The LLM may
 * replace this with better prose, but it is never required to — and it is never
 * allowed to change the number.
 */
export function describeRiskScore(risk: RiskScore): string {
  if (!risk.phaseStarted && risk.score === 0) {
    return 'This phase has not started and no earlier open work carries into it.';
  }
  if (risk.score === 0) {
    return 'No unresolved findings, failed checks, missing evidence or open actions bear on this gate.';
  }

  const parts: string[] = [];
  const top = [...risk.contributions].sort((a, b) => b.points - a.points).slice(0, 2);
  for (const c of top) {
    // "Major unresolved findings" → "1 major unresolved finding"
    const noun = c.label.toLowerCase();
    parts.push(`${c.count} ${c.count === 1 ? noun.replace(/s$/, '') : noun}`);
  }
  const cappedNote = risk.capped ? ` Raw total was ${risk.rawScore}, capped at ${risk.configSnapshot.cap}.` : '';
  const notStarted = risk.phaseStarted ? '' : ' This phase has not started; the score reflects work carried in from earlier gates.';
  return `${risk.level} risk (${risk.score}/${risk.configSnapshot.cap}): ${parts.join(' and ')} remain open.${cappedNote}${notStarted}`;
}
