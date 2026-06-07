import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import userEvent from '@testing-library/user-event';
import { ExpenseEntryFields } from './ExpenseEntryFields';
import { ExpenseEntryFormSchema } from './schema';
import type { ExpenseEntryFormValues } from './schema';
import { renderWithProviders } from '@/test/renderWithProviders';
import { setupTestServer, referenceHandlers, listHandler } from '@/test/server';

const server = setupTestServer();

const mockCategories = [
  { id: 1, name: 'Aluguel', parentId: null, status: 'ativo', type: 'expense' },
  { id: 2, name: 'Energia Elétrica', parentId: 1, status: 'ativo', type: 'expense' }
];

const mockPaymentMethods = [
  { id: 1, name: 'Transferência', allowsInflow: false, allowsOutflow: true, status: 'ativo' },
  { id: 2, name: 'PIX', allowsInflow: true, allowsOutflow: true, status: 'ativo' }
];

const mockAttenders = [
  { id: 1, name: 'Paulo Silva', status: 'ativo' },
  { id: 2, name: 'Ana Costa', status: 'ativo' }
];

const mockFunds = [
  { id: 1, name: 'Reforma do Templo', status: 'ativa', description: 'Campanha de reforma' }
];

const mockEvents = [{ id: 1, name: 'Evento 2024', status: 'ativo', startDate: '2024-07-01' }];

function TestComponent(props: { onSubmit?: (values: ExpenseEntryFormValues) => void } = {}) {
  const form = useForm({
    resolver: zodResolver(ExpenseEntryFormSchema),
    defaultValues: {
      date: '2024-06-05',
      isInstallment: false,
      amount: '150.00',
      categoryId: 1,
      paymentMethodId: 1,
      status: 'paga'
    }
  });

  return (
    <form onSubmit={form.handleSubmit((values) => props.onSubmit?.(values))}>
      <ExpenseEntryFields
        control={
          form.control as unknown as import('react-hook-form').Control<ExpenseEntryFormValues>
        }
        errors={
          form.formState
            .errors as unknown as import('react-hook-form').FieldErrors<ExpenseEntryFormValues>
        }
        setValue={
          form.setValue as unknown as import('react-hook-form').UseFormSetValue<ExpenseEntryFormValues>
        }
      />
      <button type="submit">Salvar</button>
    </form>
  );
}

describe('ExpenseEntryFields', () => {
  it('renders all required fields', async () => {
    server.use(
      listHandler('/expense-categories', mockCategories),
      listHandler('/payment-methods', mockPaymentMethods),
      listHandler('/designated-funds', mockFunds),
      listHandler('/events', mockEvents),
      listHandler('/attenders', mockAttenders),
      ...referenceHandlers()
    );

    renderWithProviders(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByText('Data')).toBeInTheDocument();
      expect(screen.getByText('Esta despesa é parcelada?')).toBeInTheDocument();
      expect(screen.getByText('Valor (R$)')).toBeInTheDocument();
      expect(screen.getByText('Categoria')).toBeInTheDocument();
      expect(screen.getByText('Forma de Pagamento')).toBeInTheDocument();
      expect(screen.getByText('Observações')).toBeInTheDocument();
    });
  });

  it('displays expense categories', async () => {
    server.use(
      listHandler('/expense-categories', mockCategories),
      listHandler('/payment-methods', mockPaymentMethods),
      listHandler('/designated-funds', mockFunds),
      listHandler('/events', mockEvents),
      listHandler('/attenders', mockAttenders),
      ...referenceHandlers()
    );

    renderWithProviders(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByText('Categoria')).toBeInTheDocument();
    });
  });

  it('displays payment method select field', async () => {
    server.use(
      listHandler('/expense-categories', mockCategories),
      listHandler('/payment-methods', mockPaymentMethods),
      listHandler('/designated-funds', mockFunds),
      listHandler('/events', mockEvents),
      listHandler('/attenders', mockAttenders),
      ...referenceHandlers()
    );

    renderWithProviders(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByText('Forma de Pagamento')).toBeInTheDocument();
    });
  });

  it('displays status field with options', async () => {
    server.use(
      listHandler('/expense-categories', mockCategories),
      listHandler('/payment-methods', mockPaymentMethods),
      listHandler('/designated-funds', mockFunds),
      listHandler('/events', mockEvents),
      listHandler('/attenders', mockAttenders),
      ...referenceHandlers()
    );

    renderWithProviders(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByText('Status')).toBeInTheDocument();
    });
  });

  it('displays congregado field as sponsor label', async () => {
    server.use(
      listHandler('/expense-categories', mockCategories),
      listHandler('/payment-methods', mockPaymentMethods),
      listHandler('/designated-funds', mockFunds),
      listHandler('/events', mockEvents),
      listHandler('/attenders', mockAttenders),
      ...referenceHandlers()
    );

    renderWithProviders(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByText('Congregado Patrocinador')).toBeInTheDocument();
    });
  });

  it('handles missing reference data gracefully', async () => {
    server.use(
      listHandler('/expense-categories', []),
      listHandler('/payment-methods', []),
      listHandler('/designated-funds', []),
      listHandler('/events', []),
      listHandler('/attenders', []),
      ...referenceHandlers()
    );

    renderWithProviders(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByText('Data')).toBeInTheDocument();
    });

    // Form should still render
    expect(screen.getByText('Forma de Pagamento')).toBeInTheDocument();
    expect(screen.getByText('Categoria')).toBeInTheDocument();
  });

  it('renders notes textarea', async () => {
    server.use(
      listHandler('/expense-categories', mockCategories),
      listHandler('/payment-methods', mockPaymentMethods),
      listHandler('/designated-funds', mockFunds),
      listHandler('/events', mockEvents),
      listHandler('/attenders', mockAttenders),
      ...referenceHandlers()
    );

    renderWithProviders(<TestComponent />);

    const notes = await waitFor(() =>
      screen.getByPlaceholderText('Adicione observações se necessário')
    );
    expect(notes).toBeInTheDocument();
  });

  it('displays link picker for designatd funds and events', async () => {
    server.use(
      listHandler('/expense-categories', mockCategories),
      listHandler('/payment-methods', mockPaymentMethods),
      listHandler('/designated-funds', mockFunds),
      listHandler('/events', mockEvents),
      listHandler('/attenders', mockAttenders),
      ...referenceHandlers()
    );

    renderWithProviders(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByText('Vincular a (opcional)')).toBeInTheDocument();
    });
  });

  it('renders non-installment expense form by default', async () => {
    server.use(
      listHandler('/expense-categories', mockCategories),
      listHandler('/payment-methods', mockPaymentMethods),
      listHandler('/designated-funds', mockFunds),
      listHandler('/events', mockEvents),
      listHandler('/attenders', mockAttenders),
      ...referenceHandlers()
    );

    renderWithProviders(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByLabelText('Valor (R$)')).toBeInTheDocument();
    });

    // Non-installment should not show parcela fields
    expect(screen.queryByLabelText('Parcela Nº')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Total de Parcelas')).not.toBeInTheDocument();
  });

  it('shows required-field error for amount when cleared and submitted', async () => {
    server.use(
      listHandler('/expense-categories', mockCategories),
      listHandler('/payment-methods', mockPaymentMethods),
      listHandler('/designated-funds', mockFunds),
      listHandler('/events', mockEvents),
      listHandler('/attenders', mockAttenders),
      ...referenceHandlers()
    );
    const onSubmit = vi.fn();

    renderWithProviders(<TestComponent onSubmit={onSubmit} />);
    await screen.findByText('Data');

    // Clear the amount field
    await userEvent.clear(document.querySelector('#amount') as HTMLInputElement);
    await userEvent.click(screen.getByRole('button', { name: /salvar/i }));

    // Check for required-field error messages on clearable fields
    expect(await screen.findByText('Valor é obrigatório.')).toBeInTheDocument();
    // onSubmit must NOT fire while the form is invalid
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('clears the amount error once a valid value is typed and re-submitted', async () => {
    server.use(
      listHandler('/expense-categories', mockCategories),
      listHandler('/payment-methods', mockPaymentMethods),
      listHandler('/designated-funds', mockFunds),
      listHandler('/events', mockEvents),
      listHandler('/attenders', mockAttenders),
      ...referenceHandlers()
    );
    const onSubmit = vi.fn();

    renderWithProviders(<TestComponent onSubmit={onSubmit} />);
    await screen.findByText('Data');

    // Clear the amount field
    await userEvent.clear(document.querySelector('#amount') as HTMLInputElement);
    await userEvent.click(screen.getByRole('button', { name: /salvar/i }));
    expect(await screen.findByText('Valor é obrigatório.')).toBeInTheDocument();

    // Type a valid decimal into the MoneyInput
    await userEvent.type(document.querySelector('#amount') as HTMLInputElement, '100.00');
    await userEvent.click(screen.getByRole('button', { name: /salvar/i }));

    // The amount error should clear on resubmit
    await vi.waitFor(() =>
      expect(screen.queryByText('Valor é obrigatório.')).not.toBeInTheDocument()
    );
  });

  it('toggles installment fields when isInstallment checkbox is checked', async () => {
    server.use(
      listHandler('/expense-categories', mockCategories),
      listHandler('/payment-methods', mockPaymentMethods),
      listHandler('/designated-funds', mockFunds),
      listHandler('/events', mockEvents),
      listHandler('/attenders', mockAttenders),
      ...referenceHandlers()
    );

    renderWithProviders(<TestComponent />);
    await screen.findByText('Data');

    // Non-installment: only one amount field
    expect(screen.getByLabelText('Valor (R$)')).toBeInTheDocument();
    expect(screen.queryByLabelText('Parcela Nº')).not.toBeInTheDocument();

    // Check the isInstallment checkbox
    const installmentCheckbox = screen.getByLabelText('Esta despesa é parcelada?');
    await userEvent.click(installmentCheckbox);

    // Installment fields should now appear
    expect(await screen.findByLabelText('Valor da Parcela (R$)')).toBeInTheDocument();
    expect(screen.getByLabelText('Valor Total (R$)')).toBeInTheDocument();
    expect(screen.getByLabelText('Parcela Nº')).toBeInTheDocument();
    expect(screen.getByLabelText('Total de Parcelas')).toBeInTheDocument();
  });
});
