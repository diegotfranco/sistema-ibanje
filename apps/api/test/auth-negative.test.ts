import { describe, it, expect, beforeAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { getTestApp } from './helpers/app.js';
import { reseedDb } from './helpers/db.js';

// Adversarial authentication: the login endpoint must fail closed and must NOT leak whether an
// account exists (LGPD-relevant user-enumeration resistance). It also must reject inactive accounts
// and malformed payloads with a 4xx, never a 500.
function asArray(header: string | string[] | undefined): string[] {
  if (!header) return [];
  return Array.isArray(header) ? header : [header];
}

async function csrfHandshake(app: FastifyInstance) {
  const res = await app.inject({ method: 'GET', url: '/auth/csrf-token' });
  const csrfToken = res.json<{ csrfToken: string }>().csrfToken;
  const cookie = asArray(res.headers['set-cookie'])
    .map((c) => c.split(';')[0])
    .join('; ');
  return { csrfToken, cookie };
}

async function attemptLogin(app: FastifyInstance, payload: Record<string, unknown>) {
  const { csrfToken, cookie } = await csrfHandshake(app);
  return app.inject({
    method: 'POST',
    url: '/auth/login',
    headers: { cookie, 'x-csrf-token': csrfToken },
    payload
  });
}

describe('auth: adversarial / negative paths', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    reseedDb();
    app = await getTestApp();
  });

  it('rejects a wrong password for a real account with 401', async () => {
    const res = await attemptLogin(app, { email: 'admin@email.com', password: 'definitely-wrong' });
    expect(res.statusCode).toBe(401);
  });

  it('rejects an unknown email with 401 and the SAME body as a wrong password (no enumeration)', async () => {
    const wrongPassword = await attemptLogin(app, {
      email: 'admin@email.com',
      password: 'definitely-wrong'
    });
    const unknownEmail = await attemptLogin(app, {
      email: 'ghost-does-not-exist@email.com',
      password: 'definitely-wrong'
    });

    expect(unknownEmail.statusCode).toBe(401);
    // Identical status + body: an attacker cannot distinguish "no such user" from "bad password".
    expect(unknownEmail.statusCode).toBe(wrongPassword.statusCode);
    expect(unknownEmail.body).toBe(wrongPassword.body);
  });

  it('refuses to log in a pending (não aprovado) account with 401', async () => {
    // Self-registration lands in status `pendente` with no password set.
    const email = `pending-${randomUUID()}@email.com`;
    const { csrfToken, cookie } = await csrfHandshake(app);
    const register = await app.inject({
      method: 'POST',
      url: '/auth/register',
      headers: { cookie, 'x-csrf-token': csrfToken },
      payload: { name: 'Pendente da Silva', email }
    });
    expect(register.statusCode).toBe(201);

    // Even with any password, a non-active account must not authenticate.
    const res = await attemptLogin(app, { email, password: 'whatever-they-try' });
    expect(res.statusCode).toBe(401);
  });

  it('password-reset request returns 2xx for an unknown email (no enumeration, no leak)', async () => {
    const { csrfToken, cookie } = await csrfHandshake(app);
    const res = await app.inject({
      method: 'POST',
      url: '/auth/password-reset/request',
      headers: { cookie, 'x-csrf-token': csrfToken },
      payload: { email: 'ghost-does-not-exist@email.com' }
    });
    // Uniform success response regardless of account existence.
    expect(res.statusCode).toBeGreaterThanOrEqual(200);
    expect(res.statusCode).toBeLessThan(300);
    // The response body must not echo any reset token or confirm existence.
    expect(res.body.toLowerCase()).not.toContain('token');
  });

  it('rejects a malformed login payload with 400 (not 500)', async () => {
    // Transport (Zod) validation failures degrade to a 400 with a string message — never a 500.
    // (The dotted-fieldErrors envelope is only emitted for service-thrown httpError, not for
    // request-body validation; see robustness.test.ts "error envelope contract" for the documented gap.)
    const missingPassword = await attemptLogin(app, { email: 'admin@email.com' });
    expect(missingPassword.statusCode).toBe(400);
    expect(typeof missingPassword.json<{ message: string }>().message).toBe('string');

    const notAnEmail = await attemptLogin(app, { email: 'not-an-email', password: 'x' });
    expect(notAnEmail.statusCode).toBe(400);
  });
});
