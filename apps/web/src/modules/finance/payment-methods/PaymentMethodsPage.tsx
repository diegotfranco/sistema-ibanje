import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ResourceListPage } from '@/components/ResourceListPage';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { Module, Action, hasPermission } from '@/lib/permissions';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';
import { usePaymentMethods, usePaymentMethodMutations } from './usePaymentMethods';
import { PaymentMethodForm } from './PaymentMethodForm';
import type { PaymentMethodResponse } from '@/schemas/payment-method';

export default function PaymentMethodsPage() {
  const { data: user } = useCurrentUser();
  const perms = user?.permissions;
  const canCreate = hasPermission(perms, Module.PaymentMethods, Action.Create);
  const canEdit = hasPermission(perms, Module.PaymentMethods, Action.Update);
  const canDelete = hasPermission(perms, Module.PaymentMethods, Action.Delete);

  const list = usePaymentMethods();
  const { create, update, remove } = usePaymentMethodMutations();

  const [editing, setEditing] = useState<PaymentMethodResponse | null | 'new'>(null);
  const [deleting, setDeleting] = useState<PaymentMethodResponse | null>(null);

  const items = list.data?.data.filter((r) => r.status === 'ativo');

  return (
    <>
      <ResourceListPage<PaymentMethodResponse>
        title="Formas de Pagamento"
        columns={[
          {
            header: 'Nome',
            cell: (row) => row.name
          },
          {
            header: 'Entrada',
            cell: (row) => (row.allowsInflow ? 'Sim' : '—')
          },
          {
            header: 'Saída',
            cell: (row) => (row.allowsOutflow ? 'Sim' : '—')
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
            <DialogTitle>
              {editing === 'new' ? 'Nova forma de pagamento' : 'Editar forma de pagamento'}
            </DialogTitle>
          </DialogHeader>
          {editing !== null && (
            <PaymentMethodForm
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
