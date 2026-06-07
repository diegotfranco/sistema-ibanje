import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { FundsAndEventsCard } from './FundsAndEventsCard';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { FundSummary, Events } from '@sistema-ibanje/shared';

const fundSummaries: FundSummary[] = [
  {
    fundId: 1,
    fundName: 'Reforma do Templo',
    totalRaised: '15000.00',
    targetAmount: '50000.00',
    totalExpenses: '5000.00',
    balance: '10000.00',
    progressPercentage: '30.0'
  },
  {
    fundId: 2,
    fundName: 'Missões',
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

describe('FundsAndEventsCard', () => {
  it('renders the card with funds view by default', async () => {
    renderWithProviders(<FundsAndEventsCard funds={fundSummaries} events={events} />);

    expect(screen.getByText('Reforma do Templo')).toBeInTheDocument();
    expect(screen.getByText('Missões')).toBeInTheDocument();
  });

  it('displays fund progress percentage when target exists', () => {
    renderWithProviders(<FundsAndEventsCard funds={fundSummaries} events={events} />);

    // Reforma do Templo: 15000 / 50000 = 30%
    expect(screen.getByText('30.0%')).toBeInTheDocument();
  });

  it('displays "Sem meta" when fund has no target', () => {
    renderWithProviders(<FundsAndEventsCard funds={fundSummaries} events={events} />);

    expect(screen.getByText('Sem meta')).toBeInTheDocument();
  });

  it('shows empty state when funds list is empty', () => {
    renderWithProviders(<FundsAndEventsCard funds={[]} events={events} />);

    expect(screen.getByText('Nenhuma campanha ativa')).toBeInTheDocument();
  });

  it('renders with both funds and events data', () => {
    renderWithProviders(<FundsAndEventsCard funds={fundSummaries} events={events} />);

    // Verify fund data is displayed
    expect(screen.getByText('Reforma do Templo')).toBeInTheDocument();
    expect(screen.getByText('Missões')).toBeInTheDocument();
  });

  it('handles empty events gracefully', () => {
    const emptyEvents: Events = {
      recent: [],
      summary: { count: 0, totalRaised: '0.00', totalSpent: '0.00', totalNet: '0.00' }
    };

    renderWithProviders(<FundsAndEventsCard funds={fundSummaries} events={emptyEvents} />);

    // Should render funds view
    expect(screen.getByText('Reforma do Templo')).toBeInTheDocument();
  });

  it('renders skeleton when loading', () => {
    renderWithProviders(
      <FundsAndEventsCard funds={undefined} events={undefined} isLoading={true} />
    );

    // Skeleton renders as a div with h-72 class
    const skeleton = document.querySelector('.h-72');
    expect(skeleton).toBeInTheDocument();
  });

  it('handles undefined funds and events gracefully', () => {
    renderWithProviders(<FundsAndEventsCard funds={undefined} events={undefined} />);

    expect(screen.getByText('Nenhuma campanha ativa')).toBeInTheDocument();
  });

  it('displays correct amounts for funds', () => {
    renderWithProviders(<FundsAndEventsCard funds={fundSummaries} events={events} />);

    // Check that formatted amounts are displayed
    expect(screen.getByText(/R\$ 15[.,]000/)).toBeInTheDocument();
    expect(screen.getByText(/R\$ 50[.,]000/)).toBeInTheDocument();
  });

  it('renders with event data available', () => {
    renderWithProviders(<FundsAndEventsCard funds={fundSummaries} events={events} />);

    // Card should render with funds content visible
    expect(screen.getByText('Reforma do Templo')).toBeInTheDocument();
  });

  it('applies custom className prop', () => {
    const { container } = renderWithProviders(
      <FundsAndEventsCard funds={fundSummaries} events={events} className="custom-class" />
    );

    const card = container.querySelector('.custom-class');
    expect(card).toBeInTheDocument();
  });
});
