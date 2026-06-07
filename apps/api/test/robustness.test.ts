import { describe, it, expect, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { and, eq, isNotNull } from 'drizzle-orm';
import { getTestApp } from './helpers/app.js';
import { loginAs, type AuthCookies } from './helpers/auth.js';
import { reseedDb, clearMonthlyClosings } from './helpers/db.js';
import { db } from '../src/db/index.js';
import { incomeCategories, paymentMethods, users } from '../src/db/schema.js';

// Input-robustness suite. Every case proves the API degrades to a SEMANTIC 4xx — never a 500, never
// an indevido insert. Authenticated as admin so the only thing under test is input handling.
describe('input robustness (no 500s under adversarial input)', () => {
  let app: FastifyInstance;
  let auth: AuthCookies;
  let leafCategoryId: number; // Oferta — selectable, no member required
  let memberCategoryId: number; // requiresMember = true (e.g. Dízimo)
  let parentCategoryId: number; // a header category that has children
  let inflowPmId: number; // allowsInflow
  let outflowOnlyPmId: number; // allowsInflow = false
  let linkedUserId: number; // a user already linked to an attender (congregado → João da Silva)

  beforeAll(async () => {
    reseedDb();
    // Clearing closings removes the forward-period lock so create-entry cases surface the
    // validation error under test (404/400) instead of a period-locked 409.
    await clearMonthlyClosings();
    app = await getTestApp();
    auth = await loginAs(app, 'admin@email.com', 'admin123');

    const [leaf] = await db
      .select()
      .from(incomeCategories)
      .where(eq(incomeCategories.name, 'Oferta'));
    leafCategoryId = leaf.id;

    const [member] = await db
      .select()
      .from(incomeCategories)
      .where(eq(incomeCategories.requiresMember, true))
      .limit(1);
    memberCategoryId = member.id;

    // Any row with a parentId points at a category that necessarily has children → a parent.
    const [child] = await db
      .select()
      .from(incomeCategories)
      .where(isNotNull(incomeCategories.parentId))
      .limit(1);
    parentCategoryId = child.parentId!;

    const [inflow] = await db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.allowsInflow, true))
      .limit(1);
    inflowPmId = inflow.id;

    const [outflow] = await db
      .select()
      .from(paymentMethods)
      .where(and(eq(paymentMethods.allowsInflow, false), eq(paymentMethods.allowsOutflow, true)))
      .limit(1);
    outflowOnlyPmId = outflow.id;

    const [linked] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, 'congregado@email.com'));
    linkedUserId = linked.id;
  });

  function post(url: string, payload: unknown, raw = false) {
    return app.inject({
      method: 'POST',
      url,
      headers: {
        cookie: auth.cookie,
        'x-csrf-token': auth.csrfToken,
        ...(raw ? { 'content-type': 'application/json' } : {})
      },
      payload: payload as never
    });
  }

  function validEntry(overrides: Record<string, unknown> = {}) {
    return {
      categoryId: leafCategoryId,
      paymentMethodId: inflowPmId,
      amount: 100,
      depositDate: '2096-06-14',
      ...overrides
    };
  }

  describe('malformed transport', () => {
    it('rejects a malformed JSON body with 400, not 500', async () => {
      const res = await post('/income-entries', '{"amount": ', true);
      expect(res.statusCode).toBe(400);
    });

    it('rejects a non-numeric path param with a 4xx, not 500', async () => {
      for (const url of ['/users/abc', '/income-entries/9.9', '/monthly-closings/-1']) {
        const res = await app.inject({ method: 'GET', url, headers: { cookie: auth.cookie } });
        expect(res.statusCode).toBeGreaterThanOrEqual(400);
        expect(res.statusCode).toBeLessThan(500);
      }
    });
  });

  describe('pagination abuse', () => {
    it.each(['limit=-1', 'limit=99999', 'limit=abc', 'page=0'])(
      'rejects ?%s with 400',
      async (qs) => {
        const res = await app.inject({
          method: 'GET',
          url: `/income-entries?${qs}`,
          headers: { cookie: auth.cookie }
        });
        expect(res.statusCode).toBe(400);
      }
    );

    // income-entries caps `limit` at 100 (schema.ts: .max(100)); the reference-data lists
    // (payment-methods, categories, designated-funds) allow up to 500. 100 here is the boundary.
    it('accepts limit at the boundary (100 → HTTP 200)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/income-entries?limit=100',
        headers: { cookie: auth.cookie }
      });
      expect(res.statusCode).toBe(200);
    });

    it('rejects limit just over the cap (101 → 400)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/income-entries?limit=101',
        headers: { cookie: auth.cookie }
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('adversarial income-entry payloads', () => {
    it.each([
      { label: 'negative amount', body: { amount: -5 }, expected: 400 },
      { label: 'zero amount', body: { amount: 0 }, expected: 400 },
      { label: 'string amount', body: { amount: '100' }, expected: 400 }
    ])('rejects $label with $expected', async ({ body, expected }) => {
      const res = await post('/income-entries', validEntry(body));
      expect(res.statusCode).toBe(expected);
    });

    it('returns 404 for a nonexistent categoryId', async () => {
      const res = await post('/income-entries', validEntry({ categoryId: 999999 }));
      expect(res.statusCode).toBe(404);
    });

    it('returns 404 for a nonexistent paymentMethodId', async () => {
      const res = await post('/income-entries', validEntry({ paymentMethodId: 999999 }));
      expect(res.statusCode).toBe(404);
    });

    it('rejects selecting a parent (header) category with 400', async () => {
      const res = await post('/income-entries', validEntry({ categoryId: parentCategoryId }));
      expect(res.statusCode).toBe(400);
    });

    it('rejects a member-required category without a donor with 400', async () => {
      const res = await post('/income-entries', validEntry({ categoryId: memberCategoryId }));
      expect(res.statusCode).toBe(400);
    });

    it('rejects a payment method that does not allow inflow with 400', async () => {
      const res = await post('/income-entries', validEntry({ paymentMethodId: outflowOnlyPmId }));
      expect(res.statusCode).toBe(400);
    });

    it('rejects both designatedFundId and eventId at once with 400', async () => {
      const res = await post('/income-entries', validEntry({ designatedFundId: 1, eventId: 1 }));
      expect(res.statusCode).toBe(400);
    });

    it('ignores unexpected extra fields (strips them, never persists)', async () => {
      const res = await post('/income-entries', validEntry({ hacker: true, isAdmin: 1 }));
      expect(res.statusCode).toBe(201);
      expect(res.json<Record<string, unknown>>()).not.toHaveProperty('hacker');
      expect(res.json<Record<string, unknown>>()).not.toHaveProperty('isAdmin');
    });
  });

  describe('injection-style strings are handled safely', () => {
    it('treats a SQL-injection string in a search filter as a literal (no 500)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/attenders?q=${encodeURIComponent("'; DROP TABLE users;--")}`,
        headers: { cookie: auth.cookie }
      });
      expect(res.statusCode).toBe(200);
      // The roster must still exist — proves the statement was parameterized, not executed.
      const after = await app.inject({
        method: 'GET',
        url: '/attenders?limit=1',
        headers: { cookie: auth.cookie }
      });
      expect(after.statusCode).toBe(200);
    });

    it('stores an XSS payload in notes verbatim and never executes it (no 500)', async () => {
      const xss = '<script>alert(1)</script>';
      const res = await post(
        '/income-entries',
        validEntry({ notes: xss, depositDate: '2096-07-14' })
      );
      expect(res.statusCode).toBe(201);
      expect(res.json<{ notes: string }>().notes).toBe(xss);
    });
  });

  describe('error envelope contract', () => {
    it('a service-level error exposes { message, fieldErrors } with a field key', async () => {
      // Linking an attender to a user that is already linked throws
      // httpError(409, …, { fieldErrors: { userId } }) inside the service — the path the
      // frontend's applyFieldErrors() relies on.
      const res = await post('/attenders', { name: 'Vínculo Duplicado', userId: linkedUserId });
      expect(res.statusCode).toBe(409);
      const body = res.json<{ message: string; fieldErrors?: Record<string, string> }>();
      expect(typeof body.message).toBe('string');
      expect(body.fieldErrors).toBeDefined();
      expect(body.fieldErrors).toHaveProperty('userId');
    });

    it('a 404 exposes { message } and no fieldErrors', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/income-entries/999999',
        headers: { cookie: auth.cookie }
      });
      expect(res.statusCode).toBe(404);
      const body = res.json<{ message: string; fieldErrors?: unknown }>();
      expect(typeof body.message).toBe('string');
      expect(body.fieldErrors).toBeUndefined();
    });

    // Transport-level (Zod request-body/query) validation failures honor the { message, fieldErrors }
    // contract: the errorHandler maps fastify-type-provider-zod's `.validation` issues to dotted
    // fieldErrors keys, so the frontend's applyFieldErrors() can surface them under the right field.
    it('a transport-validation 400 exposes { message, fieldErrors } with the offending field', async () => {
      const res = await post('/income-entries', validEntry({ amount: -1 }));
      expect(res.statusCode).toBe(400);
      const body = res.json<{ message: string; fieldErrors?: Record<string, string> }>();
      expect(typeof body.message).toBe('string');
      expect(body.fieldErrors).toBeDefined();
      expect(body.fieldErrors).toHaveProperty('amount');
    });
  });
});
