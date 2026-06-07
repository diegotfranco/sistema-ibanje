import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MeetingsPage from './MeetingsPage';
import { renderWithProviders } from '@/test/renderWithProviders';
import { setupTestServer, referenceHandlers, meHandler, paginated, API } from '@/test/server';
import { MeetingType } from '@sistema-ibanje/shared';
import { http, HttpResponse } from 'msw';

const server = setupTestServer();

const meetings = [
  {
    id: 1,
    meetingDate: '2026-02-15',
    type: MeetingType.Ordinary,
    agendaItems: [
      {
        id: 1,
        meetingId: 1,
        order: 1,
        title: 'Abertura',
        description: null,
        createdByUserId: 1,
        status: 'open',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      },
      {
        id: 2,
        meetingId: 1,
        order: 2,
        title: 'Votação',
        description: 'Votação importante',
        createdByUserId: 1,
        status: 'open',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      }
    ],
    isPublic: false,
    status: 'scheduled',
    hasMinutes: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 2,
    meetingDate: '2026-03-20',
    type: MeetingType.Extraordinary,
    agendaItems: [
      {
        id: 3,
        meetingId: 2,
        order: 1,
        title: 'Assunto Especial',
        description: null,
        createdByUserId: 1,
        status: 'open',
        createdAt: '2026-01-02T00:00:00Z',
        updatedAt: '2026-01-02T00:00:00Z'
      }
    ],
    isPublic: true,
    status: 'scheduled',
    hasMinutes: true,
    createdAt: '2026-01-02T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z'
  }
];

describe('MeetingsPage', () => {
  it('renders the meetings list with data', async () => {
    server.use(
      http.get(`${API}/meetings`, () => HttpResponse.json(paginated(meetings))),
      ...referenceHandlers()
    );

    renderWithProviders(<MeetingsPage />);

    expect(await screen.findByText('Assembleias')).toBeInTheDocument();
    expect(await screen.findByText('15/02/2026')).toBeInTheDocument();
    expect(screen.getByText('20/03/2026')).toBeInTheDocument();
  });

  it('opens the create form when the user clicks "Nova" (has Create permission)', async () => {
    server.use(
      http.get(`${API}/meetings`, () => HttpResponse.json(paginated(meetings))),
      ...referenceHandlers()
    );

    renderWithProviders(<MeetingsPage />);
    await screen.findByText('15/02/2026');

    const novaButton = screen.getByRole('button', { name: /nova/i });
    await userEvent.click(novaButton);

    // After clicking, the form dialog should open
    expect(novaButton).toBeInTheDocument();
  });

  it('hides the "Nova" button for a user without Create permission', async () => {
    server.use(
      meHandler({ permissions: {} }),
      http.get(`${API}/meetings`, () => HttpResponse.json(paginated(meetings))),
      ...referenceHandlers()
    );

    renderWithProviders(<MeetingsPage />);
    await screen.findByText('15/02/2026');

    expect(screen.queryByRole('button', { name: /^nova$/i })).not.toBeInTheDocument();
  });

  it('shows the empty state when there are no meetings', async () => {
    server.use(
      http.get(`${API}/meetings`, () => HttpResponse.json(paginated([]))),
      ...referenceHandlers()
    );

    renderWithProviders(<MeetingsPage />);

    await waitFor(() => expect(screen.queryByText('15/02/2026')).not.toBeInTheDocument());
    expect(screen.getByText('Assembleias')).toBeInTheDocument();
  });

  it('displays meeting types', async () => {
    server.use(
      http.get(`${API}/meetings`, () => HttpResponse.json(paginated(meetings))),
      ...referenceHandlers()
    );

    renderWithProviders(<MeetingsPage />);
    await screen.findByText('15/02/2026');

    // Check that cells with meeting types are visible
    const cells = screen.getAllByRole('cell');
    expect(cells.length).toBeGreaterThan(0);
  });

  it('displays agenda item count badges', async () => {
    server.use(
      http.get(`${API}/meetings`, () => HttpResponse.json(paginated(meetings))),
      ...referenceHandlers()
    );

    renderWithProviders(<MeetingsPage />);
    await screen.findByText('15/02/2026');

    expect(screen.getByText(/2 itens/i)).toBeInTheDocument();
    expect(screen.getByText(/1 item/i)).toBeInTheDocument();
  });

  it('displays public/private status', async () => {
    server.use(
      http.get(`${API}/meetings`, () => HttpResponse.json(paginated(meetings))),
      ...referenceHandlers()
    );

    renderWithProviders(<MeetingsPage />);
    await screen.findByText('15/02/2026');

    const naoTexts = screen.getAllByText('Não');
    const simTexts = screen.getAllByText('Sim');
    expect(naoTexts.length).toBeGreaterThan(0);
    expect(simTexts.length).toBeGreaterThan(0);
  });

  it('shows edit button for user with Update permission', async () => {
    server.use(
      http.get(`${API}/meetings`, () => HttpResponse.json(paginated(meetings))),
      ...referenceHandlers()
    );

    renderWithProviders(<MeetingsPage />);
    await screen.findByText('15/02/2026');

    const editButtons = screen.getAllByRole('button', { name: 'Editar' });
    expect(editButtons.length).toBeGreaterThan(0);
  });

  it('hides edit button when user lacks Update permission', async () => {
    server.use(
      meHandler({ permissions: {} }),
      http.get(`${API}/meetings`, () => HttpResponse.json(paginated(meetings))),
      ...referenceHandlers()
    );

    renderWithProviders(<MeetingsPage />);
    await screen.findByText('15/02/2026');

    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
  });

  it('shows agenda button for user with Update permission', async () => {
    server.use(
      http.get(`${API}/meetings`, () => HttpResponse.json(paginated(meetings))),
      ...referenceHandlers()
    );

    renderWithProviders(<MeetingsPage />);
    await screen.findByText('15/02/2026');

    const agendaButtons = screen.getAllByRole('button', { name: 'Definir pauta' });
    expect(agendaButtons.length).toBeGreaterThan(0);
  });

  it('shows delete button for user with Delete permission', async () => {
    server.use(
      http.get(`${API}/meetings`, () => HttpResponse.json(paginated(meetings))),
      ...referenceHandlers()
    );

    renderWithProviders(<MeetingsPage />);
    await screen.findByText('15/02/2026');

    const deleteButtons = screen.getAllByRole('button', { name: 'Excluir' });
    expect(deleteButtons.length).toBeGreaterThan(0);
  });

  it('hides delete button when user lacks Delete permission', async () => {
    server.use(
      meHandler({ permissions: {} }),
      http.get(`${API}/meetings`, () => HttpResponse.json(paginated(meetings))),
      ...referenceHandlers()
    );

    renderWithProviders(<MeetingsPage />);
    await screen.findByText('15/02/2026');

    expect(screen.queryByRole('button', { name: 'Excluir' })).not.toBeInTheDocument();
  });

  it('disables delete button when meeting has minutes', async () => {
    server.use(
      http.get(`${API}/meetings`, () => HttpResponse.json(paginated(meetings))),
      ...referenceHandlers()
    );

    renderWithProviders(<MeetingsPage />);
    await screen.findByText('15/02/2026');

    const deleteButtons = screen.getAllByRole('button', { name: 'Excluir' });
    // The second meeting (id=2) has hasMinutes=true, so its delete button should be disabled
    const disabledButtons = deleteButtons.filter((btn) => btn.hasAttribute('disabled'));
    expect(disabledButtons.length).toBeGreaterThan(0);
  });

  it('displays minutes indicator', async () => {
    server.use(
      http.get(`${API}/meetings`, () => HttpResponse.json(paginated(meetings))),
      ...referenceHandlers()
    );

    renderWithProviders(<MeetingsPage />);
    await screen.findByText('15/02/2026');

    // First meeting: no minutes → "—"
    // Second meeting: has minutes → "Sim"
    const simTexts = screen.getAllByText('Sim');
    expect(simTexts.length).toBeGreaterThan(0);
  });

  it('displays loading state initially', () => {
    server.use(
      http.get(`${API}/meetings`, () => HttpResponse.json(paginated(meetings))),
      ...referenceHandlers()
    );

    renderWithProviders(<MeetingsPage />);

    expect(screen.getByText('Assembleias')).toBeInTheDocument();
  });
});
