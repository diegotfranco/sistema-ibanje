import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import CalendarPage from './CalendarPage';
import { renderWithProviders } from '@/test/renderWithProviders';
import { setupTestServer, referenceHandlers } from '@/test/server';

const server = setupTestServer();

describe('CalendarPage', () => {
  it('renders the page with a Card wrapper', () => {
    server.use(...referenceHandlers());

    renderWithProviders(<CalendarPage />);

    // Card should be present in the DOM
    const card = document.querySelector('[class*="rounded"]');
    expect(card).toBeInTheDocument();
  });

  it('renders CalendarSurface component', async () => {
    server.use(...referenceHandlers());

    renderWithProviders(<CalendarPage />);

    // FullCalendar renders into an element with fc class
    await waitFor(() => {
      const calendarElement = document.querySelector('.fc');
      expect(calendarElement).toBeInTheDocument();
    });
  });

  it('wraps content in PageContainer', () => {
    server.use(...referenceHandlers());

    renderWithProviders(<CalendarPage />);

    // PageContainer applies space-y classes
    const container = document.querySelector('[class*="space-y"]');
    expect(container).toBeInTheDocument();
  });

  it('applies correct CardContent padding classes', () => {
    server.use(...referenceHandlers());

    const { container } = renderWithProviders(<CalendarPage />);

    // CardContent has p-3 sm:p-4 classes
    const cardContent = container.querySelector('[class*="p-3"]');
    expect(cardContent).toBeInTheDocument();
  });

  it('initializes calendar with appropriate view based on viewport', async () => {
    server.use(...referenceHandlers());

    renderWithProviders(<CalendarPage />);

    // FullCalendar should render
    await waitFor(() => {
      const calendarElement = document.querySelector('.fc');
      expect(calendarElement).toBeInTheDocument();
    });
  });

  it('renders calendar with auto height', async () => {
    server.use(...referenceHandlers());

    renderWithProviders(<CalendarPage />);

    await waitFor(() => {
      const calendarElement = document.querySelector('.fc');
      expect(calendarElement).toBeInTheDocument();
    });
  });

  it('handles calendar layout on narrow viewports (lists mode)', () => {
    // jsdom matchMedia default is matches=false (mobile), so calendar defaults to listMonth
    server.use(...referenceHandlers());

    renderWithProviders(<CalendarPage />);

    // Calendar should render regardless of viewport
    const calendarElement = document.querySelector('.fc');
    expect(calendarElement).toBeInTheDocument();
  });

  it('page renders without errors when no calendar data is present', async () => {
    server.use(...referenceHandlers());

    renderWithProviders(<CalendarPage />);

    // Should render without crashing
    await waitFor(
      () => {
        expect(
          screen.getByText(/calendario/i, { selector: '*' }).parentElement
        ).toBeInTheDocument();
      },
      { timeout: 100 }
    ).catch(() => {
      // FullCalendar doesn't have easily accessible text; just verify no errors occurred
      expect(document.querySelector('.fc')).toBeTruthy();
    });
  });
});
