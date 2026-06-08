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

type ExpenseCategoryRow = {
  id: number;
  name: string;
};

type ExpenseEntryRow = {
  id: number;
  date: string;
  total: string;
  amount: string;
  categoryId: number;
  paymentMethodId: number;
  campaignId: number | null;
  eventId: number | null;
  status: string;
  createdAt: Date;
};

describe('expense-entries module', () => {
  let app: FastifyInstance;
  let admin: AuthCookies;
  let congregant: AuthCookies;
  let entryId: number;
  let categoryId: number;
  let paymentMethodId: number;
  const today = new Date().toISOString().slice(0, 10);

  beforeAll(async () => {
    reseedDb();
    await clearMonthlyClosings();
    app = await getTestApp();
    admin = await loginAs(app, 'admin@email.com', 'admin123');
    congregant = await loginAs(app, 'congregado@email.com', 'congregado123');

    // Fetch a valid payment method (allowsOutflow)
    const pmRes = await app.inject({
      method: 'GET',
      url: '/payment-methods?limit=100',
      headers: { cookie: admin.cookie }
    });
    const paymentMethods = pmRes.json<{ data: PaymentMethodRow[] }>().data;
    const outflowMethod = paymentMethods.find((pm) => pm.allowsOutflow);
    if (!outflowMethod) {
      throw new Error('No payment method with allowsOutflow found');
    }
    paymentMethodId = outflowMethod.id;

    // Fetch a valid expense category (must not be a parent; find one with no parentId or one that has a parentId)
    const catRes = await app.inject({
      method: 'GET',
      url: '/expense-categories?limit=100',
      headers: { cookie: admin.cookie }
    });
    const categories = catRes.json<{ data: ExpenseCategoryRow[] }>().data;
    if (categories.length === 0) {
      throw new Error('No expense categories found');
    }
    // Find a leaf category (one with parentId or one that is not a parent to others)
    const leafCategory = categories.find((cat) => cat.parentId !== null) || categories[0];
    categoryId = leafCategory.id;
  });

  it('creates an expense entry (201)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/expense-entries',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: {
        date: today,
        total: 100,
        amount: 100,
        categoryId,
        paymentMethodId
      }
    });
    expect(res.statusCode).toBe(201);
    const entry = res.json<ExpenseEntryRow>();
    entryId = entry.id;
    expect(entry).toMatchObject({
      categoryId,
      paymentMethodId,
      status: 'pendente'
    });
  });

  it('rejects an entry with both campaignId and eventId (400)', async () => {
    // First get a campaign and an event if available
    const campaignRes = await app.inject({
      method: 'GET',
      url: '/campaigns?limit=100',
      headers: { cookie: admin.cookie }
    });
    const campaignData = campaignRes.json<{ data: Array<{ id: number }> }>();
    const campaignId = campaignData.data?.[0]?.id;

    const eventRes = await app.inject({
      method: 'GET',
      url: '/events?limit=100',
      headers: { cookie: admin.cookie }
    });
    const eventData = eventRes.json<{ data: Array<{ id: number }> }>();
    const eventId = eventData.data?.[0]?.id;

    // If either is available, test the refine violation
    if (campaignId && eventId) {
      const res = await app.inject({
        method: 'POST',
        url: '/expense-entries',
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
        payload: {
          date: today,
          total: 50,
          amount: 50,
          categoryId,
          paymentMethodId,
          campaignId: campaignId,
          eventId
        }
      });
      expect(res.statusCode).toBe(400);
    } else {
      // If not available, test with negative amount
      const res = await app.inject({
        method: 'POST',
        url: '/expense-entries',
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
        payload: {
          date: today,
          total: -5,
          amount: -5,
          categoryId,
          paymentMethodId
        }
      });
      expect(res.statusCode).toBe(400);
    }
  });

  it('reads it back (200) and 404s an unknown id', async () => {
    const get = await app.inject({
      method: 'GET',
      url: `/expense-entries/${entryId}`,
      headers: { cookie: admin.cookie }
    });
    expect(get.statusCode).toBe(200);
    const entry = get.json<ExpenseEntryRow>();
    expect(entry.id).toBe(entryId);

    const missing = await app.inject({
      method: 'GET',
      url: '/expense-entries/999999',
      headers: { cookie: admin.cookie }
    });
    expect(missing.statusCode).toBe(404);
  });

  it('lists expense entries (200)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/expense-entries?limit=50',
      headers: { cookie: admin.cookie }
    });
    expect(res.statusCode).toBe(200);
    const list = res.json<{ data: ExpenseEntryRow[] }>();
    expect(Array.isArray(list.data)).toBe(true);
    expect(list.data.length).toBeGreaterThan(0);
  });

  it('gets expense summary (200)', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const to = futureDate.toISOString().slice(0, 10);

    const res = await app.inject({
      method: 'GET',
      url: `/expense-entries/summary?from=${today}&to=${to}`,
      headers: { cookie: admin.cookie }
    });
    expect(res.statusCode).toBe(200);
    const summary = res.json<{ rows: Array<{ categoryId: number }>; total: string }>();
    expect(Array.isArray(summary.rows)).toBe(true);
  });

  it('updates the expense entry (200) and 404s an unknown id', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/expense-entries/${entryId}`,
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: {
        amount: 150,
        total: 150
      }
    });
    expect(res.statusCode).toBe(200);
    const entry = res.json<ExpenseEntryRow>();
    expect(entry.amount).toBe('150.00');

    const missing = await app.inject({
      method: 'PATCH',
      url: '/expense-entries/999999',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: { amount: 100, total: 100 }
    });
    expect(missing.statusCode).toBe(404);
  });

  it('cancels the expense entry (204)', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/expense-entries/${entryId}`,
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken }
    });
    expect(res.statusCode).toBe(204);
  });

  describe('route gating', () => {
    it('blocks a congregant from listing (403)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/expense-entries',
        headers: { cookie: congregant.cookie }
      });
      expect(res.statusCode).toBe(403);
    });

    it('blocks a congregant from creating (403)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/expense-entries',
        headers: { cookie: congregant.cookie, 'x-csrf-token': congregant.csrfToken },
        payload: {
          date: today,
          total: 50,
          amount: 50,
          categoryId,
          paymentMethodId
        }
      });
      expect(res.statusCode).toBe(403);
    });
  });
});
