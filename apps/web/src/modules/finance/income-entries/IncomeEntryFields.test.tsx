import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { IncomeEntryFields } from './IncomeEntryFields';
import { IncomeEntryFormSchema } from './schema';
import { renderWithProviders } from '@/test/renderWithProviders';
import { setupTestServer, referenceHandlers, listHandler } from '@/test/server';

const server = setupTestServer();

const mockCategories = [
  {
    id: 1,
    name: 'Dízimos',
    parentId: null,
    status: 'ativo',
    requiresMember: false,
    type: 'income'
  },
  { id: 2, name: 'Ofertas', parentId: null, status: 'ativo', requiresMember: false, type: 'income' }
];

const mockPaymentMethods = [
  { id: 1, name: 'Dinheiro', allowsInflow: true, allowsOutflow: true, status: 'ativo' },
  { id: 2, name: 'PIX', allowsInflow: true, allowsOutflow: false, status: 'ativo' }
];

const mockAttenders = [
  { id: 1, name: 'João Silva', status: 'ativo' },
  { id: 2, name: 'Maria Santos', status: 'ativo' }
];

const mockCampaigns = [
  { id: 1, name: 'Reforma do Templo', status: 'ativa', description: 'Campanha de reforma' }
];

const mockEvents = [{ id: 1, name: 'Conferência 2024', status: 'ativo', startDate: '2024-07-01' }];

function TestComponent() {
  const form = useForm({
    resolver: zodResolver(IncomeEntryFormSchema),
    defaultValues: {
      depositDate: '2024-06-05',
      amount: '100.00',
      categoryId: undefined,
      paymentMethodId: undefined,
      status: 'paga'
    }
  });

  return (
    <form>
      <IncomeEntryFields
        control={form.control}
        errors={form.formState.errors}
        setValue={form.setValue}
      />
    </form>
  );
}

describe('IncomeEntryFields', () => {
  it('renders all required fields', async () => {
    server.use(
      listHandler('/income-categories', mockCategories),
      listHandler('/payment-methods', mockPaymentMethods),
      listHandler('/campaigns', mockCampaigns),
      listHandler('/events', mockEvents),
      listHandler('/attenders', mockAttenders),
      ...referenceHandlers()
    );

    renderWithProviders(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByText('Data de Depósito')).toBeInTheDocument();
      expect(screen.getByText('Valor (R$)')).toBeInTheDocument();
      expect(screen.getByText('Categoria')).toBeInTheDocument();
      expect(screen.getByText('Forma de Pagamento')).toBeInTheDocument();
      expect(screen.getByText('Congregado (opcional)')).toBeInTheDocument();
      expect(screen.getByText('Observações')).toBeInTheDocument();
    });
  });

  it('displays categoria field label', async () => {
    server.use(
      listHandler('/income-categories', mockCategories),
      listHandler('/payment-methods', mockPaymentMethods),
      listHandler('/campaigns', mockCampaigns),
      listHandler('/events', mockEvents),
      listHandler('/attenders', mockAttenders),
      ...referenceHandlers()
    );

    renderWithProviders(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByText('Categoria')).toBeInTheDocument();
    });
  });

  it('renders payment method select with trigger element', async () => {
    server.use(
      listHandler('/income-categories', mockCategories),
      listHandler('/payment-methods', mockPaymentMethods),
      listHandler('/campaigns', mockCampaigns),
      listHandler('/events', mockEvents),
      listHandler('/attenders', mockAttenders),
      ...referenceHandlers()
    );

    renderWithProviders(<TestComponent />);

    await waitFor(() => {
      const triggers = screen.getAllByRole('combobox');
      expect(triggers.length).toBeGreaterThan(0);
    });
  });

  it('displays status select field', async () => {
    server.use(
      listHandler('/income-categories', mockCategories),
      listHandler('/payment-methods', mockPaymentMethods),
      listHandler('/campaigns', mockCampaigns),
      listHandler('/events', mockEvents),
      listHandler('/attenders', mockAttenders),
      ...referenceHandlers()
    );

    renderWithProviders(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByText('Status')).toBeInTheDocument();
    });
  });

  it('displays congregado field with correct label', async () => {
    server.use(
      listHandler('/income-categories', mockCategories),
      listHandler('/payment-methods', mockPaymentMethods),
      listHandler('/campaigns', mockCampaigns),
      listHandler('/events', mockEvents),
      listHandler('/attenders', mockAttenders),
      ...referenceHandlers()
    );

    renderWithProviders(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByText(/Congregado/)).toBeInTheDocument();
    });
  });

  it('handles missing reference data gracefully', async () => {
    server.use(
      listHandler('/income-categories', []),
      listHandler('/payment-methods', []),
      listHandler('/campaigns', []),
      listHandler('/events', []),
      listHandler('/attenders', []),
      ...referenceHandlers()
    );

    renderWithProviders(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByText('Data de Depósito')).toBeInTheDocument();
    });

    // Form should still render even with empty dropdowns
    expect(screen.getByText('Valor (R$)')).toBeInTheDocument();
    expect(screen.getByText('Categoria')).toBeInTheDocument();
  });

  it('renders notes textarea', async () => {
    server.use(
      listHandler('/income-categories', mockCategories),
      listHandler('/payment-methods', mockPaymentMethods),
      listHandler('/campaigns', mockCampaigns),
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

  it('displays campaigns and events in link picker', async () => {
    server.use(
      listHandler('/income-categories', mockCategories),
      listHandler('/payment-methods', mockPaymentMethods),
      listHandler('/campaigns', mockCampaigns),
      listHandler('/events', mockEvents),
      listHandler('/attenders', mockAttenders),
      ...referenceHandlers()
    );

    renderWithProviders(<TestComponent />);

    // The LinkPicker should be rendered with the label "Vincular a (opcional)"
    await waitFor(() => {
      expect(screen.getByText('Vincular a (opcional)')).toBeInTheDocument();
    });
  });
});
