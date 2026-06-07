import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AttenderForm from './AttenderForm';
import { renderWithProviders } from '@/test/renderWithProviders';

describe('AttenderForm', () => {
  it('renders the create form with empty values', () => {
    const onSubmit = vi.fn();

    renderWithProviders(
      <AttenderForm
        open={true}
        onOpenChange={() => {}}
        defaultValues={undefined}
        onSubmit={onSubmit}
        isPending={false}
      />
    );

    expect(screen.getByText('Novo Congregado')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome *')).toHaveValue('');
    expect(screen.getByRole('button', { name: /salvar/i })).toBeInTheDocument();
  });

  it('renders the edit form with populated values', () => {
    const onSubmit = vi.fn();

    const defaultValues = {
      name: 'João Silva',
      phone: '(11) 99999-1111',
      email: 'joao@email.com',
      birthDate: '2000-01-15',
      isMember: true,
      memberSince: '2020-01',
      admissionMode: 'batismo' as const,
      userId: null,
      addressStreet: 'Rua A',
      addressNumber: '123',
      addressComplement: null,
      addressDistrict: 'Centro',
      state: 'SP',
      city: 'São Paulo',
      postalCode: '12345678',
      baptismDate: '2020-05-10',
      congregatingSince: '2019-06'
    };

    renderWithProviders(
      <AttenderForm
        open={true}
        onOpenChange={() => {}}
        defaultValues={defaultValues}
        onSubmit={onSubmit}
        isPending={false}
      />
    );

    expect(screen.getByText('Editar Congregado')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome *')).toHaveValue('João Silva');
    expect(screen.getByLabelText('Telefone')).toHaveValue('(11) 99999-1111');
    expect(screen.getByLabelText('E-mail')).toHaveValue('joao@email.com');
  });

  it('shows/hides member-specific fields based on isMember checkbox', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <AttenderForm
        open={true}
        onOpenChange={() => {}}
        defaultValues={undefined}
        onSubmit={onSubmit}
        isPending={false}
      />
    );

    // Initially, member fields should not be visible
    expect(screen.queryByLabelText('Modo de Admissão')).not.toBeInTheDocument();

    // Check the isMember checkbox
    const isMemberCheckbox = screen.getByLabelText('É membro da igreja');
    await user.click(isMemberCheckbox);

    // Now member fields should be visible
    expect(screen.getByLabelText('Membro desde')).toBeInTheDocument();
    expect(screen.getByLabelText('Modo de Admissão')).toBeInTheDocument();
  });

  it('calls onSubmit with form values when submit button is clicked', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <AttenderForm
        open={true}
        onOpenChange={() => {}}
        defaultValues={undefined}
        onSubmit={onSubmit}
        isPending={false}
      />
    );

    const nameInput = screen.getByLabelText('Nome *');
    await user.type(nameInput, 'Maria Santos');

    await user.click(screen.getByRole('button', { name: /salvar/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Maria Santos'
      })
    );
  });

  it('displays disabled state when isPending is true', () => {
    const onSubmit = vi.fn();

    renderWithProviders(
      <AttenderForm
        open={true}
        onOpenChange={() => {}}
        defaultValues={undefined}
        onSubmit={onSubmit}
        isPending={true}
      />
    );

    expect(screen.getByRole('button', { name: /salvando/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeDisabled();
  });

  describe('submit validation (interaction)', () => {
    it('blocks submit and surfaces required-field errors when name is empty', async () => {
      const onSubmit = vi.fn();
      const user = userEvent.setup();

      renderWithProviders(
        <AttenderForm
          open={true}
          onOpenChange={() => {}}
          defaultValues={undefined}
          onSubmit={onSubmit}
          isPending={false}
        />
      );

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
      const user = userEvent.setup();

      renderWithProviders(
        <AttenderForm
          open={true}
          onOpenChange={() => {}}
          defaultValues={undefined}
          onSubmit={onSubmit}
          isPending={false}
        />
      );

      const nameInput = screen.getByLabelText('Nome *');
      await user.clear(nameInput);
      await user.click(screen.getByRole('button', { name: /salvar/i }));
      expect(await screen.findByText('Mínimo de 2 caracteres')).toBeInTheDocument();

      // Type a valid name
      await user.type(nameInput, 'Jo');
      await user.click(screen.getByRole('button', { name: /salvar/i }));

      // The error should clear on resubmit
      await vi.waitFor(() =>
        expect(screen.queryByText('Mínimo de 2 caracteres')).not.toBeInTheDocument()
      );
    });
  });
});
