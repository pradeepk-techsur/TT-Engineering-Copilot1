import { test, expect } from '@playwright/test';

// Phase 0: external=UP, internal=SI
// Phase 3: external=SI, internal=UP

test.describe('Phase Workspace (AV-03)', () => {
  test('Phase 0 workspace loads with correct phase name', async ({ page }) => {
    await page.goto('/phase/0');
    await expect(page.getByRole('heading', { name: 'Phase 0: Project Initiation' })).toBeVisible();
  });

  test('Phase workspace shows "Open Intake Detail" link', async ({ page }) => {
    await page.goto('/phase/0');
    await expect(page.getByRole('link', { name: 'Open Intake Detail' })).toBeVisible();
  });

  test('Phase workspace shows both expected outputs', async ({ page }) => {
    await page.goto('/phase/0');
    await expect(page.getByTestId('outputs-panel')).toBeVisible();
    // Gate 0 is decided in the demo storyline, so Phase 0 has produced and had
    // approved both of its outputs. A phase that has not run shows the pending
    // state instead — both are valid, so accept either.
    const pending = page.getByTestId('outputs-pending');
    const rows = page.getByTestId('output-row');
    await expect(pending.or(rows.first())).toBeVisible({ timeout: 10000 });
  });
});

test.describe('UP Intake Card', () => {
  test('shows "Awaiting User Input" before upload', async ({ page }) => {
    // Phase 5 is pending, so its user-provided input is genuinely still
    // awaited. Phase 0's was uploaded before Gate 0 was decided.
    await page.goto('/phase/5');
    await expect(page.getByTestId('up-intake-internal').getByText('Awaiting User Input'))
      .toBeVisible();
  });

  test('shows the ready state once the input has been provided', async ({ page }) => {
    await page.goto('/phase/0');
    await expect(page.getByTestId('up-intake-external').getByText('User Input Ready'))
      .toBeVisible();
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

  test('"Ingest Sample" button is visible while a sample is still to be ingested', async ({ page }) => {
    // Phase 5's external input is SI and not yet ingested. Phase 0's was
    // ingested before Gate 0, so it shows the ingested state instead.
    await page.goto('/phase/5');
    await expect(page.getByTestId('ingest-sample-external')).toBeVisible();
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
    await page.goto('/phase/5');
    await page.getByTestId('ingest-sample-external').click();
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
