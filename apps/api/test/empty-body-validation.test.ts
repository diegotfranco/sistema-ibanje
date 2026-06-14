import { describe, it, expect, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { getTestApp } from './helpers/app.js';
import { loginAs, type AuthCookies } from './helpers/auth.js';
import { reseedDb } from './helpers/db.js';

// Regression guard for the "absent request body" class of bug: a route whose body schema is a
// fully-optional z.object() used to reject a request that omitted the body entirely (Fastify hands
// the validator `undefined`, z.object() fails at the root path), surfacing as a generic
// "Validation error" with empty fieldErrors. app.ts coerces a missing body to {} at the validator
// boundary so optional schemas pass and required ones still produce proper per-field errors.
//
// NB: these inject calls deliberately send NO `payload` — the existing state-machine tests always
// pass `{}`, which is why the production bug (client omits the body) was never caught.
describe('absent request body handling', () => {
  let app: FastifyInstance;
  let tesAuth: AuthCookies;
  let admin: AuthCookies;

  beforeAll(async () => {
    reseedDb();
    app = await getTestApp();
    tesAuth = await loginAs(app, 'tesoureiro@email.com', 'tesoureiro123');
    admin = await loginAs(app, 'admin@email.com', 'admin123');
  });

  it('all-optional transition body: approve with no body succeeds', async () => {
    const create = await app.inject({
      method: 'POST',
      url: '/monthly-closings',
      headers: { cookie: tesAuth.cookie, 'x-csrf-token': tesAuth.csrfToken },
      payload: { periodYear: 2099, periodMonth: 1 }
    });
    expect(create.statusCode).toBe(201);
    const { id } = create.json<{ id: number }>();

    // submit (with notes) so it lands in "em revisão"
    const submit = await app.inject({
      method: 'POST',
      url: `/monthly-closings/${id}/submit`,
      headers: { cookie: tesAuth.cookie, 'x-csrf-token': tesAuth.csrfToken },
      payload: { treasurerNotes: 'ok' }
    });
    expect(submit.statusCode).toBe(200);

    // approve with NO body — this is what the UI sends when the notes field is left blank.
    const approve = await app.inject({
      method: 'POST',
      url: `/monthly-closings/${id}/approve`,
      headers: { cookie: tesAuth.cookie, 'x-csrf-token': tesAuth.csrfToken }
    });
    expect(approve.statusCode).toBe(200);
    expect(approve.json<{ status: string }>().status).toBe('aprovado');
  });

  it('all-optional PATCH body: update role with no body succeeds (no-op)', async () => {
    const create = await app.inject({
      method: 'POST',
      url: '/roles',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: { name: 'Empty Body Test Role' }
    });
    expect(create.statusCode).toBe(201);
    const { id } = create.json<{ id: number }>();

    const update = await app.inject({
      method: 'PATCH',
      url: `/roles/${id}`,
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken }
    });
    expect(update.statusCode).toBe(200);
  });

  it('required body still rejected with populated fieldErrors (not an opaque {})', async () => {
    // login is a mutating route, so it needs a CSRF token + session cookie but no valid payload.
    const csrf = await app.inject({ method: 'GET', url: '/auth/csrf-token' });
    const csrfToken = csrf.json<{ csrfToken: string }>().csrfToken;
    const cookie = (csrf.headers['set-cookie'] as string).split(';')[0];

    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      headers: { cookie, 'x-csrf-token': csrfToken }
    });
    expect(res.statusCode).toBe(400);
    const body = res.json<{ message: string; fieldErrors?: Record<string, string> }>();
    // Coercion to {} means email/password now fail per-field instead of at the root → frontend
    // applyFieldErrors() can place messages under the right inputs.
    expect(body.fieldErrors && Object.keys(body.fieldErrors).length).toBeGreaterThan(0);
    expect(body.fieldErrors).toHaveProperty('email');
    expect(body.fieldErrors).toHaveProperty('password');
  });
});
