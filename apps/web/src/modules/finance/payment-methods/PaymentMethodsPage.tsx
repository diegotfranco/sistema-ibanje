import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/Dialog';
import { PageContainer } from '@/components/PageContainer';
import { ResourceListPage, type CustomAction } from '@/components/ResourceListPage';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { TrashToggle } from '@/components/TrashToggle';
import { Module, Action, hasPermission } from '@/lib/permissions';
import { ActiveStatus } from '@sistema-ibanje/shared';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';
import { usePaymentMethods, usePaymentMethodMutations } from './usePaymentMethods';
import { PaymentMethodForm } from './PaymentMethodForm';
import { makeSubmitHandler } from '../entries-utils';
import type { PaymentMethodResponse } from './schema';

export default function PaymentMethodsPage() {
  const { data: user } = useCurrentUser();
  const perms = user?.permissions;
  const canCreate = hasPermission(perms, Module.PaymentMethods, Action.Create);
  const canEdit = hasPermission(perms, Module.PaymentMethods, Action.Update);
  const canDelete = hasPermission(perms, Module.PaymentMethods, Action.Delete);

  const [viewingTrash, setViewingTrash] = useState(false);
  const list = usePaymentMethods({ deleted: viewingTrash ? 'only' : undefined });
  const { create, update, remove, restore } = usePaymentMethodMutations();

  const [editing, setEditing] = useState<PaymentMethodResponse | null | 'new'>(null);
  const [deleting, setDeleting] = useState<PaymentMethodResponse | null>(null);
  const handleSubmit = makeSubmitHandler(editing, setEditing, create, update);

  // Trash shows every soft-deleted row as-is; the live view hides retired (inativo) methods.
  const items = viewingTrash
    ? list.data?.data
    : list.data?.data.filter((r) => r.status === ActiveStatus.Active);

  const restoreAction: CustomAction<PaymentMethodResponse> = {
    label: 'Restaurar',
    icon: <RotateCcw size={16} />,
    onClick: (r) => restore.mutate(r.id)
  };

  return (
    <>
      <PageContainer>
        <ResourceListPage<PaymentMethodResponse>
          title={viewingTrash ? 'Formas de Pagamento — Lixeira' : 'Formas de Pagamento'}
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
          emptyMessage={viewingTrash ? 'A lixeira está vazia.' : undefined}
          toolbarRight={
            canDelete ? (
              <TrashToggle viewingTrash={viewingTrash} onToggle={setViewingTrash} />
            ) : undefined
          }
          onCreate={!viewingTrash && canCreate ? () => setEditing('new') : undefined}
          onEdit={!viewingTrash && canEdit ? (r) => setEditing(r) : undefined}
          onDelete={!viewingTrash && canDelete ? (r) => setDeleting(r) : undefined}
          customActions={viewingTrash && canDelete ? [restoreAction] : undefined}
          canCreate={!viewingTrash && canCreate}
          canEdit={!viewingTrash && canEdit}
          canDelete={!viewingTrash && canDelete}
          rowKey={(r) => r.id}
          mobileRow={(row) => (
            <div className="flex flex-col gap-1">
              <span className="font-medium">{row.name}</span>
              <div className="flex gap-1.5">
                {row.allowsInflow && (
                  <span className="rounded-full bg-money-in/15 px-2 py-0.5 text-xs text-money-in">
                    Entrada
                  </span>
                )}
                {row.allowsOutflow && (
                  <span className="rounded-full bg-money-out/15 px-2 py-0.5 text-xs text-money-out">
                    Saída
                  </span>
                )}
              </div>
            </div>
          )}
          mobileDetailTitle={(row) => row.name}
          mobileDetailFields={(row) => [
            { label: 'Nome', value: row.name },
            { label: 'Entrada', value: row.allowsInflow ? 'Sim' : '—' },
            { label: 'Saída', value: row.allowsOutflow ? 'Sim' : '—' }
          ]}
        />
      </PageContainer>

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
              onSubmit={handleSubmit}
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
