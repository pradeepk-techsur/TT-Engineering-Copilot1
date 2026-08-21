import { test, type APIRequestContext } from '@playwright/test';

/**
 * Preconditions for data-dependent assertions.
 *
 * The suite runs against two datasets. Preview mode serves the seeded demo
 * storyline — Gate 3 open, finding F3-001, blocking action A3-001, Phases 0-2
 * decided. A freshly migrated database has none of that: it starts at Phase 0
 * with no findings and no actions.
 *
 * Both are legitimate. So a test that asserts a specific score, finding or
 * badge has to say so and skip when that data is absent, rather than reporting
 * a different dataset as a defect. Everything that does NOT use these helpers
 * is an invariant and must hold either way.
 */

let cached: { findings?: boolean; actions?: boolean; readyInput?: boolean; gate3?: boolean } = {};

/** Reset between workers is unnecessary — each worker gets its own module. */
async function probe<K extends keyof typeof cached>(
  key: K,
  check: () => Promise<boolean>
): Promise<boolean> {
  if (cached[key] === undefined) {
    try {
      cached[key] = await check();
    } catch {
      cached[key] = false;
    }
  }
  return cached[key] as boolean;
}

/** Any finding recorded at all. */
export async function hasFindings(request: APIRequestContext) {
  return probe('findings', async () => {
    const res = await request.get('/api/findings');
    if (!res.ok()) return false;
    return ((await res.json()).findings ?? []).length > 0;
  });
}

/** Any blocking action still open. */
export async function hasOpenBlockingAction(request: APIRequestContext) {
  return probe('actions', async () => {
    const res = await request.get('/api/actions');
    if (!res.ok()) return false;
    return ((await res.json()).blockingOpen ?? 0) > 0;
  });
}

/** Phase 0's external input has been provided. */
export async function hasReadyPhase0Input(request: APIRequestContext) {
  return probe('readyInput', async () => {
    const res = await request.get('/api/phases/0/inputs');
    if (!res.ok()) return false;
    const body = await res.json();
    return body.external?.isReady === true;
  });
}

/** Gate 3 is open with F3-001 — the full demo storyline. */
export async function hasGate3Storyline(request: APIRequestContext) {
  return probe('gate3', async () => {
    const res = await request.get('/api/gates/3/advisory');
    if (!res.ok()) return false;
    const { header, advisory } = await res.json();
    return header.gateState === 'Open' &&
      advisory.recommendationAvailable === true &&
      advisory.keyRisks.some((r: { detail: { findingId?: string } }) => r.detail.findingId === 'F3-001');
  });
}

/** Skip the current test unless the named data is present. */
export async function requireData(
  request: APIRequestContext,
  what: 'findings' | 'blockingAction' | 'readyPhase0Input' | 'gate3Storyline'
) {
  const checks = {
    findings: [hasFindings, 'no findings recorded in this dataset'],
    blockingAction: [hasOpenBlockingAction, 'no open blocking action in this dataset'],
    readyPhase0Input: [hasReadyPhase0Input, 'Phase 0 input not yet provided in this dataset'],
    gate3Storyline: [hasGate3Storyline, 'seeded Gate 3 storyline not present (a fresh database starts at Phase 0)'],
  } as const;
  const [check, reason] = checks[what];
  test.skip(!(await (check as (r: APIRequestContext) => Promise<boolean>)(request)), reason as string);
}
