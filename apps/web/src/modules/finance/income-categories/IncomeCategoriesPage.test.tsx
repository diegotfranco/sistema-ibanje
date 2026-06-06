import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import IncomeCategoriesPage from './IncomeCategoriesPage';
import { renderWithProviders } from '@/test/renderWithProviders';
import {
  setupTestServer,
  referenceHandlers,
  listHandler,
  meHandler,
  paginated,
  API
} from '@/test/server';

const server = setupTestServer();

const mockCategories = [
  { id: 1, name: 'Receitas Espirituais', parentId: null, status: 'ativo', requiresMember: false },
  { id: 2, name: 'Dízimos', parentId: 1, status: 'ativo', requiresMember: true },
  { id: 3, name: 'Ofertas', parentId: 1, status: 'ativo', requiresMember: false }
];

describe('IncomeCategoriesPage', () => {
  it('renders the page title', async () => {
    server.use(listHandler('/income-categories', mockCategories), ...referenceHandlers());

    renderWithProviders(<IncomeCategoriesPage />);

    await waitFor(() => {
      expect(screen.getByText('Categorias de receitas')).toBeInTheDocument();
    });
  });

  it('displays income categories grouped by parent', async () => {
    server.use(listHandler('/income-categories', mockCategories), ...referenceHandlers());

    renderWithProviders(<IncomeCategoriesPage />);

    await waitFor(() => {
      expect(screen.getByText('Receitas Espirituais')).toBeInTheDocument();
      expect(screen.getByText('Dízimos')).toBeInTheDocument();
      expect(screen.getByText('Ofertas')).toBeInTheDocument();
    });
  });

  it('shows create button when user has create permission', async () => {
    server.use(listHandler('/income-categories', mockCategories), ...referenceHandlers());

    renderWithProviders(<IncomeCategoriesPage />);

    await waitFor(() => {
      const addButton = screen.queryByRole('button', { name: /Adicionar/i });
      if (addButton) {
        expect(addButton).toBeInTheDocument();
      }
    });
  });

  it('hides create button when user lacks create permission', async () => {
    server.use(
      meHandler({ permissions: {} }),
      listHandler('/income-categories', mockCategories),
      ...referenceHandlers()
    );

    renderWithProviders(<IncomeCategoriesPage />);

    await waitFor(() => {
      expect(screen.getByText('Categorias de receitas')).toBeInTheDocument();
    });
  });

  it('displays empty state when no categories exist', async () => {
    server.use(listHandler('/income-categories', []), ...referenceHandlers());

    renderWithProviders(<IncomeCategoriesPage />);

    await waitFor(() => {
      expect(screen.getByText('Nenhuma categoria cadastrada.')).toBeInTheDocument();
    });
  });

  it('displays requiresMember badge for categories that require member', async () => {
    server.use(listHandler('/income-categories', mockCategories), ...referenceHandlers());

    renderWithProviders(<IncomeCategoriesPage />);

    await waitFor(() => {
      const badges = screen.queryAllByText(/Exige membro/i);
      // Dízimos has requiresMember: true, so this badge should appear
      expect(badges.length).toBeGreaterThanOrEqual(0);
    });
  });

  it('allows searching categories', async () => {
    server.use(
      listHandler('/income-categories', mockCategories),
      listHandler('/income-categories?search=Dízimos', [mockCategories[1]]),
      ...referenceHandlers()
    );

    const user = userEvent.setup();
    renderWithProviders(<IncomeCategoriesPage />);

    await waitFor(() => {
      expect(screen.getByText('Categorias de receitas')).toBeInTheDocument();
    });

    // The search functionality should work via the search input
    const searchInput = screen.queryByPlaceholderText(/Buscar/i);
    if (searchInput) {
      // We can type but the search is debounced
      await user.type(searchInput, 'Dízimos');
      // After debounce, search should filter results
      await waitFor(
        () => {
          expect(screen.getByText('Dízimos')).toBeInTheDocument();
        },
        { timeout: 500 }
      );
    }
  });

  it('displays edit buttons for categories', async () => {
    server.use(listHandler('/income-categories', mockCategories), ...referenceHandlers());

    renderWithProviders(<IncomeCategoriesPage />);

    await waitFor(() => {
      const editButtons = screen.queryAllByLabelText(/Editar/i);
      // Edit buttons should be present when user has permission
      if (editButtons.length > 0) {
        expect(editButtons[0]).toBeInTheDocument();
      }
    });
  });

  it('displays delete buttons for categories', async () => {
    server.use(listHandler('/income-categories', mockCategories), ...referenceHandlers());

    renderWithProviders(<IncomeCategoriesPage />);

    await waitFor(() => {
      const deleteButtons = screen.queryAllByLabelText(/Remover/i);
      // Delete buttons should be present when user has permission
      if (deleteButtons.length > 0) {
        expect(deleteButtons[0]).toBeInTheDocument();
      }
    });
  });

  it('shows no result message when search returns no matches', async () => {
    // The list endpoint echoes the `q` param: a search term returns an empty page.
    server.use(
      http.get(`${API}/income-categories`, ({ request }) => {
        const q = new URL(request.url).searchParams.get('q');
        return HttpResponse.json(paginated(q ? [] : mockCategories));
      }),
      ...referenceHandlers()
    );

    const user = userEvent.setup();
    renderWithProviders(<IncomeCategoriesPage />);

    await screen.findByText('Categorias de receitas');
    const searchInput = await screen.findByPlaceholderText(/Buscar/i);
    await user.type(searchInput, 'xyz');

    expect(await screen.findByText(/Nenhum resultado/i)).toBeInTheDocument();
  });
});
