// Stub implementation — full implementation in plan 02-01
// This stub is sufficient for the versioning routes in 02-02 to compile and import

import { db } from '@/db';
import { phaseInputs, inputVersions, artifactRegistry } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

interface UploadResult {
  status: 'User Input Ready';
  versionId: string;
  artifactId: string;
  versionNumber: number;
  inputId: string;
}

/**
 * Handle user-uploaded file intake (UP behavior).
 * Creates artifact registry entry and new version record, activates version.
 */
export async function handleUserUpload(
  phaseId: number,
  inputRole: 'external' | 'internal',
  fileName: string,
  buffer: Buffer
): Promise<UploadResult> {
  // Find or create phase_input record
  const [existingInput] = await db.select().from(phaseInputs).where(and(
    eq(phaseInputs.projectId, 'EVINV-POC-001'),
    eq(phaseInputs.phaseId, phaseId as unknown as number),
    eq(phaseInputs.inputRole, inputRole),
  ));

  if (!existingInput) {
    throw Object.assign(new Error('INPUT_NOT_FOUND: No phase input configured for this phase/role'), { httpStatus: 404 });
  }

  // Register artifact
  const ext = fileName.split('.').pop()?.toUpperCase() ?? 'XLSX';
  const [artifact] = await db.insert(artifactRegistry).values({
    artifactName: fileName,
    artifactType: ext as 'XLSX' | 'CSV' | 'DOCX' | 'PDF',
    source: 'UserUploaded',
    intakeBehavior: 'UP',
    version: 1,
    phaseId: phaseId as unknown as number,
    gateId: phaseId as unknown as number,
    inputVersionRefs: [],
    generatedBy: 'user',
    disclaimerPresent: false,
    storageUri: `memory://${fileName}`,
    fileSizeBytes: buffer.length,
  }).returning();

  // Count existing versions
  const existingVersions = await db.select().from(inputVersions)
    .where(eq(inputVersions.inputId, existingInput.inputId));
  const nextVersionNumber = existingVersions.length + 1;

  // Deactivate existing active version
  const [activeVersion] = existingVersions.filter(v => v.active);
  if (activeVersion) {
    await db.update(inputVersions)
      .set({ active: false })
      .where(eq(inputVersions.versionId, activeVersion.versionId));
  }

  // Create new active version
  const [newVersion] = await db.insert(inputVersions).values({
    inputId: existingInput.inputId,
    versionNumber: nextVersionNumber,
    artifactId: artifact.artifactId,
    intakeBehavior: 'UP',
    active: true,
    validationResult: { passed: true, issues: [] } as unknown as Record<string, unknown>,
    affectedScope: [],
  }).returning();

  // Update input readiness
  await db.update(phaseInputs)
    .set({ readinessStatus: 'User Input Ready' })
    .where(eq(phaseInputs.inputId, existingInput.inputId));

  return {
    status: 'User Input Ready',
    versionId: newVersion.versionId,
    artifactId: artifact.artifactId,
    versionNumber: nextVersionNumber,
    inputId: existingInput.inputId,
  };
}
