import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ResourceListPage } from '@/components/ResourceListPage';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import StatusBadge from '@/components/StatusBadge';
import { EntryStatus } from '@/lib/status';
import { Module, Action, hasPermission } from '@/lib/permissions';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';
import { useIncomeEntries, useIncomeEntryMutations } from './useIncomeEntries';
import { IncomeEntryForm } from './IncomeEntryForm';
import type { IncomeEntryResponse, IncomeEntryFormValues } from '@/schemas/income-entry';

const STATUS_FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: EntryStatus.Pending, label: 'Pendente' },
  { value: EntryStatus.Paid, label: 'Paga' },
  { value: EntryStatus.Cancelled, label: 'Cancelada' }
] as const;

const formatDate = (s: string) => {
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
};

const formatMoney = (s: string) =>
  parseFloat(s).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function IncomeEntriesPage() {
  const { data: user } = useCurrentUser();
  const perms = user?.permissions;
  const canCreate = hasPermission(perms, Module.IncomeEntries, Action.Create);
  const canEdit = hasPermission(perms, Module.IncomeEntries, Action.Update);
  const canDelete = hasPermission(perms, Module.IncomeEntries, Action.Delete);

  const list = useIncomeEntries();
  const { create, update, remove } = useIncomeEntryMutations();

  const [editing, setEditing] = useState<IncomeEntryResponse | null | 'new'>(null);
  const [deleting, setDeleting] = useState<IncomeEntryResponse | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const allItems = list.data?.data ?? [];
  const filtered =
    statusFilter === 'all' ? allItems : allItems.filter((e) => e.status === statusFilter);

  const toCreateBody = (values: IncomeEntryFormValues) => ({
    referenceDate: values.referenceDate,
    ...(values.depositDate ? { depositDate: values.depositDate } : {}),
    amount: parseFloat(values.amount),
    categoryId: values.categoryId!,
    ...(values.memberId !== undefined ? { memberId: values.memberId } : {}),
    paymentMethodId: values.paymentMethodId!,
    ...(values.designatedFundId !== undefined ? { designatedFundId: values.designatedFundId } : {}),
    ...(values.notes ? { notes: values.notes } : {})
  });

  return (
    <>
      <div className="px-8 pt-6 pb-0 flex gap-2">
        {STATUS_FILTERS.map((f) => (
          <Button
            key={f.value}
            variant={statusFilter === f.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(f.value)}>
            {f.label}
          </Button>
        ))}
      </div>

      <ResourceListPage<IncomeEntryResponse>
        title="Lançamentos de Entradas"
        columns={[
          {
            header: 'Data',
            cell: (row) => formatDate(row.referenceDate)
          },
          {
            header: 'Categoria',
            cell: (row) => row.categoryName
          },
          {
            header: 'Valor',
            cell: (row) => <span className="font-mono">R$ {formatMoney(row.amount)}</span>
          },
          {
            header: 'Membro',
            cell: (row) => row.memberName ?? '—'
          },
          {
            header: 'Forma de Pag.',
            cell: (row) => row.paymentMethodName
          },
          {
            header: 'Fundo',
            cell: (row) => row.designatedFundName ?? '—'
          },
          {
            header: 'Status',
            cell: (row) => <StatusBadge status={row.status} />
          }
        ]}
        data={filtered}
        isLoading={list.isLoading}
        onCreate={canCreate ? () => setEditing('new') : undefined}
        onEdit={canEdit ? (r) => setEditing(r) : undefined}
        onDelete={canDelete ? (r) => setDeleting(r) : undefined}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
        rowKey={(r) => r.id}
        emptyMessage="Nenhum lançamento encontrado."
      />

      <Dialog open={editing !== null} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing === 'new' ? 'Novo lançamento de entrada' : 'Editar lançamento de entrada'}
            </DialogTitle>
          </DialogHeader>
          {editing !== null && (
            <IncomeEntryForm
              initialValues={editing === 'new' ? undefined : editing}
              isPending={create.isPending || update.isPending}
              onSubmit={(values) => {
                const body = toCreateBody(values);
                if (editing === 'new') {
                  create.mutate(body, { onSuccess: () => setEditing(null) });
                } else {
                  const updateBody = {
                    ...body,
                    ...(values.status ? { status: values.status } : {})
                  };
                  update.mutate(
                    { id: editing.id, body: updateBody },
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
        description={`Tem certeza que deseja remover este lançamento de R$ ${deleting ? formatMoney(deleting.amount) : ''}?`}
        onConfirm={() =>
          deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })
        }
        isPending={remove.isPending}
      />
    </>
  );
}
