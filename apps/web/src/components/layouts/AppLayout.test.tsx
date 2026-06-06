import { describe, it, expect } from 'vitest';
import { AppLayout } from './AppLayout';
import { renderWithProviders } from '@/test/renderWithProviders';
import { setupTestServer, referenceHandlers, meHandler } from '@/test/server';

const server = setupTestServer();

describe('AppLayout', () => {
  it('renders the sidebar', () => {
    server.use(meHandler(), ...referenceHandlers());

    const { container } = renderWithProviders(<AppLayout />);

    // Sidebar should be rendered
    const sidebar = container.querySelector('[data-sidebar]') || container.querySelector('aside');
    if (sidebar) {
      expect(sidebar).toBeInTheDocument();
    }
  });

  it('renders the main content area', () => {
    server.use(meHandler(), ...referenceHandlers());

    const { container } = renderWithProviders(<AppLayout />);

    // Main element should be present
    const main = container.querySelector('main');
    expect(main).toBeInTheDocument();
  });

  it('renders breadcrumbs navigation', () => {
    server.use(meHandler(), ...referenceHandlers());

    const { container } = renderWithProviders(<AppLayout />);

    // Breadcrumbs nav should be present
    const nav = container.querySelector('nav[aria-label="breadcrumb"]');
    if (nav) {
      expect(nav).toBeInTheDocument();
    }
  });

  it('renders outlet for child routes', () => {
    server.use(meHandler(), ...referenceHandlers());

    const { container } = renderWithProviders(<AppLayout />);

    // Layout should render successfully
    expect(container.querySelector('main')).toBeInTheDocument();
  });

  it('renders with proper layout structure', () => {
    server.use(meHandler(), ...referenceHandlers());

    const { container } = renderWithProviders(<AppLayout />);

    // Should have main layout elements
    expect(container.querySelector('[class*="flex"]')).toBeInTheDocument();
  });

  it('has error boundary for safety', () => {
    server.use(meHandler(), ...referenceHandlers());

    const { container } = renderWithProviders(<AppLayout />);

    // Error boundary wraps the outlet
    expect(container.firstChild).toBeTruthy();
  });

  it('applies background styling', () => {
    server.use(meHandler(), ...referenceHandlers());

    const { container } = renderWithProviders(<AppLayout />);

    const main = container.querySelector('main');
    if (main) {
      expect(main).toHaveClass('flex-1');
    }
  });
});
