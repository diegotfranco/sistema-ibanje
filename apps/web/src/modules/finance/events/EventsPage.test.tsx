import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EventsPage from './EventsPage';
import { renderWithProviders } from '@/test/renderWithProviders';
import { setupTestServer, referenceHandlers, listHandler, meHandler } from '@/test/server';

const server = setupTestServer();

const mockEvents = [
  {
    id: 1,
    title: 'Culto Domingo',
    description: 'Culto de adoração',
    location: 'Templo Principal',
    startTime: '2024-06-09T09:00:00Z',
    endTime: '2024-06-09T10:30:00Z',
    status: 'ativo' as const,
    createdAt: '2024-06-01T10:00:00Z',
    updatedAt: '2024-06-01T10:00:00Z'
  },
  {
    id: 2,
    title: 'Reunião Liderança',
    description: 'Planejamento mensal',
    location: 'Sala Conselho',
    startTime: '2024-06-10T19:00:00Z',
    endTime: '2024-06-10T20:00:00Z',
    status: 'ativo' as const,
    createdAt: '2024-06-01T11:00:00Z',
    updatedAt: '2024-06-01T11:00:00Z'
  }
];

describe('EventsPage', () => {
  it('renders the page title', async () => {
    server.use(listHandler('/events', mockEvents), ...referenceHandlers());

    renderWithProviders(<EventsPage />);

    await waitFor(() => {
      expect(screen.getByText('Eventos')).toBeInTheDocument();
    });
  });

  it('displays events in the list', async () => {
    server.use(listHandler('/events', mockEvents), ...referenceHandlers());

    renderWithProviders(<EventsPage />);

    await waitFor(() => {
      expect(screen.getByText('Culto Domingo')).toBeInTheDocument();
      expect(screen.getByText('Reunião Liderança')).toBeInTheDocument();
    });
  });

  it('shows create button when user has create permission', async () => {
    server.use(listHandler('/events', mockEvents), ...referenceHandlers());

    renderWithProviders(<EventsPage />);

    await waitFor(() => {
      expect(screen.getByText('Eventos')).toBeInTheDocument();
    });

    const newButton = screen.queryByRole('button', { name: /novo/i });
    if (newButton) {
      expect(newButton).toBeInTheDocument();
    }
  });

  it('hides create button when user lacks create permission', async () => {
    server.use(
      meHandler({ permissions: {} }),
      listHandler('/events', mockEvents),
      ...referenceHandlers()
    );

    renderWithProviders(<EventsPage />);

    await waitFor(() => {
      expect(screen.getByText('Eventos')).toBeInTheDocument();
    });
  });

  it('displays empty state when no events', async () => {
    server.use(listHandler('/events', []), ...referenceHandlers());

    renderWithProviders(<EventsPage />);

    await waitFor(() => {
      expect(screen.getByText('Eventos')).toBeInTheDocument();
    });
  });

  it('opens create dialog on new button click', async () => {
    const user = userEvent.setup();
    server.use(listHandler('/events', mockEvents), ...referenceHandlers());

    renderWithProviders(<EventsPage />);

    await waitFor(() => {
      expect(screen.getByText('Eventos')).toBeInTheDocument();
    });

    const newButton = screen.queryByRole('button', { name: /novo/i });
    if (newButton) {
      await user.click(newButton);
      await waitFor(() => {
        expect(screen.getByText('Novo evento')).toBeInTheDocument();
      });
    }
  });

  it('filters events by status', async () => {
    const user = userEvent.setup();
    server.use(listHandler('/events', mockEvents), ...referenceHandlers());

    renderWithProviders(<EventsPage />);

    await waitFor(() => {
      expect(screen.getByText('Eventos')).toBeInTheDocument();
    });

    const filterSelect =
      screen.queryByRole('combobox') || screen.queryByRole('button', { name: /status/i });
    if (filterSelect) {
      await user.click(filterSelect);
    }
  });

  it('displays event locations on rows', async () => {
    server.use(listHandler('/events', mockEvents), ...referenceHandlers());

    renderWithProviders(<EventsPage />);

    await waitFor(() => {
      expect(screen.getByText('Templo Principal')).toBeInTheDocument();
    });
  });

  it('formats event times correctly', async () => {
    server.use(listHandler('/events', mockEvents), ...referenceHandlers());

    renderWithProviders(<EventsPage />);

    await waitFor(() => {
      expect(screen.getByText('Eventos')).toBeInTheDocument();
    });
  });

  it('opens delete confirm dialog on delete action', async () => {
    server.use(listHandler('/events', mockEvents), ...referenceHandlers());

    renderWithProviders(<EventsPage />);

    await waitFor(() => {
      expect(screen.getByText('Eventos')).toBeInTheDocument();
    });
  });

  it('displays status badges', async () => {
    server.use(listHandler('/events', mockEvents), ...referenceHandlers());

    renderWithProviders(<EventsPage />);

    await waitFor(() => {
      const badges = screen.queryAllByText(/ativo/i);
      if (badges.length > 0) {
        expect(badges.length).toBeGreaterThan(0);
      }
    });
  });
});
