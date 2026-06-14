import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import AuditPage from './AuditPage';
import { renderWithProviders } from '@/test/renderWithProviders';
import { setupTestServer, referenceHandlers, listHandler } from '@/test/server';
import type { AuditEntry } from './schema';

const server = setupTestServer();

const rows: AuditEntry[] = [
  {
    id: 3,
    userId: null,
    userName: null,
    action: 'state_change',
    entityType: 'income_entry',
    entityId: 5,
    notes: 'cancelada',
    ipAddress: '10.0.0.1',
    createdAt: '2099-03-30T12:00:00.000Z'
  },
  {
    id: 2,
    userId: 9,
    userName: null,
    action: 'update',
    entityType: 'attender',
    entityId: 7,
    notes: null,
    ipAddress: null,
    createdAt: '2099-02-20T12:00:00.000Z'
  },
  {
    id: 1,
    userId: 1,
    userName: 'Maria',
    action: 'create',
    entityType: 'expense_entry',
    entityId: 4,
    notes: null,
    ipAddress: '127.0.0.1',
    createdAt: '2099-01-10T12:00:00.000Z'
  }
];

describe('AuditPage', () => {
  it('maps raw actions/entities to pt-BR labels and falls back for missing actors', async () => {
    server.use(...referenceHandlers(), listHandler('/audit', rows));

    renderWithProviders(<AuditPage />);

    // Action vocabulary translated.
    expect(await screen.findByText('Mudança de estado')).toBeInTheDocument();
    expect(screen.getByText('Edição')).toBeInTheDocument();
    expect(screen.getByText('Criação')).toBeInTheDocument();

    // Entity types translated and suffixed with the id.
    expect(screen.getByText('Lançamento de Entrada #5')).toBeInTheDocument();
    expect(screen.getByText('Congregado #7')).toBeInTheDocument();
    expect(screen.getByText('Lançamento de Saída #4')).toBeInTheDocument();

    // Actor fallbacks: null user → "Sistema"; id without a name → "Usuário #id"; named → name.
    expect(screen.getByText('Sistema')).toBeInTheDocument();
    expect(screen.getByText('Usuário #9')).toBeInTheDocument();
    expect(screen.getByText('Maria')).toBeInTheDocument();
  });

  it('shows an empty message when there is no trail', async () => {
    server.use(...referenceHandlers(), listHandler('/audit', []));

    renderWithProviders(<AuditPage />);

    expect(await screen.findByText('Nenhum registro de auditoria encontrado.')).toBeInTheDocument();
  });
});
