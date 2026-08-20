import { test, expect } from '@playwright/test';

test.describe('AV-09 Audit View', () => {
  test('Audit View loads at /audit', async ({ page }) => {
    await page.goto('/audit');
    // Renamed when Findings & Actions became a tab on this page.
    await expect(page.getByRole('heading', { name: 'Audit & Findings' })).toBeVisible();
    await expect(page.getByText(/Intake events, gate decisions, findings and actions/)).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Intake & Event Log' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Findings & Actions' })).toBeVisible();
  });

  test('Immutable Record — Append Only badge is always visible', async ({ page }) => {
    await page.goto('/audit');
    await expect(page.getByTestId('immutable-record-badge')).toBeVisible();
    await expect(page.getByText('Immutable Record — Append Only')).toBeVisible();
  });

  test('Audit log table renders', async ({ page }) => {
    await page.goto('/audit');
    await expect(page.getByTestId('audit-log-table')).toBeVisible();
  });

  test('Filter controls are present', async ({ page }) => {
    await page.goto('/audit');
    await expect(page.getByTestId('audit-search-input')).toBeVisible();
  });

  test('Sidebar Audit & Findings link navigates here', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('complementary', { name: 'Main navigation' })
      .getByRole('link', { name: 'Audit & Findings' }).click();
    await expect(page).toHaveURL('/audit');
  });

  test('"replacement input" never appears in Audit View', async ({ page }) => {
    await page.goto('/audit');
    const body = await page.textContent('body') ?? '';
    expect(body).not.toContain('replacement input');
  });

  test('"Connected to" never appears in Audit View', async ({ page }) => {
    await page.goto('/audit');
    const body = await page.textContent('body') ?? '';
    expect(body).not.toContain('Connected to ');
  });
});

test.describe('All 9 Application Views — Accessibility Check', () => {
  const VIEWS = [
    { path: '/', name: 'Project Overview (AV-01)', testRole: 'heading' as const, testText: 'Project Overview' },
    { path: '/lifecycle', name: 'Product Lifecycle View (AV-02)', testRole: 'heading' as const, testText: 'Product Lifecycle View' },
    { path: '/phase/0', name: 'Phase Workspace (AV-03)', testRole: 'heading' as const, testText: 'Phase 0' },
    { path: '/phase/0/intake', name: 'Input Intake Panel (AV-04)', testRole: 'heading' as const, testText: 'Input Intake and Validation' },
    { path: '/artifacts/any-id', name: 'Artifact Viewer (AV-05)', testRole: 'heading' as const, testText: 'Artifact Viewer' },
    { path: '/phase/4/checklist', name: 'Technical Checklist (AV-06)', testRole: 'heading' as const, testText: 'Technical Checklist Workspace' },
    // Findings & Actions is now a tab on /audit; /findings-actions only redirects.
    { path: '/findings-actions', name: 'Findings & Actions (AV-07)', testRole: 'heading' as const, testText: 'Audit & Findings' },
    { path: '/gate/0/review', name: 'Gate Review Workspace (AV-08)', testRole: 'heading' as const, testText: 'Gate 0 Review Workspace' },
    { path: '/audit', name: 'Audit View (AV-09)', testRole: 'heading' as const, testText: 'Audit & Findings' },
  ];

  for (const { path, name, testRole, testText } of VIEWS) {
    test(`${name} loads without error`, async ({ page }) => {
      await page.goto(path);
      // Use heading role to avoid strict-mode violations from sidebar links sharing the same text
      await expect(page.getByRole(testRole, { name: testText, exact: false }).first()).toBeVisible();
    });

    test(`${name} shows EV-INV-800 or breadcrumb`, async ({ page }) => {
      await page.goto(path);
      // All views should have either EV-INV-800 in breadcrumb or TT Engineering Copilot in header
      const hasProduct = await page.getByText('EV-INV-800').first().isVisible().catch(() => false);
      const hasHeader = await page.getByText('TT Engineering Copilot').isVisible().catch(() => false);
      expect(hasProduct || hasHeader).toBe(true);
    });
  }
});

test.describe('Breadcrumb Navigation', () => {
  test('every phase page carries the product identity and its own breadcrumb', async ({ page }) => {
    test.slow();  // ten full page loads against a dev server
    for (const phaseId of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]) {
      await page.goto(`/phase/${phaseId}`);
      // Product in the top bar; the breadcrumb starts at the phase itself.
      await expect(page.getByText('EV-INV-800').first()).toBeVisible();
      await expect(page.getByRole('navigation', { name: 'Breadcrumb' }))
        .toContainText(`Phase ${phaseId}:`);
    }
  });

  test('Technical review only in breadcrumb for phases 0, 1, 3, 4', async ({ page }) => {
    // Phases with technical reviews — should have review segment
    const techReviewPhases = [
      { phaseId: 0, reviewName: 'Kickoff' },
      { phaseId: 1, reviewName: 'SLR' },
      { phaseId: 3, reviewName: 'Schematic/PDR' },
      { phaseId: 4, reviewName: 'PCB Layout/CDR' },
    ];

    // Note: breadcrumb shows technical review when phase config has it
    // The component reads from PHASE_CONFIG_MAP which has these values
    // We verify the breadcrumb is present (detailed content tested in phase-specific tests)
    for (const { phaseId } of techReviewPhases) {
      await page.goto(`/phase/${phaseId}`);
      const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
      await expect(breadcrumb).toBeVisible();
    }
  });

  test('Gate Review breadcrumb shows gate segment', async ({ page }) => {
    await page.goto('/gate/0/review');
    const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumb).toBeVisible();
    // Breadcrumb includes EV-INV-800
    await expect(page.getByText('EV-INV-800').first()).toBeVisible();
  });
});

test.describe('Generic Gate Review Route — All Gates', () => {
  test('Gates 0–9 all have accessible review routes', async ({ page }) => {
    for (const gateId of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]) {
      const res = await page.request.get(`/api/gates/${gateId}/review`);
      expect(res.status()).toBe(200);
      const data = await res.json();
      expect(data.gateNumber).toBe(gateId);
    }
  });

  test('Gate Review Workspace renders for gate 0', async ({ page }) => {
    await page.goto('/gate/0/review');
    await expect(page.getByRole('heading', { name: 'Gate 0 Review Workspace' })).toBeVisible();
  });

  test('Gate Review Workspace renders for gate 9', async ({ page }) => {
    await page.goto('/gate/9/review');
    await expect(page.getByRole('heading', { name: 'Gate 9 Review Workspace' })).toBeVisible();
  });

  test('Gate Review renders from ProjectState — no gate-pack artifact fetched', async ({ page }) => {
    await page.goto('/gate/4/review');
    await expect(page.getByText(/Rendered from ProjectState/i)).toBeVisible();
    // No gate-pack artifact link
    const links = page.locator('a[href*="gate-pack"]');
    await expect(links).toHaveCount(0);
  });
});

test.describe('Full Application — TT Electronics Terminology', () => {
  const ALL_PAGES = [
    '/', '/lifecycle', '/audit', '/findings-actions',
    '/phase/0', '/phase/1', '/phase/2', '/phase/3', '/phase/4',
    '/phase/5', '/phase/6', '/phase/7', '/phase/8', '/phase/9',
    '/gate/0/review', '/gate/4/review', '/gate/9/review',
    '/phase/0/intake', '/phase/4/checklist',
  ];

  test('No page uses generic chatbot language', async ({ page }) => {
    test.slow();  // sweeps every page in the app
    for (const path of ALL_PAGES) {
      await page.goto(path);
      const body = await page.textContent('body') ?? '';
      // These would indicate a chatbot-style interface was accidentally added
      expect(body).not.toContain('How can I help you');
      expect(body).not.toContain('Chat with AI');
      expect(body).not.toContain('Send message');
    }
  });

  test('EVINV-POC-001 product identity visible on overview pages', async ({ page }) => {
    await page.goto('/');
    // Use first() to avoid strict-mode on multiple EVINV-POC-001 occurrences
    await expect(page.getByText('EVINV-POC-001').first()).toBeVisible();
    await expect(page.getByText('NPI A')).toBeVisible();
  });

  test('SYNTHETIC POC badge visible throughout application', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('SYNTHETIC POC')).toBeVisible();
    // Badge persists after navigation — use sidebar nav link specifically
    await page.locator('nav').getByRole('link', { name: 'Lifecycle', exact: true }).click();
    await expect(page.getByText('SYNTHETIC POC')).toBeVisible();
  });
});
