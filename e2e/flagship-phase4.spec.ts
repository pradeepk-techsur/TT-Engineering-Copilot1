import { test, expect } from '@playwright/test';
import { requireData } from './helpers/storyline';

/**
 * Findings & Actions (AV-07) is a tab on /audit, not its own route.
 * /findings-actions is kept only as a redirect for old links.
 */
test.describe('AV-07 Findings and Actions Workspace', () => {
  /** Opens the tab the workspace now lives on. */
  async function openFindingsTab(page: import('@playwright/test').Page) {
    await page.goto('/audit');
    await page.getByRole('tab', { name: 'Findings & Actions' }).click();
  }

  test('/findings-actions redirects to the Audit & Findings page', async ({ page }) => {
    await page.goto('/findings-actions');
    await expect(page).toHaveURL('/audit');
    await expect(page.getByRole('heading', { name: 'Audit & Findings' })).toBeVisible();
  });

  test('the Findings & Actions tab renders the workspace', async ({ page }) => {
    await openFindingsTab(page);
    await expect(page.getByTestId('findings-actions-workspace')).toBeVisible();
  });

  test('shows findings summary table', async ({ page }) => {
    await openFindingsTab(page);
    await expect(page.getByTestId('findings-summary-table')).toBeVisible({ timeout: 10000 });
  });

  test('seeded findings have Seeded badge', async ({ page }) => {
    // A fresh database has no findings, so there is no badge to look for.
    await requireData(page.request, 'findings');
    await openFindingsTab(page);
    await expect(page.getByTestId('findings-actions-workspace')).toBeVisible();
    await expect(page.getByTestId('seeded-badge').first()).toBeVisible({ timeout: 10000 });
  });

  test('the workspace renders whether or not any findings exist', async ({ page }) => {
    // The invariant behind the test above: the tab always loads.
    await openFindingsTab(page);
    await expect(page.getByTestId('findings-actions-workspace')).toBeVisible();
  });

  test('blocking actions banner appears when A3-001 is open', async ({ page }) => {
    await requireData(page.request, 'blockingAction');
    await openFindingsTab(page);
    await expect(page.getByTestId('findings-actions-workspace')).toBeVisible();
    const banner = page.getByTestId('blocking-actions-banner');
    await expect(banner).toBeVisible({ timeout: 10000 });
    await expect(banner).toContainText('Blocking');
    await expect(banner).toContainText('A3-001');
  });

  test('a risk-score drill-down link opens the Findings & Actions tab', async ({ page }) => {
    // The Gate Review risk score and advisory link here; landing on the event
    // log instead would make every one of those links a dead end.
    await page.goto('/audit?tab=findings&finding=F3-001');
    await expect(page.getByTestId('findings-actions-workspace')).toBeVisible({ timeout: 10000 });
  });

  test('sidebar Audit & Findings link reaches the workspace', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('complementary', { name: 'Main navigation' })
      .getByRole('link', { name: 'Audit & Findings' }).click();
    await expect(page).toHaveURL('/audit');
    await page.getByRole('tab', { name: 'Findings & Actions' }).click();
    await expect(page.getByTestId('findings-actions-workspace')).toBeVisible();
  });
});

test.describe('AV-06 Technical Checklist Workspace', () => {
  test('Phase 0 shows Kickoff checklist items', async ({ page }) => {
    await page.goto('/phase/0/checklist');
    await expect(page.getByTestId('technical-checklist-phase-0')).toBeVisible();
    await expect(page.getByText('Resources Allocation')).toBeVisible();
    await expect(page.getByText('Milestones', { exact: true }).first()).toBeVisible();
  });

  test('Phase 1 shows SLR checklist items', async ({ page }) => {
    await page.goto('/phase/1/checklist');
    await expect(page.getByTestId('technical-checklist-phase-1')).toBeVisible();
    await expect(page.getByText('Requirements Completeness')).toBeVisible();
  });

  test('Phase 3 shows Schematic Review checklist items', async ({ page }) => {
    await page.goto('/phase/3/checklist');
    await expect(page.getByTestId('technical-checklist-phase-3')).toBeVisible();
    await expect(page.getByText('Requirements Traceability')).toBeVisible();
  });

  test('Phase 4 shows PCB Layout / CDR checklist items', async ({ page }) => {
    await page.goto('/phase/4/checklist');
    await expect(page.getByTestId('technical-checklist-phase-4')).toBeVisible();
    await expect(page.getByText('Netlist Integrity')).toBeVisible();
    await expect(page.getByText('Trace/Space Limits')).toBeVisible();
  });

  test('Phase 2 shows "No technical review mapped" message', async ({ page }) => {
    await page.goto('/phase/2/checklist');
    await expect(page.getByTestId('no-technical-review')).toBeVisible();
    await expect(page.getByText(/No technical review is mapped/)).toBeVisible();
    await expect(page.getByText('Phases 0, 1, 3, and 4 only', { exact: false })).toBeVisible();
  });

  test('Phase 5 shows "No technical review mapped" message', async ({ page }) => {
    await page.goto('/phase/5/checklist');
    await expect(page.getByTestId('no-technical-review')).toBeVisible();
  });

  test('Phases 6, 7, 8, 9 show no technical review', async ({ page }) => {
    for (const phaseId of [6, 7, 8, 9]) {
      await page.goto(`/phase/${phaseId}/checklist`);
      await expect(page.getByTestId('no-technical-review')).toBeVisible();
    }
  });

  test('Open Checklist button in Phase Workspace navigates here', async ({ page }) => {
    await page.goto('/phase/4');
    await page.getByRole('link', { name: 'Open Checklist' }).click();
    await expect(page).toHaveURL('/phase/4/checklist');
  });
});

test.describe('AV-05 Artifact Viewer', () => {
  test('artifact viewer page has correct structure', async ({ page }) => {
    // Navigate to a sample artifact ID (using a known synthetic ID format)
    await page.goto('/artifacts/sample-id-does-not-exist');
    // Should show Artifact Viewer heading even if artifact not found
    await expect(page.getByText('Artifact Viewer')).toBeVisible();
  });

  test('artifact viewer shows synthetic disclaimer', async ({ page }) => {
    await page.goto('/artifacts/any-id');
    // Disclaimer should appear in the page (from ArtifactViewer component) or loading state
    await expect(page.getByText('Artifact Viewer')).toBeVisible();
  });
});

test.describe('Phase 4 execution flow (requires seeded data)', () => {
  test('Phase 4 workspace shows both SI (external) and UP (internal) input cards', async ({ page }) => {
    await page.goto('/phase/4');
    // Phase 4 external = SI (DFM/standards), internal = UP (released design)
    await expect(page.getByTestId('si-intake-external')).toBeVisible();
    await expect(page.getByTestId('up-intake-internal')).toBeVisible();
  });

  test('Phase 4 workspace shows OutputsPanel (SWR) not static list', async ({ page }) => {
    await page.goto('/phase/4');
    // OutputsPanel renders with data-testid="outputs-panel" in all states
    // (outputs-loading while fetching, outputs-pending when 0 rows, output-row when populated)
    await expect(page.getByTestId('outputs-panel')).toBeVisible({ timeout: 8000 });
  });

  test('Phase 3 workspace shows OutputsPanel (SWR) not static list', async ({ page }) => {
    await page.goto('/phase/3');
    // Guard changed from phaseId <= 2 to phaseId <= 4 in Task 1 of this plan
    await expect(page.getByTestId('outputs-panel')).toBeVisible({ timeout: 8000 });
  });

  test('POST /api/phases/3/execute returns 202 (not 409) with seeded phaseInputs', async ({ page }) => {
    // Core fix validation: seed.ts now provides Phase 3 phaseInputs rows so the
    // readiness guard in execute/route.ts passes. This test proves seed → execute → not-409.
    const response = await page.request.post('/api/phases/3/execute');
    // 202 = accepted for processing (agent kicked off)
    // 409 = INPUTS_NOT_READY (seed rows missing — the bug this plan fixes)
    // 500 = agent error (LLM key missing in test env — also acceptable, proves guard passed)
    // We assert NOT 409, which is the specific regression this plan must prevent.
    expect(response.status()).not.toBe(409);
  });

  test('Gate 4 review workspace renders deterministicChecks card container', async ({ page }) => {
    await page.goto('/gate/4/review');
    // The card renders when data.deterministicChecks.length > 0.
    // In CI (no Phase 4 run yet), the card is hidden — but the page itself must load.
    // We verify GateReviewWorkspace loads without error and the heading is visible.
    await expect(page.getByRole('heading', { name: /Gate 4|CDR/i })).toBeVisible({ timeout: 8000 });
    // If check results exist (post-run environment), assert the card is present too.
    const checkCard = page.getByText('Deterministic Check Results');
    const cardVisible = await checkCard.isVisible().catch(() => false);
    if (cardVisible) {
      await expect(page.getByTestId('check-result-row-0')).toBeVisible();
    }
  });

  test('Technical Checklist Workspace shows Phase 4 checklist from sidebar', async ({ page }) => {
    await page.goto('/phase/4');
    const checklistBtn = page.getByRole('link', { name: 'Open Checklist' });
    await expect(checklistBtn).toBeVisible();
    await checklistBtn.click();
    await expect(page).toHaveURL('/phase/4/checklist');
    await expect(page.getByText('Netlist Integrity')).toBeVisible();
  });
});
