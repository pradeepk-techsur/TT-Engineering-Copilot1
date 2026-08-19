import { NextRequest, NextResponse } from 'next/server';
import { MOCK_PROJECT } from '@/lib/mockData';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { db } = await import('@/db/index');
    const { projectState } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');
    const rows = await db.select().from(projectState)
      .where(eq(projectState.projectId, projectId)).limit(1);
    if (rows.length === 0) throw new Error('Not found');
    return NextResponse.json(rows[0]);
  } catch {
    return NextResponse.json(MOCK_PROJECT);
  }
}
