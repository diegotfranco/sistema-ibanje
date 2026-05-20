import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/DataTable';
import { Pagination } from '@/components/Pagination';
import { formatDate, formatMoney } from '../entries-utils';
import { useIncomeReport } from './useReports';
import type { IncomeReportRow } from './schema';

interface Props {
  month: string;
}

export function IncomeReportTab({ month }: Props) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useIncomeReport(month, page);

  const rows = data?.data ?? [];

  const columns: ColumnDef<IncomeReportRow, unknown>[] = [
    {
      id: 'date',
      header: 'Data',
      cell: (info) => (
        <span className="tabular-nums">{formatDate(info.row.original.referenceDate)}</span>
      )
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
      id: 'total',
      header: 'Total',
      cell: (info) => (
        <span className="font-mono tabular-nums">R$ {formatMoney(info.row.original.total)}</span>
      ),
      meta: { align: 'right' }
    }
  ];

  return (
    <>
      {data && (
        <div className="pointer-events-none absolute top-3 right-4 hidden h-9 items-center text-sm md:flex">
          <span className="text-muted-foreground">Total:&nbsp;</span>
          <span className="font-mono font-semibold tabular-nums text-money-in">
            R$ {formatMoney(data.totalIncome)}
          </span>
        </div>
      )}
      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        emptyMessage="Nenhum registro encontrado."
        getRowKey={(row) => `${row.referenceDate}-${row.categoryId}-${row.fundId ?? 'none'}`}
      />
      {data && (
        <div className="flex justify-end border-t px-4 py-2">
          <Pagination currentPage={page} totalPages={data.totalPages} onPageChange={setPage} />
        </div>
      )}
    </>
  );
}
