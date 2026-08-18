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
    return NextResponse.json({ versions: [] });
  }

  // Find all versions of this logical artifact (same name)
  const allVersions = await db
    .select()
    .from(artifactRegistry)
    .where(eq(artifactRegistry.artifactName, artifact.artifactName));

  return NextResponse.json({ artifactName: artifact.artifactName, versions: allVersions });
}
