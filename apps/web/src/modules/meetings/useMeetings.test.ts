import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import { useMeetings, useMeetingMutations, useSetAgenda } from './useMeetings';
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

describe('useMeetings', () => {
  it('fetches meetings list', async () => {
    const mockMeetings = [
      { id: 1, title: 'Reunião 1', date: '2024-01-15', startTime: '18:00', endTime: '19:00' }
    ];
    server.use(
      http.get(`${BASE}/meetings`, () =>
        HttpResponse.json({ data: mockMeetings, total: 1, page: 1, limit: 30, totalPages: 1 })
      )
    );

    const { result } = renderHook(() => useMeetings(), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toEqual(mockMeetings);
  });
});

describe('useMeetingMutations', () => {
  it('creates a meeting', async () => {
    const mockMeeting = {
      id: 2,
      title: 'Nova Reunião',
      date: '2024-01-20',
      startTime: '19:00',
      endTime: '20:00'
    };
    server.use(
      csrfHandler(),
      http.post(`${BASE}/meetings`, () => HttpResponse.json(mockMeeting, { status: 201 }))
    );

    const { result } = renderHook(() => useMeetingMutations(), { wrapper: wrapper() });

    result.current.create.mutate({
      meetingDate: '2024-01-20',
      type: 'ordinária',
      isPublic: true
    });

    await waitFor(() => expect(result.current.create.isSuccess).toBe(true));
  });

  it('updates a meeting', async () => {
    const mockMeeting = {
      id: 1,
      title: 'Reunião Atualizada',
      date: '2024-01-15',
      startTime: '18:00',
      endTime: '19:30'
    };
    server.use(
      csrfHandler(),
      http.patch(`${BASE}/meetings/1`, () => HttpResponse.json(mockMeeting))
    );

    const { result } = renderHook(() => useMeetingMutations(), { wrapper: wrapper() });

    result.current.update.mutate({ id: 1, body: { meetingDate: '2024-01-15' } });

    await waitFor(() => expect(result.current.update.isSuccess).toBe(true));
  });

  it('removes a meeting', async () => {
    server.use(
      csrfHandler(),
      http.delete(`${BASE}/meetings/1`, () => HttpResponse.json({}, { status: 204 }))
    );

    const { result } = renderHook(() => useMeetingMutations(), { wrapper: wrapper() });

    result.current.remove.mutate(1);

    await waitFor(() => expect(result.current.remove.isSuccess).toBe(true));
  });
});

describe('useSetAgenda', () => {
  it('saves agenda items for a meeting', async () => {
    const mockMeeting = {
      id: 1,
      title: 'Reunião 1',
      date: '2024-01-15',
      startTime: '18:00',
      endTime: '19:00'
    };
    server.use(
      csrfHandler(),
      http.put(`${BASE}/meetings/1/agenda-items`, () => HttpResponse.json(mockMeeting))
    );

    const { result } = renderHook(() => useSetAgenda(), { wrapper: wrapper() });

    const items = [
      { order: 1, title: 'Assunto 1', duration: '15 min' },
      { order: 2, title: 'Assunto 2', duration: '20 min' }
    ];

    result.current.mutate({ id: 1, items });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
