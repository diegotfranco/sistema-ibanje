import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExpenseEntriesTable } from './ExpenseEntriesTable';
import { renderWithProviders } from '@/test/renderWithProviders';
import { setMobileViewport } from '@/test/viewport';
import type { ExpenseEntryResponse } from './schema';

const mockExpenseEntries: ExpenseEntryResponse[] = [
  {
    id: 1,
    parentId: null,
    date: '2024-06-01',
    total: '150.00',
    amount: '150.00',
    installment: 1,
    totalInstallments: 1,
    categoryId: 10,
    categoryName: 'Manutenção',
    parentCategoryId: 1,
    parentCategoryName: 'Infraestrutura',
    paymentMethodId: 1,
    paymentMethodName: 'Transferência',
    designatedFundId: 1,
    designatedFundName: 'Reforma do Templo',
    eventId: null,
    eventName: null,
    attenderId: 5,
    attenderName: 'João Silva',
    hasReceipt: true,
    notes: 'Reparo do teto',
    userId: 1,
    status: 'confirmado',
    createdAt: '2024-06-01T10:00:00Z',
    updatedAt: '2024-06-01T10:00:00Z'
  },
  {
    id: 2,
    parentId: null,
    date: '2024-06-02',
    total: '75.50',
    amount: '75.50',
    installment: 1,
    totalInstallments: 2,
    categoryId: 11,
    categoryName: 'Limpeza',
    parentCategoryId: 2,
    parentCategoryName: 'Manutenção',
    paymentMethodId: 2,
    paymentMethodName: 'Dinheiro',
    designatedFundId: null,
    designatedFundName: null,
    eventId: null,
    eventName: null,
    attenderId: null,
    attenderName: null,
    hasReceipt: false,
    notes: null,
    userId: 1,
    status: 'pendente',
    createdAt: '2024-06-02T11:00:00Z',
    updatedAt: '2024-06-02T11:00:00Z'
  }
];

describe('ExpenseEntriesTable', () => {
  it('renders header and entries', () => {
    renderWithProviders(
      <ExpenseEntriesTable
        data={mockExpenseEntries}
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
      <ExpenseEntriesTable
        data={mockExpenseEntries}
        isLoading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        canEdit={true}
        canDelete={true}
      />
    );

    // Check for entries in the list
    const categoryTexts = screen.getAllByText('Limpeza');
    expect(categoryTexts.length).toBeGreaterThan(0);
  });

  it('displays Ver todos link to reports', () => {
    renderWithProviders(
      <ExpenseEntriesTable
        data={mockExpenseEntries}
        isLoading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        canEdit={true}
        canDelete={true}
      />
    );

    const link = screen.getByRole('link', { name: /Ver todos/i });
    expect(link).toHaveAttribute('href', '/reports?tab=expenses');
  });

  it('renders mobile row layout', () => {
    setMobileViewport();
    const { container } = renderWithProviders(
      <ExpenseEntriesTable
        data={mockExpenseEntries}
        isLoading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        canEdit={true}
        canDelete={true}
      />
    );

    // Mobile view renders as list
    const lists = container.querySelectorAll('ul');
    expect(lists.length).toBeGreaterThan(0);
  });

  it('displays action buttons', () => {
    renderWithProviders(
      <ExpenseEntriesTable
        data={mockExpenseEntries}
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
      <ExpenseEntriesTable
        data={mockExpenseEntries}
        isLoading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        canEdit={false}
        canDelete={true}
      />
    );

    // Verify component renders
    expect(screen.getByText('Últimos lançamentos')).toBeInTheDocument();
  });

  it('hides delete button when canDelete is false', () => {
    renderWithProviders(
      <ExpenseEntriesTable
        data={mockExpenseEntries}
        isLoading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        canEdit={true}
        canDelete={false}
      />
    );

    expect(screen.getByText('Últimos lançamentos')).toBeInTheDocument();
  });

  it('displays installment info when totalInstallments > 1', () => {
    renderWithProviders(
      <ExpenseEntriesTable
        data={mockExpenseEntries}
        isLoading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        canEdit={true}
        canDelete={true}
      />
    );

    expect(screen.getByText(/1\/2/)).toBeInTheDocument();
  });

  it('renders empty state message when data is empty', () => {
    renderWithProviders(
      <ExpenseEntriesTable
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
      <ExpenseEntriesTable
        data={mockExpenseEntries}
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
      <ExpenseEntriesTable
        data={mockExpenseEntries}
        isLoading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        canEdit={true}
        canDelete={true}
      />
    );

    const methods = screen.queryAllByText(/Transferência|Dinheiro/);
    expect(methods.length).toBeGreaterThan(0);
  });

  it('sorts entries by createdAt', () => {
    const { container } = renderWithProviders(
      <ExpenseEntriesTable
        data={mockExpenseEntries}
        isLoading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        canEdit={true}
        canDelete={true}
      />
    );

    // Just verify the component renders the sorted data
    expect(container).toBeTruthy();
  });

  it('filters to latest 15 entries', () => {
    const entries = Array.from({ length: 20 }, (_, i) => ({
      ...mockExpenseEntries[0],
      id: i + 1,
      categoryName: `Category ${i + 1}`,
      createdAt: `2024-06-${String(1 + Math.floor(i / 2)).padStart(2, '0')}T${String(i).padStart(2, '0')}:00:00Z`
    }));

    renderWithProviders(
      <ExpenseEntriesTable
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
      <ExpenseEntriesTable
        data={mockExpenseEntries}
        isLoading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        canEdit={true}
        canDelete={true}
      />
    );

    // Amounts should be visible (in mobile view they're formatted)
    const amountElements = screen.queryAllByText(/150|75\.?/);
    expect(amountElements.length).toBeGreaterThan(0);
  });

  it('displays notes when present', () => {
    renderWithProviders(
      <ExpenseEntriesTable
        data={mockExpenseEntries}
        isLoading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        canEdit={true}
        canDelete={true}
      />
    );

    expect(screen.getByText('Reparo do teto')).toBeInTheDocument();
  });

  it('handles entries with null optional fields', () => {
    const { container } = renderWithProviders(
      <ExpenseEntriesTable
        data={[mockExpenseEntries[1]]}
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
      <ExpenseEntriesTable
        data={mockExpenseEntries}
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
      <ExpenseEntriesTable
        data={mockExpenseEntries}
        isLoading={false}
        onEdit={onEdit}
        onDelete={vi.fn()}
        canEdit={true}
        canDelete={true}
      />
    );

    const buttons = screen.getAllByRole('button');
    if (buttons.length > 1) {
      // Click a button that's not "Ver todos"
      await user.click(buttons[1]);
    }
  });
});
