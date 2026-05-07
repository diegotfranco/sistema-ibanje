import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ResourceListPage } from '@/components/ResourceListPage';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { Module, Action, hasPermission } from '@/lib/permissions';
import { ActiveStatus } from '@/lib/status';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';
import { useIncomeCategories, useIncomeCategoryMutations } from './useIncomeCategories';
import { IncomeCategoryForm } from './IncomeCategoryForm';
import type { IncomeCategoryResponse } from '@/schemas/income-category';

export default function IncomeCategoriesPage() {
  const { data: user } = useCurrentUser();
  const perms = user?.permissions;
  const canCreate = hasPermission(perms, Module.IncomeCategories, Action.Create);
  const canEdit = hasPermission(perms, Module.IncomeCategories, Action.Update);
  const canDelete = hasPermission(perms, Module.IncomeCategories, Action.Delete);

  const list = useIncomeCategories();
  const { create, update, remove } = useIncomeCategoryMutations();

  const [editing, setEditing] = useState<IncomeCategoryResponse | null | 'new'>(null);
  const [deleting, setDeleting] = useState<IncomeCategoryResponse | null>(null);

  const items = list.data?.data.filter((r) => r.status === ActiveStatus.Active);
  const allCategories = list.data?.data ?? [];

  const getCategoryName = (id: number | null) => {
    if (!id) return '—';
    return allCategories.find((c) => c.id === id)?.name ?? '—';
  };

  return (
    <>
      <ResourceListPage<IncomeCategoryResponse>
        title="Categorias de Entradas"
        columns={[
          {
            header: 'Nome',
            cell: (row) => <span className={row.parentId ? 'pl-6' : ''}>{row.name}</span>
          },
          {
            header: 'Pai',
            cell: (row) => getCategoryName(row.parentId)
          },
          {
            header: 'Exige Membro',
            cell: (row) => (row.requiresMember ? 'Sim' : 'Não')
          }
        ]}
        data={items}
        isLoading={list.isLoading}
        onCreate={canCreate ? () => setEditing('new') : undefined}
        onEdit={canEdit ? (r) => setEditing(r) : undefined}
        onDelete={canDelete ? (r) => setDeleting(r) : undefined}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
        rowKey={(r) => r.id}
      />

      <Dialog open={editing !== null} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing === 'new' ? 'Nova categoria' : 'Editar categoria'}</DialogTitle>
          </DialogHeader>
          {editing !== null && (
            <IncomeCategoryForm
              initialValues={editing === 'new' ? undefined : editing}
              categories={allCategories}
              isPending={create.isPending || update.isPending}
              onSubmit={(values) => {
                if (editing === 'new') {
                  create.mutate(values, { onSuccess: () => setEditing(null) });
                } else {
                  update.mutate(
                    { id: editing.id, body: values },
                    { onSuccess: () => setEditing(null) }
                  );
                }
              }}
              onCancel={() => setEditing(null)}
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
    </>
  );
}
