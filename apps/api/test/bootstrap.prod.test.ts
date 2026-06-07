import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { sql as drizzleSql } from 'drizzle-orm';
import { db } from '../src/db/index.js';
import { roles, permissions, modules, users, userModulePermissions } from '../src/db/schema.js';
import { seedProd } from '../src/db/seed.prod.js';
import {
  SEED_ROLES,
  EXPECTED_PERMISSION_ORDER,
  EXPECTED_MODULE_ORDER,
  SEED_PAYMENT_METHODS
} from '../src/db/seed-data.js';
import { ADMIN_ROLE_NAME } from '../src/lib/constants.js';
import { getTestApp } from './helpers/app.js';
import { loginAs } from './helpers/auth.js';
import { reseedDb, emptyDb } from './helpers/db.js';

async function count(table: string): Promise<number> {
  const rows = (await db.execute(
    drizzleSql.raw(`SELECT COUNT(*)::int AS n FROM ${table}`)
  )) as unknown as { n: number }[];
  return rows[0].n;
}

const ADMIN = {
  email: 'bootstrap-admin@email.com',
  password: 'bootstrap-pass-123',
  name: 'Boot Admin'
};

/**
 * Clean-slate / day-one tests. These run against a TRUNCATED database (no dev
 * fixture) so they exercise what a fresh production deploy actually does:
 * `db:migrate` then `db:seed:prod`. The afterAll restores the shared dev seed
 * because test files share one database (vitest fileParallelism: false).
 */
describe('production bootstrap (clean slate)', () => {
  afterAll(() => {
    // Restore the shared fixture for any later test file that relies on it.
    reseedDb();
  });

  describe('structural seed + first admin', () => {
    beforeAll(async () => {
      await emptyDb();
      await seedProd(ADMIN);
    });

    it('inserts the expected structural reference data', async () => {
      expect(await count('roles')).toBe(SEED_ROLES.length);
      expect(await count('permissions')).toBe(EXPECTED_PERMISSION_ORDER.length);
      expect(await count('modules')).toBe(EXPECTED_MODULE_ORDER.length);
      expect(await count('payment_methods')).toBe(SEED_PAYMENT_METHODS.length);
      expect(await count('income_categories')).toBeGreaterThan(0);
      expect(await count('expense_categories')).toBeGreaterThan(0);
      expect(await count('designated_funds')).toBeGreaterThan(0);
      expect(await count('minute_templates')).toBeGreaterThan(0);
    });

    it('seeds finance settings with a zero opening balance', async () => {
      const rows = (await db.execute(
        drizzleSql`SELECT opening_balance FROM finance_settings`
      )) as unknown as { opening_balance: string }[];
      expect(rows).toHaveLength(1);
      expect(rows[0].opening_balance).toBe('0.00');
    });

    it('seeds exactly one church settings singleton', async () => {
      expect(await count('church_settings')).toBe(1);
    });

    it('inserts modules and permissions in the order the shared enum expects', async () => {
      const mods = await db.select({ name: modules.name }).from(modules).orderBy(modules.id);
      expect(mods.map((m) => m.name)).toEqual(EXPECTED_MODULE_ORDER);
      const perms = await db
        .select({ name: permissions.name })
        .from(permissions)
        .orderBy(permissions.id);
      expect(perms.map((p) => p.name)).toEqual(EXPECTED_PERMISSION_ORDER);
    });

    it('creates a single active Administrador with mirrored permissions', async () => {
      const found = await db
        .select({ id: users.id, status: users.status, roleId: users.roleId })
        .from(users)
        .where(eq(users.email, ADMIN.email));
      expect(found).toHaveLength(1);
      expect(found[0].status).toBe('ativo');

      const [adminRole] = await db
        .select({ id: roles.id })
        .from(roles)
        .where(eq(roles.name, ADMIN_ROLE_NAME));
      expect(found[0].roleId).toBe(adminRole.id);

      const perms = await db
        .select({ moduleId: userModulePermissions.moduleId })
        .from(userModulePermissions)
        .where(eq(userModulePermissions.userId, found[0].id));
      expect(perms.length).toBeGreaterThan(0);
    });

    it('refuses to run a second time (one-shot guard)', async () => {
      await expect(seedProd(ADMIN)).rejects.toThrow(/Refusing to seed/);
    });

    describe('the bootstrapped admin can use the system on day one', () => {
      let app: FastifyInstance;

      beforeAll(async () => {
        app = await getTestApp();
      });

      it('logs in and edits church settings (proves the permission wiring)', async () => {
        const admin = await loginAs(app, ADMIN.email, ADMIN.password);

        const res = await app.inject({
          method: 'PUT',
          url: '/church-settings',
          headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
          payload: { name: 'Igreja Bootstrap' }
        });
        expect(res.statusCode).toBe(200);
        expect(res.json<{ name: string }>().name).toBe('Igreja Bootstrap');
      });

      it('approves a self-registered congregant (registration → approval flow)', async () => {
        const admin = await loginAs(app, ADMIN.email, ADMIN.password);

        // Self-registration: no admin needed, lands in `pendente` with no password.
        const csrf = await app.inject({ method: 'GET', url: '/auth/csrf-token' });
        const regToken = csrf.json<{ csrfToken: string }>().csrfToken;
        const setCookie = csrf.headers['set-cookie'];
        const regCookie = (Array.isArray(setCookie) ? setCookie[0] : (setCookie ?? '')).split(
          ';'
        )[0];
        const register = await app.inject({
          method: 'POST',
          url: '/auth/register',
          headers: { cookie: regCookie, 'x-csrf-token': regToken },
          payload: { name: 'Novo Congregado', email: 'novo-congregado@email.com' }
        });
        expect(register.statusCode).toBe(201);

        const [pending] = await db
          .select({ id: users.id, status: users.status })
          .from(users)
          .where(eq(users.email, 'novo-congregado@email.com'));
        expect(pending.status).toBe('pendente');

        // Admin approval flips status → ativo and mirrors role permissions.
        const approve = await app.inject({
          method: 'PATCH',
          url: `/users/${pending.id}/approve`,
          headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken }
        });
        expect(approve.statusCode).toBe(200);

        const [approved] = await db
          .select({ status: users.status })
          .from(users)
          .where(eq(users.id, pending.id));
        expect(approved.status).toBe('ativo');

        const perms = await db
          .select({ moduleId: userModulePermissions.moduleId })
          .from(userModulePermissions)
          .where(eq(userModulePermissions.userId, pending.id));
        expect(perms.length).toBeGreaterThan(0);
      });
    });
  });

  describe('structural seed without admin env', () => {
    beforeAll(async () => {
      await emptyDb();
      await seedProd(undefined);
    });

    it('seeds structural data but creates no users', async () => {
      expect(await count('roles')).toBe(SEED_ROLES.length);
      expect(await count('users')).toBe(0);
    });
  });
});
