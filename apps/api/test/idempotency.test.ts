import { describe, it, expect, beforeAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { and, eq } from 'drizzle-orm';
import { getTestApp } from './helpers/app.js';
import { loginAs, type AuthCookies } from './helpers/auth.js';
import { clearMonthlyClosings } from './helpers/db.js';
import { db } from '../src/db/index.js';
import { incomeEntries, incomeCategories, paymentMethods } from '../src/db/schema.js';

async function countRows(depositDate: string, amount = '100.00') {
  const rows = await db
    .select()
    .from(incomeEntries)
    .where(and(eq(incomeEntries.depositDate, depositDate), eq(incomeEntries.amount, amount)));
  return rows.length;
}

describe('idempotency plugin', () => {
  let app: FastifyInstance;
  let tesAuth: AuthCookies;
  let adminAuth: AuthCookies;
  let categoryId: number;
  let paymentMethodId: number;

  beforeAll(async () => {
    await clearMonthlyClosings();
    app = await getTestApp();
    tesAuth = await loginAs(app, 'tesoureiro@email.com', 'tesoureiro123');
    adminAuth = await loginAs(app, 'admin@email.com', 'admin123');

    const [cat] = await db
      .select()
      .from(incomeCategories)
      .where(eq(incomeCategories.name, 'Oferta'));
    expect(cat).toBeDefined();
    categoryId = cat.id;

    const [pm] = await db.select().from(paymentMethods).limit(1);
    expect(pm).toBeDefined();
    paymentMethodId = pm.id;
  });

  function payload(depositDate: string, amount = 100) {
    return { categoryId, paymentMethodId, amount, depositDate };
  }

  it('replays cached response and inserts only one row', async () => {
    const key = randomUUID();
    const depositDate = '2098-02-15';

    const first = await app.inject({
      method: 'POST',
      url: '/income-entries',
      headers: {
        cookie: tesAuth.cookie,
        'x-csrf-token': tesAuth.csrfToken,
        'idempotency-key': key
      },
      payload: payload(depositDate)
    });
    expect(first.statusCode).toBe(201);
    expect(first.headers['idempotent-replay']).toBeUndefined();

    const second = await app.inject({
      method: 'POST',
      url: '/income-entries',
      headers: {
        cookie: tesAuth.cookie,
        'x-csrf-token': tesAuth.csrfToken,
        'idempotency-key': key
      },
      payload: payload(depositDate)
    });
    expect(second.statusCode).toBe(201);
    expect(second.headers['idempotent-replay']).toBe('true');
    expect(second.body).toBe(first.body);

    expect(await countRows(depositDate)).toBe(1);
  });

  it('does not cache when Idempotency-Key header is absent', async () => {
    const depositDate = '2098-03-15';

    const first = await app.inject({
      method: 'POST',
      url: '/income-entries',
      headers: { cookie: tesAuth.cookie, 'x-csrf-token': tesAuth.csrfToken },
      payload: payload(depositDate)
    });
    expect(first.statusCode).toBe(201);

    const second = await app.inject({
      method: 'POST',
      url: '/income-entries',
      headers: { cookie: tesAuth.cookie, 'x-csrf-token': tesAuth.csrfToken },
      payload: payload(depositDate)
    });
    expect(second.statusCode).toBe(201);
    expect(second.headers['idempotent-replay']).toBeUndefined();

    expect(await countRows(depositDate)).toBe(2);
  });

  it('does not replay across different routes for the same key', async () => {
    const key = randomUUID();
    const depositDate = '2098-04-15';

    const incomeRes = await app.inject({
      method: 'POST',
      url: '/income-entries',
      headers: {
        cookie: tesAuth.cookie,
        'x-csrf-token': tesAuth.csrfToken,
        'idempotency-key': key
      },
      payload: payload(depositDate)
    });
    expect(incomeRes.statusCode).toBe(201);

    const closingRes = await app.inject({
      method: 'POST',
      url: '/monthly-closings',
      headers: {
        cookie: tesAuth.cookie,
        'x-csrf-token': tesAuth.csrfToken,
        'idempotency-key': key
      },
      payload: { periodYear: 2098, periodMonth: 4 }
    });
    expect(closingRes.statusCode).toBe(201);
    expect(closingRes.headers['idempotent-replay']).toBeUndefined();
  });

  it('does not replay across different users for the same key', async () => {
    const key = randomUUID();
    const depositDate = '2098-01-15';

    const userA = await app.inject({
      method: 'POST',
      url: '/income-entries',
      headers: {
        cookie: tesAuth.cookie,
        'x-csrf-token': tesAuth.csrfToken,
        'idempotency-key': key
      },
      payload: payload(depositDate)
    });
    expect(userA.statusCode).toBe(201);

    const userB = await app.inject({
      method: 'POST',
      url: '/income-entries',
      headers: {
        cookie: adminAuth.cookie,
        'x-csrf-token': adminAuth.csrfToken,
        'idempotency-key': key
      },
      payload: payload(depositDate)
    });
    expect(userB.statusCode).toBe(201);
    expect(userB.headers['idempotent-replay']).toBeUndefined();

    expect(await countRows(depositDate)).toBe(2);
  });

  it('does not cache non-2xx responses', async () => {
    const key = randomUUID();
    const depositDate = '2098-02-20';

    const bad = await app.inject({
      method: 'POST',
      url: '/income-entries',
      headers: {
        cookie: tesAuth.cookie,
        'x-csrf-token': tesAuth.csrfToken,
        'idempotency-key': key
      },
      payload: { categoryId, paymentMethodId, depositDate }
    });
    expect(bad.statusCode).toBeGreaterThanOrEqual(400);
    expect(bad.statusCode).toBeLessThan(500);

    const good = await app.inject({
      method: 'POST',
      url: '/income-entries',
      headers: {
        cookie: tesAuth.cookie,
        'x-csrf-token': tesAuth.csrfToken,
        'idempotency-key': key
      },
      payload: payload(depositDate)
    });
    expect(good.statusCode).toBe(201);
    expect(good.headers['idempotent-replay']).toBeUndefined();

    expect(await countRows(depositDate)).toBe(1);
  });
});
