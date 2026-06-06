import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AgendaDialog from './AgendaDialog';
import { renderWithProviders } from '@/test/renderWithProviders';
import { setupTestServer, referenceHandlers, API } from '@/test/server';
import { http } from 'msw';

const server = setupTestServer();

const agendaItems = [
  {
    id: 1,
    meetingId: 1,
    order: 1,
    title: 'Abertura',
    description: 'Abertura da reunião',
    createdByUserId: 1,
    status: 'open',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 2,
    meetingId: 1,
    order: 2,
    title: 'Votação',
    description: null,
    createdByUserId: 1,
    status: 'open',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  }
];

describe('AgendaDialog', () => {
  beforeEach(() => {
    server.use(...referenceHandlers());
  });

  it('renders the agenda dialog when open is true', async () => {
    renderWithProviders(
      <AgendaDialog open={true} onOpenChange={() => {}} meetingId={1} currentItems={[]} />
    );

    expect(await screen.findByText('Definir Pauta')).toBeInTheDocument();
  });

  it('does not render when open is false', async () => {
    renderWithProviders(
      <AgendaDialog open={false} onOpenChange={() => {}} meetingId={1} currentItems={[]} />
    );

    expect(screen.queryByText('Definir Pauta')).not.toBeInTheDocument();
  });

  it('populates form with current agenda items', async () => {
    renderWithProviders(
      <AgendaDialog open={true} onOpenChange={() => {}} meetingId={1} currentItems={agendaItems} />
    );

    expect(await screen.findByDisplayValue('Abertura')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Votação')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Abertura da reunião')).toBeInTheDocument();
  });

  it('starts with one empty item if no current items', async () => {
    renderWithProviders(
      <AgendaDialog open={true} onOpenChange={() => {}} meetingId={1} currentItems={[]} />
    );

    const titleInputs = await screen.findAllByPlaceholderText('Título do item');
    expect(titleInputs.length).toBeGreaterThanOrEqual(1);
  });

  it('displays add item button', async () => {
    renderWithProviders(
      <AgendaDialog open={true} onOpenChange={() => {}} meetingId={1} currentItems={[]} />
    );

    expect(await screen.findByRole('button', { name: /adicionar item/i })).toBeInTheDocument();
  });

  it('allows adding new agenda items', async () => {
    renderWithProviders(
      <AgendaDialog open={true} onOpenChange={() => {}} meetingId={1} currentItems={agendaItems} />
    );

    const addButton = await screen.findByRole('button', { name: /adicionar item/i });
    const initialInputs = screen.getAllByPlaceholderText('Título do item');
    const initialCount = initialInputs.length;

    await userEvent.click(addButton);

    const updatedInputs = screen.getAllByPlaceholderText('Título do item');
    expect(updatedInputs.length).toBe(initialCount + 1);
  });

  it('allows entering item title and description', async () => {
    renderWithProviders(
      <AgendaDialog open={true} onOpenChange={() => {}} meetingId={1} currentItems={[]} />
    );

    const titleInput = await screen.findByPlaceholderText('Título do item');
    const descInput = screen.getByPlaceholderText('Descrição (opcional)');

    await userEvent.type(titleInput, 'Nova Pauta');
    await userEvent.type(descInput, 'Descrição da pauta');

    expect(titleInput).toHaveValue('Nova Pauta');
    expect(descInput).toHaveValue('Descrição da pauta');
  });

  it('allows removing items (when more than one item exists)', async () => {
    renderWithProviders(
      <AgendaDialog open={true} onOpenChange={() => {}} meetingId={1} currentItems={agendaItems} />
    );

    const removeButtons = await screen.findAllByRole('button', { name: /remover item/i });
    expect(removeButtons.length).toBeGreaterThan(0);

    await userEvent.click(removeButtons[0]);

    // Should have one fewer item
    const titleInputs = screen.getAllByPlaceholderText('Título do item');
    expect(titleInputs.length).toBe(1);
  });

  it('disables remove button when only one item remains', async () => {
    renderWithProviders(
      <AgendaDialog
        open={true}
        onOpenChange={() => {}}
        meetingId={1}
        currentItems={[agendaItems[0]]}
      />
    );

    const removeButton = await screen.findByRole('button', { name: /remover item/i });
    expect(removeButton).toBeDisabled();
  });

  it('displays save and cancel buttons', async () => {
    renderWithProviders(
      <AgendaDialog open={true} onOpenChange={() => {}} meetingId={1} currentItems={[]} />
    );

    expect(await screen.findByRole('button', { name: /salvar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
  });

  it('calls onOpenChange when cancel is clicked', async () => {
    const handleOpenChange = vi.fn();

    renderWithProviders(
      <AgendaDialog open={true} onOpenChange={handleOpenChange} meetingId={1} currentItems={[]} />
    );

    const cancelButton = await screen.findByRole('button', { name: /cancelar/i });
    await userEvent.click(cancelButton);

    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });

  it('disables save button when pending', async () => {
    server.use(
      http.put(`${API}/meetings/1/agenda-items`, () => new Promise(() => {})),
      ...referenceHandlers()
    );

    renderWithProviders(
      <AgendaDialog open={true} onOpenChange={() => {}} meetingId={1} currentItems={agendaItems} />
    );

    const saveButton = await screen.findByRole('button', { name: /salvar/i });

    // Try to submit the form
    await userEvent.click(saveButton);

    // The button should be disabled during submission
    await screen.findByRole('button', { name: /salvando/i });
  });

  it('displays reorder instructions', async () => {
    renderWithProviders(
      <AgendaDialog open={true} onOpenChange={() => {}} meetingId={1} currentItems={agendaItems} />
    );

    expect(await screen.findByText(/arraste pelo ícone para reordenar/i)).toBeInTheDocument();
  });

  it('allows removing all items by adding a new one if empty', async () => {
    renderWithProviders(
      <AgendaDialog open={true} onOpenChange={() => {}} meetingId={1} currentItems={[]} />
    );

    expect(await screen.findByPlaceholderText('Título do item')).toBeInTheDocument();
  });

  it('respects the maximum of 50 items', async () => {
    const manyItems = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      meetingId: 1,
      order: i + 1,
      title: `Item ${i + 1}`,
      description: null,
      createdByUserId: 1,
      status: 'open',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z'
    }));

    renderWithProviders(
      <AgendaDialog open={true} onOpenChange={() => {}} meetingId={1} currentItems={manyItems} />
    );

    const addButton = await screen.findByRole('button', { name: /adicionar item/i });
    expect(addButton).toBeDisabled();
  });
});
