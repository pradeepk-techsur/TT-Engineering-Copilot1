import { test, expect } from '@playwright/test';

// Phase 0: external=UP, internal=SI
// Phase 3: external=SI, internal=UP

test.describe('Phase Workspace (AV-03)', () => {
  test('Phase 0 workspace loads with correct phase name', async ({ page }) => {
    await page.goto('/phase/0');
    await expect(page.getByRole('heading', { name: 'Phase 0: Commercial Assessment' })).toBeVisible();
  });

  test('Phase workspace shows "Open Intake Detail" link', async ({ page }) => {
    await page.goto('/phase/0');
    await expect(page.getByRole('link', { name: 'Open Intake Detail' })).toBeVisible();
  });

  test('Phase workspace shows both expected outputs', async ({ page }) => {
    await page.goto('/phase/0');
    await expect(page.getByText('Opportunity Summary and Bid/No-Bid Recommendation')).toBeVisible();
    await expect(page.getByText('Capability-Match and Critical-Gap Matrix')).toBeVisible();
  });
});

test.describe('UP Intake Card', () => {
  test('shows "Awaiting User Input" status before upload for phase 0 external', async ({ page }) => {
    await page.goto('/phase/0');
    const externalCard = page.getByTestId('up-intake-external');
    await expect(externalCard.getByText('Awaiting User Input')).toBeVisible();
  });

  test('shows "User-Provided File" badge', async ({ page }) => {
    await page.goto('/phase/0');
    await expect(page.getByTestId('up-intake-external').getByText('User-Provided File')).toBeVisible();
  });

  test('dropzone is visible', async ({ page }) => {
    await page.goto('/phase/0');
    await expect(page.getByTestId('dropzone-external')).toBeVisible();
  });

  test('does not show per-card synthetic disclaimer (global AppShell badge covers it)', async ({ page }) => {
    await page.goto('/phase/0');
    const card = page.getByTestId('up-intake-external');
    await expect(card.getByText(/Synthetic POC Data/)).not.toBeVisible();
  });

  test('never shows "replacement input" text', async ({ page }) => {
    await page.goto('/phase/0');
    const body = await page.textContent('body');
    expect(body).not.toContain('replacement input');
  });
});

test.describe('SI Intake Card', () => {
  test('shows "Simulated Connector" badge for phase 0 internal', async ({ page }) => {
    await page.goto('/phase/0');
    const internalCard = page.getByTestId('si-intake-internal');
    await expect(internalCard.getByText('Simulated Connector', { exact: true })).toBeVisible();
  });

  test('shows "Preloaded Synthetic Sample" label', async ({ page }) => {
    await page.goto('/phase/0');
    await expect(page.getByTestId('si-intake-internal').getByText('Preloaded Synthetic Sample', { exact: true })).toBeVisible();
  });

  test('shows "No live connection" statement', async ({ page }) => {
    await page.goto('/phase/0');
    await expect(page.getByTestId('si-intake-internal').getByText(/No live connection/)).toBeVisible();
  });

  test('"Ingest Sample" button is visible', async ({ page }) => {
    await page.goto('/phase/0');
    await expect(page.getByTestId('ingest-sample-internal')).toBeVisible();
  });

  test('View and Download controls are present', async ({ page }) => {
    await page.goto('/phase/0');
    await expect(page.getByTestId('view-sample-internal')).toBeVisible();
    await expect(page.getByTestId('download-sample-internal')).toBeVisible();
  });

  test('never shows "Connected to" text', async ({ page }) => {
    await page.goto('/phase/0');
    const body = await page.textContent('body');
    expect(body).not.toContain('Connected to ');
    expect(body).not.toContain('Retrieved from ');
    expect(body).not.toContain('Live Cora');
    expect(body).not.toContain('Live Salesforce');
  });

  test('SI confirmation dialog appears on Ingest Sample click', async ({ page }) => {
    await page.goto('/phase/0');
    await page.getByTestId('ingest-sample-internal').click();
    await expect(page.getByRole('heading', { name: 'Ingest Synthetic Sample' })).toBeVisible();
    // AlertDialog description contains "No live connection" — search in dialog description
    await expect(page.getByRole('alertdialog').getByText(/No live connection to/)).toBeVisible();
  });
});

test.describe('Phase Execution Status', () => {
  test('shows status badge on phase workspace', async ({ page }) => {
    await page.goto('/phase/0');
    await expect(page.getByTestId('phase-execution-status')).toBeVisible();
  });

  test('Run Phase button is disabled when inputs not ready', async ({ page }) => {
    await page.goto('/phase/0');
    const runButton = page.getByTestId('run-phase-button');
    await expect(runButton).toBeDisabled();
  });
});

test.describe('Input Intake Panel (AV-04)', () => {
  test('loads with version history tables', async ({ page }) => {
    await page.goto('/phase/0/intake');
    await expect(page.getByText('Input Intake and Validation')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Version History' })).toBeVisible();
    await expect(page.getByText('External Input — Version History')).toBeVisible();
    await expect(page.getByText('Internal Input — Version History')).toBeVisible();
  });

  test('intake cards do not show Synthetic POC Data disclaimer', async ({ page }) => {
    await page.goto('/phase/1/intake');
    const body = await page.textContent('body');
    // The AppShell header carries the global synthetic badge; per-card disclaimers are removed
    const cardArea = page.getByTestId('up-intake-external');
    await expect(cardArea.getByText(/Synthetic POC Data/)).not.toBeVisible();
  });

  test('back link returns to phase workspace', async ({ page }) => {
    await page.goto('/phase/0/intake');
    await page.getByText('← Back to Phase Workspace').click();
    await expect(page).toHaveURL('/phase/0');
  });
});

test.describe('Prohibited labels — all phases', () => {
  const phasesToCheck = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  for (const phaseId of phasesToCheck) {
    test(`Phase ${phaseId} workspace has no prohibited labels`, async ({ page }) => {
      await page.goto(`/phase/${phaseId}`);
      const body = await page.textContent('body') ?? '';
      expect(body).not.toContain('Connected to ');
      expect(body).not.toContain('Retrieved from ');
      expect(body).not.toContain('replacement input');
    });
  }
});
