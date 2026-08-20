import { test, expect } from '@playwright/test';

/**
 * The top-bar badge and the settings card describe the same thing, so they must
 * never disagree.
 *
 * They used to: the card held a private copy of the status in local state and
 * updated only itself, while the badge read an SWR cache configured not to
 * revalidate. Saving a key left the badge reading "LLM Key Not Set" until the
 * page was reloaded — which is exactly how it was reported.
 *
 * Writing a key needs the key store, so these skip explicitly when it is
 * unreachable rather than passing quietly and proving nothing.
 */
const FAKE_KEY = 'sk-ant-PLAYWRIGHT-FAKE-NOT-A-REAL-KEY-01';

async function keyStoreAvailable(request: import('@playwright/test').APIRequestContext) {
  const res = await request.get('/api/settings/llm-key');
  if (!res.ok()) return false;
  const body = await res.json();
  return body.storeUnavailable !== true;
}

test.describe('LLM key status stays consistent across the app', () => {
  test('the badge updates on save and on removal, with no page reload', async ({ page, request }) => {
    test.skip(!(await keyStoreAvailable(request)), 'No key store reachable in this environment');

    // Start from a known state.
    await request.delete('/api/settings/llm-key');

    await page.goto('/settings');
    const badge = page.getByTestId('llm-key-status-badge');
    await expect(badge).toHaveText('LLM Key Not Set');
    await expect(page.getByTestId('key-not-configured-status')).toBeVisible();

    // Save — and then do NOT reload. That was the whole bug.
    await page.getByTestId('llm-key-input').fill(FAKE_KEY);
    await page.getByTestId('save-key-btn').click();

    await expect(page.getByTestId('key-success-msg')).toBeVisible();
    await expect(page.getByTestId('key-configured-status')).toBeVisible();
    await expect(badge).toHaveText('LLM Key Configured');
    // Still the same page load.
    await expect(page).toHaveURL('/settings');

    // And the reverse direction, which shares the same mechanism.
    await page.getByTestId('remove-key-btn').click();
    await page.getByRole('button', { name: 'Remove Key' }).click();

    await expect(page.getByTestId('key-not-configured-status')).toBeVisible();
    await expect(badge).toHaveText('LLM Key Not Set');
  });

  test('a saved key survives a reload and is never sent back to the browser', async ({ page, request }) => {
    test.skip(!(await keyStoreAvailable(request)), 'No key store reachable in this environment');

    await request.post('/api/settings/llm-key', { data: { key: FAKE_KEY } });
    await page.goto('/settings');

    await expect(page.getByTestId('llm-key-status-badge')).toHaveText('LLM Key Configured');
    // Masked only — the plaintext key must never reach the client.
    const body = (await page.textContent('body')) ?? '';
    expect(body).not.toContain(FAKE_KEY);
    expect(body).toContain('****');

    await request.delete('/api/settings/llm-key');
  });

  test('an unreachable key store reads as "not configured", not as an error', async ({ request }) => {
    // Whichever mode this runs in, the endpoint answers 200 with a usable
    // status. It used to 500, which put a console error on every page.
    const res = await request.get('/api/settings/llm-key');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(typeof body.configured).toBe('boolean');
  });
});
