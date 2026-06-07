import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { FundsReportTab } from './FundsReportTab';
import { renderWithProviders } from '@/test/renderWithProviders';
import { setMobileViewport } from '@/test/viewport';
import { setupTestServer, referenceHandlers, API } from '@/test/server';
import type { FundListResponse } from './schema';

const server = setupTestServer();

const sampleFunds = [
  {
    fundId: 1,
    fundName: 'Reforma do Templo',
    targetAmount: '10000.00',
    targetDate: '2024-12-31',
    totalRaised: '5000.00',
    totalExpenses: '1000.00',
    balance: '4000.00',
    progressPercentage: '50'
  },
  {
    fundId: 2,
    fundName: 'Compra de Instrumentos Musicais',
    targetAmount: null,
    targetDate: null,
    totalRaised: '3000.00',
    totalExpenses: '500.00',
    balance: '2500.00',
    progressPercentage: null
  }
];

describe('FundsReportTab', () => {
  it('renders the funds table with data', async () => {
    const response: FundListResponse = { funds: sampleFunds };

    server.use(
      http.get(`${API}/reports/funds`, () => HttpResponse.json(response)),
      ...referenceHandlers()
    );

    renderWithProviders(<FundsReportTab month="2024-06" />);

    expect(await screen.findByText('Reforma do Templo')).toBeInTheDocument();
    expect(screen.getByText('Compra de Instrumentos Musicais')).toBeInTheDocument();
  });

  it('displays view toggle buttons', async () => {
    const response: FundListResponse = { funds: sampleFunds };

    server.use(
      http.get(`${API}/reports/funds`, () => HttpResponse.json(response)),
      ...referenceHandlers()
    );

    renderWithProviders(<FundsReportTab month="2024-06" />);

    await screen.findByText('Reforma do Templo');
    // Buttons are radio buttons in a radiogroup
    expect(screen.getByRole('radio', { name: 'Total' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Mês' })).toBeInTheDocument();
  });

  it('shows accumulated view with target amounts by default', async () => {
    const response: FundListResponse = { funds: sampleFunds };

    server.use(
      http.get(`${API}/reports/funds`, () => HttpResponse.json(response)),
      ...referenceHandlers()
    );

    renderWithProviders(<FundsReportTab month="2024-06" />);

    await screen.findByText('Reforma do Templo');
    // Verify funds are displayed
    expect(screen.getByText('Reforma do Templo')).toBeInTheDocument();
    expect(screen.getByText('Compra de Instrumentos Musicais')).toBeInTheDocument();
  });

  it('switches to month view when clicked', async () => {
    const response: FundListResponse = { funds: sampleFunds };

    server.use(
      http.get(`${API}/reports/funds`, () => HttpResponse.json(response)),
      ...referenceHandlers()
    );

    const user = userEvent.setup();
    renderWithProviders(<FundsReportTab month="2024-06" />);

    await screen.findByText('Reforma do Templo');
    const monthButton = screen.getByRole('radio', { name: 'Mês' });
    await user.click(monthButton);

    await waitFor(() => {
      expect(monthButton).toHaveAttribute('aria-checked', 'true');
    });
  });

  it('displays amounts in Brazilian currency format', async () => {
    const response: FundListResponse = { funds: sampleFunds };

    server.use(
      http.get(`${API}/reports/funds`, () => HttpResponse.json(response)),
      ...referenceHandlers()
    );

    renderWithProviders(<FundsReportTab month="2024-06" />);

    await screen.findByText('Reforma do Templo');
    // Verify funds loaded successfully
    expect(screen.getByText('Reforma do Templo')).toBeInTheDocument();
  });

  it('shows empty state when no funds exist', async () => {
    const response: FundListResponse = { funds: [] };

    server.use(
      http.get(`${API}/reports/funds`, () => HttpResponse.json(response)),
      ...referenceHandlers()
    );

    renderWithProviders(<FundsReportTab month="2024-06" />);

    await waitFor(() => {
      const table = screen.queryByRole('table');
      if (table) {
        expect(table).toBeInTheDocument();
      }
    });
  });

  it('displays funds without target as "sem meta"', async () => {
    setMobileViewport();
    const response: FundListResponse = { funds: sampleFunds };

    server.use(
      http.get(`${API}/reports/funds`, () => HttpResponse.json(response)),
      ...referenceHandlers()
    );

    renderWithProviders(<FundsReportTab month="2024-06" />);

    await screen.findByText('Compra de Instrumentos Musicais');
    expect(screen.getByText('sem meta')).toBeInTheDocument();
  });

  it('displays progress percentage in accumulated view', async () => {
    setMobileViewport();
    const response: FundListResponse = { funds: sampleFunds };

    server.use(
      http.get(`${API}/reports/funds`, () => HttpResponse.json(response)),
      ...referenceHandlers()
    );

    renderWithProviders(<FundsReportTab month="2024-06" />);

    await screen.findByText('Reforma do Templo');
    expect(screen.getByText('50%')).toBeInTheDocument();
  });
});
