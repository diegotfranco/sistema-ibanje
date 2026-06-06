import { test, expect } from '@playwright/test';
import { ACCOUNTS, login } from './helpers/auth';

// RBAC at the UI/API boundary for a non-admin role. The congregant has Attenders.Acessar (self-
// service) but not Attenders.Relatórios, so the roster endpoint must stay forbidden even though the
// account is authenticated. We assert the real request the roster page makes returns 403 from the
// browser context (session cookie + /api proxy) — the UI counterpart to the backend RBAC tests.
test('a congregant is forbidden from the staff roster endpoint (403)', async ({ page }) => {
  await login(page, ACCOUNTS.congregado);

  const status = await page.evaluate(async () => {
    const res = await fetch('/api/attenders?limit=30', { credentials: 'include' });
    return res.status;
  });

  expect(status).toBe(403);
});
