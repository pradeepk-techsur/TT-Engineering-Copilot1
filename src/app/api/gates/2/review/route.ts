import { NextResponse } from 'next/server';
import { db } from '@/db';
import { phaseStates, phaseOutputs, phaseInputs, gateDecisions, findings as findingsTable, actions, checkResults } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET() {
  const PROJECT_ID = 'EVINV-POC-001';
  const GATE = 2;

  const [phase] = await db.select().from(phaseStates)
    .where(and(eq(phaseStates.projectId, PROJECT_ID), eq(phaseStates.phaseId, GATE as any)));

  const outputs = await db.select().from(phaseOutputs)
    .where(and(eq(phaseOutputs.projectId, PROJECT_ID), eq(phaseOutputs.phaseId, GATE as any)));

  const inputs = await db.select().from(phaseInputs)
    .where(and(eq(phaseInputs.projectId, PROJECT_ID), eq(phaseInputs.phaseId, GATE as any)));

  const allFindings = await db.select().from(findingsTable)
    .where(eq(findingsTable.sourcePhase, GATE as any));

  // SI-01: Include seeded findings prominently for gate review
  const seededFindings = allFindings.filter(f => f.seeded);

  const openActions = await db.select().from(actions)
    .where(eq(actions.sourcePhase, GATE as any));

  const decisions = await db.select().from(gateDecisions)
    .where(eq(gateDecisions.gateNumber, GATE as any));

  // Include deterministic check results for transparency
  const deterministicChecks = await db.select().from(checkResults)
    .where(eq(checkResults.phaseId, GATE as any));

  const aiRecommendation = phase?.aiRecommendation as any;

  return NextResponse.json({
    gateNumber: GATE,
    phaseName: 'Phase 2 — Requirements Definition',
    gateState: phase?.gateState ?? 'Locked',
    inputs: inputs.map(i => ({
      logicalName: i.logicalName,
      inputRole: i.inputRole,
      intakeBehavior: i.intakeBehavior,
      readinessStatus: i.readinessStatus,
    })),
    outputs: outputs.slice(0, 2),
    findings: allFindings,
    seededFindings,  // SI-01 prominently surfaced for gate review
    deterministicChecks,  // RequirementTestability check results
    openActions,
    aiRecommendation: aiRecommendation ? {
      ...aiRecommendation,
      advisoryLabel: 'Advisory Only — Human Decision Required',
    } : null,
    decisionHistory: decisions,
  });
}
