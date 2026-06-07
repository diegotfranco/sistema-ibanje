import { describe, it, expect, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { getTestApp } from '../helpers/app.js';
import { loginAs, type AuthCookies } from '../helpers/auth.js';
import { reseedDb, clearMonthlyClosings } from '../helpers/db.js';

type ExpenseCategoryRow = {
  id: number;
  parentId: number | null;
  name: string;
  description: string | null;
  status: string;
  createdAt: Date;
};

describe('expense-categories module', () => {
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

  it('creates a parent expense category (201)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/expense-categories',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: {
        name: 'Utilities',
        description: 'Monthly utility bills'
      }
    });
    expect(res.statusCode).toBe(201);
    const category = res.json<ExpenseCategoryRow>();
    parentCategoryId = category.id;
    expect(category).toMatchObject({
      name: 'Utilities',
      description: 'Monthly utility bills',
      status: 'ativo',
      parentId: null
    });
  });

  it('creates a child expense category with parentId (201)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/expense-categories',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: {
        name: 'Water',
        description: 'Water bill',
        parentId: parentCategoryId
      }
    });
    expect(res.statusCode).toBe(201);
    const category = res.json<ExpenseCategoryRow>();
    categoryId = category.id;
    expect(category).toMatchObject({
      name: 'Water',
      description: 'Water bill',
      parentId: parentCategoryId,
      status: 'ativo'
    });
  });

  it('rejects a category name that is too short (400)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/expense-categories',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: {
        name: 'A',
        description: 'Too short'
      }
    });
    expect(res.statusCode).toBe(400);
  });

  it('reads it back (200) and 404s an unknown id', async () => {
    const get = await app.inject({
      method: 'GET',
      url: `/expense-categories/${categoryId}`,
      headers: { cookie: admin.cookie }
    });
    expect(get.statusCode).toBe(200);
    const category = get.json<ExpenseCategoryRow>();
    expect(category.id).toBe(categoryId);

    const missing = await app.inject({
      method: 'GET',
      url: '/expense-categories/999999',
      headers: { cookie: admin.cookie }
    });
    expect(missing.statusCode).toBe(404);
  });

  it('lists expense categories (200)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/expense-categories?limit=50',
      headers: { cookie: admin.cookie }
    });
    expect(res.statusCode).toBe(200);
    const list = res.json<{ data: ExpenseCategoryRow[] }>();
    expect(Array.isArray(list.data)).toBe(true);
    expect(list.data.length).toBeGreaterThan(0);
  });

  it('supports search by name (200)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/expense-categories?q=Water&limit=50',
      headers: { cookie: admin.cookie }
    });
    expect(res.statusCode).toBe(200);
    const list = res.json<{ data: ExpenseCategoryRow[] }>();
    expect(list.data.some((c) => c.name.includes('Water'))).toBe(true);
  });

  it('renames the category (200) and 404s an unknown id', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/expense-categories/${categoryId}`,
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: { name: 'Water Supply' }
    });
    expect(res.statusCode).toBe(200);
    const category = res.json<ExpenseCategoryRow>();
    expect(category.name).toBe('Water Supply');

    const missing = await app.inject({
      method: 'PATCH',
      url: '/expense-categories/999999',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: { name: 'Nonexistent' }
    });
    expect(missing.statusCode).toBe(404);
  });

  it('soft-deletes the category (204)', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/expense-categories/${categoryId}`,
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken }
    });
    expect(res.statusCode).toBe(204);
  });

  describe('route gating', () => {
    it('blocks a user without the permission from listing (403)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/expense-categories',
        headers: { cookie: congregant.cookie }
      });
      expect(res.statusCode).toBe(403);
    });

    it('blocks a user without the permission from creating (403)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/expense-categories',
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
