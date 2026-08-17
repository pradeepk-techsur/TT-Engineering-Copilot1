import { NextResponse } from 'next/server';
import { db } from '@/db';
import { projectState, phaseStates } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { PHASE_CONFIG } from '@/shared/constants/phaseConfig';

export async function GET() {
  try {
    const [project] = await db.select().from(projectState)
      .where(eq(projectState.projectId, 'EVINV-POC-001'));

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const phases = await db.select().from(phaseStates)
      .where(eq(phaseStates.projectId, 'EVINV-POC-001'));

    const phaseData = PHASE_CONFIG.map(config => {
      const state = phases.find(p => p.phaseId === config.phaseId);
      return {
        phaseId: config.phaseId,
        phaseName: config.phaseName,
        technicalReview: config.technicalReview ?? null,
        externalIntakeBehavior: config.externalIntake.behavior,
        internalIntakeBehavior: config.internalIntake.behavior,
        phaseState: state?.phaseState ?? 'Pending',
        gateState: state?.gateState ?? 'Locked',
        hasCompactSummary: !!state?.compactPhaseSummary,
      };
    });

    return NextResponse.json({
      projectId: project.projectId,
      productName: project.productName,
      projectType: project.projectType,
      projectCategory: project.projectCategory,
      currentPhase: project.currentPhase,
      currentGate: project.currentGate,
      projectStatus: project.projectStatus,
      phases: phaseData,
    });
  } catch (error) {
    console.error('Error fetching lifecycle data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
