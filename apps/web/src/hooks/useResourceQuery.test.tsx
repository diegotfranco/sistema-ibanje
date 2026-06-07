import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import { useResourceList } from './useResourceQuery';
import { invalidateCsrfToken } from '@/lib/api';

const BASE = 'http://localhost/api';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  invalidateCsrfToken();
});
afterAll(() => server.close());

function wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

describe('useResourceList', () => {
  it('applies the default limit of 30 and merges extra params into the querystring', async () => {
    let seenUrl = '';
    server.use(
      http.get(`${BASE}/payment-methods`, ({ request }) => {
        seenUrl = new URL(request.url).search;
        return HttpResponse.json({ data: [], total: 0, page: 1, limit: 30, totalPages: 0 });
      })
    );

    const { result } = renderHook(
      () => useResourceList('/payment-methods', ['payment-methods'], { status: 'ativo' }),
      { wrapper: wrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const params = new URLSearchParams(seenUrl);
    expect(params.get('limit')).toBe('30');
    expect(params.get('status')).toBe('ativo');
  });

  it('lets an explicit limit override the default', async () => {
    let seenUrl = '';
    server.use(
      http.get(`${BASE}/events`, ({ request }) => {
        seenUrl = new URL(request.url).search;
        return HttpResponse.json({ data: [], total: 0, page: 1, limit: 200, totalPages: 0 });
      })
    );

    const { result } = renderHook(() => useResourceList('/events', ['events'], { limit: 200 }), {
      wrapper: wrapper()
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(new URLSearchParams(seenUrl).get('limit')).toBe('200');
  });

  it('omits undefined/empty params from the querystring', async () => {
    let seenUrl = '';
    server.use(
      http.get(`${BASE}/attenders`, ({ request }) => {
        seenUrl = new URL(request.url).search;
        return HttpResponse.json({ data: [], total: 0, page: 1, limit: 30, totalPages: 0 });
      })
    );

    const { result } = renderHook(
      () => useResourceList('/attenders', ['attenders'], { q: undefined, status: '' }),
      { wrapper: wrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const params = new URLSearchParams(seenUrl);
    expect(params.has('q')).toBe(false);
    expect(params.has('status')).toBe(false);
  });
});
