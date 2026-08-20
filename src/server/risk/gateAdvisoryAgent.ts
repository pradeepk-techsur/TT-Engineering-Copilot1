/**
 * The LLM half of the gate advisory.
 *
 * The model writes prose: the recommendation, its rationale, and the
 * strength / risk / next-step summaries. It never computes the Overall Risk
 * Score — the number is passed IN, already calculated by `riskScoreEngine`.
 *
 * Grounding is enforced on both sides of the call:
 *   • the prompt carries only gate criteria, the already-composed candidate
 *     strengths and risks, structured findings, the numeric score, open
 *     actions, failed checks, missing evidence, and short output excerpts —
 *     never a whole output document, and never the same document twice; and
 *   • the reply is validated on the way back. An outcome the configured rules
 *     forbid is replaced. A strength, risk or next step that does not map to a
 *     ref we sent is dropped rather than displayed.
 */

import { BaseAgent } from '@/server/agents/base/agentBase';
import type { AgentResult } from '@/server/agents/base/agentTypes';
import { GATE_CRITERIA } from '@/shared/config/gateCriteria';
import {
  ADVISORY_LABEL, MAX_ITEMS, limitToSentences, rankRisks, dedupeSteps,
} from './advisoryComposer';
import { clampOutcome, type GateRuleEvaluation } from './gateRules';
import type { AssembledEvidence } from './evidenceAssembly';
import type {
  GateAdvisory, KeyStrength, KeyRisk, NextStep, RiskScore,
} from '@/shared/types/risk';

/** What the model is allowed to see. Compact by construction. */
interface GroundingPayload {
  gate: number;
  phaseName: string;
  gateCriteria: string[];
  riskScore: { score: number; cap: number; level: string; contributions: string[] };
  candidateStrengths: { id: string; statement: string; evidence: string }[];
  candidateRisks: { id: string; statement: string; level: string; blocking: boolean }[];
  structuredFindings: { id: string; severity: string; status: string; description: string }[];
  openActions: {
    id: string; description: string; owner?: string; blocking: boolean;
    parallel: boolean; dueGate: number | null;
  }[];
  failedChecks: { id: string; label: string }[];
  missingEvidence: { id: string; label: string }[];
  priorGateActionStatus: { id: string; sourceGate: number; status: string }[];
  outputExcerpts: { name: string; approvalStatus: string }[];
  allowedOutcomes: string[];
  ruleOutcome: string;
  ruleReasons: string[];
}

interface LlmAdvisoryReply {
  recommendedOutcome?: string;
  rationale?: string;
  keyStrengths?: { id?: string; statement?: string }[];
  keyRisks?: { id?: string; statement?: string }[];
  nextSteps?: { id?: string; statement?: string }[];
  riskExplanation?: string;
}

const SYSTEM_PROMPT = `You are the TT Engineering Copilot gate advisor.

You write an ADVISORY gate recommendation. An authorised human reviewer makes the
final Pass, Conditional Pass or Fail decision — you never decide, approve or reject.

Hard rules:
1. You do NOT calculate the Overall Risk Score. It is given to you, already
   computed from structured rules. Never contradict it and never restate it as a
   different number.
2. Your recommendedOutcome MUST be one of the allowedOutcomes given to you. The
   configured gate rules produced that list; recommending anything else is a
   rule conflict and will be discarded.
3. Every keyStrength, keyRisk and nextStep MUST reference the "id" of an item
   supplied in the grounding payload. Never introduce an item that is not there.
   Never invent a finding, action, check, requirement or artifact.
4. Maximum three key strengths, three key risks, three next steps.
5. The rationale is TWO or THREE sentences: what is sufficiently complete, what
   remains unresolved, whether the unresolved items are blocking, and why the
   recommended outcome follows.
6. Never claim live system connectivity. This is synthetic POC data.

Reply with JSON only, no prose outside it, in exactly this shape:
{"recommendedOutcome":"Pass|Conditional Pass|Fail",
 "rationale":"two or three sentences",
 "riskExplanation":"one sentence on why the score sits in its band",
 "keyStrengths":[{"id":"<grounding id>","statement":"one concise sentence"}],
 "keyRisks":[{"id":"<grounding id>","statement":"short risk statement"}],
 "nextSteps":[{"id":"<grounding id>","statement":"one imperative sentence"}]}`;

export class GateAdvisoryAgent extends BaseAgent {
  constructor(gateId: number) {
    super(gateId, `GateAdvisoryAgent-G${gateId}`, 2000);
  }

  /** Not used — the advisory agent produces no artifacts. */
  async run(): Promise<AgentResult> {
    throw new Error('GateAdvisoryAgent produces an advisory, not phase outputs.');
  }

  async generate(
    evidence: AssembledEvidence,
    risk: RiskScore,
    rules: GateRuleEvaluation,
    fallback: GateAdvisory
  ): Promise<{ advisory: GateAdvisory; riskExplanation: string }> {
    const payload = buildGrounding(evidence, risk, rules, fallback);
    const raw = await this.callLLM(
      `Gate advisory request. Grounding payload:\n${JSON.stringify(payload, null, 1)}`,
      SYSTEM_PROMPT,
      2000
    );
    const reply = parseJson(raw);
    if (!reply) throw new Error('ADVISORY_UNPARSEABLE');
    return {
      advisory: validate(reply, fallback, rules),
      riskExplanation: riskExplanationFrom(reply),
    };
  }
}

/* ── Prompt construction ───────────────────────────────────────────────── */

const RESOLVED = new Set(['VerifiedClosed', 'Closed', 'Waived']);

export function buildGrounding(
  evidence: AssembledEvidence,
  risk: RiskScore,
  rules: GateRuleEvaluation,
  candidates: GateAdvisory
): GroundingPayload {
  return {
    gate: evidence.gateId,
    phaseName: evidence.phaseName,
    gateCriteria: GATE_CRITERIA[evidence.phaseId] ?? [],
    riskScore: {
      score: risk.score,
      cap: risk.configSnapshot.cap,
      level: risk.level,
      contributions: risk.contributions.map(c => `${c.count} × ${c.label} (${c.points} pts)`),
    },
    candidateStrengths: candidates.keyStrengths.map(s => ({
      id: s.evidence.id,
      statement: s.statement,
      evidence: s.evidence.label,
    })),
    candidateRisks: candidates.keyRisks.map(r => ({
      id: r.detail.findingId ?? r.detail.actionId ?? r.statement,
      statement: r.statement,
      level: r.level,
      blocking: r.blocking,
    })),
    structuredFindings: evidence.findings
      .filter(f => !RESOLVED.has(f.status))
      .map(f => ({
        id: f.findingId,
        severity: f.severity,
        status: f.status,
        description: f.description,
      })),
    openActions: evidence.actions
      .filter(a => !RESOLVED.has(a.status))
      .map(a => ({
        id: a.actionId,
        description: a.description,
        owner: a.ownerRole,
        blocking: a.blocking === true,
        parallel: a.parallel === true,
        dueGate: a.dueGate ?? null,
      })),
    failedChecks: risk.drillDown.failedChecks.map(c => ({ id: c.id, label: c.label })),
    missingEvidence: risk.drillDown.missingEvidence.map(e => ({ id: e.id, label: e.label })),
    priorGateActionStatus: evidence.actions
      .filter(a => a.sourceGate < evidence.gateId)
      .map(a => ({ id: a.actionId, sourceGate: a.sourceGate, status: a.status })),
    // Names and approval state only — the document body is never sent.
    outputExcerpts: evidence.outputs.map(o => ({
      name: o.outputName,
      approvalStatus: o.approvalStatus,
    })),
    allowedOutcomes: rules.allowedOutcomes,
    ruleOutcome: rules.ruleOutcome,
    ruleReasons: rules.failReasons.length ? rules.failReasons : rules.passBlockers,
  };
}

/* ── Reply validation ──────────────────────────────────────────────────── */

function parseJson(text: string): LlmAdvisoryReply | null {
  const trimmed = text.trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(trimmed.slice(start, end + 1)) as LlmAdvisoryReply;
  } catch {
    return null;
  }
}

/**
 * Keep the model's words, keep our structure. Each returned item is matched
 * back to a candidate by id; anything unmatched is dropped, so an ungrounded
 * sentence can never reach the screen with a link that does not exist.
 */
export function validate(
  reply: LlmAdvisoryReply,
  fallback: GateAdvisory,
  rules: GateRuleEvaluation
): GateAdvisory {
  const { outcome, overridden } = clampOutcome(reply.recommendedOutcome, rules);

  const strengthById = new Map(fallback.keyStrengths.map(s => [s.evidence.id, s]));
  const riskById = new Map<string, KeyRisk>();
  for (const r of fallback.keyRisks) {
    const key = r.detail.findingId ?? r.detail.actionId ?? r.statement;
    riskById.set(key, r);
  }
  const stepById = new Map(fallback.nextSteps.map(s => [s.source.id, s]));

  const keyStrengths: KeyStrength[] = (reply.keyStrengths ?? [])
    .map(item => {
      const base = item.id ? strengthById.get(item.id) : undefined;
      if (!base) return null;
      return { ...base, statement: sentenceOf(item.statement) || base.statement };
    })
    .filter((s): s is KeyStrength => s !== null)
    .slice(0, MAX_ITEMS);

  const keyRisks: KeyRisk[] = rankRisks(
    (reply.keyRisks ?? [])
      .map(item => {
        const base = item.id ? riskById.get(item.id) : undefined;
        if (!base) return null;
        return { ...base, statement: sentenceOf(item.statement) || base.statement };
      })
      .filter((r): r is KeyRisk => r !== null)
  ).slice(0, MAX_ITEMS);

  const nextSteps: NextStep[] = dedupeSteps(
    (reply.nextSteps ?? [])
      .map(item => {
        const base = item.id ? stepById.get(item.id) : undefined;
        if (!base) return null;
        return { ...base, statement: sentenceOf(item.statement) || base.statement };
      })
      .filter((s): s is NextStep => s !== null)
  ).slice(0, MAX_ITEMS);

  const rationale = limitToSentences(reply.rationale ?? '', 3);

  return {
    ...fallback,
    recommendedOutcome: outcome,
    // If the model produced nothing usable for a section, keep the structured
    // version rather than showing an empty panel.
    rationale: rationale || fallback.rationale,
    keyStrengths: keyStrengths.length ? keyStrengths : fallback.keyStrengths,
    keyRisks: keyRisks.length ? keyRisks : fallback.keyRisks,
    nextSteps: nextSteps.length ? nextSteps : fallback.nextSteps,
    findingsCited: keyRisks.length
      ? keyRisks.map(r => r.detail.findingId).filter((v): v is string => !!v)
      : fallback.findingsCited,
    actionsCited: nextSteps.length
      ? nextSteps.filter(s => s.sourceKind === 'Action' || s.sourceKind === 'GateCondition')
          .map(s => s.source.id)
      : fallback.actionsCited,
    advisoryLabel: ADVISORY_LABEL,
    generatedBy: 'LLM',
    ruleOverrideApplied: overridden,
    ruleOutcome: rules.ruleOutcome,
    allowedOutcomes: rules.allowedOutcomes,
  };
}

function sentenceOf(text: string | undefined): string {
  const t = (text ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return '';
  const capped = t.charAt(0).toUpperCase() + t.slice(1);
  return /[.!?…]$/.test(capped) ? capped : `${capped}.`;
}

/**
 * The model may explain why the score sits in its band. It states the level,
 * never a different number — the number stays whatever the engine computed.
 */
export function riskExplanationFrom(reply: LlmAdvisoryReply | null): string {
  return sentenceOf(reply?.riskExplanation);
}
