import { NextResponse } from 'next/server';
import { db } from '@/db';
import { phaseStates, phaseOutputs, phaseInputs, gateDecisions, findings as findingsTable, actions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET() {
  const PROJECT_ID = 'EVINV-POC-001';
  const GATE = 0;

  const [phase] = await db.select().from(phaseStates)
    .where(and(eq(phaseStates.projectId, PROJECT_ID), eq(phaseStates.phaseId, GATE as any)));

  const outputs = await db.select().from(phaseOutputs)
    .where(and(eq(phaseOutputs.projectId, PROJECT_ID), eq(phaseOutputs.phaseId, GATE as any)));

  const inputs = await db.select().from(phaseInputs)
    .where(and(eq(phaseInputs.projectId, PROJECT_ID), eq(phaseInputs.phaseId, GATE as any)));

  const allFindings = await db.select().from(findingsTable)
    .where(eq(findingsTable.sourcePhase, GATE as any));

  const openActions = await db.select().from(actions)
    .where(eq(actions.sourcePhase, GATE as any));

  const decisions = await db.select().from(gateDecisions)
    .where(eq(gateDecisions.gateNumber, GATE as any));

  // AI recommendation from phase state (advisory only)
  const aiRecommendation = phase?.aiRecommendation as any;

  return NextResponse.json({
    gateNumber: GATE,
    phaseName: 'Phase 0 — Commercial Assessment',
    gateState: phase?.gateState ?? 'Locked',
    // Inputs reviewed
    inputs: inputs.map(i => ({
      logicalName: i.logicalName,
      inputRole: i.inputRole,
      intakeBehavior: i.intakeBehavior,
      readinessStatus: i.readinessStatus,
    })),
    // Outputs reviewed (max 2, rendered from state — no gate-pack artifact)
    outputs: outputs.slice(0, 2),
    // Findings summary
    findings: allFindings,
    // Open actions
    openActions,
    // AI recommendation (advisory only)
    aiRecommendation: aiRecommendation ? {
      ...aiRecommendation,
      advisoryLabel: 'Advisory Only — Human Decision Required',  // Always present
    } : null,
    // Gate decision history
    decisionHistory: decisions,
  });
}
