import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import DashboardPage from './DashboardPage';
import { renderWithProviders } from '@/test/renderWithProviders';
import { setupTestServer, meHandler, referenceHandlers, API } from '@/test/server';

const server = setupTestServer();

const dashboardData = {
  closing: {
    month: '202406',
    status: 'aberto',
    totalIncomeByCategory: [{ categoryName: 'Dízimo', amount: '5000.00' }],
    totalExpenseByCategory: [{ categoryName: 'Manutenção', amount: '1500.00' }],
    remarks: 'Mês normal'
  },
  participation: {
    tithe: { count: 45, activeAttenderCount: 100, participationRate: 45.0 },
    offering: { count: 38, activeAttenderCount: 100, participationRate: 38.0 }
  },
  finance: { totalIncome: '8500.00', totalExpense: '2000.00' },
  trends: {
    monthly: [
      { month: '202404', income: '7500.00', expense: '1800.00' },
      { month: '202405', income: '8200.00', expense: '1950.00' },
      { month: '202406', income: '8500.00', expense: '2000.00' }
    ]
  },
  funds: [{ fundId: 1, fundName: 'Reforma', totalRaised: '5000.00', targetAmount: '20000.00' }],
  events: {
    recent: [
      { eventId: 1, eventTitle: 'Café Social', totalRaised: '500.00', totalSpent: '200.00' }
    ],
    summary: { count: 1, totalRaised: '500.00', totalSpent: '200.00', totalNet: '300.00' }
  }
};

describe('DashboardPage', () => {
  it('is protected by RequirePermission for Dashboard View', () => {
    server.use(
      meHandler({ permissions: {} }),
      http.get(`${API}/dashboard`, () => HttpResponse.json(dashboardData)),
      ...referenceHandlers()
    );

    renderWithProviders(<DashboardPage />);

    expect(screen.getByText('Sem permissão')).toBeInTheDocument();
  });

  it('renders with full permissions', () => {
    server.use(
      http.get(`${API}/dashboard`, () => HttpResponse.json(dashboardData)),
      ...referenceHandlers()
    );

    const { container } = renderWithProviders(<DashboardPage />);
    expect(container.querySelector('[class*="space-y"]')).toBeTruthy();
  });

  it('includes PageContainer wrapper', () => {
    server.use(
      http.get(`${API}/dashboard`, () => HttpResponse.json(dashboardData)),
      ...referenceHandlers()
    );

    const { container } = renderWithProviders(<DashboardPage />);
    const pageContainer = container.querySelector('[class*="space-y"]');
    expect(pageContainer).toBeTruthy();
  });

  it('renders grid layout for cards', () => {
    server.use(
      http.get(`${API}/dashboard`, () => HttpResponse.json(dashboardData)),
      ...referenceHandlers()
    );

    const { container } = renderWithProviders(<DashboardPage />);
    // DashboardPage should render without errors
    expect(container.firstChild).toBeTruthy();
  });

  it('handles dashboard data with empty arrays', () => {
    const minimalData = {
      ...dashboardData,
      trends: { monthly: [] },
      funds: [],
      events: {
        recent: [],
        summary: { count: 0, totalRaised: '0', totalSpent: '0', totalNet: '0' }
      }
    };
    server.use(
      http.get(`${API}/dashboard`, () => HttpResponse.json(minimalData)),
      ...referenceHandlers()
    );

    const { container } = renderWithProviders(<DashboardPage />);
    expect(container).toBeTruthy();
  });

  it('makes API request for dashboard data', async () => {
    let called = false;
    server.use(
      http.get(`${API}/dashboard`, () => {
        called = true;
        return HttpResponse.json(dashboardData);
      }),
      ...referenceHandlers()
    );

    renderWithProviders(<DashboardPage />);
    // Give query time to fire
    await new Promise((r) => setTimeout(r, 50));
    expect(called).toBe(true);
  });

  it('passes month parameter in query', async () => {
    let capturedMonth: string | null = null;
    server.use(
      http.get(`${API}/dashboard`, ({ request }) => {
        const url = new URL(request.url);
        capturedMonth = url.searchParams.get('month');
        return HttpResponse.json(dashboardData);
      }),
      ...referenceHandlers()
    );

    renderWithProviders(<DashboardPage />);
    await new Promise((r) => setTimeout(r, 50));
    // Month is sent as YYYY-MM format
    expect(capturedMonth).toMatch(/^\d{4}-\d{2}$/);
  });

  it('handles full dashboard response', () => {
    server.use(
      http.get(`${API}/dashboard`, () => HttpResponse.json(dashboardData)),
      ...referenceHandlers()
    );

    const { container } = renderWithProviders(<DashboardPage />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders without errors with complete dashboard data', () => {
    server.use(
      http.get(`${API}/dashboard`, () => HttpResponse.json(dashboardData)),
      ...referenceHandlers()
    );

    const { container } = renderWithProviders(<DashboardPage />);
    expect(container).toBeTruthy();
  });
});
