import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import {
  useMinuteTemplates,
  useMinuteTemplateById,
  useCreateMinuteTemplate,
  useUpdateMinuteTemplate,
  useDeleteMinuteTemplate
} from './useMinuteTemplates';
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

describe('useMinuteTemplates', () => {
  it('fetches minute templates', async () => {
    const mockTemplates = [
      { id: 1, name: 'Reunião Ordinária', content: 'Template 1', type: 'default' }
    ];
    server.use(http.get(`${BASE}/minute-templates`, () => HttpResponse.json(mockTemplates)));

    const { result } = renderHook(() => useMinuteTemplates(), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockTemplates);
  });

  it('handles empty templates list', async () => {
    server.use(http.get(`${BASE}/minute-templates`, () => HttpResponse.json([])));

    const { result } = renderHook(() => useMinuteTemplates(), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});

describe('useMinuteTemplateById', () => {
  it('fetches template by id', async () => {
    const mockTemplate = {
      id: 1,
      name: 'Reunião Ordinária',
      content: 'Template 1',
      type: 'default'
    };
    server.use(http.get(`${BASE}/minute-templates/1`, () => HttpResponse.json(mockTemplate)));

    const { result } = renderHook(() => useMinuteTemplateById(1), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockTemplate);
  });
});

describe('useCreateMinuteTemplate', () => {
  it('creates a template', async () => {
    const mockTemplate = { id: 2, name: 'Nova Template', content: 'Novo conteúdo', type: 'custom' };
    server.use(
      csrfHandler(),
      http.post(`${BASE}/minute-templates`, () => HttpResponse.json(mockTemplate, { status: 201 }))
    );

    const { result } = renderHook(() => useCreateMinuteTemplate(), { wrapper: wrapper() });

    result.current.mutate({
      meetingType: 'ordinária',
      name: 'Nova Template',
      content: {},
      isDefault: false,
      defaultAgendaItems: []
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe('useUpdateMinuteTemplate', () => {
  it('updates a template', async () => {
    const mockTemplate = {
      id: 1,
      name: 'Reunião Ordinária Atualizada',
      content: 'Conteúdo atualizado',
      type: 'default'
    };
    server.use(
      csrfHandler(),
      http.put(`${BASE}/minute-templates/1`, () => HttpResponse.json(mockTemplate))
    );

    const { result } = renderHook(() => useUpdateMinuteTemplate(1), { wrapper: wrapper() });

    result.current.mutate({ name: 'Reunião Ordinária Atualizada', content: {} });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe('useDeleteMinuteTemplate', () => {
  it('deletes a template', async () => {
    server.use(
      csrfHandler(),
      http.delete(`${BASE}/minute-templates/1`, () => HttpResponse.json({}, { status: 204 }))
    );

    const { result } = renderHook(() => useDeleteMinuteTemplate(), { wrapper: wrapper() });

    result.current.mutate(1);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
