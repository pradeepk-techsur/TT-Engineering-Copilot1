import { NextRequest, NextResponse } from 'next/server';
import { buildGateAdvisoryResponse } from '@/server/risk/gateAdvisoryService';

/**
 * Everything the Gate Review screen needs above the fold: the header counts,
 * the application-calculated Overall Risk Score, and the advisory (AI
 * recommendation, rationale, key strengths, key risks, next steps) — plus the
 * decisions already recorded at this gate, AI half and human half preserved.
 *
 * `?llm=0` returns the structured-rules advisory without a model call.
 * `?force=1` bypasses the short-lived assessment cache.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const gateId = parseInt(id, 10);

  if (Number.isNaN(gateId) || gateId < 0 || gateId > 9) {
    return NextResponse.json(
      { error_code: 'INVALID_GATE', message: 'This project has gates G0 through G9.' },
      { status: 400 }
    );
  }

  try {
    const useLlm = req.nextUrl.searchParams.get('llm') !== '0';
    const force = req.nextUrl.searchParams.get('force') === '1';
    return NextResponse.json(await buildGateAdvisoryResponse(gateId, { useLlm, force }));
  } catch (err) {
    console.error(`Gate ${gateId} advisory failed:`, err);
    return NextResponse.json(
      { error_code: 'ADVISORY_UNAVAILABLE', message: (err as Error).message },
      { status: 500 }
    );
  }
}
