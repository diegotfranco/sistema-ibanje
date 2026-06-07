import { describe, it, expect, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { getTestApp } from './helpers/app.js';
import { loginAs, type AuthCookies } from './helpers/auth.js';
import { reseedDb } from './helpers/db.js';

type UserRow = { id: number; name: string; email: string; roleId: number; status: string };

// Exercises the self-service rules documented in CLAUDE.md (self can edit name/email but not role;
// can't self-deactivate; password rules; can't edit own permissions) plus the non-self RBAC gate.
describe('users self-service rules', () => {
  let app: FastifyInstance;
  let admin: AuthCookies;
  let congregant: AuthCookies;
  let adminId: number;
  let adminRoleId: number;
  let congregantId: number;

  beforeAll(async () => {
    reseedDb();
    app = await getTestApp();
    admin = await loginAs(app, 'admin@email.com', 'admin123');
    congregant = await loginAs(app, 'congregado@email.com', 'congregado123');

    const list = await app.inject({
      method: 'GET',
      url: '/users?limit=100',
      headers: { cookie: admin.cookie }
    });
    const users = list.json<{ data: UserRow[] }>().data;
    const adminRow = users.find((u) => u.email === 'admin@email.com')!;
    const congRow = users.find((u) => u.email === 'congregado@email.com')!;
    adminId = adminRow.id;
    adminRoleId = adminRow.roleId;
    congregantId = congRow.id;
  });

  it('lets a user edit their own name', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/users/${congregantId}`,
      headers: { cookie: congregant.cookie, 'x-csrf-token': congregant.csrfToken },
      payload: { name: 'Congregado Renomeado' }
    });
    expect(res.statusCode).toBe(200);
    expect(res.json<{ name: string }>().name).toBe('Congregado Renomeado');
  });

  it('blocks a user from changing their own role', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/users/${congregantId}`,
      headers: { cookie: congregant.cookie, 'x-csrf-token': congregant.csrfToken },
      payload: { roleId: adminRoleId }
    });
    expect(res.statusCode).toBe(403);
  });

  it('blocks a user without Editar from editing another user', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/users/${adminId}`,
      headers: { cookie: congregant.cookie, 'x-csrf-token': congregant.csrfToken },
      payload: { name: 'Hacked Admin' }
    });
    expect(res.statusCode).toBe(403);
  });

  it('blocks deactivating your own account', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/users/${adminId}`,
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken }
    });
    expect(res.statusCode).toBe(400);
  });

  it('blocks editing your own permissions', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/users/${adminId}/permissions`,
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: { permissions: {} }
    });
    expect(res.statusCode).toBe(403);
  });

  it('rejects approving a user that is not pending', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/users/${congregantId}/approve`,
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken }
    });
    expect(res.statusCode).toBe(400);
  });

  describe('password changes', () => {
    it('requires currentPassword when changing your own password', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/users/${congregantId}/password`,
        headers: { cookie: congregant.cookie, 'x-csrf-token': congregant.csrfToken },
        payload: { newPassword: 'brandNewPass123' }
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects a wrong currentPassword', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/users/${congregantId}/password`,
        headers: { cookie: congregant.cookie, 'x-csrf-token': congregant.csrfToken },
        payload: { currentPassword: 'wrongwrong', newPassword: 'brandNewPass123' }
      });
      expect(res.statusCode).toBe(400);
    });

    it('accepts the correct currentPassword for self', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/users/${congregantId}/password`,
        headers: { cookie: congregant.cookie, 'x-csrf-token': congregant.csrfToken },
        payload: { currentPassword: 'congregado123', newPassword: 'brandNewPass123' }
      });
      expect(res.statusCode).toBe(204);
    });

    it('lets an admin reset another user password without currentPassword', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/users/${congregantId}/password`,
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
        payload: { newPassword: 'adminSetPass123' }
      });
      expect(res.statusCode).toBe(204);
    });
  });

  // Regression: POST /users with an email that already exists must degrade to a 409 carrying
  // fieldErrors.email — never a 500 (the unique-violation 23505 is caught and remapped in the service).
  describe('duplicate email on create', () => {
    it('returns 409 with fieldErrors.email, not 500', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/users',
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
        payload: { name: 'Duplicado', email: 'admin@email.com', roleId: adminRoleId }
      });
      expect(res.statusCode).toBe(409);
      const body = res.json<{ message: string; fieldErrors?: Record<string, string> }>();
      expect(body.fieldErrors).toHaveProperty('email');
    });
  });
});
