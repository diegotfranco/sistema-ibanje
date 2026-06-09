import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { db } from '../src/db/index.js';
import { monthlyClosings } from '../src/db/schema.js';
import { computeOpeningBalance } from '../src/modules/finance/reports/service.js';
import { getTestApp } from './helpers/app.js';
import { loginAs, type AuthCookies } from './helpers/auth.js';
import { reseedDb, clearMonthlyClosings } from './helpers/db.js';

type FinanceSettings = {
  openingBalance: string;
  lockedByClosing: boolean;
  updatedAt: string;
};

describe('finance-settings module', () => {
  let app: FastifyInstance;
  let admin: AuthCookies;
  // Secretário has full "Dados da Igreja" permissions but is NOT Administrador,
  // so it exercises the freeze guard (permitted, but blocked once a closing exists).
  let secretary: AuthCookies;
  let congregant: AuthCookies;

  beforeAll(async () => {
    reseedDb();
    await clearMonthlyClosings();
    app = await getTestApp();
    admin = await loginAs(app, 'admin@email.com', 'admin123');
    secretary = await loginAs(app, 'secretario@email.com', 'secretario123');
    congregant = await loginAs(app, 'congregado@email.com', 'congregado123');
  });

  describe('with no closings (editable)', () => {
    it('reads the settings shape (200)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/finance-settings',
        headers: { cookie: admin.cookie }
      });
      expect(res.statusCode).toBe(200);
      const body = res.json<FinanceSettings>();
      expect(typeof body.openingBalance).toBe('string');
      expect(body.lockedByClosing).toBe(false);
    });

    it('blocks a congregant without permission (403)', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/finance-settings',
        headers: { cookie: congregant.cookie, 'x-csrf-token': congregant.csrfToken },
        payload: { openingBalance: '100.00' }
      });
      expect(res.statusCode).toBe(403);
    });

    it('updates the opening balance and flows it into the first closing computation', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/finance-settings',
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
        payload: { openingBalance: '7777.00' }
      });
      expect(res.statusCode).toBe(200);
      expect(res.json<FinanceSettings>().openingBalance).toBe('7777.00');

      // A period that starts at the very beginning of the data window with no prior
      // `fechado` closing resolves its opening balance straight from finance_settings.
      expect(await computeOpeningBalance('2020-01-01')).toBe('7777.00');
    });

    it('rejects a non-numeric opening balance with a field error (400)', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/finance-settings',
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
        payload: { openingBalance: 'abc' }
      });
      expect(res.statusCode).toBe(400);
      expect(
        res.json<{ fieldErrors?: Record<string, string> }>().fieldErrors?.openingBalance
      ).toBeDefined();
    });
  });

  describe('once the first month is closed (frozen)', () => {
    beforeAll(async () => {
      await db
        .insert(monthlyClosings)
        .values({ period: 209901, status: 'fechado', closingBalance: '0.00' });
    });

    afterAll(async () => {
      await clearMonthlyClosings();
    });

    it('reports lockedByClosing = true', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/finance-settings',
        headers: { cookie: admin.cookie }
      });
      expect(res.json<FinanceSettings>().lockedByClosing).toBe(true);
    });

    it('blocks a permitted non-admin from editing (409)', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/finance-settings',
        headers: { cookie: secretary.cookie, 'x-csrf-token': secretary.csrfToken },
        payload: { openingBalance: '999.00' }
      });
      expect(res.statusCode).toBe(409);
    });

    it('lets an Administrador override the freeze (200)', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/finance-settings',
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
        payload: { openingBalance: '8888.00' }
      });
      expect(res.statusCode).toBe(200);
      expect(res.json<FinanceSettings>().openingBalance).toBe('8888.00');
    });
  });
});
