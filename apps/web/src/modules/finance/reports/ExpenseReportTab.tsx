import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Receipt } from 'lucide-react';
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
      cell: (info) => <span className="tabular-nums">{formatDate(info.row.original.date)}</span>,
      meta: {}
    },
    {
      id: 'group',
      header: 'Grupo',
      cell: (info) => info.row.original.parentCategoryName ?? '—',
      meta: { hideBelow: 'lg' }
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
      meta: { hideBelow: 'md', className: 'max-w-64' }
    },
    {
      id: 'designatedFund',
      header: 'Campanha',
      cell: (info) => info.row.original.fundName ?? '—',
      meta: { hideBelow: 'xl' }
    },
    {
      id: 'sponsor',
      header: 'Patrocinador',
      cell: (info) => info.row.original.attenderName ?? '—',
      meta: { hideBelow: 'xl' }
    },
    {
      id: 'amount',
      header: 'Valor',
      cell: (info) => (
        <span className="font-mono tabular-nums text-money-out">
          R$ {formatMoney(info.row.original.amount)}
        </span>
      ),
      meta: { align: 'right' }
    },
    {
      id: 'paymentMethod',
      header: 'Forma de Pag.',
      cell: (info) => info.row.original.paymentMethodName,
      meta: { hideBelow: 'lg' }
    },
    {
      id: 'installment',
      header: 'Parcela',
      cell: (info) =>
        info.row.original.totalInstallments > 1
          ? `${info.row.original.installment}/${info.row.original.totalInstallments}`
          : '—',
      meta: { hideBelow: 'lg', align: 'center' }
    },
    {
      id: 'status',
      header: 'Status',
      cell: (info) => <StatusBadge status={info.row.original.status} />,
      meta: { hideBelow: 'md' }
    },
    {
      id: 'receipt',
      header: 'Comprovante',
      cell: (info) => {
        const row = info.row.original;
        return (
          <div className="flex justify-center">
            {row.hasReceipt ? (
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={`${import.meta.env.VITE_API_URL || '/api'}/expense-entries/${row.id}/receipt`}
                title="Ver comprovante"
                aria-label="Ver comprovante"
                className="text-primary hover:text-primary-soft inline-flex">
                <Receipt size={16} />
              </a>
            ) : (
              <span
                role="img"
                aria-label="Sem comprovante"
                title="Sem comprovante"
                className="text-muted-foreground/40 inline-flex">
                <Receipt size={16} />
              </span>
            )}
          </div>
        );
      },
      meta: { hideBelow: 'xl', align: 'center' }
    }
  ];

  const renderMobileRow = (row: ExpenseReportRow) => (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm tabular-nums text-muted-foreground">{formatDate(row.date)}</span>
        <span className="font-mono tabular-nums font-semibold text-money-out">
          R$ {formatMoney(row.amount)}
        </span>
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
      {row.description && (
        <p className="text-xs text-muted-foreground line-clamp-1" title={row.description}>
          {row.description}
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
    { label: 'Descrição', value: row.description },
    { label: 'Observações', value: row.notes ?? '—', hideEmpty: true },
    { label: 'Campanha', value: row.fundName ?? '—', hideEmpty: true },
    { label: 'Patrocinador', value: row.attenderName ?? '—', hideEmpty: true },
    {
      label: 'Valor',
      value: (
        <span className="font-mono tabular-nums font-semibold text-money-out">
          R$ {formatMoney(row.amount)}
        </span>
      )
    },
    { label: 'Forma de Pag.', value: row.paymentMethodName },
    {
      label: 'Parcela',
      value: row.totalInstallments > 1 ? `${row.installment}/${row.totalInstallments}` : '—',
      hideEmpty: true
    },
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
