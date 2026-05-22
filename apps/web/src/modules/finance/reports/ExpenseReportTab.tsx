import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/DataTable';
import { Pagination } from '@/components/Pagination';
import { MobileRowDetailSheet, type RowDetailField } from '@/components/MobileRowDetailSheet';
import StatusBadge from '@/components/StatusBadge';
import { formatDate, formatMoney } from '../entries-utils';
import { useExpenseReport } from './useReports';
import type { ExpenseReportRow } from './schema';

interface Props {
  month: string;
}

export function ExpenseReportTab({ month }: Props) {
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<ExpenseReportRow | null>(null);
  const { data, isLoading } = useExpenseReport(month, page);

  const rows = data?.data ?? [];

  const columns: ColumnDef<ExpenseReportRow, unknown>[] = [
    {
      id: 'date',
      header: 'Data',
      cell: (info) => (
        <span className="tabular-nums">{formatDate(info.row.original.referenceDate)}</span>
      )
    },
    {
      id: 'description',
      header: 'Descrição',
      cell: (info) => (
        <span
          title={info.row.original.description}
          className="block max-w-full truncate text-muted-foreground">
          {info.row.original.description}
        </span>
      ),
      meta: { className: 'max-w-64' }
    },
    {
      id: 'category',
      header: 'Categoria',
      cell: (info) => info.row.original.categoryName,
      meta: { className: 'w-full' }
    },
    {
      id: 'group',
      header: 'Grupo',
      cell: (info) => info.row.original.parentCategoryName ?? '—',
      meta: { hideBelow: 'lg' }
    },
    {
      id: 'fund',
      header: 'Fundo',
      cell: (info) => info.row.original.fundName ?? '—',
      meta: { hideBelow: 'xl' }
    },
    {
      id: 'status',
      header: 'Status',
      cell: (info) => <StatusBadge status={info.row.original.status} />,
      meta: { hideBelow: 'md' }
    },
    {
      id: 'amount',
      header: 'Valor',
      cell: (info) => (
        <span className="font-mono tabular-nums">R$ {formatMoney(info.row.original.amount)}</span>
      ),
      meta: { align: 'right' }
    }
  ];

  const renderMobileRow = (row: ExpenseReportRow) => (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm tabular-nums text-muted-foreground">
          {formatDate(row.referenceDate)}
        </span>
        <span className="font-mono tabular-nums font-semibold text-money-out">
          R$ {formatMoney(row.amount)}
        </span>
      </div>
      <div className="text-sm font-medium">{row.categoryName}</div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        {row.parentCategoryName && <span>{row.parentCategoryName}</span>}
        {row.fundName && (
          <>
            <span aria-hidden>•</span>
            <span>{row.fundName}</span>
          </>
        )}
      </div>
      {row.description && (
        <p className="text-xs text-muted-foreground line-clamp-2" title={row.description}>
          {row.description}
        </p>
      )}
      <div className="flex items-center justify-between gap-2 mt-1">
        <span />
        <StatusBadge status={row.status} />
      </div>
    </div>
  );

  const buildDetailFields = (row: ExpenseReportRow): RowDetailField[] => [
    { label: 'Data', value: formatDate(row.referenceDate) },
    { label: 'Categoria', value: row.categoryName },
    { label: 'Grupo', value: row.parentCategoryName ?? '—', hideEmpty: true },
    { label: 'Fundo', value: row.fundName ?? '—', hideEmpty: true },
    {
      label: 'Valor',
      value: (
        <span className="font-mono tabular-nums font-semibold text-money-out">
          R$ {formatMoney(row.amount)}
        </span>
      )
    },
    { label: 'Descrição', value: row.description ?? '—', hideEmpty: true },
    { label: 'Status', value: <StatusBadge status={row.status} /> }
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
      />
      {data && (
        <div className="flex justify-end border-t px-4 py-2">
          <Pagination currentPage={page} totalPages={data.totalPages} onPageChange={setPage} />
        </div>
      )}
      <MobileRowDetailSheet
        open={detail !== null}
        onOpenChange={(open) => !open && setDetail(null)}
        title="Detalhes da saída"
        fields={detail ? buildDetailFields(detail) : []}
      />
    </>
  );
}
