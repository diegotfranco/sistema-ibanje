import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { getTestApp } from './helpers/app.js';
import { loginAs, type AuthCookies } from './helpers/auth.js';
import { reseedDb } from './helpers/db.js';
import { db } from '../src/db/index.js';
import { auditLog } from '../src/db/schema.js';

// Unique to this suite so assertions are immune to audit rows written by other test files that
// share the same database (every mutation in the suite fires `logAudit`).
const ENTITY = 'audit_test_entity';

type AuditRow = {
  id: number;
  action: string;
  entityType: string;
  entityId: number | null;
  userId: number | null;
  notes: string | null;
  changes: Record<string, { from: unknown; to: unknown }> | null;
};
type Page = { data: AuditRow[]; total: number; page: number; limit: number; totalPages: number };

describe('GET /audit', () => {
  let app: FastifyInstance;
  let admin: AuthCookies;
  let membro: AuthCookies;

  beforeAll(async () => {
    reseedDb();
    app = await getTestApp();
    admin = await loginAs(app, 'admin@email.com', 'admin123');
    membro = await loginAs(app, 'membro@email.com', 'membro123');

    // Seed deterministic rows (userId null → no FK dependency on a specific seed id).
    await db.insert(auditLog).values([
      {
        userId: null,
        action: 'create',
        entityType: ENTITY,
        entityId: 1,
        notes: 'first',
        createdAt: new Date('2099-01-10T12:00:00.000Z')
      },
      {
        userId: null,
        action: 'update',
        entityType: ENTITY,
        entityId: 1,
        notes: 'second',
        changes: { phone: { from: '111', to: '222' } },
        createdAt: new Date('2099-02-20T12:00:00.000Z')
      },
      {
        userId: null,
        action: 'state_change',
        entityType: ENTITY,
        entityId: 2,
        notes: 'third',
        createdAt: new Date('2099-03-30T12:00:00.000Z')
      }
    ]);
  });

  afterAll(async () => {
    await db.delete(auditLog).where(eq(auditLog.entityType, ENTITY));
  });

  function get(auth: AuthCookies, query = '') {
    return app.inject({ method: 'GET', url: `/audit${query}`, headers: { cookie: auth.cookie } });
  }

  it('forbids a user without Auditoria.View (403)', async () => {
    const res = await get(membro, `?entityType=${ENTITY}`);
    expect(res.statusCode).toBe(403);
  });

  it('returns the paginated trail to an admin, newest first', async () => {
    const res = await get(admin, `?entityType=${ENTITY}`);
    expect(res.statusCode).toBe(200);
    const body = res.json<Page>();
    expect(body.total).toBe(3);
    // Ordered by createdAt desc → the March (state_change) row leads.
    expect(body.data[0].action).toBe('state_change');
    expect(body.data[2].action).toBe('create');
  });

  it('filters by action', async () => {
    const res = await get(admin, `?entityType=${ENTITY}&action=update`);
    const body = res.json<Page>();
    expect(body.total).toBe(1);
    expect(body.data[0].notes).toBe('second');
    // The field-level diff round-trips through the read path.
    expect(body.data[0].changes).toEqual({ phone: { from: '111', to: '222' } });
  });

  it('returns null changes for rows without a recorded diff', async () => {
    const res = await get(admin, `?entityType=${ENTITY}&action=create`);
    const body = res.json<Page>();
    expect(body.data[0].changes).toBeNull();
  });

  it('filters by an inclusive date range', async () => {
    // Window covers only the February row.
    const res = await get(admin, `?entityType=${ENTITY}&from=2099-02-01&to=2099-02-28`);
    const body = res.json<Page>();
    expect(body.total).toBe(1);
    expect(body.data[0].action).toBe('update');
  });

  it('caps the page size at the Zod boundary', async () => {
    const res = await get(admin, `?entityType=${ENTITY}&limit=999`);
    expect(res.statusCode).toBe(400);
  });

  it('requires authentication (401)', async () => {
    const res = await app.inject({ method: 'GET', url: `/audit?entityType=${ENTITY}` });
    expect(res.statusCode).toBe(401);
  });
});
