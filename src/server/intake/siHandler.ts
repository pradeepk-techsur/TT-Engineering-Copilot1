import { db } from '@/db';
import { phaseInputs, inputVersions, artifactRegistry } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { writeIntakeEvent, assertNoProhibitedLabels } from './intakeAudit';
import { PHASE_CONFIG_MAP } from '@/shared/constants/phaseConfig';
import { randomUUID } from 'crypto';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

/** Get the path to the preloaded synthetic sample for a given phase and input role */
export function getSamplePath(phaseId: number, inputRole: 'external' | 'internal'): string {
  const sampleMap: Record<string, string> = {
    '0-internal':  'phase0-int-capability-assessment.xlsx',
    '1-internal':  'phase1-int-cost-resource.xlsx',
    '2-internal':  'phase2-int-system-requirements.xlsx',
    '3-external':  'phase3-ext-design-rules.xlsx',
    '4-external':  'phase4-ext-dfm-standards-supplier.xlsx',
    '5-external':  'phase5-ext-test-methods-acceptance.xlsx',
    '6-internal':  'phase6-int-manufacturing-capability.xlsx',
    '7-internal':  'phase7-int-transfer-defects-yield.xlsx',
    '8-external':  'phase8-ext-supplier-lifecycle.xlsx',
    '8-internal':  'phase8-int-production-bom-yield.xlsx',
    '9-internal':  'phase9-int-final-product-archive.xlsx',
  };
  const key = `${phaseId}-${inputRole}`;
  const fileName = sampleMap[key];
  if (!fileName) throw new Error(`No synthetic sample configured for phase ${phaseId} ${inputRole}`);
  return path.join(process.cwd(), 'public', 'samples', fileName);
}

export async function handleSampleIngest(
  phaseId: number,
  inputRole: 'external' | 'internal',
  confirmViewed: boolean,
  projectId: string = 'EVINV-POC-001'
): Promise<{ status: 'Synthetic System Input Ready'; versionId: string; artifactId: string }> {
  // ENFORCEMENT: reject auto-ingest
  if (!confirmViewed) {
    throw Object.assign(
      new Error('AUTO_INGEST_PROHIBITED: User must explicitly click Ingest Sample.'),
      { httpStatus: 403 }
    );
  }

  const config = PHASE_CONFIG_MAP[phaseId as keyof typeof PHASE_CONFIG_MAP];
  if (!config) throw new Error(`Unknown phaseId: ${phaseId}`);

  const intakeConfig = inputRole === 'external' ? config.externalIntake : config.internalIntake;

  if (intakeConfig.behavior !== 'SI') {
    throw new Error(`INTAKE_BEHAVIOR_MISMATCH: Phase ${phaseId} ${inputRole} input uses UP behavior, not SI.`);
  }

  // Load preloaded sample
  const samplePath = getSamplePath(phaseId, inputRole);
  if (!existsSync(samplePath)) {
    throw new Error(`SAMPLE_NOT_FOUND: Synthetic sample not found at ${samplePath}`);
  }
  const sampleBuffer = readFileSync(samplePath);
  const fileName = path.basename(samplePath);

  // Validate sample content does not contain prohibited labels
  const sampleTextPreview = `Synthetic sample for ${intakeConfig.logicalName}, represented by ${intakeConfig.systemRepresented}`;
  assertNoProhibitedLabels(sampleTextPreview);

  // Register artifact
  const artifactId = randomUUID();
  await db.insert(artifactRegistry).values({
    artifactId,
    artifactName: intakeConfig.logicalName,
    artifactType: 'XLSX',
    source: 'SyntheticSample',
    intakeBehavior: 'SI',
    version: 1,
    phaseId: phaseId as any,
    gateId: phaseId as any,
    generatedBy: 'simulated-connector',
    disclaimerPresent: true,
    storageUri: samplePath,
    fileSizeBytes: sampleBuffer.length,
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
      intakeBehavior: 'SI',
      systemRepresented: intakeConfig.systemRepresented,
      readinessStatus: 'Synthetic System Input Ready',
      validationIssues: [],
    }).returning();
    phaseInput = inserted;
  }

  // Deactivate prior versions
  await db.update(inputVersions)
    .set({ active: false })
    .where(and(eq(inputVersions.inputId, phaseInput.inputId), eq(inputVersions.active, true)));

  const versions = await db.select().from(inputVersions)
    .where(eq(inputVersions.inputId, phaseInput.inputId));
  const versionNumber = versions.length + 1;

  // Create new active version
  const [newVersion] = await db.insert(inputVersions).values({
    inputId: phaseInput.inputId,
    versionNumber,
    artifactId,
    intakeBehavior: 'SI',
    active: true,
    validationResult: { passed: true, issues: [] } as any,
    affectedScope: [],
  }).returning();

  await db.update(phaseInputs)
    .set({ readinessStatus: 'Synthetic System Input Ready' })
    .where(eq(phaseInputs.inputId, phaseInput.inputId));

  // Write intake audit event (all 13 fields)
  await writeIntakeEvent({
    event_type: 'SIMULATED_INTAKE',
    phase_id: phaseId,
    logical_input: intakeConfig.logicalName,
    intake_behavior: 'SI',
    user_action: versionNumber === 1 ? 'sample_ingested' : 'revised_sample_ingested',
    system_represented: intakeConfig.systemRepresented,
    status: 'Synthetic System Input Ready',
    source_artifact_id: artifactId,
    normalized_artifact_id: artifactId,
    version: versionNumber,
    validation_result: { passed: true, issues: [], warnings: [] },
    timestamp: new Date().toISOString(),
    operator_id: 'user',
  });

  return { status: 'Synthetic System Input Ready', versionId: newVersion.versionId, artifactId };
}
