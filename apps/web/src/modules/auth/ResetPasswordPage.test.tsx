import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import ResetPasswordPage from './ResetPasswordPage';
import { renderWithProviders } from '@/test/renderWithProviders';
import { setupTestServer, csrfHandler } from '@/test/server';

const API = 'http://localhost/api';
const server = setupTestServer();

describe('ResetPasswordPage', () => {
  it('renders the invalid token message when no token is provided', async () => {
    server.use(
      http.get(`${API}/auth/me`, () => HttpResponse.json({}, { status: 401 })),
      csrfHandler()
    );

    renderWithProviders(<ResetPasswordPage />, { route: '/reset-password' });

    expect(await screen.findByText('Link de redefinição inválido ou ausente.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /solicitar novo link/i })).toBeInTheDocument();
  });

  it('renders the reset password form when a valid token is provided', async () => {
    server.use(
      http.get(`${API}/auth/me`, () => HttpResponse.json({}, { status: 401 })),
      csrfHandler()
    );

    renderWithProviders(<ResetPasswordPage />, {
      route: '/reset-password?token=valid-token-xyz'
    });

    expect(await screen.findByRole('heading', { name: 'Definir senha' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nova senha')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirmar senha')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /definir senha/i })).toBeInTheDocument();
  });

  it('shows the "Voltar ao login" link', async () => {
    server.use(
      http.get(`${API}/auth/me`, () => HttpResponse.json({}, { status: 401 })),
      csrfHandler()
    );

    renderWithProviders(<ResetPasswordPage />, {
      route: '/reset-password?token=valid-token'
    });

    expect(await screen.findByRole('link', { name: /voltar ao login/i })).toBeInTheDocument();
  });

  it('blocks submit when password is shorter than 8 chars', async () => {
    let resetCalled = false;
    server.use(
      http.get(`${API}/auth/me`, () => HttpResponse.json({}, { status: 401 })),
      csrfHandler(),
      http.post(`${API}/auth/password-reset/confirm`, () => {
        resetCalled = true;
        return HttpResponse.json({});
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<ResetPasswordPage />, {
      route: '/reset-password?token=valid-token'
    });

    const newPasswordInput = screen.getByLabelText('Nova senha');
    await user.type(newPasswordInput, 'short');
    await user.click(screen.getByRole('button', { name: /definir senha/i }));

    expect(await screen.findByText('A senha deve ter no mínimo 8 caracteres')).toBeInTheDocument();
    expect(resetCalled).toBe(false);
  });

  it('blocks submit when passwords do not match', async () => {
    let resetCalled = false;
    server.use(
      http.get(`${API}/auth/me`, () => HttpResponse.json({}, { status: 401 })),
      csrfHandler(),
      http.post(`${API}/auth/password-reset/confirm`, () => {
        resetCalled = true;
        return HttpResponse.json({});
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<ResetPasswordPage />, {
      route: '/reset-password?token=valid-token'
    });

    const newPasswordInput = screen.getByLabelText('Nova senha');
    const confirmPasswordInput = screen.getByLabelText('Confirmar senha');

    await user.type(newPasswordInput, 'password123456');
    await user.type(confirmPasswordInput, 'differentPassword789');
    await user.click(screen.getByRole('button', { name: /definir senha/i }));

    expect(await screen.findByText('As senhas não coincidem')).toBeInTheDocument();
    expect(resetCalled).toBe(false);
  });

  it('submits matching valid passwords to /auth/password-reset/confirm', async () => {
    let seenPassword: string | null = null;
    let seenToken: string | null = null;

    server.use(
      http.get(`${API}/auth/me`, () => HttpResponse.json({}, { status: 401 })),
      csrfHandler(),
      http.post(`${API}/auth/password-reset/confirm`, async ({ request }) => {
        const body = (await request.json()) as { newPassword: string; token: string };
        seenPassword = body.newPassword;
        seenToken = body.token;
        return HttpResponse.json({ success: true });
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<ResetPasswordPage />, {
      route: '/reset-password?token=test-token-12345'
    });

    const newPasswordInput = screen.getByLabelText('Nova senha');
    const confirmPasswordInput = screen.getByLabelText('Confirmar senha');

    await user.type(newPasswordInput, 'newPassword123456');
    await user.type(confirmPasswordInput, 'newPassword123456');
    await user.click(screen.getByRole('button', { name: /definir senha/i }));

    await waitFor(() => {
      expect(seenPassword).toBe('newPassword123456');
      expect(seenToken).toBe('test-token-12345');
    });
  });

  it('disables the submit button while sending', async () => {
    server.use(
      http.get(`${API}/auth/me`, () => HttpResponse.json({}, { status: 401 })),
      csrfHandler(),
      http.post(`${API}/auth/password-reset/confirm`, async () => {
        await new Promise((r) => setTimeout(r, 100));
        return HttpResponse.json({});
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<ResetPasswordPage />, {
      route: '/reset-password?token=valid-token'
    });

    const newPasswordInput = screen.getByLabelText('Nova senha');
    const confirmPasswordInput = screen.getByLabelText('Confirmar senha');
    const submitButton = screen.getByRole('button', { name: /definir senha/i });

    await user.type(newPasswordInput, 'newPassword123456');
    await user.type(confirmPasswordInput, 'newPassword123456');
    await user.click(submitButton);

    expect(submitButton).toHaveTextContent('Salvando...');
  });

  it('shows the token error message and provides link to request new one', async () => {
    server.use(
      http.get(`${API}/auth/me`, () => HttpResponse.json({}, { status: 401 })),
      csrfHandler()
    );

    renderWithProviders(<ResetPasswordPage />, { route: '/reset-password' });

    expect(await screen.findByText('Link de redefinição inválido ou ausente.')).toBeInTheDocument();
    const forgotLink = screen.getByRole('link', { name: /solicitar novo link/i });
    expect(forgotLink).toBeInTheDocument();
    expect(forgotLink).toHaveAttribute('href', '/forgot-password');
  });

  it('accepts passwords with at least 8 characters', async () => {
    let passwordSubmitted: string | null = null;

    server.use(
      http.get(`${API}/auth/me`, () => HttpResponse.json({}, { status: 401 })),
      csrfHandler(),
      http.post(`${API}/auth/password-reset/confirm`, async ({ request }) => {
        const body = (await request.json()) as { newPassword: string };
        passwordSubmitted = body.newPassword;
        return HttpResponse.json({});
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<ResetPasswordPage />, {
      route: '/reset-password?token=test-token'
    });

    const newPasswordInput = screen.getByLabelText('Nova senha');
    const confirmPasswordInput = screen.getByLabelText('Confirmar senha');

    await user.type(newPasswordInput, 'VeryLongPasswordWith12345Characters');
    await user.type(confirmPasswordInput, 'VeryLongPasswordWith12345Characters');
    await user.click(screen.getByRole('button', { name: /definir senha/i }));

    await waitFor(() => {
      expect(passwordSubmitted).toBe('VeryLongPasswordWith12345Characters');
    });
  });
});
