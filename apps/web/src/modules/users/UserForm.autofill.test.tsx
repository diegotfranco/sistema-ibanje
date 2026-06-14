import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserForm from './UserForm';
import { renderWithProviders } from '@/test/renderWithProviders';
import { setupTestServer, referenceHandlers, listHandler } from '@/test/server';

const server = setupTestServer();
const roles = [{ id: 1, name: 'Administrador', description: '', status: 'ativo' }];

// Mimic browser autofill / passive prefill: the value is set on the DOM node directly, with no
// React change event — exactly the path that desyncs react-hook-form.
function nativeSetValue(el: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
  setter.call(el, value);
}

const initialValues = {
  id: 1,
  name: 'João Silva',
  email: 'joao@email.com',
  role: 'Administrador',
  roleId: 1,
  status: 'ativo',
  createdAt: '2024-01-01'
};

describe('UserForm — autofill resilience', () => {
  it('submits autofilled create values (no React change event) instead of failing validation', async () => {
    server.use(listHandler('/roles', roles), listHandler('/attenders', []), ...referenceHandlers());
    const onSubmit = vi.fn();
    renderWithProviders(<UserForm onSubmit={onSubmit} onCancel={() => {}} isPending={false} />);

    nativeSetValue(screen.getByLabelText('Nome *') as HTMLInputElement, 'Diego Franco');
    nativeSetValue(screen.getByLabelText('E-mail *') as HTMLInputElement, 'diegotfranco@gmail.com');

    await userEvent.click(screen.getByRole('button', { name: /salvar/i }));

    // Cargo is still empty so the submit won't pass — but the autofilled name/email must NOT report
    // as missing/invalid. Before the fix, both fields wrongly showed required/invalid errors.
    await waitFor(() => expect(screen.queryByText('Nome é obrigatório')).not.toBeInTheDocument());
    expect(screen.queryByText(/e-mail.*(obrigat|inválid)/i)).not.toBeInTheDocument();
  });

  it('submits autofill-overwritten edit values, not the stale originals', async () => {
    server.use(listHandler('/roles', roles), listHandler('/attenders', []), ...referenceHandlers());
    const onSubmit = vi.fn();
    renderWithProviders(
      <UserForm
        initialValues={initialValues}
        onSubmit={onSubmit}
        onCancel={() => {}}
        isPending={false}
      />
    );

    nativeSetValue(screen.getByDisplayValue('João Silva') as HTMLInputElement, 'João Editado');

    await userEvent.click(screen.getByRole('button', { name: /salvar/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ name: 'João Editado' });
  });
});
