import { describe, it, expect, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { getTestApp } from '../helpers/app.js';
import { loginAs, type AuthCookies } from '../helpers/auth.js';
import { reseedDb } from '../helpers/db.js';

type CampaignRow = { id: number; name: string; status: string; targetAmount: string | null };

// Covers the campaigns CRUD lifecycle including the soft-delete → restore round-trip via
// `deleted_at` (both delete and restore are gated by Action.Delete) and the permission gate.
describe('campaigns module', () => {
  let app: FastifyInstance;
  let admin: AuthCookies;
  let congregant: AuthCookies;
  let campaignId: number;

  beforeAll(async () => {
    reseedDb();
    app = await getTestApp();
    admin = await loginAs(app, 'admin@email.com', 'admin123');
    congregant = await loginAs(app, 'congregado@email.com', 'congregado123');
  });

  it('creates a campaign (201)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/campaigns',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: { name: 'Campaigno de Teste', targetAmount: '1500.00', targetDate: '2099-12-31' }
    });
    expect(res.statusCode).toBe(201);
    const campaign = res.json<CampaignRow>();
    campaignId = campaign.id;
    expect(campaign).toMatchObject({
      name: 'Campaigno de Teste',
      status: 'ativa',
      targetAmount: '1500.00'
    });
  });

  it('reads it back (200) and 404s an unknown id', async () => {
    const get = await app.inject({
      method: 'GET',
      url: `/campaigns/${campaignId}`,
      headers: { cookie: admin.cookie }
    });
    expect(get.statusCode).toBe(200);

    const missing = await app.inject({
      method: 'GET',
      url: '/campaigns/999999',
      headers: { cookie: admin.cookie }
    });
    expect(missing.statusCode).toBe(404);
  });

  it('updates the campaign (200) and 404s an unknown id', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/campaigns/${campaignId}`,
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: { description: 'meta atualizada' }
    });
    expect(res.statusCode).toBe(200);
    expect(res.json<{ description: string }>().description).toBe('meta atualizada');

    const missing = await app.inject({
      method: 'PATCH',
      url: '/campaigns/999999',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: { description: 'x' }
    });
    expect(missing.statusCode).toBe(404);
  });

  it('rejects a malformed targetAmount (400)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/campaigns',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: { name: 'Campaigno Inválido', targetAmount: '10.999' }
    });
    expect(res.statusCode).toBe(400);
  });

  it('soft-deletes then restores via deleted_at, reflected by list visibility', async () => {
    const del = await app.inject({
      method: 'DELETE',
      url: `/campaigns/${campaignId}`,
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken }
    });
    expect(del.statusCode).toBe(204);

    // A soft-deleted campaign disappears from the list entirely (no status filter brings it back)
    // and is no longer fetchable by id.
    const listed = await app.inject({
      method: 'GET',
      url: '/campaigns?limit=500',
      headers: { cookie: admin.cookie }
    });
    expect(listed.json<{ data: CampaignRow[] }>().data.some((f) => f.id === campaignId)).toBe(
      false
    );

    const getDeleted = await app.inject({
      method: 'GET',
      url: `/campaigns/${campaignId}`,
      headers: { cookie: admin.cookie }
    });
    expect(getDeleted.statusCode).toBe(404);

    // Restore clears deleted_at; the campaign becomes visible and fetchable again.
    const restore = await app.inject({
      method: 'PATCH',
      url: `/campaigns/${campaignId}/restore`,
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken }
    });
    expect(restore.statusCode).toBe(200);

    const listedAgain = await app.inject({
      method: 'GET',
      url: '/campaigns?limit=500',
      headers: { cookie: admin.cookie }
    });
    expect(listedAgain.json<{ data: CampaignRow[] }>().data.some((f) => f.id === campaignId)).toBe(
      true
    );
  });

  it('404s when restoring an unknown campaign', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/campaigns/999999/restore',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken }
    });
    expect(res.statusCode).toBe(404);
  });

  // Campaign lifecycle — orthogonal to delete/restore. encerrar/reabrir flip campaignStatus.
  it('encerra and reabre a campaign, flipping campaignStatus (ativa ↔ encerrada)', async () => {
    const encerrar = await app.inject({
      method: 'PATCH',
      url: `/campaigns/${campaignId}/encerrar`,
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken }
    });
    expect(encerrar.statusCode).toBe(200);
    expect(encerrar.json<CampaignRow>().status).toBe('encerrada');

    // It stays listed (encerrada ≠ deleted) and is filterable by status.
    const ended = await app.inject({
      method: 'GET',
      url: '/campaigns?status=encerrada&limit=500',
      headers: { cookie: admin.cookie }
    });
    expect(ended.json<{ data: CampaignRow[] }>().data.some((f) => f.id === campaignId)).toBe(true);

    // Encerrar again is a no-op conflict.
    const again = await app.inject({
      method: 'PATCH',
      url: `/campaigns/${campaignId}/encerrar`,
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken }
    });
    expect(again.statusCode).toBe(409);

    const reabrir = await app.inject({
      method: 'PATCH',
      url: `/campaigns/${campaignId}/reabrir`,
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken }
    });
    expect(reabrir.statusCode).toBe(200);
    expect(reabrir.json<CampaignRow>().status).toBe('ativa');
  });

  describe('route gating', () => {
    it('blocks a user without the permission from listing (403)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/campaigns',
        headers: { cookie: congregant.cookie }
      });
      expect(res.statusCode).toBe(403);
    });

    it('blocks a user without the permission from creating (403)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/campaigns',
        headers: { cookie: congregant.cookie, 'x-csrf-token': congregant.csrfToken },
        payload: { name: 'Campaigno Proibido' }
      });
      expect(res.statusCode).toBe(403);
    });
  });
});
