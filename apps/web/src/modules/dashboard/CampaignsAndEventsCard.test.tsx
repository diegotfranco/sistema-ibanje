import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { CampaignsAndEventsCard } from './CampaignsAndEventsCard';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { CampaignSummary, Events } from '@sistema-ibanje/shared';

const campaignSummaries: CampaignSummary[] = [
  {
    campaignId: 1,
    campaignName: 'Reforma do Templo',
    totalRaised: '15000.00',
    targetAmount: '50000.00',
    totalExpenses: '5000.00',
    balance: '10000.00',
    progressPercentage: '30.0'
  },
  {
    campaignId: 2,
    campaignName: 'Missões',
    totalRaised: '8500.75',
    targetAmount: null,
    totalExpenses: '2000.00',
    balance: '6500.75',
    progressPercentage: null
  }
];

const events: Events = {
  recent: [
    {
      eventId: 1,
      eventTitle: 'Café da Manhã Social',
      startTime: '2024-06-15T08:00:00Z',
      endTime: '2024-06-15T10:00:00Z',
      totalRaised: '1200.00',
      totalSpent: '450.00',
      net: '750.00'
    },
    {
      eventId: 2,
      eventTitle: 'Retiro Anual',
      startTime: '2024-07-20T08:00:00Z',
      endTime: '2024-07-22T18:00:00Z',
      totalRaised: '5000.00',
      totalSpent: '4200.00',
      net: '800.00'
    }
  ],
  summary: {
    count: 2,
    totalRaised: '6200.00',
    totalSpent: '4650.00',
    totalNet: '1550.00'
  }
};

describe('CampaignsAndEventsCard', () => {
  it('renders the card with campaigns view by default', async () => {
    renderWithProviders(<CampaignsAndEventsCard campaigns={campaignSummaries} events={events} />);

    expect(screen.getByText('Reforma do Templo')).toBeInTheDocument();
    expect(screen.getByText('Missões')).toBeInTheDocument();
  });

  it('displays campaign progress percentage when target exists', () => {
    renderWithProviders(<CampaignsAndEventsCard campaigns={campaignSummaries} events={events} />);

    // Reforma do Templo: 15000 / 50000 = 30%
    expect(screen.getByText('30.0%')).toBeInTheDocument();
  });

  it('displays "Sem meta" when campaign has no target', () => {
    renderWithProviders(<CampaignsAndEventsCard campaigns={campaignSummaries} events={events} />);

    expect(screen.getByText('Sem meta')).toBeInTheDocument();
  });

  it('shows empty state when campaigns list is empty', () => {
    renderWithProviders(<CampaignsAndEventsCard campaigns={[]} events={events} />);

    expect(screen.getByText('Nenhuma campanha ativa')).toBeInTheDocument();
  });

  it('renders with both campaigns and events data', () => {
    renderWithProviders(<CampaignsAndEventsCard campaigns={campaignSummaries} events={events} />);

    // Verify campaign data is displayed
    expect(screen.getByText('Reforma do Templo')).toBeInTheDocument();
    expect(screen.getByText('Missões')).toBeInTheDocument();
  });

  it('handles empty events gracefully', () => {
    const emptyEvents: Events = {
      recent: [],
      summary: { count: 0, totalRaised: '0.00', totalSpent: '0.00', totalNet: '0.00' }
    };

    renderWithProviders(
      <CampaignsAndEventsCard campaigns={campaignSummaries} events={emptyEvents} />
    );

    // Should render campaigns view
    expect(screen.getByText('Reforma do Templo')).toBeInTheDocument();
  });

  it('renders skeleton when loading', () => {
    renderWithProviders(
      <CampaignsAndEventsCard campaigns={undefined} events={undefined} isLoading={true} />
    );

    // Skeleton renders as a div with h-72 class
    const skeleton = document.querySelector('.h-72');
    expect(skeleton).toBeInTheDocument();
  });

  it('handles undefined campaigns and events gracefully', () => {
    renderWithProviders(<CampaignsAndEventsCard campaigns={undefined} events={undefined} />);

    expect(screen.getByText('Nenhuma campanha ativa')).toBeInTheDocument();
  });

  it('displays correct amounts for campaigns', () => {
    renderWithProviders(<CampaignsAndEventsCard campaigns={campaignSummaries} events={events} />);

    // Check that formatted amounts are displayed
    expect(screen.getByText(/R\$ 15[.,]000/)).toBeInTheDocument();
    expect(screen.getByText(/R\$ 50[.,]000/)).toBeInTheDocument();
  });

  it('renders with event data available', () => {
    renderWithProviders(<CampaignsAndEventsCard campaigns={campaignSummaries} events={events} />);

    // Card should render with campaigns content visible
    expect(screen.getByText('Reforma do Templo')).toBeInTheDocument();
  });

  it('applies custom className prop', () => {
    const { container } = renderWithProviders(
      <CampaignsAndEventsCard
        campaigns={campaignSummaries}
        events={events}
        className="custom-class"
      />
    );

    const card = container.querySelector('.custom-class');
    expect(card).toBeInTheDocument();
  });
});
