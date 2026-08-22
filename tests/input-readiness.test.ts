import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PHASE_CONFIG_MAP } from '@/shared/constants/phaseConfig';
import { readFileSync } from 'fs';
import { PHASE_IDS } from '@/db/baseline';

/**
 * The rows the fake database hands back, set per test.
 * `versions` is keyed by inputId so a row can exist with no active version —
 * the state the Phase 3 seed produced, and the one the old guard could not see.
 */
let inputRows: any[] = [];
let versions: Record<string, any[]> = {};

vi.mock('@/db', async () => {
  const schema = await import('@/db/schema');
  return {
    db: {
      select: () => ({
        from: (table: any) => ({
          where: () => Promise.resolve(
            table === schema.phaseInputs ? inputRows : (versions[currentInputId] ?? [])
          ),
        }),
      }),
    },
  };
});

// The inputVersions lookup is per-inputId. Keep the real drizzle helpers —
// schema.ts needs `sql` at import time — and just observe the id going past.
let currentInputId = '';
vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('drizzle-orm')>();
  return {
    ...actual,
    eq: (col: any, val: any) => {
      if (typeof val === 'string' && val.startsWith('in-')) currentInputId = val;
      return actual.eq(col, val);
    },
  };
});

const { readPhaseReadiness, READY_STATUS } = await import('@/server/orchestrator/inputReadiness');

function rowFor(phaseId: number, role: 'external' | 'internal', status?: string) {
  const config = PHASE_CONFIG_MAP[phaseId as keyof typeof PHASE_CONFIG_MAP];
  const intake = role === 'external' ? config.externalIntake : config.internalIntake;
  return {
    inputId: `in-${phaseId}-${role}`,
    phaseId,
    inputRole: role,
    logicalName: intake.logicalName,
    intakeBehavior: intake.behavior,
    readinessStatus: status ?? READY_STATUS[intake.behavior as 'UP' | 'SI'],
  };
}

/** Both inputs present and ready, each backed by a stored artifact. */
function fullyReady(phaseId: number) {
  inputRows = [rowFor(phaseId, 'external'), rowFor(phaseId, 'internal')];
  versions = {
    [`in-${phaseId}-external`]: [{ active: true, artifactId: 'art-ext', versionNumber: 1 }],
    [`in-${phaseId}-internal`]: [{ active: true, artifactId: 'art-int', versionNumber: 1 }],
  };
}

beforeEach(() => {
  inputRows = [];
  versions = {};
  currentInputId = '';
});

describe('A phase may run only when its inputs are backed by stored artifacts', () => {
  it('is not ready when no input rows exist — the state every phase starts in', async () => {
    const r = await readPhaseReadiness(3);
    expect(r.ready).toBe(false);
    expect(r.inputs.map(i => i.reason)).toEqual(['MISSING', 'MISSING']);
    expect(r.message).toContain('must be');
  });

  it('is not ready when the status says ready but nothing is stored', async () => {
    // Exactly what the Phase 3 seed wrote: two ready labels, no artifacts.
    inputRows = [rowFor(3, 'external'), rowFor(3, 'internal')];
    versions = {};

    const r = await readPhaseReadiness(3);
    expect(r.ready).toBe(false);
    expect(r.inputs.every(i => i.reason === 'NO_ARTIFACT')).toBe(true);
    expect(r.message).toContain('marked ready but has no stored artifact');
  });

  it('is not ready when an active version carries no artifact id', async () => {
    fullyReady(3);
    versions['in-3-internal'] = [{ active: true, artifactId: null, versionNumber: 1 }];

    const r = await readPhaseReadiness(3);
    expect(r.ready).toBe(false);
    expect(r.inputs.find(i => i.role === 'internal')!.reason).toBe('NO_ARTIFACT');
  });

  it('is not ready when validation failed, even with an artifact stored', async () => {
    fullyReady(3);
    inputRows = [rowFor(3, 'external'), rowFor(3, 'internal', 'Awaiting User Input')];

    const r = await readPhaseReadiness(3);
    expect(r.ready).toBe(false);
    expect(r.inputs.find(i => i.role === 'internal')!.reason).toBe('NOT_VALIDATED');
  });

  it('is ready only when both inputs are validated and stored', async () => {
    fullyReady(3);
    const r = await readPhaseReadiness(3);
    expect(r.ready).toBe(true);
    expect(r.inputs.every(i => i.reason === null)).toBe(true);
  });

  it('holds for every phase, with each phase’s own declared intake behaviors', async () => {
    for (const phaseId of PHASE_IDS) {
      const config = PHASE_CONFIG_MAP[phaseId as keyof typeof PHASE_CONFIG_MAP];

      inputRows = [];
      expect((await readPhaseReadiness(phaseId)).ready).toBe(false);

      fullyReady(phaseId);
      const ready = await readPhaseReadiness(phaseId);
      expect(ready.ready, `phase ${phaseId} should be ready`).toBe(true);
      // The status each input must carry is the one its own behavior declares —
      // not a spelling repeated per route.
      expect(ready.inputs.find(i => i.role === 'external')!.behavior)
        .toBe(config.externalIntake.behavior);
      expect(ready.inputs.find(i => i.role === 'internal')!.behavior)
        .toBe(config.internalIntake.behavior);
    }
  });

  it('rejects a phase outside the lifecycle', async () => {
    const r = await readPhaseReadiness(10);
    expect(r.ready).toBe(false);
    expect(r.message).toContain('not part of this lifecycle');
  });
});

describe('No execute route decides readiness for itself', () => {
  it('every phase route delegates to the shared guard', () => {
    for (const phaseId of PHASE_IDS) {
      const src = readFileSync(`src/app/api/phases/${phaseId}/execute/route.ts`, 'utf8');
      expect(src, `phase ${phaseId}`).toContain('readPhaseReadiness');
      // The string-only check that let a readiness label stand in for a file.
      expect(src, `phase ${phaseId} still reads readinessStatus directly`)
        .not.toContain('readinessStatus ===');
    }
  });
});
