import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import SettingsHubPage from './SettingsHubPage';
import { renderWithProviders } from '@/test/renderWithProviders';
import { setupTestServer, referenceHandlers, meHandler } from '@/test/server';
import { Module } from '@sistema-ibanje/shared';

const server = setupTestServer();

describe('SettingsHubPage', () => {
  it('renders a card per settings area for a full-permission user', async () => {
    server.use(meHandler(), ...referenceHandlers());

    renderWithProviders(<SettingsHubPage />);

    const igreja = await screen.findByRole('link', { name: /Configurações da Igreja/i });
    expect(igreja).toHaveAttribute('href', '/church-settings');
    expect(screen.getByRole('link', { name: /Usuários/i })).toHaveAttribute('href', '/users');
    expect(screen.getByRole('link', { name: /Cargos/i })).toHaveAttribute('href', '/roles');
    expect(screen.getByRole('link', { name: /Formas de Pagamento/i })).toHaveAttribute(
      'href',
      '/payment-methods'
    );
    expect(screen.getByRole('link', { name: /Modelos de Ata/i })).toHaveAttribute(
      'href',
      '/minute-templates'
    );
  });

  it('hides cards the user lacks permission for', async () => {
    // Only Users permission → only the Usuários card, and no Financeiro/Secretaria groups.
    server.use(meHandler({ permissions: { [Module.Users]: 1 } }), ...referenceHandlers());

    renderWithProviders(<SettingsHubPage />);

    expect(await screen.findByRole('link', { name: /Usuários/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Formas de Pagamento/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Modelos de Ata/i })).not.toBeInTheDocument();
    expect(screen.queryByText('Financeiro')).not.toBeInTheDocument();
  });

  it('shows an empty message when the user has no settings access', async () => {
    server.use(meHandler({ permissions: {} }), ...referenceHandlers());

    renderWithProviders(<SettingsHubPage />);

    await waitFor(() =>
      expect(
        screen.getByText('Você não tem acesso a nenhuma área de configuração.')
      ).toBeInTheDocument()
    );
  });
});
