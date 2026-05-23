import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageContainer } from '@/components/PageContainer';
import { ResourceListPage } from '@/components/ResourceListPage';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { Module, Action, hasPermission } from '@/lib/permissions';
import { ActiveStatus } from '@sistema-ibanje/shared';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';
import { useDesignatedFunds, useDesignatedFundMutations } from './useDesignatedFunds';
import { DesignatedFundForm } from './DesignatedFundForm';
import { formatDate, makeSubmitHandler } from '../entries-utils';
import type { DesignatedFundResponse } from './schema';

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
  const handleSubmit = makeSubmitHandler(editing, setEditing, create, update);

  const items = list.data?.data.filter((r) => r.status === ActiveStatus.Active);

  return (
    <>
      <PageContainer>
        <ResourceListPage<DesignatedFundResponse>
          title="Campanhas"
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
            },
            {
              header: 'Encerra em',
              cell: (row) => formatDate(row.targetDate)
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
          mobileRow={(row) => (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{row.name}</p>
                {row.description && (
                  <p className="text-xs text-muted-foreground truncate">{row.description}</p>
                )}
                {row.targetDate && (
                  <p className="text-xs text-muted-foreground">
                    Encerra em {formatDate(row.targetDate)}
                  </p>
                )}
              </div>
              {row.targetAmount && (
                <span className="shrink-0 font-mono text-sm text-money-in">
                  R$ {row.targetAmount}
                </span>
              )}
            </div>
          )}
          mobileDetailTitle={(row) => row.name}
          mobileDetailFields={(row) => [
            { label: 'Nome', value: row.name },
            { label: 'Descrição', value: row.description || '—', hideEmpty: false },
            {
              label: 'Meta',
              value: row.targetAmount ? `R$ ${row.targetAmount}` : '—'
            },
            { label: 'Encerra em', value: formatDate(row.targetDate) }
          ]}
        />
      </PageContainer>

      <Dialog open={editing !== null} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing === 'new' ? 'Novo fundo' : 'Editar fundo'}</DialogTitle>
          </DialogHeader>
          {editing !== null && (
            <DesignatedFundForm
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
