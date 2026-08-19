import { NextRequest, NextResponse } from 'next/server';
import { MOCK_FINDINGS } from '@/lib/mockData';

export async function GET(req: NextRequest) {
  const phaseId = req.nextUrl.searchParams.get('phaseId');
  try {
    const { db } = await import('@/db');
    const { findings } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');
    const results = phaseId
      ? await db.select().from(findings).where(eq(findings.sourcePhase, parseInt(phaseId) as any))
      : await db.select().from(findings);
    return NextResponse.json({ findings: results });
  } catch {
    const filtered = phaseId
      ? MOCK_FINDINGS.filter(f => f.sourcePhase === parseInt(phaseId))
      : MOCK_FINDINGS;
    return NextResponse.json({ findings: filtered });
  }
}
