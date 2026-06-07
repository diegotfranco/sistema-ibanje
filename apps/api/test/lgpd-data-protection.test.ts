import { describe, it, expect, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { ne, eq, desc } from 'drizzle-orm';
import { getTestApp } from './helpers/app.js';
import { loginAs, type AuthCookies } from './helpers/auth.js';
import { reseedDb } from './helpers/db.js';
import { db } from '../src/db/index.js';
import { attenders, passwordResetTokens, users } from '../src/db/schema.js';

// LGPD-oriented checks: data minimization (credentials never leave the server), access control over
// personal data (a titular sees only their own; others are not even confirmed to exist), and
// security of credentials at rest (reset tokens stored hashed, never echoed). These encode the
// data-protection guarantees the system must keep, not just functional behavior.
function asArray(header: string | string[] | undefined): string[] {
  if (!header) return [];
  return Array.isArray(header) ? header : [header];
}

const SECRET_KEYS = ['passwordHash', 'password', 'password_hash'];

function assertNoSecrets(value: unknown) {
  const json = JSON.stringify(value).toLowerCase();
  for (const key of SECRET_KEYS) {
    expect(json).not.toContain(key.toLowerCase());
  }
}

describe('LGPD: data protection guarantees', () => {
  let app: FastifyInstance;
  let admin: AuthCookies;
  let congregado: AuthCookies;
  let selfAttenderId: number;
  let otherAttenderId: number;
  let anyUserId: number;

  beforeAll(async () => {
    reseedDb();
    app = await getTestApp();
    admin = await loginAs(app, 'admin@email.com', 'admin123');
    congregado = await loginAs(app, 'congregado@email.com', 'congregado123');

    const [self] = await db
      .select({ id: attenders.id })
      .from(attenders)
      .where(eq(attenders.name, 'João da Silva'));
    selfAttenderId = self.id;

    const [other] = await db
      .select({ id: attenders.id })
      .from(attenders)
      .where(ne(attenders.id, selfAttenderId))
      .limit(1);
    otherAttenderId = other.id;

    const [user] = await db.select({ id: users.id }).from(users).limit(1);
    anyUserId = user.id;
  });

  // Sweep helper: any people-returning endpoint must never echo credential material, whatever the
  // shape. Centralizing it means adding a new people-returning route is one line here.
  async function expectNoSecrets(url: string, cookie: string) {
    const res = await app.inject({ method: 'GET', url, headers: { cookie } });
    expect(res.statusCode).toBe(200);
    assertNoSecrets(res.json());
  }

  describe('data minimization: credentials never leave the API', () => {
    it('GET /auth/me never includes a password hash', async () => {
      await expectNoSecrets('/auth/me', admin.cookie);
    });

    it('GET /users/:id never includes a password hash', async () => {
      await expectNoSecrets(`/users/${anyUserId}`, admin.cookie);
    });

    it('GET /attenders/:id (self) never includes a password hash', async () => {
      await expectNoSecrets(`/attenders/${selfAttenderId}`, congregado.cookie);
    });

    it('the login response never includes a password hash', async () => {
      const csrf = await app.inject({ method: 'GET', url: '/auth/csrf-token' });
      const token = csrf.json<{ csrfToken: string }>().csrfToken;
      const cookie = asArray(csrf.headers['set-cookie'])
        .map((c) => c.split(';')[0])
        .join('; ');
      const res = await app.inject({
        method: 'POST',
        url: '/auth/login',
        headers: { cookie, 'x-csrf-token': token },
        payload: { email: 'admin@email.com', password: 'admin123' }
      });
      expect(res.statusCode).toBe(200);
      assertNoSecrets(res.json());
    });

    it('GET /users (list) never leaks a password hash for any row', async () => {
      await expectNoSecrets('/users?limit=100', admin.cookie);
    });
  });

  describe('access control over personal data (titular vs others)', () => {
    it('a congregant reads their OWN personal record (right of access)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/attenders/${selfAttenderId}`,
        headers: { cookie: congregado.cookie }
      });
      expect(res.statusCode).toBe(200);
      expect(res.json<{ id: number }>().id).toBe(selfAttenderId);
    });

    it("does not expose another person's record (404 — does not even confirm existence)", async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/attenders/${otherAttenderId}`,
        headers: { cookie: congregado.cookie }
      });
      expect(res.statusCode).toBe(404);
      // The body must not carry the other person's PII.
      const body = res.body.toLowerCase();
      expect(body).not.toContain('"phone"');
      expect(body).not.toContain('"email"');
      expect(body).not.toContain('"addressstreet"');
    });

    it('blocks a congregant from listing the whole roster (403)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/attenders',
        headers: { cookie: congregado.cookie }
      });
      expect(res.statusCode).toBe(403);
    });
  });

  describe('credentials at rest: reset tokens are hashed, never echoed', () => {
    it('stores only a sha256 hash of the reset token and returns no token to the client', async () => {
      const csrf = await app.inject({ method: 'GET', url: '/auth/csrf-token' });
      const token = csrf.json<{ csrfToken: string }>().csrfToken;
      const cookie = asArray(csrf.headers['set-cookie'])
        .map((c) => c.split(';')[0])
        .join('; ');

      const email = 'admin@email.com';
      const res = await app.inject({
        method: 'POST',
        url: '/auth/password-reset/request',
        headers: { cookie, 'x-csrf-token': token },
        payload: { email }
      });
      expect(res.statusCode).toBe(200);
      // No raw token is ever returned in the HTTP response.
      expect(res.body.toLowerCase()).not.toContain('token');

      const [row] = await db
        .select()
        .from(passwordResetTokens)
        .where(eq(passwordResetTokens.email, email))
        .orderBy(desc(passwordResetTokens.id))
        .limit(1);
      expect(row).toBeDefined();
      // Stored value is a 64-char hex sha256 digest — never the raw token.
      expect(row.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('the password_reset_tokens row has no plaintext-token column', async () => {
      // Schema-level guarantee: only `tokenHash` exists; a raw `token` column would be a leak.
      const sample = await db.select().from(passwordResetTokens).limit(1);
      if (sample.length > 0) {
        expect(sample[0]).not.toHaveProperty('token');
        expect(sample[0]).toHaveProperty('tokenHash');
      }
    });
  });
});
