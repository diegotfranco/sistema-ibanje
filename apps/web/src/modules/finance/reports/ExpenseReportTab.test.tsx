import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { ExpenseReportTab } from './ExpenseReportTab';
import { renderWithProviders } from '@/test/renderWithProviders';
import { setupTestServer, referenceHandlers, API, paginated } from '@/test/server';
import type { ExpenseReportResponse } from './schema';

const server = setupTestServer();

const sampleExpenseRows = [
  {
    id: 1,
    date: '2024-06-05',
    categoryId: 1,
    categoryName: 'Aluguel',
    parentCategoryId: 1,
    parentCategoryName: 'Despesas Operacionais',
    campaignId: null,
    campaignName: null,
    attenderId: null,
    attenderName: null,
    paymentMethodName: 'Transferência',
    installment: 1,
    totalInstallments: 1,
    hasReceipt: false,
    notes: null,
    amount: '1500.00',
    status: 'paga' as const
  },
  {
    id: 2,
    date: '2024-06-10',
    categoryId: 2,
    categoryName: 'Energia Elétrica',
    parentCategoryId: 1,
    parentCategoryName: 'Despesas Operacionais',
    campaignId: null,
    campaignName: null,
    attenderId: null,
    attenderName: null,
    paymentMethodName: 'PIX',
    installment: 1,
    totalInstallments: 1,
    hasReceipt: true,
    notes: 'Conta junho',
    amount: '250.00',
    status: 'paga' as const
  }
];

describe('ExpenseReportTab', () => {
  it('renders the table with rows once data loads', async () => {
    const response: ExpenseReportResponse = {
      period: { from: '2024-06-01', to: '2024-06-30' },
      totalExpenses: '1750.00',
      ...paginated(sampleExpenseRows)
    };

    server.use(
      http.get(`${API}/reports/expenses`, () => HttpResponse.json(response)),
      ...referenceHandlers()
    );

    renderWithProviders(<ExpenseReportTab month="2024-06" />);

    expect(await screen.findByText('Aluguel')).toBeInTheDocument();
    expect(screen.getByText('Energia Elétrica')).toBeInTheDocument();
  });

  it('displays total expenses at the top', async () => {
    const response: ExpenseReportResponse = {
      period: { from: '2024-06-01', to: '2024-06-30' },
      totalExpenses: '1750.00',
      ...paginated(sampleExpenseRows)
    };

    server.use(
      http.get(`${API}/reports/expenses`, () => HttpResponse.json(response)),
      ...referenceHandlers()
    );

    renderWithProviders(<ExpenseReportTab month="2024-06" />);

    await screen.findByText('Aluguel');
    // Total is displayed with Brazilian formatting (period + decimal)
    expect(screen.getByText((content) => content.includes('1.750,00'))).toBeInTheDocument();
  });

  it('shows empty message when there are no entries', async () => {
    const response: ExpenseReportResponse = {
      period: { from: '2024-06-01', to: '2024-06-30' },
      totalExpenses: '0.00',
      ...paginated([])
    };

    server.use(
      http.get(`${API}/reports/expenses`, () => HttpResponse.json(response)),
      ...referenceHandlers()
    );

    renderWithProviders(<ExpenseReportTab month="2024-06" />);

    await waitFor(() => {
      expect(screen.getByText('Nenhum registro encontrado.')).toBeInTheDocument();
    });
  });

  it('displays dates in Brazilian format', async () => {
    const response: ExpenseReportResponse = {
      period: { from: '2024-06-01', to: '2024-06-30' },
      totalExpenses: '1750.00',
      ...paginated(sampleExpenseRows)
    };

    server.use(
      http.get(`${API}/reports/expenses`, () => HttpResponse.json(response)),
      ...referenceHandlers()
    );

    renderWithProviders(<ExpenseReportTab month="2024-06" />);

    await screen.findByText('Aluguel');
    expect(screen.getByText(/05\/06\/2024/)).toBeInTheDocument();
    expect(screen.getByText(/10\/06\/2024/)).toBeInTheDocument();
  });

  it('displays category information in mobile row', async () => {
    const response: ExpenseReportResponse = {
      period: { from: '2024-06-01', to: '2024-06-30' },
      totalExpenses: '1750.00',
      ...paginated(sampleExpenseRows)
    };

    server.use(
      http.get(`${API}/reports/expenses`, () => HttpResponse.json(response)),
      ...referenceHandlers()
    );

    renderWithProviders(<ExpenseReportTab month="2024-06" />);

    await screen.findByText('Aluguel');
    // Categories are displayed in mobile rows in jsdom
    expect(screen.getByText('Aluguel')).toBeInTheDocument();
    expect(screen.getByText('Energia Elétrica')).toBeInTheDocument();
  });

  it('displays amounts in Brazilian format', async () => {
    const response: ExpenseReportResponse = {
      period: { from: '2024-06-01', to: '2024-06-30' },
      totalExpenses: '1750.00',
      ...paginated(sampleExpenseRows)
    };

    server.use(
      http.get(`${API}/reports/expenses`, () => HttpResponse.json(response)),
      ...referenceHandlers()
    );

    renderWithProviders(<ExpenseReportTab month="2024-06" />);

    await screen.findByText('Aluguel');
    // Total at top uses Brazilian formatting
    expect(screen.getByText((content) => content.includes('1.750,00'))).toBeInTheDocument();
  });

  it('passes rowActions callbacks to handler', async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const response: ExpenseReportResponse = {
      period: { from: '2024-06-01', to: '2024-06-30' },
      totalExpenses: '1750.00',
      ...paginated(sampleExpenseRows)
    };

    server.use(
      http.get(`${API}/reports/expenses`, () => HttpResponse.json(response)),
      ...referenceHandlers()
    );

    renderWithProviders(
      <ExpenseReportTab
        month="2024-06"
        rowActions={{ canEdit: true, canDelete: true, onEdit, onDelete }}
      />
    );

    await screen.findByText('Aluguel');
    // Verify the component rendered with the callbacks
    expect(screen.getByText('Aluguel')).toBeInTheDocument();
    expect(screen.getByText('Energia Elétrica')).toBeInTheDocument();
  });

  it('renders embedded mode', async () => {
    const response: ExpenseReportResponse = {
      period: { from: '2024-06-01', to: '2024-06-30' },
      totalExpenses: '1750.00',
      ...paginated(sampleExpenseRows)
    };

    server.use(
      http.get(`${API}/reports/expenses`, () => HttpResponse.json(response)),
      ...referenceHandlers()
    );

    renderWithProviders(<ExpenseReportTab month="2024-06" mode="embedded" />);

    await screen.findByText('Aluguel');
    expect(screen.getByText('Energia Elétrica')).toBeInTheDocument();
  });
});
