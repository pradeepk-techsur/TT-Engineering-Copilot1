import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { checkResults } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const phaseId = parseInt(id);
  const results = await db.select().from(checkResults)
    .where(eq(checkResults.phaseId, phaseId as any));

  return NextResponse.json({ phaseId, checkCount: results.length, results });
}
