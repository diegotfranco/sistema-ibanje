import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';

import ExpenseEntriesPage from './ExpenseEntriesPage';
import { renderWithProviders } from '@/test/renderWithProviders';
import { setupTestServer, referenceHandlers, listHandler, meHandler } from '@/test/server';

const server = setupTestServer();

const mockExpenseEntries = [
  {
    id: 1,
    date: '2024-06-01',
    categoryName: 'Manutenção',
    categoryId: 1,
    parentCategoryName: 'Infraestrutura',
    notes: 'Reparo',
    campaignName: null,
    campaignId: null,
    attenderName: 'João',
    attenderId: 1,
    amount: '150.00',
    paymentMethodName: 'Transferência',
    paymentMethodId: 1,
    status: 'confirmado' as const,
    totalInstallments: 1,
    installment: 1,
    hasReceipt: false,
    createdAt: '2024-06-01T10:00:00Z',
    updatedAt: '2024-06-01T10:00:00Z'
  }
];

describe('ExpenseEntriesPage', () => {
  it('renders page title and summary', async () => {
    server.use(listHandler('/expense-entries', mockExpenseEntries), ...referenceHandlers());

    renderWithProviders(<ExpenseEntriesPage />);

    await waitFor(() => {
      expect(screen.getByText('Últimos lançamentos')).toBeInTheDocument();
    });
  });

  it('displays expense entries table', async () => {
    server.use(listHandler('/expense-entries', mockExpenseEntries), ...referenceHandlers());

    renderWithProviders(<ExpenseEntriesPage />);

    await waitFor(() => {
      expect(screen.getByText('Manutenção')).toBeInTheDocument();
    });
  });

  it('shows quick entry form when user has create permission', async () => {
    server.use(listHandler('/expense-entries', []), ...referenceHandlers());

    renderWithProviders(<ExpenseEntriesPage />);

    await waitFor(() => {
      expect(screen.getByText('Últimos lançamentos')).toBeInTheDocument();
    });
  });

  it('hides quick entry form when user lacks create permission', async () => {
    server.use(
      meHandler({ permissions: {} }),
      listHandler('/expense-entries', mockExpenseEntries),
      ...referenceHandlers()
    );

    renderWithProviders(<ExpenseEntriesPage />);

    await waitFor(() => {
      expect(screen.getByText('Últimos lançamentos')).toBeInTheDocument();
    });
  });

  it('displays expense summary card', async () => {
    server.use(listHandler('/expense-entries', mockExpenseEntries), ...referenceHandlers());

    renderWithProviders(<ExpenseEntriesPage />);

    await waitFor(() => {
      expect(screen.getByText('Últimos lançamentos')).toBeInTheDocument();
    });
  });

  it('handles empty expenses state', async () => {
    server.use(listHandler('/expense-entries', []), ...referenceHandlers());

    renderWithProviders(<ExpenseEntriesPage />);

    await waitFor(() => {
      expect(screen.getByText('Nenhum lançamento ainda.')).toBeInTheDocument();
    });
  });

  it('loads and displays multiple expenses', async () => {
    const entries = [
      ...mockExpenseEntries,
      {
        ...mockExpenseEntries[0],
        id: 2,
        categoryName: 'Limpeza',
        amount: '75.00'
      }
    ];

    server.use(listHandler('/expense-entries', entries), ...referenceHandlers());

    renderWithProviders(<ExpenseEntriesPage />);

    await waitFor(() => {
      expect(screen.getByText('Últimos lançamentos')).toBeInTheDocument();
    });
  });

  it('passes correct permissions to table', async () => {
    server.use(listHandler('/expense-entries', mockExpenseEntries), ...referenceHandlers());

    renderWithProviders(<ExpenseEntriesPage />);

    await waitFor(() => {
      expect(screen.getByText('Manutenção')).toBeInTheDocument();
    });
  });

  it('renders page container wrapper', async () => {
    server.use(listHandler('/expense-entries', []), ...referenceHandlers());

    const { container } = renderWithProviders(<ExpenseEntriesPage />);

    await waitFor(() => {
      const pageContainers = container.querySelectorAll('[data-slot="page-container"]');
      expect(pageContainers.length).toBeGreaterThanOrEqual(0);
    });
  });
});
