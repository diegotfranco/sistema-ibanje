import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/DataTable';
import { Pagination } from '@/components/Pagination';
import { formatDate, formatMoney } from '../entries-utils';
import { useExpenseReport } from './useReports';
import type { ExpenseReportRow } from './schema';

interface Props {
  month: string;
}

export function ExpenseReportTab({ month }: Props) {
  const [page, setPage] = useState(1);
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
      id: 'amount',
      header: 'Valor',
      cell: (info) => (
        <span className="font-mono tabular-nums">R$ {formatMoney(info.row.original.amount)}</span>
      ),
      meta: { align: 'right' }
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
      />
      {data && (
        <div className="flex justify-end border-t px-4 py-2">
          <Pagination currentPage={page} totalPages={data.totalPages} onPageChange={setPage} />
        </div>
      )}
    </>
  );
}
