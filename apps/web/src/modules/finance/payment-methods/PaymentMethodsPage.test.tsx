import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PaymentMethodsPage from './PaymentMethodsPage';
import { renderWithProviders } from '@/test/renderWithProviders';
import { setupTestServer, referenceHandlers, listHandler, meHandler } from '@/test/server';

// Exemplar page test: rendering a ResourceListPage-based page transitively exercises ResourceListPage,
// DataTable, Card, PageContainer, the dialog, and the useResource* hooks — a lot of lines per file.
// MSW matches the FIRST handler that matches, so specific overrides go first and referenceHandlers()
// (which includes an empty /payment-methods and a full-perms /auth/me) is the fallback, spread last.
const server = setupTestServer();

const rows = [
  { id: 1, name: 'Dinheiro', allowsInflow: true, allowsOutflow: true, status: 'ativo' },
  { id: 2, name: 'PIX', allowsInflow: true, allowsOutflow: false, status: 'ativo' }
];

describe('PaymentMethodsPage', () => {
  it('renders the list with rows once data loads', async () => {
    server.use(listHandler('/payment-methods', rows), ...referenceHandlers());

    renderWithProviders(<PaymentMethodsPage />);

    expect(await screen.findByText('Dinheiro')).toBeInTheDocument();
    expect(screen.getByText('PIX')).toBeInTheDocument();
    expect(screen.getByText('Formas de Pagamento')).toBeInTheDocument();
  });

  it('opens the create dialog when the user clicks "Novo" (has Create permission)', async () => {
    server.use(listHandler('/payment-methods', rows), ...referenceHandlers());

    renderWithProviders(<PaymentMethodsPage />);
    await screen.findByText('Dinheiro');

    await userEvent.click(screen.getByRole('button', { name: /novo/i }));

    expect(await screen.findByText('Nova forma de pagamento')).toBeInTheDocument();
  });

  it('hides the "Novo" action for a user without Create permission', async () => {
    server.use(
      meHandler({ permissions: {} }),
      listHandler('/payment-methods', rows),
      ...referenceHandlers()
    );

    renderWithProviders(<PaymentMethodsPage />);
    await screen.findByText('Dinheiro');

    expect(screen.queryByRole('button', { name: /novo/i })).not.toBeInTheDocument();
  });

  it('shows the empty state when there are no rows', async () => {
    server.use(listHandler('/payment-methods', []), ...referenceHandlers());

    renderWithProviders(<PaymentMethodsPage />);

    await waitFor(() => expect(screen.queryByText('PIX')).not.toBeInTheDocument());
    expect(screen.getByText('Formas de Pagamento')).toBeInTheDocument();
    expect(screen.queryByText('Dinheiro')).not.toBeInTheDocument();
  });
});
