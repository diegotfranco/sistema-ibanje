import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Eye, Trash2 } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/Button';
import { RowActionButton } from '@/components/RowActionButton';
import { Card, CardContent, CardHeaderRow, CardTitle } from '@/components/Card';
import { DataTable } from '@/components/DataTable';
import { PageContainer } from '@/components/PageContainer';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import StatusBadge from '@/components/StatusBadge';
import { YearPicker } from '@/components/YearPicker';
import { formatMoney } from '@/lib/format';
import { Module, Action, hasPermission } from '@/lib/permissions';
import { ClosingStatus } from '@sistema-ibanje/shared';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';
import {
  useMonthlyClosings,
  useMonthlyClosingYears,
  useRemoveMonthlyClosing
} from './useMonthlyClosings';
import { NewClosingDialog } from './NewClosingDialog';
import type { MonthlyClosingResponse } from './schema';

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
];

const formatPeriod = (year: number, month: number) => `${MONTHS[month - 1]} ${year}`;

export default function MonthlyClosingsPage() {
  const { data: user } = useCurrentUser();
  const perms = user?.permissions;
  const canCreate = hasPermission(perms, Module.MonthlyClosings, Action.Create);
  const canDelete = hasPermission(perms, Module.MonthlyClosings, Action.Delete);

  const [year, setYear] = useState<number | undefined>(() => new Date().getFullYear());
  const list = useMonthlyClosings({ year });
  const yearsQuery = useMonthlyClosingYears();
  const remove = useRemoveMonthlyClosing();
  const navigate = useNavigate();

  const [newOpen, setNewOpen] = useState(false);
  const [deleting, setDeleting] = useState<MonthlyClosingResponse | null>(null);

  const yearOptions = (yearsQuery.data?.years ?? []).slice().sort((a, b) => b - a);

  const items = list.data?.data ?? [];

  const columns: ColumnDef<MonthlyClosingResponse, unknown>[] = [
    {
      id: 'period',
      header: 'Período',
      cell: ({ row }) => (
        <span className="font-medium">
          {formatPeriod(row.original.periodYear, row.original.periodMonth)}
        </span>
      )
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />
    },
    {
      id: 'income',
      header: 'Entradas',
      cell: ({ row }) => (
        <span className="font-mono tabular-nums">{formatMoney(row.original.totalIncome)}</span>
      ),
      meta: { align: 'right' }
    },
    {
      id: 'expenses',
      header: 'Saídas',
      cell: ({ row }) => (
        <span className="font-mono tabular-nums">{formatMoney(row.original.totalExpenses)}</span>
      ),
      meta: { align: 'right' }
    },
    {
      id: 'balance',
      header: 'Saldo',
      cell: ({ row }) => (
        <span className="font-mono tabular-nums">{formatMoney(row.original.closingBalance)}</span>
      ),
      meta: { align: 'right' }
    },
    {
      id: '__actions',
      header: 'Ações',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <RowActionButton
            label="Ver detalhes"
            icon={<Eye size={16} />}
            onClick={() => navigate(`/monthly-closings/${row.original.id}`)}
          />
          {canDelete && row.original.status === ClosingStatus.Open && (
            <RowActionButton
              label="Excluir"
              icon={<Trash2 size={16} />}
              onClick={() => setDeleting(row.original)}
            />
          )}
        </div>
      ),
      meta: { align: 'center', className: 'w-36' }
    }
  ];

  return (
    <>
      <PageContainer>
        <Card>
          <CardHeaderRow>
            <CardTitle>Fechamentos Mensais</CardTitle>
            <div className="flex items-center gap-2">
              {canCreate && (
                <Button onClick={() => setNewOpen(true)} size="sm">
                  <Plus className="h-4 w-4" />
                  Novo
                </Button>
              )}
              {/* Mobile: the DataTable toolbar is hidden below md, so the year filter lives in the
                  header here and moves into the toolbar (toolbarRight) from md up. */}
              <YearPicker
                years={yearOptions}
                value={year}
                onChange={setYear}
                className="w-30 md:hidden"
              />
            </div>
          </CardHeaderRow>
          <CardContent className="p-0">
            <DataTable
              columns={columns}
              data={items}
              isLoading={list.isLoading}
              emptyMessage="Nenhum fechamento encontrado."
              getRowKey={(row) => row.id}
              toolbarRight={
                <YearPicker
                  years={yearOptions}
                  value={year}
                  onChange={setYear}
                  className="w-30 bg-transparent"
                />
              }
              mobileRow={(row) => (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">
                      {formatPeriod(row.periodYear, row.periodMonth)}
                    </span>
                    <StatusBadge status={row.status} />
                  </div>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex gap-3 font-mono">
                      <span className="text-money-in">{formatMoney(row.totalIncome)}</span>
                      <span className="text-money-out">{formatMoney(row.totalExpenses)}</span>
                    </div>
                    <span className="font-mono font-semibold">
                      {formatMoney(row.closingBalance)}
                    </span>
                  </div>
                </div>
              )}
              mobileOnRowClick={(row) => navigate(`/monthly-closings/${row.id}`)}
            />
          </CardContent>
        </Card>
      </PageContainer>

      <NewClosingDialog open={newOpen} onOpenChange={setNewOpen} />

      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(v) => !v && setDeleting(null)}
        description={`Tem certeza que deseja excluir o fechamento de ${deleting ? formatPeriod(deleting.periodYear, deleting.periodMonth) : ''}?`}
        onConfirm={() =>
          deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })
        }
        isPending={remove.isPending}
      />
    </>
  );
}
