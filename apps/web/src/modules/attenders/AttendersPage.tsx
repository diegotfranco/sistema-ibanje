import { useState, useRef, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Gift } from 'lucide-react';
import { ResourceListPage, type CustomAction } from '@/components/ResourceListPage';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { applyFieldErrors } from '@/lib/forms';
import { Module, Action, hasPermission } from '@/lib/permissions';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';
import { useAttenders, useAttenderMutations } from './useAttenders';
import AttenderForm from './AttenderForm';
import StatusBadge from '@/components/StatusBadge';
import AttenderDonationsDialog from '@/modules/donations/AttenderDonationsDialog';
import type { AttenderResponse, AttenderFormValues } from '@/schemas/attender';

type AttenderFormInstance = ReturnType<typeof useForm<AttenderFormValues>>;

function formatCityState(city: string | null, state: string | null): string {
  if (!city) return '—';
  return state ? `${city} / ${state}` : city;
}

export default function AttendersPage() {
  const { data: user } = useCurrentUser();
  const perms = user?.permissions;
  const canCreate = hasPermission(perms, Module.Attenders, Action.Create);
  const canEdit = hasPermission(perms, Module.Attenders, Action.Update);
  const canDelete = hasPermission(perms, Module.Attenders, Action.Delete);

  const list = useAttenders();
  const mutations = useAttenderMutations();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AttenderResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AttenderResponse | null>(null);
  const [donationsDialogOpen, setDonationsDialogOpen] = useState(false);
  const [donationsAttender, setDonationsAttender] = useState<AttenderResponse | null>(null);

  const formRef = useRef<AttenderFormInstance | null>(null);

  const items = list.data?.data;

  function handleSubmit(values: AttenderFormValues) {
    if (editing) {
      mutations.update.mutate(
        { id: editing.id, body: values },
        {
          onError: (err) => {
            if (formRef.current && !applyFieldErrors(err, formRef.current)) {
              toast.error(err instanceof Error ? err.message : 'Erro inesperado');
            }
          },
          onSuccess: () => {
            setDialogOpen(false);
            setEditing(null);
          }
        }
      );
    } else {
      mutations.create.mutate(values, {
        onError: (err) => {
          if (formRef.current && !applyFieldErrors(err, formRef.current)) {
            toast.error(err instanceof Error ? err.message : 'Erro inesperado');
          }
        },
        onSuccess: () => {
          setDialogOpen(false);
        }
      });
    }
  }

  function convertToFormValues(attender: AttenderResponse): AttenderFormValues {
    return {
      name: attender.name,
      userId: attender.userId,
      birthDate: attender.birthDate,
      phone: attender.phone,
      email: attender.email,
      addressStreet: attender.addressStreet,
      addressNumber: attender.addressNumber,
      addressComplement: attender.addressComplement,
      addressDistrict: attender.addressDistrict,
      state: attender.state,
      city: attender.city,
      postalCode: attender.postalCode,
      isMember: attender.isMember,
      memberSince: attender.memberSince,
      congregatingSinceYear: attender.congregatingSinceYear,
      admissionMode: attender.admissionMode as AttenderFormValues['admissionMode']
    };
  }

  const columns = useMemo(
    () => [
      {
        header: 'Nome',
        cell: (row: AttenderResponse) => row.name
      },
      {
        header: 'Membro',
        cell: (row: AttenderResponse) => (row.isMember ? 'Sim' : 'Não')
      },
      {
        header: 'Telefone',
        cell: (row: AttenderResponse) => row.phone ?? '—'
      },
      {
        header: 'E-mail',
        cell: (row: AttenderResponse) => row.email ?? '—'
      },
      {
        header: 'Cidade',
        cell: (row: AttenderResponse) => formatCityState(row.city, row.state)
      },
      {
        header: 'Status',
        cell: (row: AttenderResponse) => <StatusBadge status={row.status} />
      }
    ],
    []
  );

  const customActions: CustomAction<AttenderResponse>[] = useMemo(
    () => [
      {
        label: 'Contribuições',
        icon: <Gift className="h-4 w-4" />,
        onClick: (row) => {
          setDonationsAttender(row);
          setDonationsDialogOpen(true);
        }
      }
    ],
    []
  );

  return (
    <>
      <ResourceListPage<AttenderResponse>
        title="Congregados"
        columns={columns}
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
        customActions={customActions}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
        rowKey={(row) => row.id}
        emptyMessage="Nenhum congregado encontrado."
      />

      <AttenderForm
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultValues={editing ? convertToFormValues(editing) : undefined}
        onSubmit={handleSubmit}
        isPending={mutations.create.isPending || mutations.update.isPending}
        formRef={formRef}
      />

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => {
          if (!v) setDeleteTarget(null);
        }}
        description={`Remover "${deleteTarget?.name}"? Esta ação desativa o congregado.`}
        onConfirm={() => {
          if (deleteTarget)
            mutations.remove.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
        }}
        isPending={mutations.remove.isPending}
      />

      <AttenderDonationsDialog
        attenderId={donationsAttender?.id ?? null}
        attenderName={donationsAttender?.name ?? null}
        open={donationsDialogOpen}
        onOpenChange={setDonationsDialogOpen}
      />
    </>
  );
}
