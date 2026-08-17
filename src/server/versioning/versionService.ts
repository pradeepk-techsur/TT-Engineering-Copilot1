import { db } from '@/db';
import { inputVersions } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { VersionRecord } from './types';

/**
 * Create a new version record for a logical input.
 * Does NOT activate it yet — call activateVersion() after validation passes.
 */
export async function createNewVersion(
  inputId: string,
  artifactId: string,
  intakeBehavior: 'UP' | 'SI',
  validationResult: { passed: boolean; issues: unknown[] }
): Promise<VersionRecord> {
  // Get current version count to determine next version number
  const existing = await db.select().from(inputVersions)
    .where(eq(inputVersions.inputId, inputId));
  const nextVersion = existing.length + 1;

  const [newVersion] = await db.insert(inputVersions).values({
    inputId,
    versionNumber: nextVersion,
    artifactId,
    intakeBehavior,
    active: false,  // Not active until explicitly activated
    validationResult: validationResult as unknown as Record<string, unknown>,
    affectedScope: [],
  }).returning();

  return {
    versionId: newVersion.versionId,
    inputId: newVersion.inputId,
    versionNumber: newVersion.versionNumber,
    artifactId: newVersion.artifactId,
    intakeBehavior: newVersion.intakeBehavior as 'UP' | 'SI',
    active: newVersion.active,
    validationResult: newVersion.validationResult as unknown as { passed: boolean; issues: unknown[] },
    intakeTimestamp: newVersion.intakeTimestamp,
    invalidatedBy: newVersion.invalidatedBy,
    rerunTriggered: newVersion.rerunTriggered,
    affectedScope: newVersion.affectedScope,
  };
}

/**
 * Activate a version — deactivates the current active version first.
 * The DB partial unique index (WHERE active = TRUE) enforces single active version.
 * NEVER deletes prior versions.
 */
export async function activateVersion(versionId: string, inputId: string): Promise<void> {
  // Deactivate current active version (if any) — mark invalidatedBy = new versionId
  const [currentActive] = await db.select().from(inputVersions)
    .where(and(eq(inputVersions.inputId, inputId), eq(inputVersions.active, true)));

  if (currentActive) {
    await db.update(inputVersions)
      .set({ active: false, invalidatedBy: versionId })
      .where(eq(inputVersions.versionId, currentActive.versionId));
  }

  // Activate new version
  await db.update(inputVersions)
    .set({ active: true })
    .where(eq(inputVersions.versionId, versionId));
}

/**
 * Get all versions for a logical input, ordered by version number descending.
 * NEVER filters out inactive versions — all are preserved and returned.
 */
export async function getVersionHistory(inputId: string): Promise<VersionRecord[]> {
  const versions = await db.select().from(inputVersions)
    .where(eq(inputVersions.inputId, inputId))
    .orderBy(desc(inputVersions.versionNumber));

  return versions.map(v => ({
    versionId: v.versionId,
    inputId: v.inputId,
    versionNumber: v.versionNumber,
    artifactId: v.artifactId,
    intakeBehavior: v.intakeBehavior as 'UP' | 'SI',
    active: v.active,
    validationResult: v.validationResult as unknown as { passed: boolean; issues: unknown[] },
    intakeTimestamp: v.intakeTimestamp,
    invalidatedBy: v.invalidatedBy,
    rerunTriggered: v.rerunTriggered,
    affectedScope: v.affectedScope,
  }));
}

/** Mark a version as having triggered a rerun, with its computed affected scope */
export async function markVersionRerun(versionId: string, affectedScope: string[]): Promise<void> {
  await db.update(inputVersions)
    .set({ rerunTriggered: true, affectedScope })
    .where(eq(inputVersions.versionId, versionId));
}
