import { describe, it, expect, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { getTestApp } from './helpers/app.js';
import { loginAs, type AuthCookies } from './helpers/auth.js';
import { reseedDb } from './helpers/db.js';
import { db } from '../src/db/index.js';
import { incomeCategories, paymentMethods } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';

describe('smoke: login → create income entry → close month', () => {
  let app: FastifyInstance;
  let auth: AuthCookies;

  beforeAll(async () => {
    reseedDb();
    app = await getTestApp();
    auth = await loginAs(app, 'admin@email.com', 'admin123');
  });

  it('runs through the critical path', async () => {
    // Look up a leaf income category (Dízimo requires member; pick "Oferta de Culto" instead)
    const categoryResults = await db
      .select()
      .from(incomeCategories)
      .where(eq(incomeCategories.name, 'Oferta de Culto'));
    const category = categoryResults[0];
    expect(category).toBeDefined();

    const pmResults = await db.select().from(paymentMethods).limit(1);
    const pm = pmResults[0];
    expect(pm).toBeDefined();

    const referenceDate = '2097-01-15';

    const createEntry = await app.inject({
      method: 'POST',
      url: '/income-entries',
      headers: { cookie: auth.cookie, 'x-csrf-token': auth.csrfToken },
      payload: {
        categoryId: category.id,
        paymentMethodId: pm.id,
        amount: 100.0,
        referenceDate
      }
    });
    expect(createEntry.statusCode).toBe(201);

    const createClosing = await app.inject({
      method: 'POST',
      url: '/monthly-closings',
      headers: { cookie: auth.cookie, 'x-csrf-token': auth.csrfToken },
      payload: { periodYear: 2097, periodMonth: 1 }
    });
    expect(createClosing.statusCode).toBe(201);
    const { id } = createClosing.json<{ id: number }>();

    await app.inject({
      method: 'POST',
      url: `/monthly-closings/${id}/submit`,
      headers: { cookie: auth.cookie, 'x-csrf-token': auth.csrfToken },
      payload: {}
    });
    await app.inject({
      method: 'POST',
      url: `/monthly-closings/${id}/approve`,
      headers: { cookie: auth.cookie, 'x-csrf-token': auth.csrfToken },
      payload: {}
    });
    const closeRes = await app.inject({
      method: 'POST',
      url: `/monthly-closings/${id}/close`,
      headers: { cookie: auth.cookie, 'x-csrf-token': auth.csrfToken },
      payload: {}
    });
    expect(closeRes.statusCode).toBe(200);
    expect(closeRes.json<{ status: string; closingBalance: string }>().status).toBe('fechado');
  });
});
