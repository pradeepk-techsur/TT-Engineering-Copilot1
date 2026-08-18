import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { artifactRegistry } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ artifactId: string }> }
) {
  const { artifactId } = await params;

  const [artifact] = await db
    .select()
    .from(artifactRegistry)
    .where(eq(artifactRegistry.artifactId, artifactId));

  if (!artifact) {
    return NextResponse.json({ error: 'Artifact not found' }, { status: 404 });
  }
  return NextResponse.json(artifact);
}
