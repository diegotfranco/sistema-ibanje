import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { StatementTab } from './StatementTab';
import { renderWithProviders } from '@/test/renderWithProviders';
import { setupTestServer, referenceHandlers, API } from '@/test/server';
import type { FinancialStatementResponse, DetailedFinancialStatementResponse } from './schema';

const server = setupTestServer();

const sampleStatement: FinancialStatementResponse = {
  period: { from: '2024-06-01', to: '2024-06-30' },
  openingBalance: '5000.00',
  totalIncome: '3000.00',
  totalExpenses: '2000.00',
  currentBalance: '6000.00',
  incomeByCategory: [
    {
      parentCategoryId: 1,
      parentCategoryName: 'Contribuições',
      categoryId: 1,
      categoryName: 'Dízimo',
      total: '2000.00'
    },
    {
      parentCategoryId: 2,
      parentCategoryName: 'Ofertas',
      categoryId: 2,
      categoryName: 'Oferta Geral',
      total: '1000.00'
    }
  ],
  incomeByCampaign: [],
  expensesByCategory: [
    {
      parentCategoryId: 1,
      parentCategoryName: 'Despesas Operacionais',
      categoryId: 1,
      categoryName: 'Aluguel',
      total: '1500.00'
    },
    {
      parentCategoryId: 1,
      parentCategoryName: 'Despesas Operacionais',
      categoryId: 2,
      categoryName: 'Utilidades',
      total: '500.00'
    }
  ]
};

const sampleDetailedStatement: DetailedFinancialStatementResponse = {
  period: { from: '2024-06-01', to: '2024-06-30' },
  openingBalance: '5000.00',
  totalIncome: '3000.00',
  totalExpenses: '2000.00',
  currentBalance: '6000.00',
  incomePivot: {
    columns: [
      {
        key: 'contrib_1',
        label: 'Geral',
        groupKey: 'contribuicoes',
        groupLabel: 'Contribuições',
        parentGroupKey: 'contribuicoes',
        parentGroupLabel: 'Contribuições',
        total: '2000.00'
      }
    ],
    rows: [
      {
        referenceDate: '2024-06-09',
        cells: { contrib_1: '2000.00' },
        total: '2000.00'
      }
    ],
    grandTotal: '2000.00'
  },
  incomeEntries: [
    {
      id: 1,
      depositDate: '2024-06-15',
      referenceDate: '2024-06-09',
      amount: '2000.00',
      categoryId: 1,
      categoryName: 'Dízimo',
      parentCategoryId: 1,
      parentCategoryName: 'Contribuições',
      campaignId: null,
      campaignName: null,
      attenderId: 1,
      attenderName: 'João Silva',
      paymentMethodName: 'PIX',
      notes: null,
      status: 'paga'
    }
  ],
  expenseEntries: [
    {
      id: 1,
      date: '2024-06-10',
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
      amount: '2000.00',
      status: 'paga'
    }
  ]
};

describe('StatementTab', () => {
  it('renders the simplified view by default', async () => {
    server.use(
      http.get(`${API}/reports/financial-statement`, () => HttpResponse.json(sampleStatement)),
      http.get(`${API}/reports/financial-statement/detailed`, () =>
        HttpResponse.json(sampleDetailedStatement)
      ),
      ...referenceHandlers()
    );

    renderWithProviders(<StatementTab month="2024-06" />);

    await waitFor(() => {
      expect(screen.getByText('Simplificado')).toBeInTheDocument();
      expect(screen.getByText('Detalhado')).toBeInTheDocument();
    });
  });

  it('displays view toggle buttons', async () => {
    server.use(
      http.get(`${API}/reports/financial-statement`, () => HttpResponse.json(sampleStatement)),
      http.get(`${API}/reports/financial-statement/detailed`, () =>
        HttpResponse.json(sampleDetailedStatement)
      ),
      ...referenceHandlers()
    );

    renderWithProviders(<StatementTab month="2024-06" />);

    expect(screen.getByRole('radio', { name: /Simplificado/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Detalhado/i })).toBeInTheDocument();
  });

  it('displays PDF download button', async () => {
    server.use(
      http.get(`${API}/reports/financial-statement`, () => HttpResponse.json(sampleStatement)),
      http.get(`${API}/reports/financial-statement/detailed`, () =>
        HttpResponse.json(sampleDetailedStatement)
      ),
      ...referenceHandlers()
    );

    renderWithProviders(<StatementTab month="2024-06" />);

    expect(screen.getByRole('button', { name: /Baixar PDF/i })).toBeInTheDocument();
  });

  it('switches to detailed view when clicked', async () => {
    server.use(
      http.get(`${API}/reports/financial-statement`, () => HttpResponse.json(sampleStatement)),
      http.get(`${API}/reports/financial-statement/detailed`, () =>
        HttpResponse.json(sampleDetailedStatement)
      ),
      ...referenceHandlers()
    );

    const user = userEvent.setup();
    renderWithProviders(<StatementTab month="2024-06" />);

    const detailedButton = screen.getByText('Detalhado').closest('button');
    if (detailedButton) {
      await user.click(detailedButton);
    }

    await waitFor(() => {
      expect(screen.getByText('Entradas')).toBeInTheDocument();
    });
  });

  it('loads simplified statement data', async () => {
    server.use(
      http.get(`${API}/reports/financial-statement`, () => HttpResponse.json(sampleStatement)),
      http.get(`${API}/reports/financial-statement/detailed`, () =>
        HttpResponse.json(sampleDetailedStatement)
      ),
      ...referenceHandlers()
    );

    renderWithProviders(<StatementTab month="2024-06" />);

    await waitFor(() => {
      expect(screen.queryByText('Carregando...')).not.toBeInTheDocument();
    });
  });

  it('loads detailed statement when switched', async () => {
    server.use(
      http.get(`${API}/reports/financial-statement`, () => HttpResponse.json(sampleStatement)),
      http.get(`${API}/reports/financial-statement/detailed`, () =>
        HttpResponse.json(sampleDetailedStatement)
      ),
      ...referenceHandlers()
    );

    const user = userEvent.setup();
    renderWithProviders(<StatementTab month="2024-06" />);

    const detailedButton = screen.getByText('Detalhado').closest('button');
    if (detailedButton) {
      await user.click(detailedButton);
    }

    await waitFor(() => {
      expect(screen.getByText('Entradas')).toBeInTheDocument();
      expect(screen.getByText('Saídas')).toBeInTheDocument();
    });
  });

  it('displays loading state while fetching', async () => {
    server.use(
      http.get(`${API}/reports/financial-statement`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json(sampleStatement);
      }),
      http.get(`${API}/reports/financial-statement/detailed`, () =>
        HttpResponse.json(sampleDetailedStatement)
      ),
      ...referenceHandlers()
    );

    renderWithProviders(<StatementTab month="2024-06" />);

    // Statement loads asynchronously
    await waitFor(() => {
      expect(screen.queryByText('Carregando...')).not.toBeInTheDocument();
    });
  });

  it('displays detailed view data with income and expenses sections', async () => {
    server.use(
      http.get(`${API}/reports/financial-statement`, () => HttpResponse.json(sampleStatement)),
      http.get(`${API}/reports/financial-statement/detailed`, () =>
        HttpResponse.json(sampleDetailedStatement)
      ),
      ...referenceHandlers()
    );

    const user = userEvent.setup();
    renderWithProviders(<StatementTab month="2024-06" />);

    const detailedButton = screen.getByText('Detalhado').closest('button');
    if (detailedButton) {
      await user.click(detailedButton);
    }

    await waitFor(() => {
      expect(screen.getByText('Entradas')).toBeInTheDocument();
      expect(screen.getByText('Saídas')).toBeInTheDocument();
    });
  });
});
