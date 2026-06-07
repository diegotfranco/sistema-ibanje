import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageContainer } from '@/components/PageContainer';
import { ResourceListPage } from '@/components/ResourceListPage';
import { Pagination } from '@/components/Pagination';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import StatusBadge from '@/components/StatusBadge';
import { Module, Action, hasPermission } from '@/lib/permissions';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';
import { useEvents, useEventMutations } from './useEvents';
import { EventForm } from './EventForm';
import { makeSubmitHandler } from '../entries-utils';
import { AVAILABILITY_STATUS_FILTER_OPTIONS, getStatusLabel } from '@/lib/status';
import type { EventResponse } from './schema';

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export default function EventsPage() {
  const { data: user } = useCurrentUser();
  const perms = user?.permissions;
  const canCreate = hasPermission(perms, Module.Events, Action.Create);
  const canEdit = hasPermission(perms, Module.Events, Action.Update);
  const canDelete = hasPermission(perms, Module.Events, Action.Delete);

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<'ativo' | 'inativo' | undefined>(undefined);

  const list = useEvents({ page, status });
  const { create, update, remove } = useEventMutations();

  const [editing, setEditing] = useState<EventResponse | null | 'new'>(null);
  const [deleting, setDeleting] = useState<EventResponse | null>(null);
  const handleSubmit = makeSubmitHandler(editing, setEditing, create, update);

  const items = list.data?.data;
  const totalPages = list.data?.totalPages ?? 1;

  const paginationUI = (
    <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
  );

  return (
    <>
      <PageContainer>
        <ResourceListPage<EventResponse>
          title="Eventos"
          columns={[
            { header: 'Título', cell: (row) => row.title, className: 'w-full' },
            {
              header: 'Início',
              cell: (row) => formatDateTime(row.startTime),
              hideBelow: 'md'
            },
            { header: 'Local', cell: (row) => row.location || '—', hideBelow: 'lg' },
            {
              id: 'status',
              header: 'Status',
              cell: (row) => <StatusBadge status={row.status} />,
              filter: {
                options: AVAILABILITY_STATUS_FILTER_OPTIONS
              }
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
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium truncate">{row.title}</p>
                  <StatusBadge status={row.status} className="shrink-0" />
                </div>
                <p className="text-xs text-muted-foreground">{formatDateTime(row.startTime)}</p>
                {row.location && (
                  <p className="text-xs text-muted-foreground truncate">{row.location}</p>
                )}
              </div>
            </div>
          )}
          mobileDetailTitle={(row) => row.title}
          mobileDetailFields={(row) => [
            { label: 'Título', value: row.title },
            { label: 'Início', value: formatDateTime(row.startTime) },
            { label: 'Término', value: formatDateTime(row.endTime) },
            { label: 'Local', value: row.location || '—' },
            { label: 'Descrição', value: row.description || '—' },
            { label: 'Status', value: row.status ? getStatusLabel(row.status) : '—' }
          ]}
          columnToggle={true}
          tableId="events"
          filters={{ status }}
          onFilterChange={(_, v) => {
            setStatus(v as 'ativo' | 'inativo' | undefined);
            setPage(1);
          }}
          pagination={paginationUI}
        />
      </PageContainer>

      <Dialog open={editing !== null} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing === 'new' ? 'Novo evento' : 'Editar evento'}</DialogTitle>
          </DialogHeader>
          {editing !== null && (
            <EventForm
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
        description={`Tem certeza que deseja remover "${deleting?.title}"?`}
        onConfirm={() =>
          deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })
        }
        isPending={remove.isPending}
      />
    </>
  );
}
