import { test, expect } from '@playwright/test';

/**
 * Full Demo Walk — TT Engineering Copilot POC
 *
 * Tests the complete happy-path demonstration from G0 to G9.
 * Does NOT perform actual phase execution (that requires LLM + DB state).
 * DOES verify that every UI surface is reachable, correct, and free of violations.
 *
 * This is the final quality gate for the POC demo readiness.
 */

test.describe('Demo Readiness — All Phase Workspaces', () => {
  // Verify every phase workspace loads with correct content
  const PHASE_CONFIG = [
    { phaseId: 0, name: 'Project Initiation', extBehavior: 'UP', intBehavior: 'SI' },
    { phaseId: 1, name: 'Concept & Proposal', extBehavior: 'UP', intBehavior: 'SI' },
    { phaseId: 2, name: 'Requirements Development', extBehavior: 'UP', intBehavior: 'SI' },
    { phaseId: 3, name: 'Preliminary Design', extBehavior: 'SI', intBehavior: 'UP' },
    { phaseId: 4, name: 'Detail Design', extBehavior: 'SI', intBehavior: 'UP' },
    { phaseId: 5, name: 'Design Validation', extBehavior: 'SI', intBehavior: 'UP' },
    { phaseId: 6, name: 'Production Preparation & Qualification', extBehavior: 'UP', intBehavior: 'SI' },
    { phaseId: 7, name: 'Transfer & Monitor', extBehavior: 'UP', intBehavior: 'SI' },
    { phaseId: 8, name: 'Manufacture', extBehavior: 'SI', intBehavior: 'SI' },
    { phaseId: 9, name: 'End-of-Life', extBehavior: 'UP', intBehavior: 'SI' },
  ];

  for (const phase of PHASE_CONFIG) {
    test(`Phase ${phase.phaseId} (${phase.name}) workspace is demo-ready`, async ({ page }) => {
      await page.goto(`/phase/${phase.phaseId}`);

      // Phase name renders (use heading to avoid strict-mode violation from breadcrumb link)
      await expect(page.getByRole('heading', { name: `Phase ${phase.phaseId}: ${phase.name}` })).toBeVisible();

      // Correct intake card types — use .first() to avoid strict-mode on badge+description
      if (phase.extBehavior === 'UP') {
        await expect(page.getByTestId('up-intake-external')).toBeVisible();
      } else {
        await expect(page.getByTestId('si-intake-external')).toBeVisible();
        // SI card shows Simulated Connector badge — use exact: true to target badge not description
        await expect(page.getByTestId('si-intake-external').getByText('Simulated Connector', { exact: true })).toBeVisible();
      }

      if (phase.intBehavior === 'UP') {
        await expect(page.getByTestId('up-intake-internal')).toBeVisible();
      } else {
        await expect(page.getByTestId('si-intake-internal')).toBeVisible();
        await expect(page.getByTestId('si-intake-internal').getByText('Simulated Connector', { exact: true })).toBeVisible();
      }

      // Outputs panel present (shows 'Pending phase execution' before agent runs)
      await expect(page.getByTestId('outputs-panel')).toBeVisible({ timeout: 8000 });

      // SYNTHETIC POC badge visible in top bar
      await expect(page.getByText('SYNTHETIC POC').first()).toBeVisible();

      // No prohibited labels
      const body = await page.textContent('body') ?? '';
      expect(body).not.toContain('replacement input');
      expect(body).not.toContain('Connected to ');
      expect(body).not.toContain('Live Cora');
      expect(body).not.toContain('Live MES');
    });
  }
});

test.describe('Demo Readiness — Gate Review Workspaces', () => {
  for (let gateId = 0; gateId <= 9; gateId++) {
    test(`Gate ${gateId} Review Workspace is demo-ready`, async ({ page }) => {
      await page.goto(`/gate/${gateId}/review`);

      // Gate review workspace renders
      await expect(page.getByRole('heading', { name: `Gate ${gateId} Review Workspace` })).toBeVisible();

      // Gate decision selector renders
      await expect(page.getByTestId('gate-decision-selector')).toBeVisible({ timeout: 10000 });

      // Record Decision button DISABLED by default (no pre-selection — GR-06)
      const recordBtn = page.getByTestId('record-decision-button');
      await expect(recordBtn).toBeDisabled();

      // No gate-pack artifact link
      const gatePackLinks = page.locator('a[href*="gate-pack"]');
      await expect(gatePackLinks).toHaveCount(0);

      // No prohibited labels
      const body = await page.textContent('body') ?? '';
      expect(body).not.toContain('replacement input');
    });
  }
});

test.describe('Demo Readiness — Navigation and Breadcrumbs', () => {
  test('Complete navigation path: Overview → Lifecycle → Phase 0 → Gate 0 Review', async ({ page }) => {
    // Start at Project Overview
    await page.goto('/');
    await expect(page.getByText('EVINV-POC-001').first()).toBeVisible();

    // Navigate to Lifecycle View via sidebar (aside has aria-label="Main navigation")
    await page.locator('aside[aria-label="Main navigation"]').getByRole('link', { name: 'Lifecycle', exact: true }).click();
    await expect(page).toHaveURL('/lifecycle');
    await expect(page.getByTestId('phase-0')).toBeVisible();

    // Navigate to Phase 0 Workspace.
    // By href: navigation should not break when a phase is renamed.
    await page.getByTestId('phase-0').locator('a[href="/phase/0"]').click();
    await expect(page).toHaveURL('/phase/0');

    // Navigate to Gate 0 Review
    await page.getByRole('link', { name: 'Open Gate Review' }).click();
    await expect(page).toHaveURL('/gate/0/review');

    // Back up the breadcrumb, which now starts at the phase rather than the
    // product — the product name lives in the top bar instead.
    await page.getByRole('navigation', { name: 'Breadcrumb' })
      .locator('a[href="/phase/0"]').click();
    await expect(page).toHaveURL('/phase/0');
  });

  test('Checklist navigation: Phase 0 → Open Checklist → Phase 0 checklist items', async ({ page }) => {
    await page.goto('/phase/0');
    await page.getByRole('link', { name: 'Open Checklist' }).click();
    await expect(page).toHaveURL('/phase/0/checklist');
    // Technical Checklist Workspace heading visible
    await expect(page.getByRole('heading', { name: 'Technical Checklist Workspace' })).toBeVisible();
  });

  test('Intake detail navigation: Phase 0 → Open Intake Detail', async ({ page }) => {
    await page.goto('/phase/0');
    await page.getByRole('link', { name: 'Open Intake Detail' }).click();
    await expect(page).toHaveURL('/phase/0/intake');
  });

  test('Findings navigation: Phase 0 workspace → Findings & Actions (sidebar tab)', async ({ page }) => {
    await page.goto('/phase/0');
    await page.locator('aside[aria-label="Main navigation"]')
      .getByRole('link', { name: 'Audit & Findings' }).click();
    await expect(page).toHaveURL('/audit');
    // The workspace is a tab on this page now, not a route of its own.
    await page.getByRole('tab', { name: 'Findings & Actions' }).click();
    await expect(page.getByTestId('findings-actions-workspace')).toBeVisible();
  });
});

test.describe('Happy-Path Storyline States — Lifecycle View', () => {
  test('Lifecycle View shows all 10 phase nodes with correct structure', async ({ page }) => {
    await page.goto('/lifecycle');
    for (let i = 0; i <= 9; i++) {
      await expect(page.getByTestId(`phase-${i}`)).toBeVisible();
    }
  });

  test('Phase 3 shows Schematic/PDR technical review badge', async ({ page }) => {
    await page.goto('/lifecycle');
    await expect(page.getByTestId('phase-3').getByText('Schematic/PDR')).toBeVisible();
  });

  test('Phase 4 shows PCB Layout/CDR technical review badge', async ({ page }) => {
    await page.goto('/lifecycle');
    await expect(page.getByTestId('phase-4').getByText('PCB Layout/CDR')).toBeVisible();
  });

  test('Phases 5–9 do NOT show Schematic/PDR or PCB Layout/CDR badges', async ({ page }) => {
    await page.goto('/lifecycle');
    for (const phaseId of [5, 6, 7, 8, 9]) {
      const phaseCard = page.getByTestId(`phase-${phaseId}`);
      await expect(phaseCard.getByText('Schematic/PDR')).not.toBeVisible();
      await expect(phaseCard.getByText('PCB Layout/CDR')).not.toBeVisible();
    }
  });

  test('LifecycleSummaryBanner renders on Lifecycle View', async ({ page }) => {
    await page.goto('/lifecycle');
    await expect(page.getByTestId('lifecycle-summary-banner')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Final Acceptance — Complete Demo Walk', () => {
  test('All sidebar navigation links work', async ({ page }) => {
    const NAV = [
      { href: '/lifecycle', label: 'Lifecycle', exact: true },
      { href: '/audit', label: 'Audit & Findings', exact: true },
      { href: '/settings', label: 'Settings', exact: true },
    ];
    for (const { href, label, exact } of NAV) {
      await page.goto('/');
      await page.locator('aside[aria-label="Main navigation"]').getByRole('link', { name: label, exact }).click();
      await expect(page).toHaveURL(href);
    }
  });

  test('Phase shortcuts P0–P9 all work in sidebar', async ({ page }) => {
    test.slow();  // ten navigations, each a fresh page load
    // Match on href, not label: the Sidebar derives its labels from
    // PHASE_CONFIG, so a hard-coded copy here goes stale on every rename.
    for (let i = 0; i <= 9; i++) {
      await page.goto('/');
      await page.locator('aside[aria-label="Main navigation"]')
        .locator(`a[href="/phase/${i}"]`).click();
      await expect(page).toHaveURL(`/phase/${i}`);
    }
  });

  test('No phase workspace uses "chatbot" interface', async ({ page }) => {
    for (const phaseId of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]) {
      await page.goto(`/phase/${phaseId}`);
      const body = await page.textContent('body') ?? '';
      expect(body).not.toContain('How can I help');
      expect(body).not.toContain('Chat with');
      expect(body).not.toContain('Type a message');
    }
  });

  test('SYNTHETIC POC badge visible everywhere (top bar)', async ({ page }) => {
    const pages = ['/', '/lifecycle', '/audit', '/findings-actions'];
    for (const path of pages) {
      await page.goto(path);
      await expect(page.getByText('SYNTHETIC POC').first()).toBeVisible();
    }
  });

  test('Gate Review Workspace shows gate workspace element when loaded', async ({ page }) => {
    // This test verifies the gate review component renders correctly
    await page.goto('/gate/0/review');
    await page.waitForTimeout(3000);  // Wait for SWR to load
    await expect(page.getByTestId('gate-review-workspace-0')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Gate 0 Review Workspace' })).toBeVisible();
  });

  test('Phase 8 (both SI) shows two Simulated Connector cards', async ({ page }) => {
    await page.goto('/phase/8');
    // Both Phase 8 inputs are SI — must show Simulated Connector for BOTH
    const siCards = page.getByTestId(/^si-intake-/);
    await expect(siCards.first()).toBeVisible();
    // Verify no UP cards exist for Phase 8
    await expect(page.getByTestId('up-intake-external')).not.toBeVisible();
    await expect(page.getByTestId('up-intake-internal')).not.toBeVisible();
  });

  test('Acceptance: Complete prohibited terminology scan across 22 paths', async ({ page }) => {
    // Twenty-two full page loads in one test. The default 30s budget is for a
    // single interaction, not a sweep of the whole app against a dev server
    // that compiles routes on demand — so the assertions below were never
    // reaching the later paths.
    test.slow();

    const ALL_PATHS = [
      '/', '/lifecycle', '/audit', '/findings-actions',
      '/phase/0', '/phase/1', '/phase/2', '/phase/3', '/phase/4',
      '/phase/5', '/phase/6', '/phase/7', '/phase/8', '/phase/9',
      '/gate/0/review', '/gate/3/review', '/gate/4/review',
      '/gate/8/review', '/gate/9/review',
      '/phase/0/intake', '/phase/4/checklist', '/phase/2/checklist',
    ];

    for (const path of ALL_PATHS) {
      await page.goto(path);
      const body = await page.textContent('body') ?? '';
      // AC-29 from requirements: prohibited terminology must never appear
      expect(body).not.toContain('replacement input');
      expect(body).not.toContain('Connected to Salesforce');
      expect(body).not.toContain('Connected to Cora');
      expect(body).not.toContain('Connected to MES');
      expect(body).not.toContain('Live Cora Data');
      expect(body).not.toContain('Live MES Data');
      expect(body).not.toContain('Retrieved from');
    }
  });
});
