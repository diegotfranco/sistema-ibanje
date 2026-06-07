import { test, expect } from '@playwright/test';
import { ACCOUNTS, loginAsAdmin } from './helpers/auth';

test.describe('login flow', () => {
  test('valid admin credentials reach the dashboard', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page).toHaveURL(/\/dashboard\b/);
  });

  test('invalid credentials keep the user on the login page', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('E-mail').fill(ACCOUNTS.admin.email);
    await page.locator('#password').fill('wrong-password-123');
    await page.getByRole('button', { name: /entrar/i }).click();

    // No redirect away from /login.
    await expect(page).toHaveURL(/\/login\b/);
  });
});
