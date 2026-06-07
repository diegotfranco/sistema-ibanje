import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import {
  useMinutes,
  useMinuteById,
  useCreateMinute,
  useSuggestedMinuteNumber,
  useMeetingAttendersPresent,
  useSetMeetingAttendersPresent,
  useUpdatePendingVersion,
  useEditApprovedMinute,
  useApproveMinute,
  useDeleteMinute,
  useFinalizeDraft,
  useUpdateMinute,
  useSignMinute
} from './useMinutes';
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

describe('useMinutes', () => {
  it('fetches minutes list', async () => {
    const mockMinutes = [{ id: 1, number: '001', title: 'Reunião 1', status: 'aprovada' as const }];
    server.use(
      http.get(`${BASE}/minutes`, () =>
        HttpResponse.json({ data: mockMinutes, total: 1, page: 1, limit: 30, totalPages: 1 })
      )
    );

    const { result } = renderHook(() => useMinutes(), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toEqual(mockMinutes);
  });
});

describe('useMinuteById', () => {
  it('fetches minute by id', async () => {
    const mockMinute = { id: 1, number: '001', title: 'Reunião 1', status: 'aprovada' as const };
    server.use(http.get(`${BASE}/minutes/1`, () => HttpResponse.json(mockMinute)));

    const { result } = renderHook(() => useMinuteById(1), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockMinute);
  });
});

describe('useCreateMinute', () => {
  it('creates a minute', async () => {
    const mockMinute = { id: 1, number: '001', title: 'Reunião 1', status: 'rascunho' as const };
    server.use(
      csrfHandler(),
      http.post(`${BASE}/minutes`, () => HttpResponse.json(mockMinute, { status: 201 }))
    );

    const { result } = renderHook(() => useCreateMinute(), { wrapper: wrapper() });

    result.current.mutate({ meetingId: 1, minuteNumber: '001' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockMinute);
  });
});

describe('useSuggestedMinuteNumber', () => {
  it('fetches suggested minute number when enabled', async () => {
    server.use(
      http.get(`${BASE}/minutes/suggested-number`, () => HttpResponse.json({ value: '002' }))
    );

    const { result } = renderHook(() => useSuggestedMinuteNumber(true), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.value).toBe('002');
  });

  it('does not fetch when disabled', async () => {
    const { result } = renderHook(() => useSuggestedMinuteNumber(false), { wrapper: wrapper() });

    expect(result.current.status).toBe('pending');
  });
});

describe('useMeetingAttendersPresent', () => {
  it('fetches meeting attenders when meetingId is provided', async () => {
    const mockAttenders = { data: [{ id: 1, name: 'João' }] };
    server.use(
      http.get(`${BASE}/minutes/meetings/5/attenders-present`, () =>
        HttpResponse.json(mockAttenders)
      )
    );

    const { result } = renderHook(() => useMeetingAttendersPresent(5), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toEqual(mockAttenders.data);
  });

  it('does not fetch when meetingId is null', async () => {
    const { result } = renderHook(() => useMeetingAttendersPresent(null), { wrapper: wrapper() });

    expect(result.current.status).toBe('pending');
  });
});

describe('useSetMeetingAttendersPresent', () => {
  it('updates meeting attenders', async () => {
    server.use(
      csrfHandler(),
      http.put(`${BASE}/minutes/meetings/5/attenders-present`, () =>
        HttpResponse.json({ success: true })
      )
    );

    const { result } = renderHook(() => useSetMeetingAttendersPresent(5), { wrapper: wrapper() });

    result.current.mutate([1, 2, 3]);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe('useUpdatePendingVersion', () => {
  it('updates pending minute version', async () => {
    const mockMinute = { id: 1, status: 'rascunho' as const };
    server.use(
      csrfHandler(),
      http.patch(`${BASE}/minutes/1/pending`, () => HttpResponse.json(mockMinute))
    );

    const { result } = renderHook(() => useUpdatePendingVersion(1), { wrapper: wrapper() });

    result.current.mutate({ content: { test: true } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe('useEditApprovedMinute', () => {
  it('creates new version of approved minute', async () => {
    const mockMinute = { id: 1, status: 'rascunho' as const };
    server.use(
      csrfHandler(),
      http.post(`${BASE}/minutes/1/edit-approved`, () => HttpResponse.json(mockMinute))
    );

    const { result } = renderHook(() => useEditApprovedMinute(1), { wrapper: wrapper() });

    result.current.mutate({ content: {}, reasonForChange: 'Correção' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe('useApproveMinute', () => {
  it('approves a minute', async () => {
    const mockMinute = { id: 1, status: 'aprovada' as const };
    server.use(
      csrfHandler(),
      http.post(`${BASE}/minutes/1/approve`, () => HttpResponse.json(mockMinute))
    );

    const { result } = renderHook(() => useApproveMinute(1), { wrapper: wrapper() });

    result.current.mutate({ approvedAtMeetingId: 1 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe('useDeleteMinute', () => {
  it('deletes a minute', async () => {
    server.use(
      csrfHandler(),
      http.delete(`${BASE}/minutes/1`, () => HttpResponse.json({}, { status: 204 }))
    );

    const { result } = renderHook(() => useDeleteMinute(), { wrapper: wrapper() });

    result.current.mutate(1);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe('useFinalizeDraft', () => {
  it('finalizes a minute draft', async () => {
    const mockMinute = { id: 1, status: 'pendente' as const };
    server.use(
      csrfHandler(),
      http.post(`${BASE}/minutes/1/finalize-draft`, () => HttpResponse.json(mockMinute))
    );

    const { result } = renderHook(() => useFinalizeDraft(1), { wrapper: wrapper() });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe('useUpdateMinute', () => {
  it('updates minute details', async () => {
    const mockMinute = { id: 1, title: 'Updated Title', status: 'rascunho' as const };
    server.use(
      csrfHandler(),
      http.patch(`${BASE}/minutes/1`, () => HttpResponse.json(mockMinute))
    );

    const { result } = renderHook(() => useUpdateMinute(1), { wrapper: wrapper() });

    result.current.mutate({ presidingPastorName: 'Pr. João' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe('useSignMinute', () => {
  it('uploads signed minute document', async () => {
    const mockMinute = { id: 1, status: 'assinada' as const };
    server.use(
      csrfHandler(),
      http.post(`${BASE}/minutes/1/sign`, () => HttpResponse.json(mockMinute))
    );

    const { result } = renderHook(() => useSignMinute(1), { wrapper: wrapper() });

    const file = new File(['test'], 'signature.pdf', { type: 'application/pdf' });
    result.current.mutate(file);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
