import { db } from '@/db';
import { phaseInputs, inputVersions, artifactRegistry } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { validateUploadedFile } from './fileValidator';
import { ValidationResult } from './types';
import { writeIntakeEvent } from './intakeAudit';
import { PHASE_CONFIG_MAP } from '@/shared/constants/phaseConfig';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';

export async function handleUserUpload(
  phaseId: number,
  inputRole: 'external' | 'internal',
  fileName: string,
  fileBuffer: Buffer,
  projectId: string = 'EVINV-POC-001'
): Promise<{ status: 'User Input Ready'; versionId: string; artifactId: string; validationResult: ValidationResult }> {
  const config = PHASE_CONFIG_MAP[phaseId as keyof typeof PHASE_CONFIG_MAP];
  if (!config) throw new Error(`Unknown phaseId: ${phaseId}`);

  const intakeConfig = inputRole === 'external' ? config.externalIntake : config.internalIntake;

  // Enforce intake behavior — UP inputs only
  if (intakeConfig.behavior !== 'UP') {
    throw new Error(`INTAKE_BEHAVIOR_MISMATCH: Phase ${phaseId} ${inputRole} input uses SI behavior, not UP.`);
  }

  // Determine accepted formats
  const formatStr = intakeConfig.format ?? 'DOCX/PDF/XLSX';
  const acceptedFormats = formatStr.split('/').map(f => '.' + f.toLowerCase().trim());

  // Run validation
  const validationResult = await validateUploadedFile(fileBuffer, fileName, {
    acceptedFormats,
    projectId,
    productName: 'EV-INV-800',
    phaseId,
    maxRows: 10,
    maxPages: 2,
  });

  if (!validationResult.passed) {
    // Update phase_inputs readiness status to reflect failure
    await db.update(phaseInputs)
      .set({ readinessStatus: 'Awaiting User Input', validationIssues: validationResult.issues as any })
      .where(and(
        eq(phaseInputs.projectId, projectId),
        eq(phaseInputs.phaseId, phaseId as any),
        eq(phaseInputs.inputRole, inputRole),
      ));

    throw Object.assign(
      new Error(`FILE_VALIDATION_FAILED: ${validationResult.issues.map(i => i.code).join(', ')}`),
      { validationResult, httpStatus: 422 }
    );
  }

  // Save file to storage
  const storageDir = path.join(process.cwd(), 'uploads', projectId, `phase${phaseId}`);
  if (!existsSync(storageDir)) mkdirSync(storageDir, { recursive: true });
  const storagePath = path.join(storageDir, `${inputRole}-v-${Date.now()}-${fileName}`);
  writeFileSync(storagePath, fileBuffer);
  const storageUri = storagePath;

  // Register artifact
  const artifactId = randomUUID();
  await db.insert(artifactRegistry).values({
    artifactId,
    artifactName: intakeConfig.logicalName,
    artifactType: acceptedFormats[0].replace('.', '').toUpperCase() as any,
    source: 'UserUploaded',
    intakeBehavior: 'UP',
    version: 1,
    phaseId: phaseId as any,
    gateId: phaseId as any,
    generatedBy: 'user-upload',
    disclaimerPresent: true,
    storageUri,
    fileSizeBytes: fileBuffer.length,
  });

  // Get or create phase_inputs row
  let [phaseInput] = await db.select().from(phaseInputs)
    .where(and(
      eq(phaseInputs.projectId, projectId),
      eq(phaseInputs.phaseId, phaseId as any),
      eq(phaseInputs.inputRole, inputRole),
    ));

  if (!phaseInput) {
    const [inserted] = await db.insert(phaseInputs).values({
      projectId,
      phaseId: phaseId as any,
      inputRole,
      logicalName: intakeConfig.logicalName,
      intakeBehavior: 'UP',
      systemRepresented: null,
      readinessStatus: 'User Input Ready',
      validationIssues: [],
    }).returning();
    phaseInput = inserted;
  }

  // Deactivate prior versions
  await db.update(inputVersions)
    .set({ active: false })
    .where(and(
      eq(inputVersions.inputId, phaseInput.inputId),
      eq(inputVersions.active, true),
    ));

  // Get current version count
  const versions = await db.select().from(inputVersions)
    .where(eq(inputVersions.inputId, phaseInput.inputId));
  const versionNumber = versions.length + 1;

  // Create new active version
  const [newVersion] = await db.insert(inputVersions).values({
    inputId: phaseInput.inputId,
    versionNumber,
    artifactId,
    intakeBehavior: 'UP',
    active: true,
    validationResult: validationResult as any,
    affectedScope: [],
  }).returning();

  // Update phase_inputs readiness
  await db.update(phaseInputs)
    .set({ readinessStatus: 'User Input Ready', validationIssues: [] })
    .where(eq(phaseInputs.inputId, phaseInput.inputId));

  // Write intake audit event (all 13 fields)
  await writeIntakeEvent({
    event_type: 'USER_FILE_UPLOAD',
    phase_id: phaseId,
    logical_input: intakeConfig.logicalName,
    intake_behavior: 'UP',
    user_action: versionNumber === 1 ? 'file_uploaded' : 'revised_version_uploaded',
    system_represented: null,
    status: 'User Input Ready',
    source_artifact_id: artifactId,
    normalized_artifact_id: artifactId,
    version: versionNumber,
    validation_result: validationResult,
    timestamp: new Date().toISOString(),
    operator_id: 'user',
  });

  return { status: 'User Input Ready', versionId: newVersion.versionId, artifactId, validationResult };
}
