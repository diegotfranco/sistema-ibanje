import { describe, it, expect, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { getTestApp } from './helpers/app.js';
import { loginAs, type AuthCookies } from './helpers/auth.js';
import { reseedDb, clearMonthlyClosings } from './helpers/db.js';
import { db } from '../src/db/index.js';
import { incomeCategories, paymentMethods } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';

describe('events smoke: create event → log income → close month → verify P&L', () => {
  let app: FastifyInstance;
  let auth: AuthCookies;

  beforeAll(async () => {
    reseedDb();
    await clearMonthlyClosings();
    app = await getTestApp();
    auth = await loginAs(app, 'admin@email.com', 'admin123');
  });

  it('books an event-linked income and surfaces it in the events report', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/events',
      headers: { cookie: auth.cookie, 'x-csrf-token': auth.csrfToken },
      payload: {
        title: 'Test Conferência',
        startTime: '2097-02-01T18:00:00.000Z',
        endTime: '2097-02-03T22:00:00.000Z'
      }
    });
    expect(created.statusCode).toBe(201);
    const event = created.json<{ id: number }>();

    const [oferta] = await db
      .select()
      .from(incomeCategories)
      .where(eq(incomeCategories.name, 'Oferta'));
    expect(oferta).toBeDefined();
    const [pm] = await db.select().from(paymentMethods).limit(1);
    expect(pm).toBeDefined();

    const createEntry = await app.inject({
      method: 'POST',
      url: '/income-entries',
      headers: { cookie: auth.cookie, 'x-csrf-token': auth.csrfToken },
      payload: {
        categoryId: oferta.id,
        paymentMethodId: pm.id,
        amount: 250.0,
        depositDate: '2097-02-15',
        eventId: event.id,
        status: 'paga'
      }
    });
    expect(createEntry.statusCode).toBe(201);

    // Backend CHECK rejects an entry with BOTH fund and event set (form layer also
    // blocks this; this verifies the DB-level guard).
    const bothSet = await app.inject({
      method: 'POST',
      url: '/income-entries',
      headers: { cookie: auth.cookie, 'x-csrf-token': auth.csrfToken },
      payload: {
        categoryId: oferta.id,
        paymentMethodId: pm.id,
        amount: 100.0,
        depositDate: '2097-02-16',
        eventId: event.id,
        designatedFundId: 1
      }
    });
    expect(bothSet.statusCode).toBe(400);

    const closing = await app.inject({
      method: 'POST',
      url: '/monthly-closings',
      headers: { cookie: auth.cookie, 'x-csrf-token': auth.csrfToken },
      payload: { periodYear: 2097, periodMonth: 2 }
    });
    expect(closing.statusCode).toBe(201);
    const closingId = closing.json<{ id: number }>().id;
    await app.inject({
      method: 'POST',
      url: `/monthly-closings/${closingId}/submit`,
      headers: { cookie: auth.cookie, 'x-csrf-token': auth.csrfToken },
      payload: {}
    });
    await app.inject({
      method: 'POST',
      url: `/monthly-closings/${closingId}/approve`,
      headers: { cookie: auth.cookie, 'x-csrf-token': auth.csrfToken },
      payload: {}
    });

    const report = await app.inject({
      method: 'GET',
      url: '/reports/events?month=2097-02',
      headers: { cookie: auth.cookie, 'x-csrf-token': auth.csrfToken }
    });
    expect(report.statusCode).toBe(200);
    const body = report.json<{ events: { eventId: number; totalRaised: string }[] }>();
    const ourEvent = body.events.find((e) => e.eventId === event.id);
    expect(ourEvent).toBeDefined();
    expect(Number.parseFloat(ourEvent!.totalRaised)).toBe(250);
  });
});
