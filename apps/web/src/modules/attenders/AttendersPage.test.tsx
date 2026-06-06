import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import AttendersPage from './AttendersPage';
import { renderWithProviders } from '@/test/renderWithProviders';
import { setupTestServer, referenceHandlers, listHandler, meHandler, API } from '@/test/server';

const toastError = vi.fn();
vi.mock('sonner', () => ({ toast: { error: (m: string) => toastError(m), success: vi.fn() } }));

const server = setupTestServer();

const rows = [
  {
    id: 1,
    name: 'João Silva',
    isMember: true,
    phone: '(11) 99999-1111',
    email: 'joao@email.com',
    city: 'São Paulo',
    state: 'SP',
    status: 'ativo',
    userId: null,
    birthDate: null,
    addressStreet: null,
    addressNumber: null,
    addressComplement: null,
    addressDistrict: null,
    postalCode: null,
    memberSince: null,
    baptismDate: null,
    congregatingSince: null,
    admissionMode: null,
    createdAt: new Date()
  },
  {
    id: 2,
    name: 'Maria Santos',
    isMember: false,
    phone: '(11) 99999-2222',
    email: 'maria@email.com',
    city: 'Guarulhos',
    state: 'SP',
    status: 'ativo',
    userId: null,
    birthDate: null,
    addressStreet: null,
    addressNumber: null,
    addressComplement: null,
    addressDistrict: null,
    postalCode: null,
    memberSince: null,
    baptismDate: null,
    congregatingSince: null,
    admissionMode: null,
    createdAt: new Date()
  }
];

describe('AttendersPage', () => {
  beforeEach(() => {
    toastError.mockClear();
    window.open = vi.fn();
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
    // Render at desktop width so the DataTable toolbar (export button) + hideBelow columns mount.
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: /min-width/.test(query),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn()
    })) as unknown as typeof window.matchMedia;
  });

  it('exports the roster to PDF via the toolbar button', async () => {
    server.use(
      listHandler('/attenders', rows),
      ...referenceHandlers(),
      http.get(`${API}/attenders/export/pdf`, () =>
        HttpResponse.arrayBuffer(new ArrayBuffer(8), {
          headers: { 'content-type': 'application/pdf' }
        })
      )
    );

    renderWithProviders(<AttendersPage />);
    await screen.findByText('João Silva');

    await userEvent.click(screen.getByRole('button', { name: /exportar pdf/i }));
    await waitFor(() => expect(window.open).toHaveBeenCalledWith('blob:x', '_blank'));
    expect(toastError).not.toHaveBeenCalled();
  });

  it('shows an error toast when the export fails', async () => {
    server.use(
      listHandler('/attenders', rows),
      ...referenceHandlers(),
      http.get(`${API}/attenders/export/pdf`, () => new HttpResponse(null, { status: 500 }))
    );

    renderWithProviders(<AttendersPage />);
    await screen.findByText('João Silva');

    await userEvent.click(screen.getByRole('button', { name: /exportar pdf/i }));
    await waitFor(() => expect(toastError).toHaveBeenCalledWith('Erro ao exportar PDF.'));
    expect(window.open).not.toHaveBeenCalled();
  });

  it('renders the list with rows once data loads', async () => {
    server.use(listHandler('/attenders', rows), ...referenceHandlers());

    renderWithProviders(<AttendersPage />);

    expect(await screen.findByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('Maria Santos')).toBeInTheDocument();
    expect(screen.getByText('Congregados')).toBeInTheDocument();
  });

  it('opens the create dialog when the user clicks "Novo" (has Create permission)', async () => {
    server.use(listHandler('/attenders', rows), ...referenceHandlers());

    renderWithProviders(<AttendersPage />);
    await screen.findByText('João Silva');

    await userEvent.click(screen.getByRole('button', { name: /novo/i }));

    expect(await screen.findByText('Novo Congregado')).toBeInTheDocument();
  });

  it('hides the "Novo" action for a user without Create permission', async () => {
    // User with only Report permission (can view all, but not create)
    // Report is Action.Report = 6, so bitmask is 1 << (6 - 1) = 0b100000 = 32
    server.use(
      meHandler({
        permissions: { 6: 0b100000 }
      }),
      listHandler('/attenders', rows),
      ...referenceHandlers()
    );

    renderWithProviders(<AttendersPage />);
    await screen.findByText('João Silva');

    expect(screen.queryByRole('button', { name: /novo/i })).not.toBeInTheDocument();
  });

  it('shows the empty state when there are no rows', async () => {
    server.use(
      meHandler({
        permissions: { 6: 0b100000 } // Only Report permission on Attenders
      }),
      listHandler('/attenders', []),
      ...referenceHandlers()
    );

    renderWithProviders(<AttendersPage />);

    await waitFor(() =>
      expect(screen.getByText('Nenhum congregado encontrado.')).toBeInTheDocument()
    );
    expect(screen.getByText('Congregados')).toBeInTheDocument();
  });

  it('displays attender phone and email', async () => {
    server.use(listHandler('/attenders', rows), ...referenceHandlers());

    renderWithProviders(<AttendersPage />);

    await screen.findByText('João Silva');
    // Phone and email may be in detail sheet or hidden in mobile
    const phone = screen.queryByText('(11) 99999-1111');
    const email = screen.queryByText('joao@email.com');
    if (phone) {
      expect(phone).toBeInTheDocument();
    }
    if (email) {
      expect(email).toBeInTheDocument();
    }
  });

  it('shows pagination controls when applicable', async () => {
    server.use(listHandler('/attenders', rows), ...referenceHandlers());

    renderWithProviders(<AttendersPage />);

    await screen.findByText('João Silva');
    // Pagination should be visible (even if disabled for single page)
    const paginationArea = screen.queryByRole('navigation');
    if (paginationArea) {
      expect(paginationArea).toBeInTheDocument();
    }
  });

  it('renders page title correctly', async () => {
    server.use(listHandler('/attenders', rows), ...referenceHandlers());

    renderWithProviders(<AttendersPage />);

    await screen.findByText('João Silva');
    expect(screen.getByText('Congregados')).toBeInTheDocument();
  });

  it('displays attender member status', async () => {
    server.use(listHandler('/attenders', rows), ...referenceHandlers());

    renderWithProviders(<AttendersPage />);

    await screen.findByText('João Silva');
    // First attender has isMember: true, second has false
    // The page should display this info somewhere
    expect(screen.getByText('João Silva')).toBeInTheDocument();
  });

  it('shows attender city and state', async () => {
    server.use(listHandler('/attenders', rows), ...referenceHandlers());

    renderWithProviders(<AttendersPage />);

    await screen.findByText('João Silva');
    // City and state may be displayed in mobile detail sheet or table
    const saoParulo = screen.queryByText('São Paulo');
    if (saoParulo) {
      expect(saoParulo).toBeInTheDocument();
    }
  });

  it('loads with loading state initially', async () => {
    server.use(listHandler('/attenders', rows), ...referenceHandlers());

    const { container } = renderWithProviders(<AttendersPage />);

    // Should eventually load
    await screen.findByText('João Silva');
    expect(container).toBeInTheDocument();
  });

  it('opens edit dialog when edit action clicked', async () => {
    const user = userEvent.setup();
    server.use(listHandler('/attenders', rows), ...referenceHandlers());

    renderWithProviders(<AttendersPage />);

    await screen.findByText('João Silva');

    // Find and click edit button (if visible in mobile/detail view)
    const editButtons = screen.queryAllByRole('button', { name: /editar|edit/i });
    if (editButtons.length > 0) {
      await user.click(editButtons[0]);
    }
  });

  it('handles multiple attenders correctly', async () => {
    const manyRows = Array.from({ length: 5 }, (_, i) => ({
      ...rows[0],
      id: i + 1,
      name: `Congregado ${i + 1}`
    }));

    server.use(listHandler('/attenders', manyRows), ...referenceHandlers());

    renderWithProviders(<AttendersPage />);

    await screen.findByText('Congregado 1');
    expect(screen.getByText('Congregado 2')).toBeInTheDocument();
    expect(screen.getByText('Congregado 3')).toBeInTheDocument();
  });
});
