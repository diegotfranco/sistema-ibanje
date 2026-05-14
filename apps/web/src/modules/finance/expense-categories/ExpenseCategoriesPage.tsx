import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ResourceListPage } from '@/components/ResourceListPage';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { Module, Action, hasPermission } from '@/lib/permissions';
import { ActiveStatus } from '@sistema-ibanje/shared';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';
import { useExpenseCategories, useExpenseCategoryMutations } from './useExpenseCategories';
import { ExpenseCategoryForm } from './ExpenseCategoryForm';
import type { ExpenseCategoryResponse } from '@/schemas/expense-category';

export default function ExpenseCategoriesPage() {
  const { data: user } = useCurrentUser();
  const perms = user?.permissions;
  const canCreate = hasPermission(perms, Module.ExpenseCategories, Action.Create);
  const canEdit = hasPermission(perms, Module.ExpenseCategories, Action.Update);
  const canDelete = hasPermission(perms, Module.ExpenseCategories, Action.Delete);

  const list = useExpenseCategories();
  const { create, update, remove } = useExpenseCategoryMutations();

  const [editing, setEditing] = useState<ExpenseCategoryResponse | null | 'new'>(null);
  const [deleting, setDeleting] = useState<ExpenseCategoryResponse | null>(null);

  const allCategories = useMemo(() => list.data?.data ?? [], [list.data]);
  const items = allCategories.filter((r) => r.status === ActiveStatus.Active);

  const columns = useMemo(() => {
    const getCategoryName = (id: number | null) => {
      if (!id) return '—';
      return allCategories.find((c) => c.id === id)?.name ?? '—';
    };
    return [
      {
        header: 'Nome',
        cell: (row: ExpenseCategoryResponse) => (
          <span className={row.parentId ? 'pl-6' : ''}>{row.name}</span>
        )
      },
      {
        header: 'Pai',
        cell: (row: ExpenseCategoryResponse) => getCategoryName(row.parentId)
      },
      {
        header: 'Descrição',
        cell: (row: ExpenseCategoryResponse) => row.description || '—'
      }
    ];
  }, [allCategories]);

  return (
    <>
      <ResourceListPage<ExpenseCategoryResponse>
        title="Categorias de Saídas"
        columns={columns}
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
            <ExpenseCategoryForm
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
