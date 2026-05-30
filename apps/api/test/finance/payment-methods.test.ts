import { describe, it, expect, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { getTestApp } from '../helpers/app.js';
import { loginAs, type AuthCookies } from '../helpers/auth.js';
import { reseedDb } from '../helpers/db.js';

type PmRow = {
  id: number;
  name: string;
  allowsInflow: boolean;
  allowsOutflow: boolean;
  status: string;
};

// Covers the payment-methods CRUD and the "at least one of inflow/outflow" invariant, enforced
// both by the create-time Zod refine and by the update-time merge guard (PATCH that would clear
// both flags is rejected against the stored values). Plus the permission gate.
describe('payment-methods module', () => {
  let app: FastifyInstance;
  let admin: AuthCookies;
  let congregant: AuthCookies;
  let pmId: number;

  beforeAll(async () => {
    reseedDb();
    app = await getTestApp();
    admin = await loginAs(app, 'admin@email.com', 'admin123');
    congregant = await loginAs(app, 'congregado@email.com', 'congregado123');
  });

  it('creates an inflow-only payment method (201)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/payment-methods',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: { name: 'Pix de Teste', allowsInflow: true, allowsOutflow: false }
    });
    expect(res.statusCode).toBe(201);
    const pm = res.json<PmRow>();
    pmId = pm.id;
    expect(pm).toMatchObject({ allowsInflow: true, allowsOutflow: false, status: 'ativo' });
  });

  it('rejects a method that allows neither inflow nor outflow (400)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/payment-methods',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: { name: 'Inútil', allowsInflow: false, allowsOutflow: false }
    });
    expect(res.statusCode).toBe(400);
  });

  it('reads it back (200) and 404s an unknown id', async () => {
    const get = await app.inject({
      method: 'GET',
      url: `/payment-methods/${pmId}`,
      headers: { cookie: admin.cookie }
    });
    expect(get.statusCode).toBe(200);

    const missing = await app.inject({
      method: 'GET',
      url: '/payment-methods/999999',
      headers: { cookie: admin.cookie }
    });
    expect(missing.statusCode).toBe(404);
  });

  it('renames the method (200) and 404s an unknown id', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/payment-methods/${pmId}`,
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: { name: 'Pix Renomeado' }
    });
    expect(res.statusCode).toBe(200);
    expect(res.json<PmRow>().name).toBe('Pix Renomeado');

    const missing = await app.inject({
      method: 'PATCH',
      url: '/payment-methods/999999',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: { name: 'Inexistente' }
    });
    expect(missing.statusCode).toBe(404);
  });

  it('rejects an update that would clear both flags against the stored values (400)', async () => {
    // The method is currently inflow-only; turning inflow off without enabling outflow
    // merges to "neither", which the service guard rejects.
    const res = await app.inject({
      method: 'PATCH',
      url: `/payment-methods/${pmId}`,
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: { allowsInflow: false }
    });
    expect(res.statusCode).toBe(400);
  });

  it('soft-deletes the method (204)', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/payment-methods/${pmId}`,
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken }
    });
    expect(res.statusCode).toBe(204);
  });

  describe('route gating', () => {
    it('blocks a user without the permission from listing (403)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/payment-methods',
        headers: { cookie: congregant.cookie }
      });
      expect(res.statusCode).toBe(403);
    });

    it('blocks a user without the permission from creating (403)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/payment-methods',
        headers: { cookie: congregant.cookie, 'x-csrf-token': congregant.csrfToken },
        payload: { name: 'Proibido', allowsInflow: true }
      });
      expect(res.statusCode).toBe(403);
    });
  });
});
