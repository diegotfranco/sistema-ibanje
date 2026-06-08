import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Edit, ShieldCheck, Trash2, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageContainer } from '@/components/PageContainer';
import { ResourceListPage, type CustomAction } from '@/components/ResourceListPage';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { Pagination } from '@/components/Pagination';
import StatusBadge from '@/components/StatusBadge';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { applyFieldErrors } from '@/lib/forms';
import { getStatusLabel, USER_STATUS_FILTER_OPTIONS } from '@/lib/status';
import { Module, Action, hasPermission } from '@/lib/permissions';
import { ActiveStatus } from '@sistema-ibanje/shared';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';
import { useUsers, useUserMutations } from './useUsers';
import UserForm from './UserForm';
import UserPermissionsDialog from './UserPermissionsDialog';
import type { UserCreateFormValues, UserEditFormValues, UserResponse } from './schema';

type UserFormRefs = {
  createForm: ReturnType<typeof useForm<UserCreateFormValues>> | null;
  editForm: ReturnType<typeof useForm<UserEditFormValues>> | null;
};

export default function UsersPage() {
  const { data: user } = useCurrentUser();
  const perms = user?.permissions;
  const canCreate = hasPermission(perms, Module.Users, Action.Create);
  const canEdit = hasPermission(perms, Module.Users, Action.Update);
  const canDelete = hasPermission(perms, Module.Users, Action.Delete);

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<'ativo' | 'inativo' | 'pendente' | undefined>(undefined);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), 250);

  // Server-side search narrows the whole list, so a new query must restart paging.
  // Adjust during render (guarded) rather than in an effect — avoids a cascading render.
  const [prevSearch, setPrevSearch] = useState(debouncedSearch);
  if (prevSearch !== debouncedSearch) {
    setPrevSearch(debouncedSearch);
    setPage(1);
  }

  const list = useUsers({ page, status, q: debouncedSearch || undefined });
  const mutations = useUserMutations(user?.id);

  const totalPages = list.data?.totalPages ?? 1;

  const [editing, setEditing] = useState<UserResponse | null | 'new'>(null);
  const [deleting, setDeleting] = useState<UserResponse | null>(null);
  const [permissionsTarget, setPermissionsTarget] = useState<UserResponse | null>(null);

  const formRef = useRef<UserFormRefs | null>(null);

  function handleSubmit(values: UserCreateFormValues | UserEditFormValues) {
    if (editing === 'new') {
      mutations.create.mutate(values as UserCreateFormValues, {
        onError: (err) => {
          const form = formRef.current?.createForm;
          if (form && !applyFieldErrors(err, form)) {
            toast.error(err instanceof Error ? err.message : 'Erro inesperado');
          }
        },
        onSuccess: () => setEditing(null)
      });
    } else if (editing) {
      mutations.update.mutate(
        { id: editing.id, body: values as UserEditFormValues },
        {
          onError: (err) => {
            const form = formRef.current?.editForm;
            if (form && !applyFieldErrors(err, form)) {
              toast.error(err instanceof Error ? err.message : 'Erro inesperado');
            }
          },
          onSuccess: () => setEditing(null)
        }
      );
    }
  }

  // Per-row actions. All are modelled as customActions (rather than ResourceListPage's
  // onEdit/onDelete) so each can hide itself for the caller's own row and for the
  // pending-only "Aprovar" case — in both the table and the mobile detail sheet.
  const actions: CustomAction<UserResponse>[] = [];
  if (canEdit) {
    actions.push({
      label: 'Aprovar',
      icon: <UserCheck size={16} />,
      onClick: (r) => mutations.approve.mutate(r.id),
      hidden: (r) => mutations.isSelf(r.id) || r.status !== ActiveStatus.Pending
    });
    actions.push({
      label: 'Editar',
      icon: <Edit size={16} />,
      onClick: (r) => setEditing(r),
      hidden: (r) => mutations.isSelf(r.id)
    });
    actions.push({
      label: 'Permissões',
      icon: <ShieldCheck size={16} />,
      onClick: (r) => setPermissionsTarget(r),
      hidden: (r) => mutations.isSelf(r.id)
    });
  }
  if (canDelete) {
    actions.push({
      label: 'Remover',
      icon: <Trash2 size={16} />,
      onClick: (r) => setDeleting(r),
      hidden: (r) => mutations.isSelf(r.id)
    });
  }

  return (
    <>
      <PageContainer>
        <ResourceListPage<UserResponse>
          title="Usuários"
          columns={[
            { header: 'Nome', cell: (r) => r.name },
            { header: 'E-mail', cell: (r) => r.email, hideBelow: 'md' },
            { header: 'Cargo', cell: (r) => r.role, hideBelow: 'md' },
            {
              id: 'status',
              header: 'Status',
              cell: (r) => <StatusBadge status={r.status} />,
              filter: { options: USER_STATUS_FILTER_OPTIONS }
            }
          ]}
          data={list.data?.data}
          isLoading={list.isLoading}
          emptyMessage="Nenhum usuário encontrado."
          onCreate={canCreate ? () => setEditing('new') : undefined}
          canCreate={canCreate}
          customActions={actions.length > 0 ? actions : undefined}
          rowKey={(r) => r.id}
          searchable={{ placeholder: 'Buscar usuário…', loading: list.isFetching }}
          globalFilter={search}
          onGlobalFilterChange={setSearch}
          filters={{ status }}
          onFilterChange={(_, v) => {
            setStatus(v as 'ativo' | 'inativo' | 'pendente' | undefined);
            setPage(1);
          }}
          pagination={
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          }
          mobileRow={(r) => (
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-medium">{r.name}</span>
                <span className="truncate text-sm text-muted-foreground">{r.email}</span>
              </div>
              <StatusBadge status={r.status} />
            </div>
          )}
          mobileDetailTitle={(r) => r.name}
          mobileDetailFields={(r) => [
            { label: 'Nome', value: r.name },
            { label: 'E-mail', value: r.email },
            { label: 'Cargo', value: r.role },
            { label: 'Status', value: getStatusLabel(r.status) }
          ]}
        />
      </PageContainer>

      <Dialog open={editing !== null} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing === 'new' ? 'Novo Usuário' : 'Editar Usuário'}</DialogTitle>
          </DialogHeader>
          {editing !== null && (
            <UserForm
              initialValues={editing === 'new' ? undefined : editing}
              isPending={mutations.create.isPending || mutations.update.isPending}
              onSubmit={handleSubmit}
              onCancel={() => setEditing(null)}
              formRef={formRef}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(v) => !v && setDeleting(null)}
        description={`Remover o usuário "${deleting?.name}"?`}
        onConfirm={() =>
          deleting && mutations.remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })
        }
        isPending={mutations.remove.isPending}
      />

      <UserPermissionsDialog
        user={permissionsTarget}
        open={permissionsTarget !== null}
        onOpenChange={(v) => !v && setPermissionsTarget(null)}
      />
    </>
  );
}
