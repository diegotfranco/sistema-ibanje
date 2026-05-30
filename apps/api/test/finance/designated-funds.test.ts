import { describe, it, expect, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { getTestApp } from '../helpers/app.js';
import { loginAs, type AuthCookies } from '../helpers/auth.js';
import { reseedDb } from '../helpers/db.js';

type FundRow = { id: number; name: string; status: string; targetAmount: string | null };

// Covers the designated-funds CRUD lifecycle including the soft-delete → status-filter →
// restore round-trip (both delete and restore are gated by Action.Delete) and the permission gate.
describe('designated-funds module', () => {
  let app: FastifyInstance;
  let admin: AuthCookies;
  let congregant: AuthCookies;
  let fundId: number;

  beforeAll(async () => {
    reseedDb();
    app = await getTestApp();
    admin = await loginAs(app, 'admin@email.com', 'admin123');
    congregant = await loginAs(app, 'congregado@email.com', 'congregado123');
  });

  it('creates a designated fund (201)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/designated-funds',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: { name: 'Fundo de Teste', targetAmount: '1500.00', targetDate: '2099-12-31' }
    });
    expect(res.statusCode).toBe(201);
    const fund = res.json<FundRow>();
    fundId = fund.id;
    expect(fund).toMatchObject({
      name: 'Fundo de Teste',
      status: 'ativo',
      targetAmount: '1500.00'
    });
  });

  it('reads it back (200) and 404s an unknown id', async () => {
    const get = await app.inject({
      method: 'GET',
      url: `/designated-funds/${fundId}`,
      headers: { cookie: admin.cookie }
    });
    expect(get.statusCode).toBe(200);

    const missing = await app.inject({
      method: 'GET',
      url: '/designated-funds/999999',
      headers: { cookie: admin.cookie }
    });
    expect(missing.statusCode).toBe(404);
  });

  it('updates the fund (200) and 404s an unknown id', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/designated-funds/${fundId}`,
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: { description: 'meta atualizada' }
    });
    expect(res.statusCode).toBe(200);
    expect(res.json<{ description: string }>().description).toBe('meta atualizada');

    const missing = await app.inject({
      method: 'PATCH',
      url: '/designated-funds/999999',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: { description: 'x' }
    });
    expect(missing.statusCode).toBe(404);
  });

  it('rejects a malformed targetAmount (400)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/designated-funds',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: { name: 'Fundo Inválido', targetAmount: '10.999' }
    });
    expect(res.statusCode).toBe(400);
  });

  it('soft-deletes then restores, reflected by the status filter', async () => {
    const del = await app.inject({
      method: 'DELETE',
      url: `/designated-funds/${fundId}`,
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken }
    });
    expect(del.statusCode).toBe(204);

    const inactive = await app.inject({
      method: 'GET',
      url: '/designated-funds?status=inativo&limit=500',
      headers: { cookie: admin.cookie }
    });
    expect(inactive.json<{ data: FundRow[] }>().data.some((f) => f.id === fundId)).toBe(true);

    const active = await app.inject({
      method: 'GET',
      url: '/designated-funds?status=ativo&limit=500',
      headers: { cookie: admin.cookie }
    });
    expect(active.json<{ data: FundRow[] }>().data.some((f) => f.id === fundId)).toBe(false);

    const restore = await app.inject({
      method: 'PATCH',
      url: `/designated-funds/${fundId}/restore`,
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken }
    });
    expect(restore.statusCode).toBe(200);
    expect(restore.json<FundRow>().status).toBe('ativo');
  });

  it('404s when restoring an unknown fund', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/designated-funds/999999/restore',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken }
    });
    expect(res.statusCode).toBe(404);
  });

  describe('route gating', () => {
    it('blocks a user without the permission from listing (403)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/designated-funds',
        headers: { cookie: congregant.cookie }
      });
      expect(res.statusCode).toBe(403);
    });

    it('blocks a user without the permission from creating (403)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/designated-funds',
        headers: { cookie: congregant.cookie, 'x-csrf-token': congregant.csrfToken },
        payload: { name: 'Fundo Proibido' }
      });
      expect(res.statusCode).toBe(403);
    });
  });
});
