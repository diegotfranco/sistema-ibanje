import { describe, it, expect, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { getTestApp } from './helpers/app.js';

// Brute-force protection on /auth/login (max 8 / 15 min). The rate-limit plugin allowlists loopback
// IPs, so each test forges a UNIQUE non-loopback `remoteAddress` to (a) bypass the allowlist and
// (b) isolate the in-memory counter from other tests sharing the singleton app.
function asArray(header: string | string[] | undefined): string[] {
  if (!header) return [];
  return Array.isArray(header) ? header : [header];
}

describe('rate limiting on /auth/login', () => {
  let app: FastifyInstance;
  let cookie: string;
  let csrfToken: string;

  beforeAll(async () => {
    app = await getTestApp();
    const res = await app.inject({ method: 'GET', url: '/auth/csrf-token' });
    csrfToken = res.json<{ csrfToken: string }>().csrfToken;
    cookie = asArray(res.headers['set-cookie'])
      .map((c) => c.split(';')[0])
      .join('; ');
  });

  function attempt(remoteAddress: string) {
    return app.inject({
      method: 'POST',
      url: '/auth/login',
      remoteAddress,
      headers: { cookie, 'x-csrf-token': csrfToken },
      // Unknown email → fast 401 (no argon2), but the request is still counted by the limiter.
      payload: { email: 'nobody-here@email.com', password: 'whatever' }
    });
  }

  it('returns 429 with a Retry-After header after exceeding the limit', async () => {
    const ip = '203.0.113.10';
    const statuses: number[] = [];
    let blocked: Awaited<ReturnType<typeof attempt>> | undefined;

    // 8 allowed + 1 over the limit.
    for (let i = 0; i < 9; i++) {
      const res = await attempt(ip);
      statuses.push(res.statusCode);
      if (res.statusCode === 429) blocked = res;
    }

    expect(statuses.slice(0, 8).every((s) => s === 401)).toBe(true);
    expect(statuses[8]).toBe(429);
    expect(blocked).toBeDefined();
    expect(blocked!.headers['retry-after']).toBeDefined();
  });

  it('rate limit is per-IP: a fresh IP is not affected by another IP being blocked', async () => {
    const res = await attempt('203.0.113.99');
    expect(res.statusCode).toBe(401);
  });
});
