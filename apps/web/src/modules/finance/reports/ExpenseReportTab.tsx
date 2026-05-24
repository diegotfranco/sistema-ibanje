import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Edit, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/Button';
import { DataTable } from '@/components/DataTable';
import { Pagination } from '@/components/Pagination';
import { RowDetailPanel, type RowDetailField } from '@/components/RowDetailPanel';
import StatusBadge from '@/components/StatusBadge';
import { formatDate, formatMoney, ENTRY_STATUS_FILTER_OPTIONS } from '../entries-utils';
import { useExpenseReport } from './useReports';
import type { ExpenseReportRow } from './schema';

export interface ExpenseRowActions {
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (id: number) => void;
  onDelete: (row: ExpenseReportRow) => void;
}

interface Props {
  month: string;
  mode?: 'full' | 'embedded';
  rowActions?: ExpenseRowActions;
}

export function ExpenseReportTab({ month, mode = 'full', rowActions }: Props) {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string | undefined>>({});
  const [detail, setDetail] = useState<ExpenseReportRow | null>(null);
  const limit = mode === 'embedded' ? 15 : 30;
  const { data, isLoading } = useExpenseReport(month, page, limit, filters);
  const isEmbedded = mode === 'embedded';

  const rows = data?.data ?? [];

  const columns: ColumnDef<ExpenseReportRow, unknown>[] = [
    {
      id: 'date',
      header: 'Data',
      cell: (info) => <span className="tabular-nums">{formatDate(info.row.original.date)}</span>,
      meta: {}
    },
    {
      id: 'group',
      header: 'Grupo',
      cell: (info) => info.row.original.parentCategoryName ?? '—',
      meta: { hideBelow: 'xl' }
    },
    {
      id: 'category',
      header: 'Categoria',
      cell: (info) => info.row.original.categoryName,
      meta: { className: 'w-full' }
    },
    {
      id: 'notes',
      header: 'Observações',
      cell: (info) => (
        <span
          title={info.row.original.notes ?? undefined}
          className="block max-w-full truncate text-muted-foreground">
          {info.row.original.notes ?? '—'}
        </span>
      ),
      meta: { hideBelow: 'lg', className: 'max-w-64' }
    },
    {
      id: 'designatedFund',
      header: 'Campanha',
      cell: (info) => info.row.original.fundName ?? '—',
      meta: { hideBelow: '2xl' }
    },
    {
      id: 'sponsor',
      header: 'Patrocinador',
      cell: (info) => info.row.original.attenderName ?? '—',
      meta: { hideBelow: '2xl' }
    },
    {
      id: 'amount',
      header: 'Valor',
      cell: (info) => (
        <span className="font-mono tabular-nums">R$ {formatMoney(info.row.original.amount)}</span>
      ),
      meta: { align: 'right' }
    },
    {
      id: 'paymentMethod',
      header: 'Forma de Pag.',
      cell: (info) => info.row.original.paymentMethodName,
      meta: { hideBelow: 'xl' }
    },
    {
      id: 'installment',
      header: 'Parcela',
      cell: (info) =>
        info.row.original.totalInstallments > 1
          ? `${info.row.original.installment}/${info.row.original.totalInstallments}`
          : '—',
      meta: { hideBelow: '2xl', align: 'center' }
    },
    {
      id: 'status',
      header: 'Status',
      cell: (info) => <StatusBadge status={info.row.original.status} />,
      meta: { hideBelow: 'lg', filter: { options: ENTRY_STATUS_FILTER_OPTIONS } }
    }
  ];

  if (rowActions) {
    const { canEdit, canDelete, onEdit, onDelete } = rowActions;
    columns.push({
      id: 'actions',
      header: 'Ações',
      cell: (info) => {
        const row = info.row.original;
        return (
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDetail(row)}
              title="Ver detalhes"
              aria-label="Ver detalhes">
              <Eye size={16} />
            </Button>
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(row.id)}
                title="Editar"
                aria-label="Editar">
                <Edit size={16} />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(row)}
                title="Remover"
                aria-label="Remover">
                <Trash2 size={16} />
              </Button>
            )}
          </div>
        );
      },
      meta: { align: 'right', canHide: false }
    });
  }

  const renderMobileRow = (row: ExpenseReportRow) => (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm tabular-nums text-muted-foreground">{formatDate(row.date)}</span>
        <span className="font-mono tabular-nums font-semibold">R$ {formatMoney(row.amount)}</span>
      </div>
      <div className="text-sm font-medium">{row.categoryName}</div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        {row.parentCategoryName && <span>{row.parentCategoryName}</span>}
        {row.parentCategoryName && <span aria-hidden>•</span>}
        <span>{row.paymentMethodName}</span>
        {row.totalInstallments > 1 && (
          <>
            <span aria-hidden>•</span>
            <span className="tabular-nums">
              {row.installment}/{row.totalInstallments}
            </span>
          </>
        )}
      </div>
      {row.notes && (
        <p className="text-xs text-muted-foreground line-clamp-1" title={row.notes}>
          {row.notes}
        </p>
      )}
      <div className="mt-1">
        <StatusBadge status={row.status} />
      </div>
    </div>
  );

  const buildDetailFields = (row: ExpenseReportRow): RowDetailField[] => [
    { label: 'Data', value: formatDate(row.date) },
    { label: 'Grupo', value: row.parentCategoryName ?? '—', hideEmpty: true },
    { label: 'Categoria', value: row.categoryName },
    { label: 'Observações', value: row.notes ?? '—', hideEmpty: true },
    { label: 'Campanha', value: row.fundName ?? '—', hideEmpty: true },
    { label: 'Patrocinador', value: row.attenderName ?? '—', hideEmpty: true },
    {
      label: 'Valor',
      value: (
        <span className="font-mono tabular-nums font-semibold">R$ {formatMoney(row.amount)}</span>
      )
    },
    { label: 'Forma de Pag.', value: row.paymentMethodName },
    {
      label: 'Parcela',
      value: row.totalInstallments > 1 ? `${row.installment}/${row.totalInstallments}` : '—',
      hideEmpty: true
    },
    { label: 'Status', value: <StatusBadge status={row.status} /> },
    {
      label: 'Comprovante',
      value: row.hasReceipt ? (
        <a
          target="_blank"
          rel="noopener noreferrer"
          href={`${import.meta.env.VITE_API_URL || '/api'}/expense-entries/${row.id}/receipt`}
          className="text-primary hover:text-primary-soft inline-flex">
          Ver
        </a>
      ) : (
        '—'
      ),
      hideEmpty: true
    }
  ];

  return (
    <>
      {data && (
        <div className="pointer-events-none absolute top-3 right-4 hidden h-9 items-center text-sm md:flex">
          <span className="text-muted-foreground">Total:&nbsp;</span>
          <span className="font-mono font-semibold tabular-nums text-money-out">
            R$ {formatMoney(data.totalExpenses)}
          </span>
        </div>
      )}
      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        emptyMessage="Nenhum registro encontrado."
        getRowKey={(row) => row.id}
        mobileRow={renderMobileRow}
        mobileOnRowClick={setDetail}
        searchable={isEmbedded ? false : { placeholder: 'Buscar saídas...' }}
        columnToggle
        tableId={isEmbedded ? 'expense-report-embedded' : 'expense-report'}
        filters={filters}
        onFilterChange={(columnId, value) => {
          setFilters((prev) => ({ ...prev, [columnId]: value }));
          setPage(1);
        }}
      />
      {data && (
        <div className="flex justify-end border-t px-4 py-2">
          <Pagination currentPage={page} totalPages={data.totalPages} onPageChange={setPage} />
        </div>
      )}
      <RowDetailPanel
        open={detail !== null}
        onOpenChange={(open) => !open && setDetail(null)}
        title="Detalhes da saída"
        fields={detail ? buildDetailFields(detail) : []}
        actions={
          detail && rowActions && (rowActions.canEdit || rowActions.canDelete) ? (
            <div className="flex justify-end gap-2">
              {rowActions.canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const row = detail;
                    setDetail(null);
                    rowActions.onEdit(row.id);
                  }}>
                  <Edit size={16} className="mr-1" />
                  Editar
                </Button>
              )}
              {rowActions.canDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    const row = detail;
                    setDetail(null);
                    rowActions.onDelete(row);
                  }}>
                  <Trash2 size={16} className="mr-1" />
                  Remover
                </Button>
              )}
            </div>
          ) : undefined
        }
      />
    </>
  );
}
