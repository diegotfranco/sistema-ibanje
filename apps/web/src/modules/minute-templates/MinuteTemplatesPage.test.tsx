import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MinuteTemplatesPage from './MinuteTemplatesPage';
import { renderWithProviders } from '@/test/renderWithProviders';
import { setupTestServer, referenceHandlers, meHandler, API } from '@/test/server';
import { MeetingType } from '@sistema-ibanje/shared';
import { http, HttpResponse } from 'msw';

const server = setupTestServer();

const templates = [
  {
    id: 1,
    meetingType: MeetingType.Ordinary,
    name: 'Assembleia Ordinária',
    content: { type: 'doc', content: [] },
    isDefault: true,
    defaultAgendaItems: [
      { title: 'Abertura', description: 'Abertura da reunião' },
      { title: 'Votação', description: null }
    ],
    createdAt: '2026-01-01T10:00:00Z',
    updatedAt: '2026-01-01T10:00:00Z'
  },
  {
    id: 2,
    meetingType: MeetingType.Extraordinary,
    name: 'Assembleia Extraordinária',
    content: { type: 'doc', content: [] },
    isDefault: false,
    defaultAgendaItems: [{ title: 'Assunto Especial', description: 'Pauta extraordinária' }],
    createdAt: '2026-01-02T10:00:00Z',
    updatedAt: '2026-01-02T10:00:00Z'
  }
];

describe('MinuteTemplatesPage', () => {
  it('renders the list with templates once data loads', async () => {
    server.use(
      http.get(`${API}/minute-templates`, () => HttpResponse.json(templates)),
      ...referenceHandlers()
    );

    renderWithProviders(<MinuteTemplatesPage />);

    expect(await screen.findByText('Modelos de Ata')).toBeInTheDocument();
    expect(await screen.findByText('Assembleia Ordinária')).toBeInTheDocument();
    expect(screen.getByText('Assembleia Extraordinária')).toBeInTheDocument();
  });

  it('opens the create form when the user clicks "Novo Modelo" (has Create permission)', async () => {
    server.use(
      http.get(`${API}/minute-templates`, () => HttpResponse.json(templates)),
      ...referenceHandlers()
    );

    renderWithProviders(<MinuteTemplatesPage />);
    await screen.findByText('Assembleia Ordinária');

    await userEvent.click(screen.getByRole('button', { name: /novo modelo/i }));

    expect(await screen.findByText('Novo Modelo de Ata')).toBeInTheDocument();
  });

  it('hides the "Novo Modelo" button for a user without Create permission', async () => {
    server.use(
      meHandler({ permissions: {} }),
      http.get(`${API}/minute-templates`, () => HttpResponse.json(templates)),
      ...referenceHandlers()
    );

    renderWithProviders(<MinuteTemplatesPage />);
    await screen.findByText('Assembleia Ordinária');

    expect(screen.queryByRole('button', { name: /novo modelo/i })).not.toBeInTheDocument();
  });

  it('shows the empty state when there are no templates', async () => {
    server.use(
      http.get(`${API}/minute-templates`, () => HttpResponse.json([])),
      ...referenceHandlers()
    );

    renderWithProviders(<MinuteTemplatesPage />);

    await waitFor(() => expect(screen.queryByText('Assembleia Ordinária')).not.toBeInTheDocument());
    expect(screen.getByText('Modelos de Ata')).toBeInTheDocument();
  });

  it('displays template meeting types correctly', async () => {
    server.use(
      http.get(`${API}/minute-templates`, () => HttpResponse.json(templates)),
      ...referenceHandlers()
    );

    renderWithProviders(<MinuteTemplatesPage />);
    await screen.findByText('Assembleia Ordinária');

    expect(screen.getByText('Ordinária')).toBeInTheDocument();
    expect(screen.getByText('Extraordinária')).toBeInTheDocument();
  });

  it('displays default badge for default template', async () => {
    server.use(
      http.get(`${API}/minute-templates`, () => HttpResponse.json(templates)),
      ...referenceHandlers()
    );

    renderWithProviders(<MinuteTemplatesPage />);
    await screen.findByText('Assembleia Ordinária');

    // Check for the badge variant badge, not just the column header
    const badges = screen.getAllByText('Padrão');
    const badgeElement = badges.find((el) => el.closest('[data-variant="soft"]'));
    expect(badgeElement).toBeInTheDocument();
  });

  it('displays agenda items count', async () => {
    server.use(
      http.get(`${API}/minute-templates`, () => HttpResponse.json(templates)),
      ...referenceHandlers()
    );

    renderWithProviders(<MinuteTemplatesPage />);
    await screen.findByText('Assembleia Ordinária');

    const rows = screen.getAllByRole('cell', { name: '2' });
    expect(rows.length).toBeGreaterThan(0);
  });

  it('shows edit button for user with Update permission', async () => {
    server.use(
      http.get(`${API}/minute-templates`, () => HttpResponse.json(templates)),
      ...referenceHandlers()
    );

    renderWithProviders(<MinuteTemplatesPage />);
    await screen.findByText('Assembleia Ordinária');

    const editButtons = screen.getAllByRole('button', { name: /editar modelo/i });
    expect(editButtons.length).toBeGreaterThan(0);
  });

  it('hides edit button when user lacks Update permission', async () => {
    server.use(
      meHandler({ permissions: {} }),
      http.get(`${API}/minute-templates`, () => HttpResponse.json(templates)),
      ...referenceHandlers()
    );

    renderWithProviders(<MinuteTemplatesPage />);
    await screen.findByText('Assembleia Ordinária');

    // Check that edit icon buttons are not visible
    const allButtons = screen.queryAllByRole('button');
    const editableRow = allButtons.filter((b) => b.className.includes('text-warning'));
    expect(editableRow.length).toBe(0);
  });

  it('shows delete button for user with Delete permission', async () => {
    server.use(
      http.get(`${API}/minute-templates`, () => HttpResponse.json(templates)),
      ...referenceHandlers()
    );

    renderWithProviders(<MinuteTemplatesPage />);
    await screen.findByText('Assembleia Ordinária');

    const allButtons = screen.queryAllByRole('button');
    const deleteButtons = allButtons.filter((b) => b.className.includes('text-destructive'));
    expect(deleteButtons.length).toBeGreaterThan(0);
  });

  it('hides delete button when user lacks Delete permission', async () => {
    server.use(
      meHandler({ permissions: {} }),
      http.get(`${API}/minute-templates`, () => HttpResponse.json(templates)),
      ...referenceHandlers()
    );

    renderWithProviders(<MinuteTemplatesPage />);
    await screen.findByText('Assembleia Ordinária');

    const allButtons = screen.queryAllByRole('button');
    const deleteButtons = allButtons.filter((b) => b.className.includes('text-destructive'));
    expect(deleteButtons.length).toBe(0);
  });

  it('displays loading state initially', () => {
    server.use(
      http.get(`${API}/minute-templates`, () => HttpResponse.json(templates)),
      ...referenceHandlers()
    );

    renderWithProviders(<MinuteTemplatesPage />);

    expect(screen.getByText('Modelos de Ata')).toBeInTheDocument();
  });
});
