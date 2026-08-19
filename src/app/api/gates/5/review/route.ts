import { NextResponse } from 'next/server';
import { db } from '@/db';
import { phaseStates, phaseOutputs, phaseInputs, gateDecisions, findings as findingsTable, checkResults } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET() {
  const PROJECT_ID = 'EVINV-POC-001';
  const GATE = 5;

  const [phase] = await db.select().from(phaseStates)
    .where(and(eq(phaseStates.projectId, PROJECT_ID), eq(phaseStates.phaseId, GATE as any)));

  const outputs = await db.select().from(phaseOutputs)
    .where(and(eq(phaseOutputs.projectId, PROJECT_ID), eq(phaseOutputs.phaseId, GATE as any)));

  const inputs = await db.select().from(phaseInputs)
    .where(and(eq(phaseInputs.projectId, PROJECT_ID), eq(phaseInputs.phaseId, GATE as any)));

  const allFindings = await db.select().from(findingsTable)
    .where(eq(findingsTable.sourcePhase, GATE as any));

  // SI-05: Include seeded findings prominently (thermal exceedance at TP-CASE-1)
  const seededFindings = allFindings.filter(f => f.seeded);

  const decisions = await db.select().from(gateDecisions)
    .where(eq(gateDecisions.gateNumber, GATE as any));

  // Include V&V check results for transparency
  const deterministicChecks = await db.select().from(checkResults)
    .where(eq(checkResults.phaseId, GATE as any));

  const aiRecommendation = phase?.aiRecommendation as any;

  return NextResponse.json({
    gateNumber: GATE,
    phaseName: 'Phase 5 — Verification & Validation',
    gateState: phase?.gateState ?? 'Locked',
    inputs: inputs.map(i => ({
      logicalName: i.logicalName,
      inputRole: i.inputRole,
      intakeBehavior: i.intakeBehavior,
      readinessStatus: i.readinessStatus,
    })),
    outputs: outputs.slice(0, 2),
    findings: allFindings,
    seededFindings,  // SI-05 thermal test failure prominently surfaced
    deterministicChecks,  // V&V check results (initial + revised)
    openActions: [],  // No cross-phase blocking actions into Gate 5
    aiRecommendation: aiRecommendation ? {
      ...aiRecommendation,
      advisoryLabel: 'Advisory Only — Human Decision Required',
    } : null,
    decisionHistory: decisions,
  });
}
