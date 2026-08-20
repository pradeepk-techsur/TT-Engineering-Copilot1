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
    // The row links by phase NAME; the number is the marker beside it.
    // By href: navigation should not break when a phase is renamed.
    await page.getByTestId('phase-0').locator('a[href="/phase/0"]').click();
    await expect(page).toHaveURL('/phase/0');
  });
});

test.describe('Breadcrumb and Navigation', () => {
  test('product identity is in the top bar, not the breadcrumb', async ({ page }) => {
    // The breadcrumb starts at "Phase N: Name" by design; the product lives in
    // the top bar so it is present on every page including these two, which
    // have no phase context and therefore no breadcrumb at all.
    for (const path of ['/', '/lifecycle']) {
      await page.goto(path);
      await expect(page.getByText('EV-INV-800 · EVINV-POC-001')).toBeVisible();
      await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toHaveCount(0);
    }
  });

  test('breadcrumb starts with the phase, never the product', async ({ page }) => {
    await page.goto('/phase/3');
    const breadcrumb = page.getByRole('navigation', { name: 'Breadcrumb' });
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb).toContainText('Phase 3:');
    await expect(breadcrumb.getByRole('link', { name: 'EV-INV-800' })).toHaveCount(0);
  });

  test('sidebar navigation links are present', async ({ page }) => {
    await page.goto('/');
    // Scope to sidebar aside (complementary landmark) to avoid ambiguity with other links
    const sidebar = page.getByRole('complementary', { name: 'Main navigation' });
    // Exactly four: Findings & Actions is a tab inside Audit & Findings now,
    // and there is no separate Checklist entry.
    await expect(sidebar.getByRole('link', { name: 'Project Overview' })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Lifecycle', exact: true })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Audit & Findings' })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Settings' })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Findings & Actions' })).toHaveCount(0);
    await expect(sidebar.getByRole('link', { name: 'Audit Log' })).toHaveCount(0);
  });

  test('sidebar links render app shell (not 404)', async ({ page }) => {
    for (const path of ['/findings-actions', '/audit', '/phase/0']) {
      await page.goto(path);
      // AppShell top bar brand is always visible
      await expect(page.getByText('TT Engineering Copilot')).toBeVisible();
      // Product identity lives in the top bar, on every page.
      await expect(page.getByText('EV-INV-800 · EVINV-POC-001')).toBeVisible();
      // SYNTHETIC POC badge is always visible
      await expect(page.getByText('SYNTHETIC POC')).toBeVisible();
    }
  });

  test('/phase/0 breadcrumb shows Phase 0 segment', async ({ page }) => {
    await page.goto('/phase/0');
    await expect(
      page.getByRole('navigation', { name: 'Breadcrumb' }).getByText(/Phase 0/i)
    ).toBeVisible();
  });
});
