import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UsersPage from './UsersPage';
import { renderWithProviders } from '@/test/renderWithProviders';
import { setupTestServer, referenceHandlers, listHandler, meHandler, API } from '@/test/server';

const server = setupTestServer();

const rows = [
  {
    id: 1,
    name: 'Admin User',
    email: 'admin@email.com',
    role: 'Administrador',
    roleId: 1,
    status: 'ativo',
    createdAt: '2024-01-01'
  },
  {
    id: 2,
    name: 'Secretary User',
    email: 'secretary@email.com',
    role: 'Secretária',
    roleId: 2,
    status: 'ativo',
    createdAt: '2024-01-02'
  }
];

describe('UsersPage', () => {
  it('renders the list with rows once data loads', async () => {
    server.use(listHandler('/users', rows), ...referenceHandlers());

    renderWithProviders(<UsersPage />);

    expect(await screen.findByText('Admin User')).toBeInTheDocument();
    expect(screen.getByText('Secretary User')).toBeInTheDocument();
    expect(screen.getByText('Usuários')).toBeInTheDocument();
  });

  it('sends the edited name (not the original) in the PATCH body', async () => {
    let patchBody: Record<string, unknown> | null = null;
    server.use(
      listHandler('/users', rows),
      ...referenceHandlers(),
      http.patch(`${API}/users/:id`, async ({ request }) => {
        patchBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ ...rows[1], name: patchBody.name });
      })
    );

    renderWithProviders(<UsersPage />);
    await screen.findByText('Secretary User');

    const editButtons = screen.getAllByRole('button', { name: 'Editar' });
    await userEvent.click(editButtons[editButtons.length - 1]);
    const nameInput = await screen.findByDisplayValue('Secretary User');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Secretary Edited');
    await userEvent.click(screen.getByRole('button', { name: /salvar/i }));

    await waitFor(() => expect(patchBody).not.toBeNull());
    expect(patchBody!.name).toBe('Secretary Edited');
  });

  it('opens the create dialog when the user clicks "Novo" (has Create permission)', async () => {
    server.use(listHandler('/users', rows), ...referenceHandlers());

    renderWithProviders(<UsersPage />);
    await screen.findByText('Admin User');

    await userEvent.click(screen.getByRole('button', { name: /novo/i }));

    expect(await screen.findByText('Novo Usuário')).toBeInTheDocument();
  });

  it('hides the "Novo" action for a user without Create permission', async () => {
    server.use(meHandler({ permissions: {} }), listHandler('/users', rows), ...referenceHandlers());

    renderWithProviders(<UsersPage />);
    await screen.findByText('Admin User');

    expect(screen.queryByRole('button', { name: /novo/i })).not.toBeInTheDocument();
  });

  it('shows the empty state when there are no rows', async () => {
    server.use(listHandler('/users', []), ...referenceHandlers());

    renderWithProviders(<UsersPage />);

    await waitFor(() => expect(screen.getByText('Nenhum usuário encontrado.')).toBeInTheDocument());
    expect(screen.getByText('Usuários')).toBeInTheDocument();
  });

  it('displays user emails and roles', async () => {
    server.use(listHandler('/users', rows), ...referenceHandlers());

    renderWithProviders(<UsersPage />);

    expect(await screen.findByText('admin@email.com')).toBeInTheDocument();
    expect(screen.getByText('Administrador')).toBeInTheDocument();
    expect(screen.getByText('secretary@email.com')).toBeInTheDocument();
  });

  it('renders the server-side search box', async () => {
    server.use(listHandler('/users', rows), ...referenceHandlers());

    renderWithProviders(<UsersPage />);
    await screen.findByText('Admin User');

    expect(screen.getByPlaceholderText('Buscar usuário…')).toBeInTheDocument();
  });

  it('renders the status column filter', async () => {
    server.use(listHandler('/users', rows), ...referenceHandlers());

    renderWithProviders(<UsersPage />);
    await screen.findByText('Admin User');

    expect(screen.getByRole('button', { name: 'Filtrar' })).toBeInTheDocument();
  });
});
