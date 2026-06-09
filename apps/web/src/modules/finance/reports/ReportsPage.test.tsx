import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import ReportsPage from './ReportsPage';
import { renderWithProviders } from '@/test/renderWithProviders';
import { setupTestServer, referenceHandlers, meHandler, API, paginated } from '@/test/server';

const server = setupTestServer();

describe('ReportsPage', () => {
  it('renders the page with title and tabs', async () => {
    server.use(
      http.get(`${API}/reports/income`, () => HttpResponse.json(paginated([]))),
      meHandler(),
      ...referenceHandlers()
    );

    renderWithProviders(<ReportsPage />);

    expect(await screen.findByText('Relatórios')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Entradas' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Saídas' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Demonstrativo' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Campanhas' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Eventos' })).toBeInTheDocument();
  });

  it('renders the month picker', async () => {
    server.use(
      http.get(`${API}/reports/income`, () => HttpResponse.json(paginated([]))),
      meHandler(),
      ...referenceHandlers()
    );

    renderWithProviders(<ReportsPage />);

    await waitFor(() => {
      const monthPicker = screen.getByRole('combobox');
      expect(monthPicker).toBeInTheDocument();
    });
  });

  it('switches to the expenses tab when clicked', async () => {
    server.use(
      http.get(`${API}/reports/income`, () => HttpResponse.json(paginated([]))),
      http.get(`${API}/reports/expenses`, () => HttpResponse.json(paginated([]))),
      meHandler(),
      ...referenceHandlers()
    );

    const user = userEvent.setup();
    renderWithProviders(<ReportsPage />);

    await screen.findByText('Relatórios');
    const expensesTab = screen.getByRole('tab', { name: 'Saídas' });
    await user.click(expensesTab);

    expect(expensesTab).toHaveAttribute('aria-selected', 'true');
  });

  it('switches to the statement tab when clicked', async () => {
    server.use(
      http.get(`${API}/reports/income`, () => HttpResponse.json(paginated([]))),
      http.get(`${API}/reports/financial-statement`, () =>
        HttpResponse.json({
          period: { from: '2024-06-01', to: '2024-06-30' },
          openingBalance: '0.00',
          totalIncome: '0.00',
          totalExpenses: '0.00',
          currentBalance: '0.00',
          incomeByCategory: [],
          incomeByCampaign: [],
          expensesByCategory: []
        })
      ),
      meHandler(),
      ...referenceHandlers()
    );

    const user = userEvent.setup();
    renderWithProviders(<ReportsPage />);

    await screen.findByText('Relatórios');
    const statementTab = screen.getByRole('tab', { name: 'Demonstrativo' });
    await user.click(statementTab);

    expect(statementTab).toHaveAttribute('aria-selected', 'true');
  });

  it('switches to the campaigns tab when clicked', async () => {
    server.use(
      http.get(`${API}/reports/income`, () => HttpResponse.json(paginated([]))),
      http.get(`${API}/reports/campaigns`, () => HttpResponse.json({ campaigns: [] })),
      meHandler(),
      ...referenceHandlers()
    );

    const user = userEvent.setup();
    renderWithProviders(<ReportsPage />);

    await screen.findByText('Relatórios');
    const campaignsTab = screen.getByRole('tab', { name: 'Campanhas' });
    await user.click(campaignsTab);

    expect(campaignsTab).toHaveAttribute('aria-selected', 'true');
  });

  it('switches to the events tab when clicked', async () => {
    server.use(
      http.get(`${API}/reports/income`, () => HttpResponse.json(paginated([]))),
      http.get(`${API}/reports/events`, () => HttpResponse.json({ period: null, events: [] })),
      meHandler(),
      ...referenceHandlers()
    );

    const user = userEvent.setup();
    renderWithProviders(<ReportsPage />);

    await screen.findByText('Relatórios');
    const eventsTab = screen.getByRole('tab', { name: 'Eventos' });
    await user.click(eventsTab);

    expect(eventsTab).toHaveAttribute('aria-selected', 'true');
  });

  it('hides the page when user lacks Report permission', async () => {
    server.use(meHandler({ permissions: {} }), ...referenceHandlers());

    renderWithProviders(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByText('Sem permissão')).toBeInTheDocument();
    });
  });
});
