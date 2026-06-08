import { useState } from 'react';
import { RotateCcw, ShieldCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageContainer } from '@/components/PageContainer';
import { ResourceListPage, type CustomAction } from '@/components/ResourceListPage';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { TrashToggle } from '@/components/TrashToggle';
import StatusBadge from '@/components/StatusBadge';
import { getStatusLabel } from '@/lib/status';
import { Module, Action, hasPermission } from '@/lib/permissions';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';
import { useRoles, useRoleMutations } from './useRoles';
import RoleForm from './RoleForm';
import RolePermissionsDialog from './RolePermissionsDialog';
import type { RoleFormValues, RoleResponse } from './schema';

export default function RolesPage() {
  const { data: user } = useCurrentUser();
  const perms = user?.permissions;
  const canCreate = hasPermission(perms, Module.Roles, Action.Create);
  const canEdit = hasPermission(perms, Module.Roles, Action.Update);
  const canDelete = hasPermission(perms, Module.Roles, Action.Delete);

  const [viewingTrash, setViewingTrash] = useState(false);
  const list = useRoles({ deleted: viewingTrash ? 'only' : undefined });
  const mutations = useRoleMutations();

  const [editing, setEditing] = useState<RoleResponse | null | 'new'>(null);
  const [deleting, setDeleting] = useState<RoleResponse | null>(null);
  const [permissionsTarget, setPermissionsTarget] = useState<RoleResponse | null>(null);

  function handleSubmit(values: RoleFormValues) {
    if (editing === 'new') {
      mutations.create.mutate(values, { onSuccess: () => setEditing(null) });
    } else if (editing) {
      mutations.update.mutate(
        { id: editing.id, body: values },
        { onSuccess: () => setEditing(null) }
      );
    }
  }

  const permissionsAction: CustomAction<RoleResponse> = {
    label: 'Permissões',
    icon: <ShieldCheck size={16} />,
    onClick: (r) => setPermissionsTarget(r)
  };
  const restoreAction: CustomAction<RoleResponse> = {
    label: 'Restaurar',
    icon: <RotateCcw size={16} />,
    onClick: (r) => mutations.restore.mutate(r.id)
  };

  return (
    <>
      <PageContainer>
        <ResourceListPage<RoleResponse>
          title={viewingTrash ? 'Cargos — Lixeira' : 'Cargos'}
          columns={[
            { header: 'Nome', cell: (r) => r.name },
            { header: 'Descrição', cell: (r) => r.description ?? '—', hideBelow: 'md' },
            { header: 'Status', cell: (r) => <StatusBadge status={r.status} /> }
          ]}
          data={list.data?.data}
          isLoading={list.isLoading}
          emptyMessage={viewingTrash ? 'A lixeira está vazia.' : 'Nenhum cargo encontrado.'}
          toolbarRight={
            canDelete ? (
              <TrashToggle viewingTrash={viewingTrash} onToggle={setViewingTrash} />
            ) : undefined
          }
          onCreate={!viewingTrash && canCreate ? () => setEditing('new') : undefined}
          onEdit={!viewingTrash && canEdit ? (r) => setEditing(r) : undefined}
          onDelete={!viewingTrash && canDelete ? (r) => setDeleting(r) : undefined}
          customActions={
            viewingTrash
              ? canDelete
                ? [restoreAction]
                : undefined
              : canEdit
                ? [permissionsAction]
                : undefined
          }
          canCreate={!viewingTrash && canCreate}
          canEdit={!viewingTrash && canEdit}
          canDelete={!viewingTrash && canDelete}
          rowKey={(r) => r.id}
          mobileRow={(r) => (
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-medium">{r.name}</span>
                {r.description && (
                  <span className="truncate text-sm text-muted-foreground">{r.description}</span>
                )}
              </div>
              <StatusBadge status={r.status} />
            </div>
          )}
          mobileDetailTitle={(r) => r.name}
          mobileDetailFields={(r) => [
            { label: 'Nome', value: r.name },
            { label: 'Descrição', value: r.description ?? '—' },
            { label: 'Status', value: getStatusLabel(r.status) }
          ]}
        />
      </PageContainer>

      <Dialog open={editing !== null} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing === 'new' ? 'Novo Cargo' : 'Editar Cargo'}</DialogTitle>
          </DialogHeader>
          {editing !== null && (
            <RoleForm
              initialValues={editing === 'new' ? undefined : editing}
              isPending={mutations.create.isPending || mutations.update.isPending}
              onSubmit={handleSubmit}
              onCancel={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(v) => !v && setDeleting(null)}
        description={`Remover o cargo "${deleting?.name}"?`}
        onConfirm={() =>
          deleting && mutations.remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })
        }
        isPending={mutations.remove.isPending}
      />

      <RolePermissionsDialog
        role={permissionsTarget}
        open={permissionsTarget !== null}
        onOpenChange={(v) => !v && setPermissionsTarget(null)}
      />
    </>
  );
}
