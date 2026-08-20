/**
 * Preserved gate decisions.
 *
 * A gate decision has two halves that must both survive: what the AI advised
 * (outcome, rationale, risk score, key strengths, key risks, next steps) and
 * what the human decided (outcome, rationale, role, timestamp, artifact
 * versions reviewed). Both are written into `gate_decisions.ai_recommendation`
 * / the decision row itself, so the audit trail can always show them side by
 * side — including when the human overrode the AI.
 *
 * When the database is unavailable the app runs in Preview mode. Rather than
 * failing the decision outright — which would make the human-authority flow
 * undemonstrable — decisions are held in a process-local store with exactly the
 * same shape. It is explicitly not durable, and every record it returns is
 * marked `previewOnly`.
 */

import type { GateAdvisory, GateDecisionRecord, GateOutcome, RiskLevel } from '@/shared/types/risk';
import { MOCK_GATE_DECISIONS, MOCK_PHASE_STATES } from '@/lib/mockData';
import { phaseLabel } from './evidenceAssembly';

export interface DecisionInput {
  gateNumber: number;
  phaseName: string;
  decision: GateOutcome;
  reviewerRole: string;
  comments: string;
  /** Required when `decision` differs from the AI recommendation. */
  humanRationale: string;
  advisory: GateAdvisory | null;
  riskScore: { score: number; level: RiskLevel; display: string } | null;
  artifactVersionsReviewed: string[];
}

/** Everything the audit trail must keep for one decision. */
export function toDecisionRecord(
  input: DecisionInput,
  decisionId: string,
  timestamp: string
): GateDecisionRecord {
  return {
    decisionId,
    gateNumber: input.gateNumber,
    phaseName: input.phaseName,
    aiRecommendation: input.advisory,
    riskScore: input.riskScore,
    decision: input.decision,
    reviewerRole: input.reviewerRole,
    humanRationale: input.humanRationale,
    comments: input.comments,
    artifactVersionsReviewed: input.artifactVersionsReviewed,
    timestamp,
    divergedFromAi:
      !!input.advisory && input.advisory.recommendedOutcome !== input.decision,
  };
}

/* ── Preview-mode store ────────────────────────────────────────────────── */

/**
 * Held on `globalThis`, not in a module-level `const`.
 *
 * Route handlers are compiled into separate bundles, so in dev each one gets
 * its OWN instance of a module-scoped variable — a decision written by
 * `/api/gates/3/decide` was invisible to `/api/gates/3/advisory`. The process
 * global is the one thing they genuinely share, and it survives HMR too.
 */
interface PreviewStore {
  decisions: GateDecisionRecord[];
  seq: number;
}

const STORE_KEY = '__ttGatePreviewDecisions__';

function store(): PreviewStore {
  const g = globalThis as typeof globalThis & { [STORE_KEY]?: PreviewStore };
  if (!g[STORE_KEY]) g[STORE_KEY] = { decisions: [], seq: 0 };
  return g[STORE_KEY];
}

export function recordPreviewDecision(input: DecisionInput): GateDecisionRecord {
  const s = store();
  s.seq += 1;
  const record = toDecisionRecord(
    input,
    `preview-decision-${input.gateNumber}-${s.seq}`,
    new Date().toISOString()
  );
  s.decisions.push(record);
  return record;
}

export function previewDecisionsFor(gateNumber: number): GateDecisionRecord[] {
  return store().decisions.filter(d => d.gateNumber === gateNumber);
}

/** Test seam. */
export function clearPreviewDecisions(): void {
  const s = store();
  s.decisions.length = 0;
  s.seq = 0;
}

/**
 * Preview mode still has to enforce the same rule the state machine enforces:
 * a gate can only be decided while it is open, and only once.
 */
export function previewGateIsOpen(gateNumber: number): boolean {
  if (store().decisions.some(d => d.gateNumber === gateNumber)) return false;
  const phase = MOCK_PHASE_STATES.find(p => p.phaseId === gateNumber);
  return phase?.phaseState === 'AwaitingGate';
}

/* ── Reading decisions back ────────────────────────────────────────────── */

function fromMockSeed(gateNumber: number): GateDecisionRecord[] {
  return MOCK_GATE_DECISIONS.filter(d => d.gateNumber === gateNumber).map(d => ({
    decisionId: d.decisionId,
    gateNumber: d.gateNumber,
    phaseName: d.phaseName,
    aiRecommendation: d.aiRecommendation
      ? ({
          ...(d.aiRecommendation as unknown as GateAdvisory),
          keyStrengths: [],
          keyRisks: [],
          nextSteps: [],
        } as GateAdvisory)
      : null,
    riskScore: null,
    decision: d.decision as GateOutcome,
    reviewerRole: d.reviewerRole,
    humanRationale: d.humanDisposition ?? '',
    comments: d.comments ?? '',
    artifactVersionsReviewed: [],
    timestamp: d.timestamp,
    divergedFromAi:
      (d.aiRecommendation as { recommendedOutcome?: string } | null)?.recommendedOutcome !==
      d.decision,
  }));
}

/** Database first, then the seeded mock decisions, plus anything recorded here. */
export async function listDecisionRecords(gateNumber: number): Promise<GateDecisionRecord[]> {
  try {
    const { db } = await import('@/db');
    const { gateDecisions } = await import('@/db/schema');
    const { eq, asc } = await import('drizzle-orm');

    const rows = await db.select().from(gateDecisions)
      .where(eq(gateDecisions.gateNumber, gateNumber as never))
      .orderBy(asc(gateDecisions.timestamp));

    return rows.map(row => {
      const stored = (row.aiRecommendation ?? {}) as Record<string, unknown>;
      const advisory = (stored.advisory ?? null) as GateAdvisory | null;
      const legacy = advisory
        ? null
        : (stored.recommendedOutcome ? (stored as unknown as GateAdvisory) : null);
      const ai = advisory ?? legacy;
      return {
        decisionId: String(row.decisionId),
        gateNumber: Number(row.gateNumber),
        phaseName: row.phaseName || phaseLabel(Number(row.gateNumber)),
        aiRecommendation: ai,
        riskScore: (stored.riskScore ?? null) as GateDecisionRecord['riskScore'],
        decision: String(row.decision) as GateOutcome,
        reviewerRole: String(row.reviewerRole),
        humanRationale: String(stored.humanRationale ?? row.humanDisposition ?? ''),
        comments: String(row.comments ?? ''),
        artifactVersionsReviewed: (row.artifactVersionsReviewed as string[] | null) ?? [],
        timestamp: String(row.timestamp),
        divergedFromAi: !!ai && ai.recommendedOutcome !== row.decision,
      } satisfies GateDecisionRecord;
    });
  } catch {
    return [...fromMockSeed(gateNumber), ...previewDecisionsFor(gateNumber)];
  }
}

/**
 * Preview-mode decisions rendered as audit events, so the audit log shows the
 * AI recommendation and the human decision side by side even without a
 * database behind it.
 */
export function previewDecisionAuditEvents(): {
  auditId: string;
  eventType: string;
  phaseId: number;
  description: string;
  actor: string;
  timestamp: string;
  intakeEvent: null;
  gateDecision: {
    aiRecommendation: string | null;
    aiRationale: string | null;
    riskScore: number | null;
    riskLevel: string | null;
    decision: string;
    humanRationale: string;
    divergedFromAi: boolean;
    keyStrengths: string[];
    keyRisks: string[];
    nextSteps: string[];
  };
}[] {
  return store().decisions.map(d => ({
    auditId: `audit-${d.decisionId}`,
    eventType: 'GateDecision',
    phaseId: d.gateNumber,
    description:
      `Gate ${d.gateNumber} decided: ${d.decision} by ${d.reviewerRole}` +
      (d.aiRecommendation?.recommendationAvailable
        ? ` — AI recommended ${d.aiRecommendation.recommendedOutcome} ` +
          `(${d.divergedFromAi ? 'human overrode' : 'human agreed'})` +
          (d.riskScore ? `, risk ${d.riskScore.score}/100 ${d.riskScore.level}` : '')
        : ''),
    actor: d.reviewerRole,
    timestamp: d.timestamp,
    intakeEvent: null,
    gateDecision: {
      aiRecommendation: d.aiRecommendation?.recommendedOutcome ?? null,
      aiRationale: d.aiRecommendation?.rationale ?? null,
      riskScore: d.riskScore?.score ?? null,
      riskLevel: d.riskScore?.level ?? null,
      decision: d.decision,
      humanRationale: d.humanRationale,
      divergedFromAi: d.divergedFromAi,
      keyStrengths: (d.aiRecommendation?.keyStrengths ?? []).map(s => s.statement),
      keyRisks: (d.aiRecommendation?.keyRisks ?? []).map(
        r => `${r.statement} (${r.level}, ${r.blocking ? 'blocking' : 'non-blocking'})`
      ),
      nextSteps: (d.aiRecommendation?.nextSteps ?? []).map(s => s.statement),
    },
  }));
}
