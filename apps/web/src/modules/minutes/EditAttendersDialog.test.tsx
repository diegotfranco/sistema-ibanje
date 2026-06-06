import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditAttendersDialog from './EditAttendersDialog';
import { renderWithProviders } from '@/test/renderWithProviders';

const mockAttenders = [
  { id: 1, name: 'João Silva' },
  { id: 2, name: 'Maria Santos' },
  { id: 3, name: 'Pedro Oliveira' },
  { id: 4, name: 'Ana Costa' }
];

describe('EditAttendersDialog', () => {
  it('renders dialog with title when open is true', () => {
    renderWithProviders(
      <EditAttendersDialog
        open={true}
        onOpenChange={vi.fn()}
        selectedIds={[]}
        availableAttenders={mockAttenders}
        onSubmit={vi.fn()}
        isPending={false}
      />
    );

    expect(screen.getByText('Editar Congregados Presentes')).toBeInTheDocument();
  });

  it('does not render dialog when open is false', () => {
    renderWithProviders(
      <EditAttendersDialog
        open={false}
        onOpenChange={vi.fn()}
        selectedIds={[]}
        availableAttenders={mockAttenders}
        onSubmit={vi.fn()}
        isPending={false}
      />
    );

    expect(screen.queryByText('Editar Congregados Presentes')).not.toBeInTheDocument();
  });

  it('displays available attenders', () => {
    renderWithProviders(
      <EditAttendersDialog
        open={true}
        onOpenChange={vi.fn()}
        selectedIds={[]}
        availableAttenders={mockAttenders}
        onSubmit={vi.fn()}
        isPending={false}
      />
    );

    const joaoTexts = screen.getAllByText('João Silva');
    expect(joaoTexts.length).toBeGreaterThan(0);
  });

  it('marks initially selected attenders as checked', () => {
    renderWithProviders(
      <EditAttendersDialog
        open={true}
        onOpenChange={vi.fn()}
        selectedIds={[1, 3]}
        availableAttenders={mockAttenders}
        onSubmit={vi.fn()}
        isPending={false}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
    expect(checkboxes[2]).toBeChecked();
  });

  it('toggles checkbox when directly clicked', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <EditAttendersDialog
        open={true}
        onOpenChange={vi.fn()}
        selectedIds={[]}
        availableAttenders={mockAttenders}
        onSubmit={vi.fn()}
        isPending={false}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[];
    const initialState = checkboxes[0].checked;
    await user.click(checkboxes[0]);

    expect(checkboxes[0].checked).not.toBe(initialState);
  });

  it('filters attenders by search query', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <EditAttendersDialog
        open={true}
        onOpenChange={vi.fn()}
        selectedIds={[]}
        availableAttenders={mockAttenders}
        onSubmit={vi.fn()}
        isPending={false}
      />
    );

    const searchInput = screen.getByPlaceholderText('Digite o nome...');
    await user.type(searchInput, 'João');

    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.queryByText('Maria Santos')).not.toBeInTheDocument();
  });

  it('shows all attenders when search is cleared', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <EditAttendersDialog
        open={true}
        onOpenChange={vi.fn()}
        selectedIds={[]}
        availableAttenders={mockAttenders}
        onSubmit={vi.fn()}
        isPending={false}
      />
    );

    const searchInput = screen.getByPlaceholderText('Digite o nome...');
    await user.type(searchInput, 'João');
    expect(screen.queryByText('Maria Santos')).not.toBeInTheDocument();

    await user.clear(searchInput);
    expect(screen.getByText('Maria Santos')).toBeInTheDocument();
  });

  it('displays no results message when search has no matches', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <EditAttendersDialog
        open={true}
        onOpenChange={vi.fn()}
        selectedIds={[]}
        availableAttenders={mockAttenders}
        onSubmit={vi.fn()}
        isPending={false}
      />
    );

    const searchInput = screen.getByPlaceholderText('Digite o nome...');
    await user.type(searchInput, 'Nonexistent');

    expect(screen.getByText('Nenhum congregado encontrado.')).toBeInTheDocument();
  });

  it('calls onSubmit with selected ids when save is clicked', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithProviders(
      <EditAttendersDialog
        open={true}
        onOpenChange={vi.fn()}
        selectedIds={[]}
        availableAttenders={mockAttenders}
        onSubmit={onSubmit}
        isPending={false}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);
    await user.click(checkboxes[1]);

    const saveBtn = screen.getByRole('button', { name: /Salvar/ });
    await user.click(saveBtn);

    expect(onSubmit).toHaveBeenCalledWith([1, 2]);
  });

  it('calls onOpenChange when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    renderWithProviders(
      <EditAttendersDialog
        open={true}
        onOpenChange={onOpenChange}
        selectedIds={[]}
        availableAttenders={mockAttenders}
        onSubmit={vi.fn()}
        isPending={false}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: /Cancelar/i });
    await user.click(cancelBtn);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('disables buttons when isPending is true', () => {
    renderWithProviders(
      <EditAttendersDialog
        open={true}
        onOpenChange={vi.fn()}
        selectedIds={[]}
        availableAttenders={mockAttenders}
        onSubmit={vi.fn()}
        isPending={true}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: /Cancelar/i });
    const saveBtn = screen.getByRole('button', { name: /Salvando\.\.\./ });

    expect(cancelBtn).toBeDisabled();
    expect(saveBtn).toBeDisabled();
  });

  it('shows Salvando text when isPending is true', () => {
    renderWithProviders(
      <EditAttendersDialog
        open={true}
        onOpenChange={vi.fn()}
        selectedIds={[]}
        availableAttenders={mockAttenders}
        onSubmit={vi.fn()}
        isPending={true}
      />
    );

    expect(screen.getByRole('button', { name: /Salvando\.\.\./ })).toBeInTheDocument();
  });

  it('handles empty attenders list', () => {
    renderWithProviders(
      <EditAttendersDialog
        open={true}
        onOpenChange={vi.fn()}
        selectedIds={[]}
        availableAttenders={[]}
        onSubmit={vi.fn()}
        isPending={false}
      />
    );

    expect(screen.getByText('Nenhum congregado encontrado.')).toBeInTheDocument();
  });

  it('displays search label', () => {
    renderWithProviders(
      <EditAttendersDialog
        open={true}
        onOpenChange={vi.fn()}
        selectedIds={[]}
        availableAttenders={mockAttenders}
        onSubmit={vi.fn()}
        isPending={false}
      />
    );

    expect(screen.getByText('Buscar Congregado')).toBeInTheDocument();
  });

  it('renders with multiple initially selected attenders', () => {
    renderWithProviders(
      <EditAttendersDialog
        open={true}
        onOpenChange={vi.fn()}
        selectedIds={[1, 2, 3]}
        availableAttenders={mockAttenders}
        onSubmit={vi.fn()}
        isPending={false}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).toBeChecked();
    expect(checkboxes[2]).toBeChecked();
    expect(checkboxes[3]).not.toBeChecked();
  });

  it('displays dialog footer buttons', () => {
    renderWithProviders(
      <EditAttendersDialog
        open={true}
        onOpenChange={vi.fn()}
        selectedIds={[]}
        availableAttenders={mockAttenders}
        onSubmit={vi.fn()}
        isPending={false}
      />
    );

    expect(screen.getByRole('button', { name: /Cancelar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Salvar/ })).toBeInTheDocument();
  });

  it('maintains selection across search', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <EditAttendersDialog
        open={true}
        onOpenChange={vi.fn()}
        selectedIds={[1]}
        availableAttenders={mockAttenders}
        onSubmit={vi.fn()}
        isPending={false}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).toBeChecked();

    const searchInput = screen.getByPlaceholderText('Digite o nome...');
    await user.type(searchInput, 'Maria');

    await user.clear(searchInput);

    const checkboxesAfter = screen.getAllByRole('checkbox');
    expect(checkboxesAfter[0]).toBeChecked();
  });
});
