import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

// Regression guard for the frontend↔backend contract. IncomeEntryFields/ExpenseEntryFields call
// useEvents({ limit: 200 }), i.e. GET /events?limit=200. The events list schema must accept that
// limit (it caps at 500, matching the other reference-data lists) — otherwise the request 400s and
// the events dropdown silently fails. We reproduce the frontend's exact request from inside the
// browser (same origin, cookies, vite proxy) rather than driving the fragile form UI. This is the
// only layer that exercises BOTH sides, so it's the one that catches a limit mismatch.
//
// History: events was stuck at .max(100) while sibling lists were bumped to .max(500), so this
// request 400'd. Fixed by aligning events to .max(500). If someone lowers the events cap below 200
// (or raises the frontend request above the cap) this turns red again.
test('the frontend events request (limit=200) is accepted by the backend', async ({ page }) => {
  await loginAsAdmin(page);

  // Run the exact fetch the income/expense entry form issues, in the page context so it carries the
  // session cookie and goes through the same /api proxy.
  const status = await page.evaluate(async () => {
    const res = await fetch('/api/events?limit=200&status=ativo', { credentials: 'include' });
    return res.status;
  });

  expect(status).toBe(200);
});
