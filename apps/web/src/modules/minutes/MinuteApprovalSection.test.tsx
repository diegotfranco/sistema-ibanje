import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MinuteStatus } from '@sistema-ibanje/shared';
import MinuteApprovalSection from './MinuteApprovalSection';
import { renderWithProviders } from '@/test/renderWithProviders';

vi.mock('./useMinutes', () => ({
  useApproveMinute: () => ({
    mutate: vi.fn((_, opts) => opts.onSuccess?.()),
    isPending: false
  }),
  useFinalizeDraft: () => ({
    mutate: vi.fn((_, opts) => opts.onSuccess?.()),
    isPending: false
  }),
  useSignMinute: () => ({
    mutate: vi.fn((_, opts) => opts.onSuccess?.()),
    isPending: false
  })
}));

describe('MinuteApprovalSection', () => {
  it('shows approve button when conditions met', () => {
    renderWithProviders(
      <MinuteApprovalSection
        minuteId={1}
        currentStatus={MinuteStatus.AwaitingApproval}
        canEdit={false}
        canReview={true}
      />
    );

    expect(screen.getByRole('button', { name: /Aprovar/i })).toBeInTheDocument();
  });

  it('hides approve button when canReview is false', () => {
    renderWithProviders(
      <MinuteApprovalSection
        minuteId={1}
        currentStatus={MinuteStatus.AwaitingApproval}
        canEdit={false}
        canReview={false}
      />
    );

    expect(screen.queryByRole('button', { name: /Aprovar/i })).not.toBeInTheDocument();
  });

  it('shows finalize draft button when conditions met', () => {
    renderWithProviders(
      <MinuteApprovalSection
        minuteId={1}
        currentStatus={MinuteStatus.Draft}
        canEdit={true}
        canReview={false}
      />
    );

    expect(screen.getByRole('button', { name: /Finalizar Rascunho/i })).toBeInTheDocument();
  });

  it('hides finalize when canEdit is false', () => {
    renderWithProviders(
      <MinuteApprovalSection
        minuteId={1}
        currentStatus={MinuteStatus.Draft}
        canEdit={false}
        canReview={false}
      />
    );

    expect(screen.queryByRole('button', { name: /Finalizar Rascunho/i })).not.toBeInTheDocument();
  });

  it('shows upload button for Approved status', () => {
    renderWithProviders(
      <MinuteApprovalSection
        minuteId={1}
        currentStatus={MinuteStatus.Approved}
        canEdit={true}
        canReview={false}
      />
    );

    expect(screen.getByRole('button', { name: /Substituir Documento/i })).toBeInTheDocument();
  });

  it('shows upload button for AwaitingApproval with canEdit', () => {
    renderWithProviders(
      <MinuteApprovalSection
        minuteId={1}
        currentStatus={MinuteStatus.AwaitingApproval}
        canEdit={true}
        canReview={false}
      />
    );

    expect(screen.getByRole('button', { name: /Enviar PDF Assinado/i })).toBeInTheDocument();
  });

  it('opens approve dialog on button click', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <MinuteApprovalSection
        minuteId={1}
        currentStatus={MinuteStatus.AwaitingApproval}
        canEdit={false}
        canReview={true}
      />
    );

    const approveBtn = screen.getByRole('button', { name: /Aprovar/i });
    await user.click(approveBtn);

    await waitFor(() => {
      expect(screen.getByText('Aprovar Ata')).toBeInTheDocument();
    });
  });

  it('calls onApproveSuccess when approved', async () => {
    const user = userEvent.setup();
    const onApproveSuccess = vi.fn();

    renderWithProviders(
      <MinuteApprovalSection
        minuteId={1}
        currentStatus={MinuteStatus.AwaitingApproval}
        canEdit={false}
        canReview={true}
        onApproveSuccess={onApproveSuccess}
      />
    );

    const approveBtn = screen.getByRole('button', { name: /Aprovar/i });
    await user.click(approveBtn);

    const confirmBtn = await screen.findByRole('button', { name: /Confirmar Aprovação/i });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(onApproveSuccess).toHaveBeenCalled();
    });
  });

  it('allows canceling approve dialog', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <MinuteApprovalSection
        minuteId={1}
        currentStatus={MinuteStatus.AwaitingApproval}
        canEdit={false}
        canReview={true}
      />
    );

    const approveBtn = screen.getByRole('button', { name: /Aprovar/i });
    await user.click(approveBtn);

    const cancelBtn = await screen.findByRole('button', { name: /Cancelar/i });
    await user.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByText('Aprovar Ata')).not.toBeInTheDocument();
    });
  });

  it('opens upload dialog on button click', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <MinuteApprovalSection
        minuteId={1}
        currentStatus={MinuteStatus.Approved}
        canEdit={true}
        canReview={false}
      />
    );

    const uploadBtn = screen.getByRole('button', { name: /Substituir Documento/i });
    await user.click(uploadBtn);

    await waitFor(() => {
      expect(screen.getByText('Enviar PDF Assinado')).toBeInTheDocument();
    });
  });

  it('shows file input in upload dialog', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <MinuteApprovalSection
        minuteId={1}
        currentStatus={MinuteStatus.Approved}
        canEdit={true}
        canReview={false}
      />
    );

    const uploadBtn = screen.getByRole('button', { name: /Substituir Documento/i });
    await user.click(uploadBtn);

    const fileInput = await screen.findByLabelText(/Arquivo PDF/);
    expect(fileInput).toBeInTheDocument();
  });

  it('disables upload when no file selected', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <MinuteApprovalSection
        minuteId={1}
        currentStatus={MinuteStatus.Approved}
        canEdit={true}
        canReview={false}
      />
    );

    const uploadBtn = screen.getByRole('button', { name: /Substituir Documento/i });
    await user.click(uploadBtn);

    const submitBtn = await screen.findByRole('button', { name: /Enviar/ });
    expect(submitBtn).toBeDisabled();
  });

  it('hides approve button wrong status', () => {
    renderWithProviders(
      <MinuteApprovalSection
        minuteId={1}
        currentStatus={MinuteStatus.Draft}
        canEdit={false}
        canReview={true}
      />
    );

    expect(screen.queryByRole('button', { name: /Aprovar/i })).not.toBeInTheDocument();
  });

  it('renders no buttons when no permissions', () => {
    const { container } = renderWithProviders(
      <MinuteApprovalSection
        minuteId={1}
        currentStatus={MinuteStatus.Approved}
        canEdit={false}
        canReview={false}
      />
    );

    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBe(0);
  });
});
