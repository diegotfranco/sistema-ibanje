import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { PageContainer } from '@/components/PageContainer';
import { Module, Action, hasPermission } from '@/lib/permissions';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';
import { useIncomeEntries, useIncomeEntryMutations } from './useIncomeEntries';
import { IncomeEntryForm } from './IncomeEntryForm';
import { IncomeSummaryCard } from './IncomeSummaryCard';
import { IncomeQuickEntryForm } from './IncomeQuickEntryForm';
import { IncomeEntriesTable } from './IncomeEntriesTable';
import { formatMoney } from '../entries-utils';
import type { IncomeEntryResponse, IncomeEntryFormValues } from './schema';

export default function IncomeEntriesPage() {
  const { data: user } = useCurrentUser();
  const perms = user?.permissions;
  const canCreate = hasPermission(perms, Module.IncomeEntries, Action.Create);
  const canEdit = hasPermission(perms, Module.IncomeEntries, Action.Update);
  const canDelete = hasPermission(perms, Module.IncomeEntries, Action.Delete);

  const list = useIncomeEntries();
  const { update, remove } = useIncomeEntryMutations();

  const [editing, setEditing] = useState<IncomeEntryResponse | null>(null);
  const [deleting, setDeleting] = useState<IncomeEntryResponse | null>(null);

  const allEntries = list.data?.data ?? [];

  const toUpdateBody = (values: IncomeEntryFormValues) => ({
    depositDate: values.depositDate,
    amount: Number.parseFloat(values.amount),
    categoryId: values.categoryId!,
    paymentMethodId: values.paymentMethodId!,
    ...(values.attenderId !== undefined ? { attenderId: values.attenderId } : {}),
    ...(values.campaignId !== undefined ? { campaignId: values.campaignId } : {}),
    ...(values.notes ? { notes: values.notes } : {}),
    ...(values.status ? { status: values.status } : {})
  });

  return (
    <PageContainer>
      <IncomeSummaryCard />

      {canCreate && <IncomeQuickEntryForm />}

      <IncomeEntriesTable
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
            <DialogTitle>Editar lançamento de entrada</DialogTitle>
          </DialogHeader>
          {editing !== null && (
            <IncomeEntryForm
              initialValues={editing}
              isPending={update.isPending}
              onSubmit={(values) => {
                update.mutate(
                  { id: editing.id, body: toUpdateBody(values) },
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
        description={`Tem certeza que deseja remover este lançamento de R$ ${deleting ? formatMoney(deleting.amount) : ''}?`}
        onConfirm={() =>
          deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })
        }
        isPending={remove.isPending}
      />
    </PageContainer>
  );
}
