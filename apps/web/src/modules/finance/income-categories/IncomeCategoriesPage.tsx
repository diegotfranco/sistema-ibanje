import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { Module, Action, hasPermission } from '@/lib/permissions';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useIncomeCategories, useIncomeCategoryMutations } from './useIncomeCategories';
import { IncomeCategoryForm } from './IncomeCategoryForm';
import { useCategoryPageData } from '../useCategoryPageData';
import { makeSubmitHandler } from '../entries-utils';
import { CategoryGroupedList } from '../CategoryGroupedList';
import type { IncomeCategoryResponse } from './schema';

export default function IncomeCategoriesPage() {
  const { data: user } = useCurrentUser();
  const perms = user?.permissions;
  const canCreate = hasPermission(perms, Module.IncomeCategories, Action.Create);
  const canEdit = hasPermission(perms, Module.IncomeCategories, Action.Update);
  const canDelete = hasPermission(perms, Module.IncomeCategories, Action.Delete);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebouncedValue(searchQuery.trim(), 250);
  // Full list (unfiltered) feeds the form's parent picker so it always shows
  // every option. When debouncedQuery is empty both hooks resolve to the same
  // URL/key and React Query dedupes the request.
  const fullList = useIncomeCategories();
  const filteredList = useIncomeCategories(debouncedQuery || undefined);
  const { create, update, remove } = useIncomeCategoryMutations();

  const [editing, setEditing] = useState<IncomeCategoryResponse | null | 'new'>(null);
  const [deleting, setDeleting] = useState<IncomeCategoryResponse | null>(null);
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
        title="Categorias de receitas"
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
        renderRowMeta={(row) =>
          row.requiresMember ? <Badge variant="secondary">Exige membro</Badge> : null
        }
      />

      <Dialog open={editing !== null} onOpenChange={(v) => !v && closeDialog()}>
        <DialogContent className="sm:max-w-xl lg:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing === 'new' ? 'Nova categoria' : 'Editar categoria'}</DialogTitle>
            <DialogDescription>
              {editing === 'new'
                ? 'Crie um grupo (categoria raiz) ou subdivida um grupo existente.'
                : 'Atualize esta categoria.'}
            </DialogDescription>
          </DialogHeader>
          {editing !== null && (
            <IncomeCategoryForm
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
