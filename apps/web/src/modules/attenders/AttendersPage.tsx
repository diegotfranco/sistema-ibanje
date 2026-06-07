import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Eye, FileDown, UserCog } from 'lucide-react';
import { PageContainer } from '@/components/PageContainer';
import { ResourceListPage, type CustomAction } from '@/components/ResourceListPage';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { Button } from '@/components/Button';
import { Pagination } from '@/components/Pagination';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { applyFieldErrors } from '@/lib/forms';
import { openBlobInNewTab } from '@/lib/download';
import { formatDate, formatMonthYear } from '@/lib/datetime';
import { Module, Action, hasPermission } from '@/lib/permissions';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';
import { useAttenders, useAttenderMutations, useChangeAttenderStatus } from './useAttenders';
import AttenderForm from './AttenderForm';
import AttenderStatusDialog from './AttenderStatusDialog';
import StatusBadge from '@/components/StatusBadge';
import { ATTENDER_STATUS_FILTER_OPTIONS } from '@/lib/status';
import type { AttenderStatusValue } from '@sistema-ibanje/shared';
import type { RowDetailField } from '@/components/RowDetailPanel';
import type { AttenderResponse, AttenderFormValues, AttenderStatusChangeValues } from './schema';

type StatusFormInstance = ReturnType<typeof useForm<AttenderStatusChangeValues>>;

type AttenderFormInstance = ReturnType<typeof useForm<AttenderFormValues>>;

// Column ids double as the backend export keys (see ROSTER_COLUMNS in the API pdf-service).
const EXPORTABLE_COLUMNS = new Set([
  'name',
  'isMember',
  'phone',
  'email',
  'city',
  'status',
  'memberSince',
  'admissionMode',
  'congregatingSince',
  'birthDate',
  'addressDistrict',
  'postalCode'
]);

function formatCityState(city: string | null, state: string | null): string {
  if (!city) return '—';
  return state ? `${city} / ${state}` : city;
}

export default function AttendersPage() {
  const navigate = useNavigate();
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const perms = user?.permissions;
  const canCreate = hasPermission(perms, Module.Attenders, Action.Create);
  const canEdit = hasPermission(perms, Module.Attenders, Action.Update);
  const canDelete = hasPermission(perms, Module.Attenders, Action.Delete);
  // Staff (Relatórios on Congregados) see the full roster; everyone else is a self-service
  // congregant and is sent to their own record. Mirrors the server's list/getById gate.
  const canViewAll = hasPermission(perms, Module.Attenders, Action.Report);

  useEffect(() => {
    if (!userLoading && user && !canViewAll && user.attenderId) {
      navigate(`/attenders/${user.attenderId}`, { replace: true });
    }
  }, [userLoading, user, canViewAll, navigate]);

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string | undefined>>({});
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), 250);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'name',
    'isMember',
    'phone',
    'email',
    'city',
    'status'
  ]);
  const [exporting, setExporting] = useState(false);

  const isMember = filters.isMember as 'true' | 'false' | undefined;
  const status = filters.status as AttenderStatusValue | undefined;

  // Server-side search narrows the whole roster, so a new query must restart paging.
  // Adjust during render (guarded) rather than in an effect — avoids a cascading render.
  const [prevSearch, setPrevSearch] = useState(debouncedSearch);
  if (prevSearch !== debouncedSearch) {
    setPrevSearch(debouncedSearch);
    setPage(1);
  }

  const list = useAttenders({ page, isMember, status, q: debouncedSearch || undefined });
  const mutations = useAttenderMutations();
  const changeStatus = useChangeAttenderStatus();

  const handleFilterChange = useCallback((columnId: string, value: string | undefined) => {
    setFilters((prev) => ({ ...prev, [columnId]: value }));
    setPage(1);
  }, []);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AttenderResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AttenderResponse | null>(null);
  const [statusTarget, setStatusTarget] = useState<AttenderResponse | null>(null);

  const formRef = useRef<AttenderFormInstance | null>(null);
  const statusFormRef = useRef<StatusFormInstance | null>(null);

  const items = list.data?.data;
  const totalPages = list.data?.totalPages ?? 1;

  const handleColumnVisibility = useCallback((ids: string[]) => {
    setVisibleColumns(ids.filter((id) => EXPORTABLE_COLUMNS.has(id)));
  }, []);

  async function handleExport() {
    const qs = new URLSearchParams();
    if (visibleColumns.length) qs.set('columns', visibleColumns.join(','));
    if (isMember) qs.set('isMember', isMember);
    if (status) qs.set('status', status);
    if (debouncedSearch) qs.set('q', debouncedSearch);
    setExporting(true);
    try {
      await openBlobInNewTab(`/attenders/export/pdf?${qs.toString()}`);
    } catch {
      toast.error('Erro ao exportar PDF.');
    } finally {
      setExporting(false);
    }
  }

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
      baptismDate: attender.baptismDate,
      memberSince: attender.memberSince,
      congregatingSince: attender.congregatingSince,
      admissionMode: attender.admissionMode as AttenderFormValues['admissionMode']
    };
  }

  const columns = useMemo(
    () => [
      { id: 'name', header: 'Nome', label: 'Nome', cell: (row: AttenderResponse) => row.name },
      {
        id: 'isMember',
        header: 'Membro',
        label: 'Membro',
        cell: (row: AttenderResponse) => (row.isMember ? 'Sim' : 'Não'),
        hideBelow: 'md' as const,
        filter: {
          options: [
            { value: 'true', label: 'Membros' },
            { value: 'false', label: 'Congregados' }
          ]
        }
      },
      {
        id: 'phone',
        header: 'Telefone',
        label: 'Telefone',
        cell: (row: AttenderResponse) => row.phone ?? '—',
        hideBelow: 'lg' as const
      },
      {
        id: 'email',
        header: 'E-mail',
        label: 'E-mail',
        cell: (row: AttenderResponse) => row.email ?? '—',
        hideBelow: 'lg' as const
      },
      {
        id: 'city',
        header: 'Cidade',
        label: 'Cidade',
        cell: (row: AttenderResponse) => formatCityState(row.city, row.state),
        hideBelow: 'md' as const
      },
      {
        id: 'status',
        header: 'Status',
        label: 'Status',
        cell: (row: AttenderResponse) => <StatusBadge status={row.status} />,
        filter: { options: ATTENDER_STATUS_FILTER_OPTIONS }
      },
      {
        id: 'memberSince',
        header: 'Membro desde',
        label: 'Membro desde',
        defaultHidden: true,
        cell: (row: AttenderResponse) => (row.memberSince ? formatMonthYear(row.memberSince) : '—')
      },
      {
        id: 'admissionMode',
        header: 'Modo de admissão',
        label: 'Modo de admissão',
        defaultHidden: true,
        cell: (row: AttenderResponse) => row.admissionMode ?? '—'
      },
      {
        id: 'congregatingSince',
        header: 'Congregando desde',
        label: 'Congregando desde',
        defaultHidden: true,
        cell: (row: AttenderResponse) =>
          row.congregatingSince != null ? formatMonthYear(row.congregatingSince) : '—'
      },
      {
        id: 'birthDate',
        header: 'Nascimento',
        label: 'Nascimento',
        defaultHidden: true,
        cell: (row: AttenderResponse) => (row.birthDate ? formatDate(row.birthDate) : '—')
      },
      {
        id: 'addressDistrict',
        header: 'Bairro',
        label: 'Bairro',
        defaultHidden: true,
        cell: (row: AttenderResponse) => row.addressDistrict ?? '—'
      },
      {
        id: 'postalCode',
        header: 'CEP',
        label: 'CEP',
        defaultHidden: true,
        cell: (row: AttenderResponse) => row.postalCode ?? '—'
      }
    ],
    []
  );

  const mobileRow = useMemo(
    () => (row: AttenderResponse) => {
      const meta = [
        row.isMember ? 'Membro' : 'Congregado',
        row.phone,
        formatCityState(row.city, row.state) === '—' ? null : formatCityState(row.city, row.state)
      ].filter(Boolean);
      return (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium truncate">{row.name}</span>
            <StatusBadge status={row.status} />
          </div>
          {meta.length > 0 && (
            <span className="text-xs text-muted-foreground truncate">{meta.join(' · ')}</span>
          )}
        </div>
      );
    },
    []
  );

  const mobileDetailFields = useMemo(
    () =>
      (row: AttenderResponse): RowDetailField[] => [
        { label: 'Membro', value: row.isMember ? 'Sim' : 'Não' },
        { label: 'Telefone', value: row.phone ?? '—', hideEmpty: true },
        { label: 'E-mail', value: row.email ?? '—', hideEmpty: true },
        { label: 'Cidade', value: formatCityState(row.city, row.state), hideEmpty: true },
        { label: 'Status', value: <StatusBadge status={row.status} /> }
      ],
    []
  );

  const customActions: CustomAction<AttenderResponse>[] = useMemo(() => {
    const actions: CustomAction<AttenderResponse>[] = [
      {
        label: 'Detalhes',
        icon: <Eye className="h-4 w-4" />,
        onClick: (row) => navigate(`/attenders/${row.id}`)
      }
    ];
    if (canEdit) {
      actions.push({
        label: 'Alterar situação',
        icon: <UserCog className="h-4 w-4" />,
        onClick: (row) => setStatusTarget(row)
      });
    }
    return actions;
  }, [navigate, canEdit]);

  function handleStatusSubmit(values: AttenderStatusChangeValues) {
    if (!statusTarget) return;
    changeStatus.mutate(
      { id: statusTarget.id, body: values },
      {
        onError: (err) => {
          if (statusFormRef.current && !applyFieldErrors(err, statusFormRef.current)) {
            toast.error(err instanceof Error ? err.message : 'Erro inesperado');
          }
        },
        onSuccess: () => setStatusTarget(null)
      }
    );
  }

  const toolbarRight = (
    <Button
      variant="outline"
      className="bg-transparent"
      onClick={handleExport}
      disabled={exporting}>
      <FileDown className="h-4 w-4 mr-1" />
      {exporting ? 'Exportando...' : 'Exportar PDF'}
    </Button>
  );

  if (!userLoading && user && !canViewAll && !user.attenderId) {
    return (
      <PageContainer>
        <p className="text-sm text-muted-foreground">
          Você não está vinculado a nenhum cadastro de Congregado. Procure a secretaria.
        </p>
      </PageContainer>
    );
  }

  return (
    <>
      <PageContainer>
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
          mobileRow={mobileRow}
          mobileDetailFields={mobileDetailFields}
          mobileDetailTitle={(row) => row.name}
          emptyMessage="Nenhum congregado encontrado."
          columnToggle
          tableId="attenders"
          toolbarRight={toolbarRight}
          onColumnVisibilityChange={handleColumnVisibility}
          searchable={{ placeholder: 'Buscar congregado...', loading: list.isFetching }}
          globalFilter={search}
          onGlobalFilterChange={setSearch}
          filters={filters}
          onFilterChange={handleFilterChange}
          pagination={
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          }
        />
      </PageContainer>

      <AttenderForm
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultValues={editing ? convertToFormValues(editing) : undefined}
        onSubmit={handleSubmit}
        isPending={mutations.create.isPending || mutations.update.isPending}
        formRef={formRef}
      />

      <AttenderStatusDialog
        open={!!statusTarget}
        onOpenChange={(v) => {
          if (!v) setStatusTarget(null);
        }}
        attender={statusTarget}
        onSubmit={handleStatusSubmit}
        isPending={changeStatus.isPending}
        formRef={statusFormRef}
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
    </>
  );
}
