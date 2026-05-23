import type { ReactNode } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { type RowDetailField } from '@/components/MobileRowDetailSheet';
import StatusBadge from '@/components/StatusBadge';
import { formatDate, formatMoney } from '../entries-utils';
import type { IncomeReportRow } from './schema';

export const incomeLineItemColumns: ColumnDef<IncomeReportRow, unknown>[] = [
  {
    id: 'depositDate',
    header: 'Data Dep.',
    cell: (info) => (
      <span className="tabular-nums">{formatDate(info.row.original.depositDate)}</span>
    ),
    meta: { hideBelow: 'md' }
  },
  {
    id: 'referenceDate',
    header: 'Data Ref.',
    cell: (info) => (
      <span className="tabular-nums">{formatDate(info.row.original.referenceDate)}</span>
    )
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
    id: 'attender',
    header: 'Congregado',
    cell: (info) => info.row.original.attenderName ?? '—',
    meta: { hideBelow: 'xl' }
  },
  {
    id: 'amount',
    header: 'Valor',
    cell: (info) => (
      <span className="font-mono tabular-nums text-money-in">
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
    id: 'status',
    header: 'Status',
    cell: (info) => <StatusBadge status={info.row.original.status} />,
    meta: { hideBelow: 'md' }
  }
];

export function renderIncomeLineItemMobile(row: IncomeReportRow): ReactNode {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm tabular-nums text-muted-foreground">
          {formatDate(row.depositDate)} - {formatDate(row.referenceDate)}
        </span>
        <span className="font-mono tabular-nums font-semibold text-money-in">
          R$ {formatMoney(row.amount)}
        </span>
      </div>
      <div className="text-sm font-medium">{row.categoryName}</div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        {row.parentCategoryName && <span>{row.parentCategoryName}</span>}
        {row.parentCategoryName && <span aria-hidden>•</span>}
        <span>{row.paymentMethodName}</span>
        {row.attenderName && (
          <>
            <span aria-hidden>•</span>
            <span>{row.attenderName}</span>
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
}

export function buildIncomeLineItemFields(row: IncomeReportRow): RowDetailField[] {
  return [
    { label: 'Data Dep.', value: formatDate(row.depositDate) },
    { label: 'Data Ref.', value: formatDate(row.referenceDate) },
    { label: 'Grupo', value: row.parentCategoryName ?? '—', hideEmpty: true },
    { label: 'Categoria', value: row.categoryName },
    { label: 'Observações', value: row.notes ?? '—', hideEmpty: true },
    { label: 'Campanha', value: row.fundName ?? '—', hideEmpty: true },
    { label: 'Congregado', value: row.attenderName ?? '—', hideEmpty: true },
    {
      label: 'Valor',
      value: (
        <span className="font-mono tabular-nums font-semibold text-money-in">
          R$ {formatMoney(row.amount)}
        </span>
      )
    },
    { label: 'Forma de Pag.', value: row.paymentMethodName },
    { label: 'Status', value: <StatusBadge status={row.status} /> }
  ];
}
