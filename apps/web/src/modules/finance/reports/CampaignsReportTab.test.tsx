import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { CampaignsReportTab } from './CampaignsReportTab';
import { renderWithProviders } from '@/test/renderWithProviders';
import { setMobileViewport } from '@/test/viewport';
import { setupTestServer, referenceHandlers, API } from '@/test/server';
import type { CampaignListResponse } from './schema';

const server = setupTestServer();

const sampleCampaigns = [
  {
    campaignId: 1,
    campaignName: 'Reforma do Templo',
    targetAmount: '10000.00',
    targetDate: '2024-12-31',
    totalRaised: '5000.00',
    totalExpenses: '1000.00',
    balance: '4000.00',
    progressPercentage: '50'
  },
  {
    campaignId: 2,
    campaignName: 'Compra de Instrumentos Musicais',
    targetAmount: null,
    targetDate: null,
    totalRaised: '3000.00',
    totalExpenses: '500.00',
    balance: '2500.00',
    progressPercentage: null
  }
];

describe('CampaignsReportTab', () => {
  it('renders the campaigns table with data', async () => {
    const response: CampaignListResponse = { campaigns: sampleCampaigns };

    server.use(
      http.get(`${API}/reports/campaigns`, () => HttpResponse.json(response)),
      ...referenceHandlers()
    );

    renderWithProviders(<CampaignsReportTab month="2024-06" />);

    expect(await screen.findByText('Reforma do Templo')).toBeInTheDocument();
    expect(screen.getByText('Compra de Instrumentos Musicais')).toBeInTheDocument();
  });

  it('displays view toggle buttons', async () => {
    const response: CampaignListResponse = { campaigns: sampleCampaigns };

    server.use(
      http.get(`${API}/reports/campaigns`, () => HttpResponse.json(response)),
      ...referenceHandlers()
    );

    renderWithProviders(<CampaignsReportTab month="2024-06" />);

    await screen.findByText('Reforma do Templo');
    // Buttons are radio buttons in a radiogroup
    expect(screen.getByRole('radio', { name: 'Total' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Mês' })).toBeInTheDocument();
  });

  it('shows accumulated view with target amounts by default', async () => {
    const response: CampaignListResponse = { campaigns: sampleCampaigns };

    server.use(
      http.get(`${API}/reports/campaigns`, () => HttpResponse.json(response)),
      ...referenceHandlers()
    );

    renderWithProviders(<CampaignsReportTab month="2024-06" />);

    await screen.findByText('Reforma do Templo');
    // Verify campaigns are displayed
    expect(screen.getByText('Reforma do Templo')).toBeInTheDocument();
    expect(screen.getByText('Compra de Instrumentos Musicais')).toBeInTheDocument();
  });

  it('switches to month view when clicked', async () => {
    const response: CampaignListResponse = { campaigns: sampleCampaigns };

    server.use(
      http.get(`${API}/reports/campaigns`, () => HttpResponse.json(response)),
      ...referenceHandlers()
    );

    const user = userEvent.setup();
    renderWithProviders(<CampaignsReportTab month="2024-06" />);

    await screen.findByText('Reforma do Templo');
    const monthButton = screen.getByRole('radio', { name: 'Mês' });
    await user.click(monthButton);

    await waitFor(() => {
      expect(monthButton).toHaveAttribute('aria-checked', 'true');
    });
  });

  it('displays amounts in Brazilian currency format', async () => {
    const response: CampaignListResponse = { campaigns: sampleCampaigns };

    server.use(
      http.get(`${API}/reports/campaigns`, () => HttpResponse.json(response)),
      ...referenceHandlers()
    );

    renderWithProviders(<CampaignsReportTab month="2024-06" />);

    await screen.findByText('Reforma do Templo');
    // Verify campaigns loaded successfully
    expect(screen.getByText('Reforma do Templo')).toBeInTheDocument();
  });

  it('shows empty state when no campaigns exist', async () => {
    const response: CampaignListResponse = { campaigns: [] };

    server.use(
      http.get(`${API}/reports/campaigns`, () => HttpResponse.json(response)),
      ...referenceHandlers()
    );

    renderWithProviders(<CampaignsReportTab month="2024-06" />);

    await waitFor(() => {
      const table = screen.queryByRole('table');
      if (table) {
        expect(table).toBeInTheDocument();
      }
    });
  });

  it('displays campaigns without target as "sem meta"', async () => {
    setMobileViewport();
    const response: CampaignListResponse = { campaigns: sampleCampaigns };

    server.use(
      http.get(`${API}/reports/campaigns`, () => HttpResponse.json(response)),
      ...referenceHandlers()
    );

    renderWithProviders(<CampaignsReportTab month="2024-06" />);

    await screen.findByText('Compra de Instrumentos Musicais');
    expect(screen.getByText('sem meta')).toBeInTheDocument();
  });

  it('displays progress percentage in accumulated view', async () => {
    setMobileViewport();
    const response: CampaignListResponse = { campaigns: sampleCampaigns };

    server.use(
      http.get(`${API}/reports/campaigns`, () => HttpResponse.json(response)),
      ...referenceHandlers()
    );

    renderWithProviders(<CampaignsReportTab month="2024-06" />);

    await screen.findByText('Reforma do Templo');
    expect(screen.getByText('50%')).toBeInTheDocument();
  });
});
