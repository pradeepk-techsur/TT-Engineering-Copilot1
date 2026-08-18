import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { actions } from '@/db/schema';

export async function GET(_req: NextRequest) {
  const results = await db.select().from(actions);
  return NextResponse.json({
    actions: results,
    blockingOpen: results.filter((a: any) => a.blocking && a.status !== 'VerifiedClosed').length,
  });
}
