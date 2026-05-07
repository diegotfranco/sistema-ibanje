import { useState } from 'react';
import { ResourceListPage } from '@/components/ResourceListPage';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { Module, Action, hasPermission } from '@/lib/permissions';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';
import { useMembers, useMemberMutations } from './useMembers';
import MemberForm from './MemberForm';
import StatusBadge from '@/components/StatusBadge';
import type { MemberResponse, MemberFormValues } from '@/schemas/member';

export default function MembersPage() {
  const { data: user } = useCurrentUser();
  const perms = user?.permissions;
  const canCreate = hasPermission(perms, Module.Members, Action.Create);
  const canEdit = hasPermission(perms, Module.Members, Action.Update);
  const canDelete = hasPermission(perms, Module.Members, Action.Delete);

  const list = useMembers();
  const mutations = useMemberMutations();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MemberResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MemberResponse | null>(null);

  const items = list.data?.data;

  function handleSubmit(values: MemberFormValues) {
    if (editing) {
      mutations.update.mutate(
        { id: editing.id, body: values },
        {
          onSuccess: () => {
            setDialogOpen(false);
            setEditing(null);
          }
        }
      );
    } else {
      mutations.create.mutate(values, {
        onSuccess: () => {
          setDialogOpen(false);
        }
      });
    }
  }

  function convertToFormValues(member: MemberResponse): MemberFormValues {
    return {
      name: member.name,
      userId: member.userId,
      birthDate: member.birthDate,
      phone: member.phone,
      email: member.email,
      addressStreet: member.addressStreet,
      addressNumber: member.addressNumber,
      addressComplement: member.addressComplement,
      addressDistrict: member.addressDistrict,
      state: member.state,
      city: member.city,
      postalCode: member.postalCode
    };
  }

  return (
    <>
      <ResourceListPage<MemberResponse>
        title="Membros"
        columns={[
          {
            header: 'Nome',
            cell: (row) => row.name
          },
          {
            header: 'Telefone',
            cell: (row) => row.phone ?? '—'
          },
          {
            header: 'E-mail',
            cell: (row) => row.email ?? '—'
          },
          {
            header: 'Cidade',
            cell: (row) => (row.city ? `${row.city}${row.state ? ` / ${row.state}` : ''}` : '—')
          },
          {
            header: 'Status',
            cell: (row) => <StatusBadge status={row.status} />
          }
        ]}
        data={items}
        isLoading={list.isLoading}
        onCreate={
          canCreate
            ? () => {
                setEditing(null);
                setDialogOpen(true);
              }
            : undefined
        }
        onEdit={
          canEdit
            ? (r) => {
                setEditing(r);
                setDialogOpen(true);
              }
            : undefined
        }
        onDelete={canDelete ? (r) => setDeleteTarget(r) : undefined}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
        rowKey={(row) => row.id}
        emptyMessage="Nenhum membro encontrado."
      />

      <MemberForm
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultValues={editing ? convertToFormValues(editing) : undefined}
        onSubmit={handleSubmit}
        isPending={mutations.create.isPending || mutations.update.isPending}
      />

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => {
          if (!v) setDeleteTarget(null);
        }}
        description={`Remover "${deleteTarget?.name}"? Esta ação desativa o membro.`}
        onConfirm={() => {
          if (deleteTarget)
            mutations.remove.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
        }}
        isPending={mutations.remove.isPending}
      />
    </>
  );
}
