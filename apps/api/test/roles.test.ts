import { describe, it, expect, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { getTestApp } from './helpers/app.js';
import { loginAs, type AuthCookies } from './helpers/auth.js';
import { reseedDb } from './helpers/db.js';

type RoleRow = { id: number; name: string; description: string | null; status: string };
type RefRow = { id: number; name: string };
type PermRow = { moduleId: number; permissionId: number; permissionName: string };

// Covers the roles module: CRUD, the "role still has users" deactivation guard, the
// permission replace/read round-trip, and the route-gate split (CRUD is gated by Module.Roles
// while getById / getPermissions / modules / permission-types are auth-only).
describe('roles module', () => {
  let app: FastifyInstance;
  let admin: AuthCookies;
  let congregant: AuthCookies;
  let adminRoleId: number;
  let moduleId: number;
  let permissionId: number;
  let createdRoleId: number;
  // The base member floor (Acessar on Painel/Congregados/Atas) is merged into every role's
  // permission set at write time, so reads always include it on top of the explicit entries.
  const BASE_MODULE_NAMES = ['Painel', 'Congregados', 'Atas'];
  let baseModuleIds: number[];
  let accessId: number;

  beforeAll(async () => {
    reseedDb();
    app = await getTestApp();
    admin = await loginAs(app, 'admin@email.com', 'admin123');
    congregant = await loginAs(app, 'membro@email.com', 'membro123');

    const me = await app.inject({
      method: 'GET',
      url: '/users?limit=100',
      headers: { cookie: admin.cookie }
    });
    const admins = me.json<{ data: { email: string; roleId: number }[] }>().data;
    adminRoleId = admins.find((u) => u.email === 'admin@email.com')!.roleId;

    const mods = await app.inject({
      method: 'GET',
      url: '/modules',
      headers: { cookie: admin.cookie }
    });
    const modRows = mods.json<RefRow[]>();
    baseModuleIds = modRows.filter((m) => BASE_MODULE_NAMES.includes(m.name)).map((m) => m.id);
    // Use a NON-base module so the explicit entry is always distinct from the base floor.
    moduleId = modRows.find((m) => !BASE_MODULE_NAMES.includes(m.name))!.id;
    const perms = await app.inject({
      method: 'GET',
      url: '/permission-types',
      headers: { cookie: admin.cookie }
    });
    const permRows = perms.json<RefRow[]>();
    permissionId = permRows[0].id;
    accessId = permRows.find((p) => p.name === 'Acessar')!.id;
  });

  it('lists roles for an admin', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/roles',
      headers: { cookie: admin.cookie }
    });
    expect(res.statusCode).toBe(200);
    expect(res.json<{ data: RoleRow[] }>().data.length).toBeGreaterThan(0);
  });

  it('creates a role (201) and can read it back', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/roles',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: { name: 'Cargo de Teste', description: 'temporário' }
    });
    expect(res.statusCode).toBe(201);
    createdRoleId = res.json<RoleRow>().id;

    const get = await app.inject({
      method: 'GET',
      url: `/roles/${createdRoleId}`,
      headers: { cookie: admin.cookie }
    });
    expect(get.statusCode).toBe(200);
    expect(get.json<RoleRow>().name).toBe('Cargo de Teste');
  });

  it('returns 404 for an unknown role', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/roles/999999',
      headers: { cookie: admin.cookie }
    });
    expect(res.statusCode).toBe(404);
  });

  it('updates a role (200)', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/roles/${createdRoleId}`,
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: { description: 'renomeado' }
    });
    expect(res.statusCode).toBe(200);
    expect(res.json<RoleRow>().description).toBe('renomeado');
  });

  it('returns 404 when updating an unknown role', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/roles/999999',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: { description: 'x' }
    });
    expect(res.statusCode).toBe(404);
  });

  it('replaces a role permission set and reads it back', async () => {
    const put = await app.inject({
      method: 'PUT',
      url: `/roles/${createdRoleId}/permissions`,
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: { permissions: [{ moduleId, permissionId }] }
    });
    expect(put.statusCode).toBe(204);

    const get = await app.inject({
      method: 'GET',
      url: `/roles/${createdRoleId}/permissions`,
      headers: { cookie: admin.cookie }
    });
    expect(get.statusCode).toBe(200);
    const rows = get.json<PermRow[]>();
    // Explicit entry + the always-merged base floor (Acessar on Painel/Congregados/Atas).
    expect(rows).toHaveLength(baseModuleIds.length + 1);
    expect(rows).toContainEqual(expect.objectContaining({ moduleId, permissionId }));
    for (const bm of baseModuleIds) {
      expect(rows).toContainEqual(
        expect.objectContaining({ moduleId: bm, permissionId: accessId })
      );
    }

    // Empty array clears the explicit entries but the base floor remains.
    const clear = await app.inject({
      method: 'PUT',
      url: `/roles/${createdRoleId}/permissions`,
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: { permissions: [] }
    });
    expect(clear.statusCode).toBe(204);
    const after = await app.inject({
      method: 'GET',
      url: `/roles/${createdRoleId}/permissions`,
      headers: { cookie: admin.cookie }
    });
    const afterRows = after.json<PermRow[]>();
    expect(afterRows).toHaveLength(baseModuleIds.length);
    expect(afterRows).not.toContainEqual(expect.objectContaining({ moduleId, permissionId }));
  });

  it('returns 404 when setting permissions on an unknown role', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/roles/999999/permissions',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: { permissions: [] }
    });
    expect(res.statusCode).toBe(404);
  });

  it('refuses to deactivate a role that still has users (409)', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/roles/${adminRoleId}`,
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken }
    });
    expect(res.statusCode).toBe(409);
  });

  it('soft-deletes an unused role (204)', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/roles/${createdRoleId}`,
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken }
    });
    expect(res.statusCode).toBe(204);
  });

  describe('trash & restore', () => {
    it('lists the soft-deleted role only under ?deleted=only', async () => {
      const live = await app.inject({
        method: 'GET',
        url: '/roles?limit=100',
        headers: { cookie: admin.cookie }
      });
      expect(live.json<{ data: RoleRow[] }>().data.some((r) => r.id === createdRoleId)).toBe(false);

      const trash = await app.inject({
        method: 'GET',
        url: '/roles?limit=100&deleted=only',
        headers: { cookie: admin.cookie }
      });
      expect(trash.json<{ data: RoleRow[] }>().data.some((r) => r.id === createdRoleId)).toBe(true);
    });

    it('restores the role (200) and 404s an unknown id', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/roles/${createdRoleId}/restore`,
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken }
      });
      expect(res.statusCode).toBe(200);

      const live = await app.inject({
        method: 'GET',
        url: '/roles?limit=100',
        headers: { cookie: admin.cookie }
      });
      expect(live.json<{ data: RoleRow[] }>().data.some((r) => r.id === createdRoleId)).toBe(true);

      const missing = await app.inject({
        method: 'PATCH',
        url: '/roles/999999/restore',
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken }
      });
      expect(missing.statusCode).toBe(404);
    });
  });

  describe('route gating', () => {
    it('blocks a user without Roles permission from listing (403)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/roles',
        headers: { cookie: congregant.cookie }
      });
      expect(res.statusCode).toBe(403);
    });

    it('blocks a user without Roles permission from creating (403)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/roles',
        headers: { cookie: congregant.cookie, 'x-csrf-token': congregant.csrfToken },
        payload: { name: 'Hacker Role' }
      });
      expect(res.statusCode).toBe(403);
    });

    it('allows any authenticated user to read the module catalog (auth-only route)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/modules',
        headers: { cookie: congregant.cookie }
      });
      expect(res.statusCode).toBe(200);
    });
  });
});
