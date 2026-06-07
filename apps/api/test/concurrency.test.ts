import { describe, it, expect, beforeAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { and, eq } from 'drizzle-orm';
import { getTestApp } from './helpers/app.js';
import { loginAs, type AuthCookies } from './helpers/auth.js';
import { clearMonthlyClosings } from './helpers/db.js';
import { db } from '../src/db/index.js';
import { incomeEntries, incomeCategories, paymentMethods } from '../src/db/schema.js';

// Concurrency safety of the idempotency plugin. Asserting the INVARIANT (exactly one row) rather than
// the race outcome keeps the test deterministic: regardless of which request wins the NX lock, a
// duplicated submission must never produce two inserts.
async function countRows(depositDate: string, amount = '100.00') {
  const rows = await db
    .select()
    .from(incomeEntries)
    .where(and(eq(incomeEntries.depositDate, depositDate), eq(incomeEntries.amount, amount)));
  return rows.length;
}

describe('idempotency under concurrency', () => {
  let app: FastifyInstance;
  let auth: AuthCookies;
  let categoryId: number;
  let paymentMethodId: number;

  beforeAll(async () => {
    await clearMonthlyClosings();
    app = await getTestApp();
    auth = await loginAs(app, 'tesoureiro@email.com', 'tesoureiro123');

    const [cat] = await db
      .select()
      .from(incomeCategories)
      .where(eq(incomeCategories.name, 'Oferta'));
    categoryId = cat.id;

    const [pm] = await db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.allowsInflow, true))
      .limit(1);
    paymentMethodId = pm.id;
  });

  it('two concurrent requests with the same key insert exactly one row', async () => {
    const key = randomUUID();
    const depositDate = '2096-09-13';
    const payload = { categoryId, paymentMethodId, amount: 100, depositDate };

    const fire = () =>
      app.inject({
        method: 'POST',
        url: '/income-entries',
        headers: {
          cookie: auth.cookie,
          'x-csrf-token': auth.csrfToken,
          'idempotency-key': key
        },
        payload
      });

    const [a, b] = await Promise.all([fire(), fire()]);

    // The invariant that matters: never two inserts.
    expect(await countRows(depositDate)).toBe(1);

    const statuses = [a.statusCode, b.statusCode].sort((x, y) => x - y);
    // Exactly one request did the real work (201, no replay header).
    const created = [a, b].filter(
      (r) => r.statusCode === 201 && r.headers['idempotent-replay'] === undefined
    );
    expect(created).toHaveLength(1);

    // The other is either blocked by the in-progress lock (409) or served the cached replay (201).
    const otherOk = statuses.includes(409) || statuses.filter((s) => s === 201).length === 2;
    expect(otherOk).toBe(true);
  });
});
