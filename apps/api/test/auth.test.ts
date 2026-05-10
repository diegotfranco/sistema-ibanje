import { describe, it, expect, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { getTestApp } from './helpers/app.js';

function asArray(header: string | string[] | undefined): string[] {
  if (!header) return [];
  return Array.isArray(header) ? header : [header];
}

async function loginRaw(app: FastifyInstance, rememberMe: boolean | undefined) {
  const csrfRes = await app.inject({ method: 'GET', url: '/auth/csrf-token' });
  const csrfToken = csrfRes.json<{ csrfToken: string }>().csrfToken;
  const sessionCookie = asArray(csrfRes.headers['set-cookie'])
    .map((c) => c.split(';')[0])
    .join('; ');

  const payload: Record<string, unknown> = { email: 'admin@email.com', password: 'admin123' };
  if (rememberMe !== undefined) payload.rememberMe = rememberMe;

  return app.inject({
    method: 'POST',
    url: '/auth/login',
    headers: { cookie: sessionCookie, 'x-csrf-token': csrfToken },
    payload
  });
}

function findSessionCookieLine(setCookie: string | string[] | undefined): string | undefined {
  return asArray(setCookie).find((line) => line.startsWith('sessionId='));
}

describe('auth: rememberMe cookie behavior', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await getTestApp();
  });

  it('rememberMe=true sets a ~14 day Expires on the session cookie', async () => {
    const res = await loginRaw(app, true);
    expect(res.statusCode).toBe(200);

    const sessionLine = findSessionCookieLine(res.headers['set-cookie']);
    expect(sessionLine).toBeDefined();

    const expiresMatch = sessionLine!.match(/Expires=([^;]+)/i);
    expect(expiresMatch).not.toBeNull();

    const expires = new Date(expiresMatch![1]);
    const days = (expires.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
    expect(days).toBeGreaterThan(13);
    expect(days).toBeLessThan(15);
  });

  it('rememberMe=false produces a browser-session cookie (no Expires/Max-Age)', async () => {
    const res = await loginRaw(app, false);
    expect(res.statusCode).toBe(200);

    const sessionLine = findSessionCookieLine(res.headers['set-cookie']);
    expect(sessionLine).toBeDefined();
    expect(sessionLine!).not.toMatch(/Expires=/i);
    expect(sessionLine!).not.toMatch(/Max-Age=/i);
  });
});
