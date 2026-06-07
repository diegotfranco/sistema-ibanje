import { describe, it, expect, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { getTestApp } from './helpers/app.js';
import { loginAs, type AuthCookies } from './helpers/auth.js';
import { reseedDb } from './helpers/db.js';

type AttenderRow = {
  id: number;
  name: string;
  status: string;
  exitDate: string | null;
  exitReason: string | null;
  exitLetterId: number | null;
};

// Exercises the guarded member-lifecycle endpoint PATCH /attenders/:id/status.
describe('attender lifecycle (status transitions)', () => {
  let app: FastifyInstance;
  let admin: AuthCookies;
  let congregant: AuthCookies;
  let attenderId: number;

  async function createAttender(name: string): Promise<number> {
    const res = await app.inject({
      method: 'POST',
      url: '/attenders',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: { name, isMember: true }
    });
    expect(res.statusCode).toBe(201);
    return res.json<AttenderRow>().id;
  }

  async function setStatus(id: number, body: Record<string, unknown>) {
    return app.inject({
      method: 'PATCH',
      url: `/attenders/${id}/status`,
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: body
    });
  }

  beforeAll(async () => {
    reseedDb();
    app = await getTestApp();
    admin = await loginAs(app, 'admin@email.com', 'admin123');
    congregant = await loginAs(app, 'congregado@email.com', 'congregado123');
    attenderId = await createAttender('Lifecycle Tester');
  });

  it('desliga a member, recording exit date + reason (200)', async () => {
    const res = await setStatus(attenderId, {
      status: 'desligado',
      exitDate: '2026-06-01',
      exitReason: 'A pedido próprio.'
    });
    expect(res.statusCode).toBe(200);
    const row = res.json<AttenderRow>();
    expect(row.status).toBe('desligado');
    expect(row.exitDate).toBe('2026-06-01');
    expect(row.exitReason).toBe('A pedido próprio.');
  });

  it('blocks a terminal→terminal jump without reactivating first (409)', async () => {
    const res = await setStatus(attenderId, { status: 'falecido', exitDate: '2026-06-02' });
    expect(res.statusCode).toBe(409);
  });

  it('reactivates a member, clearing exit metadata (200)', async () => {
    const res = await setStatus(attenderId, { status: 'ativo' });
    expect(res.statusCode).toBe(200);
    const row = res.json<AttenderRow>();
    expect(row.status).toBe('ativo');
    expect(row.exitDate).toBeNull();
    expect(row.exitReason).toBeNull();
    expect(row.exitLetterId).toBeNull();
  });

  it('requires an exit date when entering a formal-exit state (400)', async () => {
    const res = await setStatus(attenderId, { status: 'desligado' });
    expect(res.statusCode).toBe(400);
    expect(res.json<{ fieldErrors?: Record<string, string> }>().fieldErrors).toHaveProperty(
      'exitDate'
    );
  });

  it('rejects a transfer-letter link on a non-transfer status (400)', async () => {
    const res = await setStatus(attenderId, {
      status: 'desligado',
      exitDate: '2026-06-01',
      exitLetterId: 1
    });
    expect(res.statusCode).toBe(400);
    expect(res.json<{ fieldErrors?: Record<string, string> }>().fieldErrors).toHaveProperty(
      'exitLetterId'
    );
  });

  it('transfers a member and links a carta de transferência (200)', async () => {
    const transferId = await createAttender('Transferência Tester');

    // Issue an outgoing carta for this attender first.
    const letterRes = await app.inject({
      method: 'POST',
      url: '/membership-letters',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: {
        attenderId: transferId,
        type: 'carta_de_transferência',
        letterDate: '2026-06-05',
        otherChurchName: 'Igreja Destino',
        otherChurchCity: 'São Paulo',
        otherChurchState: 'SP'
      }
    });
    expect(letterRes.statusCode).toBe(201);
    const letterId = letterRes.json<{ id: number }>().id;

    const res = await setStatus(transferId, {
      status: 'transferido',
      exitDate: '2026-06-05',
      exitLetterId: letterId
    });
    expect(res.statusCode).toBe(200);
    const row = res.json<AttenderRow>();
    expect(row.status).toBe('transferido');
    expect(row.exitLetterId).toBe(letterId);
  });

  it('hides a soft-deleted member from the list and 404s getById', async () => {
    const deletable = await createAttender('Delete Me');
    const del = await app.inject({
      method: 'DELETE',
      url: `/attenders/${deletable}`,
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken }
    });
    expect(del.statusCode).toBe(204);

    const get = await app.inject({
      method: 'GET',
      url: `/attenders/${deletable}`,
      headers: { cookie: admin.cookie }
    });
    expect(get.statusCode).toBe(404);
  });

  it('blocks a congregant without Editar from changing status (403)', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/attenders/${attenderId}/status`,
      headers: { cookie: congregant.cookie, 'x-csrf-token': congregant.csrfToken },
      payload: { status: 'inativo' }
    });
    expect(res.statusCode).toBe(403);
  });
});
