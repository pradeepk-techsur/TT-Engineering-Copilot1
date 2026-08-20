/**
 * Assemble the structured evidence a gate is scored against.
 *
 * Reads whatever is already recorded — phase state, intake readiness, phase
 * outputs, findings, actions, deterministic-check results, and the compact
 * phase summary the phase agent already wrote. Nothing new is created and no
 * document content is loaded here: the risk engine and the advisory need
 * structure and short excerpts, not whole artifacts.
 *
 * Falls back to the same mock data every other route uses, so Preview mode
 * scores identically to a live database.
 */

import {
  MOCK_PHASE_STATES, MOCK_FINDINGS, MOCK_ACTIONS, MOCK_INPUTS, mockPhaseOutputs,
} from '@/lib/mockData';
import { PHASE_CONFIG } from '@/shared/constants/phaseConfig';
import type {
  RiskEvidence, FindingLike, ActionLike, CheckLike, InputLike, OutputLike,
} from './riskScoreEngine';

const PROJECT_ID = 'EVINV-POC-001';

/**
 * Derived, never duplicated. Phase names change — this map was hand-copied
 * once and immediately went stale when they were renamed, so it now reads
 * straight from the one place that defines them.
 */
export const PHASE_NAMES: Record<number, string> = Object.fromEntries(
  PHASE_CONFIG.map(c => [c.phaseId, c.phaseName])
);

export function phaseLabel(phaseId: number): string {
  return `Phase ${phaseId} — ${PHASE_NAMES[phaseId] ?? 'Unknown'}`;
}

/** Structured content the phase already produced. Reused, never regenerated. */
export interface CompactPhaseSummary {
  phaseId?: number;
  phaseName?: string;
  outcome?: string;
  keyFindings?: string[];
  openActions?: string[];
  approvedOutputs?: readonly string[];
  approvedAt?: string;
}

export interface AssembledEvidence extends RiskEvidence {
  phaseName: string;
  gateState: string;
  /** The phase agent's own recommendation, if it wrote one. */
  seededRecommendation: {
    recommendedOutcome?: string;
    rationale?: string;
    findingsCited?: string[];
    checksCited?: string[];
  } | null;
  compactSummary: CompactPhaseSummary | null;
  /** Compact summaries of every gate already decided — prior-gate context. */
  priorSummaries: CompactPhaseSummary[];
  /** Passing checks, so Key Strengths can cite them. */
  passedChecks: CheckLike[];
  /** Findings closed in this phase, so Key Strengths can cite them. */
  closedFindings: FindingLike[];
  /**
   * Findings closed in EARLIER phases. A prior clarification that was resolved
   * is a real, evidence-backed strength at this gate.
   */
  priorClosedFindings: FindingLike[];
  /** Actions closed at or before this gate, so Key Strengths can cite them. */
  closedActions: ActionLike[];
  /**
   * Every finding in the project, by id. Lets the advisory name the finding
   * behind an action inherited from an earlier gate without re-querying.
   */
  findingsIndex: Record<string, FindingLike>;
  /** True when the numbers came from mock data rather than the database. */
  previewMode: boolean;
}

function normaliseFinding(f: Record<string, unknown>): FindingLike {
  return {
    findingId: String(f.findingId ?? ''),
    sourcePhase: Number(f.sourcePhase ?? 0),
    sourceGate: f.sourceGate === null || f.sourceGate === undefined ? undefined : Number(f.sourceGate),
    description: String(f.description ?? ''),
    severity: String(f.severity ?? 'Minor'),
    status: String(f.status ?? 'Open'),
    detectedBy: f.detectedBy ? String(f.detectedBy) : undefined,
    checkId: (f.checkId as string | null | undefined) ?? null,
  };
}

function normaliseAction(a: Record<string, unknown>): ActionLike {
  return {
    actionId: String(a.actionId ?? ''),
    sourceFindingId: a.sourceFindingId ? String(a.sourceFindingId) : undefined,
    sourcePhase: Number(a.sourcePhase ?? 0),
    sourceGate: Number(a.sourceGate ?? a.sourcePhase ?? 0),
    description: String(a.description ?? ''),
    ownerRole: a.ownerRole ? String(a.ownerRole) : undefined,
    blocking: a.blocking === true,
    parallel: a.parallel === true,
    duePhase: a.duePhase === null || a.duePhase === undefined ? null : Number(a.duePhase),
    dueGate: a.dueGate === null || a.dueGate === undefined ? null : Number(a.dueGate),
    status: String(a.status ?? 'Open'),
    requiredClosureEvidence: a.requiredClosureEvidence ? String(a.requiredClosureEvidence) : undefined,
    closureEvidenceArtifactId: (a.closureEvidenceArtifactId as string | null | undefined) ?? null,
  };
}

function normaliseCheck(c: Record<string, unknown>): CheckLike {
  return {
    checkId: c.checkId ? String(c.checkId) : undefined,
    checkType: String(c.checkType ?? ''),
    phaseId: Number(c.phaseId ?? 0),
    status: String(c.status ?? 'Pending'),
    sourceReference: c.sourceReference ? String(c.sourceReference) : undefined,
    resultValue: c.resultValue ? String(c.resultValue) : undefined,
    threshold: c.threshold ? String(c.threshold) : undefined,
    invalidated: c.invalidated === true,
  };
}

const RESOLVED = new Set(['VerifiedClosed', 'Closed', 'Waived']);

function finish(
  base: Omit<AssembledEvidence,
    'passedChecks' | 'closedFindings' | 'closedActions' | 'priorClosedFindings'
    | 'findingsIndex'>
    & { allFindings?: FindingLike[] }
): AssembledEvidence {
  const allFindings = base.allFindings ?? [];
  const priorClosedFindings = allFindings
    .filter(f => f.sourcePhase < base.phaseId && RESOLVED.has(f.status));
  const findingsIndex: Record<string, FindingLike> = {};
  for (const f of [...allFindings, ...base.findings]) findingsIndex[f.findingId] = f;
  return {
    ...base,
    priorClosedFindings,
    findingsIndex,
    passedChecks: base.checkResults.filter(c => !c.invalidated && c.status === 'Pass'),
    closedFindings: base.findings.filter(f => RESOLVED.has(f.status)),
    closedActions: base.actions.filter(
      a => RESOLVED.has(a.status) && a.sourceGate <= base.gateId
    ),
  };
}

/* ── Mock assembly ─────────────────────────────────────────────────────── */

function assembleFromMock(phaseId: number): AssembledEvidence {
  const phase = MOCK_PHASE_STATES.find(p => p.phaseId === phaseId);
  const mockInputs = MOCK_INPUTS[phaseId];
  const phaseState = phase?.phaseState ?? 'Pending';

  const inputs: InputLike[] = mockInputs
    ? [
        {
          inputRole: 'external',
          logicalName: mockInputs.external.logicalName,
          readinessStatus: mockInputs.external.readyStatus,
        },
        {
          inputRole: 'internal',
          logicalName: mockInputs.internal.logicalName,
          readinessStatus: mockInputs.internal.readyStatus,
        },
      ]
    : [];

  // One source of truth with the outputs routes, so a phase cannot look as
  // though it produced its artifacts on the workspace but not at the gate.
  const outputs: OutputLike[] = mockPhaseOutputs(phaseId).map(o => ({
    outputId: o.outputId,
    outputName: o.outputName,
    approvalStatus: o.approvalStatus,
    artifactId: o.artifactId,
  }));

  return finish({
    phaseId,
    gateId: phaseId,
    phaseName: phaseLabel(phaseId),
    phaseState,
    gateState: phase?.gateState ?? 'Locked',
    findings: MOCK_FINDINGS.filter(f => f.sourcePhase === phaseId).map(f =>
      normaliseFinding(f as unknown as Record<string, unknown>)
    ),
    actions: MOCK_ACTIONS.map(a => normaliseAction(a as unknown as Record<string, unknown>)),
    allFindings: MOCK_FINDINGS.map(f =>
      normaliseFinding(f as unknown as Record<string, unknown>)
    ),
    checkResults: [],
    inputs,
    outputs,
    seededRecommendation: (phase?.aiRecommendation as AssembledEvidence['seededRecommendation']) ?? null,
    compactSummary: (phase?.compactPhaseSummary as unknown as CompactPhaseSummary | null) ?? null,
    priorSummaries: MOCK_PHASE_STATES
      .filter(p => p.phaseId < phaseId && p.compactPhaseSummary)
      .map(p => p.compactPhaseSummary as unknown as CompactPhaseSummary),
    previewMode: true,
  });
}

/* ── Database assembly ─────────────────────────────────────────────────── */

export async function assembleEvidence(phaseId: number): Promise<AssembledEvidence> {
  try {
    const { db } = await import('@/db');
    const schema = await import('@/db/schema');
    const { eq, and, lt } = await import('drizzle-orm');

    const [phase] = await db.select().from(schema.phaseStates).where(
      and(
        eq(schema.phaseStates.projectId, PROJECT_ID),
        eq(schema.phaseStates.phaseId, phaseId as never)
      )
    );
    if (!phase) throw new Error('NO_PHASE_STATE');

    const [outputs, inputs, allFindings, allActions, checks, priorPhases] = await Promise.all([
      db.select().from(schema.phaseOutputs).where(
        and(
          eq(schema.phaseOutputs.projectId, PROJECT_ID),
          eq(schema.phaseOutputs.phaseId, phaseId as never)
        )
      ),
      db.select().from(schema.phaseInputs).where(
        and(
          eq(schema.phaseInputs.projectId, PROJECT_ID),
          eq(schema.phaseInputs.phaseId, phaseId as never)
        )
      ),
      db.select().from(schema.findings),
      // Every action: prior-gate and overdue rules need the whole set.
      db.select().from(schema.actions),
      db.select().from(schema.checkResults).where(eq(schema.checkResults.phaseId, phaseId as never)),
      db.select().from(schema.phaseStates).where(
        and(
          eq(schema.phaseStates.projectId, PROJECT_ID),
          lt(schema.phaseStates.phaseId, phaseId as never)
        )
      ),
    ]);

    return finish({
      phaseId,
      gateId: phaseId,
      phaseName: phaseLabel(phaseId),
      phaseState: String(phase.phaseState),
      gateState: String(phase.gateState),
      findings: allFindings
        .filter(f => Number(f.sourcePhase) === phaseId)
        .map(f => normaliseFinding(f as unknown as Record<string, unknown>)),
      allFindings: allFindings.map(f => normaliseFinding(f as unknown as Record<string, unknown>)),
      actions: allActions.map(a => normaliseAction(a as unknown as Record<string, unknown>)),
      checkResults: checks.map(c => normaliseCheck(c as unknown as Record<string, unknown>)),
      inputs: inputs.map(i => ({
        inputRole: String(i.inputRole),
        logicalName: String(i.logicalName),
        readinessStatus: String(i.readinessStatus),
      })),
      outputs: outputs.map(o => ({
        outputId: String(o.outputId),
        outputName: String(o.outputName),
        approvalStatus: String(o.approvalStatus),
        artifactId: o.artifactId ?? null,
      })),
      seededRecommendation:
        (phase.aiRecommendation as AssembledEvidence['seededRecommendation']) ?? null,
      compactSummary: (phase.compactPhaseSummary as CompactPhaseSummary | null) ?? null,
      priorSummaries: priorPhases
        .filter(p => p.compactPhaseSummary)
        .map(p => p.compactPhaseSummary as CompactPhaseSummary),
      previewMode: false,
    });
  } catch {
    return assembleFromMock(phaseId);
  }
}

export { assembleFromMock };
