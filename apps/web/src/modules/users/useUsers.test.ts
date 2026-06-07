import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import { useUsers, useUserMutations, useUserPermissions, useSaveUserPermissions } from './useUsers';
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

describe('useUsers', () => {
  it('fetches users list', async () => {
    const mockUsers = [
      {
        id: 1,
        name: 'João',
        email: 'joao@test.com',
        status: 'ativo' as const,
        role: 'Administrador'
      }
    ];
    server.use(
      http.get(`${BASE}/users`, () =>
        HttpResponse.json({ data: mockUsers, total: 1, page: 1, limit: 30, totalPages: 1 })
      )
    );

    const { result } = renderHook(() => useUsers(), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toEqual(mockUsers);
  });
});

describe('useUserMutations', () => {
  it('creates a user', async () => {
    const mockUser = {
      id: 2,
      name: 'Maria',
      email: 'maria@test.com',
      status: 'pendente' as const,
      role: 'Membro'
    };
    server.use(
      csrfHandler(),
      http.post(`${BASE}/users`, () => HttpResponse.json(mockUser, { status: 201 }))
    );

    const { result } = renderHook(() => useUserMutations(1), { wrapper: wrapper() });

    result.current.create.mutate({ name: 'Maria', email: 'maria@test.com', roleId: 3 });

    await waitFor(() => expect(result.current.create.isSuccess).toBe(true));
  });

  it('updates a user', async () => {
    const mockUser = {
      id: 1,
      name: 'João Silva',
      email: 'joao@test.com',
      status: 'ativo' as const,
      role: 'Administrador'
    };
    server.use(
      csrfHandler(),
      http.patch(`${BASE}/users/1`, () => HttpResponse.json(mockUser))
    );

    const { result } = renderHook(() => useUserMutations(1), { wrapper: wrapper() });

    result.current.update.mutate({ id: 1, body: { name: 'João Silva' } });

    await waitFor(() => expect(result.current.update.isSuccess).toBe(true));
  });

  it('removes a user', async () => {
    server.use(
      csrfHandler(),
      http.delete(`${BASE}/users/2`, () => HttpResponse.json({}, { status: 204 }))
    );

    const { result } = renderHook(() => useUserMutations(1), { wrapper: wrapper() });

    result.current.remove.mutate(2);

    await waitFor(() => expect(result.current.remove.isSuccess).toBe(true));
  });

  it('approves a user', async () => {
    const mockUser = {
      id: 2,
      name: 'Maria',
      email: 'maria@test.com',
      status: 'ativo' as const,
      role: 'Membro'
    };
    server.use(
      csrfHandler(),
      http.patch(`${BASE}/users/2/approve`, () => HttpResponse.json(mockUser))
    );

    const { result } = renderHook(() => useUserMutations(1), { wrapper: wrapper() });

    result.current.approve.mutate(2);

    await waitFor(() => expect(result.current.approve.isSuccess).toBe(true));
  });

  it('identifies self correctly', () => {
    const { result } = renderHook(() => useUserMutations(5), { wrapper: wrapper() });

    expect(result.current.isSelf(5)).toBe(true);
    expect(result.current.isSelf(6)).toBe(false);
  });

  it('handles undefined currentUserId', () => {
    const { result } = renderHook(() => useUserMutations(undefined), { wrapper: wrapper() });

    expect(result.current.isSelf(1)).toBe(false);
  });
});

describe('useUserPermissions', () => {
  it('fetches user permissions when userId is provided', async () => {
    const mockPermissions = { Congregados: ['Acessar', 'Cadastrar'] };
    server.use(http.get(`${BASE}/users/1/permissions`, () => HttpResponse.json(mockPermissions)));

    const { result } = renderHook(() => useUserPermissions(1), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockPermissions);
  });

  it('does not fetch when userId is null', async () => {
    const { result } = renderHook(() => useUserPermissions(null), { wrapper: wrapper() });

    expect(result.current.status).toBe('pending');
  });
});

describe('useSaveUserPermissions', () => {
  it('saves user permissions', async () => {
    server.use(
      csrfHandler(),
      http.put(`${BASE}/users/1/permissions`, () => HttpResponse.json({}, { status: 204 }))
    );

    const { result } = renderHook(() => useSaveUserPermissions(1), { wrapper: wrapper() });

    const permissions = { Congregados: ['Acessar', 'Cadastrar'] };
    result.current.mutate(permissions);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
