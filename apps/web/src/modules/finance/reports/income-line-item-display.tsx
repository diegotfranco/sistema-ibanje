import type { ReactNode } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { type RowDetailField } from '@/components/MobileRowDetailSheet';
import StatusBadge from '@/components/StatusBadge';
import { formatDate, formatMoney } from '../entries-utils';
import type { IncomeReportRow } from './schema';

export const incomeLineItemColumns: ColumnDef<IncomeReportRow, unknown>[] = [
  {
    id: 'depositDate',
    header: 'Data Depósito',
    cell: (info) => (
      <span className="tabular-nums">
        {info.row.original.depositDate ? formatDate(info.row.original.depositDate) : '—'}
      </span>
    )
  },
  {
    id: 'referenceDate',
    header: 'Data Ref.',
    cell: (info) => (
      <span className="tabular-nums text-muted-foreground">
        {formatDate(info.row.original.referenceDate)}
      </span>
    ),
    meta: { hideBelow: 'md' }
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
    id: 'sponsor',
    header: 'Patrocinador',
    cell: (info) => info.row.original.attenderName ?? '—',
    meta: { hideBelow: 'xl' }
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
  }
];

export function renderIncomeLineItemMobile(row: IncomeReportRow): ReactNode {
  const showRefLine = row.depositDate !== null;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm tabular-nums text-muted-foreground">
          {row.depositDate ? formatDate(row.depositDate) : formatDate(row.referenceDate)}
        </span>
        <span className="font-mono tabular-nums font-semibold text-money-in">
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
        <span aria-hidden>•</span>
        <span>{row.paymentMethodName}</span>
      </div>
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground tabular-nums">
        {showRefLine ? <span>Ref.: {formatDate(row.referenceDate)}</span> : <span />}
        <StatusBadge status={row.status} />
      </div>
    </div>
  );
}

export function buildIncomeLineItemFields(row: IncomeReportRow): RowDetailField[] {
  return [
    {
      label: 'Data do depósito',
      value: row.depositDate ? formatDate(row.depositDate) : '—',
      hideEmpty: true
    },
    { label: 'Data de referência', value: formatDate(row.referenceDate) },
    { label: 'Categoria', value: row.categoryName },
    { label: 'Grupo', value: row.parentCategoryName ?? '—', hideEmpty: true },
    { label: 'Fundo', value: row.fundName ?? '—', hideEmpty: true },
    { label: 'Patrocinador', value: row.attenderName ?? '—', hideEmpty: true },
    { label: 'Forma de Pag.', value: row.paymentMethodName },
    {
      label: 'Valor',
      value: (
        <span className="font-mono tabular-nums font-semibold text-money-in">
          R$ {formatMoney(row.amount)}
        </span>
      )
    },
    { label: 'Observações', value: row.notes ?? '—', hideEmpty: true },
    { label: 'Status', value: <StatusBadge status={row.status} /> }
  ];
}
