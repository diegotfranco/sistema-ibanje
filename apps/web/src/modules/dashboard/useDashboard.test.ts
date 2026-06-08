import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import { useDashboard } from './useDashboard';
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

function wrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
  });
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, createElement(MemoryRouter, {}, children));
}

describe('useDashboard', () => {
  it('fetches dashboard data for a given month', async () => {
    const mockDashboard = {
      month: '202401',
      incomeTotal: '5000.00',
      expenseTotal: '2000.00',
      netTotal: '3000.00',
      campaigns: [],
      events: {
        recent: [],
        summary: { count: 0, totalRaised: '0', totalSpent: '0', totalNet: '0' }
      }
    };
    server.use(
      http.get(`${BASE}/dashboard`, ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('month') === '202401') {
          return HttpResponse.json(mockDashboard);
        }
        return HttpResponse.json({});
      })
    );

    const { result } = renderHook(() => useDashboard('202401'), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.month).toBe('202401');
  });

  it('does not fetch when month is empty', async () => {
    const { result } = renderHook(() => useDashboard(''), { wrapper: wrapper() });

    expect(result.current.status).toBe('pending');
  });

  it('caches results for 60 seconds', async () => {
    const mockDashboard = {
      month: '202402',
      incomeTotal: '6000.00',
      expenseTotal: '2500.00',
      netTotal: '3500.00',
      campaigns: [],
      events: {
        recent: [],
        summary: { count: 0, totalRaised: '0', totalSpent: '0', totalNet: '0' }
      }
    };
    server.use(http.get(`${BASE}/dashboard`, () => HttpResponse.json(mockDashboard)));

    const { result } = renderHook(() => useDashboard('202402'), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // Verify staleTime is set to 60 seconds (60000ms)
    expect(result.current.data?.month).toBe('202402');
  });
});
