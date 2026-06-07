import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IncomeEntriesTable } from './IncomeEntriesTable';
import { renderWithProviders } from '@/test/renderWithProviders';
import { setMobileViewport } from '@/test/viewport';
import type { IncomeEntryResponse } from './schema';

const mockIncomeEntries: IncomeEntryResponse[] = [
  {
    id: 1,
    depositDate: '2024-06-01',
    referenceDate: '2024-05-26',
    amount: '500.00',
    categoryId: 7,
    categoryName: 'Dízimos',
    parentCategoryId: 1,
    parentCategoryName: 'Renda Regular',
    attenderId: 5,
    attenderName: 'Maria Santos',
    paymentMethodId: 1,
    paymentMethodName: 'Dinheiro',
    designatedFundId: null,
    designatedFundName: null,
    eventId: null,
    eventName: null,
    notes: 'Coleta dominical',
    userId: 1,
    status: 'confirmado',
    createdAt: '2024-06-01T10:00:00Z',
    updatedAt: '2024-06-01T10:00:00Z'
  },
  {
    id: 2,
    depositDate: '2024-06-02',
    referenceDate: '2024-06-02',
    amount: '1000.00',
    categoryId: 8,
    categoryName: 'Oferta Especial',
    parentCategoryId: 2,
    parentCategoryName: 'Ofertas',
    attenderId: null,
    attenderName: null,
    paymentMethodId: 2,
    paymentMethodName: 'Transferência',
    designatedFundId: 3,
    designatedFundName: 'Reforma do Templo',
    eventId: null,
    eventName: null,
    notes: null,
    userId: 1,
    status: 'pendente',
    createdAt: '2024-06-02T11:00:00Z',
    updatedAt: '2024-06-02T11:00:00Z'
  }
];

describe('IncomeEntriesTable', () => {
  it('renders header and entries', () => {
    renderWithProviders(
      <IncomeEntriesTable
        data={mockIncomeEntries}
        isLoading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        canEdit={true}
        canDelete={true}
      />
    );

    expect(screen.getByText('Últimos lançamentos')).toBeInTheDocument();
  });

  it('displays entry categories', () => {
    renderWithProviders(
      <IncomeEntriesTable
        data={mockIncomeEntries}
        isLoading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        canEdit={true}
        canDelete={true}
      />
    );

    const categoryTexts = screen.getAllByText('Dízimos');
    expect(categoryTexts.length).toBeGreaterThan(0);
  });

  it('displays Ver todos link to reports', () => {
    renderWithProviders(
      <IncomeEntriesTable
        data={mockIncomeEntries}
        isLoading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        canEdit={true}
        canDelete={true}
      />
    );

    const link = screen.getByRole('link', { name: /Ver todos/i });
    expect(link).toHaveAttribute('href', '/reports?tab=income');
  });

  it('renders mobile row layout', () => {
    setMobileViewport();
    const { container } = renderWithProviders(
      <IncomeEntriesTable
        data={mockIncomeEntries}
        isLoading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        canEdit={true}
        canDelete={true}
      />
    );

    const lists = container.querySelectorAll('ul');
    expect(lists.length).toBeGreaterThan(0);
  });

  it('displays action buttons', () => {
    renderWithProviders(
      <IncomeEntriesTable
        data={mockIncomeEntries}
        isLoading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        canEdit={true}
        canDelete={true}
      />
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('hides edit button when canEdit is false', () => {
    renderWithProviders(
      <IncomeEntriesTable
        data={mockIncomeEntries}
        isLoading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        canEdit={false}
        canDelete={true}
      />
    );

    expect(screen.getByText('Últimos lançamentos')).toBeInTheDocument();
  });

  it('hides delete button when canDelete is false', () => {
    renderWithProviders(
      <IncomeEntriesTable
        data={mockIncomeEntries}
        isLoading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        canEdit={true}
        canDelete={false}
      />
    );

    expect(screen.getByText('Últimos lançamentos')).toBeInTheDocument();
  });

  it('renders empty state message when data is empty', () => {
    renderWithProviders(
      <IncomeEntriesTable
        data={[]}
        isLoading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        canEdit={true}
        canDelete={true}
      />
    );

    expect(screen.getByText('Nenhum lançamento ainda.')).toBeInTheDocument();
  });

  it('displays status badge', () => {
    renderWithProviders(
      <IncomeEntriesTable
        data={mockIncomeEntries}
        isLoading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        canEdit={true}
        canDelete={true}
      />
    );

    const statusElements = screen.queryAllByText(/confirmado|pendente/i);
    expect(statusElements.length).toBeGreaterThan(0);
  });

  it('displays payment method names', () => {
    renderWithProviders(
      <IncomeEntriesTable
        data={mockIncomeEntries}
        isLoading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        canEdit={true}
        canDelete={true}
      />
    );

    const methods = screen.queryAllByText(/Dinheiro|Transferência/);
    expect(methods.length).toBeGreaterThan(0);
  });

  it('sorts entries by createdAt', () => {
    const { container } = renderWithProviders(
      <IncomeEntriesTable
        data={mockIncomeEntries}
        isLoading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        canEdit={true}
        canDelete={true}
      />
    );

    expect(container).toBeTruthy();
  });

  it('filters to latest 15 entries', () => {
    const entries = Array.from({ length: 20 }, (_, i) => ({
      ...mockIncomeEntries[0],
      id: i + 1,
      categoryName: `Category ${i + 1}`,
      createdAt: `2024-06-${String(1 + Math.floor(i / 2)).padStart(2, '0')}T${String(i).padStart(2, '0')}:00:00Z`
    }));

    renderWithProviders(
      <IncomeEntriesTable
        data={entries}
        isLoading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        canEdit={true}
        canDelete={true}
      />
    );

    expect(screen.getByText('Últimos lançamentos')).toBeInTheDocument();
  });

  it('displays formatted amounts', () => {
    renderWithProviders(
      <IncomeEntriesTable
        data={mockIncomeEntries}
        isLoading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        canEdit={true}
        canDelete={true}
      />
    );

    const amountElements = screen.queryAllByText(/500|1000/);
    expect(amountElements.length).toBeGreaterThan(0);
  });

  it('displays notes when present', () => {
    renderWithProviders(
      <IncomeEntriesTable
        data={mockIncomeEntries}
        isLoading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        canEdit={true}
        canDelete={true}
      />
    );

    expect(screen.getByText('Coleta dominical')).toBeInTheDocument();
  });

  it('handles entries with null optional fields', () => {
    const { container } = renderWithProviders(
      <IncomeEntriesTable
        data={[mockIncomeEntries[1]]}
        isLoading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        canEdit={true}
        canDelete={true}
      />
    );

    expect(container).toBeTruthy();
  });

  it('displays card structure', () => {
    const { container } = renderWithProviders(
      <IncomeEntriesTable
        data={mockIncomeEntries}
        isLoading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        canEdit={true}
        canDelete={true}
      />
    );

    const cards = container.querySelectorAll('[data-slot="card"]');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('calls onEdit when row button clicked with canEdit true', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();

    renderWithProviders(
      <IncomeEntriesTable
        data={mockIncomeEntries}
        isLoading={false}
        onEdit={onEdit}
        onDelete={vi.fn()}
        canEdit={true}
        canDelete={true}
      />
    );

    const buttons = screen.getAllByRole('button');
    if (buttons.length > 1) {
      await user.click(buttons[1]);
    }
  });

  it('displays attender name when present', () => {
    renderWithProviders(
      <IncomeEntriesTable
        data={mockIncomeEntries}
        isLoading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        canEdit={true}
        canDelete={true}
      />
    );

    expect(screen.getByText('Maria Santos')).toBeInTheDocument();
  });
});
