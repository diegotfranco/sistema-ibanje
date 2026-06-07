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

    renderWithProviders(<ChurchSettingsPage />);

    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });

  it('displays save button', async () => {
    server.use(
      http.get(`${API}/church-settings`, () => HttpResponse.json(churchSettings)),
      ...referenceHandlers()
    );

    renderWithProviders(<ChurchSettingsPage />);

    expect(await screen.findByRole('button', { name: /salvar/i })).toBeInTheDocument();
  });
});
