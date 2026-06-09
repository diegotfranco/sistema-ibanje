import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/Dialog';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { PageContainer } from '@/components/PageContainer';
import { Module, Action, hasPermission } from '@/lib/permissions';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';
import {
  useExpenseEntries,
  useExpenseEntryMutations,
  useUploadReceipt,
  useDeleteReceipt
} from './useExpenseEntries';
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
  const uploadReceipt = useUploadReceipt();
  const deleteReceipt = useDeleteReceipt();

  const [editing, setEditing] = useState<ExpenseEntryResponse | null>(null);
  const [deleting, setDeleting] = useState<ExpenseEntryResponse | null>(null);

  const allEntries = list.data?.data ?? [];

  const toCreateBody = (values: ExpenseEntryFormValues) => {
    const amountNum = Number.parseFloat(values.amount);
    return {
      date: values.date,
      amount: amountNum,
      total: values.isInstallment ? Number.parseFloat(values.total!) : amountNum,
      installment: values.isInstallment ? values.installment! : 1,
      totalInstallments: values.isInstallment ? values.totalInstallments! : 1,
      categoryId: values.categoryId!,
      paymentMethodId: values.paymentMethodId!,
      ...(values.campaignId !== undefined ? { campaignId: values.campaignId } : {}),
      ...(values.attenderId !== undefined ? { attenderId: values.attenderId } : {}),
      ...(values.notes ? { notes: values.notes } : {})
    };
  };

  return (
    <PageContainer>
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
        <DialogContent className="sm:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar lançamento de saída</DialogTitle>
          </DialogHeader>
          {editing !== null && (
            <ExpenseEntryForm
              initialValues={editing}
              isPending={update.isPending || uploadReceipt.isPending || deleteReceipt.isPending}
              onSubmit={(values, receipt) => {
                const body = toCreateBody(values);
                const updateBody = {
                  ...body,
                  ...(values.status ? { status: values.status } : {})
                };
                update.mutate(
                  { id: editing.id, body: updateBody },
                  {
                    onSuccess: async () => {
                      try {
                        if (receipt.stagedRemoval) {
                          await deleteReceipt.mutateAsync(editing.id);
                        } else if (receipt.stagedFile) {
                          await uploadReceipt.mutateAsync({
                            id: editing.id,
                            file: receipt.stagedFile
                          });
                        }
                        setEditing(null);
                      } catch {
                        // mutation hooks already toasted; keep dialog open
                      }
                    }
                  }
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
        description={`Tem certeza que deseja remover o lançamento "${deleting?.categoryName ?? ''}"?`}
        onConfirm={() =>
          deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })
        }
        isPending={remove.isPending}
      />
    </PageContainer>
  );
}
