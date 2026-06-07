import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import MePage from './MePage';
import { renderWithProviders } from '@/test/renderWithProviders';
import { setupTestServer, referenceHandlers, meHandler, API } from '@/test/server';

const server = setupTestServer();

const attender = {
  id: 1,
  name: 'João Silva',
  isMember: true,
  phone: '(11) 99999-1111',
  email: 'joao@email.com',
  status: 'ativo',
  city: 'São Paulo',
  state: 'SP',
  userId: 1,
  birthDate: '2000-01-15',
  addressStreet: 'Rua A',
  addressNumber: '123',
  addressComplement: null,
  addressDistrict: 'Centro',
  postalCode: '12345678',
  memberSince: '2020-01',
  baptismDate: '2020-05-10',
  congregatingSince: '2019-06',
  admissionMode: 'batismo'
};

describe('MePage', () => {
  it('renders the profile page title', async () => {
    server.use(
      meHandler({ attenderId: 1 }),
      http.get(`${API}/attenders/1`, () => HttpResponse.json(attender)),
      ...referenceHandlers()
    );

    renderWithProviders(<MePage />);

    expect(await screen.findByText('Meu Perfil')).toBeInTheDocument();
  });

  it('displays form fields for editing profile', async () => {
    server.use(
      meHandler({ attenderId: 1 }),
      http.get(`${API}/attenders/1`, () => HttpResponse.json(attender)),
      ...referenceHandlers()
    );

    renderWithProviders(<MePage />);

    await screen.findByText('Meu Perfil');

    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
    expect(screen.getByLabelText('Telefone')).toBeInTheDocument();
    expect(screen.getByLabelText('Rua')).toBeInTheDocument();
    expect(screen.getByLabelText('Cidade')).toBeInTheDocument();
  });

  it('shows loading state when fetching user data', () => {
    server.use(
      meHandler({ attenderId: 1 }),
      http.get(`${API}/attenders/1`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json(attender);
      }),
      ...referenceHandlers()
    );

    renderWithProviders(<MePage />);

    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });

  it('displays save button', async () => {
    server.use(
      meHandler({ attenderId: 1 }),
      http.get(`${API}/attenders/1`, () => HttpResponse.json(attender)),
      ...referenceHandlers()
    );

    renderWithProviders(<MePage />);

    expect(await screen.findByRole('button', { name: /salvar alterações/i })).toBeInTheDocument();
  });
});
