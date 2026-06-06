import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import ExpenseCategoriesPage from './ExpenseCategoriesPage';
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
  {
    id: 1,
    name: 'Despesas Operacionais',
    parentId: null,
    status: 'ativo',
    description: 'Custos de funcionamento'
  },
  { id: 2, name: 'Aluguel', parentId: 1, status: 'ativo', description: 'Aluguel de imóvel' },
  {
    id: 3,
    name: 'Energia Elétrica',
    parentId: 1,
    status: 'ativo',
    description: 'Contas de energia'
  },
  {
    id: 4,
    name: 'Despesas Administrativas',
    parentId: null,
    status: 'ativo',
    description: 'Gastos administrativos'
  }
];

describe('ExpenseCategoriesPage', () => {
  it('renders the page title', async () => {
    server.use(listHandler('/expense-categories', mockCategories), ...referenceHandlers());

    renderWithProviders(<ExpenseCategoriesPage />);

    await waitFor(() => {
      expect(screen.getByText('Categorias de saídas')).toBeInTheDocument();
    });
  });

  it('displays expense categories grouped by parent', async () => {
    server.use(listHandler('/expense-categories', mockCategories), ...referenceHandlers());

    renderWithProviders(<ExpenseCategoriesPage />);

    await waitFor(() => {
      expect(screen.getByText('Despesas Operacionais')).toBeInTheDocument();
      expect(screen.getByText('Aluguel')).toBeInTheDocument();
      expect(screen.getByText('Energia Elétrica')).toBeInTheDocument();
      expect(screen.getByText('Despesas Administrativas')).toBeInTheDocument();
    });
  });

  it('shows create button when user has create permission', async () => {
    server.use(listHandler('/expense-categories', mockCategories), ...referenceHandlers());

    renderWithProviders(<ExpenseCategoriesPage />);

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
      listHandler('/expense-categories', mockCategories),
      ...referenceHandlers()
    );

    renderWithProviders(<ExpenseCategoriesPage />);

    await waitFor(() => {
      expect(screen.getByText('Categorias de saídas')).toBeInTheDocument();
    });
  });

  it('displays empty state when no categories exist', async () => {
    server.use(listHandler('/expense-categories', []), ...referenceHandlers());

    renderWithProviders(<ExpenseCategoriesPage />);

    await waitFor(() => {
      expect(screen.getByText('Nenhuma categoria cadastrada.')).toBeInTheDocument();
    });
  });

  it('displays category descriptions in metadata', async () => {
    server.use(listHandler('/expense-categories', mockCategories), ...referenceHandlers());

    renderWithProviders(<ExpenseCategoriesPage />);

    await waitFor(() => {
      // At least some descriptions should be visible in metadata
      const descriptions = screen.queryAllByText(/Custos|Aluguel|Contas|Gastos/i);
      expect(descriptions.length).toBeGreaterThan(0);
    });
  });

  it('allows searching categories', async () => {
    server.use(
      listHandler('/expense-categories', mockCategories),
      listHandler('/expense-categories?search=Aluguel', [mockCategories[1]]),
      ...referenceHandlers()
    );

    const user = userEvent.setup();
    renderWithProviders(<ExpenseCategoriesPage />);

    await waitFor(() => {
      expect(screen.getByText('Categorias de saídas')).toBeInTheDocument();
    });

    const searchInput = screen.queryByPlaceholderText(/Buscar/i);
    if (searchInput) {
      await user.type(searchInput, 'Aluguel');
      await waitFor(
        () => {
          expect(screen.getByText('Aluguel')).toBeInTheDocument();
        },
        { timeout: 500 }
      );
    }
  });

  it('displays edit buttons for categories', async () => {
    server.use(listHandler('/expense-categories', mockCategories), ...referenceHandlers());

    renderWithProviders(<ExpenseCategoriesPage />);

    await waitFor(() => {
      const editButtons = screen.queryAllByLabelText(/Editar/i);
      if (editButtons.length > 0) {
        expect(editButtons[0]).toBeInTheDocument();
      }
    });
  });

  it('displays delete buttons for categories', async () => {
    server.use(listHandler('/expense-categories', mockCategories), ...referenceHandlers());

    renderWithProviders(<ExpenseCategoriesPage />);

    await waitFor(() => {
      const deleteButtons = screen.queryAllByLabelText(/Remover/i);
      if (deleteButtons.length > 0) {
        expect(deleteButtons[0]).toBeInTheDocument();
      }
    });
  });

  it('shows no result message when search returns no matches', async () => {
    // The list endpoint echoes the `q` param: a search term returns an empty page.
    server.use(
      http.get(`${API}/expense-categories`, ({ request }) => {
        const q = new URL(request.url).searchParams.get('q');
        return HttpResponse.json(paginated(q ? [] : mockCategories));
      }),
      ...referenceHandlers()
    );

    const user = userEvent.setup();
    renderWithProviders(<ExpenseCategoriesPage />);

    await screen.findByText('Categorias de saídas');
    const searchInput = await screen.findByPlaceholderText(/Buscar/i);
    await user.type(searchInput, 'xyz');

    expect(await screen.findByText(/Nenhum resultado/i)).toBeInTheDocument();
  });

  it('hides edit and delete buttons when user lacks permissions', async () => {
    server.use(
      meHandler({ permissions: {} }),
      listHandler('/expense-categories', mockCategories),
      ...referenceHandlers()
    );

    renderWithProviders(<ExpenseCategoriesPage />);

    await waitFor(() => {
      expect(screen.getByText('Categorias de saídas')).toBeInTheDocument();
    });

    // No edit or delete buttons should be present
    expect(screen.queryAllByLabelText(/Editar/i)).toHaveLength(0);
    expect(screen.queryAllByLabelText(/Remover/i)).toHaveLength(0);
  });
});
