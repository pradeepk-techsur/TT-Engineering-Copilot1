import { test, expect } from '@playwright/test';

/**
 * New Cycle — the control that clears the current run and starts the lifecycle
 * again at Phase 0.
 *
 * These specs deliberately stop at the confirmation. Confirming deletes the
 * uploaded inputs and generated outputs for real, and a test suite that wipes
 * the demo it is checking is worse than no test: the guard, the reachability
 * and the copy are what can be pinned safely here.
 */
test.describe('New Cycle', () => {
  test('is reachable from every kind of screen', async ({ page }) => {
    // The top bar is the only chrome present on all of these, which is why the
    // control lives there — you notice stale files on a phase workspace.
    for (const path of ['/', '/lifecycle', '/phase/0', '/gate/0/review', '/audit']) {
      await page.goto(path);
      await expect(page.getByTestId('new-cycle-button')).toBeVisible();
    }
  });

  test('explains what it clears and what it keeps before doing anything', async ({ page }) => {
    await page.goto('/phase/0');

    const trigger = page.getByTestId('new-cycle-button');
    await expect(trigger).toBeVisible();
    // The dialog must not exist until it is asked for.
    await expect(page.getByTestId('new-cycle-dialog')).toHaveCount(0);

    await trigger.click();
    const dialog = page.getByTestId('new-cycle-dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Start a new cycle?')).toBeVisible();
    await expect(dialog.getByText(/input files you uploaded/)).toBeVisible();
    await expect(dialog.getByText(/Anthropic API key is kept/)).toBeVisible();
    await expect(dialog.getByText(/append-only/)).toBeVisible();
    await expect(dialog.getByTestId('new-cycle-confirm')).toBeVisible();
  });

  test('Cancel closes it without touching the cycle', async ({ page }) => {
    await page.goto('/phase/0');

    let requests = 0;
    page.on('request', (req) => {
      if (req.url().includes('/api/project/new-cycle')) requests += 1;
    });

    await page.getByTestId('new-cycle-button').click();
    await expect(page.getByTestId('new-cycle-dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(page.getByTestId('new-cycle-dialog')).toBeHidden();
    expect(requests).toBe(0);
  });

  test('the endpoint refuses an unconfirmed request', async ({ request }) => {
    const res = await request.post('/api/project/new-cycle', { data: {} });
    expect(res.status()).toBe(400);
    expect((await res.json()).error_code).toBe('NEW_CYCLE_NOT_CONFIRMED');
  });
});
