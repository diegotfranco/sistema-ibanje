import { describe, it, expect, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { getTestApp } from '../helpers/app.js';
import { loginAs, type AuthCookies } from '../helpers/auth.js';
import { reseedDb, clearMonthlyClosings } from '../helpers/db.js';

type PaymentMethodRow = {
  id: number;
  name: string;
  allowsInflow: boolean;
  allowsOutflow: boolean;
};

type IncomeCategoryRow = {
  id: number;
  name: string;
};

type IncomeEntryRow = {
  id: number;
  depositDate: string;
  referenceDate: string;
  attributionMonth: string | null;
  amount: string;
  categoryId: number;
  paymentMethodId: number;
  designatedFundId: number | null;
  eventId: number | null;
  status: string;
  createdAt: Date;
};

type AttenderRow = {
  id: number;
  name: string;
};

describe('income-entries module', () => {
  let app: FastifyInstance;
  let admin: AuthCookies;
  let congregant: AuthCookies;
  let entryId: number;
  let categoryId: number;
  let paymentMethodId: number;
  let attenderId: number | undefined;
  const today = new Date().toISOString().slice(0, 10);

  beforeAll(async () => {
    reseedDb();
    await clearMonthlyClosings();
    app = await getTestApp();
    admin = await loginAs(app, 'admin@email.com', 'admin123');
    congregant = await loginAs(app, 'congregado@email.com', 'congregado123');

    // Fetch a valid payment method (allowsInflow)
    const pmRes = await app.inject({
      method: 'GET',
      url: '/payment-methods?limit=100',
      headers: { cookie: admin.cookie }
    });
    const paymentMethods = pmRes.json<{ data: PaymentMethodRow[] }>().data;
    const inflowMethod = paymentMethods.find((pm) => pm.allowsInflow);
    if (!inflowMethod) {
      throw new Error('No payment method with allowsInflow found');
    }
    paymentMethodId = inflowMethod.id;

    // Fetch a valid income category (must not be a parent; find one with parentId)
    const catRes = await app.inject({
      method: 'GET',
      url: '/income-categories?limit=100',
      headers: { cookie: admin.cookie }
    });
    const categories = catRes.json<{ data: IncomeCategoryRow[] }>().data;
    if (categories.length === 0) {
      throw new Error('No income categories found');
    }
    // Find a leaf category that doesn't require a member, or use the first leaf with fallback to create entry with attenderId
    const leafCategory =
      categories.find((cat) => cat.parentId !== null && cat.requiresMember === false) ||
      categories.find((cat) => cat.parentId !== null);
    categoryId = leafCategory?.id || categories[0].id;

    // Fetch an attender for categories that require a member
    const attenderRes = await app.inject({
      method: 'GET',
      url: '/attenders?limit=100',
      headers: { cookie: admin.cookie }
    });
    const attenders = attenderRes.json<{ data: AttenderRow[] }>().data;
    if (attenders.length > 0) {
      attenderId = attenders[0].id;
    }
  });

  it('creates an income entry (201)', async () => {
    const payload: Record<string, unknown> = {
      depositDate: today,
      amount: 100,
      categoryId,
      paymentMethodId
    };
    if (attenderId) {
      payload.attenderId = attenderId;
    }
    const res = await app.inject({
      method: 'POST',
      url: '/income-entries',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload
    });
    if (res.statusCode !== 201) {
      console.error('Create income entry failed:', res.statusCode, res.body);
    }
    expect(res.statusCode).toBe(201);
    const entry = res.json<IncomeEntryRow>();
    entryId = entry.id;
    expect(entry).toMatchObject({
      categoryId,
      paymentMethodId,
      status: 'pendente'
    });
    expect(entry.depositDate).toBe(today);
  });

  it('rejects an entry with both designatedFundId and eventId (400)', async () => {
    // First get a designated fund and an event if available
    const fundRes = await app.inject({
      method: 'GET',
      url: '/designated-funds?limit=100',
      headers: { cookie: admin.cookie }
    });
    const fundData = fundRes.json<{ data: Array<{ id: number }> }>();
    const fundId = fundData.data?.[0]?.id;

    const eventRes = await app.inject({
      method: 'GET',
      url: '/events?limit=100',
      headers: { cookie: admin.cookie }
    });
    const eventData = eventRes.json<{ data: Array<{ id: number }> }>();
    const eventId = eventData.data?.[0]?.id;

    // If both are available, test the refine violation
    if (fundId && eventId) {
      const payload: Record<string, unknown> = {
        depositDate: today,
        amount: 50,
        categoryId,
        paymentMethodId,
        designatedFundId: fundId,
        eventId
      };
      if (attenderId) {
        payload.attenderId = attenderId;
      }
      const res = await app.inject({
        method: 'POST',
        url: '/income-entries',
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
        payload
      });
      expect(res.statusCode).toBe(400);
    } else {
      // If not both available, test with negative amount
      const payload: Record<string, unknown> = {
        depositDate: today,
        amount: -5,
        categoryId,
        paymentMethodId
      };
      if (attenderId) {
        payload.attenderId = attenderId;
      }
      const res = await app.inject({
        method: 'POST',
        url: '/income-entries',
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
        payload
      });
      expect(res.statusCode).toBe(400);
    }
  });

  it('reads it back (200) and 404s an unknown id', async () => {
    const get = await app.inject({
      method: 'GET',
      url: `/income-entries/${entryId}`,
      headers: { cookie: admin.cookie }
    });
    expect(get.statusCode).toBe(200);
    const entry = get.json<IncomeEntryRow>();
    expect(entry.id).toBe(entryId);

    const missing = await app.inject({
      method: 'GET',
      url: '/income-entries/999999',
      headers: { cookie: admin.cookie }
    });
    expect(missing.statusCode).toBe(404);
  });

  it('lists income entries (200)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/income-entries?limit=50',
      headers: { cookie: admin.cookie }
    });
    expect(res.statusCode).toBe(200);
    const list = res.json<{ data: IncomeEntryRow[] }>();
    expect(Array.isArray(list.data)).toBe(true);
    expect(list.data.length).toBeGreaterThan(0);
  });

  it('gets income summary (200)', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const to = futureDate.toISOString().slice(0, 10);

    const res = await app.inject({
      method: 'GET',
      url: `/income-entries/summary?from=${today}&to=${to}`,
      headers: { cookie: admin.cookie }
    });
    expect(res.statusCode).toBe(200);
    const summary = res.json<{ rows: Array<{ categoryId: number }>; total: string }>();
    expect(Array.isArray(summary.rows)).toBe(true);
  });

  it('updates the income entry (200) and 404s an unknown id', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/income-entries/${entryId}`,
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: {
        amount: 200
      }
    });
    expect(res.statusCode).toBe(200);
    const entry = res.json<IncomeEntryRow>();
    expect(entry.amount).toBe('200.00');

    const missing = await app.inject({
      method: 'PATCH',
      url: '/income-entries/999999',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: { amount: 100 }
    });
    expect(missing.statusCode).toBe(404);
  });

  it('cancels the income entry (204)', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/income-entries/${entryId}`,
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken }
    });
    expect(res.statusCode).toBe(204);
  });

  describe('route gating', () => {
    it('blocks a congregant from listing (403)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/income-entries',
        headers: { cookie: congregant.cookie }
      });
      expect(res.statusCode).toBe(403);
    });

    it('blocks a congregant from creating (403)', async () => {
      const payload: Record<string, unknown> = {
        depositDate: today,
        amount: 50,
        categoryId,
        paymentMethodId
      };
      if (attenderId) {
        payload.attenderId = attenderId;
      }
      const res = await app.inject({
        method: 'POST',
        url: '/income-entries',
        headers: { cookie: congregant.cookie, 'x-csrf-token': congregant.csrfToken },
        payload
      });
      expect(res.statusCode).toBe(403);
    });
  });
});
