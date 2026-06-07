import { describe, it, expect, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import * as argon2 from 'argon2';
import { getTestApp } from './helpers/app.js';
import { loginAs, type AuthCookies } from './helpers/auth.js';
import { reseedDb } from './helpers/db.js';
import { db } from '../src/db/index.js';
import { env } from '../src/config/env.js';
import {
  users,
  roles,
  attenders,
  incomeEntries,
  incomeCategories,
  paymentMethods
} from '../src/db/schema.js';

// LGPD art.6 (security) + access control over personal data: a titular sees only their OWN
// records; nobody else's giving history leaks. The self-vs-staff guard for donations lives in the
// SERVICE layer (`assertDonationsAccess` in attenders/service.ts), not in a route preHandler — so a
// future endpoint that forgets to call it would silently expose one member's donations to another,
// with no other safety net. These tests lock that guarantee: two real congregants, each with their
// own attender + a confirmed donation, must not be able to read each other's data, on the JSON
// endpoints AND the PDF export (the easiest place to forget the guard).
//
// Donations are placed in an isolated period (attributionMonth 209903 → "2099-03"), far from any
// seeded fixture giving, so each titular's yearly total is deterministic regardless of seed drift.
const ISO_MONTH = 209903;
const ISO_YEAR = 2099;
const ISO_MONTH_KEY = '2099-03';
const ISO_DATE = '2099-03-15';

const AMOUNT_A = '111.00';
const AMOUNT_B = '222.00';

// Titular B: a fresh congregant we create directly so the test owns both sides of the boundary.
const B_EMAIL = 'b.lgpd@email.com';
const B_PASSWORD = 'titularB-123';

async function insertDonation(attenderId: number, userId: number, amount: string) {
  const [cat] = await db.select({ id: incomeCategories.id }).from(incomeCategories).limit(1);
  const [pm] = await db.select({ id: paymentMethods.id }).from(paymentMethods).limit(1);
  await db.insert(incomeEntries).values({
    referenceDate: ISO_DATE,
    depositDate: ISO_DATE,
    attributionMonth: ISO_MONTH,
    amount,
    categoryId: cat.id,
    attenderId,
    paymentMethodId: pm.id,
    status: 'paga',
    userId
  });
}

describe('LGPD: cross-titular access isolation (donations + roster)', () => {
  let app: FastifyInstance;
  let titularA: AuthCookies; // seeded congregant (congregado@email.com ↔ "João da Silva")
  let titularB: AuthCookies;
  let attenderAId: number;
  let attenderBId: number;

  beforeAll(async () => {
    reseedDb();
    app = await getTestApp();

    // Reference users/roles/categories created by the seed.
    const [adminUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, 'admin@email.com'));
    const [congregadoRole] = await db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.name, 'Congregado'));

    // Titular A = the seeded congregant, already linked to attender "João da Silva".
    const [attA] = await db
      .select({ id: attenders.id })
      .from(attenders)
      .where(eq(attenders.name, 'João da Silva'));
    attenderAId = attA.id;
    await insertDonation(attenderAId, adminUser.id, AMOUNT_A);

    // Titular B = a fresh congregant with their own attender + donation. No module permissions are
    // needed: self-access to one's own donations short-circuits before any permission check, and
    // lacking IncomeEntries access is exactly what must yield 403 when reaching for someone else's.
    const passwordHash = await argon2.hash(B_PASSWORD + env.ARGON2_PEPPER, {
      type: argon2.argon2id
    });
    const [userB] = await db
      .insert(users)
      .values({
        name: 'Titular B LGPD',
        email: B_EMAIL,
        passwordHash,
        roleId: congregadoRole.id,
        status: 'ativo'
      })
      .returning({ id: users.id });
    const [attB] = await db
      .insert(attenders)
      .values({
        name: 'Maria Teste LGPD',
        userId: userB.id,
        isMember: true,
        status: 'ativo'
      })
      .returning({ id: attenders.id });
    attenderBId = attB.id;
    await insertDonation(attenderBId, adminUser.id, AMOUNT_B);

    titularA = await loginAs(app, 'congregado@email.com', 'congregado123');
    titularB = await loginAs(app, B_EMAIL, B_PASSWORD);
  });

  describe('a titular reads only their OWN donations (right of access)', () => {
    it('A sees their own yearly donation total', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/attenders/${attenderAId}/donations/summary?year=${ISO_YEAR}`,
        headers: { cookie: titularA.cookie }
      });
      expect(res.statusCode).toBe(200);
      expect(res.json<{ grandTotal: string }>().grandTotal).toBe(AMOUNT_A);
    });

    it("A's own monthly entries are accessible", async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/attenders/${attenderAId}/donations/entries?month=${ISO_MONTH_KEY}`,
        headers: { cookie: titularA.cookie }
      });
      expect(res.statusCode).toBe(200);
      expect(res.json<{ total: string }>().total).toBe(AMOUNT_A);
    });

    it("A's own donations PDF renders", async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/attenders/${attenderAId}/donations/pdf?year=${ISO_YEAR}`,
        headers: { cookie: titularA.cookie }
      });
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('application/pdf');
    });
  });

  describe("a titular cannot reach another titular's donations (403, no PII)", () => {
    it("A is blocked from B's donations summary", async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/attenders/${attenderBId}/donations/summary?year=${ISO_YEAR}`,
        headers: { cookie: titularA.cookie }
      });
      expect(res.statusCode).toBe(403);
      expect(res.body).not.toContain(AMOUNT_B);
    });

    it("A is blocked from B's monthly entries", async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/attenders/${attenderBId}/donations/entries?month=${ISO_MONTH_KEY}`,
        headers: { cookie: titularA.cookie }
      });
      expect(res.statusCode).toBe(403);
      expect(res.body).not.toContain(AMOUNT_B);
    });

    it("A is blocked from B's donations PDF (the guard reaches the export path too)", async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/attenders/${attenderBId}/donations/pdf?year=${ISO_YEAR}`,
        headers: { cookie: titularA.cookie }
      });
      expect(res.statusCode).toBe(403);
      expect(res.headers['content-type']).not.toContain('application/pdf');
    });

    it('the boundary holds symmetrically: B is blocked from A', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/attenders/${attenderAId}/donations/summary?year=${ISO_YEAR}`,
        headers: { cookie: titularB.cookie }
      });
      expect(res.statusCode).toBe(403);
      expect(res.body).not.toContain(AMOUNT_A);
    });
  });

  describe('a titular cannot pull the whole roster (no bulk PII access)', () => {
    it('listing every congregant is forbidden (lacks Relatórios)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/attenders',
        headers: { cookie: titularA.cookie }
      });
      expect(res.statusCode).toBe(403);
    });

    it('exporting the roster PDF is forbidden', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/attenders/export/pdf',
        headers: { cookie: titularA.cookie }
      });
      expect(res.statusCode).toBe(403);
      expect(res.headers['content-type']).not.toContain('application/pdf');
    });
  });
});
