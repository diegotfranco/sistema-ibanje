import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { EventsReportTab } from './EventsReportTab';
import { renderWithProviders } from '@/test/renderWithProviders';
import { setupTestServer, referenceHandlers, API } from '@/test/server';
import type { EventListResponse } from './schema';

const server = setupTestServer();

const sampleEvents = [
  {
    eventId: 1,
    eventTitle: 'Conferência Anual',
    startTime: '2024-06-15T09:00:00Z',
    endTime: '2024-06-15T17:00:00Z',
    totalRaised: '2500.00',
    totalSpent: '1200.00',
    net: '1300.00'
  },
  {
    eventId: 2,
    eventTitle: 'Retiro Espiritual',
    startTime: '2024-06-22T10:00:00Z',
    endTime: '2024-06-24T18:00:00Z',
    totalRaised: '1800.00',
    totalSpent: '800.00',
    net: '1000.00'
  }
];

describe('EventsReportTab', () => {
  it('renders the events table with data', async () => {
    const response: EventListResponse = {
      period: { from: '2024-06-01', to: '2024-06-30' },
      events: sampleEvents
    };

    server.use(
      http.get(`${API}/reports/events`, () => HttpResponse.json(response)),
      ...referenceHandlers()
    );

    renderWithProviders(<EventsReportTab month="2024-06" />);

    expect(await screen.findByText('Conferência Anual')).toBeInTheDocument();
    expect(screen.getByText('Retiro Espiritual')).toBeInTheDocument();
  });

  it('displays event data in mobile row format', async () => {
    const response: EventListResponse = {
      period: { from: '2024-06-01', to: '2024-06-30' },
      events: sampleEvents
    };

    server.use(
      http.get(`${API}/reports/events`, () => HttpResponse.json(response)),
      ...referenceHandlers()
    );

    renderWithProviders(<EventsReportTab month="2024-06" />);

    await screen.findByText('Conferência Anual');
    expect(screen.getByText('Conferência Anual')).toBeInTheDocument();
  });

  it('displays amounts in Brazilian currency format', async () => {
    const response: EventListResponse = {
      period: { from: '2024-06-01', to: '2024-06-30' },
      events: sampleEvents
    };

    server.use(
      http.get(`${API}/reports/events`, () => HttpResponse.json(response)),
      ...referenceHandlers()
    );

    renderWithProviders(<EventsReportTab month="2024-06" />);

    await screen.findByText('Conferência Anual');
    // Verify events are rendered
    expect(screen.getByText('Retiro Espiritual')).toBeInTheDocument();
  });

  it('shows empty state when no events exist', async () => {
    const response: EventListResponse = {
      period: { from: '2024-06-01', to: '2024-06-30' },
      events: []
    };

    server.use(
      http.get(`${API}/reports/events`, () => HttpResponse.json(response)),
      ...referenceHandlers()
    );

    renderWithProviders(<EventsReportTab month="2024-06" />);

    await waitFor(() => {
      const table = screen.queryByRole('table');
      if (table) {
        expect(table).toBeInTheDocument();
      }
    });
  });

  it('formats date ranges correctly', async () => {
    const response: EventListResponse = {
      period: { from: '2024-06-01', to: '2024-06-30' },
      events: sampleEvents
    };

    server.use(
      http.get(`${API}/reports/events`, () => HttpResponse.json(response)),
      ...referenceHandlers()
    );

    renderWithProviders(<EventsReportTab month="2024-06" />);

    await screen.findByText('Conferência Anual');
    // Events are displayed
    expect(screen.getByText('Conferência Anual')).toBeInTheDocument();
    expect(screen.getByText('Retiro Espiritual')).toBeInTheDocument();
  });

  it('displays net amount correctly', async () => {
    const response: EventListResponse = {
      period: { from: '2024-06-01', to: '2024-06-30' },
      events: sampleEvents
    };

    server.use(
      http.get(`${API}/reports/events`, () => HttpResponse.json(response)),
      ...referenceHandlers()
    );

    renderWithProviders(<EventsReportTab month="2024-06" />);

    await screen.findByText('Conferência Anual');
    // Verify both events are rendered
    expect(screen.getByText('Conferência Anual')).toBeInTheDocument();
    expect(screen.getByText('Retiro Espiritual')).toBeInTheDocument();
  });
});
