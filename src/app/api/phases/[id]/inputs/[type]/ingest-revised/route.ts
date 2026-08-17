import { NextRequest, NextResponse } from 'next/server';
import { handleSampleIngest } from '@/server/intake/siHandler';
import { traverseFromInput, invalidateAffectedScope } from '@/server/versioning/dependencyGraph';
import { db } from '@/db';
import { phaseInputs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; type: string }> }
) {
  const { id, type } = await params;
  const phaseId = parseInt(id);
  const inputRole = type as 'external' | 'internal';

  try {
    const body = await req.json();
    const confirmViewed = body.confirm_viewed === true;

    const result = await handleSampleIngest(phaseId, inputRole, confirmViewed);

    const [input] = await db.select().from(phaseInputs).where(and(
      eq(phaseInputs.projectId, 'EVINV-POC-001'),
      eq(phaseInputs.phaseId, phaseId as unknown as number),
      eq(phaseInputs.inputRole, inputRole),
    ));

    let affectedScope = null;
    if (input) {
      affectedScope = await traverseFromInput(input.inputId);
      await invalidateAffectedScope(affectedScope);
    }

    return NextResponse.json({
      ...result,
      label: 'Revised Synthetic System Sample Available',  // correct label per FRD F02
      affectedScope,
    });
  } catch (err: unknown) {
    const error = err as { message?: string; httpStatus?: number };
    const code = error.message?.split(':')[0] ?? 'INTERNAL_ERROR';
    return NextResponse.json({ error_code: code, message: error.message }, { status: error.httpStatus ?? 500 });
  }
}
