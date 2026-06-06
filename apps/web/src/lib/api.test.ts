import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { api, ApiError, rateLimitMessage, invalidateCsrfToken, setAuthErrorHandler } from './api';

const BASE = 'http://localhost/api';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  invalidateCsrfToken();
  setAuthErrorHandler(null);
});
afterAll(() => server.close());

// Every mutation first fetches a CSRF token; register the happy-path handler by default.
function csrfHandler(token = 'tok-123') {
  return http.get(`${BASE}/auth/csrf-token`, () => HttpResponse.json({ csrfToken: token }));
}

describe('api client', () => {
  describe('rateLimitMessage (pure)', () => {
    it('formats seconds, minutes and hours in pt-BR', () => {
      expect(rateLimitMessage(new ApiError(429, 'x', undefined, 1))).toContain('1 segundo');
      expect(rateLimitMessage(new ApiError(429, 'x', undefined, 30))).toContain('30 segundos');
      expect(rateLimitMessage(new ApiError(429, 'x', undefined, 120))).toContain('2 minutos');
      expect(rateLimitMessage(new ApiError(429, 'x', undefined, 7200))).toContain('2 horas');
    });

    it('uses the fallback when retryAfterSeconds is absent', () => {
      expect(rateLimitMessage(new ApiError(429, 'x'))).toMatch(/Muitas requisições/);
    });
  });

  describe('mutations', () => {
    it('sends x-csrf-token and an Idempotency-Key header', async () => {
      let seenCsrf: string | null = null;
      let seenIdem: string | null = null;
      server.use(
        csrfHandler(),
        http.post(`${BASE}/things`, ({ request }) => {
          seenCsrf = request.headers.get('x-csrf-token');
          seenIdem = request.headers.get('idempotency-key');
          return HttpResponse.json({ id: 1 }, { status: 201 });
        })
      );

      const res = await api.post<{ id: number }>('/things', { name: 'x' });
      expect(res).toEqual({ id: 1 });
      expect(seenCsrf).toBe('tok-123');
      expect(seenIdem).toBeTruthy();
    });

    it('on 403 clears the token, re-fetches it and retries once', async () => {
      let csrfFetches = 0;
      let postAttempts = 0;
      server.use(
        http.get(`${BASE}/auth/csrf-token`, () => {
          csrfFetches += 1;
          return HttpResponse.json({ csrfToken: `tok-${csrfFetches}` });
        }),
        http.post(`${BASE}/things`, () => {
          postAttempts += 1;
          if (postAttempts === 1) {
            return HttpResponse.json({ message: 'Invalid csrf token' }, { status: 403 });
          }
          return HttpResponse.json({ id: 2 }, { status: 201 });
        })
      );

      const res = await api.post<{ id: number }>('/things', {});
      expect(res).toEqual({ id: 2 });
      expect(postAttempts).toBe(2);
      expect(csrfFetches).toBe(2); // initial + refetch after 403
    });

    it('returns undefined for a 204 No Content response', async () => {
      server.use(
        csrfHandler(),
        http.delete(`${BASE}/things/1`, () => new HttpResponse(null, { status: 204 }))
      );
      await expect(api.delete('/things/1')).resolves.toBeUndefined();
    });
  });

  describe('fetchWithRetry', () => {
    it('retries on a 500 and succeeds on a later attempt', async () => {
      let attempts = 0;
      server.use(
        http.get(`${BASE}/flaky`, () => {
          attempts += 1;
          if (attempts < 2) return new HttpResponse(null, { status: 500 });
          return HttpResponse.json({ ok: true });
        })
      );

      const res = await api.get<{ ok: boolean }>('/flaky');
      expect(res).toEqual({ ok: true });
      expect(attempts).toBe(2);
    });

    it('retries on a network error (TypeError) then succeeds', async () => {
      let attempts = 0;
      server.use(
        http.get(`${BASE}/neterr`, () => {
          attempts += 1;
          if (attempts < 2) return HttpResponse.error(); // network-level failure
          return HttpResponse.json({ ok: true });
        })
      );

      const res = await api.get<{ ok: boolean }>('/neterr');
      expect(res).toEqual({ ok: true });
      expect(attempts).toBe(2);
    });
  });

  describe('error handling', () => {
    it('throws ApiError with retryAfterSeconds parsed from the Retry-After header (429)', async () => {
      server.use(
        http.get(`${BASE}/limited`, () =>
          HttpResponse.json(
            { message: 'rate limited' },
            { status: 429, headers: { 'Retry-After': '42' } }
          )
        )
      );

      await expect(api.get('/limited')).rejects.toMatchObject({
        status: 429,
        retryAfterSeconds: 42
      });
    });

    it('calls the auth-error handler on a 401 (non-login)', async () => {
      const onAuthError = vi.fn();
      setAuthErrorHandler(onAuthError);
      server.use(
        http.get(`${BASE}/secret`, () =>
          HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
        )
      );

      await expect(api.get('/secret')).rejects.toBeInstanceOf(ApiError);
      expect(onAuthError).toHaveBeenCalledOnce();
    });

    it('surfaces fieldErrors from the error envelope', async () => {
      server.use(
        csrfHandler(),
        http.post(`${BASE}/users`, () =>
          HttpResponse.json(
            { message: 'E-mail já cadastrado', fieldErrors: { email: 'E-mail já cadastrado' } },
            { status: 409 }
          )
        )
      );

      await expect(api.post('/users', {})).rejects.toMatchObject({
        status: 409,
        fieldErrors: { email: 'E-mail já cadastrado' }
      });
    });
  });
});
