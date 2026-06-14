import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { getTestApp } from './helpers/app.js';
import { reseedDb } from './helpers/db.js';
import { clearLoginFailures, isLoginLocked } from '../src/modules/auth/lockout.js';

// Per-account soft lockout layered on the IP rate-limit. The response stays the generic 401 so the
// lock state is never disclosed (no enumeration). State lives in Redis keyed by email; we clear the
// admin counter after each test so the lock doesn't bleed into other (sequential) test files.
const ADMIN_EMAIL = 'admin@email.com';
const ADMIN_PASSWORD = 'admin123';

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

async function attemptLogin(app: FastifyInstance, password: string) {
  const { csrfToken, cookie } = await csrfHandshake(app);
  return app.inject({
    method: 'POST',
    url: '/auth/login',
    headers: { cookie, 'x-csrf-token': csrfToken },
    payload: { email: ADMIN_EMAIL, password }
  });
}

describe('auth: per-account login lockout', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    reseedDb();
    app = await getTestApp();
  });

  afterEach(async () => {
    await clearLoginFailures(ADMIN_EMAIL);
  });

  it('locks after 5 failures, blocks even a valid password, and clears on reset', async () => {
    await clearLoginFailures(ADMIN_EMAIL);

    for (let i = 0; i < 5; i++) {
      const res = await attemptLogin(app, 'definitely-wrong');
      expect(res.statusCode).toBe(401);
    }

    expect(await isLoginLocked(ADMIN_EMAIL)).toBe(true);

    // Locked: even the correct password is rejected with the same generic 401.
    const blocked = await attemptLogin(app, ADMIN_PASSWORD);
    expect(blocked.statusCode).toBe(401);

    // Reset clears the counter; the correct password authenticates again.
    await clearLoginFailures(ADMIN_EMAIL);
    const ok = await attemptLogin(app, ADMIN_PASSWORD);
    expect(ok.statusCode).toBe(200);
  });

  it('a successful login below the threshold clears the failure counter', async () => {
    await clearLoginFailures(ADMIN_EMAIL);

    for (let i = 0; i < 3; i++) {
      const res = await attemptLogin(app, 'definitely-wrong');
      expect(res.statusCode).toBe(401);
    }

    const ok = await attemptLogin(app, ADMIN_PASSWORD);
    expect(ok.statusCode).toBe(200);
    expect(await isLoginLocked(ADMIN_EMAIL)).toBe(false);
  });
});
