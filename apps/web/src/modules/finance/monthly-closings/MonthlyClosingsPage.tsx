import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Eye, Trash2 } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/Button';
import { Card, CardContent, CardHeaderRow, CardTitle } from '@/components/Card';
import { DataTable } from '@/components/DataTable';
import { PageContainer } from '@/components/PageContainer';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import StatusBadge from '@/components/StatusBadge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
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

const formatMoney = (s: string) =>
  `R$ ${Number.parseFloat(s).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function MonthlyClosingsPage() {
  const { data: user } = useCurrentUser();
  const perms = user?.permissions;
  const canCreate = hasPermission(perms, Module.MonthlyClosings, Action.Create);
  const canDelete = hasPermission(perms, Module.MonthlyClosings, Action.Delete);

  const [year, setYear] = useState<number>(() => new Date().getFullYear());
  const list = useMonthlyClosings({ year });
  const yearsQuery = useMonthlyClosingYears();
  const remove = useRemoveMonthlyClosing();
  const navigate = useNavigate();

  const [newOpen, setNewOpen] = useState(false);
  const [deleting, setDeleting] = useState<MonthlyClosingResponse | null>(null);

  const yearOptions = (() => {
    const fromServer = yearsQuery.data?.years ?? [];
    const set = new Set(fromServer);
    set.add(year);
    return Array.from(set).sort((a, b) => b - a);
  })();

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
        <span className="font-mono tabular-nums">R$ {formatMoney(row.original.totalIncome)}</span>
      ),
      meta: { align: 'right' }
    },
    {
      id: 'expenses',
      header: 'Saídas',
      cell: ({ row }) => (
        <span className="font-mono tabular-nums">R$ {formatMoney(row.original.totalExpenses)}</span>
      ),
      meta: { align: 'right' }
    },
    {
      id: 'balance',
      header: 'Saldo',
      cell: ({ row }) => (
        <span className="font-mono tabular-nums">
          R$ {formatMoney(row.original.closingBalance)}
        </span>
      ),
      meta: { align: 'right' }
    },
    {
      id: '__actions',
      header: 'Ações',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate(`/monthly-closings/${row.original.id}`)}
            aria-label="Abrir"
            title="Abrir">
            <Eye size={16} />
          </Button>
          {canDelete && row.original.status === ClosingStatus.Open && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDeleting(row.original)}
              aria-label="Excluir"
              title="Excluir">
              <Trash2 size={16} />
            </Button>
          )}
        </div>
      ),
      meta: { align: 'right', className: 'w-40' }
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
              <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                <SelectTrigger className="w-32" aria-label="Ano">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" align="end">
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeaderRow>
          <CardContent className="p-0">
            <DataTable
              columns={columns}
              data={items}
              isLoading={list.isLoading}
              emptyMessage="Nenhum fechamento encontrado."
              getRowKey={(row) => row.id}
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
