import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ResourceListPage } from '@/components/ResourceListPage';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import StatusBadge from '@/components/StatusBadge';
import { Receipt } from 'lucide-react';
import { Module, Action, hasPermission } from '@/lib/permissions';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';
import { useExpenseEntries, useExpenseEntryMutations } from './useExpenseEntries';
import { ExpenseEntryForm } from './ExpenseEntryForm';
import { STATUS_FILTERS, formatDate, formatMoney } from '../entries-utils';
import type { ExpenseEntryResponse, ExpenseEntryFormValues } from '@/schemas/expense-entry';

export default function ExpenseEntriesPage() {
  const { data: user } = useCurrentUser();
  const perms = user?.permissions;
  const canCreate = hasPermission(perms, Module.ExpenseEntries, Action.Create);
  const canEdit = hasPermission(perms, Module.ExpenseEntries, Action.Update);
  const canDelete = hasPermission(perms, Module.ExpenseEntries, Action.Delete);

  const list = useExpenseEntries();
  const { create, update, remove } = useExpenseEntryMutations();

  const [editing, setEditing] = useState<ExpenseEntryResponse | null | 'new'>(null);
  const [deleting, setDeleting] = useState<ExpenseEntryResponse | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const allItems = list.data?.data ?? [];
  const filtered =
    statusFilter === 'all' ? allItems : allItems.filter((e) => e.status === statusFilter);

  const toCreateBody = (values: ExpenseEntryFormValues) => ({
    referenceDate: values.referenceDate,
    description: values.description,
    amount: Number.parseFloat(values.amount),
    total: Number.parseFloat(values.total),
    installment: values.installment,
    totalInstallments: values.totalInstallments,
    categoryId: values.categoryId!,
    paymentMethodId: values.paymentMethodId!,
    ...(values.designatedFundId !== undefined ? { designatedFundId: values.designatedFundId } : {}),
    ...(values.memberId !== undefined ? { memberId: values.memberId } : {}),
    ...(values.notes ? { notes: values.notes } : {})
  });

  const columns = useMemo(
    () => [
      {
        header: 'Data',
        cell: (row: ExpenseEntryResponse) => formatDate(row.referenceDate)
      },
      {
        header: 'Descrição',
        cell: (row: ExpenseEntryResponse) => row.description,
        className: 'max-w-48 truncate'
      },
      {
        header: 'Categoria',
        cell: (row: ExpenseEntryResponse) => row.categoryName
      },
      {
        header: 'Valor',
        cell: (row: ExpenseEntryResponse) => (
          <span className="font-mono">R$ {formatMoney(row.amount)}</span>
        )
      },
      {
        header: 'Parcela',
        cell: (row: ExpenseEntryResponse) =>
          row.totalInstallments > 1 ? `${row.installment}/${row.totalInstallments}` : '—'
      },
      {
        header: 'Forma de Pag.',
        cell: (row: ExpenseEntryResponse) => row.paymentMethodName
      },
      {
        header: 'Comprovante',
        cell: (row: ExpenseEntryResponse) => (
          <div className="flex justify-center">
            {row.receipt ? (
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={row.receipt}
                title="Ver comprovante"
                aria-label="Ver comprovante"
                className="text-muted-foreground hover:text-teal-600 inline-flex">
                <Receipt size={16} />
              </a>
            ) : (
              <span
                title="Sem comprovante"
                aria-label="Sem comprovante"
                className="text-red-600 inline-flex">
                <Receipt size={16} />
              </span>
            )}
          </div>
        )
      },
      {
        header: 'Status',
        cell: (row: ExpenseEntryResponse) => <StatusBadge status={row.status} />
      }
    ],
    []
  );

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

      <ResourceListPage<ExpenseEntryResponse>
        title="Lançamentos de Saídas"
        columns={columns}
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
              {editing === 'new' ? 'Novo lançamento de saída' : 'Editar lançamento de saída'}
            </DialogTitle>
          </DialogHeader>
          {editing !== null && (
            <ExpenseEntryForm
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
        description={`Tem certeza que deseja remover o lançamento "${deleting?.description ?? ''}"?`}
        onConfirm={() =>
          deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })
        }
        isPending={remove.isPending}
      />
    </>
  );
}
