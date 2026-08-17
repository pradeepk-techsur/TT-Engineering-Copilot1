import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { phaseInputs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getVersionHistory } from '@/server/versioning/versionService';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; type: string }> }
) {
  const { id, type } = await params;
  const phaseId = parseInt(id);
  const inputRole = type as 'external' | 'internal';

  const [input] = await db.select().from(phaseInputs).where(and(
    eq(phaseInputs.projectId, 'EVINV-POC-001'),
    eq(phaseInputs.phaseId, phaseId as unknown as number),
    eq(phaseInputs.inputRole, inputRole),
  ));

  if (!input) return NextResponse.json({ versions: [] });

  const versions = await getVersionHistory(input.inputId);
  return NextResponse.json({ inputId: input.inputId, versions });
}
