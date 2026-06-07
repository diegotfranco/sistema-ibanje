import { describe, it, expect, beforeAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { getTestApp } from './helpers/app.js';
import { loginAs, type AuthCookies } from './helpers/auth.js';
import { reseedDb } from './helpers/db.js';

// CSRF is enforced globally via a preHandler in app.ts that runs app.csrfProtection on every
// non-safe (POST/PUT/PATCH/DELETE) request. These tests prove the gate works both on the auth
// routes AND on an arbitrary module route (attenders): a state-changing request with no token or a
// forged token is rejected with 403, while a valid handshake passes.
function asArray(header: string | string[] | undefined): string[] {
  if (!header) return [];
  return Array.isArray(header) ? header : [header];
}

describe('CSRF protection (auth routes)', () => {
  let app: FastifyInstance;
  let sessionCookie: string;
  let validToken: string;

  beforeAll(async () => {
    app = await getTestApp();
    const res = await app.inject({ method: 'GET', url: '/auth/csrf-token' });
    validToken = res.json<{ csrfToken: string }>().csrfToken;
    sessionCookie = asArray(res.headers['set-cookie'])
      .map((c) => c.split(';')[0])
      .join('; ');
  });

  it('rejects POST /auth/login with no CSRF token (403)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      headers: { cookie: sessionCookie },
      payload: { email: 'admin@email.com', password: 'admin123' }
    });
    expect(res.statusCode).toBe(403);
  });

  it('rejects POST /auth/login with a forged CSRF token (403)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      headers: { cookie: sessionCookie, 'x-csrf-token': randomUUID() },
      payload: { email: 'admin@email.com', password: 'admin123' }
    });
    expect(res.statusCode).toBe(403);
  });

  it('rejects POST /auth/register with no CSRF token (403)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      headers: { cookie: sessionCookie },
      payload: { name: 'Sem Token', email: `no-token-${randomUUID()}@email.com` }
    });
    expect(res.statusCode).toBe(403);
  });

  it('passes with a valid handshake (not 403) — proves the gate is not vacuously true', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      headers: { cookie: sessionCookie, 'x-csrf-token': validToken },
      payload: { email: 'admin@email.com', password: 'admin123' }
    });
    expect(res.statusCode).not.toBe(403);
    expect(res.statusCode).toBe(200);
  });
});

// Proves CSRF is enforced GLOBALLY, not just on /auth — a mutating request to a module route
// (attenders) is rejected without a token and accepted with one. This is the 1C fix.
describe('CSRF protection (module routes are covered globally)', () => {
  let app: FastifyInstance;
  let auth: AuthCookies;

  beforeAll(async () => {
    reseedDb();
    app = await getTestApp();
    auth = await loginAs(app, 'admin@email.com', 'admin123');
  });

  it('rejects POST /attenders with no CSRF token (403)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/attenders',
      headers: { cookie: auth.cookie },
      payload: { name: 'Sem Token CSRF' }
    });
    expect(res.statusCode).toBe(403);
  });

  it('rejects POST /attenders with a forged CSRF token (403)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/attenders',
      headers: { cookie: auth.cookie, 'x-csrf-token': randomUUID() },
      payload: { name: 'Token Forjado' }
    });
    expect(res.statusCode).toBe(403);
  });

  it('accepts POST /attenders with a valid CSRF token (201)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/attenders',
      headers: { cookie: auth.cookie, 'x-csrf-token': auth.csrfToken },
      payload: { name: 'Token Válido' }
    });
    expect(res.statusCode).toBe(201);
  });

  it('exempts safe (GET) requests from CSRF — no token required', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/attenders?limit=1',
      headers: { cookie: auth.cookie }
    });
    expect(res.statusCode).toBe(200);
  });
});
