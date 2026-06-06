import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import AttenderDetailPage from './AttenderDetailPage';
import { renderWithProviders } from '@/test/renderWithProviders';
import { setupTestServer, referenceHandlers, API } from '@/test/server';

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
  userId: null,
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

describe('AttenderDetailPage', () => {
  it('renders attender details once data loads', async () => {
    server.use(
      http.get(`${API}/attenders/1`, () => HttpResponse.json(attender)),
      ...referenceHandlers()
    );

    renderWithProviders(<AttenderDetailPage />, { path: '/attenders/:id', route: '/attenders/1' });

    expect(await screen.findByText('João Silva')).toBeInTheDocument();
    expect(screen.getAllByText('Membro')).toHaveLength(2);
  });

  it('shows loading state initially', () => {
    server.use(
      http.get(`${API}/attenders/1`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json(attender);
      }),
      ...referenceHandlers()
    );

    renderWithProviders(<AttenderDetailPage />, { path: '/attenders/:id', route: '/attenders/1' });

    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });

  it('shows not found message when attender does not exist', async () => {
    server.use(
      http.get(`${API}/attenders/999`, () => HttpResponse.json(null, { status: 404 })),
      ...referenceHandlers()
    );

    renderWithProviders(<AttenderDetailPage />, {
      path: '/attenders/:id',
      route: '/attenders/999'
    });

    await waitFor(() => expect(screen.getByText('Congregado não encontrado.')).toBeInTheDocument());
  });

  it('displays back button to navigate to previous page', async () => {
    server.use(
      http.get(`${API}/attenders/1`, () => HttpResponse.json(attender)),
      ...referenceHandlers()
    );

    renderWithProviders(<AttenderDetailPage />, { path: '/attenders/:id', route: '/attenders/1' });

    expect(await screen.findByRole('button', { name: /voltar/i })).toBeInTheDocument();
  });
});
