import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { Module, Action, hasPermission } from '@/lib/permissions';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useExpenseCategories, useExpenseCategoryMutations } from './useExpenseCategories';
import { ExpenseCategoryForm } from './ExpenseCategoryForm';
import { useCategoryPageData } from '../useCategoryPageData';
import { makeSubmitHandler } from '../entries-utils';
import { CategoryGroupedList } from '../CategoryGroupedList';
import type { ExpenseCategoryResponse } from './schema';

export default function ExpenseCategoriesPage() {
  const { data: user } = useCurrentUser();
  const perms = user?.permissions;
  const canCreate = hasPermission(perms, Module.ExpenseCategories, Action.Create);
  const canEdit = hasPermission(perms, Module.ExpenseCategories, Action.Update);
  const canDelete = hasPermission(perms, Module.ExpenseCategories, Action.Delete);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebouncedValue(searchQuery.trim(), 250);
  // Full list (unfiltered) feeds the form's parent picker so it always shows
  // every option. When debouncedQuery is empty both hooks resolve to the same
  // URL/key and React Query dedupes the request.
  const fullList = useExpenseCategories();
  const filteredList = useExpenseCategories(debouncedQuery || undefined);
  const { create, update, remove } = useExpenseCategoryMutations();

  const [editing, setEditing] = useState<ExpenseCategoryResponse | null | 'new'>(null);
  const [deleting, setDeleting] = useState<ExpenseCategoryResponse | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<number | undefined>(undefined);

  const { allCategories } = useCategoryPageData(fullList.data?.data);
  const { items } = useCategoryPageData(filteredList.data?.data);
  const handleSubmit = makeSubmitHandler(editing, setEditing, create, update);
  const isSearching =
    filteredList.isFetching && (debouncedQuery !== '' || searchQuery.trim() !== '');

  const closeDialog = () => {
    setEditing(null);
    setDefaultParentId(undefined);
  };

  return (
    <div className="space-y-6 p-8">
      <CategoryGroupedList
        title="Categorias de saídas"
        items={items}
        isLoading={filteredList.isLoading}
        isSearching={isSearching}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
        onCreate={() => {
          setDefaultParentId(undefined);
          setEditing('new');
        }}
        onCreateInGroup={(parentId) => {
          setDefaultParentId(parentId);
          setEditing('new');
        }}
        onEdit={(row) => setEditing(row)}
        onDelete={(row) => setDeleting(row)}
        renderRowMeta={(row) => row.description || '—'}
      />

      <Dialog open={editing !== null} onOpenChange={(v) => !v && closeDialog()}>
        <DialogContent className="sm:max-w-xl lg:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing === 'new' ? 'Nova categoria' : 'Editar categoria'}</DialogTitle>
            <DialogDescription>
              {editing === 'new'
                ? 'Crie um grupo (categoria pai) ou subdivida um grupo existente.'
                : 'Atualize o nome, descrição ou grupo desta categoria.'}
            </DialogDescription>
          </DialogHeader>
          {editing !== null && (
            <ExpenseCategoryForm
              initialValues={editing === 'new' ? undefined : editing}
              defaultParentId={editing === 'new' ? defaultParentId : undefined}
              categories={allCategories}
              isPending={create.isPending || update.isPending}
              onSubmit={handleSubmit}
              onCancel={closeDialog}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(v) => !v && setDeleting(null)}
        description={`Tem certeza que deseja remover "${deleting?.name}"?`}
        onConfirm={() =>
          deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })
        }
        isPending={remove.isPending}
      />
    </div>
  );
}
