import { NextRequest, NextResponse } from 'next/server';
import { handleUserUpload } from '@/server/intake/upHandler';
import { traverseFromInput, invalidateAffectedScope } from '@/server/versioning/dependencyGraph';
import { db } from '@/db';
import { phaseInputs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// NOTE: Correct label is "Upload Revised Version" — do not use deprecated terminology
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; type: string }> }
) {
  const { id, type } = await params;
  const phaseId = parseInt(id);
  const inputRole = type as 'external' | 'internal';

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error_code: 'NO_FILE' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    // handleUserUpload handles version creation (increments version number automatically)
    const result = await handleUserUpload(phaseId, inputRole, file.name, buffer);

    // Get the input record to compute affected scope
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
      label: 'Upload Revised Version',  // correct label per FRD F02
      affectedScope,
    });
  } catch (err: unknown) {
    const error = err as { message?: string; httpStatus?: number };
    const code = error.message?.split(':')[0] ?? 'INTERNAL_ERROR';
    return NextResponse.json({ error_code: code, message: error.message }, { status: error.httpStatus ?? 500 });
  }
}
