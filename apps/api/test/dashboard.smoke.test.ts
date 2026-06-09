import { describe, it, expect, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { getTestApp } from './helpers/app.js';
import { loginAs, type AuthCookies } from './helpers/auth.js';
import { reseedDb, clearMonthlyClosings } from './helpers/db.js';

describe('dashboard smoke: composite endpoint returns expected shape with matching data', () => {
  let app: FastifyInstance;
  let auth: AuthCookies;

  beforeAll(async () => {
    reseedDb();
    await clearMonthlyClosings();
    app = await getTestApp();
    auth = await loginAs(app, 'admin@email.com', 'admin123');
  });

  it('GET /dashboard returns correct shape and structure', async () => {
    const result = await app.inject({
      method: 'GET',
      url: '/dashboard?month=2026-05',
      headers: { cookie: auth.cookie, 'x-csrf-token': auth.csrfToken }
    });

    expect(result.statusCode).toBe(200);
    const body = result.json();

    // Verify top-level shape
    expect(body).toHaveProperty('month', '2026-05');
    expect(body).toHaveProperty('finance');
    expect(body).toHaveProperty('participation');
    expect(body).toHaveProperty('trends');
    expect(body).toHaveProperty('closing');
    expect(body).toHaveProperty('campaigns');
    expect(body).toHaveProperty('events');

    // Finance KPIs shape
    expect(body.finance).toHaveProperty('income');
    expect(body.finance.income).toHaveProperty('current');
    expect(body.finance.income).toHaveProperty('previous');
    expect(body.finance.income).toHaveProperty('deltaPct');
    expect(body.finance).toHaveProperty('expenses');
    expect(body.finance.expenses).toHaveProperty('current');
    expect(body.finance.expenses).toHaveProperty('previous');
    expect(body.finance.expenses).toHaveProperty('deltaPct');
    expect(body.finance).toHaveProperty('netResult');
    expect(body.finance.netResult).toHaveProperty('current');
    expect(body.finance.netResult).toHaveProperty('previous');
    expect(body.finance.netResult).toHaveProperty('deltaPct');
    expect(body.finance).toHaveProperty('cashBalance');
    expect(body.finance.cashBalance).toHaveProperty('current');
    expect(body.finance.cashBalance).toHaveProperty('asOf');
    expect(body.finance).toHaveProperty('pendingCounts');
    expect(body.finance.pendingCounts).toHaveProperty('income');
    expect(body.finance.pendingCounts).toHaveProperty('expenses');

    // Participation shape
    expect(body.participation).toHaveProperty('tithe');
    expect(body.participation.tithe).toHaveProperty('currentPct');
    expect(body.participation.tithe).toHaveProperty('sixMonthAvgPct');
    expect(body.participation.tithe).toHaveProperty('deltaPct');
    expect(body.participation).toHaveProperty('offering');
    expect(body.participation.offering).toHaveProperty('currentPct');
    expect(body.participation.offering).toHaveProperty('sixMonthAvgPct');
    expect(body.participation.offering).toHaveProperty('deltaPct');

    // Trends shape (12 months)
    expect(body.trends).toHaveProperty('monthly');
    expect(Array.isArray(body.trends.monthly)).toBe(true);
    expect(body.trends.monthly.length).toBe(12);
    for (const month of body.trends.monthly) {
      expect(month).toHaveProperty('month');
      expect(month).toHaveProperty('income');
      expect(month).toHaveProperty('expenses');
      expect(month).toHaveProperty('titheAmount');
      expect(month).toHaveProperty('offeringAmount');
      expect(month).toHaveProperty('donationAmount');
    }

    // Closing shape
    expect(body.closing).toHaveProperty('currentMonthId');
    expect(body.closing).toHaveProperty('status');
    expect(body.closing).toHaveProperty('runningBalance');
    expect(body.closing).toHaveProperty('closingBalance');
    expect(body.closing).toHaveProperty('priorPendingCount');
    expect(body.closing).toHaveProperty('oldestPendingId');

    // Campaigns shape (array of campaign summaries)
    expect(Array.isArray(body.campaigns)).toBe(true);
    for (const campaign of body.campaigns) {
      expect(campaign).toHaveProperty('campaignId');
      expect(campaign).toHaveProperty('campaignName');
      expect(campaign).toHaveProperty('targetAmount');
      expect(campaign).toHaveProperty('totalRaised');
      expect(campaign).toHaveProperty('totalExpenses');
      expect(campaign).toHaveProperty('balance');
      expect(campaign).toHaveProperty('progressPercentage');
    }

    // Events shape
    expect(body.events).toHaveProperty('recent');
    expect(Array.isArray(body.events.recent)).toBe(true);
    for (const event of body.events.recent) {
      expect(event).toHaveProperty('eventId');
      expect(event).toHaveProperty('eventTitle');
      expect(event).toHaveProperty('startTime');
      expect(event).toHaveProperty('endTime');
      expect(event).toHaveProperty('totalSpent');
      expect(event).toHaveProperty('totalRaised');
      expect(event).toHaveProperty('net');
    }
    expect(body.events).toHaveProperty('summary');
    expect(body.events.summary).toHaveProperty('count');
    expect(body.events.summary).toHaveProperty('totalRaised');
    expect(body.events.summary).toHaveProperty('totalSpent');
    expect(body.events.summary).toHaveProperty('totalNet');
  });

  it('requires authentication', async () => {
    const result = await app.inject({
      method: 'GET',
      url: '/dashboard?month=2026-05'
    });

    expect(result.statusCode).toBe(401);
  });

  // Note: the Painel grant on every demo role (Congregado now included for transparency)
  // means there's no seeded user without Dashboard.View to drive a 403 smoke here. The
  // generic permission-gate behaviour is covered by permissions.test.ts.

  // RBAC: each section is gated by the read permission of the module that owns its data.
  it('returns null finance/closing sections for a Congregado (no Reports/Closings perms)', async () => {
    const congregado = await loginAs(app, 'congregado@email.com', 'congregado123');
    const result = await app.inject({
      method: 'GET',
      url: '/dashboard?month=2026-05',
      headers: { cookie: congregado.cookie, 'x-csrf-token': congregado.csrfToken }
    });

    expect(result.statusCode).toBe(200);
    const body = result.json();
    expect(body.month).toBe('2026-05');
    expect(body.finance).toBeNull();
    expect(body.participation).toBeNull();
    expect(body.trends).toBeNull();
    expect(body.campaigns).toBeNull();
    expect(body.events).toBeNull();
    expect(body.closing).toBeNull();
  });

  it('returns populated finance + closing for the treasurer (board role with Reports)', async () => {
    const tesoureiro = await loginAs(app, 'tesoureiro@email.com', 'tesoureiro123');
    const result = await app.inject({
      method: 'GET',
      url: '/dashboard?month=2026-05',
      headers: { cookie: tesoureiro.cookie, 'x-csrf-token': tesoureiro.csrfToken }
    });

    expect(result.statusCode).toBe(200);
    const body = result.json();
    expect(body.finance).not.toBeNull();
    expect(body.finance.income).toHaveProperty('current');
    expect(body.closing).not.toBeNull();
  });

  it('validates month query parameter format', async () => {
    const result = await app.inject({
      method: 'GET',
      url: '/dashboard?month=invalid',
      headers: { cookie: auth.cookie, 'x-csrf-token': auth.csrfToken }
    });

    expect(result.statusCode).toBe(400);
  });
});
