import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import RegisterPage from './RegisterPage';
import { renderWithProviders } from '@/test/renderWithProviders';
import { setupTestServer, csrfHandler } from '@/test/server';

const API = 'http://localhost/api';
const server = setupTestServer();

describe('RegisterPage', () => {
  it('renders the registration form with name and email fields', async () => {
    server.use(
      http.get(`${API}/auth/me`, () => HttpResponse.json({}, { status: 401 })),
      csrfHandler()
    );

    renderWithProviders(<RegisterPage />);

    expect(await screen.findByText('Cadastro')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome completo')).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /solicitar acesso/i })).toBeInTheDocument();
  });

  it('shows the "Já possui conta?" link to login page', async () => {
    server.use(
      http.get(`${API}/auth/me`, () => HttpResponse.json({}, { status: 401 })),
      csrfHandler()
    );

    renderWithProviders(<RegisterPage />);

    expect(await screen.findByRole('link', { name: /já possui conta/i })).toBeInTheDocument();
  });

  it('blocks submit with validation errors when fields are empty', async () => {
    let registerCalled = false;
    server.use(
      http.get(`${API}/auth/me`, () => HttpResponse.json({}, { status: 401 })),
      csrfHandler(),
      http.post(`${API}/auth/register`, () => {
        registerCalled = true;
        return HttpResponse.json({});
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await user.click(screen.getByRole('button', { name: /solicitar acesso/i }));

    expect(await screen.findByText('O nome deve ter pelo menos 2 caracteres')).toBeInTheDocument();
    expect(registerCalled).toBe(false);
  });

  it('rejects a name shorter than 2 chars with the pt-BR message', async () => {
    server.use(
      http.get(`${API}/auth/me`, () => HttpResponse.json({}, { status: 401 })),
      csrfHandler()
    );

    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    const nameInput = screen.getByLabelText('Nome completo');
    await user.type(nameInput, 'a');
    await user.click(screen.getByRole('button', { name: /solicitar acesso/i }));

    expect(await screen.findByText('O nome deve ter pelo menos 2 caracteres')).toBeInTheDocument();
  });

  it('rejects an invalid email format', async () => {
    server.use(
      http.get(`${API}/auth/me`, () => HttpResponse.json({}, { status: 401 })),
      csrfHandler()
    );

    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    const nameInput = screen.getByLabelText('Nome completo');
    const emailInput = screen.getByLabelText('E-mail');

    await user.type(nameInput, 'João Silva');
    await user.type(emailInput, 'invalid-email');
    await user.click(screen.getByRole('button', { name: /solicitar acesso/i }));

    await waitFor(() => {
      expect(screen.queryByText('Nome')).not.toBeInTheDocument();
    });
  });

  it('submits valid registration data to /auth/register', async () => {
    let seenEmail: string | null = null;
    let seenName: string | null = null;

    server.use(
      http.get(`${API}/auth/me`, () => HttpResponse.json({}, { status: 401 })),
      csrfHandler(),
      http.post(`${API}/auth/register`, async ({ request }) => {
        const body = (await request.json()) as { name: string; email: string };
        seenName = body.name;
        seenEmail = body.email;
        return HttpResponse.json({ success: true });
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    const nameInput = screen.getByLabelText('Nome completo');
    const emailInput = screen.getByLabelText('E-mail');

    await user.type(nameInput, 'João Silva Santos');
    await user.type(emailInput, 'joao@example.com');
    await user.click(screen.getByRole('button', { name: /solicitar acesso/i }));

    await waitFor(() => {
      expect(seenName).toBe('João Silva Santos');
      expect(seenEmail).toBe('joao@example.com');
    });
  });

  it('disables the submit button while sending', async () => {
    server.use(
      http.get(`${API}/auth/me`, () => HttpResponse.json({}, { status: 401 })),
      csrfHandler(),
      http.post(`${API}/auth/register`, async () => {
        await new Promise((r) => setTimeout(r, 100));
        return HttpResponse.json({ success: true });
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    const nameInput = screen.getByLabelText('Nome completo');
    const emailInput = screen.getByLabelText('E-mail');
    const submitButton = screen.getByRole('button', { name: /solicitar acesso/i });

    await user.type(nameInput, 'João Silva');
    await user.type(emailInput, 'joao@example.com');
    await user.click(submitButton);

    expect(submitButton).toHaveTextContent('Enviando...');
  });
});
