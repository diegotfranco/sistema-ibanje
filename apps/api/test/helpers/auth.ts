import type { FastifyInstance } from 'fastify';

export type AuthCookies = { cookie: string; csrfToken: string };

function normalizeHeader(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

export async function loginAs(
  app: FastifyInstance,
  email: string,
  password: string
): Promise<AuthCookies> {
  // 1. Get CSRF token (also sets the session cookie that holds the secret)
  const csrfRes = await app.inject({ method: 'GET', url: '/auth/csrf-token' });
  if (csrfRes.statusCode !== 200) throw new Error(`csrf-token failed: ${csrfRes.statusCode}`);
  const csrfToken = csrfRes.json<{ csrfToken: string }>().csrfToken;
  const setCookie = csrfRes.headers['set-cookie'];
  const cookies = normalizeHeader(setCookie);
  const sessionCookie = cookies.map((c) => c.split(';')[0]).join('; ');

  // 2. POST /auth/login with the cookie + token
  const loginRes = await app.inject({
    method: 'POST',
    url: '/auth/login',
    headers: { cookie: sessionCookie, 'x-csrf-token': csrfToken },
    payload: { email, password }
  });
  if (loginRes.statusCode !== 200) {
    throw new Error(`login failed for ${email}: ${loginRes.statusCode} ${loginRes.body}`);
  }
  const newSet = loginRes.headers['set-cookie'];
  const newCookies = normalizeHeader(newSet);
  const finalCookie =
    newCookies.length > 0 ? newCookies.map((c) => c.split(';')[0]).join('; ') : sessionCookie;

  return { cookie: finalCookie, csrfToken };
}
