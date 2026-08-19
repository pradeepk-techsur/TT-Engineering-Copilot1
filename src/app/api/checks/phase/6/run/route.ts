import { NextRequest, NextResponse } from 'next/server';
import { runCpkCalculation } from '@/server/tools/cpkCalculation';
import { db } from '@/db';
import { phaseInputs, inputVersions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const isRevised = body.isRevised === true;

  const [internalInput] = await db.select().from(phaseInputs)
    .where(and(eq(phaseInputs.projectId, 'EVINV-POC-001'), eq(phaseInputs.phaseId, 6 as any), eq(phaseInputs.inputRole, 'internal')));
  const [activeVersion] = internalInput ? await db.select().from(inputVersions)
    .where(and(eq(inputVersions.inputId, internalInput.inputId), eq(inputVersions.active, true))) : [null];
  const inputVersionId = activeVersion?.versionId ?? `phase6-v${isRevised ? 2 : 1}`;

  const result = await runCpkCalculation(6, inputVersionId, isRevised);
  return NextResponse.json({ isRevised, ...result, phaseId: 6 });
}
