import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { IncomeReportTab } from './IncomeReportTab';
import { renderWithProviders } from '@/test/renderWithProviders';
import { setupTestServer, referenceHandlers, API, paginated } from '@/test/server';
import type { IncomeReportResponse } from './schema';

const server = setupTestServer();

const sampleIncomeRows = [
  {
    id: 1,
    depositDate: '2024-06-15',
    referenceDate: '2024-06-09',
    amount: '500.00',
    categoryId: 1,
    categoryName: 'Dízimo',
    parentCategoryId: 1,
    parentCategoryName: 'Contribuições',
    fundId: null,
    fundName: null,
    attenderId: 1,
    attenderName: 'João Silva',
    paymentMethodName: 'PIX',
    notes: null,
    status: 'paga' as const
  },
  {
    id: 2,
    depositDate: '2024-06-16',
    referenceDate: '2024-06-16',
    amount: '250.00',
    categoryId: 2,
    categoryName: 'Oferta',
    parentCategoryId: 2,
    parentCategoryName: 'Ofertas',
    fundId: 1,
    fundName: 'Reforma do Templo',
    attenderId: 2,
    attenderName: 'Maria Santos',
    paymentMethodName: 'Dinheiro',
    notes: 'Oferta especial',
    status: 'paga' as const
  }
];

describe('IncomeReportTab', () => {
  it('renders the table with rows once data loads', async () => {
    const response: IncomeReportResponse = {
      period: { from: '2024-06-01', to: '2024-06-30' },
      totalIncome: '750.00',
      ...paginated(sampleIncomeRows)
    };

    server.use(
      http.get(`${API}/reports/income`, () => HttpResponse.json(response)),
      ...referenceHandlers()
    );

    renderWithProviders(<IncomeReportTab month="2024-06" />);

    expect(await screen.findByText('Dízimo')).toBeInTheDocument();
    expect(screen.getByText('Oferta')).toBeInTheDocument();
    expect(screen.getByText('João Silva')).toBeInTheDocument();
  });

  it('displays total income at the top', async () => {
    const response: IncomeReportResponse = {
      period: { from: '2024-06-01', to: '2024-06-30' },
      totalIncome: '750.00',
      ...paginated(sampleIncomeRows)
    };

    server.use(
      http.get(`${API}/reports/income`, () => HttpResponse.json(response)),
      ...referenceHandlers()
    );

    renderWithProviders(<IncomeReportTab month="2024-06" />);

    await screen.findByText('Dízimo');
    expect(screen.getByText(/750,00/)).toBeInTheDocument();
  });

  it('shows empty message when there are no entries', async () => {
    const response: IncomeReportResponse = {
      period: { from: '2024-06-01', to: '2024-06-30' },
      totalIncome: '0.00',
      ...paginated([])
    };

    server.use(
      http.get(`${API}/reports/income`, () => HttpResponse.json(response)),
      ...referenceHandlers()
    );

    renderWithProviders(<IncomeReportTab month="2024-06" />);

    await waitFor(() => {
      expect(screen.getByText('Nenhum registro encontrado.')).toBeInTheDocument();
    });
  });

  it('renders embedded mode with limited rows', async () => {
    const response: IncomeReportResponse = {
      period: { from: '2024-06-01', to: '2024-06-30' },
      totalIncome: '750.00',
      ...paginated(sampleIncomeRows)
    };

    server.use(
      http.get(`${API}/reports/income`, () => HttpResponse.json(response)),
      ...referenceHandlers()
    );

    renderWithProviders(<IncomeReportTab month="2024-06" mode="embedded" />);

    await screen.findByText('Dízimo');
    expect(screen.getByText('Oferta')).toBeInTheDocument();
  });

  it('opens detail panel when clicking a row', async () => {
    const response: IncomeReportResponse = {
      period: { from: '2024-06-01', to: '2024-06-30' },
      totalIncome: '750.00',
      ...paginated(sampleIncomeRows)
    };

    server.use(
      http.get(`${API}/reports/income`, () => HttpResponse.json(response)),
      ...referenceHandlers()
    );

    const user = userEvent.setup();
    renderWithProviders(<IncomeReportTab month="2024-06" />);

    await screen.findByText('Dízimo');
    const row = screen.getByText('Dízimo').closest('button');
    if (row) {
      await user.click(row);
      await waitFor(() => {
        expect(screen.getByText('Detalhes da entrada')).toBeInTheDocument();
      });
    }
  });

  it('displays payment method information', async () => {
    const response: IncomeReportResponse = {
      period: { from: '2024-06-01', to: '2024-06-30' },
      totalIncome: '750.00',
      ...paginated(sampleIncomeRows)
    };

    server.use(
      http.get(`${API}/reports/income`, () => HttpResponse.json(response)),
      ...referenceHandlers()
    );

    renderWithProviders(<IncomeReportTab month="2024-06" />);

    await screen.findByText('Dízimo');
    expect(screen.getByText('PIX')).toBeInTheDocument();
    expect(screen.getByText('Dinheiro')).toBeInTheDocument();
  });

  it('displays entry amounts formatted in Brazilian currency', async () => {
    const response: IncomeReportResponse = {
      period: { from: '2024-06-01', to: '2024-06-30' },
      totalIncome: '750.00',
      ...paginated(sampleIncomeRows)
    };

    server.use(
      http.get(`${API}/reports/income`, () => HttpResponse.json(response)),
      ...referenceHandlers()
    );

    renderWithProviders(<IncomeReportTab month="2024-06" />);

    await screen.findByText('Dízimo');
    expect(screen.getByText(/500,00/)).toBeInTheDocument();
    expect(screen.getByText(/250,00/)).toBeInTheDocument();
  });
});
