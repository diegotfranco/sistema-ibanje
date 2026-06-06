import { describe, it, expect, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { getTestApp } from './helpers/app.js';

// Every protected surface must fail closed when there is NO session: requireAuth / checkPermission
// run as preHandlers and return 401 before any handler logic. This sweeps one representative read
// route per module to prove no route "leaks" to its handler for an anonymous caller.
const month = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
})();

const PROTECTED_ROUTES: ReadonlyArray<{ name: string; url: string }> = [
  { name: 'users', url: '/users' },
  { name: 'attenders', url: '/attenders' },
  { name: 'roles', url: '/roles' },
  { name: 'designated-funds', url: '/designated-funds' },
  { name: 'payment-methods', url: '/payment-methods' },
  { name: 'income-entries', url: '/income-entries' },
  { name: 'monthly-closings', url: '/monthly-closings' },
  { name: 'events', url: '/events' },
  { name: 'calendar', url: '/calendar' },
  { name: 'reports', url: `/reports/income?month=${month}` },
  { name: 'dashboard', url: `/dashboard?month=${month}` },
  { name: 'auth/me', url: '/auth/me' }
];

describe('unauthenticated access is rejected (401)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await getTestApp();
  });

  it.each(PROTECTED_ROUTES)('GET $name without a session → 401', async ({ url }) => {
    const res = await app.inject({ method: 'GET', url });
    expect(res.statusCode).toBe(401);
  });
});
