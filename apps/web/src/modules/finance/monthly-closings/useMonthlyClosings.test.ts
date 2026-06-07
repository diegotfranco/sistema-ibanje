import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import {
  useMonthlyClosings,
  useMonthlyClosingYears,
  useMonthlyClosingById,
  useCreateMonthlyClosing,
  useRemoveMonthlyClosing,
  useClosingTransition
} from './useMonthlyClosings';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { invalidateCsrfToken } from '@/lib/api';

const BASE = 'http://localhost/api';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  invalidateCsrfToken();
});
afterAll(() => server.close());

function csrfHandler(token = 'tok-test') {
  return http.get(`${BASE}/auth/csrf-token`, () => HttpResponse.json({ csrfToken: token }));
}

function wrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
  });
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, createElement(MemoryRouter, {}, children));
}

describe('useMonthlyClosings', () => {
  it('fetches closings without filters', async () => {
    const mockClosings = [{ id: 1, yearMonth: '202301', status: 'aberto' as const }];
    server.use(
      http.get(`${BASE}/monthly-closings`, () =>
        HttpResponse.json({ data: mockClosings, total: 1, page: 1, limit: 30, totalPages: 1 })
      )
    );

    const { result } = renderHook(() => useMonthlyClosings(), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toEqual(mockClosings);
  });

  it('fetches closings with year filter', async () => {
    const mockClosings = [{ id: 1, yearMonth: '202301', status: 'aberto' as const }];
    server.use(
      http.get(`${BASE}/monthly-closings`, ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('year') === '2023') {
          return HttpResponse.json({
            data: mockClosings,
            total: 1,
            page: 1,
            limit: 30,
            totalPages: 1
          });
        }
        return HttpResponse.json({ data: [], total: 0, page: 1, limit: 30, totalPages: 0 });
      })
    );

    const { result } = renderHook(() => useMonthlyClosings({ year: 2023 }), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toEqual(mockClosings);
  });

  it('fetches closings with page filter', async () => {
    const mockClosings = [{ id: 2, yearMonth: '202302', status: 'aberto' as const }];
    server.use(
      http.get(`${BASE}/monthly-closings`, ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('page') === '2') {
          return HttpResponse.json({
            data: mockClosings,
            total: 2,
            page: 2,
            limit: 30,
            totalPages: 1
          });
        }
        return HttpResponse.json({ data: [], total: 2, page: 1, limit: 30, totalPages: 2 });
      })
    );

    const { result } = renderHook(() => useMonthlyClosings({ page: 2 }), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.page).toBe(2);
  });
});

describe('useMonthlyClosingYears', () => {
  it('fetches available years', async () => {
    server.use(
      http.get(`${BASE}/monthly-closings/years`, () =>
        HttpResponse.json({ years: [2022, 2023, 2024] })
      )
    );

    const { result } = renderHook(() => useMonthlyClosingYears(), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.years).toEqual([2022, 2023, 2024]);
  });
});

describe('useMonthlyClosingById', () => {
  it('fetches closing by id', async () => {
    const mockClosing = { id: 1, yearMonth: '202301', status: 'aberto' as const };
    server.use(http.get(`${BASE}/monthly-closings/1`, () => HttpResponse.json(mockClosing)));

    const { result } = renderHook(() => useMonthlyClosingById(1), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockClosing);
  });
});

describe('useCreateMonthlyClosing', () => {
  it('creates a new closing', async () => {
    const mockClosing = { id: 2, yearMonth: '202302', status: 'aberto' as const };
    server.use(
      csrfHandler(),
      http.post(`${BASE}/monthly-closings`, () => HttpResponse.json(mockClosing, { status: 201 }))
    );

    const { result } = renderHook(() => useCreateMonthlyClosing(), { wrapper: wrapper() });

    result.current.mutate({ periodYear: 2023, periodMonth: 2 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe('useRemoveMonthlyClosing', () => {
  it('removes a closing', async () => {
    server.use(
      csrfHandler(),
      http.delete(`${BASE}/monthly-closings/1`, () => HttpResponse.json({}, { status: 204 }))
    );

    const { result } = renderHook(() => useRemoveMonthlyClosing(), { wrapper: wrapper() });

    result.current.mutate(1);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe('useClosingTransition', () => {
  it('submits a closing for review', async () => {
    server.use(
      csrfHandler(),
      http.post(`${BASE}/monthly-closings/1/submit`, () =>
        HttpResponse.json({ id: 1, status: 'submetido' as const })
      )
    );

    const { result } = renderHook(() => useClosingTransition(), { wrapper: wrapper() });

    result.current.mutate({ id: 1, action: 'submit', notes: 'Pronto para revisão' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('approves a closing', async () => {
    server.use(
      csrfHandler(),
      http.post(`${BASE}/monthly-closings/1/approve`, () =>
        HttpResponse.json({ id: 1, status: 'aprovado' as const })
      )
    );

    const { result } = renderHook(() => useClosingTransition(), { wrapper: wrapper() });

    result.current.mutate({ id: 1, action: 'approve', notes: 'Aprovado' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('rejects a closing', async () => {
    server.use(
      csrfHandler(),
      http.post(`${BASE}/monthly-closings/1/reject`, () =>
        HttpResponse.json({ id: 1, status: 'aberto' as const })
      )
    );

    const { result } = renderHook(() => useClosingTransition(), { wrapper: wrapper() });

    result.current.mutate({ id: 1, action: 'reject', notes: 'Precisa revisar' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('closes a period', async () => {
    server.use(
      csrfHandler(),
      http.post(`${BASE}/monthly-closings/1/close`, () =>
        HttpResponse.json({ id: 1, status: 'fechado' as const })
      )
    );

    const { result } = renderHook(() => useClosingTransition(), { wrapper: wrapper() });

    result.current.mutate({ id: 1, action: 'close' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('reopens a closing', async () => {
    server.use(
      csrfHandler(),
      http.post(`${BASE}/monthly-closings/1/reopen`, () =>
        HttpResponse.json({ id: 1, status: 'aberto' as const })
      )
    );

    const { result } = renderHook(() => useClosingTransition(), { wrapper: wrapper() });

    result.current.mutate({ id: 1, action: 'reopen' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('resubmits a closing', async () => {
    server.use(
      csrfHandler(),
      http.post(`${BASE}/monthly-closings/1/resubmit`, () =>
        HttpResponse.json({ id: 1, status: 'submetido' as const })
      )
    );

    const { result } = renderHook(() => useClosingTransition(), { wrapper: wrapper() });

    result.current.mutate({ id: 1, action: 'resubmit', notes: 'Reabrindo' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
