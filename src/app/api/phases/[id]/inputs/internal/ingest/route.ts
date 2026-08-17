import { NextRequest, NextResponse } from 'next/server';
import { handleSampleIngest } from '@/server/intake/siHandler';

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
    const body = await req.json();
    // CRITICAL: confirm_viewed must be explicitly true — never assume
    const confirmViewed = body.confirm_viewed === true;
    const result = await handleSampleIngest(phaseId, 'internal', confirmViewed);
    return NextResponse.json(result);
  } catch (err: any) {
    const code = err.message?.split(':')[0] ?? 'INTERNAL_ERROR';
    return NextResponse.json(
      { error_code: code, message: err.message },
      { status: err.httpStatus ?? 500 }
    );
  }
}
