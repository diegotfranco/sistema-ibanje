import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import { useRoles, useRoleMutations, useRolePermissions, useSaveRolePermissions } from './useRoles';
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

describe('useRoles', () => {
  it('fetches roles list', async () => {
    const mockRoles = [{ id: 1, name: 'Administrador', description: 'Admin role' }];
    server.use(
      http.get(`${BASE}/roles`, () =>
        HttpResponse.json({ data: mockRoles, total: 1, page: 1, limit: 30, totalPages: 1 })
      )
    );

    const { result } = renderHook(() => useRoles(), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toEqual(mockRoles);
  });
});

describe('useRoleMutations', () => {
  it('creates a role', async () => {
    const mockRole = { id: 2, name: 'Membro', description: 'Member role' };
    server.use(
      csrfHandler(),
      http.post(`${BASE}/roles`, () => HttpResponse.json(mockRole, { status: 201 }))
    );

    const { result } = renderHook(() => useRoleMutations(), { wrapper: wrapper() });

    result.current.create.mutate({ name: 'Membro', description: 'Member role' });

    await waitFor(() => expect(result.current.create.isSuccess).toBe(true));
  });

  it('updates a role', async () => {
    const mockRole = { id: 1, name: 'Administrador', description: 'Updated admin role' };
    server.use(
      csrfHandler(),
      http.patch(`${BASE}/roles/1`, () => HttpResponse.json(mockRole))
    );

    const { result } = renderHook(() => useRoleMutations(), { wrapper: wrapper() });

    result.current.update.mutate({ id: 1, body: { description: 'Updated admin role' } });

    await waitFor(() => expect(result.current.update.isSuccess).toBe(true));
  });

  it('removes a role', async () => {
    server.use(
      csrfHandler(),
      http.delete(`${BASE}/roles/2`, () => HttpResponse.json({}, { status: 204 }))
    );

    const { result } = renderHook(() => useRoleMutations(), { wrapper: wrapper() });

    result.current.remove.mutate(2);

    await waitFor(() => expect(result.current.remove.isSuccess).toBe(true));
  });
});

describe('useRolePermissions', () => {
  it('fetches role permissions when roleId is provided', async () => {
    const mockPermissions = [
      { moduleId: 1, moduleName: 'Congregados', permissionId: 1, permissionName: 'Acessar' }
    ];
    server.use(http.get(`${BASE}/roles/1/permissions`, () => HttpResponse.json(mockPermissions)));

    const { result } = renderHook(() => useRolePermissions(1), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockPermissions);
  });

  it('does not fetch when roleId is null', async () => {
    const { result } = renderHook(() => useRolePermissions(null), { wrapper: wrapper() });

    expect(result.current.status).toBe('pending');
  });
});

describe('useSaveRolePermissions', () => {
  it('saves role permissions', async () => {
    server.use(
      csrfHandler(),
      http.put(`${BASE}/roles/1/permissions`, () => HttpResponse.json({}, { status: 204 }))
    );

    const { result } = renderHook(() => useSaveRolePermissions(1), { wrapper: wrapper() });

    const permissions = [{ moduleId: 1, permissionId: 1 }];
    result.current.mutate(permissions);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
