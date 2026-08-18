import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { artifactRegistry } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createReadStream, existsSync, statSync } from 'fs';
import path from 'path';
import { Readable } from 'stream';

// Map artifact type to a sensible MIME type and download extension.
const MIME_MAP: Record<string, string> = {
  XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  PDF:  'application/pdf',
  CSV:  'text/csv',
  TXT:  'text/plain',
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ artifactId: string }> }
) {
  const { artifactId } = await params;

  // Basic UUID format guard — prevents path-traversal attempts reaching the DB.
  if (!/^[0-9a-f-]{36}$/i.test(artifactId)) {
    return NextResponse.json({ error: 'Invalid artifact ID' }, { status: 400 });
  }

  // Look up the artifact record to get its storageUri.
  const [artifact] = await db
    .select({
      storageUri: artifactRegistry.storageUri,
      artifactName: artifactRegistry.artifactName,
      artifactType: artifactRegistry.artifactType,
    })
    .from(artifactRegistry)
    .where(eq(artifactRegistry.artifactId, artifactId));

  if (!artifact) {
    return NextResponse.json({ error: 'Artifact not found' }, { status: 404 });
  }

  const { storageUri, artifactName, artifactType } = artifact;

  // storageUri is an absolute OS path written by artifactGenerator.ts (e.g.
  // /…/outputs/EVINV-POC-001/phase0/phase0-capability-gap-matrix.xlsx).
  // Resolve it and confirm it stays inside process.cwd() to prevent path traversal.
  const resolved = path.resolve(storageUri);
  const cwd      = path.resolve(process.cwd());
  if (!resolved.startsWith(cwd + path.sep)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!existsSync(resolved)) {
    return NextResponse.json({ error: 'Artifact file not found on disk' }, { status: 404 });
  }

  // Derive file extension from the stored path (handles .txt stand-ins for DOCX in POC).
  const ext     = path.extname(resolved).slice(1).toUpperCase();
  const mime    = MIME_MAP[ext] ?? MIME_MAP[artifactType] ?? 'application/octet-stream';
  const dlName  = `${artifactName}${path.extname(resolved)}`;
  const size    = statSync(resolved).size;

  // Stream the file so large artifacts don't buffer entirely in memory.
  const nodeStream = createReadStream(resolved);
  const webStream  = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;

  return new NextResponse(webStream, {
    status: 200,
    headers: {
      'Content-Type':        mime,
      'Content-Disposition': `attachment; filename="${dlName}"`,
      'Content-Length':      String(size),
      'Cache-Control':       'no-store',
    },
  });
}
