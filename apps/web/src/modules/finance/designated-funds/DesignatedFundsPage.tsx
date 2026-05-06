import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ResourceListPage } from '@/components/ResourceListPage';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { Module, Action, hasPermission } from '@/lib/permissions';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';
import { useDesignatedFunds, useDesignatedFundMutations } from './useDesignatedFunds';
import { DesignatedFundForm } from './DesignatedFundForm';
import type { DesignatedFundResponse } from '@/schemas/designated-fund';

export default function DesignatedFundsPage() {
  const { data: user } = useCurrentUser();
  const perms = user?.permissions;
  const canCreate = hasPermission(perms, Module.DesignatedFunds, Action.Create);
  const canEdit = hasPermission(perms, Module.DesignatedFunds, Action.Update);
  const canDelete = hasPermission(perms, Module.DesignatedFunds, Action.Delete);

  const list = useDesignatedFunds();
  const { create, update, remove } = useDesignatedFundMutations();

  const [editing, setEditing] = useState<DesignatedFundResponse | null | 'new'>(null);
  const [deleting, setDeleting] = useState<DesignatedFundResponse | null>(null);

  const items = list.data?.data.filter((r) => r.status === 'ativo');

  return (
    <>
      <ResourceListPage<DesignatedFundResponse>
        title="Fundos Designados"
        columns={[
          {
            header: 'Nome',
            cell: (row) => row.name
          },
          {
            header: 'Descrição',
            cell: (row) => row.description || '—'
          },
          {
            header: 'Meta',
            cell: (row) => (row.targetAmount ? `R$ ${row.targetAmount}` : '—')
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
            <DialogTitle>{editing === 'new' ? 'Novo fundo' : 'Editar fundo'}</DialogTitle>
          </DialogHeader>
          {editing !== null && (
            <DesignatedFundForm
              initialValues={editing === 'new' ? undefined : editing}
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
