import * as XLSX from 'xlsx';
import { db } from '@/db';
import { artifactRegistry, phaseOutputs } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';

export const SYNTHETIC_DISCLAIMER =
  'Synthetic POC Data. Not TT Electronics Product Data. Not for Design, Fabrication, Certification, Procurement, or Production.';

function getStorageDir(phaseId: number, projectId: string = 'EVINV-POC-001'): string {
  const dir = path.join(process.cwd(), 'outputs', projectId, `phase${phaseId}`);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Generate a compact XLSX artifact with ≤10 meaningful rows.
 * Disclaimer is injected as first row.
 * CA-01/CA-02/CA-03/CA-04/CA-05 enforced here.
 */
export async function generateXlsx(
  rows: Record<string, unknown>[],
  fileName: string,
  phaseId: number,
  gateId: number,
  generatedBy: string = 'agent'
): Promise<{ artifactId: string; storageUri: string; rowCount: number }> {
  if (rows.length > 10) {
    console.warn(`Compact artifact warning: ${fileName} has ${rows.length} rows; truncating to 10`);
    rows = rows.slice(0, 10);
  }

  const wb = XLSX.utils.book_new();

  // Disclaimer row (CA-04)
  const disclaimerRow = [SYNTHETIC_DISCLAIMER];
  // Provenance row (CA-05)
  const provenanceRow = [`Project: EVINV-POC-001 | Product: EV-INV-800 | Phase: ${phaseId} | Gate: ${gateId} | Generated: ${new Date().toISOString()}`];

  const allRows = [disclaimerRow, provenanceRow, [], ...[Object.keys(rows[0] ?? {}), ...rows.map(r => Object.values(r))]];
  const ws = XLSX.utils.aoa_to_sheet(allRows);
  XLSX.utils.book_append_sheet(wb, ws, 'Data');

  const storageDir = getStorageDir(phaseId);
  const storagePath = path.join(storageDir, fileName);
  const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  writeFileSync(storagePath, xlsxBuffer);

  // Remove any stale AgentGenerated rows from prior partial runs.
  // Must delete phase_outputs first (FK: phase_outputs.artifact_id → artifact_registry.artifact_id).
  const staleXlsx = await db.select({ artifactId: artifactRegistry.artifactId })
    .from(artifactRegistry)
    .where(and(
      eq(artifactRegistry.phaseId, phaseId as any),
      eq(artifactRegistry.gateId, gateId as any),
      eq(artifactRegistry.source, 'AgentGenerated'),
      eq(artifactRegistry.generatedBy, generatedBy),
      eq(artifactRegistry.artifactType, 'XLSX'),
    ));
  if (staleXlsx.length > 0) {
    const staleIds = staleXlsx.map(r => r.artifactId);
    await db.delete(phaseOutputs).where(inArray(phaseOutputs.artifactId, staleIds));
    await db.delete(artifactRegistry).where(inArray(artifactRegistry.artifactId, staleIds));
  }

  const artifactId = randomUUID();
  await db.insert(artifactRegistry).values({
    artifactId,
    artifactName: fileName.replace('.xlsx', ''),
    artifactType: 'XLSX',
    source: 'AgentGenerated',
    intakeBehavior: 'UP',
    version: 1,
    phaseId: phaseId as any,
    gateId: gateId as any,
    generatedBy,
    disclaimerPresent: true,
    storageUri: storagePath,
    rowCount: rows.length,
    fileSizeBytes: xlsxBuffer.length,
  });

  return { artifactId, storageUri: storagePath, rowCount: rows.length };
}

/**
 * Generate a compact DOCX-like text artifact (stored as .txt for POC; DOCX in production).
 * CA-03/CA-04/CA-05 enforced.
 */
export async function generateDocx(
  content: string,
  fileName: string,
  phaseId: number,
  gateId: number,
  generatedBy: string = 'agent'
): Promise<{ artifactId: string; storageUri: string }> {
  const fullContent = [
    SYNTHETIC_DISCLAIMER,
    `Project: EVINV-POC-001 | Product: EV-INV-800 | Phase: ${phaseId} | Gate: ${gateId}`,
    `Generated: ${new Date().toISOString()} | Status: Draft — Awaiting Human Approval`,
    '',
    content,
  ].join('\n');

  const storageDir = getStorageDir(phaseId);
  const storagePath = path.join(storageDir, fileName);
  writeFileSync(storagePath, fullContent, 'utf-8');

  // Remove any stale AgentGenerated rows from prior partial runs.
  // Must delete phase_outputs first (FK: phase_outputs.artifact_id → artifact_registry.artifact_id).
  const staleDocx = await db.select({ artifactId: artifactRegistry.artifactId })
    .from(artifactRegistry)
    .where(and(
      eq(artifactRegistry.phaseId, phaseId as any),
      eq(artifactRegistry.gateId, gateId as any),
      eq(artifactRegistry.source, 'AgentGenerated'),
      eq(artifactRegistry.generatedBy, generatedBy),
      eq(artifactRegistry.artifactType, 'DOCX'),
    ));
  if (staleDocx.length > 0) {
    const staleIds = staleDocx.map(r => r.artifactId);
    await db.delete(phaseOutputs).where(inArray(phaseOutputs.artifactId, staleIds));
    await db.delete(artifactRegistry).where(inArray(artifactRegistry.artifactId, staleIds));
  }

  const artifactId = randomUUID();
  await db.insert(artifactRegistry).values({
    artifactId,
    artifactName: fileName.replace('.txt', '').replace('.docx', ''),
    artifactType: 'DOCX',
    source: 'AgentGenerated',
    intakeBehavior: 'UP',
    version: 1,
    phaseId: phaseId as any,
    gateId: gateId as any,
    generatedBy,
    disclaimerPresent: true,
    storageUri: storagePath,
    pageCount: Math.ceil(content.split('\n').length / 40),  // rough estimate
    fileSizeBytes: Buffer.byteLength(fullContent),
  });

  return { artifactId, storageUri: storagePath };
}
