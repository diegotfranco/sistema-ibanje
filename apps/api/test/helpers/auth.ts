import type { FastifyInstance } from 'fastify';

export type AuthCookies = { cookie: string; csrfToken: string };

function normalizeHeader(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

function cookiesFrom(value: string | string[] | undefined): string | null {
  const cookies = normalizeHeader(value);
  return cookies.length > 0 ? cookies.map((c) => c.split(';')[0]).join('; ') : null;
}

export async function loginAs(
  app: FastifyInstance,
  email: string,
  password: string
): Promise<AuthCookies> {
  // 1. Get CSRF token (also sets the session cookie that holds the secret)
  const csrfRes = await app.inject({ method: 'GET', url: '/auth/csrf-token' });
  if (csrfRes.statusCode !== 200) throw new Error(`csrf-token failed: ${csrfRes.statusCode}`);
  let csrfToken = csrfRes.json<{ csrfToken: string }>().csrfToken;
  let cookie = cookiesFrom(csrfRes.headers['set-cookie']) ?? '';

  // 2. POST /auth/login with the cookie + token
  const loginRes = await app.inject({
    method: 'POST',
    url: '/auth/login',
    headers: { cookie, 'x-csrf-token': csrfToken },
    payload: { email, password }
  });
  if (loginRes.statusCode !== 200) {
    throw new Error(`login failed for ${email}: ${loginRes.statusCode} ${loginRes.body}`);
  }
  cookie = cookiesFrom(loginRes.headers['set-cookie']) ?? cookie;

  // 3. Re-fetch a CSRF token bound to the NEW session. Login regenerates the session
  // (controller.ts), discarding the pre-login CSRF secret — so the token from step 1 no longer
  // verifies. With CSRF now enforced globally on all mutating routes, every authenticated mutation
  // in the suite relies on this post-login token.
  const csrfRes2 = await app.inject({
    method: 'GET',
    url: '/auth/csrf-token',
    headers: { cookie }
  });
  if (csrfRes2.statusCode !== 200) throw new Error(`csrf-token (2) failed: ${csrfRes2.statusCode}`);
  csrfToken = csrfRes2.json<{ csrfToken: string }>().csrfToken;
  cookie = cookiesFrom(csrfRes2.headers['set-cookie']) ?? cookie;

  return { cookie, csrfToken };
}
