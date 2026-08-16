import { test, expect } from '@playwright/test';

test.describe('AV-01 Project Overview', () => {
  test('loads and shows EVINV-POC-001 identity', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/TT Engineering Copilot/);
    // Project ID appears in both the top bar and the card — use first match
    await expect(page.getByText('EVINV-POC-001').first()).toBeVisible();
    await expect(page.getByText('EV-INV-800 Demonstration Traction Inverter')).toBeVisible();
    await expect(page.getByText('NPI A')).toBeVisible();
    await expect(page.getByText('Category 1')).toBeVisible();
  });

  test('shows SYNTHETIC POC badge', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('SYNTHETIC POC')).toBeVisible();
  });

  test('phase summary table has 10 rows', async ({ page }) => {
    await page.goto('/');
    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(10);
  });

  test('"View full lifecycle" link navigates to /lifecycle', async ({ page }) => {
    await page.goto('/');
    await page.getByText('View full lifecycle').click();
    await expect(page).toHaveURL('/lifecycle');
  });
});

test.describe('AV-02 Product Lifecycle View', () => {
  test('loads and shows all 10 phases', async ({ page }) => {
    await page.goto('/lifecycle');
    for (let i = 0; i <= 9; i++) {
      await expect(page.getByTestId(`phase-${i}`)).toBeVisible();
    }
  });

  test('Phases 0, 1, 3, 4 show technical review badges', async ({ page }) => {
    await page.goto('/lifecycle');
    // Phase 0: Kickoff
    await expect(page.getByTestId('phase-0').getByText('Kickoff')).toBeVisible();
    // Phase 1: SLR
    await expect(page.getByTestId('phase-1').getByText('SLR')).toBeVisible();
    // Phase 3: Schematic/PDR
    await expect(page.getByTestId('phase-3').getByText('Schematic/PDR')).toBeVisible();
    // Phase 4: PCB Layout/CDR
    await expect(page.getByTestId('phase-4').getByText('PCB Layout/CDR')).toBeVisible();
  });

  test('Phases 2, 5, 6, 7, 8, 9 do NOT show technical review badges', async ({ page }) => {
    await page.goto('/lifecycle');
    const noReviewPhases = [2, 5, 6, 7, 8, 9];
    for (const phaseId of noReviewPhases) {
      const phaseCard = page.getByTestId(`phase-${phaseId}`);
      // Should not contain any technical review badge text
      await expect(phaseCard.getByText('Kickoff')).not.toBeVisible();
      await expect(phaseCard.getByText('SLR')).not.toBeVisible();
      await expect(phaseCard.getByText('Schematic/PDR')).not.toBeVisible();
      await expect(phaseCard.getByText('PCB Layout/CDR')).not.toBeVisible();
    }
  });

  test('clicking phase card navigates to phase workspace', async ({ page }) => {
    await page.goto('/lifecycle');
    await page.getByTestId('phase-0').getByRole('link', { name: /Phase 0/ }).click();
    await expect(page).toHaveURL('/phase/0');
  });
});

test.describe('Breadcrumb and Navigation', () => {
  test('breadcrumb shows EV-INV-800 on all pages', async ({ page }) => {
    for (const path of ['/', '/lifecycle']) {
      await page.goto(path);
      // EV-INV-800 appears in breadcrumb as a link — scope to breadcrumb nav
      await expect(page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'EV-INV-800' })).toBeVisible();
    }
  });

  test('sidebar navigation links are present', async ({ page }) => {
    await page.goto('/');
    // Scope to sidebar aside (complementary landmark) to avoid ambiguity with other links
    const sidebar = page.getByRole('complementary', { name: 'Main navigation' });
    await expect(sidebar.getByRole('link', { name: 'Project Overview' })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Lifecycle', exact: true })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Findings & Actions' })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Audit Log' })).toBeVisible();
  });
});
