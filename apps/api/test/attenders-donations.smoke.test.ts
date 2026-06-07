import { describe, it, expect, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { ne, eq } from 'drizzle-orm';
import { getTestApp } from './helpers/app.js';
import { loginAs, type AuthCookies } from './helpers/auth.js';
import { reseedDb } from './helpers/db.js';
import { db } from '../src/db/index.js';
import { attenders } from '../src/db/schema.js';

// João da Silva is the seeded attender linked to congregado@email.com and has
// confirmed donations across multiple years (see seed-edge-cases.ts).
describe('attenders donations + self-vs-staff RBAC', () => {
  let app: FastifyInstance;
  let congregado: AuthCookies;
  let staff: AuthCookies;
  let selfId: number;
  let otherId: number;

  beforeAll(async () => {
    reseedDb();
    app = await getTestApp();
    congregado = await loginAs(app, 'congregado@email.com', 'congregado123');
    staff = await loginAs(app, 'admin@email.com', 'admin123');

    const [self] = await db
      .select({ id: attenders.id })
      .from(attenders)
      .where(eq(attenders.name, 'João da Silva'));
    expect(self).toBeDefined();
    selfId = self.id;

    const [other] = await db
      .select({ id: attenders.id })
      .from(attenders)
      .where(ne(attenders.id, selfId))
      .limit(1);
    expect(other).toBeDefined();
    otherId = other.id;
  });

  it('lets a congregant read their own donation summary', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/attenders/${selfId}/donations/summary`,
      headers: { cookie: congregado.cookie }
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{
      availableYears: number[];
      months: unknown[];
      grandTotal: string;
    }>();
    // The default year is the most recent with giving, so it must be non-empty.
    expect(body.availableYears.length).toBeGreaterThan(0);
    expect(body.months).toHaveLength(12);
    expect(Number.parseFloat(body.grandTotal)).toBeGreaterThan(0);
  });

  it('lets a congregant read their own record', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/attenders/${selfId}`,
      headers: { cookie: congregado.cookie }
    });
    expect(res.statusCode).toBe(200);
    expect(res.json<{ id: number }>().id).toBe(selfId);
  });

  it("hides another congregant's record from a congregant (404)", async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/attenders/${otherId}`,
      headers: { cookie: congregado.cookie }
    });
    // Unauthorized self-access maps to 404 — we don't confirm the id exists.
    expect(res.statusCode).toBe(404);
  });

  it("forbids a congregant from reading another's donations (403)", async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/attenders/${otherId}/donations/summary`,
      headers: { cookie: congregado.cookie }
    });
    expect(res.statusCode).toBe(403);
  });

  it('lets staff read any congregant record and the roster', async () => {
    const detail = await app.inject({
      method: 'GET',
      url: `/attenders/${otherId}`,
      headers: { cookie: staff.cookie }
    });
    expect(detail.statusCode).toBe(200);

    const list = await app.inject({
      method: 'GET',
      url: '/attenders',
      headers: { cookie: staff.cookie }
    });
    expect(list.statusCode).toBe(200);
  });

  it('blocks the roster list for a congregant (403)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/attenders',
      headers: { cookie: congregado.cookie }
    });
    expect(res.statusCode).toBe(403);
  });
});
