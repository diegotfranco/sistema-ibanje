import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import ChurchSettingsPage from './ChurchSettingsPage';
import { renderWithProviders } from '@/test/renderWithProviders';
import { setupTestServer, referenceHandlers, API } from '@/test/server';

const server = setupTestServer();

const churchSettings = {
  id: 1,
  name: 'Igreja Batista Ibanje',
  cnpj: '12.345.678/0001-90',
  addressStreet: 'Rua Principal',
  addressNumber: '100',
  addressDistrict: 'Centro',
  addressCity: 'São Paulo',
  addressState: 'SP',
  postalCode: '01000-000',
  phone: '(11) 3000-0000',
  email: 'contato@ibanje.com.br',
  websiteUrl: 'https://ibanje.com.br',
  currentPresidentName: 'João da Silva',
  currentPresidentTitle: 'Presidente',
  currentSecretaryName: 'Maria Santos',
  currentSecretaryTitle: 'Secretária'
};

describe('ChurchSettingsPage', () => {
  it('renders the settings page with title sections', async () => {
    server.use(
      http.get(`${API}/church-settings`, () => HttpResponse.json(churchSettings)),
      ...referenceHandlers()
    );

    renderWithProviders(<ChurchSettingsPage />);

    expect(await screen.findByText('Identificação')).toBeInTheDocument();
    expect(screen.getByText('Contato')).toBeInTheDocument();
    expect(screen.getByText('Diretoria Atual')).toBeInTheDocument();
  });

  it('displays church identification fields', async () => {
    server.use(
      http.get(`${API}/church-settings`, () => HttpResponse.json(churchSettings)),
      ...referenceHandlers()
    );

    renderWithProviders(<ChurchSettingsPage />);

    await screen.findByText('Identificação');

    expect(screen.getByLabelText('Nome')).toBeInTheDocument();
    expect(screen.getByLabelText('CNPJ')).toBeInTheDocument();
    expect(screen.getByLabelText('Código Postal')).toBeInTheDocument();
  });

  // Regression: the form must populate from the async settings query. `defaultValues` alone is read
  // only at mount (EMPTY on a cold load), so the fields stayed blank — fixed by the `values` prop.
  it('populates the fields with the loaded settings values', async () => {
    server.use(
      http.get(`${API}/church-settings`, () => HttpResponse.json(churchSettings)),
      ...referenceHandlers()
    );

    renderWithProviders(<ChurchSettingsPage />);

    await screen.findByText('Identificação');

    expect(screen.getByLabelText('Nome')).toHaveValue('Igreja Batista Ibanje');
    expect(screen.getByLabelText('Cidade')).toHaveValue('São Paulo');
    expect(screen.getByLabelText('Nome do Presidente')).toHaveValue('João da Silva');
  });

  it('displays church contact fields', async () => {
    server.use(
      http.get(`${API}/church-settings`, () => HttpResponse.json(churchSettings)),
      ...referenceHandlers()
    );

    renderWithProviders(<ChurchSettingsPage />);

    await screen.findByText('Contato');

    expect(screen.getByLabelText('Telefone')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('URL do Site')).toBeInTheDocument();
  });

  it('displays church leadership fields', async () => {
    server.use(
      http.get(`${API}/church-settings`, () => HttpResponse.json(churchSettings)),
      ...referenceHandlers()
    );

    renderWithProviders(<ChurchSettingsPage />);

    await screen.findByText('Diretoria Atual');

    expect(screen.getByLabelText('Nome do Presidente')).toBeInTheDocument();
    expect(screen.getByLabelText('Título do Presidente')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome do Secretário')).toBeInTheDocument();
    expect(screen.getByLabelText('Título do Secretário')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    server.use(
      http.get(`${API}/church-settings`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json(churchSettings);
      }),
      ...referenceHandlers()
    );

    const { container } = renderWithProviders(<ChurchSettingsPage />);

    // Loading renders skeleton placeholders (animate-pulse) before the form appears.
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    expect(screen.queryByText('Identificação')).not.toBeInTheDocument();
  });

  it('displays save button', async () => {
    server.use(
      http.get(`${API}/church-settings`, () => HttpResponse.json(churchSettings)),
      ...referenceHandlers()
    );

    renderWithProviders(<ChurchSettingsPage />);

    // Exact name — the page also has a "Salvar saldo inicial" button in the finance card.
    expect(await screen.findByRole('button', { name: 'Salvar' })).toBeInTheDocument();
  });

  it('renders the logo and opening-balance (finance settings) sections', async () => {
    server.use(
      http.get(`${API}/church-settings`, () => HttpResponse.json(churchSettings)),
      http.get(`${API}/finance-settings`, () =>
        HttpResponse.json({
          openingBalance: '0.00',
          lockedByClosing: false,
          updatedAt: '2026-06-07T00:00:00.000Z'
        })
      ),
      ...referenceHandlers()
    );

    renderWithProviders(<ChurchSettingsPage />);

    expect(await screen.findByText('Logo')).toBeInTheDocument();
    expect(screen.getByText('Saldo inicial')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enviar logo' })).toBeInTheDocument();
  });
});
