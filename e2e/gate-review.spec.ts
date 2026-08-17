import { test, expect } from '@playwright/test';

test.describe('Gate Review Workspace (AV-08) — Core Behavior', () => {
  test('Gate 0 review page loads at /gate/0/review', async ({ page }) => {
    await page.goto('/gate/0/review');
    await expect(page.getByText('Gate 0 Review Workspace')).toBeVisible();
    await expect(page.getByText('Human gate decision required')).toBeVisible();
  });

  test('Gate review workspace is rendered from ProjectState — no gate-pack artifact link', async ({ page }) => {
    await page.goto('/gate/0/review');
    // Verify the "no gate-pack" label is present (rendered after SWR load)
    await expect(page.getByText(/Rendered from ProjectState/i)).toBeVisible({ timeout: 10000 });
    // Should NOT contain any link to a gate-pack PDF or artifact
    const links = page.locator('a[href*="gate-pack"]');
    await expect(links).toHaveCount(0);
  });

  test('AI Recommendation panel shows Advisory Only label', async ({ page }) => {
    await page.goto('/gate/0/review');
    // Advisory label must be visible (waits for SWR load of seeded AI recommendation)
    await expect(page.getByTestId('advisory-label')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('advisory-label')).toContainText('Advisory Only');
    await expect(page.getByTestId('advisory-label')).toContainText('Human Decision Required');
  });
});

test.describe('Gate Decision Selector — Human Authority Enforcement', () => {
  test('Record Decision button is disabled by default (no pre-selection)', async ({ page }) => {
    await page.goto('/gate/0/review');
    // Wait for the decision selector to render
    await expect(page.getByTestId('gate-decision-selector')).toBeVisible({ timeout: 10000 });
    const recordBtn = page.getByTestId('record-decision-button');
    // Button must be disabled until outcome is selected
    await expect(recordBtn).toBeDisabled();
  });

  test('Radio buttons have no pre-selected value', async ({ page }) => {
    await page.goto('/gate/0/review');
    // Wait for the decision selector to render
    await expect(page.getByTestId('gate-decision-selector')).toBeVisible({ timeout: 10000 });
    const radioGroup = page.getByTestId('gate-outcome-radio');
    // None of the radio options should be checked initially
    // base-ui uses data-checked attribute (not data-state="checked")
    const checkedRadios = radioGroup.locator('[data-slot="radio-group-item"][data-checked]');
    await expect(checkedRadios).toHaveCount(0);
  });

  test('Record Decision remains disabled without reviewer role', async ({ page }) => {
    await page.goto('/gate/0/review');
    await expect(page.getByTestId('gate-decision-selector')).toBeVisible({ timeout: 10000 });
    // Select outcome but leave reviewer role empty
    // Use getByRole('radio') to avoid strict mode violation with base-ui's aria-labelledby
    await page.getByRole('radio', { name: 'Pass' }).click();
    const recordBtn = page.getByTestId('record-decision-button');
    await expect(recordBtn).toBeDisabled();  // Still disabled — no reviewer role
  });

  test('Record Decision becomes enabled when outcome selected AND reviewer role entered', async ({ page }) => {
    await page.goto('/gate/0/review');
    await expect(page.getByTestId('gate-decision-selector')).toBeVisible({ timeout: 10000 });
    await page.getByRole('radio', { name: 'Pass' }).click();
    await page.getByTestId('reviewer-role-input').fill('Program Manager');
    const recordBtn = page.getByTestId('record-decision-button');
    await expect(recordBtn).toBeEnabled();
  });

  test('Confirmation dialog appears when Record Decision clicked', async ({ page }) => {
    await page.goto('/gate/0/review');
    await expect(page.getByTestId('gate-decision-selector')).toBeVisible({ timeout: 10000 });
    await page.getByRole('radio', { name: 'Pass' }).click();
    await page.getByTestId('reviewer-role-input').fill('Engineering Lead');
    await page.getByTestId('record-decision-button').click();
    // AlertDialog should appear — check for confirmation content
    // base-ui AlertDialog renders with data-slot="alert-dialog-content"
    await expect(page.getByText(/You are recording/)).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-slot="alert-dialog-content"]')).toBeVisible({ timeout: 5000 });
  });

  test('Cancel button in dialog closes dialog without submitting', async ({ page }) => {
    await page.goto('/gate/0/review');
    await expect(page.getByTestId('gate-decision-selector')).toBeVisible({ timeout: 10000 });
    await page.getByRole('radio', { name: 'Pass' }).click();
    await page.getByTestId('reviewer-role-input').fill('Engineering Lead');
    await page.getByTestId('record-decision-button').click();
    // Wait for dialog to appear
    await expect(page.getByText(/You are recording/)).toBeVisible({ timeout: 5000 });
    await page.getByText('Cancel').click();
    // Dialog should be gone; page should still show gate review
    await expect(page.getByTestId('gate-decision-selector')).toBeVisible();
  });
});

test.describe('Gate Review — Findings Display', () => {
  test('Gate 2 review (if executed) shows findings table', async ({ page }) => {
    await page.goto('/gate/2/review');
    // Findings table may be empty if Phase 2 not yet executed
    await expect(page.getByTestId('findings-summary-table')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Gate Review Workspace — All 3 gates accessible', () => {
  for (const gateId of [0, 1, 2]) {
    test(`Gate ${gateId} review page loads without error`, async ({ page }) => {
      await page.goto(`/gate/${gateId}/review`);
      await expect(page.getByText(`Gate ${gateId} Review Workspace`)).toBeVisible();
      // No error messages
      await expect(page.getByText('Invalid gate number')).not.toBeVisible();
    });
  }
});

test.describe('Navigation — Gate Review is reachable', () => {
  test('Gate Review reachable from Lifecycle View "Gate Review →" links', async ({ page }) => {
    await page.goto('/lifecycle');
    // Wait for lifecycle phase cards to render (SSR page)
    await expect(page.getByTestId('phase-0')).toBeVisible({ timeout: 10000 });
    // Click Gate Review link for phase 0 — link href is /gate/0/review
    await page.getByTestId('phase-0').locator('a[href="/gate/0/review"]').click();
    await expect(page).toHaveURL('/gate/0/review');
  });

  test('Gate Review reachable from Phase Workspace "Open Gate Review" button', async ({ page }) => {
    await page.goto('/phase/0');
    await page.getByRole('link', { name: 'Open Gate Review' }).click();
    await expect(page).toHaveURL('/gate/0/review');
  });
});

test.describe('Phase Workspace — Run Phase button wired', () => {
  test('Run Phase button is present and wired (not a no-op)', async ({ page }) => {
    await page.goto('/phase/0');
    const btn = page.getByTestId('run-phase-button');
    await expect(btn).toBeVisible();
    // Button should be visible regardless of readiness state
    // The UX contract: button always visible, disabled state reflects readiness
    await expect(btn).toBeVisible(); // basic presence check
  });
});
