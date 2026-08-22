import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { clearRunFiles } from '@/server/cycle/newCycle';
import {
  PHASE_IDS, PROJECT_BASELINE, SEEDED_AI_RECOMMENDATIONS,
  baselinePhaseState,
} from '@/db/baseline';
import { PHASE_CONFIG_MAP } from '@/shared/constants/phaseConfig';

/**
 * New Cycle deletes files, so these run against a throwaway root rather than
 * the working tree. `clearRunFiles` takes the root for exactly that reason.
 */
describe('clearRunFiles', () => {
  let root: string;

  const write = (...segments: string[]) => {
    const full = path.join(root, ...segments);
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, 'x');
  };

  beforeEach(() => {
    root = mkdtempSync(path.join(tmpdir(), 'tt-reset-'));
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('deletes the uploaded inputs and generated outputs, and counts them', () => {
    // Dataset: two uploads across two phases, three outputs in one phase.
    write('uploads', 'EVINV-POC-001', 'phase1', 'external-v-1-req.xlsx');
    write('uploads', 'EVINV-POC-001', 'phase4', 'internal-v-1-design.xlsx');
    write('outputs', 'EVINV-POC-001', 'phase0', 'phase0-capability-gap-matrix.xlsx');
    write('outputs', 'EVINV-POC-001', 'phase0', 'phase0-opportunity-summary.txt');
    write('outputs', 'EVINV-POC-001', 'phase1', 'phase1-costed-proposal.txt');

    const removed = clearRunFiles('EVINV-POC-001', root);

    expect(removed).toEqual({ uploads: 2, outputs: 3 });
    expect(existsSync(path.join(root, 'uploads', 'EVINV-POC-001'))).toBe(false);
    expect(existsSync(path.join(root, 'outputs', 'EVINV-POC-001'))).toBe(false);
  });

  it('leaves the shipped synthetic samples and other projects alone', () => {
    write('public', 'samples', 'phase0-int-capability-assessment.xlsx');
    write('uploads', 'OTHER-PROJECT', 'phase0', 'keep-me.xlsx');
    write('uploads', 'EVINV-POC-001', 'phase0', 'clear-me.xlsx');

    clearRunFiles('EVINV-POC-001', root);

    expect(existsSync(path.join(root, 'public', 'samples', 'phase0-int-capability-assessment.xlsx')))
      .toBe(true);
    expect(existsSync(path.join(root, 'uploads', 'OTHER-PROJECT', 'phase0', 'keep-me.xlsx')))
      .toBe(true);
  });

  it('is a no-op on a project that has never uploaded or generated anything', () => {
    expect(clearRunFiles('EVINV-POC-001', root)).toEqual({ uploads: 0, outputs: 0 });
  });

  it('refuses a project id that would escape the run directories', () => {
    for (const unsafe of ['../..', 'a/b', '..', '']) {
      expect(() => clearRunFiles(unsafe, root)).toThrow('UNSAFE_PROJECT_ID');
    }
  });
});

/**
 * The baseline is shared by `db:seed` and New Cycle, so "new cycle" and
 * "freshly installed" are the same state. These pin the parts of it the app's
 * screens depend on.
 */
describe('seeded baseline', () => {
  it('starts Phase 0 waiting for inputs and every later phase pending, all gates locked', () => {
    expect(PHASE_IDS).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(baselinePhaseState(0).phaseState).toBe('AwaitingInputs');
    for (const phaseId of PHASE_IDS.slice(1)) {
      expect(baselinePhaseState(phaseId).phaseState).toBe('Pending');
    }
    for (const phaseId of PHASE_IDS) {
      expect(baselinePhaseState(phaseId).gateState).toBe('Locked');
    }
  });

  it('carries no execution record for any phase', () => {
    for (const phaseId of PHASE_IDS) {
      const baseline = baselinePhaseState(phaseId);
      expect(baseline.compactPhaseSummary).toBeNull();
      expect(baseline.executionStartedAt).toBeNull();
      expect(baseline.executionCompletedAt).toBeNull();
    }
  });

  it('seeds an advisory-labelled AI recommendation for phases 0-2 only', () => {
    expect(Object.keys(SEEDED_AI_RECOMMENDATIONS).map(Number).sort()).toEqual([0, 1, 2]);
    for (const phaseId of [0, 1, 2]) {
      expect(baselinePhaseState(phaseId).aiRecommendation).toMatchObject({
        advisoryLabel: 'Advisory Only — Human Decision Required',
      });
    }
    for (const phaseId of [3, 4, 5, 6, 7, 8, 9]) {
      expect(baselinePhaseState(phaseId).aiRecommendation).toBeNull();
    }
  });

  it('returns the project to Phase 0 / Gate 0, Active', () => {
    expect(PROJECT_BASELINE).toMatchObject({
      currentPhase: 0,
      currentGate: 0,
      currentTechnicalReview: 'Kickoff',
      projectStatus: 'Active',
      syntheticDataIndicator: true,
    });
  });

  it('seeds no phase inputs at all, so every phase comes back awaiting intake', async () => {
    const baseline = await import('@/db/baseline');
    // Phase 3's inputs used to be seeded ready. A seeded 'User Input Ready' on a
    // USER-PROVIDED input asserts a file nobody uploaded, and it made a new
    // cycle look like it had done nothing on the Phase 3 workspace.
    expect('SEEDED_PHASE_INPUTS' in baseline).toBe(false);
  });

  it('leaves no phase with inputs ready ahead of intake', () => {
    // The guarantee stated over the phase config rather than over a seed list:
    // readiness is something the user creates, for all ten phases equally.
    for (const phaseId of PHASE_IDS) {
      const config = PHASE_CONFIG_MAP[phaseId as keyof typeof PHASE_CONFIG_MAP];
      expect(config).toBeDefined();
      expect(baselinePhaseState(phaseId).phaseState).toBe(phaseId === 0 ? 'AwaitingInputs' : 'Pending');
    }
  });
});
