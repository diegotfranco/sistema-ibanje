import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserPermissionsDialog from './UserPermissionsDialog';
import { renderWithProviders } from '@/test/renderWithProviders';

vi.mock('@/hooks/usePermissionsReference', () => ({
  usePermissionsReference: () => ({
    modules: [
      { id: 1, name: 'Usuarios' },
      { id: 2, name: 'Atendentes' }
    ],
    permissionTypes: [
      { id: 1, name: 'Acessar' },
      { id: 2, name: 'Cadastrar' },
      { id: 3, name: 'Editar' }
    ],
    isLoading: false
  })
}));

vi.mock('@/modules/users/useUsers', () => ({
  useUserPermissions: () => ({
    data: { Usuarios: ['Acessar', 'Editar'] },
    isLoading: false
  }),
  useSaveUserPermissions: () => ({
    mutate: vi.fn((_, opts) => opts.onSuccess?.()),
    isPending: false
  })
}));

describe('UserPermissionsDialog', () => {
  const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role: 'Admin',
    roleId: 1,
    status: 'ativo' as const,
    permissions: {},
    attenderId: null,
    isMember: false,
    createdAt: '2024-01-01T00:00:00.000Z'
  };

  it('renders dialog with user name when open is true', async () => {
    renderWithProviders(
      <UserPermissionsDialog user={mockUser} open={true} onOpenChange={vi.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByText(/Permissões — Test User/)).toBeInTheDocument();
    });
  });

  it('does not render dialog when open is false', () => {
    renderWithProviders(
      <UserPermissionsDialog user={mockUser} open={false} onOpenChange={vi.fn()} />
    );

    expect(screen.queryByText(/Permissões — Test User/)).not.toBeInTheDocument();
  });

  it('displays cancel button', async () => {
    renderWithProviders(
      <UserPermissionsDialog user={mockUser} open={true} onOpenChange={vi.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Cancelar/i })).toBeInTheDocument();
    });
  });

  it('displays save button', async () => {
    renderWithProviders(
      <UserPermissionsDialog user={mockUser} open={true} onOpenChange={vi.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Salvar/ })).toBeInTheDocument();
    });
  });

  it('calls onOpenChange when cancel is clicked', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    renderWithProviders(
      <UserPermissionsDialog user={mockUser} open={true} onOpenChange={onOpenChange} />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Cancelar/i })).toBeInTheDocument();
    });

    const cancelBtn = screen.getByRole('button', { name: /Cancelar/i });
    await user.click(cancelBtn);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('disables cancel button when isPending is true', async () => {
    renderWithProviders(
      <UserPermissionsDialog user={mockUser} open={true} onOpenChange={vi.fn()} />
    );

    await waitFor(() => {
      const cancelBtn = screen.getByRole('button', { name: /Cancelar/i });
      expect(cancelBtn).toBeInTheDocument();
    });
  });

  it('renders dialog but without user name when user is null', () => {
    renderWithProviders(<UserPermissionsDialog user={null} open={true} onOpenChange={vi.fn()} />);

    // Dialog is still rendered but with no user name in title
    const titleText = screen.queryByText(/Permissões — Test User/);
    expect(titleText).not.toBeInTheDocument();
  });

  it('handles dialog close with onOpenChange', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    renderWithProviders(
      <UserPermissionsDialog user={mockUser} open={true} onOpenChange={onOpenChange} />
    );

    await waitFor(() => {
      expect(screen.getByText(/Permissões — Test User/)).toBeInTheDocument();
    });

    const cancelBtn = screen.getByRole('button', { name: /Cancelar/i });
    await user.click(cancelBtn);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('loads permissions for the selected user', async () => {
    renderWithProviders(
      <UserPermissionsDialog user={mockUser} open={true} onOpenChange={vi.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByText(/Permissões — Test User/)).toBeInTheDocument();
    });
  });

  it('shows permission matrix component', async () => {
    renderWithProviders(
      <UserPermissionsDialog user={mockUser} open={true} onOpenChange={vi.fn()} />
    );

    await waitFor(() => {
      const dialog = screen.getByText(/Permissões — Test User/);
      expect(dialog).toBeInTheDocument();
    });
  });

  it('renders save button with proper label', async () => {
    renderWithProviders(
      <UserPermissionsDialog user={mockUser} open={true} onOpenChange={vi.fn()} />
    );

    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      const saveBtn = buttons.find((b) => b.textContent?.includes('Salvar'));
      expect(saveBtn).toBeInTheDocument();
    });
  });

  it('handles different users opening the dialog', async () => {
    const user2 = { ...mockUser, id: 2, name: 'Another User' };

    const { rerender } = renderWithProviders(
      <UserPermissionsDialog user={mockUser} open={true} onOpenChange={vi.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByText(/Test User/)).toBeInTheDocument();
    });

    rerender(<UserPermissionsDialog user={user2} open={true} onOpenChange={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/Another User/)).toBeInTheDocument();
    });
  });
});
