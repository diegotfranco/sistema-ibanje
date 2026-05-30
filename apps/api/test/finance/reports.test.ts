import { describe, it, expect, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { getTestApp } from '../helpers/app.js';
import { loginAs, type AuthCookies } from '../helpers/auth.js';
import { reseedDb } from '../helpers/db.js';

// The reports module is read-only and entirely gated by Module.Reports / Action.Report.
// These tests assert: response shapes serialize (200 implies the Zod response schema passed),
// the financial-statement balance invariant holds regardless of seed data, query validation
// (400 on bad/missing month), detail 404s, PDF rendering, and the permission gate (403).
describe('reports module', () => {
  let app: FastifyInstance;
  let admin: AuthCookies;
  let congregant: AuthCookies;
  // Current month — the seed populates finance data relative to "now", but every assertion
  // here holds even for an empty month (the balance invariant trivially holds at 0).
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  beforeAll(async () => {
    reseedDb();
    app = await getTestApp();
    admin = await loginAs(app, 'admin@email.com', 'admin123');
    congregant = await loginAs(app, 'congregado@email.com', 'congregado123');
  });

  it('returns the income report for a month', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/reports/income?month=${month}`,
      headers: { cookie: admin.cookie }
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ totalIncome: string; data: unknown[]; period: { from: string } }>();
    expect(typeof body.totalIncome).toBe('string');
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('returns the expense report for a month', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/reports/expenses?month=${month}`,
      headers: { cookie: admin.cookie }
    });
    expect(res.statusCode).toBe(200);
    expect(typeof res.json<{ totalExpenses: string }>().totalExpenses).toBe('string');
  });

  it('keeps the financial-statement balance invariant (opening + income - expenses)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/reports/financial-statement?month=${month}`,
      headers: { cookie: admin.cookie }
    });
    expect(res.statusCode).toBe(200);
    const b = res.json<{
      openingBalance: string;
      totalIncome: string;
      totalExpenses: string;
      currentBalance: string;
    }>();
    const expected =
      Number.parseFloat(b.openingBalance) +
      Number.parseFloat(b.totalIncome) -
      Number.parseFloat(b.totalExpenses);
    expect(Number.parseFloat(b.currentBalance)).toBeCloseTo(expected, 2);
  });

  it('returns the detailed financial statement (pivot + entries)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/reports/financial-statement/detailed?month=${month}`,
      headers: { cookie: admin.cookie }
    });
    expect(res.statusCode).toBe(200);
    expect(res.json<{ incomePivot: unknown }>()).toHaveProperty('incomePivot');
  });

  it('returns the attenders report', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/reports/attenders?month=${month}`,
      headers: { cookie: admin.cookie }
    });
    expect(res.statusCode).toBe(200);
    expect(
      res.json<{ totalActiveAttenders: number }>().totalActiveAttenders
    ).toBeGreaterThanOrEqual(0);
  });

  it('renders the financial-statement PDF without throwing', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/reports/financial-statement/pdf?month=${month}`,
      headers: { cookie: admin.cookie }
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.rawPayload.length).toBeGreaterThan(0);
  });

  describe('funds report', () => {
    it('lists funds and reads a fund detail', async () => {
      const list = await app.inject({
        method: 'GET',
        url: '/reports/funds',
        headers: { cookie: admin.cookie }
      });
      expect(list.statusCode).toBe(200);
      const funds = list.json<{ funds: { fundId: number }[] }>().funds;
      expect(funds.length).toBeGreaterThan(0);

      const detail = await app.inject({
        method: 'GET',
        url: `/reports/funds/${funds[0].fundId}`,
        headers: { cookie: admin.cookie }
      });
      expect(detail.statusCode).toBe(200);
      expect(detail.json<{ incomeEntries: unknown[] }>()).toHaveProperty('incomeEntries');
    });

    it('returns 404 for an unknown fund', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/reports/funds/999999',
        headers: { cookie: admin.cookie }
      });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('events report', () => {
    it('lists events and reads an event detail', async () => {
      const list = await app.inject({
        method: 'GET',
        url: '/reports/events',
        headers: { cookie: admin.cookie }
      });
      expect(list.statusCode).toBe(200);
      const events = list.json<{ events: { eventId: number }[] }>().events;
      expect(events.length).toBeGreaterThan(0);

      const detail = await app.inject({
        method: 'GET',
        url: `/reports/events/${events[0].eventId}`,
        headers: { cookie: admin.cookie }
      });
      expect(detail.statusCode).toBe(200);
      expect(detail.json<{ net: string }>()).toHaveProperty('net');
    });

    it('returns 404 for an unknown event', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/reports/events/999999',
        headers: { cookie: admin.cookie }
      });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('query validation', () => {
    it('rejects a malformed month (400)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/reports/income?month=2026-13',
        headers: { cookie: admin.cookie }
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects a missing month on a month-required report (400)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/reports/financial-statement',
        headers: { cookie: admin.cookie }
      });
      expect(res.statusCode).toBe(400);
    });
  });

  it('blocks a user without the Reports permission (403)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/reports/income?month=${month}`,
      headers: { cookie: congregant.cookie }
    });
    expect(res.statusCode).toBe(403);
  });
});
