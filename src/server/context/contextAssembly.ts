import { db } from '@/db';
import { phaseStates, phaseInputs, actions } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { PHASE_CONFIG_MAP, TECHNICAL_REVIEW_PHASES } from '@/shared/constants/phaseConfig';
import { AgentContext, CompactPhaseSummary } from '@/shared/types/projectState';
import { queryReferenceIndex } from './referenceIndex';

/**
 * Build a token-optimized agent context for a phase agent.
 * RULE: Never include full prior-phase documents. Only compact summaries.
 * RULE: Only active inputs for the current phase — no historical inputs.
 * RULE: Only open actions affecting this phase.
 * RULE: Max 5 checklist items for mapped phases (0, 1, 3, 4), 0 for others.
 * RULE: Max 3 standards rules from EVINV-POC-STD-001.
 */
export async function buildAgentContext(
  projectId: string,
  phaseId: number
): Promise<AgentContext> {
  const config = PHASE_CONFIG_MAP[phaseId as keyof typeof PHASE_CONFIG_MAP];

  // 1. Get compact summaries of all APPROVED upstream phases only
  // reads compact_phase_summary JSONB column — NOT full prior-phase documents
  const upstreamPhaseRows = await db.select().from(phaseStates)
    .where(and(
      eq(phaseStates.projectId, projectId),
      inArray(phaseStates.phaseState, ['GatePassed', 'GateConditional'] as string[]),
    ));

  const upstreamSummaries: CompactPhaseSummary[] = upstreamPhaseRows
    .filter(p => (p.phaseId as number) < phaseId)
    .map(p => {
      const summary = p.compactPhaseSummary as CompactPhaseSummary | null;
      return summary ?? {
        phaseId: p.phaseId as number,
        phaseName: PHASE_CONFIG_MAP[p.phaseId as keyof typeof PHASE_CONFIG_MAP]?.phaseName ?? `Phase ${p.phaseId}`,
        outcome: p.phaseState === 'GatePassed' ? 'Pass' : 'Conditional Pass',
        keyFindings: [],
        openActions: [],
        approvedOutputs: [],
      } satisfies CompactPhaseSummary;
    });

  // 2. Get active inputs for THIS phase only
  const inputs = await db.select().from(phaseInputs)
    .where(and(
      eq(phaseInputs.projectId, projectId),
      eq(phaseInputs.phaseId, phaseId as unknown as number),
    ));

  const externalInput = inputs.find(i => i.inputRole === 'external');
  const internalInput = inputs.find(i => i.inputRole === 'internal');

  // 3. Get open blocking actions affecting this phase
  const openActions = await db.select().from(actions)
    .where(and(
      eq(actions.blocking, true),
      inArray(actions.status, ['Open', 'InProgress', 'ClosedPendingVerification'] as string[]),
    ));

  const openBlockingActions = openActions
    .filter(a => (a.duePhase as number) >= phaseId)
    .map(a => ({
      actionId: a.actionId,
      description: a.description,
      sourcePhase: a.sourcePhase as number,
    }));

  // 4. Get applicable checklist items (only for phases 0, 1, 3, 4)
  let applicableChecklistItems: string[] = [];
  if (TECHNICAL_REVIEW_PHASES.has(phaseId)) {
    const passages = await queryReferenceIndex(`checklist phase ${phaseId}`, phaseId, 5);
    applicableChecklistItems = passages.map(p => `[${p.docId} §${p.section}] ${p.content}`);
  }

  // 5. Get applicable standards rules (max 3)
  const standardsPassages = await queryReferenceIndex(`standards rules phase ${phaseId}`, phaseId, 3);
  const applicableStandardsRules = standardsPassages.map(p => `[${p.docId}] ${p.content}`);

  return {
    projectId,
    phaseId,
    phaseName: config?.phaseName ?? `Phase ${phaseId}`,
    technicalReview: TECHNICAL_REVIEW_PHASES.has(phaseId)
      ? (config as { technicalReview: string | null })?.technicalReview ?? null
      : null,
    activeExternalInput: externalInput ? {
      logicalName: externalInput.logicalName,
      behavior: externalInput.intakeBehavior,
      systemRepresented: externalInput.systemRepresented,
    } : null,
    activeInternalInput: internalInput ? {
      logicalName: internalInput.logicalName,
      behavior: internalInput.intakeBehavior,
      systemRepresented: internalInput.systemRepresented,
    } : null,
    upstreamSummaries,   // Compact summaries only — NOT full documents
    openBlockingActions,
    applicableChecklistItems,
    applicableStandardsRules,
    // Token budget varies by phase complexity
    maxOutputTokens: [3, 4].includes(phaseId) ? 32000 : 16000,
  };
}
