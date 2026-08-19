import { NextRequest, NextResponse } from 'next/server';
import { MOCK_INPUTS } from '@/lib/mockData';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const phaseId = parseInt(id);
  try {
    const { db } = await import('@/db');
    const { phaseInputs, inputVersions } = await import('@/db/schema');
    const { eq, and } = await import('drizzle-orm');
    const { PHASE_CONFIG_MAP } = await import('@/shared/constants/phaseConfig');

    const config = PHASE_CONFIG_MAP[phaseId as keyof typeof PHASE_CONFIG_MAP];
    const inputs = await db.select().from(phaseInputs)
      .where(and(eq(phaseInputs.projectId, 'EVINV-POC-001'), eq(phaseInputs.phaseId, phaseId as any)));

    async function buildReadiness(role: 'external' | 'internal') {
      const intakeConfig = role === 'external' ? config.externalIntake : config.internalIntake;
      const row = inputs.find((i: any) => i.inputRole === role);
      let activeVersion = null;
      if (row) {
        const [av] = await db.select().from(inputVersions)
          .where(and(eq(inputVersions.inputId, row.inputId), eq(inputVersions.active, true)));
        activeVersion = av;
      }
      const isReady = row?.readinessStatus === 'User Input Ready' ||
                      row?.readinessStatus === 'Synthetic System Input Ready';
      return {
        inputRole: role, logicalName: intakeConfig.logicalName,
        intakeBehavior: intakeConfig.behavior,
        systemRepresented: intakeConfig.systemRepresented ?? null,
        format: intakeConfig.format,
        sizeGuidance: intakeConfig.behavior === 'SI' ? '≤10 rows (XLSX)' : 'See format guidance',
        activeArtifactId: activeVersion?.artifactId ?? null,
        activeVersion: activeVersion?.versionNumber ?? null,
        validationStatus: isReady ? 'Pass' : (row ? 'Fail' : 'Pending'),
        validationIssues: row?.validationIssues ?? [],
        requiredUserAction: !row ? (intakeConfig.behavior === 'UP' ? 'Upload file' : 'Click Ingest Sample')
          : isReady ? 'None'
          : intakeConfig.behavior === 'SI' ? 'Click Ingest Sample' : 'Upload valid file',
        isReady,
        readyStatus: row?.readinessStatus ?? (intakeConfig.behavior === 'UP' ? 'Awaiting User Input' : 'Waiting for Synthetic Sample Ingestion'),
      };
    }

    const [external, internal] = await Promise.all([buildReadiness('external'), buildReadiness('internal')]);
    return NextResponse.json({ phaseId, external, internal });
  } catch {
    // Mock fallback
    const mock = MOCK_INPUTS[phaseId];
    return NextResponse.json({ phaseId, external: mock?.external ?? null, internal: mock?.internal ?? null });
  }
}
