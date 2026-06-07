import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { Module, type MeResponse, type PermissionMap } from '@sistema-ibanje/shared';
import { invalidateCsrfToken } from '@/lib/api';

// Shared MSW utilities for component/page tests. Vitest isolates each test file, so we create one
// server PER FILE via `setupTestServer()` (no global server → no dual-interceptor conflicts) and
// register its lifecycle in one call. Handler/permission factories below remove the boilerplate of
// re-declaring the reference-data fan-out and an authed `/auth/me` in every page test.

export const API = 'http://localhost/api';

const ALL_MODULES = Object.values(Module);
// Bitmask 0b111111 = View|Create|Update|Delete|Review|Report, i.e. every action on every module.
const ALL_ACTIONS = 0b111111;

/** A PermissionMap granting every action on every module — the default "staff can do anything" user. */
export function fullPermissions(): PermissionMap {
  return Object.fromEntries(ALL_MODULES.map((m) => [m, ALL_ACTIONS]));
}

/** A complete MeResponse; pass overrides (e.g. `{ permissions: {} }` for a powerless user). */
export function meResponse(overrides: Partial<MeResponse> = {}): MeResponse {
  return {
    id: 1,
    name: 'Test User',
    email: 'test@email.com',
    role: 'Administrador',
    status: 'ativo',
    permissions: fullPermissions(),
    attenderId: null,
    isMember: false,
    ...overrides
  };
}

/** A paginated list envelope matching the API's `{ data, total, page, limit, totalPages }`. */
export function paginated<T>(data: T[], limit = 200) {
  return { data, total: data.length, page: 1, limit, totalPages: data.length ? 1 : 0 };
}

/** GET /auth/me handler (full permissions by default). */
export function meHandler(overrides: Partial<MeResponse> = {}) {
  return http.get(`${API}/auth/me`, () => HttpResponse.json(meResponse(overrides)));
}

/** GET handler returning a paginated list for `path` (relative, e.g. '/payment-methods'). */
export function listHandler<T>(path: string, data: T[] = []) {
  return http.get(`${API}${path}`, () => HttpResponse.json(paginated(data)));
}

/** GET /auth/csrf-token handler (mutations fetch this first). */
export function csrfHandler(token = 'tok-test') {
  return http.get(`${API}/auth/csrf-token`, () => HttpResponse.json({ csrfToken: token }));
}

/**
 * The reference-data lookups most forms/pages fan out to on mount, all empty by default, plus an
 * authed `/auth/me` and a csrf token. Spread into `server.use(...referenceHandlers())` and override
 * individual endpoints afterwards with `server.use(listHandler('/payment-methods', rows))`.
 */
export function referenceHandlers() {
  return [
    meHandler(),
    csrfHandler(),
    listHandler('/income-categories'),
    listHandler('/expense-categories'),
    listHandler('/payment-methods'),
    listHandler('/designated-funds'),
    listHandler('/attenders'),
    listHandler('/events'),
    listHandler('/income-entries'),
    listHandler('/expense-entries')
  ];
}

/**
 * Creates an MSW server scoped to the calling test file and wires its lifecycle (listen / reset +
 * csrf reset per test / close). Returns the server so the test can `server.use(...)` per case.
 */
export function setupTestServer(opts: { onUnhandledRequest?: 'bypass' | 'warn' | 'error' } = {}) {
  const server = setupServer();
  beforeAll(() => server.listen({ onUnhandledRequest: opts.onUnhandledRequest ?? 'bypass' }));
  afterEach(() => {
    server.resetHandlers();
    invalidateCsrfToken();
  });
  afterAll(() => server.close());
  return server;
}
