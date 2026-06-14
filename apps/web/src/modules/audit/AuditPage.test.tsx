import { describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
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
    changes: { status: { from: 'paga', to: 'cancelada' } },
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
    changes: { phone: { from: '0000', to: '9999' } },
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
    changes: null,
    ipAddress: '127.0.0.1',
    createdAt: '2099-01-10T12:00:00.000Z'
  }
];

describe('AuditPage', () => {
  it('maps raw actions/entities to pt-BR labels and falls back for missing actors', async () => {
    server.use(...referenceHandlers(), listHandler('/audit', rows));

    renderWithProviders(<AuditPage />);

    // Action vocabulary translated.
    expect(await screen.findByText('Atualizações')).toBeInTheDocument();
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

  it('renders the section title and opens a row detail with the before→after diff', async () => {
    server.use(...referenceHandlers(), listHandler('/audit', rows));

    renderWithProviders(<AuditPage />);

    // Header reverted to a plain card title (no descriptive blurb).
    expect(screen.getByText('Auditoria')).toBeInTheDocument();

    // Wait for the rows to load, then open the attender update (2nd row) — it carries a phone diff.
    await screen.findByText('Congregado #7');
    const viewButtons = screen.getAllByRole('button', { name: 'Ver detalhes' });
    fireEvent.click(viewButtons[1]);

    expect(await screen.findByText('Alterações')).toBeInTheDocument();
    expect(screen.getByText('Telefone:')).toBeInTheDocument();
    expect(screen.getByText('0000')).toBeInTheDocument();
    expect(screen.getByText('9999')).toBeInTheDocument();
  });

  it('shows an empty message when there is no trail', async () => {
    server.use(...referenceHandlers(), listHandler('/audit', []));

    renderWithProviders(<AuditPage />);

    expect(await screen.findByText('Nenhum registro de auditoria encontrado.')).toBeInTheDocument();
  });
});
