import { NextRequest, NextResponse } from 'next/server';
import { traverseFromInput } from '@/server/versioning/dependencyGraph';
import { db } from '@/db';
import { phaseInputs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

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

  if (!input) return NextResponse.json({ error_code: 'INPUT_NOT_FOUND' }, { status: 404 });

  const scope = await traverseFromInput(input.inputId);
  return NextResponse.json(scope);
}
