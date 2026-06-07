import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MinuteTemplateForm from './MinuteTemplateForm';
import { renderWithProviders } from '@/test/renderWithProviders';
import { setupTestServer, referenceHandlers } from '@/test/server';
import { MeetingType } from '@sistema-ibanje/shared';

const server = setupTestServer();

const sampleTemplate = {
  id: 1,
  meetingType: MeetingType.Ordinary,
  name: 'Assembleia Ordinária',
  content: { type: 'doc', content: [] },
  isDefault: true,
  defaultAgendaItems: [
    { title: 'Abertura', description: 'Abertura da reunião' },
    { title: 'Votação', description: null }
  ],
  createdAt: '2026-01-01T10:00:00Z',
  updatedAt: '2026-01-01T10:00:00Z'
};

describe('MinuteTemplateForm', () => {
  beforeEach(() => {
    server.use(...referenceHandlers());
  });

  it('renders create form when no initialData provided', async () => {
    const handleSubmit = vi.fn();

    renderWithProviders(
      <MinuteTemplateForm
        open={true}
        onOpenChange={() => {}}
        onSubmit={handleSubmit}
        isPending={false}
      />
    );

    expect(await screen.findByText('Novo Modelo de Ata')).toBeInTheDocument();
  });

  it('renders edit form when initialData provided', async () => {
    const handleSubmit = vi.fn();

    renderWithProviders(
      <MinuteTemplateForm
        open={true}
        onOpenChange={() => {}}
        onSubmit={handleSubmit}
        isPending={false}
        initialData={sampleTemplate}
      />
    );

    expect(await screen.findByText('Editar Modelo')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Assembleia Ordinária')).toBeInTheDocument();
  });

  it('displays form fields', async () => {
    const handleSubmit = vi.fn();

    renderWithProviders(
      <MinuteTemplateForm
        open={true}
        onOpenChange={() => {}}
        onSubmit={handleSubmit}
        isPending={false}
      />
    );

    expect(await screen.findByLabelText('Nome *')).toBeInTheDocument();
    expect(screen.getByLabelText('Tipo de Reunião *')).toBeInTheDocument();
    expect(screen.getByText('Modelo Padrão')).toBeInTheDocument();
  });

  it('allows entering a template name', async () => {
    const handleSubmit = vi.fn();

    renderWithProviders(
      <MinuteTemplateForm
        open={true}
        onOpenChange={() => {}}
        onSubmit={handleSubmit}
        isPending={false}
      />
    );

    const nameInput = await screen.findByLabelText('Nome *');
    await userEvent.type(nameInput, 'Novo Modelo Teste');

    expect(nameInput).toHaveValue('Novo Modelo Teste');
  });

  it('displays the meeting type selector', async () => {
    const handleSubmit = vi.fn();

    renderWithProviders(
      <MinuteTemplateForm
        open={true}
        onOpenChange={() => {}}
        onSubmit={handleSubmit}
        isPending={false}
      />
    );

    const typeSelect = await screen.findByRole('combobox', { name: /tipo de reunião/i });
    expect(typeSelect).toBeInTheDocument();
  });

  it('allows checking the default model checkbox', async () => {
    const handleSubmit = vi.fn();

    renderWithProviders(
      <MinuteTemplateForm
        open={true}
        onOpenChange={() => {}}
        onSubmit={handleSubmit}
        isPending={false}
      />
    );

    const checkbox = await screen.findByRole('checkbox', { name: /modelo padrão/i });
    await userEvent.click(checkbox);

    expect(checkbox).toBeChecked();
  });

  it('displays agenda items section', async () => {
    const handleSubmit = vi.fn();

    renderWithProviders(
      <MinuteTemplateForm
        open={true}
        onOpenChange={() => {}}
        onSubmit={handleSubmit}
        isPending={false}
      />
    );

    expect(await screen.findByText('Itens de Pauta Padrão')).toBeInTheDocument();
    expect(screen.getByText(/adicionar item/i)).toBeInTheDocument();
  });

  it('allows adding agenda items', async () => {
    const handleSubmit = vi.fn();

    renderWithProviders(
      <MinuteTemplateForm
        open={true}
        onOpenChange={() => {}}
        onSubmit={handleSubmit}
        isPending={false}
      />
    );

    const addButton = await screen.findByRole('button', { name: /adicionar item/i });
    await userEvent.click(addButton);

    const agendaInputs = screen.getAllByPlaceholderText('Título do item');
    expect(agendaInputs.length).toBeGreaterThan(0);
  });

  it('allows removing agenda items', async () => {
    const handleSubmit = vi.fn();

    renderWithProviders(
      <MinuteTemplateForm
        open={true}
        onOpenChange={() => {}}
        onSubmit={handleSubmit}
        isPending={false}
        initialData={sampleTemplate}
      />
    );

    await screen.findByText('Editar Modelo');

    const removeButtons = screen
      .getAllByRole('button')
      .filter((btn) => btn.className.includes('text-destructive'));
    expect(removeButtons.length).toBeGreaterThan(0);
  });

  it('displays cancel and save buttons', async () => {
    const handleSubmit = vi.fn();

    renderWithProviders(
      <MinuteTemplateForm
        open={true}
        onOpenChange={() => {}}
        onSubmit={handleSubmit}
        isPending={false}
      />
    );

    expect(await screen.findByRole('button', { name: /cancelar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /salvar/i })).toBeInTheDocument();
  });

  it('disables save button when pending', async () => {
    const handleSubmit = vi.fn();

    renderWithProviders(
      <MinuteTemplateForm
        open={true}
        onOpenChange={() => {}}
        onSubmit={handleSubmit}
        isPending={true}
      />
    );

    const saveButton = await screen.findByRole('button', { name: /salvando/i });
    expect(saveButton).toBeDisabled();
  });

  it('calls onOpenChange when cancel is clicked', async () => {
    const handleOpenChange = vi.fn();
    const handleSubmit = vi.fn();

    renderWithProviders(
      <MinuteTemplateForm
        open={true}
        onOpenChange={handleOpenChange}
        onSubmit={handleSubmit}
        isPending={false}
      />
    );

    const cancelButton = await screen.findByRole('button', { name: /cancelar/i });
    await userEvent.click(cancelButton);

    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });

  it('populates form with initial data', async () => {
    const handleSubmit = vi.fn();

    renderWithProviders(
      <MinuteTemplateForm
        open={true}
        onOpenChange={() => {}}
        onSubmit={handleSubmit}
        isPending={false}
        initialData={sampleTemplate}
      />
    );

    expect(await screen.findByDisplayValue('Assembleia Ordinária')).toBeInTheDocument();
    const checkbox = screen.getByRole('checkbox', { name: /modelo padrão/i });
    expect(checkbox).toBeChecked();
  });

  it('closes form when cancel is clicked', async () => {
    const handleOpenChange = vi.fn();
    const handleSubmit = vi.fn();

    renderWithProviders(
      <MinuteTemplateForm
        open={true}
        onOpenChange={handleOpenChange}
        onSubmit={handleSubmit}
        isPending={false}
      />
    );

    const cancelButton = await screen.findByRole('button', { name: /cancelar/i });
    await userEvent.click(cancelButton);

    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });
});
