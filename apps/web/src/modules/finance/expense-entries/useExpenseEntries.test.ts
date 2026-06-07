import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import {
  useExpenseEntries,
  useExpenseEntryById,
  useExpenseEntryMutations,
  useUploadReceipt,
  useDeleteReceipt
} from './useExpenseEntries';
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

describe('useExpenseEntries', () => {
  it('fetches expense entries with limit of 15', async () => {
    const mockEntries = [
      {
        id: 1,
        description: 'Material',
        amount: '100.00',
        date: '2024-01-15',
        category: 'Materiais'
      }
    ];
    server.use(
      http.get(`${BASE}/expense-entries`, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('limit')).toBe('15');
        return HttpResponse.json({
          data: mockEntries,
          total: 1,
          page: 1,
          limit: 15,
          totalPages: 1
        });
      })
    );

    const { result } = renderHook(() => useExpenseEntries(), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toEqual(mockEntries);
  });
});

describe('useExpenseEntryById', () => {
  it('fetches expense entry by id', async () => {
    const mockEntry = {
      id: 1,
      description: 'Material',
      amount: '100.00',
      date: '2024-01-15',
      category: 'Materiais'
    };
    server.use(http.get(`${BASE}/expense-entries/1`, () => HttpResponse.json(mockEntry)));

    const { result } = renderHook(() => useExpenseEntryById(1), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockEntry);
  });

  it('does not fetch when id is null', async () => {
    const { result } = renderHook(() => useExpenseEntryById(null), { wrapper: wrapper() });

    expect(result.current.status).toBe('pending');
  });

  it('does not fetch when id is 0 or negative', async () => {
    const { result } = renderHook(() => useExpenseEntryById(0), { wrapper: wrapper() });

    expect(result.current.status).toBe('pending');
  });
});

describe('useExpenseEntryMutations', () => {
  it('creates an expense entry', async () => {
    const mockEntry = {
      id: 2,
      description: 'Material',
      amount: '100.00',
      date: '2024-01-15',
      category: 'Materiais'
    };
    server.use(
      csrfHandler(),
      http.post(`${BASE}/expense-entries`, () => HttpResponse.json(mockEntry, { status: 201 }))
    );

    const { result } = renderHook(() => useExpenseEntryMutations(), { wrapper: wrapper() });

    result.current.create.mutate({
      date: '2024-01-15',
      amount: 100,
      total: 100,
      installment: 1,
      totalInstallments: 1,
      categoryId: 1,
      paymentMethodId: 1
    });

    await waitFor(() => expect(result.current.create.isSuccess).toBe(true));
  });

  it('updates an expense entry', async () => {
    const mockEntry = {
      id: 1,
      description: 'Updated',
      amount: '150.00',
      date: '2024-01-15',
      category: 'Materiais'
    };
    server.use(
      csrfHandler(),
      http.patch(`${BASE}/expense-entries/1`, () => HttpResponse.json(mockEntry))
    );

    const { result } = renderHook(() => useExpenseEntryMutations(), { wrapper: wrapper() });

    result.current.update.mutate({
      id: 1,
      body: { amount: 150, total: 150 }
    });

    await waitFor(() => expect(result.current.update.isSuccess).toBe(true));
  });

  it('deletes an expense entry', async () => {
    server.use(
      csrfHandler(),
      http.delete(`${BASE}/expense-entries/1`, () => HttpResponse.json({}, { status: 204 }))
    );

    const { result } = renderHook(() => useExpenseEntryMutations(), { wrapper: wrapper() });

    result.current.remove.mutate(1);

    await waitFor(() => expect(result.current.remove.isSuccess).toBe(true));
  });
});

describe('useUploadReceipt', () => {
  it('uploads a receipt for an expense entry', async () => {
    const mockEntry = { id: 1, receiptUrl: 'http://example.com/receipt.pdf' };
    server.use(
      csrfHandler(),
      http.post(`${BASE}/expense-entries/1/receipt`, () => HttpResponse.json(mockEntry))
    );

    const { result } = renderHook(() => useUploadReceipt(), { wrapper: wrapper() });

    const file = new File(['receipt data'], 'receipt.pdf', { type: 'application/pdf' });
    result.current.mutate({ id: 1, file });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe('useDeleteReceipt', () => {
  it('deletes a receipt from an expense entry', async () => {
    server.use(
      csrfHandler(),
      http.delete(`${BASE}/expense-entries/1/receipt`, () => HttpResponse.json({}, { status: 204 }))
    );

    const { result } = renderHook(() => useDeleteReceipt(), { wrapper: wrapper() });

    result.current.mutate(1);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
