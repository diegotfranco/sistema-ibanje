import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import ForgotPasswordPage from './ForgotPasswordPage';
import { renderWithProviders } from '@/test/renderWithProviders';
import { setupTestServer, csrfHandler } from '@/test/server';

const API = 'http://localhost/api';
const server = setupTestServer();

describe('ForgotPasswordPage', () => {
  it('renders the forgot password form with email field', async () => {
    server.use(
      http.get(`${API}/auth/me`, () => HttpResponse.json({}, { status: 401 })),
      csrfHandler()
    );

    renderWithProviders(<ForgotPasswordPage />);

    expect(await screen.findByText('Esqueceu sua senha?')).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar instruções/i })).toBeInTheDocument();
  });

  it('shows the "Já possui conta?" link to login page', async () => {
    server.use(
      http.get(`${API}/auth/me`, () => HttpResponse.json({}, { status: 401 })),
      csrfHandler()
    );

    renderWithProviders(<ForgotPasswordPage />);

    expect(await screen.findByRole('link', { name: /já possui conta/i })).toBeInTheDocument();
  });

  it('shows the description about receiving password reset instructions', async () => {
    server.use(
      http.get(`${API}/auth/me`, () => HttpResponse.json({}, { status: 401 })),
      csrfHandler()
    );

    renderWithProviders(<ForgotPasswordPage />);

    expect(
      await screen.findByText(
        'Informe seu e-mail e enviaremos as instruções para redefinir sua senha.'
      )
    ).toBeInTheDocument();
  });

  it('blocks submit with validation error when email is invalid', async () => {
    let forgotPasswordCalled = false;
    server.use(
      http.get(`${API}/auth/me`, () => HttpResponse.json({}, { status: 401 })),
      csrfHandler(),
      http.post(`${API}/auth/password-reset/request`, () => {
        forgotPasswordCalled = true;
        return HttpResponse.json({});
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText('E-mail');
    await user.type(emailInput, 'invalid-email');
    await user.click(screen.getByRole('button', { name: /enviar instruções/i }));

    await waitFor(() => {
      expect(forgotPasswordCalled).toBe(false);
    });
  });

  it('rejects when email field is empty', async () => {
    let forgotPasswordCalled = false;
    server.use(
      http.get(`${API}/auth/me`, () => HttpResponse.json({}, { status: 401 })),
      csrfHandler(),
      http.post(`${API}/auth/password-reset/request`, () => {
        forgotPasswordCalled = true;
        return HttpResponse.json({});
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordPage />);

    await user.click(screen.getByRole('button', { name: /enviar instruções/i }));

    await waitFor(() => {
      expect(forgotPasswordCalled).toBe(false);
    });
  });

  it('submits a valid email to /auth/forgot-password', async () => {
    let seenEmail: string | null = null;

    server.use(
      http.get(`${API}/auth/me`, () => HttpResponse.json({}, { status: 401 })),
      csrfHandler(),
      http.post(`${API}/auth/password-reset/request`, async ({ request }) => {
        const body = (await request.json()) as { email: string };
        seenEmail = body.email;
        return HttpResponse.json({ message: 'Instructions sent' });
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText('E-mail');
    await user.type(emailInput, 'user@example.com');
    await user.click(screen.getByRole('button', { name: /enviar instruções/i }));

    await waitFor(() => {
      expect(seenEmail).toBe('user@example.com');
    });
  });

  it('disables the submit button while sending', async () => {
    server.use(
      http.get(`${API}/auth/me`, () => HttpResponse.json({}, { status: 401 })),
      csrfHandler(),
      http.post(`${API}/auth/password-reset/request`, async () => {
        await new Promise((r) => setTimeout(r, 100));
        return HttpResponse.json({});
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText('E-mail');
    const submitButton = screen.getByRole('button', { name: /enviar instruções/i });

    await user.type(emailInput, 'user@example.com');
    await user.click(submitButton);

    expect(submitButton).toHaveTextContent('Enviando...');
  });

  it('accepts valid email formats with dots and plus signs', async () => {
    let seenEmail: string | null = null;

    server.use(
      http.get(`${API}/auth/me`, () => HttpResponse.json({}, { status: 401 })),
      csrfHandler(),
      http.post(`${API}/auth/password-reset/request`, async ({ request }) => {
        const body = (await request.json()) as { email: string };
        seenEmail = body.email;
        return HttpResponse.json({});
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText('E-mail');
    await user.type(emailInput, 'test.user+tag@example.co.uk');
    await user.click(screen.getByRole('button', { name: /enviar instruções/i }));

    await waitFor(() => {
      expect(seenEmail).toBe('test.user+tag@example.co.uk');
    });
  });
});
