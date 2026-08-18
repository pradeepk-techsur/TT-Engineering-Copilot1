import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { findings } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const phaseId = req.nextUrl.searchParams.get('phaseId');
  const results = phaseId
    ? await db.select().from(findings).where(eq(findings.sourcePhase, parseInt(phaseId) as any))
    : await db.select().from(findings);

  return NextResponse.json({ findings: results });
}
