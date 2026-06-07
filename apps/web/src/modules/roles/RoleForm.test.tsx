import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RoleForm from './RoleForm';
import { renderWithProviders } from '@/test/renderWithProviders';

describe('RoleForm', () => {
  it('renders the create form with empty values', () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();

    renderWithProviders(<RoleForm onSubmit={onSubmit} onCancel={onCancel} isPending={false} />);

    expect(screen.getByLabelText('Nome *')).toHaveValue('');
    expect(screen.getByLabelText('Descrição')).toHaveValue('');
  });

  it('renders the edit form with populated values', () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();

    const initialValues = {
      id: 1,
      name: 'Administrador',
      description: 'Full system access',
      status: 'ativo',
      createdAt: '2026-01-01T00:00:00Z'
    };

    renderWithProviders(
      <RoleForm
        initialValues={initialValues}
        onSubmit={onSubmit}
        onCancel={onCancel}
        isPending={false}
      />
    );

    expect(screen.getByLabelText('Nome *')).toHaveValue('Administrador');
    expect(screen.getByLabelText('Descrição')).toHaveValue('Full system access');
  });

  it('allows typing into form fields', async () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(<RoleForm onSubmit={onSubmit} onCancel={onCancel} isPending={false} />);

    const nameInput = screen.getByLabelText('Nome *');
    const descriptionInput = screen.getByLabelText('Descrição');

    await user.type(nameInput, 'Secretária');
    await user.type(descriptionInput, 'Secretary access');

    expect(nameInput).toHaveValue('Secretária');
    expect(descriptionInput).toHaveValue('Secretary access');
  });

  it('displays disabled state when isPending is true', () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();

    renderWithProviders(<RoleForm onSubmit={onSubmit} onCancel={onCancel} isPending={true} />);

    expect(screen.getByRole('button', { name: /salvando/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeDisabled();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(<RoleForm onSubmit={onSubmit} onCancel={onCancel} isPending={false} />);

    await user.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(onCancel).toHaveBeenCalled();
  });

  describe('submit validation (interaction)', () => {
    it('blocks submit and surfaces required-field errors when name is empty', async () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();
      const user = userEvent.setup();

      renderWithProviders(<RoleForm onSubmit={onSubmit} onCancel={onCancel} isPending={false} />);

      // Clear the name field
      const nameInput = screen.getByLabelText('Nome *');
      await user.clear(nameInput);
      await user.click(screen.getByRole('button', { name: /salvar/i }));

      // Check for required-field error
      expect(await screen.findByText('Mínimo de 2 caracteres')).toBeInTheDocument();
      // onSubmit must NOT fire while the form is invalid
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('clears the name error once a valid value is typed and re-submitted', async () => {
      const onSubmit = vi.fn();
      const onCancel = vi.fn();
      const user = userEvent.setup();

      renderWithProviders(<RoleForm onSubmit={onSubmit} onCancel={onCancel} isPending={false} />);

      const nameInput = screen.getByLabelText('Nome *');
      await user.clear(nameInput);
      await user.click(screen.getByRole('button', { name: /salvar/i }));
      expect(await screen.findByText('Mínimo de 2 caracteres')).toBeInTheDocument();

      // Type a valid name
      await user.type(nameInput, 'Admin');
      await user.click(screen.getByRole('button', { name: /salvar/i }));

      // The error should clear on resubmit
      await vi.waitFor(() =>
        expect(screen.queryByText('Mínimo de 2 caracteres')).not.toBeInTheDocument()
      );
    });
  });
});
