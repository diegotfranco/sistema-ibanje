import { describe, it, expect, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { getTestApp } from '../helpers/app.js';
import { loginAs, type AuthCookies } from '../helpers/auth.js';
import { reseedDb } from '../helpers/db.js';

describe('monthly closing state machine', () => {
  let app: FastifyInstance;
  let tesAuth: AuthCookies;
  let tesRespAuth: AuthCookies;

  beforeAll(async () => {
    reseedDb();
    app = await getTestApp();
    tesAuth = await loginAs(app, 'tesoureiro@email.com', 'tesoureiro123');
    tesRespAuth = await loginAs(app, 'tesoureiro.resp@email.com', 'tesresp123');
  });

  async function createClosing(auth: AuthCookies, year: number, month: number) {
    const res = await app.inject({
      method: 'POST',
      url: '/monthly-closings',
      headers: { cookie: auth.cookie, 'x-csrf-token': auth.csrfToken },
      payload: { periodYear: year, periodMonth: month }
    });
    expect(res.statusCode).toBe(201);
    return res.json<{ id: number; status: string }>();
  }

  async function transition(auth: AuthCookies, id: number, action: string, body: object = {}) {
    return app.inject({
      method: 'POST',
      url: `/monthly-closings/${id}/${action}`,
      headers: { cookie: auth.cookie, 'x-csrf-token': auth.csrfToken },
      payload: body
    });
  }

  it('happy path: aberto → em revisão → aprovado → fechado', async () => {
    const closing = await createClosing(tesAuth, 2098, 1);
    expect(closing.status).toBe('aberto');

    const submitRes = await transition(tesAuth, closing.id, 'submit', { treasurerNotes: 'ok' });
    expect(submitRes.statusCode).toBe(200);
    expect(submitRes.json<{ status: string }>().status).toBe('em revisão');

    const approveRes = await transition(tesRespAuth, closing.id, 'approve');
    expect(approveRes.statusCode).toBe(200);
    expect(approveRes.json<{ status: string }>().status).toBe('aprovado');

    const closeRes = await transition(tesRespAuth, closing.id, 'close');
    expect(closeRes.statusCode).toBe(200);
    expect(closeRes.json<{ status: string }>().status).toBe('fechado');
  });

  it('reject moves em revisão back to aberto', async () => {
    const closing = await createClosing(tesAuth, 2098, 2);
    await transition(tesAuth, closing.id, 'submit');
    const rejectRes = await transition(tesRespAuth, closing.id, 'reject', {
      accountantNotes: 'redo'
    });
    expect(rejectRes.statusCode).toBe(200);
    expect(rejectRes.json<{ status: string }>().status).toBe('aberto');
  });

  it('cannot submit from non-aberto state', async () => {
    const closing = await createClosing(tesAuth, 2098, 3);
    await transition(tesAuth, closing.id, 'submit'); // aberto → em revisão
    const second = await transition(tesAuth, closing.id, 'submit'); // em revisão → ???
    expect(second.statusCode).toBeGreaterThanOrEqual(400);
  });

  it('cannot approve from aberto', async () => {
    const closing = await createClosing(tesAuth, 2098, 4);
    const res = await transition(tesRespAuth, closing.id, 'approve');
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  it('cannot close from aprovado without prior month being fechado (out-of-order seal guard)', async () => {
    // Period 2098-05 — the previous month (2098-04) is aberto from the prior test, not fechado.
    const closing = await createClosing(tesAuth, 2098, 5);
    await transition(tesAuth, closing.id, 'submit');
    await transition(tesRespAuth, closing.id, 'approve');
    const res = await transition(tesRespAuth, closing.id, 'close');
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });
});
