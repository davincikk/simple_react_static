import { test, expect } from '@playwright/test';

test('home page shows the hello world heading', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Hello, World!' })).toBeVisible();
});
