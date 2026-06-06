import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RolesPage from './RolesPage';
import { renderWithProviders } from '@/test/renderWithProviders';
import { setupTestServer, referenceHandlers, listHandler, meHandler } from '@/test/server';

const server = setupTestServer();

const rows = [
  {
    id: 1,
    name: 'Administrador',
    description: 'Full access',
    status: 'ativo'
  },
  {
    id: 2,
    name: 'Secretária',
    description: 'Secretary access',
    status: 'ativo'
  }
];

describe('RolesPage', () => {
  it('renders the list with rows once data loads', async () => {
    server.use(listHandler('/roles', rows), ...referenceHandlers());

    renderWithProviders(<RolesPage />);

    expect(await screen.findByText('Administrador')).toBeInTheDocument();
    expect(screen.getByText('Secretária')).toBeInTheDocument();
    expect(screen.getByText('Cargos')).toBeInTheDocument();
  });

  it('opens the create dialog when the user clicks "Novo" (has Create permission)', async () => {
    server.use(listHandler('/roles', rows), ...referenceHandlers());

    renderWithProviders(<RolesPage />);
    await screen.findByText('Administrador');

    await userEvent.click(screen.getByRole('button', { name: /novo/i }));

    expect(await screen.findByText('Novo Cargo')).toBeInTheDocument();
  });

  it('hides the "Novo" action for a user without Create permission', async () => {
    server.use(meHandler({ permissions: {} }), listHandler('/roles', rows), ...referenceHandlers());

    renderWithProviders(<RolesPage />);
    await screen.findByText('Administrador');

    expect(screen.queryByRole('button', { name: /novo/i })).not.toBeInTheDocument();
  });

  it('shows the empty state when there are no rows', async () => {
    server.use(listHandler('/roles', []), ...referenceHandlers());

    renderWithProviders(<RolesPage />);

    await waitFor(() => expect(screen.getByText('Nenhum cargo encontrado.')).toBeInTheDocument());
    expect(screen.getByText('Cargos')).toBeInTheDocument();
  });

  it('displays role descriptions', async () => {
    server.use(listHandler('/roles', rows), ...referenceHandlers());

    renderWithProviders(<RolesPage />);

    expect(await screen.findByText('Full access')).toBeInTheDocument();
    expect(screen.getByText('Secretary access')).toBeInTheDocument();
  });
});
