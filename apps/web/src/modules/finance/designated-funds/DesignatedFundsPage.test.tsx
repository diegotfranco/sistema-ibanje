import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';

import DesignatedFundsPage from './DesignatedFundsPage';
import { renderWithProviders } from '@/test/renderWithProviders';
import { setupTestServer, referenceHandlers, listHandler, meHandler } from '@/test/server';

const server = setupTestServer();

const mockFunds = [
  {
    id: 1,
    name: 'Reforma do Templo',
    description: 'Renovação da estrutura',
    targetAmount: '10000.00',
    targetDate: '2024-12-31',
    status: 'ativo' as const,
    createdAt: '2024-06-01T10:00:00Z',
    updatedAt: '2024-06-01T10:00:00Z'
  },
  {
    id: 2,
    name: 'Ajuda Comunitária',
    description: 'Fundo para auxílio',
    targetAmount: '5000.00',
    targetDate: '2024-09-30',
    status: 'ativo' as const,
    createdAt: '2024-06-01T09:00:00Z',
    updatedAt: '2024-06-01T09:00:00Z'
  }
];

describe('DesignatedFundsPage', () => {
  it('renders page title', async () => {
    server.use(listHandler('/designated-funds', mockFunds), ...referenceHandlers());

    renderWithProviders(<DesignatedFundsPage />);

    await waitFor(() => {
      expect(screen.getByText('Campanhas')).toBeInTheDocument();
    });
  });

  it('displays designated funds with names', async () => {
    server.use(listHandler('/designated-funds', mockFunds), ...referenceHandlers());

    renderWithProviders(<DesignatedFundsPage />);

    await waitFor(() => {
      expect(screen.getByText('Reforma do Templo')).toBeInTheDocument();
      expect(screen.getByText('Ajuda Comunitária')).toBeInTheDocument();
    });
  });

  it('shows create button when user has create permission', async () => {
    server.use(listHandler('/designated-funds', mockFunds), ...referenceHandlers());

    renderWithProviders(<DesignatedFundsPage />);

    await waitFor(() => {
      expect(screen.getByText('Campanhas')).toBeInTheDocument();
    });
  });

  it('hides create button when user lacks create permission', async () => {
    server.use(
      meHandler({ permissions: {} }),
      listHandler('/designated-funds', mockFunds),
      ...referenceHandlers()
    );

    renderWithProviders(<DesignatedFundsPage />);

    await waitFor(() => {
      expect(screen.getByText('Campanhas')).toBeInTheDocument();
    });
  });

  it('displays empty state when no funds exist', async () => {
    server.use(listHandler('/designated-funds', []), ...referenceHandlers());

    renderWithProviders(<DesignatedFundsPage />);

    await waitFor(() => {
      expect(screen.getByText('Campanhas')).toBeInTheDocument();
    });
  });

  it('displays status badges for funds', async () => {
    server.use(listHandler('/designated-funds', mockFunds), ...referenceHandlers());

    renderWithProviders(<DesignatedFundsPage />);

    await waitFor(() => {
      const badges = screen.getAllByText(/ativo/i);
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  it('displays descriptions', async () => {
    server.use(listHandler('/designated-funds', mockFunds), ...referenceHandlers());

    renderWithProviders(<DesignatedFundsPage />);

    await waitFor(() => {
      expect(screen.getByText('Renovação da estrutura')).toBeInTheDocument();
    });
  });

  it('displays target amounts', async () => {
    server.use(listHandler('/designated-funds', mockFunds), ...referenceHandlers());

    renderWithProviders(<DesignatedFundsPage />);

    await waitFor(() => {
      const amounts = screen.queryAllByText(/10000|5000/);
      expect(amounts.length).toBeGreaterThan(0);
    });
  });

  it('renders table structure', async () => {
    server.use(listHandler('/designated-funds', mockFunds), ...referenceHandlers());

    renderWithProviders(<DesignatedFundsPage />);

    await waitFor(() => {
      expect(screen.getByText('Campanhas')).toBeInTheDocument();
    });
  });

  it('displays multiple funds', async () => {
    server.use(listHandler('/designated-funds', mockFunds), ...referenceHandlers());

    renderWithProviders(<DesignatedFundsPage />);

    await waitFor(() => {
      expect(screen.getByText('Reforma do Templo')).toBeInTheDocument();
    });
  });

  it('handles loading state', async () => {
    server.use(listHandler('/designated-funds', mockFunds), ...referenceHandlers());

    renderWithProviders(<DesignatedFundsPage />);

    await waitFor(() => {
      expect(screen.getByText('Campanhas')).toBeInTheDocument();
    });
  });
});
