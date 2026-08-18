import { NextResponse } from 'next/server';
import { db } from '@/db';
import { phaseStates, phaseOutputs, phaseInputs, gateDecisions, findings as findingsTable, actions, checkResults } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET() {
  const PROJECT_ID = 'EVINV-POC-001';
  const GATE = 4;

  const [phase] = await db.select().from(phaseStates)
    .where(and(eq(phaseStates.projectId, PROJECT_ID), eq(phaseStates.phaseId, GATE as any)));

  const outputs = await db.select().from(phaseOutputs)
    .where(and(eq(phaseOutputs.projectId, PROJECT_ID), eq(phaseOutputs.phaseId, GATE as any)));

  const inputs = await db.select().from(phaseInputs)
    .where(and(eq(phaseInputs.projectId, PROJECT_ID), eq(phaseInputs.phaseId, GATE as any)));

  const allFindings = await db.select().from(findingsTable)
    .where(eq(findingsTable.sourcePhase, GATE as any));

  // SI-03: Include seeded findings prominently (4 deterministic seeded issues)
  const seededFindings = allFindings.filter(f => f.seeded);

  // Phase 3 A3-001 action status (blocking action for Gate 4)
  const openActions = await db.select().from(actions)
    .where(eq(actions.sourcePhase, 3 as any));  // A3-001 is from Phase 3

  const decisions = await db.select().from(gateDecisions)
    .where(eq(gateDecisions.gateNumber, GATE as any));

  // Include deterministic check results for transparency
  const deterministicChecks = await db.select().from(checkResults)
    .where(eq(checkResults.phaseId, GATE as any));

  const aiRecommendation = phase?.aiRecommendation as any;

  return NextResponse.json({
    gateNumber: GATE,
    phaseName: 'Phase 4 — Detailed Design CDR',
    gateState: phase?.gateState ?? 'Locked',
    inputs: inputs.map(i => ({
      logicalName: i.logicalName,
      inputRole: i.inputRole,
      intakeBehavior: i.intakeBehavior,
      readinessStatus: i.readinessStatus,
    })),
    outputs: outputs.slice(0, 2),
    findings: allFindings,
    seededFindings,  // SI-03 four seeded DFM issues prominently surfaced
    deterministicChecks,  // All 4 check results (initial + revised)
    openActions,     // A3-001 from Phase 3 — blocking=true until VerifiedClosed
    aiRecommendation: aiRecommendation ? {
      ...aiRecommendation,
      advisoryLabel: 'Advisory Only — Human Decision Required',
    } : null,
    decisionHistory: decisions,
  });
}
