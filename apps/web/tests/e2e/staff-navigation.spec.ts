import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

// Authenticated app-shell smoke: a staff user navigates to protected finance pages and they render
// with real data fetched end-to-end (router guard + session cookie + API + Zod response all wired).
// The full closing state machine is covered by the backend tests; here we prove the page mounts.
test('staff can open the monthly closings page and it renders', async ({ page }) => {
  await loginAsAdmin(page);

  await page.goto('/monthly-closings');
  // The label also appears in the sidebar/breadcrumb; scope to the card heading.
  await expect(page.getByText('Fechamentos Mensais').last()).toBeVisible({ timeout: 15_000 });
});

test('staff can open the income entries page and it renders', async ({ page }) => {
  await loginAsAdmin(page);

  await page.goto('/income-entries');
  await expect(page).toHaveURL(/\/income-entries\b/);
  // "Total do mês" is the summary card title, always present once the page mounts.
  await expect(page.getByText('Total do mês')).toBeVisible({ timeout: 15_000 });
});
