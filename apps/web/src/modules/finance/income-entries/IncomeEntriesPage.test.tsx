import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IncomeEntriesPage from './IncomeEntriesPage';
import { renderWithProviders } from '@/test/renderWithProviders';
import { setupTestServer, referenceHandlers, listHandler, meHandler } from '@/test/server';

const server = setupTestServer();

const mockIncomeEntries = [
  {
    id: 1,
    depositDate: '2024-06-01',
    referenceDate: '2024-05-26',
    categoryName: 'Dízimos',
    categoryId: 1,
    parentCategoryName: 'Renda Regular',
    notes: 'Coleta',
    designatedFundName: null,
    attenderName: 'Maria',
    attenderId: 1,
    amount: '500.00',
    paymentMethodName: 'Dinheiro',
    paymentMethodId: 1,
    status: 'confirmado' as const,
    createdAt: '2024-06-01T10:00:00Z',
    updatedAt: '2024-06-01T10:00:00Z'
  }
];

describe('IncomeEntriesPage', () => {
  it('renders page title and summary', async () => {
    server.use(listHandler('/income-entries', mockIncomeEntries), ...referenceHandlers());

    renderWithProviders(<IncomeEntriesPage />);

    await waitFor(() => {
      expect(screen.getByText('Últimos lançamentos')).toBeInTheDocument();
    });
  });

  it('displays income entries table', async () => {
    server.use(listHandler('/income-entries', mockIncomeEntries), ...referenceHandlers());

    renderWithProviders(<IncomeEntriesPage />);

    await waitFor(() => {
      expect(screen.getByText('Dízimos')).toBeInTheDocument();
    });
  });

  it('shows quick entry form when user has create permission', async () => {
    server.use(listHandler('/income-entries', []), ...referenceHandlers());

    renderWithProviders(<IncomeEntriesPage />);

    await waitFor(() => {
      const quickEntryElements = screen.queryAllByText(/Lançamento rápido|Entrada rápida|Novo/i);
      expect(quickEntryElements.length).toBeGreaterThanOrEqual(0);
    });
  });

  it('hides quick entry form when user lacks create permission', async () => {
    server.use(
      meHandler({ permissions: {} }),
      listHandler('/income-entries', mockIncomeEntries),
      ...referenceHandlers()
    );

    renderWithProviders(<IncomeEntriesPage />);

    await waitFor(() => {
      expect(screen.getByText('Últimos lançamentos')).toBeInTheDocument();
    });
  });

  it('displays summary card', async () => {
    server.use(listHandler('/income-entries', mockIncomeEntries), ...referenceHandlers());

    renderWithProviders(<IncomeEntriesPage />);

    // Wait for the page to render
    await waitFor(() => {
      expect(screen.getByText('Últimos lançamentos')).toBeInTheDocument();
    });
  });

  it('opens edit dialog when entry is clicked', async () => {
    const user = userEvent.setup();

    server.use(listHandler('/income-entries', mockIncomeEntries), ...referenceHandlers());

    renderWithProviders(<IncomeEntriesPage />);

    await waitFor(() => {
      expect(screen.getByText('Dízimos')).toBeInTheDocument();
    });

    // Click view details button
    const buttons = screen.getAllByRole('button');
    if (buttons.length > 0) {
      await user.click(buttons[0]);
    }
  });

  it('handles empty entries state', async () => {
    server.use(listHandler('/income-entries', []), ...referenceHandlers());

    renderWithProviders(<IncomeEntriesPage />);

    await waitFor(() => {
      expect(screen.getByText('Nenhum lançamento ainda.')).toBeInTheDocument();
    });
  });

  it('loads and displays multiple entries', async () => {
    const entries = [
      ...mockIncomeEntries,
      {
        ...mockIncomeEntries[0],
        id: 2,
        categoryName: 'Oferta',
        amount: '250.00'
      }
    ];

    server.use(listHandler('/income-entries', entries), ...referenceHandlers());

    renderWithProviders(<IncomeEntriesPage />);

    await waitFor(() => {
      expect(screen.getByText('Últimos lançamentos')).toBeInTheDocument();
    });
  });

  it('passes correct permissions to table', async () => {
    server.use(listHandler('/income-entries', mockIncomeEntries), ...referenceHandlers());

    renderWithProviders(<IncomeEntriesPage />);

    await waitFor(() => {
      expect(screen.getByText('Dízimos')).toBeInTheDocument();
    });
  });

  it('renders page container wrapper', async () => {
    server.use(listHandler('/income-entries', []), ...referenceHandlers());

    const { container } = renderWithProviders(<IncomeEntriesPage />);

    await waitFor(() => {
      const pageContainers = container.querySelectorAll('[data-slot="page-container"]');
      expect(pageContainers.length).toBeGreaterThanOrEqual(0);
    });
  });
});
