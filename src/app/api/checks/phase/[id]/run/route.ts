import { NextRequest, NextResponse } from 'next/server';
import { runHVClearanceCheck } from '@/server/tools/hvClearanceCheck';
import { runComponentDeratingCheck } from '@/server/tools/componentDeratingCheck';
import { runTestPointCoverageCheck } from '@/server/tools/testPointCoverageCheck';
import { runCrossArtifactConsistencyCheck } from '@/server/tools/crossArtifactConsistencyCheck';
import { db } from '@/db';
import { phaseInputs, inputVersions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const PROJECT_ID = 'EVINV-POC-001';

// Map of phase → required check types
const PHASE_CHECKS: Record<number, string[]> = {
  4: ['CrossArtifactConsistency', 'HVClearance', 'ComponentDerating', 'TestPointCoverage'],
  // Phase 6 Cpk added in Phase 5 build plan
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const phaseId = parseInt(id);
  const body = await req.json().catch(() => ({}));
  const isRevised = body.isRevised === true;

  if (!PHASE_CHECKS[phaseId]) {
    return NextResponse.json({ error_code: 'NO_CHECKS_FOR_PHASE', message: `No mandatory checks configured for Phase ${phaseId}.` }, { status: 404 });
  }

  // Get active internal input version for traceability
  const [internalInput] = await db.select().from(phaseInputs)
    .where(and(eq(phaseInputs.projectId, PROJECT_ID), eq(phaseInputs.phaseId, phaseId as any), eq(phaseInputs.inputRole, 'internal')));

  const [activeVersion] = internalInput ? await db.select().from(inputVersions)
    .where(and(eq(inputVersions.inputId, internalInput.inputId), eq(inputVersions.active, true))) : [null];

  const inputVersionId = activeVersion?.versionId ?? `phase${phaseId}-v${isRevised ? 2 : 1}`;

  if (phaseId === 4) {
    const [crossResult, hvResult, deratingResult, tpResult] = await Promise.all([
      runCrossArtifactConsistencyCheck(phaseId, inputVersionId, isRevised),
      runHVClearanceCheck(phaseId, inputVersionId, isRevised),
      runComponentDeratingCheck(phaseId, inputVersionId, isRevised),
      runTestPointCoverageCheck(phaseId, inputVersionId, isRevised),
    ]);

    const allPass = [crossResult, hvResult, deratingResult, tpResult].every(r => r.status === 'Pass');

    return NextResponse.json({
      phaseId, isRevised, allPass,
      checks: [
        { type: 'CrossArtifactConsistency', ...crossResult },
        { type: 'HVClearance',              ...hvResult },
        { type: 'ComponentDerating',        ...deratingResult },
        { type: 'TestPointCoverage',        ...tpResult },
      ],
    });
  }

  return NextResponse.json({ error_code: 'UNSUPPORTED_PHASE' }, { status: 400 });
}
