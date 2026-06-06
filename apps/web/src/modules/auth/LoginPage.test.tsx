import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import LoginPage from './LoginPage';
import { renderWithProviders } from '@/test/renderWithProviders';
import { invalidateCsrfToken } from '@/lib/api';

const BASE = 'http://localhost/api';

// Default handlers: a CSRF token and a 401 on /auth/me (logged-out) so LoginPage renders its form
// instead of redirecting.
function baseHandlers() {
  return [
    http.get(`${BASE}/auth/csrf-token`, () => HttpResponse.json({ csrfToken: 'tok' })),
    http.get(`${BASE}/auth/me`, () =>
      HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    )
  ];
}

const server = setupServer(...baseHandlers());

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers(...baseHandlers());
  invalidateCsrfToken();
});
afterAll(() => server.close());

describe('LoginPage', () => {
  it('blocks submit and shows inline validation for empty fields (no login request)', async () => {
    let loginCalled = false;
    server.use(
      http.post(`${BASE}/auth/login`, () => {
        loginCalled = true;
        return HttpResponse.json({}, { status: 200 });
      })
    );
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByText('A senha deve ter no mínimo 8 caracteres')).toBeInTheDocument();
    expect(loginCalled).toBe(false);
  });

  it('submits valid credentials to /auth/login with the typed email', async () => {
    let seenEmail: string | null = null;
    // Keep /auth/me at 401 (default) so the page renders the form rather than redirecting on mount.
    // We assert the login POST fired with the typed email; the post-login currentUser fetch is out of
    // scope here (covered by e2e).
    server.use(
      http.post(`${BASE}/auth/login`, async ({ request }) => {
        const body = (await request.json()) as { email: string };
        seenEmail = body.email;
        return HttpResponse.json({ name: 'Admin', email: body.email, role: 'Administrador' });
      })
    );
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText('E-mail'), 'admin@email.com');
    // "Senha" matches the input label, the show-password toggle, and the forgot link; target by id.
    await user.type(document.querySelector('#password') as HTMLInputElement, 'admin12345');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    await vi.waitFor(() => expect(seenEmail).toBe('admin@email.com'));
  });
});
