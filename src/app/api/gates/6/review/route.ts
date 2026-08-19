import { NextResponse } from 'next/server';
import { db } from '@/db';
import { phaseStates, phaseOutputs, phaseInputs, gateDecisions, findings as findingsTable, checkResults } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET() {
  const PROJECT_ID = 'EVINV-POC-001';
  const GATE = 6;

  const [phase] = await db.select().from(phaseStates)
    .where(and(eq(phaseStates.projectId, PROJECT_ID), eq(phaseStates.phaseId, GATE as any)));

  const outputs = await db.select().from(phaseOutputs)
    .where(and(eq(phaseOutputs.projectId, PROJECT_ID), eq(phaseOutputs.phaseId, GATE as any)));

  const inputs = await db.select().from(phaseInputs)
    .where(and(eq(phaseInputs.projectId, PROJECT_ID), eq(phaseInputs.phaseId, GATE as any)));

  const allFindings = await db.select().from(findingsTable)
    .where(eq(findingsTable.sourcePhase, GATE as any));

  // SI-06: Include seeded findings prominently (Cpk failure)
  const seededFindings = allFindings.filter(f => f.seeded);

  const decisions = await db.select().from(gateDecisions)
    .where(eq(gateDecisions.gateNumber, GATE as any));

  // Include Cpk check results for transparency
  const deterministicChecks = await db.select().from(checkResults)
    .where(eq(checkResults.phaseId, GATE as any));

  const aiRecommendation = phase?.aiRecommendation as any;

  return NextResponse.json({
    gateNumber: GATE,
    phaseName: 'Phase 6 — Manufacturing Readiness & PPAP',
    gateState: phase?.gateState ?? 'Locked',
    inputs: inputs.map(i => ({
      logicalName: i.logicalName,
      inputRole: i.inputRole,
      intakeBehavior: i.intakeBehavior,
      readinessStatus: i.readinessStatus,
    })),
    outputs: outputs.slice(0, 2),
    findings: allFindings,
    seededFindings, // SI-06 SOLDER_JOINT_SHEAR_HV_BUS Cpk failure prominently surfaced
    deterministicChecks, // Cpk check results (initial + revised)
    aiRecommendation: aiRecommendation ? {
      ...aiRecommendation,
      advisoryLabel: 'Advisory Only — Human Decision Required',
    } : null,
    decisionHistory: decisions,
  });
}
