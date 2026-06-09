import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/Dialog';
import { Badge } from '@/components/ui/badge';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { ResourceListPage, type CustomAction } from '@/components/ResourceListPage';
import { TrashToggle } from '@/components/TrashToggle';
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

  const [viewingTrash, setViewingTrash] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebouncedValue(searchQuery.trim(), 250);
  // Full list (unfiltered) feeds the form's parent picker so it always shows
  // every option. When debouncedQuery is empty both hooks resolve to the same
  // URL/key and React Query dedupes the request.
  const fullList = useIncomeCategories();
  // In trash mode we list soft-deleted rows flat (search is disabled there).
  const filteredList = useIncomeCategories(
    viewingTrash ? undefined : debouncedQuery || undefined,
    viewingTrash ? 'only' : undefined
  );
  const { create, update, remove, restore } = useIncomeCategoryMutations();

  const [editing, setEditing] = useState<IncomeCategoryResponse | null | 'new'>(null);
  const [deleting, setDeleting] = useState<IncomeCategoryResponse | null>(null);

  const { allCategories } = useCategoryPageData(fullList.data?.data);
  const { items } = useCategoryPageData(filteredList.data?.data);
  const handleSubmit = makeSubmitHandler(editing, setEditing, create, update);
  const isSearching =
    filteredList.isFetching && (debouncedQuery !== '' || searchQuery.trim() !== '');

  const closeDialog = () => setEditing(null);

  const restoreAction: CustomAction<IncomeCategoryResponse> = {
    label: 'Restaurar',
    icon: <RotateCcw size={16} />,
    onClick: (r) => restore.mutate(r.id)
  };
  const trashToggle = canDelete ? (
    <TrashToggle viewingTrash={viewingTrash} onToggle={setViewingTrash} />
  ) : undefined;

  return (
    <div className="space-y-6 p-8">
      {viewingTrash ? (
        <ResourceListPage<IncomeCategoryResponse>
          title="Categorias de receitas — Lixeira"
          columns={[
            { header: 'Nome', cell: (row) => row.name, className: 'w-full' },
            { header: 'Descrição', cell: (row) => row.description || '—', hideBelow: 'md' }
          ]}
          data={filteredList.data?.data}
          isLoading={filteredList.isLoading}
          emptyMessage="A lixeira está vazia."
          toolbarRight={trashToggle}
          customActions={canDelete ? [restoreAction] : undefined}
          rowKey={(r) => r.id}
          mobileRow={(row) => (
            <div className="min-w-0">
              <p className="font-medium truncate">{row.name}</p>
              {row.description && (
                <p className="text-xs text-muted-foreground truncate">{row.description}</p>
              )}
            </div>
          )}
        />
      ) : (
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
          onCreate={() => setEditing('new')}
          onEdit={(row) => setEditing(row)}
          onDelete={(row) => setDeleting(row)}
          headerActions={trashToggle}
          renderRowMeta={(row) =>
            row.requiresMember ? <Badge variant="secondary">Exige membro</Badge> : null
          }
        />
      )}

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
