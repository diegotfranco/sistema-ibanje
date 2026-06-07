import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserForm from './UserForm';
import { renderWithProviders } from '@/test/renderWithProviders';
import { setupTestServer, referenceHandlers, listHandler } from '@/test/server';

const server = setupTestServer();

const roles = [
  { id: 1, name: 'Administrador', description: 'Admin role', status: 'ativo' },
  { id: 2, name: 'Secretária', description: 'Secretary role', status: 'ativo' }
];

const attenders = [
  {
    id: 1,
    name: 'João Silva',
    isMember: true,
    status: 'ativo',
    createdAt: new Date(),
    userId: null,
    birthDate: null,
    phone: null,
    email: null,
    addressStreet: null,
    addressNumber: null,
    addressComplement: null,
    addressDistrict: null,
    state: null,
    city: null,
    postalCode: null,
    memberSince: null,
    baptismDate: null,
    congregatingSince: null,
    admissionMode: null
  }
];

describe('UserForm', () => {
  it('renders the create form with empty values', async () => {
    server.use(
      listHandler('/roles', roles),
      listHandler('/attenders', attenders),
      ...referenceHandlers()
    );

    const onSubmit = vi.fn();
    const onCancel = vi.fn();

    renderWithProviders(<UserForm onSubmit={onSubmit} onCancel={onCancel} isPending={false} />);

    expect(screen.getByLabelText('Nome *')).toHaveValue('');
    expect(screen.getByLabelText('E-mail *')).toHaveValue('');
  });

  it('renders the edit form with populated values', async () => {
    server.use(
      listHandler('/roles', roles),
      listHandler('/attenders', attenders),
      ...referenceHandlers()
    );

    const onSubmit = vi.fn();
    const onCancel = vi.fn();

    const initialValues = {
      id: 1,
      name: 'João Silva',
      email: 'joao@email.com',
      role: 'Administrador',
      roleId: 1,
      status: 'ativo',
      createdAt: '2024-01-01'
    };

    renderWithProviders(
      <UserForm
        initialValues={initialValues}
        onSubmit={onSubmit}
        onCancel={onCancel}
        isPending={false}
      />
    );

    expect(screen.getByDisplayValue('João Silva')).toBeInTheDocument();
    expect(screen.getByDisplayValue('joao@email.com')).toBeInTheDocument();
  });

  it('allows typing into name and email fields', async () => {
    server.use(
      listHandler('/roles', roles),
      listHandler('/attenders', attenders),
      ...referenceHandlers()
    );

    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(<UserForm onSubmit={onSubmit} onCancel={onCancel} isPending={false} />);

    const nameInput = screen.getByLabelText('Nome *');
    const emailInput = screen.getByLabelText('E-mail *');

    await user.type(nameInput, 'New User');
    await user.type(emailInput, 'newuser@email.com');

    expect(nameInput).toHaveValue('New User');
    expect(emailInput).toHaveValue('newuser@email.com');
  });

  it('displays disabled state when isPending is true', async () => {
    server.use(
      listHandler('/roles', roles),
      listHandler('/attenders', attenders),
      ...referenceHandlers()
    );

    const onSubmit = vi.fn();
    const onCancel = vi.fn();

    renderWithProviders(<UserForm onSubmit={onSubmit} onCancel={onCancel} isPending={true} />);

    expect(screen.getByRole('button', { name: /salvando/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeDisabled();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    server.use(
      listHandler('/roles', roles),
      listHandler('/attenders', attenders),
      ...referenceHandlers()
    );

    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(<UserForm onSubmit={onSubmit} onCancel={onCancel} isPending={false} />);

    await user.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(onCancel).toHaveBeenCalled();
  });

  describe('submit validation (interaction)', () => {
    it('blocks submit and surfaces required-field errors when name or email are empty', async () => {
      server.use(
        listHandler('/roles', roles),
        listHandler('/attenders', attenders),
        ...referenceHandlers()
      );

      const onSubmit = vi.fn();
      const onCancel = vi.fn();
      const user = userEvent.setup();

      renderWithProviders(<UserForm onSubmit={onSubmit} onCancel={onCancel} isPending={false} />);

      // Clear the name field
      const nameInput = screen.getByLabelText('Nome *');
      await user.clear(nameInput);
      await user.click(screen.getByRole('button', { name: /salvar/i }));

      // Check for required-field error
      expect(await screen.findByText('Nome é obrigatório')).toBeInTheDocument();
      // onSubmit must NOT fire while the form is invalid
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('clears the name error once a valid value is typed and re-submitted', async () => {
      server.use(
        listHandler('/roles', roles),
        listHandler('/attenders', attenders),
        ...referenceHandlers()
      );

      const onSubmit = vi.fn();
      const onCancel = vi.fn();
      const user = userEvent.setup();

      renderWithProviders(<UserForm onSubmit={onSubmit} onCancel={onCancel} isPending={false} />);

      const nameInput = screen.getByLabelText('Nome *');
      await user.clear(nameInput);
      await user.click(screen.getByRole('button', { name: /salvar/i }));
      expect(await screen.findByText('Nome é obrigatório')).toBeInTheDocument();

      // Type a valid name
      await user.type(nameInput, 'João Silva');
      await user.click(screen.getByRole('button', { name: /salvar/i }));

      // The error should clear on resubmit
      await waitFor(() => expect(screen.queryByText('Nome é obrigatório')).not.toBeInTheDocument());
    });

    it('allows typing valid email and clearing it to trigger validation', async () => {
      server.use(
        listHandler('/roles', roles),
        listHandler('/attenders', attenders),
        ...referenceHandlers()
      );

      const onSubmit = vi.fn();
      const onCancel = vi.fn();
      const user = userEvent.setup();

      renderWithProviders(<UserForm onSubmit={onSubmit} onCancel={onCancel} isPending={false} />);

      const emailInput = screen.getByLabelText('E-mail *');
      // Type a valid email first
      await user.type(emailInput, 'test@example.com');
      expect(emailInput).toHaveValue('test@example.com');

      // Now clear it and try to submit
      await user.clear(emailInput);
      await user.click(screen.getByRole('button', { name: /salvar/i }));

      // The form should still be invalid (required email), so onSubmit won't fire
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });
});
