import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import {
  useMembershipLetters,
  useMembershipLetterById,
  useCreateMembershipLetter,
  useUpdateMembershipLetter,
  useDeleteMembershipLetter,
  useRenderedMembershipLetter
} from './useMembershipLetters';
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

describe('useMembershipLetters', () => {
  it('fetches letters without filters', async () => {
    const mockLetters = [
      { id: 1, attenderId: 1, attenderName: 'João', type: 'transferencia', status: 'pendente' }
    ];
    server.use(
      http.get(`${BASE}/membership-letters`, () =>
        HttpResponse.json({
          data: mockLetters,
          total: 1,
          page: 1,
          limit: 30
        })
      )
    );

    const { result } = renderHook(() => useMembershipLetters(), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toEqual(mockLetters);
  });

  it('fetches letters with attenderId filter', async () => {
    const mockLetters = [
      { id: 1, attenderId: 5, attenderName: 'João', type: 'transferencia', status: 'pendente' }
    ];
    server.use(
      http.get(`${BASE}/membership-letters`, ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('attenderId') === '5') {
          return HttpResponse.json({
            data: mockLetters,
            total: 1,
            page: 1,
            limit: 30
          });
        }
        return HttpResponse.json({ data: [], total: 0, page: 1, limit: 30 });
      })
    );

    const { result } = renderHook(() => useMembershipLetters({ attenderId: 5 }), {
      wrapper: wrapper()
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toEqual(mockLetters);
  });

  it('fetches letters with type filter', async () => {
    const mockLetters = [
      { id: 2, attenderId: 1, attenderName: 'Maria', type: 'dimissao', status: 'pendente' }
    ];
    server.use(
      http.get(`${BASE}/membership-letters`, ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('type') === 'dimissao') {
          return HttpResponse.json({
            data: mockLetters,
            total: 1,
            page: 1,
            limit: 30
          });
        }
        return HttpResponse.json({ data: [], total: 0, page: 1, limit: 30 });
      })
    );

    const { result } = renderHook(() => useMembershipLetters({ type: 'dimissao' }), {
      wrapper: wrapper()
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toEqual(mockLetters);
  });

  it('fetches letters with pagination', async () => {
    const mockLetters = [
      {
        id: 31,
        attenderId: 31,
        attenderName: 'Pessoa 31',
        type: 'transferencia',
        status: 'pendente'
      }
    ];
    server.use(
      http.get(`${BASE}/membership-letters`, ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('page') === '2') {
          return HttpResponse.json({
            data: mockLetters,
            total: 31,
            page: 2,
            limit: 30
          });
        }
        return HttpResponse.json({ data: [], total: 31, page: 1, limit: 30 });
      })
    );

    const { result } = renderHook(() => useMembershipLetters({ page: 2 }), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.page).toBe(2);
  });
});

describe('useMembershipLetterById', () => {
  it('fetches letter by id', async () => {
    const mockLetter = {
      id: 1,
      attenderId: 1,
      attenderName: 'João',
      type: 'transferencia',
      status: 'pendente'
    };
    server.use(http.get(`${BASE}/membership-letters/1`, () => HttpResponse.json(mockLetter)));

    const { result } = renderHook(() => useMembershipLetterById(1), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockLetter);
  });

  it('does not fetch when id is null', async () => {
    const { result } = renderHook(() => useMembershipLetterById(null), { wrapper: wrapper() });

    expect(result.current.status).toBe('pending');
  });
});

describe('useCreateMembershipLetter', () => {
  it('creates a letter', async () => {
    const mockLetter = {
      id: 2,
      attenderId: 2,
      attenderName: 'Maria',
      type: 'transferencia',
      status: 'pendente'
    };
    server.use(
      csrfHandler(),
      http.post(`${BASE}/membership-letters`, () => HttpResponse.json(mockLetter, { status: 201 }))
    );

    const { result } = renderHook(() => useCreateMembershipLetter(), { wrapper: wrapper() });

    result.current.mutate({
      attenderId: 2,
      type: 'carta_de_transferência',
      letterDate: '2024-01-15',
      otherChurchName: 'Igreja Central',
      otherChurchCity: 'São Paulo'
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe('useUpdateMembershipLetter', () => {
  it('updates a letter', async () => {
    const mockLetter = {
      id: 1,
      attenderId: 1,
      attenderName: 'João',
      type: 'transferencia',
      status: 'aprovado'
    };
    server.use(
      csrfHandler(),
      http.patch(`${BASE}/membership-letters/1`, () => HttpResponse.json(mockLetter))
    );

    const { result } = renderHook(() => useUpdateMembershipLetter(), { wrapper: wrapper() });

    result.current.mutate({ id: 1, body: { otherChurchName: 'Igreja Atualizada' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe('useDeleteMembershipLetter', () => {
  it('deletes a letter', async () => {
    server.use(
      csrfHandler(),
      http.delete(`${BASE}/membership-letters/1`, () => HttpResponse.json({}, { status: 204 }))
    );

    const { result } = renderHook(() => useDeleteMembershipLetter(), { wrapper: wrapper() });

    result.current.mutate(1);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe('useRenderedMembershipLetter', () => {
  it('fetches rendered letter when enabled and id provided', async () => {
    server.use(
      http.get(`${BASE}/membership-letters/1/render`, () =>
        HttpResponse.json('<html>Letter HTML</html>', { headers: { 'content-type': 'text/html' } })
      )
    );

    const { result } = renderHook(() => useRenderedMembershipLetter(1, true), {
      wrapper: wrapper()
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('does not fetch when disabled', async () => {
    const { result } = renderHook(() => useRenderedMembershipLetter(1, false), {
      wrapper: wrapper()
    });

    expect(result.current.status).toBe('pending');
  });

  it('does not fetch when id is null', async () => {
    const { result } = renderHook(() => useRenderedMembershipLetter(null, true), {
      wrapper: wrapper()
    });

    expect(result.current.status).toBe('pending');
  });
});
