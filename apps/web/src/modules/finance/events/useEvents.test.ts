import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import { useEvents, useEventMutations } from './useEvents';
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

describe('useEvents', () => {
  it('fetches events with default pagination', async () => {
    const mockEvents = [
      {
        eventId: 1,
        eventTitle: 'Evento 1',
        startTime: '2024-01-15T08:00:00Z',
        endTime: '2024-01-15T10:00:00Z',
        status: 'ativo'
      }
    ];
    server.use(
      http.get(`${BASE}/events`, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('page')).toBe('1');
        expect(url.searchParams.get('limit')).toBe('20');
        return HttpResponse.json({ data: mockEvents, total: 1, page: 1, limit: 20, totalPages: 1 });
      })
    );

    const { result } = renderHook(() => useEvents(), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toEqual(mockEvents);
  });

  it('fetches events with custom page and limit', async () => {
    const mockEvents = [
      {
        eventId: 2,
        eventTitle: 'Evento 2',
        startTime: '2024-02-15T08:00:00Z',
        endTime: '2024-02-15T10:00:00Z',
        status: 'ativo'
      }
    ];
    server.use(
      http.get(`${BASE}/events`, ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('page') === '2' && url.searchParams.get('limit') === '50') {
          return HttpResponse.json({
            data: mockEvents,
            total: 1,
            page: 2,
            limit: 50,
            totalPages: 1
          });
        }
        return HttpResponse.json({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 });
      })
    );

    const { result } = renderHook(() => useEvents({ page: 2, limit: 50 }), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toEqual(mockEvents);
  });

  it('fetches events with status filter', async () => {
    const mockEvents = [
      {
        eventId: 3,
        eventTitle: 'Evento 3',
        startTime: '2024-03-15T08:00:00Z',
        endTime: '2024-03-15T10:00:00Z',
        status: 'inativo'
      }
    ];
    server.use(
      http.get(`${BASE}/events`, ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('status') === 'inativo') {
          return HttpResponse.json({
            data: mockEvents,
            total: 1,
            page: 1,
            limit: 20,
            totalPages: 1
          });
        }
        return HttpResponse.json({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 });
      })
    );

    const { result } = renderHook(() => useEvents({ status: 'inativo' }), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toEqual(mockEvents);
  });
});

describe('useEventMutations', () => {
  it('creates an event', async () => {
    const mockEvent = {
      eventId: 4,
      eventTitle: 'Novo Evento',
      startTime: '2024-04-15T08:00:00Z',
      endTime: '2024-04-15T10:00:00Z',
      status: 'ativo'
    };
    server.use(
      csrfHandler(),
      http.post(`${BASE}/events`, () => HttpResponse.json(mockEvent, { status: 201 }))
    );

    const { result } = renderHook(() => useEventMutations(), { wrapper: wrapper() });

    result.current.create.mutate({
      title: 'Novo Evento',
      startTime: '08:00',
      endTime: '10:00'
    });

    await waitFor(() => expect(result.current.create.isSuccess).toBe(true));
  });

  it('updates an event', async () => {
    const mockEvent = {
      eventId: 1,
      eventTitle: 'Evento Atualizado',
      startTime: '2024-01-15T09:00:00Z',
      endTime: '2024-01-15T11:00:00Z',
      status: 'ativo'
    };
    server.use(
      csrfHandler(),
      http.patch(`${BASE}/events/1`, () => HttpResponse.json(mockEvent))
    );

    const { result } = renderHook(() => useEventMutations(), { wrapper: wrapper() });

    result.current.update.mutate({ id: 1, body: { title: 'Evento Atualizado' } });

    await waitFor(() => expect(result.current.update.isSuccess).toBe(true));
  });

  it('removes an event', async () => {
    server.use(
      csrfHandler(),
      http.delete(`${BASE}/events/1`, () => HttpResponse.json({}, { status: 204 }))
    );

    const { result } = renderHook(() => useEventMutations(), { wrapper: wrapper() });

    result.current.remove.mutate(1);

    await waitFor(() => expect(result.current.remove.isSuccess).toBe(true));
  });
});
