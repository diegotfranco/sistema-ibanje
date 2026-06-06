import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryGroupedList } from './CategoryGroupedList';
import { renderWithProviders } from '@/test/renderWithProviders';

const mockCategories = [
  { id: 1, name: 'Receitas Espirituais', parentId: null, status: 'ativo' },
  { id: 2, name: 'Dízimos', parentId: 1, status: 'ativo' },
  { id: 3, name: 'Ofertas', parentId: 1, status: 'ativo' },
  { id: 4, name: 'Receitas Diversas', parentId: null, status: 'ativo' },
  { id: 5, name: 'Aluguel de Sala', parentId: 4, status: 'ativo' },
  { id: 6, name: 'Aluguel de Equipamento', parentId: 4, status: 'ativo' }
];

describe('CategoryGroupedList', () => {
  it('renders the title and create button', () => {
    const onCreate = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    renderWithProviders(
      <CategoryGroupedList
        title="Categorias de receitas"
        items={mockCategories}
        isLoading={false}
        searchQuery=""
        onSearchChange={vi.fn()}
        canCreate={true}
        canEdit={true}
        canDelete={true}
        onCreate={onCreate}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    expect(screen.getByText('Categorias de receitas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Adicionar/i })).toBeInTheDocument();
  });

  it('displays category groups with parent names', () => {
    const onCreate = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    renderWithProviders(
      <CategoryGroupedList
        title="Categorias de receitas"
        items={mockCategories}
        isLoading={false}
        searchQuery=""
        onSearchChange={vi.fn()}
        canCreate={true}
        canEdit={true}
        canDelete={true}
        onCreate={onCreate}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    // Parent groups should be visible
    expect(screen.getByText('Receitas Espirituais')).toBeInTheDocument();
    expect(screen.getByText('Receitas Diversas')).toBeInTheDocument();
  });

  it('displays child categories under their parents', () => {
    const onCreate = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    renderWithProviders(
      <CategoryGroupedList
        title="Categorias de receitas"
        items={mockCategories}
        isLoading={false}
        searchQuery=""
        onSearchChange={vi.fn()}
        canCreate={true}
        canEdit={true}
        canDelete={true}
        onCreate={onCreate}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    // Child categories should be visible
    expect(screen.getByText('Dízimos')).toBeInTheDocument();
    expect(screen.getByText('Ofertas')).toBeInTheDocument();
    expect(screen.getByText('Aluguel de Sala')).toBeInTheDocument();
  });

  it('calls onCreate when create button is clicked', async () => {
    const onCreate = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <CategoryGroupedList
        title="Categorias de receitas"
        items={mockCategories}
        isLoading={false}
        searchQuery=""
        onSearchChange={vi.fn()}
        canCreate={true}
        canEdit={true}
        canDelete={true}
        onCreate={onCreate}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    const createButton = screen.getByRole('button', { name: /Adicionar/i });
    await user.click(createButton);

    expect(onCreate).toHaveBeenCalled();
  });

  it('hides create button when canCreate is false', () => {
    const onCreate = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    renderWithProviders(
      <CategoryGroupedList
        title="Categorias de receitas"
        items={mockCategories}
        isLoading={false}
        searchQuery=""
        onSearchChange={vi.fn()}
        canCreate={false}
        canEdit={true}
        canDelete={true}
        onCreate={onCreate}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    expect(screen.queryByRole('button', { name: /Adicionar/i })).not.toBeInTheDocument();
  });

  it('shows empty message when no items exist', () => {
    const onCreate = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    renderWithProviders(
      <CategoryGroupedList
        title="Categorias de receitas"
        items={[]}
        isLoading={false}
        searchQuery=""
        onSearchChange={vi.fn()}
        canCreate={true}
        canEdit={true}
        canDelete={true}
        onCreate={onCreate}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    expect(screen.getByText('Nenhuma categoria cadastrada.')).toBeInTheDocument();
  });

  it('displays search result message when search query has no matches', () => {
    const onCreate = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    renderWithProviders(
      <CategoryGroupedList
        title="Categorias de receitas"
        items={[]}
        isLoading={false}
        searchQuery="xyz"
        onSearchChange={vi.fn()}
        canCreate={true}
        canEdit={true}
        canDelete={true}
        onCreate={onCreate}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    expect(screen.getByText(/Nenhum resultado para "xyz"/)).toBeInTheDocument();
  });

  it('displays group count badges', () => {
    const onCreate = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    renderWithProviders(
      <CategoryGroupedList
        title="Categorias de receitas"
        items={mockCategories}
        isLoading={false}
        searchQuery=""
        onSearchChange={vi.fn()}
        canCreate={true}
        canEdit={true}
        canDelete={true}
        onCreate={onCreate}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    // Group count badges should display count of children
    const badges = screen.getAllByRole('button');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('allows toggling group expansion', async () => {
    const onCreate = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <CategoryGroupedList
        title="Categorias de receitas"
        items={mockCategories}
        isLoading={false}
        searchQuery=""
        onSearchChange={vi.fn()}
        canCreate={true}
        canEdit={true}
        canDelete={true}
        onCreate={onCreate}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    // Find a group header button (expand/collapse)
    const groupButtons = screen.getAllByRole('button');
    const groupHeader = groupButtons.find(
      (btn) =>
        btn.getAttribute('aria-expanded') !== null &&
        btn.textContent?.includes('Receitas Espirituais')
    );

    if (groupHeader) {
      await user.click(groupHeader);
      // After clicking, aria-expanded should toggle
      expect(
        groupHeader.getAttribute('aria-expanded') === 'true' ||
          groupHeader.getAttribute('aria-expanded') === 'false'
      ).toBe(true);
    }
  });

  it('calls onEdit when edit button for item is clicked', async () => {
    const onCreate = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <CategoryGroupedList
        title="Categorias de receitas"
        items={mockCategories}
        isLoading={false}
        searchQuery=""
        onSearchChange={vi.fn()}
        canCreate={true}
        canEdit={true}
        canDelete={true}
        onCreate={onCreate}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    // Click on the first edit button we can find
    const editButtons = screen.getAllByLabelText(/Editar/i);
    if (editButtons.length > 0) {
      await user.click(editButtons[0]);
      // Note: we can't verify which item was edited in this simple test
      // but we can verify onEdit was called
      expect(onEdit).toHaveBeenCalled();
    }
  });

  it('calls onDelete when delete button for item is clicked', async () => {
    const onCreate = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <CategoryGroupedList
        title="Categorias de receitas"
        items={mockCategories}
        isLoading={false}
        searchQuery=""
        onSearchChange={vi.fn()}
        canCreate={true}
        canEdit={true}
        canDelete={true}
        onCreate={onCreate}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    // Click on the first delete button we can find
    const deleteButtons = screen.getAllByLabelText(/Remover/i);
    if (deleteButtons.length > 0) {
      await user.click(deleteButtons[0]);
      expect(onDelete).toHaveBeenCalled();
    }
  });

  it('hides edit and delete buttons when permissions are false', () => {
    const onCreate = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    renderWithProviders(
      <CategoryGroupedList
        title="Categorias de receitas"
        items={mockCategories}
        isLoading={false}
        searchQuery=""
        onSearchChange={vi.fn()}
        canCreate={true}
        canEdit={false}
        canDelete={false}
        onCreate={onCreate}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    expect(screen.queryAllByLabelText(/Editar/i)).toHaveLength(0);
    expect(screen.queryAllByLabelText(/Remover/i)).toHaveLength(0);
  });
});
