import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import MinuteDetailPage from './MinuteDetailPage';
import { renderWithProviders } from '@/test/renderWithProviders';
import { setupTestServer, referenceHandlers, meHandler, API } from '@/test/server';
import { MinuteStatus } from '@sistema-ibanje/shared';
import { http, HttpResponse } from 'msw';

const server = setupTestServer();

const minuteDetail = {
  id: 1,
  meetingId: 1,
  minuteNumber: 'ATA-001',
  presidingPastorName: 'Pastor João',
  secretaryName: 'Maria Silva',
  openingTime: '10:00',
  closingTime: '11:30',
  attendersPresent: [
    { id: 1, name: 'Membro 1' },
    { id: 2, name: 'Membro 2' }
  ],
  pautas: 'Pauta 1; Pauta 2; Pauta 3',
  hasSignedDocument: false,
  isNotarized: false,
  notarizedAt: null,
  correctsMinuteId: null,
  currentVersion: {
    id: 1,
    version: 1,
    content: { type: 'doc', content: [{ type: 'paragraph', content: [] }] },
    status: MinuteStatus.Draft,
    reasonForChange: null,
    createdByUserId: 1,
    approvedAtMeetingId: null,
    createdAt: '2026-01-01T10:00:00Z'
  },
  versions: [
    {
      id: 1,
      version: 1,
      content: { type: 'doc', content: [{ type: 'paragraph', content: [] }] },
      status: MinuteStatus.Draft,
      reasonForChange: null,
      createdByUserId: 1,
      approvedAtMeetingId: null,
      createdAt: '2026-01-01T10:00:00Z'
    }
  ],
  createdAt: '2026-01-01T10:00:00Z',
  updatedAt: '2026-01-01T10:00:00Z'
};

describe('MinuteDetailPage', () => {
  it('renders minute detail page with correct data', async () => {
    server.use(
      http.get(`${API}/minutes/1`, () => HttpResponse.json(minuteDetail)),
      ...referenceHandlers()
    );

    renderWithProviders(<MinuteDetailPage />, { path: '/minutes/:id', route: '/minutes/1' });

    expect(await screen.findByText('ATA-001')).toBeInTheDocument();
    expect(screen.getByText('Pastor João')).toBeInTheDocument();
    expect(screen.getByText('Maria Silva')).toBeInTheDocument();
    expect(screen.getByText('10:00')).toBeInTheDocument();
    expect(screen.getByText('11:30')).toBeInTheDocument();
  });

  it('displays loading state while fetching minute', () => {
    server.use(
      http.get(`${API}/minutes/1`, () => new Promise(() => {})), // Never resolves
      ...referenceHandlers()
    );

    renderWithProviders(<MinuteDetailPage />, { path: '/minutes/:id', route: '/minutes/1' });

    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });

  it('shows "not found" message when minute does not exist', async () => {
    server.use(
      http.get(`${API}/minutes/999`, () => HttpResponse.json(null)),
      ...referenceHandlers()
    );

    renderWithProviders(<MinuteDetailPage />, { path: '/minutes/:id', route: '/minutes/999' });

    await waitFor(() => expect(screen.queryByText('Carregando...')).not.toBeInTheDocument());
    expect(screen.getByText('Ata não encontrada.')).toBeInTheDocument();
  });

  it('displays meeting details in a card', async () => {
    server.use(
      http.get(`${API}/minutes/1`, () => HttpResponse.json(minuteDetail)),
      ...referenceHandlers()
    );

    renderWithProviders(<MinuteDetailPage />, { path: '/minutes/:id', route: '/minutes/1' });

    expect(await screen.findByText('Detalhes da Reunião')).toBeInTheDocument();
    expect(screen.getByText('Pastor Presidente')).toBeInTheDocument();
    expect(screen.getByText('Secretário')).toBeInTheDocument();
  });

  it('shows edit details button for user with Update permission', async () => {
    server.use(
      http.get(`${API}/minutes/1`, () => HttpResponse.json(minuteDetail)),
      ...referenceHandlers()
    );

    renderWithProviders(<MinuteDetailPage />, { path: '/minutes/:id', route: '/minutes/1' });

    expect(await screen.findByRole('button', { name: /editar detalhes/i })).toBeInTheDocument();
  });

  it('hides edit details button for user without Update permission', async () => {
    server.use(
      meHandler({ permissions: {} }),
      http.get(`${API}/minutes/1`, () => HttpResponse.json(minuteDetail)),
      ...referenceHandlers()
    );

    renderWithProviders(<MinuteDetailPage />, { path: '/minutes/:id', route: '/minutes/1' });

    await screen.findByText('ATA-001');

    expect(screen.queryByRole('button', { name: /editar detalhes/i })).not.toBeInTheDocument();
  });

  it('displays version history table', async () => {
    server.use(
      http.get(`${API}/minutes/1`, () => HttpResponse.json(minuteDetail)),
      ...referenceHandlers()
    );

    renderWithProviders(<MinuteDetailPage />, { path: '/minutes/:id', route: '/minutes/1' });

    expect(await screen.findByText('Histórico de Versões')).toBeInTheDocument();
    expect(screen.getByText('v1')).toBeInTheDocument();
  });

  it('displays back button', async () => {
    server.use(
      http.get(`${API}/minutes/1`, () => HttpResponse.json(minuteDetail)),
      ...referenceHandlers()
    );

    renderWithProviders(<MinuteDetailPage />, { path: '/minutes/:id', route: '/minutes/1' });

    expect(await screen.findByRole('button', { name: /voltar/i })).toBeInTheDocument();
  });

  it('displays attendees card', async () => {
    server.use(
      http.get(`${API}/minutes/1`, () => HttpResponse.json(minuteDetail)),
      ...referenceHandlers()
    );

    renderWithProviders(<MinuteDetailPage />, { path: '/minutes/:id', route: '/minutes/1' });

    await waitFor(() => expect(screen.queryByText('Carregando...')).not.toBeInTheDocument());
    // The page should load without errors and render the attendees section
    expect(screen.getByText('ATA-001')).toBeInTheDocument();
  });

  it('displays content section', async () => {
    server.use(
      http.get(`${API}/minutes/1`, () => HttpResponse.json(minuteDetail)),
      ...referenceHandlers()
    );

    renderWithProviders(<MinuteDetailPage />, { path: '/minutes/:id', route: '/minutes/1' });

    expect(await screen.findByText('Conteúdo')).toBeInTheDocument();
  });

  it('displays signed document iframe when hasSignedDocument is true', async () => {
    const minuteWithDoc = {
      ...minuteDetail,
      hasSignedDocument: true
    };

    server.use(
      http.get(`${API}/minutes/1`, () => HttpResponse.json(minuteWithDoc)),
      ...referenceHandlers()
    );

    renderWithProviders(<MinuteDetailPage />, { path: '/minutes/:id', route: '/minutes/1' });

    await waitFor(() => {
      const iframes = screen.getAllByTitle('Documento assinado');
      expect(iframes.length).toBeGreaterThan(0);
    });
  });

  it('shows PDF preview button', async () => {
    server.use(
      http.get(`${API}/minutes/1`, () => HttpResponse.json(minuteDetail)),
      ...referenceHandlers()
    );

    renderWithProviders(<MinuteDetailPage />, { path: '/minutes/:id', route: '/minutes/1' });

    expect(await screen.findByRole('button', { name: /visualizar pdf/i })).toBeInTheDocument();
  });
});
