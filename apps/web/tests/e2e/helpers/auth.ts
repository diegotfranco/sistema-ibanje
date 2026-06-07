import { expect, type Page } from '@playwright/test';

// Seeded demo accounts (see apps/api/src/db/seed-data.ts). Passwords meet the 8-char minimum.
export const ACCOUNTS = {
  admin: { email: 'admin@email.com', password: 'admin123' },
  congregado: { email: 'congregado@email.com', password: 'congregado123' }
} as const;

// UI login: fills the real login form and waits for the post-login destination. Staff land on
// /dashboard, members on /me — accept either so the helper works for any role.
export async function login(page: Page, account: { email: string; password: string }) {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(account.email);
  // The password field shares the "Senha" label region with a show-password button and a
  // "Esqueceu sua senha?" link, so target the input by id to stay unambiguous.
  await page.locator('#password').fill(account.password);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL(/\/(dashboard|me)\b/, { timeout: 30_000 });
}

export async function loginAsAdmin(page: Page) {
  await login(page, ACCOUNTS.admin);
  await expect(page).toHaveURL(/\/dashboard\b/);
}
