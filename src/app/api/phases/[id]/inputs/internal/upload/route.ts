import { NextRequest, NextResponse } from 'next/server';
import { handleUserUpload } from '@/server/intake/upHandler';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const phaseId = parseInt(id);
  if (isNaN(phaseId) || phaseId < 0 || phaseId > 9) {
    return NextResponse.json({ error_code: 'INVALID_PHASE' }, { status: 400 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error_code: 'NO_FILE' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await handleUserUpload(phaseId, 'internal', file.name, buffer);
    return NextResponse.json(result);
  } catch (err: any) {
    const code = err.message?.split(':')[0] ?? 'INTERNAL_ERROR';
    return NextResponse.json(
      { error_code: code, message: err.message, validationResult: err.validationResult },
      { status: err.httpStatus ?? 500 }
    );
  }
}
