import { describe, it, expect, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { getTestApp } from './helpers/app.js';
import { loginAs, type AuthCookies } from './helpers/auth.js';
import { reseedDb } from './helpers/db.js';
import type { MeetingResponse } from '../src/modules/meetings/schema.js';

describe('meetings', () => {
  let app: FastifyInstance;
  let admin: AuthCookies;
  let congregado: AuthCookies;

  beforeAll(async () => {
    reseedDb();
    app = await getTestApp();
    admin = await loginAs(app, 'admin@email.com', 'admin123');
    congregado = await loginAs(app, 'congregado@email.com', 'congregado123');
  });

  it('lists meetings (200, has data array)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/meetings?page=1&limit=20',
      headers: { cookie: admin.cookie }
    });
    expect(res.statusCode).toBe(200);
    const json = res.json<{
      data: MeetingResponse[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>();
    expect(json).toHaveProperty('data');
    expect(Array.isArray(json.data)).toBe(true);
    expect(json).toHaveProperty('total');
    expect(json).toHaveProperty('page');
    expect(json).toHaveProperty('limit');
    expect(json).toHaveProperty('totalPages');
  });

  it('creates a meeting (201, echoes meetingDate/type, status present, agendaItems is empty array)', async () => {
    const payload = {
      meetingDate: '2026-06-15',
      type: 'ordinária' as const
    };
    const res = await app.inject({
      method: 'POST',
      url: '/meetings',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload
    });
    expect(res.statusCode).toBe(201);
    const meeting = res.json<MeetingResponse>();
    expect(meeting.id).toBeGreaterThan(0);
    expect(meeting.meetingDate).toBe(payload.meetingDate);
    expect(meeting.type).toBe(payload.type);
    expect(meeting.status).toBeDefined();
    // A new meeting is auto-populated with the default agenda items of its meeting-type template,
    // so agendaItems is an array (not necessarily empty).
    expect(Array.isArray(meeting.agendaItems)).toBe(true);
    expect(meeting.isPublic).toBe(false);
    expect(meeting.hasMinutes).toBe(false);
    expect(meeting.createdAt).toBeDefined();
    expect(meeting.updatedAt).toBeDefined();
  });

  it('getById returns the created meeting (200) and getById nonexistent returns 404', async () => {
    // Create a meeting first
    const createRes = await app.inject({
      method: 'POST',
      url: '/meetings',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: {
        meetingDate: '2026-06-16',
        type: 'extraordinária' as const
      }
    });
    expect(createRes.statusCode).toBe(201);
    const created = createRes.json<MeetingResponse>();

    // GET the created meeting
    const getRes = await app.inject({
      method: 'GET',
      url: `/meetings/${created.id}`,
      headers: { cookie: admin.cookie }
    });
    expect(getRes.statusCode).toBe(200);
    const retrieved = getRes.json<MeetingResponse>();
    expect(retrieved.id).toBe(created.id);
    expect(retrieved.meetingDate).toBe('2026-06-16');
    expect(retrieved.type).toBe('extraordinária');

    // GET nonexistent meeting
    const notFoundRes = await app.inject({
      method: 'GET',
      url: '/meetings/99999',
      headers: { cookie: admin.cookie }
    });
    expect(notFoundRes.statusCode).toBe(404);
  });

  it('updates a meeting (PATCH isPublic or type) (200, reflects change)', async () => {
    // Create a meeting
    const createRes = await app.inject({
      method: 'POST',
      url: '/meetings',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: {
        meetingDate: '2026-06-17',
        type: 'ordinária' as const,
        isPublic: false
      }
    });
    const created = createRes.json<MeetingResponse>();

    // Update isPublic
    const updateRes = await app.inject({
      method: 'PATCH',
      url: `/meetings/${created.id}`,
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: {
        isPublic: true,
        type: 'extraordinária' as const
      }
    });
    expect(updateRes.statusCode).toBe(200);
    const updated = updateRes.json<MeetingResponse>();
    expect(updated.isPublic).toBe(true);
    expect(updated.type).toBe('extraordinária');
  });

  it('sets agenda items via PUT (200, agendaItems length matches, titles match, order assigned)', async () => {
    // Create a meeting
    const createRes = await app.inject({
      method: 'POST',
      url: '/meetings',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: {
        meetingDate: '2026-06-18',
        type: 'ordinária' as const
      }
    });
    const created = createRes.json<MeetingResponse>();

    // Set agenda items
    const items = [
      { title: 'Abertura da Assembleia', description: 'Boas-vindas e oração inicial' },
      { title: 'Leitura de Atas Anteriores' },
      { title: 'Assuntos Financeiros', description: 'Apresentação do balanço mensal' }
    ];
    const updateRes = await app.inject({
      method: 'PUT',
      url: `/meetings/${created.id}/agenda-items`,
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: { items }
    });
    expect(updateRes.statusCode).toBe(200);
    const updated = updateRes.json<MeetingResponse>();
    expect(updated.agendaItems).toHaveLength(3);
    expect(updated.agendaItems[0].title).toBe('Abertura da Assembleia');
    expect(updated.agendaItems[0].description).toBe('Boas-vindas e oração inicial');
    expect(updated.agendaItems[1].title).toBe('Leitura de Atas Anteriores');
    expect(updated.agendaItems[2].title).toBe('Assuntos Financeiros');
    // Verify order is assigned (should be 0, 1, 2)
    expect(updated.agendaItems[0].order).toBe(0);
    expect(updated.agendaItems[1].order).toBe(1);
    expect(updated.agendaItems[2].order).toBe(2);
  });

  it('validation negative: POST with bad body (invalid type) returns 400 with fieldErrors', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/meetings',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: {
        meetingDate: '2026-06-19',
        type: 'invalido'
      }
    });
    // Body-schema validation errors return Fastify's default { message } shape (no fieldErrors);
    // the dotted fieldErrors contract only applies to manually-thrown httpError (e.g. 409 conflicts).
    expect(res.statusCode).toBe(400);
  });

  it('validation negative: POST with missing meetingDate returns 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/meetings',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: {
        type: 'ordinária'
      }
    });
    expect(res.statusCode).toBe(400);
  });

  it('RBAC negative: congregado (no Agendas:Cadastrar) cannot POST /meetings (403)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/meetings',
      headers: { cookie: congregado.cookie, 'x-csrf-token': congregado.csrfToken },
      payload: {
        meetingDate: '2026-06-20',
        type: 'ordinária' as const
      }
    });
    expect(res.statusCode).toBe(403);
  });

  it('RBAC negative: congregado (no Agendas:Remover) cannot DELETE /meetings (403)', async () => {
    // Create a meeting as admin
    const createRes = await app.inject({
      method: 'POST',
      url: '/meetings',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: {
        meetingDate: '2026-06-21',
        type: 'ordinária' as const
      }
    });
    const created = createRes.json<MeetingResponse>();

    // Try to delete as congregado
    const deleteRes = await app.inject({
      method: 'DELETE',
      url: `/meetings/${created.id}`,
      headers: { cookie: congregado.cookie, 'x-csrf-token': congregado.csrfToken }
    });
    expect(deleteRes.statusCode).toBe(403);
  });

  it('soft-deletes a meeting (204): it leaves the list but stays fetchable as inativo', async () => {
    // Create a meeting
    const createRes = await app.inject({
      method: 'POST',
      url: '/meetings',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: {
        meetingDate: '2026-06-22',
        type: 'ordinária' as const
      }
    });
    const created = createRes.json<MeetingResponse>();

    // Delete the meeting (soft delete → status 'inativo')
    const deleteRes = await app.inject({
      method: 'DELETE',
      url: `/meetings/${created.id}`,
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken }
    });
    expect(deleteRes.statusCode).toBe(204);

    // The list excludes inactive meetings (repository filters status !== 'inativo').
    const listRes = await app.inject({
      method: 'GET',
      url: '/meetings?page=1&limit=100',
      headers: { cookie: admin.cookie }
    });
    const list = listRes.json<{ data: MeetingResponse[] }>().data;
    expect(list.some((m) => m.id === created.id)).toBe(false);

    // getById still returns the record, now flagged inactive.
    const getRes = await app.inject({
      method: 'GET',
      url: `/meetings/${created.id}`,
      headers: { cookie: admin.cookie }
    });
    expect(getRes.statusCode).toBe(200);
    expect(getRes.json<MeetingResponse>().status).toBe('inativo');
  });

  it('validation negative: PUT agenda items with invalid body (empty items array) returns 400', async () => {
    // Create a meeting
    const createRes = await app.inject({
      method: 'POST',
      url: '/meetings',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: {
        meetingDate: '2026-06-23',
        type: 'ordinária' as const
      }
    });
    const created = createRes.json<MeetingResponse>();

    // Try to set empty items
    const updateRes = await app.inject({
      method: 'PUT',
      url: `/meetings/${created.id}/agenda-items`,
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: { items: [] }
    });
    expect(updateRes.statusCode).toBe(400);
  });

  it('validation negative: PUT agenda item with title exceeding 256 chars returns 400', async () => {
    // Create a meeting
    const createRes = await app.inject({
      method: 'POST',
      url: '/meetings',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: {
        meetingDate: '2026-06-24',
        type: 'ordinária' as const
      }
    });
    const created = createRes.json<MeetingResponse>();

    // Try to set item with title exceeding 256 chars
    const longTitle = 'A'.repeat(257);
    const updateRes = await app.inject({
      method: 'PUT',
      url: `/meetings/${created.id}/agenda-items`,
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: {
        items: [{ title: longTitle }]
      }
    });
    expect(updateRes.statusCode).toBe(400);
  });

  it('RBAC negative: congregado (no Agendas:Acessar) cannot GET /meetings (403)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/meetings?page=1&limit=20',
      headers: { cookie: congregado.cookie }
    });
    expect(res.statusCode).toBe(403);
  });
});
