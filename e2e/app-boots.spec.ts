import { test, expect } from '@playwright/test';

test('app boots and serves HTTP 200 at root', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
});

test('database has EVINV-POC-001 project row after seed', async ({ request }) => {
  const res = await request.get('/api/project/EVINV-POC-001');
  expect(res.status()).toBe(200);
  const json = await res.json();
  expect(json.projectId).toBe('EVINV-POC-001');
  expect(json.productName).toBe('EV-INV-800 Demonstration Traction Inverter');
  expect(json.syntheticDataIndicator).toBe(true);
});
