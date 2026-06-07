import { useState } from 'react';
import { Archive, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageContainer } from '@/components/PageContainer';
import { ResourceListPage, type CustomAction } from '@/components/ResourceListPage';
import { Pagination } from '@/components/Pagination';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import StatusBadge from '@/components/StatusBadge';
import { Module, Action, hasPermission } from '@/lib/permissions';
import { FundStatus, type FundStatusValue } from '@sistema-ibanje/shared';
import { FUND_STATUS_FILTER_OPTIONS, FUND_STATUS_LABELS } from '@/lib/status';
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

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<FundStatusValue | undefined>(undefined);

  const list = useDesignatedFunds({ page, status });
  const { create, update, remove, encerrar, reabrir } = useDesignatedFundMutations();

  const [editing, setEditing] = useState<DesignatedFundResponse | null | 'new'>(null);
  const [deleting, setDeleting] = useState<DesignatedFundResponse | null>(null);
  const handleSubmit = makeSubmitHandler(editing, setEditing, create, update);

  // Campaign lifecycle — distinct from delete. Encerrar closes a running campaign; Reabrir
  // reopens a closed one. Gated by Update; each is shown only in the relevant state.
  const lifecycleActions: CustomAction<DesignatedFundResponse>[] = canEdit
    ? [
        {
          label: 'Encerrar',
          icon: <Archive size={16} />,
          hidden: (row) => row.status !== FundStatus.Active,
          onClick: (row) => encerrar.mutate(row.id)
        },
        {
          label: 'Reabrir',
          icon: <RotateCcw size={16} />,
          hidden: (row) => row.status !== FundStatus.Ended,
          onClick: (row) => reabrir.mutate(row.id)
        }
      ]
    : [];

  const items = list.data?.data;
  const totalPages = list.data?.totalPages ?? 1;

  const paginationUI = (
    <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
  );

  return (
    <>
      <PageContainer>
        <ResourceListPage<DesignatedFundResponse>
          title="Campanhas"
          columns={[
            {
              header: 'Nome',
              cell: (row) => row.name,
              className: 'w-full'
            },
            {
              header: 'Descrição',
              cell: (row) => row.description || '—',
              hideBelow: 'xl'
            },
            {
              id: 'status',
              header: 'Status',
              cell: (row) => <StatusBadge status={row.status} />,
              filter: { options: FUND_STATUS_FILTER_OPTIONS }
            },
            {
              header: 'Meta',
              cell: (row) => (row.targetAmount ? `R$ ${row.targetAmount}` : '—'),
              hideBelow: 'md'
            },
            {
              header: 'Encerra em',
              cell: (row) => formatDate(row.targetDate),
              hideBelow: 'lg'
            }
          ]}
          data={items}
          isLoading={list.isLoading}
          onCreate={canCreate ? () => setEditing('new') : undefined}
          onEdit={canEdit ? (r) => setEditing(r) : undefined}
          onDelete={canDelete ? (r) => setDeleting(r) : undefined}
          customActions={lifecycleActions}
          canCreate={canCreate}
          canEdit={canEdit}
          canDelete={canDelete}
          rowKey={(r) => r.id}
          mobileRow={(row) => (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium truncate">{row.name}</p>
                  <StatusBadge status={row.status} className="shrink-0" />
                </div>
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
            {
              label: 'Status',
              value: FUND_STATUS_LABELS[row.status as FundStatusValue] ?? row.status ?? '—',
              hideEmpty: false
            },
            {
              label: 'Descrição',
              value: row.description || '—',
              hideEmpty: false
            },
            {
              label: 'Meta',
              value: row.targetAmount ? `R$ ${row.targetAmount}` : '—'
            },
            { label: 'Encerra em', value: formatDate(row.targetDate) }
          ]}
          columnToggle={true}
          tableId="designated-funds"
          filters={{ status }}
          onFilterChange={(_, v) => {
            setStatus(v as FundStatusValue | undefined);
            setPage(1);
          }}
          pagination={paginationUI}
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
