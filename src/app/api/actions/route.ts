import { NextRequest, NextResponse } from 'next/server';
import { MOCK_ACTIONS } from '@/lib/mockData';

export async function GET(_req: NextRequest) {
  try {
    const { db } = await import('@/db');
    const { actions } = await import('@/db/schema');
    const results = await db.select().from(actions);
    return NextResponse.json({
      actions: results,
      blockingOpen: results.filter((a: any) => a.blocking && a.status !== 'VerifiedClosed').length,
    });
  } catch {
    return NextResponse.json({
      actions: MOCK_ACTIONS,
      blockingOpen: MOCK_ACTIONS.filter(a => a.blocking && a.status !== 'VerifiedClosed').length,
    });
  }
}
