import { describe, it, expect, beforeAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { and, eq } from 'drizzle-orm';
import { getTestApp } from './helpers/app.js';
import { loginAs, type AuthCookies } from './helpers/auth.js';
import { db } from '../src/db/index.js';
import { incomeEntries, incomeCategories, paymentMethods } from '../src/db/schema.js';

async function countRows(referenceDate: string, amount = '100.00') {
  const rows = await db
    .select()
    .from(incomeEntries)
    .where(and(eq(incomeEntries.referenceDate, referenceDate), eq(incomeEntries.amount, amount)));
  return rows.length;
}

describe('idempotency plugin', () => {
  let app: FastifyInstance;
  let tesAuth: AuthCookies;
  let tesRespAuth: AuthCookies;
  let categoryId: number;
  let paymentMethodId: number;

  beforeAll(async () => {
    app = await getTestApp();
    tesAuth = await loginAs(app, 'tesoureiro@email.com', 'tesoureiro123');
    tesRespAuth = await loginAs(app, 'tesoureiro.resp@email.com', 'tesresp123');

    const [cat] = await db
      .select()
      .from(incomeCategories)
      .where(eq(incomeCategories.name, 'Oferta de Culto'));
    expect(cat).toBeDefined();
    categoryId = cat.id;

    const [pm] = await db.select().from(paymentMethods).limit(1);
    expect(pm).toBeDefined();
    paymentMethodId = pm.id;
  });

  function payload(referenceDate: string, amount = 100) {
    return { categoryId, paymentMethodId, amount, referenceDate };
  }

  it('replays cached response and inserts only one row', async () => {
    const key = randomUUID();
    const referenceDate = '2098-02-15';

    const first = await app.inject({
      method: 'POST',
      url: '/income-entries',
      headers: {
        cookie: tesAuth.cookie,
        'x-csrf-token': tesAuth.csrfToken,
        'idempotency-key': key
      },
      payload: payload(referenceDate)
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
      payload: payload(referenceDate)
    });
    expect(second.statusCode).toBe(201);
    expect(second.headers['idempotent-replay']).toBe('true');
    expect(second.body).toBe(first.body);

    expect(await countRows(referenceDate)).toBe(1);
  });

  it('does not cache when Idempotency-Key header is absent', async () => {
    const referenceDate = '2098-03-15';

    const first = await app.inject({
      method: 'POST',
      url: '/income-entries',
      headers: { cookie: tesAuth.cookie, 'x-csrf-token': tesAuth.csrfToken },
      payload: payload(referenceDate)
    });
    expect(first.statusCode).toBe(201);

    const second = await app.inject({
      method: 'POST',
      url: '/income-entries',
      headers: { cookie: tesAuth.cookie, 'x-csrf-token': tesAuth.csrfToken },
      payload: payload(referenceDate)
    });
    expect(second.statusCode).toBe(201);
    expect(second.headers['idempotent-replay']).toBeUndefined();

    expect(await countRows(referenceDate)).toBe(2);
  });

  it('does not replay across different routes for the same key', async () => {
    const key = randomUUID();
    const referenceDate = '2098-04-15';

    const incomeRes = await app.inject({
      method: 'POST',
      url: '/income-entries',
      headers: {
        cookie: tesAuth.cookie,
        'x-csrf-token': tesAuth.csrfToken,
        'idempotency-key': key
      },
      payload: payload(referenceDate)
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
    const referenceDate = '2098-05-15';

    const userA = await app.inject({
      method: 'POST',
      url: '/income-entries',
      headers: {
        cookie: tesAuth.cookie,
        'x-csrf-token': tesAuth.csrfToken,
        'idempotency-key': key
      },
      payload: payload(referenceDate)
    });
    expect(userA.statusCode).toBe(201);

    const userB = await app.inject({
      method: 'POST',
      url: '/income-entries',
      headers: {
        cookie: tesRespAuth.cookie,
        'x-csrf-token': tesRespAuth.csrfToken,
        'idempotency-key': key
      },
      payload: payload(referenceDate)
    });
    expect(userB.statusCode).toBe(201);
    expect(userB.headers['idempotent-replay']).toBeUndefined();

    expect(await countRows(referenceDate)).toBe(2);
  });

  it('does not cache non-2xx responses', async () => {
    const key = randomUUID();
    const referenceDate = '2098-06-15';

    const bad = await app.inject({
      method: 'POST',
      url: '/income-entries',
      headers: {
        cookie: tesAuth.cookie,
        'x-csrf-token': tesAuth.csrfToken,
        'idempotency-key': key
      },
      payload: { categoryId, paymentMethodId, referenceDate }
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
      payload: payload(referenceDate)
    });
    expect(good.statusCode).toBe(201);
    expect(good.headers['idempotent-replay']).toBeUndefined();

    expect(await countRows(referenceDate)).toBe(1);
  });
});
