import { describe, it, expect, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { getTestApp } from '../helpers/app.js';
import { loginAs, type AuthCookies } from '../helpers/auth.js';
import { reseedDb, clearMonthlyClosings } from '../helpers/db.js';

type IncomeCategoryRow = {
  id: number;
  parentId: number | null;
  name: string;
  description: string | null;
  requiresMember: boolean;
  status: string;
  createdAt: Date;
};

describe('income-categories module', () => {
  let app: FastifyInstance;
  let admin: AuthCookies;
  let congregant: AuthCookies;
  let categoryId: number;
  let parentCategoryId: number;

  beforeAll(async () => {
    reseedDb();
    await clearMonthlyClosings();
    app = await getTestApp();
    admin = await loginAs(app, 'admin@email.com', 'admin123');
    congregant = await loginAs(app, 'congregado@email.com', 'congregado123');
  });

  it('creates a parent income category (201)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/income-categories',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: {
        name: 'Offerings',
        description: 'Member offerings',
        requiresMember: false
      }
    });
    expect(res.statusCode).toBe(201);
    const category = res.json<IncomeCategoryRow>();
    parentCategoryId = category.id;
    expect(category).toMatchObject({
      name: 'Offerings',
      description: 'Member offerings',
      requiresMember: false,
      status: 'ativo',
      parentId: null
    });
  });

  it('creates a child income category with parentId (201)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/income-categories',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: {
        name: 'Weekly Offering',
        description: 'Sunday weekly offering',
        parentId: parentCategoryId,
        requiresMember: true
      }
    });
    expect(res.statusCode).toBe(201);
    const category = res.json<IncomeCategoryRow>();
    categoryId = category.id;
    expect(category).toMatchObject({
      name: 'Weekly Offering',
      description: 'Sunday weekly offering',
      parentId: parentCategoryId,
      requiresMember: true,
      status: 'ativo'
    });
  });

  it('rejects a category name that is too short (400)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/income-categories',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: {
        name: 'X',
        description: 'Too short'
      }
    });
    expect(res.statusCode).toBe(400);
  });

  it('reads it back (200) and 404s an unknown id', async () => {
    const get = await app.inject({
      method: 'GET',
      url: `/income-categories/${categoryId}`,
      headers: { cookie: admin.cookie }
    });
    expect(get.statusCode).toBe(200);
    const category = get.json<IncomeCategoryRow>();
    expect(category.id).toBe(categoryId);

    const missing = await app.inject({
      method: 'GET',
      url: '/income-categories/999999',
      headers: { cookie: admin.cookie }
    });
    expect(missing.statusCode).toBe(404);
  });

  it('lists income categories (200)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/income-categories?limit=50',
      headers: { cookie: admin.cookie }
    });
    expect(res.statusCode).toBe(200);
    const list = res.json<{ data: IncomeCategoryRow[] }>();
    expect(Array.isArray(list.data)).toBe(true);
    expect(list.data.length).toBeGreaterThan(0);
  });

  it('supports search by name (200)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/income-categories?q=Weekly&limit=50',
      headers: { cookie: admin.cookie }
    });
    expect(res.statusCode).toBe(200);
    const list = res.json<{ data: IncomeCategoryRow[] }>();
    expect(list.data.some((c) => c.name.includes('Weekly'))).toBe(true);
  });

  it('updates the category (200) and 404s an unknown id', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/income-categories/${categoryId}`,
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: { name: 'Sunday Offering' }
    });
    expect(res.statusCode).toBe(200);
    const category = res.json<IncomeCategoryRow>();
    expect(category.name).toBe('Sunday Offering');

    const missing = await app.inject({
      method: 'PATCH',
      url: '/income-categories/999999',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: { name: 'Nonexistent' }
    });
    expect(missing.statusCode).toBe(404);
  });

  it('soft-deletes the category (204)', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/income-categories/${categoryId}`,
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken }
    });
    expect(res.statusCode).toBe(204);
  });

  describe('trash & restore', () => {
    it('lists the soft-deleted category only under ?deleted=only, then restores it (200)', async () => {
      const trash = await app.inject({
        method: 'GET',
        url: '/income-categories?limit=200&deleted=only',
        headers: { cookie: admin.cookie }
      });
      expect(
        trash.json<{ data: IncomeCategoryRow[] }>().data.some((r) => r.id === categoryId)
      ).toBe(true);

      const restore = await app.inject({
        method: 'PATCH',
        url: `/income-categories/${categoryId}/restore`,
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken }
      });
      expect(restore.statusCode).toBe(200);

      const live = await app.inject({
        method: 'GET',
        url: '/income-categories?limit=200',
        headers: { cookie: admin.cookie }
      });
      expect(live.json<{ data: IncomeCategoryRow[] }>().data.some((r) => r.id === categoryId)).toBe(
        true
      );

      const missing = await app.inject({
        method: 'PATCH',
        url: '/income-categories/999999/restore',
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken }
      });
      expect(missing.statusCode).toBe(404);
    });
  });

  describe('route gating', () => {
    it('blocks a user without the permission from listing (403)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/income-categories',
        headers: { cookie: congregant.cookie }
      });
      expect(res.statusCode).toBe(403);
    });

    it('blocks a user without the permission from creating (403)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/income-categories',
        headers: { cookie: congregant.cookie, 'x-csrf-token': congregant.csrfToken },
        payload: {
          name: 'Forbidden',
          description: 'This should fail'
        }
      });
      expect(res.statusCode).toBe(403);
    });
  });
});
