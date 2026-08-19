import { NextResponse } from 'next/server';
import { MOCK_LIFECYCLE } from '@/lib/mockData';

export async function GET() {
  // Preview/demo mode: return mock lifecycle data (no DB required)
  try {
    const { db } = await import('@/db');
    const { projectState, phaseStates } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');
    const { PHASE_CONFIG } = await import('@/shared/constants/phaseConfig');

    const [project] = await db.select().from(projectState)
      .where(eq(projectState.projectId, 'EVINV-POC-001'));

    if (!project) throw new Error('No project in DB');

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
  } catch {
    // Fallback to mock data when DB unavailable
    return NextResponse.json(MOCK_LIFECYCLE);
  }
}
