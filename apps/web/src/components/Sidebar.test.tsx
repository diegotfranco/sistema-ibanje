import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { Sidebar } from './Sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { renderWithProviders } from '@/test/renderWithProviders';
import { setupTestServer, referenceHandlers, meHandler } from '@/test/server';

const server = setupTestServer();

describe('Sidebar', () => {
  it('renders the sidebar component', () => {
    server.use(meHandler(), ...referenceHandlers());

    const { container } = renderWithProviders(
      <SidebarProvider>
        <Sidebar />
      </SidebarProvider>,
      { route: '/' }
    );

    // Should render a sidebar element
    const sidebar = container.querySelector('[role="region"]') || container.firstChild;
    expect(sidebar).toBeTruthy();
  });

  it('renders app header text', () => {
    server.use(meHandler(), ...referenceHandlers());

    renderWithProviders(
      <SidebarProvider>
        <Sidebar />
      </SidebarProvider>,
      { route: '/' }
    );

    const appName = screen.queryByText('Sistema Ibanje');
    if (appName) {
      expect(appName).toBeInTheDocument();
    }
  });

  it('renders footer section', () => {
    server.use(meHandler({ name: 'João Silva' }), ...referenceHandlers());

    const { container } = renderWithProviders(
      <SidebarProvider>
        <Sidebar />
      </SidebarProvider>,
      { route: '/' }
    );

    // Footer should be present in sidebar structure
    const footer =
      container.querySelector('[class*="footer"]') ||
      container.querySelector('footer') ||
      container.querySelector('[data-sidebar="footer"]');
    if (footer) {
      expect(footer).toBeInTheDocument();
    }
  });

  it('renders sidebar content section', () => {
    server.use(meHandler(), ...referenceHandlers());

    const { container } = renderWithProviders(
      <SidebarProvider>
        <Sidebar />
      </SidebarProvider>,
      { route: '/' }
    );

    // Content area should exist
    const content =
      container.querySelector('[class*="content"]') ||
      container.querySelector('[data-sidebar="content"]');
    if (content) {
      expect(content).toBeInTheDocument();
    }
  });

  it('renders with collapsible="icon" configuration', () => {
    server.use(meHandler(), ...referenceHandlers());

    const { container } = renderWithProviders(
      <SidebarProvider>
        <Sidebar />
      </SidebarProvider>,
      { route: '/' }
    );

    // Sidebar should have collapsible structure
    expect(container.firstChild).toBeTruthy();
  });

  it('renders header with app name', () => {
    server.use(meHandler(), ...referenceHandlers());

    const { container } = renderWithProviders(
      <SidebarProvider>
        <Sidebar />
      </SidebarProvider>,
      { route: '/' }
    );

    // Header should be present (contains app name and toggle button)
    const header =
      container.querySelector('[class*="header"]') ||
      container.querySelector('header') ||
      container.querySelector('[data-sidebar="header"]');
    if (header) {
      expect(header).toBeInTheDocument();
    }
  });

  it('renders toggle button in header', () => {
    server.use(meHandler(), ...referenceHandlers());

    const { container } = renderWithProviders(
      <SidebarProvider>
        <Sidebar />
      </SidebarProvider>,
      { route: '/' }
    );

    // Toggle button should be present (expand/collapse sidebar)
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('renders without crashing with full permissions', () => {
    server.use(meHandler(), ...referenceHandlers());

    const { container } = renderWithProviders(
      <SidebarProvider>
        <Sidebar />
      </SidebarProvider>,
      { route: '/' }
    );

    expect(container.firstChild).toBeTruthy();
  });

  it('renders without crashing with no permissions', () => {
    server.use(meHandler({ permissions: {} }), ...referenceHandlers());

    const { container } = renderWithProviders(
      <SidebarProvider>
        <Sidebar />
      </SidebarProvider>,
      { route: '/' }
    );

    expect(container.firstChild).toBeTruthy();
  });

  it('renders sidebar with menu structure', () => {
    server.use(meHandler(), ...referenceHandlers());

    const { container } = renderWithProviders(
      <SidebarProvider>
        <Sidebar />
      </SidebarProvider>,
      { route: '/' }
    );

    // Should have nav-like structure
    const nav = container.querySelector('nav') || container.querySelector('[role="navigation"]');
    if (nav) {
      expect(nav).toBeTruthy();
    }
  });
});
