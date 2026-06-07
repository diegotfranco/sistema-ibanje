import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EventForm } from './EventForm';
import { renderWithProviders } from '@/test/renderWithProviders';

const mockEvent = {
  id: 1,
  title: 'Culto Domingo',
  description: 'Culto de adoração',
  location: 'Templo Principal',
  startTime: '2024-06-09T09:00:00Z',
  endTime: '2024-06-09T10:30:00Z',
  status: 'ativo' as const,
  createdAt: '2024-06-01T10:00:00Z',
  updatedAt: '2024-06-01T10:00:00Z'
};

describe('EventForm', () => {
  it('renders form fields', () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();

    renderWithProviders(
      <EventForm
        initialValues={undefined}
        isPending={false}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );

    expect(screen.getByText('Título')).toBeInTheDocument();
    expect(screen.getByText('Início')).toBeInTheDocument();
    expect(screen.getByText('Término')).toBeInTheDocument();
    expect(screen.getByText('Local')).toBeInTheDocument();
    expect(screen.getByText('Descrição')).toBeInTheDocument();
  });

  it('renders cancel and save buttons', () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();

    renderWithProviders(
      <EventForm
        initialValues={undefined}
        isPending={false}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );

    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /salvar/i })).toBeInTheDocument();
  });

  it('populates form with initial values', () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();

    const { container } = renderWithProviders(
      <EventForm
        initialValues={mockEvent}
        isPending={false}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );

    // Find title input by maxlength attribute
    const titleInput = container.querySelector('input[maxlength="128"]') as HTMLInputElement;
    expect(titleInput?.value).toBe('Culto Domingo');
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onCancel = vi.fn();

    renderWithProviders(
      <EventForm
        initialValues={undefined}
        isPending={false}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancelar/i });
    await user.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });

  it('calls onSubmit with form values when submitted', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onCancel = vi.fn();

    const { container } = renderWithProviders(
      <EventForm
        initialValues={undefined}
        isPending={false}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );

    const titleInputs = container.querySelectorAll('input[maxlength="128"]');
    const titleInput = titleInputs[0] as HTMLInputElement;
    if (titleInput) {
      await user.type(titleInput, 'Novo');
    }

    const datetimeInputs = container.querySelectorAll('input[type="datetime-local"]');
    const startInput = datetimeInputs[0] as HTMLInputElement;
    const endInput = datetimeInputs[1] as HTMLInputElement;
    if (startInput) {
      await user.type(startInput, '2024-06-15T10:00');
    }
    if (endInput) {
      await user.type(endInput, '2024-06-15T11:00');
    }

    const saveButton = screen.getByRole('button', { name: /salvar/i });
    await user.click(saveButton);

    expect(onSubmit).toHaveBeenCalled();
  });

  it('disables buttons when isPending is true', () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();

    renderWithProviders(
      <EventForm
        initialValues={undefined}
        isPending={true}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancelar/i });
    const saveButton = screen.getByRole('button', { name: /salvando/i });

    expect(cancelButton).toBeDisabled();
    expect(saveButton).toBeDisabled();
  });

  it('shows saving state on save button', () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();

    renderWithProviders(
      <EventForm
        initialValues={undefined}
        isPending={true}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );

    expect(screen.getByRole('button', { name: /salvando/i })).toBeInTheDocument();
  });

  it('accepts optional location field', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onCancel = vi.fn();

    const { container } = renderWithProviders(
      <EventForm
        initialValues={undefined}
        isPending={false}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );

    const inputs = container.querySelectorAll('input[type="text"]');
    const locationInput = inputs[2] as HTMLInputElement; // Third text input should be location
    if (locationInput) {
      await user.type(locationInput, 'Sala de Eventos');
      expect(locationInput.value).toBe('Sala de Eventos');
    }
  });

  it('accepts optional description field', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onCancel = vi.fn();

    const { container } = renderWithProviders(
      <EventForm
        initialValues={undefined}
        isPending={false}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );

    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
    if (textarea) {
      await user.type(textarea, 'Uma descrição detalhada');
      expect(textarea.value).toBe('Uma descrição detalhada');
    }
  });
});
