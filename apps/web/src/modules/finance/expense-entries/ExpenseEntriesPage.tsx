import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { Module, Action, hasPermission } from '@/lib/permissions';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';
import { useExpenseEntries, useExpenseEntryMutations } from './useExpenseEntries';
import { ExpenseEntryForm } from './ExpenseEntryForm';
import { ExpenseSummaryCard } from './ExpenseSummaryCard';
import { ExpenseQuickEntryForm } from './ExpenseQuickEntryForm';
import { ExpenseEntriesTable } from './ExpenseEntriesTable';
import type { ExpenseEntryResponse, ExpenseEntryFormValues } from './schema';

export default function ExpenseEntriesPage() {
  const { data: user } = useCurrentUser();
  const perms = user?.permissions;
  const canCreate = hasPermission(perms, Module.ExpenseEntries, Action.Create);
  const canEdit = hasPermission(perms, Module.ExpenseEntries, Action.Update);
  const canDelete = hasPermission(perms, Module.ExpenseEntries, Action.Delete);

  const list = useExpenseEntries();
  const { update, remove } = useExpenseEntryMutations();

  const [editing, setEditing] = useState<ExpenseEntryResponse | null>(null);
  const [deleting, setDeleting] = useState<ExpenseEntryResponse | null>(null);

  const allEntries = list.data?.data ?? [];

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
    ...(values.attenderId !== undefined ? { attenderId: values.attenderId } : {}),
    ...(values.notes ? { notes: values.notes } : {})
  });

  return (
    <div className="space-y-6 p-8">
      <ExpenseSummaryCard />

      {canCreate && <ExpenseQuickEntryForm />}

      <ExpenseEntriesTable
        data={allEntries}
        isLoading={list.isLoading}
        onEdit={(e) => setEditing(e)}
        onDelete={(e) => setDeleting(e)}
        canEdit={canEdit}
        canDelete={canDelete}
      />

      <Dialog open={editing !== null} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar lançamento de saída</DialogTitle>
          </DialogHeader>
          {editing !== null && (
            <ExpenseEntryForm
              initialValues={editing}
              isPending={update.isPending}
              onSubmit={(values) => {
                const body = toCreateBody(values);
                const updateBody = {
                  ...body,
                  ...(values.status ? { status: values.status } : {})
                };
                update.mutate(
                  { id: editing.id, body: updateBody },
                  { onSuccess: () => setEditing(null) }
                );
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
    </div>
  );
}
